import React from 'react';
import type { DevisRecord } from '../../services/devisService';
import { 
  FileText, 
  MessageCircle, 
  Edit2, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Receipt 
} from 'lucide-react';

interface DevisCardProps {
  devis: DevisRecord;
  onSelect: (devis: DevisRecord) => void;
  onEdit: (id: string) => void;
  onDuplicate: (devis: DevisRecord) => void;
  onDelete: (devis: DevisRecord) => void;
  onStatusChange: (id: string, status: 'pending' | 'closed' | 'cancelled') => void;
  onConvertToInvoice: (devis: DevisRecord) => void;
  onWhatsApp: (devis: DevisRecord) => void;
}

export const DevisCard: React.FC<DevisCardProps> = ({
  devis,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  onConvertToInvoice,
  onWhatsApp,
}) => {
  const clientName = devis.client
    ? `${devis.client.first_name} ${devis.client.last_name}`.trim()
    : 'Client Non Spécifié';
  const dateStr = new Date(devis.created_at).toLocaleDateString('fr-FR');

  const isClosed = devis.status === 'closed';
  const isCancelled = devis.status === 'cancelled';
  const isPending = !isClosed && !isCancelled;

  return (
    <div
      onClick={() => onSelect(devis)}
      className="card-bento p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/50 transition-all border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group"
    >
      {/* SECTION GAUCHE : INFOS DE BASE */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
            isClosed
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
              : isCancelled
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
          }`}
        >
          <FileText size={20} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {devis.number}
            </span>

            {isClosed ? (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={13} /> Validé
              </span>
            ) : isCancelled ? (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                <XCircle size={13} /> Sans suite
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                <Clock size={13} /> En négociation
              </span>
            )}

            {devis.invoice_id && (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                <Receipt size={13} /> Facturé
              </span>
            )}
          </div>

          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
            {devis.title}
          </p>

          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
            {clientName} • {dateStr}
          </p>
        </div>
      </div>

      {/* SECTION DROITE : MONTANT & ACTIONS RAPIDES */}
      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
        <div className="text-left md:text-right">
          <span className="text-xs font-bold text-slate-400 block uppercase">Total Devis</span>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {(Number(devis.total_amount) || 0).toFixed(0)}{' '}
            <span className="text-xs text-slate-500 font-bold">DT</span>
          </p>
        </div>

        {/* BOUTONS D'ACTION */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Relance WhatsApp */}
          {devis.client?.phone && (
            <button
              type="button"
              onClick={() => onWhatsApp(devis)}
              className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all"
              title="Relancer sur WhatsApp"
            >
              <MessageCircle size={16} />
            </button>
          )}

          {/* Modifier */}
          <button
            type="button"
            onClick={() => onEdit(devis.id)}
            className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
            title="Modifier le devis"
          >
            <Edit2 size={16} />
          </button>

          {/* Dupliquer */}
          <button
            type="button"
            onClick={() => onDuplicate(devis)}
            className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
            title="Dupliquer le devis"
          >
            <Copy size={16} />
          </button>

          {/* Bascule de statut : Accepter ou Marquer Refusé */}
          {isPending ? (
            <button
              type="button"
              onClick={() => onStatusChange(devis.id, 'closed')}
              className="min-h-[44px] px-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-700 active:scale-95 transition-all"
              title="Valider ce devis"
            >
              <CheckCircle2 size={15} />
              <span className="hidden sm:inline">Signé</span>
            </button>
          ) : isClosed ? (
            devis.invoice_id ? (
              <span className="min-h-[44px] px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={14} />
                <span className="hidden sm:inline">Facturé</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onConvertToInvoice(devis)}
                className="min-h-[44px] px-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                title="Facturer ce devis"
              >
                <Receipt size={15} />
                <span className="hidden sm:inline">Facturer</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => onStatusChange(devis.id, 'pending')}
              className="min-h-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase flex items-center gap-1 hover:bg-slate-200 active:scale-95 transition-all"
              title="Replacer en attente"
            >
              <Clock size={15} />
              <span className="hidden sm:inline">Relancer</span>
            </button>
          )}

          {/* Supprimer */}
          <button
            type="button"
            onClick={() => onDelete(devis)}
            className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-center hover:bg-rose-100 active:scale-95 transition-all"
            title="Supprimer ce devis"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
