import React, { useState, useEffect } from 'react';
import ModalLayout from './ModalLayout';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { User, Briefcase, Plus, ChevronDown } from 'lucide-react';
import AddPartnerModal from './AddPartnerModal';

interface Partner {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
    role: string;
}

interface AssignPartnerModalProps {
    clientId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const PARTNER_ROLES = [
    { value: 'architect_id', label: 'Architecte' },
    { value: 'entrepreneur_id', label: 'Entrepreneur / Constructeur' },
    { value: 'plumber_id', label: 'Plombier' },
    { value: 'electrician_id', label: 'Électricien' },
    { value: 'site_manager_id', label: 'Pilote de chantier' },
    { value: 'pool_builder_id', label: 'Pisciniste' },
    { value: 'billing_partner_id', label: 'Facturation (Tiers-Payant)' }
];

const AssignPartnerModal: React.FC<AssignPartnerModalProps> = ({ clientId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [selectedRoleColumn, setSelectedRoleColumn] = useState('architect_id');
    const [selectedPartnerId, setSelectedPartnerId] = useState('');
    const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const { data, error } = await supabase.from('partners').select('*').order('last_name');
            if (error) throw error;
            setPartners(data || []);
        } catch (error: any) {
            console.error(error);
            // Ignorer l'erreur si la table n'existe pas encore
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRoleColumn || !selectedPartnerId) {
            toast.error('Veuillez sélectionner un rôle et un partenaire');
            return;
        }

        setLoading(true);
        try {
            const updates = { [selectedRoleColumn]: selectedPartnerId };
            const { error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', clientId);

            if (error) throw error;
            toast.success('Intervenant assigné au chantier');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout
            title="ASSIGNER UN INTERVENANT"
            onClose={onClose}
            className="max-w-md"
            actions={
                <div className="flex gap-4 w-full">
                    <Button variant="secondary" onClick={onClose} className="flex-1 font-black text-[11px] h-14">ANNULER</Button>
                    <Button onClick={handleSubmit} loading={loading} className="flex-[2] btn-primary font-black text-[11px] h-14" form="assign-partner-form">
                        AFFECTER AU CLIENT
                    </Button>
                </div>
            }
        >
            <form id="assign-partner-form" onSubmit={handleSubmit} className="flex flex-col gap-5 pb-10 p-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <Briefcase size={12} className="text-slate-500" /> Quel poste ?
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                            <Briefcase size={20} />
                        </div>
                        <select
                            title="Poste à pourvoir"
                            value={selectedRoleColumn}
                            onChange={(e) => setSelectedRoleColumn(e.target.value)}
                            className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-10 font-semibold text-slate-800 dark:text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                        >
                            {PARTNER_ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <User size={12} className="text-slate-500" /> Choisir le partenaire
                    </label>
                    <div className="flex gap-2">
                        <div className="relative group flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                <User size={20} />
                            </div>
                            <select
                                title="Choisir le partenaire"
                                value={selectedPartnerId}
                                onChange={(e) => setSelectedPartnerId(e.target.value)}
                                className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-10 font-semibold text-slate-800 dark:text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">-- Sélectionnez --</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.first_name} {p.last_name} {p.company ? `(${p.company})` : ''} - {p.role}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAddPartnerOpen(true)}
                            className="w-14 h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
                            title="Créer un nouveau partenaire"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </form>

            {isAddPartnerOpen && (
                <AddPartnerModal
                    onClose={() => setIsAddPartnerOpen(false)}
                    onSuccess={(newPartner) => {
                        setIsAddPartnerOpen(false);
                        fetchPartners();
                        if (newPartner?.id) {
                            setSelectedPartnerId(newPartner.id);
                        }
                    }}
                />
            )}
        </ModalLayout>
    );
};

export default AssignPartnerModal;
