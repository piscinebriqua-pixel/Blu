import React from 'react';
import type { DevisStats } from '../../services/devisService';
import { Clock, CheckCircle2, FileText } from 'lucide-react';

interface DevisKpiRibbonProps {
  stats: DevisStats;
}

export const DevisKpiRibbon: React.FC<DevisKpiRibbonProps> = ({ stats }) => {
  return (
    <>
      {/* 1. VERSION SMARTPHONE (< 640px) : MINI-RUBAN 1 SEULE LIGNE (Haute Densité, Zero-Waste) */}
      <div className="sm:hidden grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-center shadow-xs">
          <p className="text-xs font-black text-amber-500 uppercase tracking-tight">En cours</p>
          <p className="text-sm font-black text-amber-500 truncate mt-0.5">
            {stats.pendingTotalAmount.toFixed(0)}{' '}
            <span className="text-xs font-bold text-slate-500">DT</span>
          </p>
        </div>

        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-center shadow-xs">
          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Validés</p>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
            {stats.closedTotalAmount.toFixed(0)}{' '}
            <span className="text-xs font-bold text-slate-500">DT</span>
          </p>
        </div>

        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-center shadow-xs">
          <p className="text-xs font-black text-slate-500 uppercase tracking-tight">Dossiers</p>
          <p className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
            {stats.totalCount}{' '}
            <span className="text-xs font-bold text-slate-500">devis</span>
          </p>
        </div>
      </div>

      {/* 2. VERSION TABLETTE & DESKTOP (>= 640px) : 3 CARTES BENTO ÉLÉGANTES */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        {/* En Négociation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-500">En Négociation</span>
            <p className="text-xl lg:text-2xl font-black text-amber-500 mt-1">
              {stats.pendingTotalAmount.toFixed(0)}{' '}
              <span className="text-xs font-bold text-slate-500">DT</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">
              {stats.pendingCount} proposition(s) active(s)
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
        </div>

        {/* Validés / Gagnés */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Validés / Signés</span>
            <p className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.closedTotalAmount.toFixed(0)}{' '}
              <span className="text-xs font-bold text-slate-500">DT</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">
              {stats.closedCount} devis transformé(s)
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Total Devis */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Total Proposé</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalCount}{' '}
              <span className="text-xs font-bold text-slate-500">dossiers</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">
              {stats.cancelledCount} sans suite / refusé(s)
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
        </div>
      </div>
    </>
  );
};

export default DevisKpiRibbon;
