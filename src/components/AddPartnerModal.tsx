import React, { useState } from 'react';
import ModalLayout from './ModalLayout';
import Button from './ui/Button';
import Input from './ui/Input';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { User, Briefcase, Phone, Mail, Building2, ChevronDown } from 'lucide-react';

interface Partner {
    id?: string;
    first_name: string;
    last_name: string;
    company: string;
    phone: string;
    email: string;
    role: string;
    is_billing_partner?: boolean;
}

interface AddPartnerModalProps {
    partner?: Partner;
    onClose: () => void;
    onSuccess: (newPartner?: Partner) => void;
}

const PARTNER_ROLES = [
    { value: 'architecte', label: 'Architecte' },
    { value: 'entrepreneur', label: 'Entrepreneur / Constructeur' },
    { value: 'plombier', label: 'Plombier' },
    { value: 'electricien', label: 'Électricien' },
    { value: 'pilote', label: 'Pilote de chantier' },
    { value: 'pisciniste', label: 'Pisciniste (Autre)' },
    { value: 'autre', label: 'Autre métier' }
];

const AddPartnerModal: React.FC<AddPartnerModalProps> = ({ partner, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: partner?.first_name || '',
        last_name: partner?.last_name || '',
        company: partner?.company || '',
        phone: partner?.phone || '',
        email: partner?.email || '',
        role: partner?.role || 'architecte',
        is_billing_partner: partner?.is_billing_partner || false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const hasIdentifier = formData.first_name.trim() || formData.last_name.trim() || formData.company.trim();
        if (!hasIdentifier || !formData.role) {
            toast.error('Veuillez renseigner au moins un nom, un prénom ou une entreprise, ainsi que le rôle.');
            return;
        }

        setLoading(true);
        try {
            if (partner?.id) {
                const { error } = await supabase
                    .from('partners')
                    .update(formData)
                    .eq('id', partner.id);
                if (error) throw error;
                toast.success('Partenaire mis à jour');
                onSuccess();
            } else {
                const { data, error } = await supabase
                    .from('partners')
                    .insert([formData])
                    .select()
                    .single();
                if (error) throw error;
                toast.success('Partenaire ajouté au répertoire');
                onSuccess(data);
            }
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalLayout
            title={partner?.id ? "MODIFIER LE PARTENAIRE" : "NOUVEAU PARTENAIRE"}
            onClose={onClose}
            className="max-w-xl"
            actions={
                <div className="flex gap-4 w-full">
                    <Button variant="secondary" onClick={onClose} className="flex-1 font-black text-[11px] h-14">ANNULER</Button>
                    <Button onClick={handleSubmit} loading={loading} className="flex-[2] btn-primary font-black text-[11px] h-14">
                        {partner?.id ? "ENREGISTRER" : "AJOUTER AU RÉPERTOIRE"}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Briefcase size={12} className="text-slate-500" /> Rôle / Spécialité *
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                <Briefcase size={20} />
                            </div>
                            <select
                                title="Rôle/Spécialité"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
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

                    <Input
                        label="Prénom"
                        name="first_name"
                        icon={User}
                        placeholder="Prénom"
                        value={formData.first_name}
                        onChange={handleChange}
                    />

                    <Input
                        label="Nom"
                        name="last_name"
                        icon={User}
                        placeholder="Nom de famille"
                        value={formData.last_name}
                        onChange={handleChange}
                    />

                    <Input
                        label="Entreprise / Société"
                        name="company"
                        icon={Building2}
                        placeholder="Nom de l'entreprise"
                        value={formData.company}
                        onChange={handleChange}
                    />

                    <Input
                        label="Téléphone"
                        name="phone"
                        icon={Phone}
                        placeholder="ex: 29 123 456"
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        icon={Mail}
                        placeholder="adresse@email.com"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <div className="flex items-center justify-between p-4 bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20 rounded-2xl transition-all hover:border-orange-200 dark:hover:border-orange-500/40">
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="is_billing_partner" className="text-sm font-bold text-slate-800 dark:text-white cursor-pointer">
                                Est un fournisseur principal (Tiers-Payant)
                            </label>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Prise en charge de la facturation client
                            </span>
                        </div>
                        <div
                            className={`w-10 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${formData.is_billing_partner ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            onClick={() => setFormData({ ...formData, is_billing_partner: !formData.is_billing_partner })}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${formData.is_billing_partner ? 'left-[20px]' : 'left-1'}`} />
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            id="is_billing_partner"
                            name="is_billing_partner"
                            checked={formData.is_billing_partner}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </form>
        </ModalLayout>
    );
};

export default AddPartnerModal;
