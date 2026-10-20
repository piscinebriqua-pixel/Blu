import React from 'react';
import { CheckCircle2, Clock, Receipt } from 'lucide-react';

interface InvoiceKpiRibbonProps {
  stats: {
    totalTtc: number;
    paidTtc: number;
    pendingTtc: number;
    count: number;
  };
}

export const InvoiceKpiRibbon: React.FC<InvoiceKpiRibbonProps> = ({ stats }) => {
  return (
    <>
      {/* 1. VERSION SMARTPHONE (< 640px) : MINI-RUBAN 1 SEULE LIGNE (Haute Densité, Zero-Waste) */}
      <div className="sm:hidden grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-center shadow-xs">
          <p className="text-xs font-black text-slate-500 uppercase tracking-tight">Facturé</p>
          <p className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
            {stats.totalTtc.toFixed(0)} <span className="text-xs font-bold text-slate-500">DT</span>
          </p>
        </div>

        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-center shadow-xs">
          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Encaissé</p>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
            {stats.paidTtc.toFixed(0)} <span className="text-xs font-bold text-slate-500">DT</span>
          </p>
        </div>

        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-center shadow-xs">
          <p className="text-xs font-black text-amber-500 uppercase tracking-tight">En attente</p>
          <p className="text-sm font-black text-amber-500 truncate mt-0.5">
            {stats.pendingTtc.toFixed(0)} <span className="text-xs font-bold text-slate-500">DT</span>
          </p>
        </div>
      </div>

      {/* 2. VERSION TABLETTE & DESKTOP (>= 640px) : 3 CARTES BENTO ÉLÉGANTES */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        {/* Total Facturé */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Volume Facturé</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalTtc.toFixed(2)} <span className="text-xs font-bold text-slate-500">DT</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">{stats.count} facture(s) au total</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Receipt size={20} />
          </div>
        </div>

        {/* Total Encaissé */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Encaissé</span>
            <p className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.paidTtc.toFixed(2)} <span className="text-xs font-bold text-slate-500">DT</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">Règlements perçus</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* En Attente */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-500">Reste à Recouvrer</span>
            <p className="text-xl lg:text-2xl font-black text-amber-500 mt-1">
              {stats.pendingTtc.toFixed(2)} <span className="text-xs font-bold text-slate-500">DT</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">En attente de paiement</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceKpiRibbon;
