import React from 'react';
import { Loader2 } from 'lucide-react';
import type { ShareableDevisItem } from '../../helpers/devisShareHelper';

interface DevisItemsListProps {
  loading: boolean;
  items: ShareableDevisItem[];
}

export const DevisItemsList: React.FC<DevisItemsListProps> = ({ loading, items }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
        <h5 className="text-xs font-black text-primary dark:text-blue-400 uppercase tracking-[0.3em]">
          Détail des Prestations
        </h5>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
      </div>

      <div className="bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg p-2 md:p-6 print:p-2 border border-slate-100 dark:border-white/5 min-h-[150px] print:min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-10 h-full w-full">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              Chargement des articles...
            </span>
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-xs font-bold text-slate-500 uppercase py-10">
            Aucun article dans ce devis
          </p>
        ) : (
          <div className="flex flex-col gap-2 print:gap-1">
            {items.map((item) => {
              if (item.is_header) {
                return (
                  <div
                    key={item.id}
                    className="mt-4 print:mt-2 mb-2 print:mb-1 first:mt-0 p-3 print:p-2 bg-blue-500 text-white rounded-2xl print:rounded flex items-center justify-between shadow-sm"
                  >
                    <h4 className="text-sm print:text-xs font-black uppercase tracking-widest">
                      {item.designation}
                    </h4>
                  </div>
                );
              } else {
                const lineTotal = item.quantity * item.unit_price;
                return (
                  <div
                    key={item.id}
                    className="p-4 print:p-2 bg-white dark:bg-slate-800 rounded-2xl print:rounded border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-3 print:gap-1 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs print:text-[11px] font-black text-slate-900 dark:text-white uppercase leading-snug group-hover:text-blue-500 transition-colors">
                        {item.designation}
                      </h5>
                      <div className="flex flex-wrap items-center gap-3 print:gap-2 mt-1.5 print:mt-0.5">
                        <span className="text-xs print:text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg print:rounded border border-slate-200 dark:border-slate-600">
                          Qté: {item.quantity} {item.unit}
                        </span>
                        <span className="text-xs print:text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          P.U: {item.unit_price.toFixed(2)} DT
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center sm:block print:block justify-between border-t sm:border-0 print:border-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 print:pt-0 mt-2 sm:mt-0 print:mt-0">
                      <span className="text-xs sm:hidden print:hidden font-black text-slate-500 uppercase tracking-widest">
                        Total Ligne
                      </span>
                      <div className="text-base print:text-sm font-black text-slate-900 dark:text-white">
                        {lineTotal.toFixed(0)}{' '}
                        <span className="text-xs print:text-[10px] font-bold text-slate-500 uppercase">
                          DT
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};
