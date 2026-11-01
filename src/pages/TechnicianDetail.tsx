import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, type ExpenseRow } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { toast } from 'react-hot-toast';
import TechnicianModal from '../components/TechnicianModal';
import ConfirmModal from '../components/ConfirmModal';
import ModalLayout from '../components/ModalLayout';
import TechnicianHeroCard, { type TechnicianInfo } from '../components/technician-detail/TechnicianHeroCard';
import TechnicianBentoKPIs from '../components/technician-detail/TechnicianBentoKPIs';
import TechnicianTabs from '../components/technician-detail/TechnicianTabs';

const TechnicianDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [technician, setTechnician] = useState<TechnicianInfo | null>(null);
    const [interventions, setInterventions] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
    const [cashBalance, setCashBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

    const fetchTechnicianData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);

            // Requêtes parallèles groupées
            const [techRes, interRes, payRes, expRes, remRes, advRes] = await Promise.all([
                supabase.from('technicians').select('*').eq('id', id).single(),
                supabase.from('interventions').select(`*, pool:pools(name, client:clients(first_name, last_name, city))`).eq('technician_id', id).order('scheduled_date', { ascending: false }),
                supabase.from('payments').select(`*, client:clients(first_name, last_name)`).eq('technician_id', id).order('payment_date', { ascending: false }),
                supabase.from('expenses').select(`*, category:expense_categories(id, name, icon)`).eq('technician_id', id).order('expense_date', { ascending: false }),
                supabase.from('remittances').select('amount').eq('technician_id', id).eq('status', 'validated'),
                supabase.from('advances').select('amount').eq('technician_id', id).eq('status', 'validated')
            ]);

            if (techRes.error) throw techRes.error;
            setTechnician(techRes.data as TechnicianInfo);

            const fetchedPayments = payRes.data || [];
            const fetchedExpenses = (expRes.data as ExpenseRow[]) || [];
            const fetchedRemittances = remRes.data || [];
            const fetchedAdvances = advRes.data || [];

            setInterventions(interRes.data || []);
            setPayments(fetchedPayments);
            setExpenses(fetchedExpenses);

            // Calcul du solde net en caisse espèces
            const cashCollected = fetchedPayments
                .filter(p => p.method === 'cash')
                .reduce((s, p) => s + Number(p.amount || 0), 0);

            const cashExpenses = fetchedExpenses
                .filter(e => e.payment_method === 'cash_technician' && e.status === 'validated')
                .reduce((s, e) => s + Number(e.amount || 0), 0);

            const totalRemittances = fetchedRemittances.reduce((s, r) => s + Number(r.amount || 0), 0);
            const totalAdvances = fetchedAdvances.reduce((s, a) => s + Number(a.amount || 0), 0);

            setCashBalance(cashCollected - cashExpenses - totalRemittances - totalAdvances);
        } catch (error: any) {
            console.error('Erreur chargement données technicien:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTechnicianData();
    }, [fetchTechnicianData]);

    const handleEditSubmit = async (e: React.FormEvent, data: any) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('technicians')
                .update({ 
                    full_name: data.full_name, 
                    phone: data.phone, 
                    email: data.email, 
                    active: data.active 
                })
                .eq('id', id);

            if (error) throw error;
            toast.success('Fiche technicien mise à jour');
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
            toast.success('Technicien supprimé');
            navigate('/technicians', { replace: true });
        } catch (error: any) {
            toast.error(error.message || 'Impossible de supprimer un technicien lié à des interventions.');
        } finally {
            setActionLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title="Chargement..." subtitle="Fiche Technicien" showBackButton={true}>
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Chargement du profil...</span>
                </div>
            </PageLayout>
        );
    }

    if (!technician) {
        return (
            <PageLayout title="Introuvable" subtitle="Fiche Technicien" showBackButton={true}>
                <div className="text-center py-20 px-6">
                    <p className="text-slate-500 text-base font-bold">Désolé, ce technicien est introuvable.</p>
                </div>
            </PageLayout>
        );
    }

    const completedCount = interventions.filter(i => i.status === 'completed').length;
    const scheduledCount = interventions.filter(i => i.status === 'scheduled').length;
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const expensesTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return (
        <PageLayout
            title={technician.full_name}
            subtitle={technician.active ? "Technicien en Service" : "Technicien Inactif"}
            showBackButton={true}
        >
            <div className="flex flex-col gap-5 pb-24">
                {/* 1. HERO HEADER IDENTITÉ & ACTIONS RAPIDES */}
                <TechnicianHeroCard
                    technician={technician}
                    onEdit={() => setIsEditModalOpen(true)}
                    onDelete={() => setIsDeleteModalOpen(true)}
                />

                {/* 2. BENTO KPIS ACTIONNABLES */}
                <TechnicianBentoKPIs
                    completedCount={completedCount}
                    scheduledCount={scheduledCount}
                    cashBalance={cashBalance}
                    totalCollected={totalCollected}
                    expensesTotal={expensesTotal}
                />

                {/* 3. SYSTÈME D'ONGLETS HAUTE DENSITÉ */}
                <TechnicianTabs
                    technician={technician}
                    interventions={interventions}
                    payments={payments}
                    expenses={expenses}
                    onViewReceipt={(url) => setPreviewReceiptUrl(url)}
                />
            </div>

            {/* MODALE D'ÉDITION */}
            {isEditModalOpen && (
                <TechnicianModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSubmit={handleEditSubmit}
                    technician={technician as any}
                    loading={actionLoading}
                />
            )}

            {/* MODALE DE SUPPRESSION SÉCURISÉE */}
            {isDeleteModalOpen && (
                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    title="Supprimer ce technicien ?"
                    message={`Êtes-vous sûr de vouloir supprimer définitivement ${technician.full_name} ?`}
                    onConfirm={handleDelete}
                    onClose={() => setIsDeleteModalOpen(false)}
                    confirmLabel="Supprimer"
                    variant="danger"
                />
            )}

            {/* APERÇU REÇU PHOTO PLEIN ÉCRAN */}
            {previewReceiptUrl && (
                <ModalLayout title="Justificatif de dépense" onClose={() => setPreviewReceiptUrl(null)} className="max-w-xl">
                    <div className="p-4 flex flex-col items-center gap-4">
                        <img src={previewReceiptUrl} alt="Reçu" className="max-h-[70vh] rounded-xl object-contain shadow-md" />
                        <a
                            href={previewReceiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[44px] px-4 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center"
                        >
                            Ouvrir l'image originale
                        </a>
                    </div>
                </ModalLayout>
            )}
        </PageLayout>
    );
};

export default TechnicianDetail;
