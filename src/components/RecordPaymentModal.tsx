import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, User, CheckCircle2, Calendar, CreditCard, ChevronDown } from 'lucide-react';
import ModalLayout from './ModalLayout';
import { toast } from 'react-hot-toast';
import { recalculateVentilation } from '../lib/paymentService';

interface RecordPaymentModalProps {
    clientId: string;
    onClose: () => void;
    onSuccess: () => void;
    payment?: {
        id: string;
        amount: number;
        method: string;
        technician_id: string;
        notes: string;
        payment_date?: string;
    };
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ clientId, onClose, onSuccess, payment }) => {
    const [loading, setLoading] = useState(false);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        amount: payment?.amount.toString() || '',
        method: payment?.method || 'espèces',
        technician_id: payment?.technician_id || '',
        notes: payment?.notes || '',
        payment_date: payment?.payment_date
            ? payment.payment_date.split('T')[0]
            : new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchTechnicians = async () => {
            const { data } = await supabase.from('technicians').select('*').eq('active', true).order('full_name');
            setTechnicians(data || []);
        };
        fetchTechnicians();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.technician_id) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        setLoading(true);
        try {
            const paymentAmount = parseFloat(formData.amount);

            if (payment) {
                // UPDATE EXISTING PAYMENT
                const { error } = await supabase.from('payments').update({
                    technician_id: formData.technician_id,
                    amount: paymentAmount,
                    method: formData.method,
                    notes: formData.notes,
                    payment_date: formData.payment_date
                }).eq('id', payment.id);

                if (error) throw error;
            } else {
                // INSERT NEW PAYMENT
                const { error } = await supabase.from('payments').insert([{
                    client_id: clientId,
                    technician_id: formData.technician_id,
                    amount: paymentAmount,
                    method: formData.method,
                    notes: formData.notes || 'Paiement direct',
                    payment_date: formData.payment_date
                }]);

                if (error) throw error;
            }

            // --- MISE À JOUR DU SOLDE CLIENT ---
            const { data: clientData, error: clientFetchError } = await supabase
                .from('clients')
                .select('balance')
                .eq('id', clientId)
                .single();

            if (clientFetchError) throw clientFetchError;

            let currentBalance = clientData?.balance || 0;
            let newBalance;

            if (payment) {
                const diff = paymentAmount - payment.amount;
                newBalance = currentBalance + diff;
            } else {
                newBalance = currentBalance + paymentAmount;
            }

            const { error: balanceUpdateError } = await supabase
                .from('clients')
                .update({ balance: newBalance })
                .eq('id', clientId);

            if (balanceUpdateError) throw balanceUpdateError;

            await recalculateVentilation(clientId);

            toast.success(payment ? 'Paiement mis à jour' : 'Paiement enregistré');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout title={payment ? "MODIFIER LE PAIEMENT" : "ENREGISTRER UN PAIEMENT"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-5">
                {/* MONTANT */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Montant (DT)</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center transition-all group-focus-within:bg-primary group-focus-within:text-white">
                            <Wallet size={18} className="text-primary group-focus-within:text-inherit" />
                        </div>
                        <input
                            type="number"
                            required
                            className="search-input !pl-14 !h-16 text-2xl font-black bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/10"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DATE */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Date du Paiement</label>
                        <div className="relative group">
                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="date"
                                required
                                title="Date du paiement"
                                className="search-input !pl-12 !h-14 text-base font-bold bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                                value={formData.payment_date}
                                onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* MODE DE PAIEMENT */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Mode de Paiement</label>
                        <div className="relative group">
                            <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <select
                                className="search-input !pl-12 pr-10 !h-14 text-base font-bold appearance-none bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                                value={formData.method}
                                onChange={e => setFormData({ ...formData, method: e.target.value })}
                                title="Mode de paiement"
                            >
                                <option value="espèces">Espèces</option>
                                <option value="chèque">Chèque</option>
                                <option value="virement">Virement</option>
                                <option value="autre">Autre</option>
                                <option value="remise">Remise / Perte (Admin)</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* TECHNICIEN */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Technicien Responsable</label>
                    <div className="relative group">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <select
                            required
                            className="search-input !pl-12 pr-10 !h-14 text-base font-bold appearance-none bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                            value={formData.technician_id}
                            onChange={e => setFormData({ ...formData, technician_id: e.target.value })}
                            title="Technicien responsable"
                        >
                            <option value="">Sélectionner un technicien</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Notes</label>
                    <textarea
                        className="search-input !h-28 !py-4 resize-none text-base font-medium bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                        placeholder="Ex: Chèque n°12345..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="flex gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[13px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] btn-flow btn-primary !h-16 shadow-2xl shadow-blue-500/30"
                    >
                        {loading ? 'Enregistrement...' : (
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 size={22} strokeWidth={2.5} />
                                <span className="font-black uppercase tracking-widest text-base">Valider</span>
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </ModalLayout>
    );
};

export default RecordPaymentModal;
