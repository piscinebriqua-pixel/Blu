import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Search, Phone, Mail, Building2, Trash2, Edit2, Briefcase, ChevronRight, Users, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddPartnerModal from '../components/AddPartnerModal';
import AddClientModal from '../components/AddClientModal';
import NewIntervention from '../components/NewIntervention';
import ConfirmModal from '../components/ConfirmModal';
import SpeedDial from '../components/SpeedDial';

interface Partner {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
    phone: string;
    email: string;
    role: string;
    is_billing_partner?: boolean;
}

const roleColors: Record<string, string> = {
    architecte: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
    entrepreneur: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800',
    plombier: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    electricien: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800',
    pilote: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    pisciniste: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800',
    autre: 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
};

const Partners: React.FC = () => {
    const navigate = useNavigate();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isNewInterventionOpen, setIsNewInterventionOpen] = useState(false);
    const [partnerToEdit, setPartnerToEdit] = useState<Partner | null>(null);
    const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .order('last_name', { ascending: true });

            if (error) throw error;
            setPartners(data || []);
        } catch (error: any) {
            console.error('Fetch partners error:', error);
            if (error?.message?.includes('relation "public.partners" does not exist')) {
                toast.error("Veuillez exécuter le script SQL (setup_partners.sql) dans Supabase pour créer la table.", { duration: 8000 });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!partnerToDelete) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('partners').delete().eq('id', partnerToDelete.id);
            if (error) throw error;
            toast.success("Partenaire supprimé de l'annuaire");
            fetchPartners();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
            setPartnerToDelete(null);
        }
    };

    const filteredPartners = partners.filter(p =>
        (p.first_name + ' ' + p.last_name + ' ' + p.company + ' ' + p.role).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const speedDialActions = [
        {
            icon: Briefcase,
            label: "Nouveau Partenaire",
            onClick: () => setIsAddPartnerModalOpen(true),
            color: "bg-blue-600 text-white"
        },
        {
            icon: Users,
            label: "Nouveau Client",
            onClick: () => setIsAddClientModalOpen(true),
            color: "bg-emerald-600 text-white"
        },
        {
            icon: Wrench,
            label: "Nouvelle Intervention",
            onClick: () => setIsNewInterventionOpen(true),
            color: "bg-orange-600 text-white"
        }
    ];

    const toolbar = (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, rôle..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <PageLayout
            title="Réseau & Partenaires"
            subtitle="Annuaire des intervenants externes"
            showBackButton={true}
            toolbar={toolbar}
            loading={loading}
        >
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredPartners.length > 0 ? (
                        filteredPartners.map((partner, idx) => (
                            <div
                                key={partner.id}
                                onClick={() => navigate(`/partners/${partner.id}`)}
                                className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100/50 dark:border-slate-700 flex flex-col gap-3 active:scale-[0.98] transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards ${idx < 10 ? `stagger-${idx + 1}` : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                            <Briefcase size={22} className={roleColors[partner.role]?.split(' ')[0] || ''} />
                                        </div>
                                        <div>
                                            <h3 className="text-[15px] font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">
                                                {partner.first_name || partner.last_name
                                                    ? `${partner.first_name} ${partner.last_name}`
                                                    : partner.company || 'Sans nom'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${roleColors[partner.role] || roleColors['autre']}`}>
                                                    {partner.role}
                                                </span>
                                                {partner.is_billing_partner && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800">
                                                        Tiers-Payant
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => setPartnerToEdit(partner)} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors" title="Modifier">
                                            <Edit2 size={12} />
                                        </button>
                                        <button onClick={() => setPartnerToDelete(partner)} className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors" title="Supprimer">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-1 px-1">
                                    {partner.company && (partner.first_name || partner.last_name) && (
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <Building2 size={14} className="shrink-0" />
                                            <span className="text-[12px] font-bold truncate">{partner.company}</span>
                                        </div>
                                    )}
                                    {partner.phone && (
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <Phone size={14} className="shrink-0" />
                                            <span className="text-[12px] font-bold">{partner.phone}</span>
                                        </div>
                                    )}
                                    {partner.email && (
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <Mail size={14} className="shrink-0" />
                                            <span className="text-[12px] font-bold truncate">{partner.email}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        Voir plus <ChevronRight size={12} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Briefcase size={32} className="text-slate-500" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-widest text-slate-700 dark:text-white">Aucun partenaire trouvé</h3>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Multi-Action Speed Dial */}
            <SpeedDial actions={speedDialActions} />

            {(isAddPartnerModalOpen || partnerToEdit) && (
                <AddPartnerModal
                    partner={partnerToEdit || undefined}
                    onClose={() => {
                        setIsAddPartnerModalOpen(false);
                        setPartnerToEdit(null);
                    }}
                    onSuccess={() => {
                        setIsAddPartnerModalOpen(false);
                        setPartnerToEdit(null);
                        fetchPartners();
                    }}
                />
            )}

            {isAddClientModalOpen && (
                <AddClientModal
                    onClose={() => setIsAddClientModalOpen(false)}
                    onSuccess={() => {
                        setIsAddClientModalOpen(false);
                        fetchPartners();
                    }}
                />
            )}

            {isNewInterventionOpen && (
                <NewIntervention
                    onClose={() => setIsNewInterventionOpen(false)}
                    onSuccess={() => {
                        setIsNewInterventionOpen(false);
                        fetchPartners();
                    }}
                />
            )}

            <ConfirmModal
                isOpen={!!partnerToDelete}
                title="Supprimer du répertoire"
                message={`Voulez-vous vraiment supprimer ${partnerToDelete?.first_name} ${partnerToDelete?.last_name} de votre répertoire ?`}
                confirmLabel="SUPPRIMER"
                onConfirm={handleDelete}
                onClose={() => setPartnerToDelete(null)}
                loading={isDeleting}
                variant="danger"
            />
        </PageLayout>
    );
};

export default Partners;
