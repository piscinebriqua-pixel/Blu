import React from 'react';
import ModalLayout from '../ModalLayout';
import Button from '../ui/Button';
import { useCreateInvoiceState } from './useCreateInvoiceState';
import { 
  FileText, 
  CheckSquare, 
  Square, 
  Calendar, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  AlertCircle,
  Receipt
} from 'lucide-react';

interface CreateInvoiceModalProps {
  clientId: string;
  clientName: string;
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

  return (
    <ModalLayout
      title="Émettre une Facture"
      subtitle={`Client : ${clientName}`}
      icon={<Receipt className="text-primary" size={24} />}
      onClose={onClose}
      className="max-w-2xl !min-h-0"
    >
      <div className="space-y-6 pb-2">
        {/* Sélecteur de Type de Facturation (Touch target 44px) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => state.setInvoiceType('interventions')}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              state.invoiceType === 'interventions'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Calendar size={16} />
            Passages ({state.unbilledInterventions.length})
          </button>
          <button
            type="button"
            onClick={() => state.setInvoiceType('devis')}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              state.invoiceType === 'devis'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet size={16} />
            Devis ({state.unbilledDevis.length})
          </button>
        </div>

        {/* SECTION 1 : INTERVENTIONS NON FACTURÉES */}
        {state.invoiceType === 'interventions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Passages terminés non facturés
              </span>
              {state.unbilledInterventions.length > 0 && (
                <button
                  type="button"
                  onClick={state.toggleSelectAllInterventions}
                  className="min-h-[44px] px-3 flex items-center gap-1.5 text-xs font-black text-primary uppercase"
                >
                  {state.selectedInterventionIds.length === state.unbilledInterventions.length ? (
                    <><CheckSquare size={16} /> Tout désélectionner</>
                  ) : (
                    <><Square size={16} /> Tout sélectionner</>
                  )}
                </button>
              )}
            </div>

            {state.unbilledInterventions.length === 0 ? (
              <div className="min-h-[52px] px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-xs font-semibold text-slate-500">
                  Aucun passage d'entretien en attente de facturation pour ce client.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {state.unbilledInterventions.map((inter) => {
                  const isChecked = state.selectedInterventionIds.includes(inter.id);
                  const dateStr = inter.completed_date
                    ? new Date(inter.completed_date).toLocaleDateString('fr-FR')
                    : new Date(inter.scheduled_date).toLocaleDateString('fr-FR');

                  return (
                    <div
                      key={inter.id}
                      onClick={() => state.toggleIntervention(inter.id)}
                      className={`min-h-[48px] p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-primary/50 bg-blue-50/40 dark:bg-blue-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center text-primary">
                          {isChecked ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                            {inter.pool_name} • {dateStr}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 truncate max-w-xs">
                            {inter.details}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white shrink-0">
                        {Number(inter.total_amount).toFixed(3)} DT
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2 : DEVIS NON FACTURÉS */}
        {state.invoiceType === 'devis' && (
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Choisir le devis à facturer
            </span>

            {state.unbilledDevis.length === 0 ? (
              <div className="min-h-[52px] px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-xs font-semibold text-slate-500">
                  Aucun devis non facturé disponible pour ce client.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {state.unbilledDevis.map((d) => {
                  const isSelected = state.selectedDevisId === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => state.setSelectedDevisId(d.id)}
                      className={`min-h-[52px] p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-primary/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center text-primary">
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white">
                            Devis n° {d.number}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {d.title}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white shrink-0">
                        {Number(d.total_amount).toFixed(3)} DT
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Lignes personnalisées additionnelles */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              Lignes manuelles d'ajustement
            </span>
            <button
              type="button"
              onClick={state.addCustomItem}
              className="min-h-[44px] px-3 flex items-center gap-1 text-xs font-black text-primary uppercase"
            >
              <Plus size={16} /> Ajouter une ligne
            </button>
          </div>

          {state.customItems.map((cItem, idx) => (
            <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                placeholder="Description de la prestation"
                value={cItem.description}
                onChange={(e) => state.updateCustomItem(idx, 'description', e.target.value)}
                className="flex-1 min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold"
              />
              <input
                type="number"
                placeholder="Montant DT"
                value={cItem.unitPrice || ''}
                onChange={(e) => state.updateCustomItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                className="w-28 min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold text-right"
              />
              <button
                type="button"
                onClick={() => state.removeCustomItem(idx)}
                className="w-11 h-11 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* PARAMÈTRES DE LA FACTURE & TVA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date de Facturation
            </label>
            <input
              type="date"
              value={state.invoiceDate}
              onChange={(e) => state.setInvoiceDate(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Taux de TVA (%)
            </label>
            <select
              value={state.taxRate}
              onChange={(e) => state.setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold"
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
            <span>Total HT ({state.invoiceItems.length} article(s))</span>
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
            isLoading={state.saving}
            disabled={state.invoiceItems.length === 0 || state.saving}
            className="flex-1 min-h-[44px] bg-primary font-black uppercase tracking-wider"
          >
            Valider la Facture
          </Button>
        </div>
      </div>
    </ModalLayout>
  );
};
export default CreateInvoiceModal;
