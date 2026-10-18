import React, { useState } from 'react';
import ModalLayout from '../ModalLayout';
import Button from '../ui/Button';
import { useCreateInvoiceState } from './useCreateInvoiceState';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { CataloguePickerModal } from './CataloguePickerModal';
import { DevisPickerModal } from './DevisPickerModal';
import { InterventionsPickerModal } from './InterventionsPickerModal';
import { User, Hash, Search, RotateCw } from 'lucide-react';
import ClientSelectionModal from '../ClientSelectionModal';

interface CreateInvoiceModalProps {
  clientId?: string;
  clientName?: string;
  initialDevisId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  clientId,
  clientName,
  initialDevisId,
  onClose,
  onSuccess,
}) => {
  const state = useCreateInvoiceState(
    clientId,
    clientName,
    () => {
      onSuccess();
      onClose();
    },
    initialDevisId
  );

  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [isDevisPickerOpen, setIsDevisPickerOpen] = useState(false);
  const [isInterventionsPickerOpen, setIsInterventionsPickerOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const isGlobalMode = !clientId;
  const currentClient = isGlobalMode
    ? state.availableClients.find((c) => c.id === state.selectedClientId)
    : null;

  return (
    <ModalLayout
      title="Émettre une Facture"
      onClose={onClose}
      className="max-w-3xl !min-h-0"
    >
      <div className="space-y-5 pb-2">
        {/* BANDEAU CONTEXTE / SOUS-TITRE */}
        <div className="px-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {clientName
            ? `Client : ${clientName}`
            : currentClient
            ? `Client : ${currentClient.first_name} ${currentClient.last_name}`
            : 'Saisissez vos articles ou sélectionnez un client pour facturer'}
        </div>

        {/* EN-TÊTE : NUMÉRO DE FACTURE & SÉLECTION CLIENT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          {/* Numéro de facture éditable */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Numéro de Facture
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Hash size={16} />
              </span>
              <input
                type="text"
                value={state.invoiceNumber}
                onChange={(e) => state.setInvoiceNumber(e.target.value)}
                placeholder="FAC-2026-0001"
                className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Sélecteur de client */}
          {isGlobalMode ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Client à facturer *
                </label>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <Search size={12} /> Rechercher
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <User size={16} />
                </span>
                <select
                  value={state.selectedClientId}
                  onChange={(e) => state.handleClientChange(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
                >
                  {state.loadingClients ? (
                    <option value="">Chargement des clients en cours...</option>
                  ) : (
                    <option value="">
                      -- Choisir un client ({state.availableClients.length} disponibles) --
                    </option>
                  )}
                  {state.availableClients.map((c) => {
                    const name = `${c.last_name ? c.last_name.trim() : ''} ${c.first_name ? c.first_name.trim() : ''}`.trim() || 'Client';
                    return (
                      <option key={c.id} value={c.id}>
                        {name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              {state.availableClients.length === 0 && !state.loadingClients && (
                <button
                  type="button"
                  onClick={() => state.fetchClients()}
                  className="mt-1 text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                >
                  <RotateCw size={12} /> Recharger les clients
                </button>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                Date de Facturation
              </label>
              <input
                type="date"
                value={state.invoiceDate}
                onChange={(e) => state.setInvoiceDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* FACTURIER LIBRE : TABLE DES ARTICLES ILLIMITÉE */}
        <InvoiceItemsTable
          items={state.items}
          onAddItem={() => state.addItem()}
          onOpenCatalogue={() => setIsCatalogueOpen(true)}
          onOpenDevisPicker={() => setIsDevisPickerOpen(true)}
          onOpenInterventionsPicker={() => setIsInterventionsPickerOpen(true)}
          onUpdateItem={state.updateItem}
          onRemoveItem={state.removeItem}
          hasClient={!!(clientId || state.selectedClientId)}
        />

        {/* PARAMÈTRES DATE, ÉCHÉANCE ET TVA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date d'émission
            </label>
            <input
              type="date"
              value={state.invoiceDate}
              onChange={(e) => state.setInvoiceDate(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date d'échéance
            </label>
            <input
              type="date"
              value={state.dueDate}
              onChange={(e) => state.setDueDate(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Taux de TVA (%)
            </label>
            <select
              value={state.taxRate}
              onChange={(e) => state.setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
            >
              <option value="0">0% (Sans TVA / Net)</option>
              <option value="7">7%</option>
              <option value="13">13%</option>
              <option value="19">19% (Taux Standard)</option>
            </select>
          </div>
        </div>

        {/* RÉCAPITULATIF FINANCIER EN DIRECT */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2 shadow-sm">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Total HT ({state.items.length} article(s))</span>
            <span>{state.subtotalHt.toFixed(2)} DT</span>
          </div>
          {state.taxRate > 0 && (
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>TVA ({state.taxRate}%)</span>
              <span>{state.taxAmount.toFixed(2)} DT</span>
            </div>
          )}
          <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Net à Payer TTC
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {state.totalTtc.toFixed(2)} <span className="text-xs text-white/70">DT</span>
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 min-h-[44px]"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={state.handleSubmit}
            loading={state.saving}
            disabled={state.items.length === 0 || state.saving}
            className="flex-1 min-h-[44px] bg-primary font-black uppercase tracking-wider"
          >
            Émettre la Facture
          </Button>
        </div>
      </div>

      {/* MODALES D'AJOUT RAPIDE */}
      {isCatalogueOpen && (
        <CataloguePickerModal
          onClose={() => setIsCatalogueOpen(false)}
          onAddItem={state.addCatalogueItem}
        />
      )}

      {isDevisPickerOpen && (
        <DevisPickerModal
          availableDevis={state.unbilledDevis}
          allDevis={state.allUnbilledDevis}
          selectedClientId={state.selectedClientId}
          selectedClientName={
            currentClient
              ? `${currentClient.first_name || ''} ${currentClient.last_name || ''}`.trim()
              : clientName
          }
          loading={state.loadingSources}
          onClose={() => setIsDevisPickerOpen(false)}
          onImportDevis={state.importDevis}
        />
      )}

      {isInterventionsPickerOpen && (
        <InterventionsPickerModal
          interventions={state.unbilledInterventions}
          onClose={() => setIsInterventionsPickerOpen(false)}
          onImport={state.importInterventions}
        />
      )}

      {isClientModalOpen && (
        <ClientSelectionModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSelect={(c) => {
            state.handleClientChange(c.id);
            setIsClientModalOpen(false);
          }}
          selectedClientId={state.selectedClientId}
        />
      )}
    </ModalLayout>
  );
};

export default CreateInvoiceModal;
