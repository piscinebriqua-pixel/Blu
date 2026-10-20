import React from 'react';
import type { InvoiceWithItems } from '../../services/invoiceService';
import { 
  Printer, 
  Share2, 
  Trash2, 
  CheckCircle2, 
  Hash, 
  Clock,
  XCircle,
  FileText
} from 'lucide-react';


interface InvoiceDetailPanelProps {
  invoice: InvoiceWithItems | null;
  onStatusChange: (status: 'issued' | 'paid' | 'cancelled') => void;
  onWhatsAppShare: () => void;
  onPrint: () => void;
  onDelete: () => void;
}

export const InvoiceDetailPanel: React.FC<InvoiceDetailPanelProps> = ({
  invoice,
  onStatusChange,
  onWhatsAppShare,
  onPrint,
  onDelete,
}) => {
  if (!invoice) {
    return (
      <div className="h-full min-h-[420px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center mb-3">
          <FileText size={28} />
        </div>
        <p className="text-base font-black uppercase text-slate-800 dark:text-white">
          Aucune facture sélectionnée
        </p>
        <p className="text-xs font-semibold text-slate-500 max-w-xs mt-1">
          Sélectionnez une facture dans la liste de gauche pour consulter son détail et ses options d'impression.
        </p>
      </div>
    );
  }

  const clientFullName = invoice.client
    ? `${invoice.client.first_name} ${invoice.client.last_name}`
    : 'Client Inconnu';

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* 1. EN-TÊTE DU PANNEAU : STATUT & ACTIONS RAPIDES */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {invoice.number}
            </h2>
            {invoice.status === 'paid' ? (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl">
                <CheckCircle2 size={13} /> Payée
              </span>
            ) : invoice.status === 'cancelled' ? (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl">
                <XCircle size={13} /> Annulée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl">
                <Clock size={13} /> Émise
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Émise le {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
            {invoice.due_date && ` • Échéance : ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2">
          {invoice.status !== 'paid' && (
            <button
              type="button"
              onClick={() => onStatusChange('paid')}
              className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <CheckCircle2 size={16} /> Marquer Payée
            </button>
          )}

          <button
            type="button"
            onClick={onWhatsAppShare}
            className="w-11 h-11 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
            title="Partager par WhatsApp"
          >
            <Share2 size={18} />
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="min-h-[44px] px-4 bg-primary hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            title="Imprimer / Exporter PDF"
          >
            <Printer size={16} />
            <span>Imprimer</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="w-11 h-11 flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
            title="Supprimer la facture"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* 2. INFOS CLIENT & DESTINATAIRE */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
          Facturé à (Client)
        </span>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-black text-slate-900 dark:text-white uppercase">
            {clientFullName}
          </p>

          {invoice.client?.matricule_fiscal && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 text-xs font-bold font-mono">
              <Hash size={13} />
              <span>MF : {invoice.client.matricule_fiscal}</span>
            </div>
          )}
        </div>

        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 space-y-0.5 pt-1.5">
          {invoice.client?.phone && <p>Tél : {invoice.client.phone}</p>}
          {(invoice.client?.address || invoice.client?.city) && (
            <p>{[invoice.client.address, invoice.client.city].filter(Boolean).join(', ')}</p>
          )}
        </div>
      </div>

      {/* 3. LISTE DES PRESTATIONS */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
          Prestations et Fournitures
        </span>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-black">
              <tr>
                <th className="py-2.5 px-3">Désignation</th>
                <th className="py-2.5 px-2 text-center w-12">Qté</th>
                <th className="py-2.5 px-3 text-right w-24">P.U (DT)</th>
                <th className="py-2.5 px-3 text-right w-28">Total (DT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {(invoice.items || []).map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {it.description}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400">
                    {it.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    {Number(it.unit_price).toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                    {Number(it.total_price).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. TOTALISATEUR FINANCIER */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <div className="flex justify-between">
          <span>Total Hors Taxes (HT) :</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono">
            {Number(invoice.subtotal_ht).toFixed(3)} DT
          </span>
        </div>

        {Number(invoice.tax_rate) > 0 && (
          <div className="flex justify-between">
            <span>TVA ({invoice.tax_rate}%) :</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {Number(invoice.tax_amount).toFixed(3)} DT
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Droit de Timbre Fiscal :</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono">1.000 DT</span>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline font-black">
          <span className="text-sm uppercase text-slate-900 dark:text-white">Total Net TTC :</span>
          <span className="text-xl text-primary font-mono">
            {Number(invoice.total_ttc).toFixed(3)} DT
          </span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPanel;
