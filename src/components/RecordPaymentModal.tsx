import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, User, CheckCircle2 } from 'lucide-react';
import ModalLayout from './ModalLayout';

interface RecordPaymentModalProps {
    clientId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ clientId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        amount: '',
        method: 'espèces',
        technician_id: '',
        notes: ''
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
            alert('Veuillez remplir les champs obligatoires');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('payments').insert([{
                client_id: clientId,
                technician_id: formData.technician_id,
                amount: parseFloat(formData.amount),
                method: formData.method,
                notes: formData.notes || 'Paiement direct'
            }]);

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout title="Enregistrer un Paiement" onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Montant (DT)</label>
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
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mode de Paiement</label>
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
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Technicien Responsable</label>
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
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Notes</label>
                    <textarea
                        className="search-input !h-24 !py-3 resize-none"
                        placeholder="Ex: Chèque n°12345..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-flow btn-primary !h-14 w-full shadow-xl shadow-blue-500/20"
                >
                    {loading ? 'Enregistrement...' : (
                        <div className="flex items-center justify-center gap-2">
                            <CheckCircle2 size={20} />
                            <span className="font-black uppercase tracking-widest">Valider le Paiement</span>
                        </div>
                    )}
                </button>
            </form>
        </ModalLayout>
    );
};

export default RecordPaymentModal;
