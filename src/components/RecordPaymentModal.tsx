import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, User, CheckCircle2, Calendar } from 'lucide-react';
import ModalLayout from './ModalLayout';
import { toast } from 'react-hot-toast';

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
            const { data } = await supabase.from('technicians').select('*').order('full_name');
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
                // If editing, diff = new - old
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
            // ------------------------------------

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
        <ModalLayout title={payment ? "Modifier le Paiement" : "Enregistrer un Paiement"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Montant (DT)</label>
                    <div className="relative">
                        <Wallet size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                        <input
                            type="number"
                            required
                            className="search-input !pl-12 !h-14 text-xl font-black"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Date du Paiement</label>
                    <div className="relative">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            required
                            title="Date du paiement"
                            className="search-input !pl-12 !h-12"
                            value={formData.payment_date}
                            onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Mode de Paiement</label>
                    <select
                        className="search-input !h-12"
                        value={formData.method}
                        onChange={e => setFormData({ ...formData, method: e.target.value })}
                        title="Mode de paiement"
                    >
                        <option value="espèces">Espèces</option>
                        <option value="chèque">Chèque</option>
                        <option value="virement">Virement</option>
                        <option value="autre">Autre</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Technicien Responsable</label>
                    <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            required
                            className="search-input !pl-12 !h-12"
                            value={formData.technician_id}
                            onChange={e => setFormData({ ...formData, technician_id: e.target.value })}
                            title="Technicien responsable"
                        >
                            <option value="">Sélectionner un technicien</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Notes</label>
                    <textarea
                        className="search-input !h-24 !py-3 resize-none"
                        placeholder="Ex: Chèque n°12345..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl uppercase tracking-widest text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] btn-flow btn-primary !h-14 shadow-xl shadow-blue-500/20"
                    >
                        {loading ? 'Enregistrement...' : (
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 size={20} />
                                <span className="font-black uppercase tracking-widest">Valider</span>
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </ModalLayout>
    );
};

export default RecordPaymentModal;
