import React, { useState } from 'react';
import ModalLayout from '../ModalLayout';
import type { UnbilledDevis } from '../../services/invoiceService';
import { Search, FileSpreadsheet, Plus, CheckCircle2, Clock } from 'lucide-react';

interface DevisPickerModalProps {
  availableDevis: UnbilledDevis[];
  loading: boolean;
  onClose: () => void;
  onImportDevis: (devis: UnbilledDevis) => void;
}

export const DevisPickerModal: React.FC<DevisPickerModalProps> = ({
  availableDevis,
  loading,
  onClose,
  onImportDevis,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = availableDevis.filter((d) => {
    const q = searchTerm.toLowerCase().trim();
    const clientName = `${d.client?.first_name || ''} ${d.client?.last_name || ''}`.toLowerCase();
    const num = (d.number || '').toLowerCase();
    const title = (d.title || '').toLowerCase();
    return !q || clientName.includes(q) || num.includes(q) || title.includes(q);
  });

  return (
    <ModalLayout
      title="Importer un Devis dans la Facture"
      onClose={onClose}
      className="max-w-xl"
    >
      <div className="space-y-4">
        <p className="text-xs font-semibold text-slate-500">
          Sélectionnez un devis pour injecter l'intégralité de ses articles chiffrés directement dans votre facture.
        </p>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par numéro, titre ou client..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold"
          />
        </div>

        {/* Liste des devis */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase">
              Recherche des devis en cours...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
              <FileSpreadsheet size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Aucun devis disponible
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Aucun devis non facturé trouvé pour ce client ou cette recherche.
              </p>
            </div>
          ) : (
            filtered.map((d) => {
              const clientFullName = d.client
                ? `${d.client.first_name} ${d.client.last_name}`
                : 'Client associé';
              const dateStr = new Date(d.created_at).toLocaleDateString('fr-FR');
              const isClosed = d.status === 'closed';

              return (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-all shadow-sm group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        {d.number}
                      </span>
                      {isClosed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={12} /> Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                          <Clock size={12} /> En cours
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {d.title}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {clientFullName} • {dateStr}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {Number(d.total_amount).toFixed(2)} DT
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onImportDevis(d);
                        onClose();
                      }}
                      className="min-h-[44px] px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                    >
                      <Plus size={16} /> Importer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase text-slate-700 dark:text-slate-300"
          >
            Fermer
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};
