import React, { useState } from 'react';
import ModalLayout from '../ModalLayout';
import type { UnbilledIntervention } from '../../services/invoiceService';
import { Calendar, CheckSquare, Square, Plus } from 'lucide-react';

interface InterventionsPickerModalProps {
  interventions: UnbilledIntervention[];
  onClose: () => void;
  onImport: (selected: UnbilledIntervention[]) => void;
}

export const InterventionsPickerModal: React.FC<InterventionsPickerModalProps> = ({
  interventions,
  onClose,
  onImport,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    interventions.map((i) => i.id)
  );

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === interventions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(interventions.map((i) => i.id));
    }
  };

  const handleValidate = () => {
    const selected = interventions.filter((i) => selectedIds.includes(i.id));
    onImport(selected);
    onClose();
  };

  return (
    <ModalLayout
      title="Importer des Passages d'Entretien"
      onClose={onClose}
      className="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">
            Cochez les passages terminés à intégrer dans la facture.
          </p>
          {interventions.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="min-h-[44px] px-2 text-xs font-black text-primary uppercase flex items-center gap-1.5"
            >
              {selectedIds.length === interventions.length ? (
                <>
                  <CheckSquare size={16} /> Tout désélectionner
                </>
              ) : (
                <>
                  <Square size={16} /> Tout cocher
                </>
              )}
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {interventions.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
              <Calendar size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Aucun passage d'entretien
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tous les passages de ce client sont déjà facturés ou aucun passage n'est terminé.
              </p>
            </div>
          ) : (
            interventions.map((inter) => {
              const isChecked = selectedIds.includes(inter.id);
              const dateStr = inter.completed_date
                ? new Date(inter.completed_date).toLocaleDateString('fr-FR')
                : new Date(inter.scheduled_date).toLocaleDateString('fr-FR');

              return (
                <div
                  key={inter.id}
                  onClick={() => toggleOne(inter.id)}
                  className={`min-h-[52px] p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    isChecked
                      ? 'border-primary/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center text-primary">
                      {isChecked ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                        {inter.pool_name} • {dateStr}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 truncate max-w-xs">
                        {inter.details || 'Passage classique'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white shrink-0">
                    {Number(inter.total_amount).toFixed(2)} DT
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase text-slate-700 dark:text-slate-300"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleValidate}
            className="min-h-[44px] px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={16} /> Importer ({selectedIds.length})
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};
