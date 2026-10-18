import React from "react";
import { History as HistoryIcon, User, Wrench, CheckCircle2, Package, FileText, ChevronRight, Droplets } from "lucide-react";
import type { Intervention } from "./types";

interface ClientInterventionsListProps {
  interventions: Intervention[];
  totalIntersAmount: number;
  filter: "all" | "paid" | "unpaid";
  setFilter: (filter: "all" | "paid" | "unpaid") => void;
  onSelectIntervention: (intervention: Intervention) => void;
}

type ChecklistKey =
  | "task_balai"
  | "task_lavage"
  | "task_rincage"
  | "task_test_chlore"
  | "task_test_ph"
  | "task_remplissage"
  | "task_panier_prefiltre"
  | "task_traitement"
  | "task_verif_vanne"
  | "task_temps_fonctionnement";

const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  task_balai: "Passage balai",
  task_lavage: "Lavage filtre",
  task_rincage: "Rinçage filtre",
  task_test_chlore: "Analyse chlore",
  task_test_ph: "Analyse pH",
  task_remplissage: "Niveau d'eau",
  task_panier_prefiltre: "Panier préfiltre",
  task_traitement: "Traitement chimique",
  task_verif_vanne: "Contrôle vannes",
  task_temps_fonctionnement: "Temps filtration",
};

export const ClientInterventionsList: React.FC<ClientInterventionsListProps> = ({
  interventions,
  totalIntersAmount,
  filter,
  setFilter,
  onSelectIntervention,
}) => {
  return (
    <div className="space-y-6">
      {/* Résumé d'en-tête */}
      <div className="bg-indigo-50/70 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-800/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <HistoryIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Cumul des Travaux
            </p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white">
              {totalIntersAmount.toFixed(0)} <span className="text-sm opacity-60">DT</span>
            </h4>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Fréquence</p>
          <h4 className="text-2xl font-black text-slate-800 dark:text-white">
            {interventions.length} <span className="text-sm opacity-60">Visites</span>
          </h4>
        </div>
      </div>

      {/* Onglets Filtres */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            filter === "all"
              ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Toutes
        </button>
        <button
          type="button"
          onClick={() => setFilter("unpaid")}
          className={`min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            filter === "unpaid"
              ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          À payer / Partiel
        </button>
        <button
          type="button"
          onClick={() => setFilter("paid")}
          className={`min-h-[44px] flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            filter === "paid"
              ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Payées
        </button>
      </div>

      {/* Liste des interventions */}
      {interventions.length > 0 ? (
        <div className="relative before:absolute before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          {interventions.map((inter) => {
            const sTotal = inter.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0;
            const pTotal = inter.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0;
            const totalBilled = sTotal + pTotal;
            const remaining = totalBilled - (inter.paid_amount || 0);

            const isPaid = remaining <= 0.5;
            const isPartial = !isPaid && (inter.paid_amount || 0) > 0;

            const completedTasks = (Object.keys(CHECKLIST_LABELS) as ChecklistKey[])
              .filter((key) => Boolean(inter[key]))
              .map((key) => CHECKLIST_LABELS[key]);

            const hasServices = inter.services && inter.services.length > 0;
            const hasProducts = inter.products && inter.products.length > 0;
            const techName = inter.technician?.full_name;

            return (
              <div
                key={inter.id}
                onClick={() => onSelectIntervention(inter)}
                className="relative pl-14 mb-5 group cursor-pointer"
              >
                <div className="absolute left-[22px] top-6 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-[3.5px] border-slate-300 dark:border-slate-600 group-hover:border-indigo-500 group-hover:scale-125 transition-all z-10" />
                
                <div className="bg-white dark:bg-slate-800/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-500/50 hover:shadow-md transition-all shadow-sm space-y-3.5">
                  
                  {/* Ligne 1 : Date, Bassin, Technicien et Statuts */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {new Date((inter.status === "completed" ? inter.completed_date : null) || inter.scheduled_date || inter.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 uppercase">
                          {inter.pool_name || "Bassin"}
                        </span>
                      </div>

                      {/* Technicien badge */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                          <User size={12} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {techName ? `Intervenant : ${techName}` : "Intervenant non assigné"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider border ${
                            inter.status === "completed"
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700"
                          }`}
                        >
                          {inter.status === "completed" ? "Réalisée" : "Planifiée"}
                        </span>

                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                            isPaid
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : isPartial
                              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isPaid ? "Payé" : isPartial ? "Partiel" : "À payer"}
                        </span>
                      </div>

                      {totalBilled > 0 && (
                        <div className="flex items-center gap-1 text-xs font-black">
                          <span className="text-slate-700 dark:text-slate-300">{totalBilled.toFixed(0)} DT</span>
                          {remaining > 0.5 && (
                            <span className="text-rose-600 dark:text-rose-400">
                              ({remaining.toFixed(0)} DT restants)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ligne 2 : Actions et Services Réalisés */}
                  {(hasServices || completedTasks.length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Wrench size={13} className="text-blue-500" /> Travaux & Protocole effectués :
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {/* Services facturés */}
                        {inter.services?.map((s, idx) => (
                          <span
                            key={`srv-${idx}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-bold border border-blue-200/60 dark:border-blue-800/50"
                          >
                            <Wrench size={12} className="text-blue-600 dark:text-blue-400" />
                            {s.service?.name || "Service"}
                            {s.price_at_time > 0 && (
                              <span className="opacity-80 font-normal">({s.price_at_time} DT)</span>
                            )}
                          </span>
                        ))}

                        {/* Tâches du protocole cochées */}
                        {completedTasks.map((taskName, idx) => (
                          <span
                            key={`task-${idx}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/40"
                          >
                            <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                            {taskName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ligne 3 : Produits Injectés / Ajoutés */}
                  {hasProducts && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Package size={13} className="text-amber-500" /> Traitement & Produits consommés :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {inter.products?.map((p, idx) => (
                          <span
                            key={`prd-${idx}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-200/60 dark:border-amber-800/40"
                          >
                            {p.product?.name || "Produit"}
                            <span className="text-amber-700 dark:text-amber-400 font-bold ml-0.5">
                              • {p.quantity} {p.product?.unit || ""}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ligne 4 : Paramètres de l'eau (pH & Chlore) */}
                  {(inter.ph_level || inter.chlorine_level) && (
                    <div className="flex items-center gap-5 pt-2 text-xs font-bold border-t border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Droplets size={14} className="text-cyan-500" />
                        <span>Chimie de l'eau :</span>
                      </div>
                      {inter.ph_level && (
                        <span className="text-slate-700 dark:text-slate-300">
                          pH : <strong className="text-slate-900 dark:text-white font-black">{inter.ph_level}</strong>
                        </span>
                      )}
                      {inter.chlorine_level && (
                        <span className="text-slate-700 dark:text-slate-300">
                          Chlore : <strong className="text-slate-900 dark:text-white font-black">{inter.chlorine_level} ppm</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Ligne 5 : Note / Observation terrain */}
                  {inter.notes && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700 flex items-start gap-2.5">
                      <FileText size={15} className="text-slate-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium italic">
                        "{inter.notes}"
                      </p>
                    </div>
                  )}

                  {/* Lien visuel vers le rapport complet */}
                  <div className="flex items-center justify-end gap-1 text-xs font-black text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform pt-1">
                    <span>Voir rapport détaillé</span>
                    <ChevronRight size={14} />
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
          <HistoryIcon size={44} className="mx-auto text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Aucun historique technique
          </p>
        </div>
      )}
    </div>
  );
};
