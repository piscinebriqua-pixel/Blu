import React from 'react';
import { type ExpenseRow } from '../../lib/supabase';
import { Wallet, CreditCard, Banknote, Truck } from 'lucide-react';

interface ExpenseStatsCardsProps {
    expenses: ExpenseRow[];
}

export const ExpenseStatsCards: React.FC<ExpenseStatsCardsProps> = ({ expenses }) => {
    const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const count = expenses.length;

    const companyPaid = expenses
        .filter(i => i.payment_method !== 'cash_technician')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const techDeducted = expenses
        .filter(i => i.payment_method === 'cash_technician')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const vehicleTotal = expenses
        .filter(i => Boolean(i.vehicle_id) || i.category?.name?.toLowerCase().includes('carburant'))
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. TOTAL DÉPENSES */}
            <div className="card-bento p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Dépenses</span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                        <Wallet size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-bold text-slate-500 ml-1">DT</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {count} dépense{count > 1 ? 's' : ''} enregistrée{count > 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* 2. DÉCAISSÉ SOCIÉTÉ */}
            <div className="card-bento p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Règlement Société</span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                        <CreditCard size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                        {companyPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-bold text-slate-500 ml-1">DT</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Carte Pro, Virement, Bureau
                    </p>
                </div>
            </div>

            {/* 3. DÉDUIT CAISSES TECHNICIENS */}
            <div className="card-bento p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Caisses Techniciens</span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                        <Banknote size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                        {techDeducted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-bold text-slate-500 ml-1">DT</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Déduit des espèces terrain
                    </p>
                </div>
            </div>

            {/* 4. FLOTTE / CARBURANT */}
            <div className="card-bento p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Flotte & Carburant</span>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center shrink-0">
                        <Truck size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
                        {vehicleTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-bold text-slate-500 ml-1">DT</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Carburant et entretien
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExpenseStatsCards;

