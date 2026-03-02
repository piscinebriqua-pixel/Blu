import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, User, CheckCircle2, Globe } from 'lucide-react';
import ModalLayout from './ModalLayout';
import Combobox from './ui/Combobox';
import { toast } from 'react-hot-toast';
import { recalculateVentilation } from '../lib/paymentService';

interface GlobalPaymentModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const GlobalPaymentModal: React.FC<GlobalPaymentModalProps> = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserTechId, setCurrentUserTechId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        amount: '',
        method: 'espèces',
        technician_id: '',
        client_id: '',
        notes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get current session and profile
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role, technician_id')
                        .eq('id', session.user.id)
                        .single();

                    if (profile?.role === 'admin') {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                        setCurrentUserTechId(profile?.technician_id);
                        setFormData(prev => ({ ...prev, technician_id: profile?.technician_id || '' }));
                    }
                }

                // 2. Get technicians
                const { data: techData } = await supabase.from('technicians').select('*').order('full_name');
                setTechnicians(techData || []);

                // 3. Get clients
                const { data: clientData } = await supabase.from('clients').select('id, first_name, last_name, city').order('last_name');
                setClients(clientData || []);

            } catch (error) {
                console.error('Erreur initialisation:', error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.technician_id || !formData.client_id) {
            toast.error('Veuillez remplir les champs obligatoires (Montant, Client, Technicien)');
            return;
        }

        setLoading(true);
        try {
            // 1. Insert Payment
            const { error } = await supabase.from('payments').insert([{
                client_id: formData.client_id,
                technician_id: formData.technician_id,
                amount: parseFloat(formData.amount),
                method: formData.method,
                notes: formData.notes || 'Paiement direct'
            }]);

            if (error) throw error;

            // 2. Update Client Balance
            const { data: clientData, error: clientFetchError } = await supabase
                .from('clients')
                .select('balance')
                .eq('id', formData.client_id)
                .single();

            if (clientFetchError) throw clientFetchError;

            const currentBalance = clientData?.balance || 0;
            const paymentAmount = parseFloat(formData.amount);
            const newBalance = currentBalance + paymentAmount;

            const { error: balanceUpdateError } = await supabase
                .from('clients')
                .update({ balance: newBalance })
                .eq('id', formData.client_id);

            if (balanceUpdateError) throw balanceUpdateError;

            // 3. Recalculate FIFO Ventilation
            await recalculateVentilation(formData.client_id);

            toast.success('Paiement enregistré avec succès');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout title="Enregistrer un Paiement" onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">

                {/* Client Selection */}
                <div className="flex flex-col gap-2">
                    <Combobox
                        label="Client"
                        icon={User}
                        options={clients.map(c => `${c.first_name} ${c.last_name} (${c.city || ''})`)}
                        value={
                            clients.find(c => c.id === formData.client_id)
                                ? `${clients.find(c => c.id === formData.client_id)?.first_name} ${clients.find(c => c.id === formData.client_id)?.last_name} (${clients.find(c => c.id === formData.client_id)?.city || ''})`
                                : ""
                        }
                        onChange={(val) => {
                            const client = clients.find(c => `${c.first_name} ${c.last_name} (${c.city || ''})` === val);
                            if (client) setFormData({ ...formData, client_id: client.id });
                        }}
                        placeholder="Rechercher un client..."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-black uppercase text-slate-500 ml-1">Montant (DT)</label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-black uppercase text-slate-500 ml-1">Mode de Paiement</label>
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
                            <option value="remise">Remise / Perte (Admin)</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-black uppercase text-slate-500 ml-1">Responsable</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <select
                                required
                                disabled={!isAdmin}
                                className={`search-input !pl-12 !h-12 ${!isAdmin ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''}`}
                                value={formData.technician_id}
                                onChange={e => setFormData({ ...formData, technician_id: e.target.value })}
                                title="Technicien responsable"
                            >
                                {!isAdmin && currentUserTechId ? (
                                    <option value={currentUserTechId}>
                                        {technicians.find(t => t.id === currentUserTechId)?.full_name || 'Chargement...'}
                                    </option>
                                ) : (
                                    <>
                                        <option value="">Sélectionner...</option>
                                        {technicians.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name}</option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-black uppercase text-slate-500 ml-1">Notes</label>
                    <textarea
                        className="search-input !h-24 !py-3 resize-none text-xs"
                        placeholder="Ex: Chèque n°12345..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 font-black rounded-2xl uppercase tracking-widest text-base hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] btn-flow btn-primary !h-14 shadow-xl shadow-blue-500/20"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Globe className="animate-spin" size={20} />
                                <span className="font-black uppercase tracking-widest">Enregistrement...</span>
                            </div>
                        ) : (
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

export default GlobalPaymentModal;
