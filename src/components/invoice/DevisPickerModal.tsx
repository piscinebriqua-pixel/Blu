import React, { useState } from 'react';
import ModalLayout from '../ModalLayout';
import type { UnbilledDevis } from '../../services/invoiceService';
import { Search, FileSpreadsheet, Plus, CheckCircle2, Clock, Users, User, AlertCircle } from 'lucide-react';

interface DevisPickerModalProps {
  availableDevis: UnbilledDevis[];
  allDevis?: UnbilledDevis[];
  selectedClientId?: string;
  selectedClientName?: string;
  loading: boolean;
  onClose: () => void;
  onImportDevis: (devis: UnbilledDevis) => void;
}

export const DevisPickerModal: React.FC<DevisPickerModalProps> = ({
  availableDevis = [],
  allDevis = [],
  selectedClientId,
  selectedClientName,
  loading,
  onClose,
  onImportDevis,
}) => {
  // Détermination de la source complète
  const allDevisList = allDevis.length > 0 ? allDevis : availableDevis;
  const hasClient = Boolean(selectedClientId);
  const clientHasDevis = availableDevis.length > 0;

  // Si le client n'a pas de devis, basculer d'emblée sur la vue globale
  const [activeTab, setActiveTab] = useState<'client' | 'all'>(() => {
    return hasClient && clientHasDevis ? 'client' : 'all';
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Liste active selon l'onglet
  const activeList = activeTab === 'client' && hasClient ? availableDevis : allDevisList;

  // Filtrage par recherche
  const filtered = activeList.filter((d) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const clientName = `${d.client?.first_name || ''} ${d.client?.last_name || ''}`.toLowerCase();
    const phone = (d.client?.phone || '').toLowerCase();
    const num = (d.number || '').toLowerCase();
    const title = (d.title || '').toLowerCase();
    const amount = String(d.total_amount || '');
    return clientName.includes(q) || phone.includes(q) || num.includes(q) || title.includes(q) || amount.includes(q);
  });

  return (
    <ModalLayout
      title="Importer un Devis dans la Facture"
      onClose={onClose}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* En-tête explicatif & onglets */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <p className="text-xs font-semibold text-slate-500">
            Injecte l'intégralité des articles chiffrés d'un devis directement dans votre facture.
          </p>

          {/* Onglets de filtrage si un client est sélectionné */}
          {hasClient && (
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('client')}
                className={`min-h-[38px] px-3 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                  activeTab === 'client'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <User size={14} />
                Client actif ({availableDevis.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`min-h-[38px] px-3 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users size={14} />
                Tous les devis ({allDevisList.length})
              </button>
            </div>
          )}
        </div>

        {/* Message d'aide si le client sélectionné n'a pas de devis */}
        {hasClient && !clientHasDevis && activeTab === 'all' && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">
                Aucun devis non facturé trouvé pour {selectedClientName || 'ce client'}.
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Affichage de tous les devis disponibles ({allDevisList.length}). Importer un devis mettra automatiquement à jour le client sur votre facture.
              </p>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par numéro (ex: DEV-011), client, libellé ou montant..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-500"
          />
        </div>

        {/* Liste des devis */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recherche des devis en cours...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
              <FileSpreadsheet size={36} className="mx-auto text-slate-500 mb-2" />
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                Aucun devis trouvé
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm
                  ? 'Aucun résultat ne correspond à votre filtre de recherche.'
                  : 'Aucun devis non facturé disponible dans cette sélection.'}
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-3 min-h-[44px] px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-black uppercase text-slate-800 dark:text-slate-200"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            filtered.map((d) => {
              const clientFullName = d.client
                ? `${d.client.first_name || ''} ${d.client.last_name || ''}`.trim()
                : 'Client non spécifié';
              const phone = d.client?.phone;
              const dateStr = d.created_at
                ? new Date(d.created_at).toLocaleDateString('fr-FR')
                : 'Date inconnue';
              const isClosed = d.status === 'closed';

              return (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-all shadow-sm group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
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
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {dateStr}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                      {d.title || 'Devis sans titre'}
                    </p>

                    <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                      <User size={13} className="text-slate-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{clientFullName}</span>
                      {phone && <span className="text-slate-500">({phone})</span>}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {Number(d.total_amount || 0).toFixed(2)} DT
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onImportDevis(d);
                        onClose();
                      }}
                      className="min-h-[44px] px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Importer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pied de modale */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            {filtered.length} devis affiché(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black uppercase text-slate-700 dark:text-slate-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};
