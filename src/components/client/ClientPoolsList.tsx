import React from "react";
import { Waves, Plus, Edit2, Trash2 } from "lucide-react";
import type { Pool } from "./types";

interface ClientPoolsListProps {
  pools: Pool[];
  isAdmin: boolean;
  onOpenAddPool: () => void;
  onSelectPoolForDirectReport: (poolId: string) => void;
  onEditPool: (pool: Pool) => void;
  onDeletePool: (pool: Pool) => void;
}

export const ClientPoolsList: React.FC<ClientPoolsListProps> = ({
  pools,
  isAdmin,
  onOpenAddPool,
  onSelectPoolForDirectReport,
  onEditPool,
  onDeletePool,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pools.map((pool) => {
        const mainPhoto = pool.photos?.find((p) => p.is_main)?.url || pool.photos?.[0]?.url;

        return (
          <div
            key={pool.id}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 group hover:border-blue-500/30 transition-all shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center overflow-hidden border border-blue-500/20 flex-shrink-0">
                {mainPhoto ? (
                  <img src={mainPhoto} alt={pool.name} className="w-full h-full object-cover" />
                ) : (
                  <Waves size={24} />
                )}
              </div>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => onSelectPoolForDirectReport(pool.id)}
                  className="min-h-[44px] px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-colors"
                >
                  Rapport Direct
                </button>
                <button
                  type="button"
                  onClick={() => onEditPool(pool)}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-blue-600 border border-slate-200 dark:border-slate-600 shadow-sm transition-all"
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onDeletePool(pool)}
                    className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:text-red-700 hover:bg-red-100 border border-red-200 dark:border-red-800/30 shadow-sm transition-all"
                    title="Supprimer la piscine"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <h4 className="text-base font-black text-slate-800 dark:text-white mb-1 truncate">{pool.name}</h4>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{pool.volume_m3} m³</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate">
                {pool.treatment_method}
              </span>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onOpenAddPool}
        className="min-h-[140px] flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/[0.03] transition-all group"
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus size={24} className="text-slate-500 group-hover:text-blue-600" />
        </div>
        <span className="text-xs font-black text-slate-600 dark:text-slate-400 group-hover:text-blue-600 uppercase tracking-wider">
          Ajouter un bassin
        </span>
      </button>
    </div>
  );
};
