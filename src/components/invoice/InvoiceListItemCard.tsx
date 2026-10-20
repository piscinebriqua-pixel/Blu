import React from 'react';
import type { InvoiceWithItems } from '../../services/invoiceService';
import { Receipt, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';

interface InvoiceListItemCardProps {
  invoice: InvoiceWithItems;
  isSelected?: boolean;
  onClick: () => void;
}

export const InvoiceListItemCard: React.FC<InvoiceListItemCardProps> = ({
  invoice,
  isSelected = false,
  onClick,
}) => {
  const dateStr = new Date(invoice.invoice_date).toLocaleDateString('fr-FR');
  const clientFullName = invoice.client
    ? `${invoice.client.first_name} ${invoice.client.last_name}`
    : 'Client Inconnu';

  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all border shadow-xs group ${
        isSelected
          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-primary ring-2 ring-primary/20 shadow-md'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-primary/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
            isSelected
              ? 'bg-primary text-white'
              : 'bg-blue-50 dark:bg-blue-950/40 text-primary'
          }`}
        >
          <Receipt size={18} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {invoice.number}
            </span>

            {invoice.status === 'paid' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={11} /> Payée
              </span>
            ) : invoice.status === 'cancelled' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                <XCircle size={11} /> Annulée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                <Clock size={11} /> Émise
              </span>
            )}
          </div>

          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
            {clientFullName} • {dateStr}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right">
          <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {Number(invoice.total_ttc).toFixed(2)}{' '}
            <span className="text-xs text-slate-500">DT</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            HT : {Number(invoice.subtotal_ht).toFixed(2)} DT
          </p>
        </div>
        <ChevronRight
          size={16}
          className={`transition-colors ${
            isSelected
              ? 'text-primary'
              : 'text-slate-500 group-hover:text-primary'
          }`}
        />
      </div>
    </div>
  );
};

export default InvoiceListItemCard;
