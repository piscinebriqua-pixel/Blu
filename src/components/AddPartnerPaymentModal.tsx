import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, User, CheckCircle2, Globe, Calendar, FileText, ChevronDown, CreditCard } from 'lucide-react';
import ModalLayout from './ModalLayout';
import { toast } from 'react-hot-toast';

interface AddPartnerPaymentModalProps {
    partnerId: string;
    partnerName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AddPartnerPaymentModal: React.FC<AddPartnerPaymentModalProps> = ({ partnerId, partnerName, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        amount: '',
        method: 'virement',
        payment_date: new Date().toISOString().split('T')[0],
        received_by: '',
        reference: '',
        notes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get current user
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setFormData(prev => ({ ...prev, received_by: session.user.id }));
                }

                // 2. Get profiles (admins and techs) to choose recipient
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .order('full_name');
                setProfiles(profileData || []);

            } catch (error) {
                console.error('Erreur initialisation:', error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.received_by) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('partner_payments').insert([{
                partner_id: partnerId,
                amount: parseFloat(formData.amount),
                payment_method: formData.method,
                payment_date: formData.payment_date,
                received_by: formData.received_by,
                reference: formData.reference,
                notes: formData.notes
            }]);

            if (error) throw error;

            toast.success('Transaction enregistrée avec succès');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout title={`TRANSACTION : ${partnerName.toUpperCase()}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-5">

                {/* MONTANT */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Montant de la Transaction (DT)</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center transition-all group-focus-within:bg-orange-500 group-focus-within:text-white">
                            <Wallet size={18} className="text-orange-500 group-focus-within:text-inherit" />
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            required
                            autoFocus
                            className="search-input !pl-14 !h-16 text-2xl font-black bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-500/10"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DATE */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Date de Paiement</label>
                        <div className="relative group">
                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="date"
                                required
                                className="search-input !pl-12 !h-14 text-base font-bold bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                                value={formData.payment_date}
                                onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                title="Date de paiement"
                            />
                        </div>
                    </div>

                    {/* MODE DE RÈGLEMENT */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Mode de Règlement</label>
                        <div className="relative group">
                            <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <select
                                className="search-input !pl-12 pr-10 !h-14 text-base font-bold appearance-none bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                                value={formData.method}
                                onChange={e => setFormData({ ...formData, method: e.target.value })}
                                title="Mode de règlement"
                            >
                                <option value="virement">Virement Bancaire</option>
                                <option value="chèque">Chèque</option>
                                <option value="espèces">Espèces</option>
                                <option value="autre">Autre</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RÉFÉRENCE */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Référence (N° Chèque/Virement)</label>
                        <div className="relative group">
                            <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                className="search-input !pl-12 !h-14 text-base font-bold bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                                placeholder="Ex: CHQ 123456..."
                                value={formData.reference}
                                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* RESPONSABLE */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Responsable (Enregistré par)</label>
                        <div className="relative group">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <select
                                required
                                className="search-input !pl-12 pr-10 !h-14 text-base font-bold appearance-none bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                                value={formData.received_by}
                                onChange={e => setFormData({ ...formData, received_by: e.target.value })}
                                title="Responsable"
                            >
                                <option value="">Choisir un membre...</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.full_name || 'Inconnu'} ({p.role.toUpperCase()})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-black uppercase text-slate-500 ml-1 tracking-wider">Commentaires / Notes</label>
                    <textarea
                        className="search-input !h-28 !py-4 resize-none text-base font-medium bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                        placeholder="Informations complémentaires..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="flex gap-4 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[13px] hover:bg-slate-200 transition-all active:scale-95"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] btn-flow btn-primary !h-16 shadow-2l shadow-blue-500/30"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Globe className="animate-spin" size={22} />
                                <span className="font-black uppercase tracking-widest text-base">Traitement...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 size={24} strokeWidth={2.5} />
                                <span className="font-black uppercase tracking-widest text-base">Valider</span>
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </ModalLayout>
    );
};

export default AddPartnerPaymentModal;
