import React, { useEffect, useState, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import { supabase, type ExpenseRow, type ExpenseCategoryRow } from '../lib/supabase';
import { getExpenses, getExpenseCategories, deleteExpense } from '../services/expenseService';
import ExpenseStatsCards from '../components/expenses/ExpenseStatsCards';
import ExpenseFilterBar, { type TimeRangeFilter } from '../components/expenses/ExpenseFilterBar';
import ExpenseListTable from '../components/expenses/ExpenseListTable';
import ExpenseTechSummary from '../components/expenses/ExpenseTechSummary';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';
import ConfirmModal from '../components/ConfirmModal';
import ModalLayout from '../components/ModalLayout';
import { Plus, Download, RefreshCw, Layers, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Expenses: React.FC = () => {
    const [tab, setTab] = useState<'list' | 'techs'>('list');
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
    const [categories, setCategories] = useState<ExpenseCategoryRow[]>([]);
    const [technicians, setTechnicians] = useState<Array<{ id: string; full_name: string }>>([]);
    const [vehicles, setVehicles] = useState<Array<{ id: string; name: string; plate: string | null }>>([]);
    const [clients, setClients] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

    // Filtres
    const [timeRange, setTimeRange] = useState<TimeRangeFilter>('month');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTech, setSelectedTech] = useState('all');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');

    // Modales
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<ExpenseRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

    // Calcul des dates en fonction de timeRange
    const getDateRange = useCallback(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (timeRange === 'today') return { startDate: todayStr, endDate: todayStr };
        if (timeRange === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lundi
            return { startDate: startOfWeek.toISOString().split('T')[0], endDate: todayStr };
        }
        if (timeRange === 'month') {
            const startOfMonth = `${yyyy}-${mm}-01`;
            return { startDate: startOfMonth, endDate: todayStr };
        }
        if (timeRange === 'year') {
            return { startDate: `${yyyy}-01-01`, endDate: todayStr };
        }
        return { startDate: undefined, endDate: undefined };
    }, [timeRange]);

    const loadData = useCallback(async () => {
        setLoading(true);
        const { startDate, endDate } = getDateRange();
        const [expList, cats, techsRes, vehsRes, clientsRes] = await Promise.all([
            getExpenses({
                startDate,
                endDate,
                categoryId: selectedCategory,
                technicianId: selectedTech,
                paymentMethod: selectedPaymentMethod,
                search
            }),
            getExpenseCategories(),
            supabase.from('technicians').select('id, full_name').eq('active', true).order('full_name'),
            supabase.from('vehicles').select('id, name, plate').eq('is_active', true).order('name'),
            supabase.from('clients').select('id, first_name, last_name').order('last_name')
        ]);

        setExpenses(expList);
        setCategories(cats);
        setTechnicians(techsRes.data || []);
        setVehicles(vehsRes.data || []);
        setClients(clientsRes.data || []);
        setLoading(false);
    }, [getDateRange, selectedCategory, selectedTech, selectedPaymentMethod, search]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleConfirmDelete = async () => {
        if (!deletingExpense) return;
        setIsDeleting(true);
        const ok = await deleteExpense(deletingExpense.id);
        setIsDeleting(false);
        if (ok) {
            setExpenses(prev => prev.filter(e => e.id !== deletingExpense.id));
            setDeletingExpense(null);
        }
    };

    const handleExportCSV = () => {
        if (expenses.length === 0) return toast.error('Aucune dépense à exporter');
        const headers = ['Date', 'Catégorie', 'Fournisseur / Motif', 'Montant TTC', 'Mode Règlement', 'Technicien', 'Véhicule', 'Litres'];
        const rows = expenses.map(e => [
            e.expense_date || '',
            `"${e.category?.name || 'Général'}"`,
            `"${(e.supplier || e.description || '').replace(/"/g, '""')}"`,
            Number(e.amount).toFixed(3),
            `"${e.payment_method}"`,
            `"${e.technician?.full_name || 'Société'}"`,
            `"${e.vehicle?.name || ''}"`,
            e.liters || ''
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `depenses_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Fichier CSV généré');
    };

    return (
        <PageLayout title="DÉPENSES" subtitle="GESTION ET ANALYTIQUE DES FRAIS" showBackButton={true}>
            <div className="flex flex-col gap-5 pb-12">
                {/* 1. BARRE D'ACTIONS DU HAUT */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setTab('list')}
                            className={`min-h-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                                tab === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Layers size={16} />
                            <span>Toutes les dépenses</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('techs')}
                            className={`min-h-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                                tab === 'techs' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Users size={16} />
                            <span>Synthèse Intervenants</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadData}
                            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 shadow-sm"
                            title="Actualiser"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
                        </button>
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="min-h-[44px] px-3.5 rounded-xl flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider hover:border-slate-300 shadow-sm"
                            title="Exporter CSV"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Export Excel</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEditingExpense(null); setIsFormModalOpen(true); }}
                            className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>Nouvelle Dépense</span>
                        </button>
                    </div>
                </div>

                {/* 2. STATS GLOBALES */}
                <ExpenseStatsCards expenses={expenses} />

                {/* 3. FILTRES */}
                <ExpenseFilterBar
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    search={search}
                    onSearchChange={setSearch}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedTech={selectedTech}
                    onTechChange={setSelectedTech}
                    selectedPaymentMethod={selectedPaymentMethod}
                    onPaymentMethodChange={setSelectedPaymentMethod}
                    categories={categories}
                    technicians={technicians}
                    onResetFilters={() => {
                        setSearch('');
                        setSelectedCategory('all');
                        setSelectedTech('all');
                        setSelectedPaymentMethod('all');
                        setTimeRange('month');
                    }}
                />

                {/* 4. CONTENU PRINCIPAL (ONGLET LISTE OU SYNTHÈSE) */}
                {tab === 'list' ? (
                    <ExpenseListTable
                        expenses={expenses}
                        onEdit={(e) => { setEditingExpense(e); setIsFormModalOpen(true); }}
                        onDelete={(e) => setDeletingExpense(e)}
                        onViewReceipt={(url) => setPreviewReceiptUrl(url)}
                        onAddNew={() => { setEditingExpense(null); setIsFormModalOpen(true); }}
                    />
                ) : (
                    <ExpenseTechSummary expenses={expenses} technicians={technicians} />
                )}
            </div>

            {/* MODALE DE SAISIE / ÉDITION */}
            <ExpenseFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSaved={() => { loadData(); setIsFormModalOpen(false); }}
                initialData={editingExpense}
                categories={categories}
                technicians={technicians}
                vehicles={vehicles}
                clients={clients}
            />

            {/* CONFIRMATION DE SUPPRESSION (RÈGLE UI ALERTS MODALS) */}
            <ConfirmModal
                isOpen={Boolean(deletingExpense)}
                title="Supprimer cette dépense ?"
                message={
                    <span>
                        Voulez-vous vraiment supprimer la dépense de{' '}
                        <strong>{deletingExpense?.amount} DT</strong> pour{' '}
                        <strong>{deletingExpense?.supplier || deletingExpense?.category?.name || 'cet achat'}</strong> ?
                    </span>
                }
                onConfirm={handleConfirmDelete}
                onClose={() => setDeletingExpense(null)}
                loading={isDeleting}
                confirmLabel="Supprimer"
            />

            {/* VISIONNEUSE DE JUSTIFICATIF PLEIN ÉCRAN */}
            {previewReceiptUrl && (
                <ModalLayout title="Justificatif de dépense" onClose={() => setPreviewReceiptUrl(null)} className="max-w-xl">
                    <div className="p-4 flex flex-col items-center gap-4">
                        <img src={previewReceiptUrl} alt="Reçu complet" className="max-h-[70vh] rounded-xl object-contain shadow-lg" />
                        <div className="flex items-center gap-3 w-full justify-end">
                            <a
                                href={previewReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2"
                            >
                                Ouvrir dans un nouvel onglet
                            </a>
                        </div>
                    </div>
                </ModalLayout>
            )}
        </PageLayout>
    );
};

export default Expenses;
