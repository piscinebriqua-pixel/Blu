import React from 'react';
import type { DevisStats } from '../../services/devisService';
import { FileText, CheckCircle2, Clock, Plus } from 'lucide-react';

interface DevisStatsGridProps {
  stats: DevisStats;
  onNewDevis: () => void;
}

export const DevisStatsGrid: React.FC<DevisStatsGridProps> = ({ stats, onNewDevis }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Volume en négociation */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <Clock size={14} /> En Négociation
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.pendingTotalAmount.toFixed(0)}{' '}
            <span className="text-xs text-slate-500 font-bold">DT</span>
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 mt-2 block">
          {stats.pendingCount} proposition(s) en cours
        </span>
      </div>

      {/* 2. Devis Acceptés */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Validés / Gagnés
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.closedTotalAmount.toFixed(0)}{' '}
            <span className="text-xs text-slate-500 font-bold">DT</span>
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 mt-2 block">
          {stats.closedCount} devis signé(s)
        </span>
      </div>

      {/* 3. Total des dossiers */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText size={14} /> Total Devis
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalCount}
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 mt-2 block">
          {stats.cancelledCount} classé(s) ou refusé(s)
        </span>
      </div>

      {/* 4. Action création rapide */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Action Commerciale
        </span>
        <button
          type="button"
          onClick={onNewDevis}
          className="w-full min-h-[44px] mt-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-amber-500/30 active:scale-95 transition-all"
        >
          <Plus size={16} /> Nouveau Devis
        </button>
      </div>
    </div>
  );
};
