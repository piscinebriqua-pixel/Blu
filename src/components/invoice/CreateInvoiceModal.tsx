import React from 'react';
import ModalLayout from '../ModalLayout';
import Button from '../ui/Button';
import { useCreateInvoiceState } from './useCreateInvoiceState';
import { InvoiceItemsSelector } from './InvoiceItemsSelector';
import { User, Hash } from 'lucide-react';

interface CreateInvoiceModalProps {
  clientId?: string;
  clientName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  clientId,
  clientName,
  onClose,
  onSuccess,
}) => {
  const state = useCreateInvoiceState(clientId, clientName, () => {
    onSuccess();
    onClose();
  });

  const isGlobalMode = !clientId;
  const currentClient = isGlobalMode
    ? state.availableClients.find((c) => c.id === state.selectedClientId)
    : null;

  return (
    <ModalLayout
      title="Émettre une Facture"
      onClose={onClose}
      className="max-w-2xl !min-h-0"
    >
      <div className="space-y-5 pb-2">
        {/* BANDEAU CONTEXTE / SOUS-TITRE */}
        <div className="px-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {clientName
            ? `Client : ${clientName}`
            : currentClient
            ? `Client : ${currentClient.first_name} ${currentClient.last_name}`
            : 'Sélectionnez un client pour facturer ses prestations'}
        </div>

        {/* EN-TÊTE : NUMÉRO DE FACTURE & CLIENT (SI MODE GLOBAL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          {/* Numéro de facture éditable */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Numéro de Facture
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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

          {/* Sélecteur de client si ouvert depuis la page globale */}
          {isGlobalMode ? (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                Client à facturer *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={16} />
                </span>
                <select
                  value={state.selectedClientId}
                  onChange={(e) => state.handleClientChange(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
                >
                  <option value="">-- Choisir un client --</option>
                  {state.availableClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
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

        {/* Message d'attente de sélection client si mode global */}
        {isGlobalMode && !state.selectedClientId ? (
          <div className="min-h-[52px] p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/40">
            <User className="text-primary shrink-0" size={20} />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Veuillez sélectionner un client dans la liste ci-dessus pour charger ses prestations non facturées.
            </p>
          </div>
        ) : (
          <>
            {/* SOUS-COMPOSANT SÉLECTEUR D'ARTICLES ET PRESTATIONS */}
            <InvoiceItemsSelector state={state} />

            {/* PARAMÈTRES TVA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {isGlobalMode && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Taux de TVA (%)
                </label>
                <select
                  value={state.taxRate}
                  onChange={(e) => state.setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
                >
                  <option value="0">0% (Exonéré / Sans TVA)</option>
                  <option value="7">7%</option>
                  <option value="13">13%</option>
                  <option value="19">19% (Taux Standard)</option>
                </select>
              </div>
            </div>

            {/* RÉCAPITULATIF FINANCIER EN DIRECT */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Total HT ({state.invoiceItems.length} prestation(s))</span>
                <span>{state.subtotalHt.toFixed(3)} DT</span>
              </div>
              {state.taxRate > 0 && (
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>TVA ({state.taxRate}%)</span>
                  <span>{state.taxAmount.toFixed(3)} DT</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-wider text-white">Net à Payer TTC</span>
                <span className="text-2xl font-black text-emerald-400">
                  {state.totalTtc.toFixed(3)} <span className="text-xs text-white/70">DT</span>
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
                disabled={state.invoiceItems.length === 0 || state.saving}
                className="flex-1 min-h-[44px] bg-primary font-black uppercase tracking-wider"
              >
                Valider la Facture
              </Button>
            </div>
          </>
        )}
      </div>
    </ModalLayout>
  );
};
export default CreateInvoiceModal;
