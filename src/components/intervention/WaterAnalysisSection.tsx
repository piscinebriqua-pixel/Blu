import React from "react";
import { FlaskConical, Waves, CheckSquare, Square, FileText, X } from "lucide-react";
import type { Devis, NewInterventionFormData } from "./types";

interface WaterAnalysisSectionProps {
  formData: NewInterventionFormData;
  setFormData: React.Dispatch<React.SetStateAction<NewInterventionFormData>>;
  availableDevis: Devis[];
}

const MAINTENANCE_TASKS = [
  { id: 'task_balai', label: 'Balai' },
  { id: 'task_lavage', label: 'Lavage' },
  { id: 'task_rincage', label: 'Rinçage' },
  { id: 'task_test_chlore', label: 'Test Chlore' },
  { id: 'task_test_ph', label: 'Test pH' },
  { id: 'task_remplissage', label: 'Remplissage' },
  { id: 'task_panier_prefiltre', label: 'Panier Pré-filtre' },
  { id: 'task_traitement', label: 'Traitement' },
  { id: 'task_verif_vanne', label: 'Vérification Vanne' },
  { id: 'task_temps_fonctionnement', label: 'Temps Fonct.' }
] as const;

export const WaterAnalysisSection: React.FC<WaterAnalysisSectionProps> = ({
  formData,
  setFormData,
  availableDevis
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. Devis Selection */}
      {availableDevis.length > 0 && (
        <div className="mt-2 p-5 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-500/20 rounded-[2rem] animate-in zoom-in duration-300">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={20} className="text-blue-500" />
            <h4 className="text-xs font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest">
              Lier à un Chantier / Devis
            </h4>
          </div>

          <div className="relative mb-4">
            <select
              title="Sélectionner un devis (Chantier)"
              className="w-full pl-10 pr-10 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all appearance-none text-sm"
              value={formData.devis_id}
              onChange={(e) => setFormData({ ...formData, devis_id: e.target.value })}
            >
              <option value="">-- Visite Classique (Hors Chantier) --</option>
              {availableDevis.map(d => (
                <option key={d.id} value={d.id}>{d.number} - {d.title}</option>
              ))}
            </select>
            {formData.devis_id && (
              <button
                type="button"
                title="Effacer la sélection"
                onClick={() => setFormData({ ...formData, devis_id: '', is_final_devis_billing: false })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <X size={16} strokeWidth={3} />
              </button>
            )}
          </div>

          {formData.devis_id && (
            <div className="flex items-center gap-3 p-1">
              <button
                type="button"
                title="Activer la facturation finale du devis"
                onClick={() => setFormData({ ...formData, is_final_devis_billing: !formData.is_final_devis_billing })}
                className={`w-11 h-6 rounded-full transition-all relative ${formData.is_final_devis_billing ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_final_devis_billing ? 'left-6' : 'left-1'}`} />
              </button>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Facturation Finale du Chantier
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Titre Analyse de l'eau */}
      <div className="flex items-center gap-3">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
        <div className="flex items-center gap-2 text-blue-500">
          <FlaskConical size={18} strokeWidth={2.5} />
          <span className="text-sm font-black uppercase tracking-[0.25em]">Analyse de l'eau</span>
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
      </div>

      {/* 3. Métriques physico-chimiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">pH</label>
          <input
            type="number"
            step="0.1"
            placeholder="7.2"
            className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-black text-center text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-sm text-lg"
            value={formData.ph_level}
            onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Chlore</label>
          <input
            type="number"
            step="0.1"
            placeholder="1.5"
            className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-black text-center text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-sm text-lg"
            value={formData.chlorine_level}
            onChange={(e) => setFormData({ ...formData, chlorine_level: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Température</label>
          <div className="relative">
            <input
              type="number"
              placeholder="28"
              className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-black text-center text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-sm placeholder:opacity-50 text-lg"
              value={formData.water_temp}
              onChange={(e) => setFormData({ ...formData, water_temp: e.target.value })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm pointer-events-none">°C</span>
          </div>
        </div>
      </div>

      {/* 4. Niveau d'eau */}
      <button
        type="button"
        onClick={() => setFormData({ ...formData, water_level_adjusted: !formData.water_level_adjusted })}
        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all min-h-[52px] ${
          formData.water_level_adjusted
            ? "bg-blue-500 border-blue-500 text-white shadow-lg"
            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${formData.water_level_adjusted ? "bg-white text-blue-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
            <Waves size={18} strokeWidth={3} />
          </div>
          <span className="text-sm font-black uppercase tracking-wider">Niveau d'eau ajusté</span>
        </div>
        {formData.water_level_adjusted ? <CheckSquare size={22} strokeWidth={3} /> : <Square size={22} strokeWidth={2.5} />}
      </button>

      {/* 5. Checklist des tâches d'entretien */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <CheckSquare size={18} className="text-blue-500" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tâches d'entretien effectuées
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MAINTENANCE_TASKS.map((task) => {
            const isChecked = Boolean(formData[task.id as keyof NewInterventionFormData]);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setFormData({ ...formData, [task.id]: !isChecked })}
                className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-all text-left min-h-[48px] ${
                  isChecked
                    ? "bg-blue-50/70 dark:bg-blue-900/20 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500/20"
                }`}
              >
                <span className="text-sm font-black uppercase tracking-tight">{task.label}</span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isChecked ? "bg-blue-500 text-white" : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"}`}>
                  {isChecked && <CheckSquare size={16} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
