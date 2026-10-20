import React from 'react';
import type { DevisRecord } from '../../services/devisService';
import { FileText, CheckCircle2, XCircle, Clock, Receipt, ChevronRight } from 'lucide-react';

interface DevisListItemCardProps {
  devis: DevisRecord;
  isSelected?: boolean;
  onClick: () => void;
}

export const DevisListItemCard: React.FC<DevisListItemCardProps> = ({
  devis,
  isSelected = false,
  onClick,
}) => {
  const dateStr = new Date(devis.created_at).toLocaleDateString('fr-FR');
  const clientFullName = devis.client
    ? `${devis.client.first_name || ''} ${devis.client.last_name || ''}`.trim()
    : 'Client Non Spécifié';

  const isClosed = devis.status === 'closed';
  const isCancelled = devis.status === 'cancelled';

  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all border shadow-xs group ${
        isSelected
          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
            isSelected
              ? 'bg-amber-500 text-white'
              : isClosed
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
              : isCancelled
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
          }`}
        >
          <FileText size={18} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {devis.number}
            </span>

            {isClosed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={11} /> Validé
              </span>
            ) : isCancelled ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                <XCircle size={11} /> Sans suite
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                <Clock size={11} /> En négociation
              </span>
            )}

            {devis.invoice_id && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                <Receipt size={11} /> Facturé
              </span>
            )}
          </div>

          <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate mt-0.5">
            {devis.title}
          </p>

          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
            {clientFullName} • {dateStr}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right">
          <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {(Number(devis.total_amount) || 0).toFixed(0)}{' '}
            <span className="text-xs text-slate-500">DT</span>
          </p>
          <span className="text-[11px] font-bold text-slate-500 block uppercase">
            Net Devis
          </span>
        </div>
        <ChevronRight
          size={16}
          className={`transition-colors ${
            isSelected
              ? 'text-amber-500'
              : 'text-slate-500 group-hover:text-amber-500'
          }`}
        />
      </div>
    </div>
  );
};

export default DevisListItemCard;
