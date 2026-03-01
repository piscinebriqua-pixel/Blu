import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Calendar,
    CheckCircle2,
    Clock,
    History as HistoryIcon,
    TrendingUp,
    Wallet,
    Phone,
    Mail,
    User,
    Edit3,
    Trash2
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { toast } from 'react-hot-toast';
import TechnicianModal from '../components/TechnicianModal';
import ConfirmModal from '../components/ConfirmModal';

interface Technician {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    active: boolean;
}

const TechnicianDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [technician, setTechnician] = useState<Technician | null>(null);
    const [interventions, setInterventions] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTechnicianData();
        }
    }, [id]);

    const fetchTechnicianData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Technician Identity
            const { data: techData } = await supabase
                .from('technicians')
                .select('*')
                .eq('id', id)
                .single();
            setTechnician(techData);

            // 2. Fetch Interventions (Completed & Scheduled)
            const { data: interData } = await supabase
                .from('interventions')
                .select(`
                    *,
                    pool:pools(
                        name,
                        client:clients(first_name, last_name, city)
                    )
                `)
                .eq('technician_id', id)
                .order('scheduled_date', { ascending: false });
            setInterventions(interData || []);

            // 3. Fetch Payments collected by this technician
            const { data: payData } = await supabase
                .from('payments')
                .select(`
                    *,
                    client:clients(first_name, last_name)
                `)
                .eq('technician_id', id)
                .order('payment_date', { ascending: false });
            setPayments(payData || []);

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent, data: any) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('technicians')
                .update({ full_name: data.full_name, phone: data.phone, email: data.email, active: data.active })
                .eq('id', id);

            if (error) throw error;
            toast.success('Technicien modifié avec succès');
            setIsEditModalOpen(false);
            fetchTechnicianData();
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la modification');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('technicians')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Technicien supprimé avec succès');
            // We use window.location.href or navigate back to the list. 
            // We need to import useNavigate but actually we could just use window.history.back() or similar.
            // Let's rely on browser history or just window.location.href.
            window.location.href = '/technicians';
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la suppression. Le technicien est peut-être lié à des interventions.');
        } finally {
            setActionLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title="Chargement..." subtitle="Veuillez patienter" showBackButton={true}>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </PageLayout>
        );
    }

    if (!technician) {
        return (
            <PageLayout title="Erreur" subtitle="Technicien introuvable" showBackButton={true}>
                <div className="text-center py-20 px-6">
                    <p className="text-slate-500">Désolé, nous n'avons pas pu trouver les informations de ce technicien.</p>
                </div>
            </PageLayout>
        );
    }

    const completedInters = interventions.filter(i => i.status === 'completed');
    const scheduledInters = interventions.filter(i => i.status === 'scheduled');
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const toolbar = (
        <div className="flex gap-2">
            <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 hover:bg-white flex items-center justify-center transition-all"
                title="Modifier le technicien"
            >
                <Edit3 size={18} />
            </button>
            <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-white flex items-center justify-center transition-all"
                title="Supprimer le technicien"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );

    return (
        <PageLayout
            title={technician.full_name}
            subtitle={technician.active ? "Technicien Actif" : "Technicien Inactif"}
            showBackButton={true}
            toolbar={toolbar}
        >
            <div className="flex flex-col gap-6 pb-24">
                {/* Dashboard Stats - BENTO STYLE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Interventions Réalisées */}
                    <div className="card-bento grad-blue text-white p-6 border-none shadow-xl shadow-blue-500/10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Interventions</span>
                            <CheckCircle2 size={24} className="opacity-40" />
                        </div>
                        <h3 className="text-5xl font-black tracking-tighter mb-1">{completedInters.length}</h3>
                        <p className="text-[12px] font-black uppercase tracking-widest opacity-70">Réalisées au total</p>
                    </div>

                    {/* Entretiens Planifiés */}
                    <div className="card-bento grad-indigo text-white p-6 border-none shadow-xl shadow-indigo-500/10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Planning</span>
                            <Calendar size={24} className="opacity-40" />
                        </div>
                        <h3 className="text-5xl font-black tracking-tighter mb-1">{scheduledInters.length}</h3>
                        <p className="text-[12px] font-black uppercase tracking-widest opacity-70">En attente / Prévus</p>
                    </div>

                    {/* Paiements Reçus */}
                    <div className="card-bento grad-emerald text-white p-6 border-none shadow-xl shadow-emerald-500/10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Encaissements</span>
                            <Wallet size={24} className="opacity-40" />
                        </div>
                        <h3 className="text-5xl font-black tracking-tighter mb-1">
                            {totalPayments.toLocaleString()} <span className="text-xl">DT</span>
                        </h3>
                        <p className="text-[12px] font-black uppercase tracking-widest opacity-70">Total collecté</p>
                    </div>
                </div>

                {/* Identity & Contact Detail */}
                <div className="card-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User size={14} /> Informations Personnelles
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Téléphone</p>
                                <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">{technician.phone || 'Non renseigné'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email (Login)</p>
                                <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">{technician.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Activity Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Interventions & Planning */}
                    <div className="flex flex-col gap-6">
                        <div className="card-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={16} /> Activité Récente
                                </h4>
                                <TrendingUp size={16} className="text-slate-300" />
                            </div>

                            <div className="space-y-4">
                                {interventions.length > 0 ? interventions.slice(0, 10).map((i) => (
                                    <div key={i.id} className="flex items-center gap-4 group">
                                        <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${i.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-[14px] font-black text-slate-800 dark:text-white uppercase truncate">
                                                    {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                                </h5>
                                                <span className="text-[12px] font-bold text-slate-400">
                                                    {new Date(i.visit_date || i.scheduled_date || i.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">
                                                {i.pool?.name || 'Bassin'} • {i.status === 'completed' ? 'Terminé' : 'Planifié'}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center opacity-30">
                                        <HistoryIcon size={32} className="mx-auto mb-2" />
                                        <p className="text-[13px] font-black uppercase tracking-widest">Aucune activité</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Payments collected */}
                    <div className="flex flex-col gap-6">
                        <div className="card-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Wallet size={16} /> Paiements Encaissés
                                </h4>
                            </div>

                            <div className="space-y-4">
                                {payments.length > 0 ? payments.slice(0, 10).map((p) => (
                                    <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-black text-slate-800 dark:text-white uppercase truncate">
                                                {p.client?.first_name} {p.client?.last_name}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                                                {new Date(p.payment_date).toLocaleDateString('fr-FR')} • {p.method}
                                            </span>
                                        </div>
                                        <span className="text-lg font-black text-emerald-600">
                                            +{p.amount} <span className="text-xs">DT</span>
                                        </span>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center opacity-30">
                                        <Wallet size={32} className="mx-auto mb-2" />
                                        <p className="text-[13px] font-black uppercase tracking-widest">Aucun encaissement</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isEditModalOpen && (
                <TechnicianModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={handleEditSubmit}
                    technician={technician}
                    loading={actionLoading}
                />
            )}

            {isDeleteModalOpen && (
                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    title="Supprimer le technicien"
                    message={`Êtes-vous sûr de vouloir supprimer le technicien ${technician.full_name} ?`}
                    onConfirm={handleDelete}
                    onClose={() => setIsDeleteModalOpen(false)}
                    confirmLabel="Supprimer"
                    variant="danger"
                />
            )}
        </PageLayout>
    );
};

export default TechnicianDetail;
