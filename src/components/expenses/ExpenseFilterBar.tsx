import React from 'react';
import { type ExpenseCategoryRow } from '../../lib/supabase';
import { Search, X } from 'lucide-react';

export type TimeRangeFilter = 'month' | 'week' | 'today' | 'year' | 'all';

interface ExpenseFilterBarProps {
    timeRange: TimeRangeFilter;
    onTimeRangeChange: (tr: TimeRangeFilter) => void;
    search: string;
    onSearchChange: (s: string) => void;
    selectedCategory: string;
    onCategoryChange: (catId: string) => void;
    selectedTech: string;
    onTechChange: (techId: string) => void;
    selectedPaymentMethod: string;
    onPaymentMethodChange: (method: string) => void;
    categories: ExpenseCategoryRow[];
    technicians: Array<{ id: string; full_name: string }>;
    onResetFilters: () => void;
}

export const ExpenseFilterBar: React.FC<ExpenseFilterBarProps> = ({
    timeRange,
    onTimeRangeChange,
    search,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    selectedTech,
    onTechChange,
    selectedPaymentMethod,
    onPaymentMethodChange,
    categories,
    technicians,
    onResetFilters
}) => {
    const isFiltered = search !== '' || selectedCategory !== 'all' || selectedTech !== 'all' || selectedPaymentMethod !== 'all' || timeRange !== 'month';

    return (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* 1. ONGLETS DE PÉRIODE */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                    { id: 'today', label: "Aujourd'hui" },
                    { id: 'week', label: 'Cette semaine' },
                    { id: 'month', label: 'Ce mois' },
                    { id: 'year', label: 'Cette année' },
                    { id: 'all', label: 'Toutes' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTimeRangeChange(tab.id as TimeRangeFilter)}
                        className={`min-h-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                            timeRange === tab.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}

                {isFiltered && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="min-h-[44px] px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase flex items-center gap-1.5 ml-auto shrink-0"
                        title="Réinitialiser les filtres"
                    >
                        <X size={16} />
                        <span>Effacer</span>
                    </button>
                )}
            </div>

            {/* 2. RECHERCHE ET SÉLECTEURS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Recherche */}
                <div className="relative flex items-center">
                    <Search size={18} className="absolute left-3.5 text-slate-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Fournisseur ou motif..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full min-h-[44px] pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Filtre Catégorie */}
                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                    <option value="all">Toutes les catégories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                {/* Filtre Technicien */}
                <select
                    value={selectedTech}
                    onChange={(e) => onTechChange(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                    <option value="all">Tous les intervenants</option>
                    <option value="company">🏢 Société (Sans technicien)</option>
                    {technicians.map((t) => (
                        <option key={t.id} value={t.id}>👤 {t.full_name}</option>
                    ))}
                </select>

                {/* Filtre Moyen de Paiement */}
                <select
                    value={selectedPaymentMethod}
                    onChange={(e) => onPaymentMethodChange(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                    <option value="all">Tous les règlements</option>
                    <option value="company_card">💳 Carte Pro</option>
                    <option value="cash_technician">💵 Caisse Technicien (Espèces)</option>
                    <option value="company_transfer">🏛️ Virement Société</option>
                    <option value="cash_company">💼 Caisse Bureau</option>
                    <option value="check">📝 Chèque</option>
                </select>
            </div>
        </div>
    );
};

export default ExpenseFilterBar;
