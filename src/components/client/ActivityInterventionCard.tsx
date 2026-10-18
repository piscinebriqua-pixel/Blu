import React from "react";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { CalendarClock, CalendarPlus, CheckCircle2, Circle, Eye, Package } from "lucide-react";
import type { Intervention } from "./types";

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
  task_balai: "Balai",
  task_lavage: "Lavage filtre",
  task_rincage: "Rinçage filtre",
  task_test_chlore: "Test chlore",
  task_test_ph: "Test pH",
  task_remplissage: "Niveau eau",
  task_panier_prefiltre: "Panier préfiltre",
  task_traitement: "Traitement",
  task_verif_vanne: "Vannes",
  task_temps_fonctionnement: "Temps filtration",
};

interface Countdown {
  label: string;
  className: string;
}

/** Compte à rebours lisible pour une visite planifiée. */
function getCountdown(dateStr: string | null | undefined): Countdown | null {
  if (!dateStr) return null;
  const diff = differenceInCalendarDays(startOfDay(new Date(dateStr)), startOfDay(new Date()));
  if (diff < 0) {
    return {
      label: `En retard de ${Math.abs(diff)} j`,
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    };
  }
  if (diff === 0) return { label: "Aujourd'hui", className: "bg-blue-600 text-white" };
  if (diff === 1) return { label: "Demain", className: "bg-blue-600 text-white" };
  return {
    label: `Dans ${diff} jours`,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  };
}

interface ActivityInterventionCardProps {
  inter: Intervention;
  onSelect: (inter: Intervention) => void;
  /** Si fourni (visites à venir), affiche le bouton "Reporter". */
  onPostpone?: (inter: Intervention) => void;
}

/**
 * Carte d'activité d'une intervention.
 * - Réalisée : carte pleine, barre d'accent verte, pastille ✓, données mesurées.
 * - Planifiée : carte « ticket à venir » (bordure pointillée bleue), icône calendrier,
 *   compte à rebours, tâches prévues en pastilles vides.
 */
export const ActivityInterventionCard: React.FC<ActivityInterventionCardProps> = ({ inter, onSelect, onPostpone }) => {
  const isDone = inter.status === "completed";
  const techName = inter.technician?.full_name || "Technicien non assigné";
  const dateSource = (isDone ? inter.completed_date : null) || inter.scheduled_date || inter.created_at;
  const dateLabel = new Date(dateSource).toLocaleDateString("fr-FR");
  const countdown = isDone ? null : getCountdown(inter.scheduled_date);

  const checklist = (Object.keys(CHECKLIST_LABELS) as ChecklistKey[])
    .filter((key) => Boolean(inter[key]))
    .map((key) => CHECKLIST_LABELS[key]);
  const serviceNames = (inter.services?.map((s) => s.service?.name).filter(Boolean) as string[]) || [];
  const actions = [...serviceNames, ...checklist];

  // Le tag technique d'ancrage n'a aucun intérêt pour l'utilisateur
  const cleanNotes = (inter.notes || "").replace(/\[Ancrage:[^\]]*\]\s*/g, "").trim();

  return (
    <div
      onClick={() => onSelect(inter)}
      className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all active:scale-[0.99] space-y-2.5 p-3.5 ${
        isDone
          ? "pl-5 bg-white dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md hover:border-emerald-400"
          : "bg-blue-50/60 dark:bg-blue-950/20 border-2 border-dashed border-blue-300 dark:border-blue-800/70 hover:border-blue-500"
      }`}
    >
      {isDone && <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" aria-hidden="true" />}

      {/* En-tête */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isDone
                ? "bg-emerald-500 text-white"
                : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
            }`}
          >
            {isDone ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <CalendarClock size={18} strokeWidth={2.5} />}
          </div>
          <div className="min-w-0">
            <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
              {techName}
            </h5>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Bassin :{" "}
              <span className={`font-black ${isDone ? "text-emerald-700 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                {inter.pool_name || "Piscine Principale"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm font-black text-slate-800 dark:text-slate-200">{dateLabel}</span>
          {isDone ? (
            <span className="text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-600 text-white">
              Réalisée
            </span>
          ) : (
            <span className="text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              À venir
            </span>
          )}
        </div>
      </div>

      {/* Compte à rebours (planifiée uniquement) */}
      {countdown && (
        <span className={`inline-flex items-center text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${countdown.className}`}>
          {countdown.label}
        </span>
      )}

      {/* Tâches */}
      {actions.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {isDone ? "Actions réalisées :" : "Tâches prévues :"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {actions.map((action, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${
                  isDone
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/40"
                    : "bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle size={14} className="text-blue-400 shrink-0" />
                )}
                {action}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Produits consommés */}
      {inter.products && inter.products.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Package size={14} /> Produits :
          </span>
          {inter.products.map((p, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-200/50 dark:border-amber-800/40"
            >
              {p.product.name} ({p.quantity} {p.product.unit})
            </span>
          ))}
        </div>
      )}

      {/* Chimie de l'eau */}
      {(inter.ph_level || inter.chlorine_level) && (
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 pt-0.5">
          {inter.ph_level && (
            <span>
              pH : <strong className="text-slate-900 dark:text-white font-black">{inter.ph_level}</strong>
            </span>
          )}
          {inter.chlorine_level && (
            <span>
              Chlore : <strong className="text-slate-900 dark:text-white font-black">{inter.chlorine_level} ppm</strong>
            </span>
          )}
        </div>
      )}

      {/* Note */}
      {cleanNotes && (
        <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 pt-0.5 border-t border-slate-200/50 dark:border-slate-700/40">
          "{cleanNotes}"
        </p>
      )}

      {/* Actions tactiles (visites à venir) */}
      {!isDone && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(inter);
            }}
            className="min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all"
          >
            <Eye size={16} /> Voir
          </button>
          {onPostpone && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPostpone(inter);
              }}
              className="min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-xs font-black uppercase tracking-wider active:scale-95 transition-all"
            >
              <CalendarPlus size={16} /> Reporter
            </button>
          )}
        </div>
      )}
    </div>
  );
};
