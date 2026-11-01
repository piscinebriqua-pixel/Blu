import React from 'react';
import { Banknote, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface TechnicianBentoKPIsProps {
    completedCount: number;
    scheduledCount: number;
    cashBalance: number;
    totalCollected: number;
    expensesTotal: number;
}

export const TechnicianBentoKPIs: React.FC<TechnicianBentoKPIsProps> = ({
    completedCount,
    scheduledCount,
    cashBalance,
    totalCollected,
    expensesTotal
}) => {
    const isBalanceHigh = cashBalance > 100;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. ACTIVITÉ & INTERVENTIONS */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Tournée & Interventions
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {completedCount}
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1.5">réalisées</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold">
                            {scheduledCount} planifiée{scheduledCount > 1 ? 's' : ''}
                        </span>
                        <span>au total</span>
                    </div>
                </div>
            </div>

            {/* 2. SOLDE CAISSE ESPÈCES ACTUEL */}
            <div className={`p-4 sm:p-5 border rounded-3xl shadow-sm flex flex-col justify-between ${
                isBalanceHigh 
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/60' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Caisse Espèces Terrain
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isBalanceHigh 
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' 
                            : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                    }`}>
                        <Banknote size={20} />
                    </div>
                </div>

                <div>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black tracking-tight ${
                            cashBalance > 0 
                                ? 'text-amber-700 dark:text-amber-400' 
                                : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                            {cashBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-bold text-slate-500">DT</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                        {cashBalance > 0 ? (
                            <>
                                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                <span>Solde espèces en sa possession</span>
                            </>
                        ) : (
                            <span>Caisse à jour</span>
                        )}
                    </p>
                </div>
            </div>

            {/* 3. FLUX FINANCIERS : COLLECTES & FRAIS */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Flux Financiers
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={20} />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-500">Total Encaissé :</span>
                        <span className="text-base font-black text-emerald-600">
                            +{totalCollected.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-500">Dépenses Terrain :</span>
                        <span className="font-black text-rose-500">
                            -{expensesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianBentoKPIs;
