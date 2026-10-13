import React from 'react';
import type { InvoiceDraftItem } from './useCreateInvoiceState';
import { Plus, Tag, FileSpreadsheet, Calendar, Trash2 } from 'lucide-react';

interface InvoiceItemsTableProps {
  items: InvoiceDraftItem[];
  onAddItem: () => void;
  onOpenCatalogue: () => void;
  onOpenDevisPicker: () => void;
  onOpenInterventionsPicker: () => void;
  onUpdateItem: (index: number, field: keyof InvoiceDraftItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  hasClient: boolean;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  items,
  onAddItem,
  onOpenCatalogue,
  onOpenDevisPicker,
  onOpenInterventionsPicker,
  onUpdateItem,
  onRemoveItem,
  hasClient,
}) => {
  return (
    <div className="space-y-3">
      {/* BARRE D'ACTIONS : AJOUTS SANS LIMITE */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Articles & Prestations ({items.length})
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* 1. Ligne libre */}
          <button
            type="button"
            onClick={onAddItem}
            className="min-h-[44px] px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200/50 dark:border-blue-900/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-100 active:scale-95 transition-all"
            title="Ajouter une ligne libre personnalisée"
          >
            <Plus size={16} /> Ligne libre
          </button>

          {/* 2. Catalogue */}
          <button
            type="button"
            onClick={onOpenCatalogue}
            className="min-h-[44px] px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-100 active:scale-95 transition-all"
            title="Piocher dans vos prestations et produits"
          >
            <Tag size={16} /> Catalogue
          </button>

          {/* 3. Importer Devis */}
          <button
            type="button"
            onClick={onOpenDevisPicker}
            className="min-h-[44px] px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-amber-100 active:scale-95 transition-all"
            title="Importer les articles d'un devis"
          >
            <FileSpreadsheet size={16} /> Importer Devis
          </button>

          {/* 4. Importer Passages */}
          {hasClient && (
            <button
              type="button"
              onClick={onOpenInterventionsPicker}
              className="min-h-[44px] px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-purple-100 active:scale-95 transition-all"
              title="Importer des passages d'entretien"
            >
              <Calendar size={16} /> Passages
            </button>
          )}
        </div>
      </div>

      {/* LISTE DES ARTICLES */}
      {items.length === 0 ? (
        <button
          type="button"
          onClick={onAddItem}
          className="w-full min-h-[56px] p-4 rounded-2xl border-2 border-dashed border-slate-200/90 dark:border-slate-800 hover:border-primary/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 group transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center">
              <Plus size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase text-slate-800 dark:text-white">
                Facture vide pour le moment
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Cliquez pour ajouter une ligne libre, ou utilisez le Catalogue / Devis ci-dessus
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
            <Plus size={16} />
          </div>
        </button>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center gap-2.5"
            >
              {/* Description */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Désignation de la prestation ou de l'article *"
                  value={it.description}
                  onChange={(e) => onUpdateItem(idx, 'description', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Ligne des valeurs : Qté, Unité, PU, Total, Poubelle */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Quantité */}
                <div className="w-20">
                  <input
                    type="number"
                    step="any"
                    placeholder="Qté"
                    value={it.quantity === 0 ? '' : it.quantity}
                    onChange={(e) =>
                      onUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    className="w-full min-h-[44px] px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-center text-slate-900 dark:text-white"
                    title="Quantité"
                  />
                </div>

                {/* Unité */}
                <div className="w-20">
                  <input
                    type="text"
                    placeholder="Unité"
                    value={it.unit || ''}
                    onChange={(e) => onUpdateItem(idx, 'unit', e.target.value)}
                    className="w-full min-h-[44px] px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center text-slate-700 dark:text-slate-300"
                    title="Unité (ex: u, m², forfait, h)"
                  />
                </div>

                {/* Prix unitaire */}
                <div className="w-28">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="P.U. HT"
                      value={it.unitPrice === 0 ? '' : it.unitPrice}
                      onChange={(e) =>
                        onUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      className="w-full min-h-[44px] pl-2 pr-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-right text-slate-900 dark:text-white"
                      title="Prix unitaire en DT"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      DT
                    </span>
                  </div>
                </div>

                {/* Total Ligne */}
                <div className="w-28 text-right pr-2 shrink-0">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Total</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {Number(it.totalPrice || 0).toFixed(2)}{' '}
                    <span className="text-xs text-slate-400">DT</span>
                  </span>
                </div>

                {/* Supprimer */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(idx)}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all"
                  title="Supprimer cette ligne"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
