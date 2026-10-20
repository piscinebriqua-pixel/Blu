import React, { useEffect, useState } from 'react';
import { devisService, type DevisRecord, type DevisItem } from '../../services/devisService';
import { 
  Printer, 
  Share2, 
  Trash2, 
  CheckCircle2, 
  Hash, 
  Clock,
  XCircle,
  FileText,
  Receipt,
  Edit2,
  Copy,
  Layers
} from 'lucide-react';

interface DevisDetailPanelProps {
  devis: DevisRecord | null;
  onStatusChange: (id: string, status: 'pending' | 'closed' | 'cancelled') => void;
  onWhatsAppShare: (devis: DevisRecord) => void;
  onPrint: (devis: DevisRecord, items: DevisItem[]) => void;
  onEdit: (id: string) => void;
  onDelete: (devis: DevisRecord) => void;
  onConvertToInvoice: (devis: DevisRecord) => void;
  onDuplicate: (devis: DevisRecord) => void;
}

export const DevisDetailPanel: React.FC<DevisDetailPanelProps> = ({
  devis,
  onStatusChange,
  onWhatsAppShare,
  onPrint,
  onEdit,
  onDelete,
  onConvertToInvoice,
  onDuplicate,
}) => {
  const [items, setItems] = useState<DevisItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (devis?.id) {
      setLoadingItems(true);
      devisService.fetchDevisItems(devis.id).then((fetched) => {
        if (isMounted) {
          setItems(fetched);
          setLoadingItems(false);
        }
      });
    } else {
      setItems([]);
    }
    return () => {
      isMounted = false;
    };
  }, [devis?.id]);

  if (!devis) {
    return (
      <div className="h-full min-h-[420px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-3">
          <FileText size={28} />
        </div>
        <p className="text-base font-black uppercase text-slate-800 dark:text-white">
          Aucun devis sélectionné
        </p>
        <p className="text-xs font-semibold text-slate-500 max-w-xs mt-1">
          Sélectionnez un devis dans la liste de gauche pour consulter son détail complet et ses options d'impression.
        </p>
      </div>
    );
  }

  const clientFullName = devis.client
    ? `${devis.client.first_name || ''} ${devis.client.last_name || ''}`.trim()
    : 'Client Non Spécifié';

  const isClosed = devis.status === 'closed';
  const isCancelled = devis.status === 'cancelled';

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* 1. EN-TÊTE DU PANNEAU : NUMÉRO, STATUT & ACTIONS RAPIDES */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {devis.number}
            </h2>
            {isClosed ? (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl">
                <CheckCircle2 size={13} /> Validé
              </span>
            ) : isCancelled ? (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl">
                <XCircle size={13} /> Sans suite
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl">
                <Clock size={13} /> En négociation
              </span>
            )}

            {devis.invoice_id && (
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-xl">
                <Receipt size={13} /> Facturé
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Créé le {new Date(devis.created_at).toLocaleDateString('fr-FR')} • {devis.title}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!devis.invoice_id && (
            <button
              type="button"
              onClick={() => onConvertToInvoice(devis)}
              className="min-h-[44px] px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Générer une facture depuis ce devis"
            >
              <Receipt size={16} />
              <span className="hidden sm:inline">Facturer</span>
            </button>
          )}

          {devis.client?.phone && (
            <button
              type="button"
              onClick={() => onWhatsAppShare(devis)}
              className="w-11 h-11 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
              title="Relancer sur WhatsApp"
            >
              <Share2 size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onPrint(devis, items)}
            className="min-h-[44px] px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            title="Imprimer / Exporter PDF officiel A4"
          >
            <Printer size={16} />
            <span>Imprimer</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(devis)}
            className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Dupliquer ce devis"
          >
            <Copy size={17} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(devis.id)}
            className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Modifier le devis"
          >
            <Edit2 size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(devis)}
            className="w-11 h-11 flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
            title="Supprimer le devis"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* 2. SÉLECTEUR DE STATUT RAPIDE */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Changer statut :
        </span>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onStatusChange(devis.id, 'pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              devis.status === 'pending'
                ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            En négociation
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(devis.id, 'closed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              devis.status === 'closed'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Validé
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(devis.id, 'cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              devis.status === 'cancelled'
                ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sans suite
          </button>
        </div>
      </div>

      {/* 3. INFOS CLIENT */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
          Client Destinataire
        </span>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-black text-slate-900 dark:text-white uppercase">
            {clientFullName}
          </p>
          {devis.client?.matricule_fiscal && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 text-xs font-bold font-mono">
              <Hash size={13} />
              <span>MF : {devis.client.matricule_fiscal}</span>
            </div>
          )}
        </div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 space-y-0.5 pt-1.5">
          {devis.client?.phone && <p>Tél : {devis.client.phone}</p>}
          {(devis.client?.address || devis.client?.city) && (
            <p>Adresse : {[devis.client.address, devis.client.city].filter(Boolean).join(', ')}</p>
          )}
        </div>
      </div>

      {/* 4. ARTICLES ET PRESTATIONS DU DEVIS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers size={14} /> Lignes de prestation ({items.length})
          </span>
        </div>

        {loadingItems ? (
          <div className="py-8 text-center text-xs font-bold text-slate-500">
            Chargement des articles...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs font-semibold text-slate-500">
            Aucun article détaillé renseigné
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-2 text-center w-16">Qté</th>
                  <th className="py-2.5 px-3 text-right w-24">P.U.</th>
                  <th className="py-2.5 px-3 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {items.map((item, idx) => {
                  if (item.is_header) {
                    return (
                      <tr key={item.id || idx} className="bg-slate-50/80 dark:bg-slate-800/40">
                        <td colSpan={4} className="py-2 px-3 font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                          {item.designation}
                        </td>
                      </tr>
                    );
                  }
                  const rowTotal = (Number(item.quantity) || 1) * (Number(item.unit_price) || 0);
                  return (
                    <tr key={item.id || idx} className="text-slate-800 dark:text-slate-200">
                      <td className="py-2.5 px-3">{item.designation}</td>
                      <td className="py-2.5 px-2 text-center text-slate-500">
                        {item.quantity} {item.unit || ''}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                        {rowTotal.toFixed(2)} DT
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. RÉCAPITULATIF FINANCIER */}
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            Total Devis Net
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Valable selon conditions générales Blu
          </span>
        </div>
        <p className="text-2xl font-black text-slate-900 dark:text-white">
          {(Number(devis.total_amount) || 0).toFixed(0)}{' '}
          <span className="text-sm font-bold text-amber-600">DT</span>
        </p>
      </div>

      {/* 6. NOTES PARTICULIÈRES */}
      {devis.notes && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
          <span className="font-black text-slate-500 uppercase tracking-wider block mb-0.5">
            Notes / Modalités :
          </span>
          <p className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
            {devis.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default DevisDetailPanel;
