import React, { useMemo, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { ActivityInterventionCard } from "./ActivityInterventionCard";
import { PostponeVisitModal } from "./PostponeVisitModal";
import type { Intervention } from "./types";

type TabKey = "upcoming" | "done";

interface ActivityTimelineProps {
  interventions: Intervention[];
  onSelect: (inter: Intervention) => void;
  onRefresh: () => void;
}

const dateMs = (i: Intervention) =>
  new Date((i.status === "completed" ? i.completed_date : null) || i.scheduled_date || i.created_at).getTime();

/** Pastille de comptage dans les en-têtes de section. */
const CountBadge: React.FC<{ n: number; tone: "blue" | "green" }> = ({ n, tone }) => (
  <span
    className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-black ${
      tone === "blue" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
    }`}
  >
    {n}
  </span>
);

/** Ligne vide compacte (< 80px) conforme à la règle "zero-waste". */
const EmptyRow: React.FC<{ label: string }> = ({ label }) => (
  <div className="min-h-[52px] flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-wider text-slate-500">
    {label}
  </div>
);

/**
 * Activité d'un client adaptée mobile / tablette :
 * - smartphone : deux onglets (À venir / Réalisées), un seul panneau visible
 * - tablette (md+) : deux colonnes côte à côte, sans onglets
 */
export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ interventions, onSelect, onRefresh }) => {
  const upcoming = useMemo(
    () => interventions.filter((i) => i.status === "scheduled").sort((a, b) => dateMs(a) - dateMs(b)).slice(0, 3),
    [interventions]
  );
  const done = useMemo(
    () => interventions.filter((i) => i.status === "completed").sort((a, b) => dateMs(b) - dateMs(a)).slice(0, 3),
    [interventions]
  );
  const upcomingTotal = useMemo(() => interventions.filter((i) => i.status === "scheduled").length, [interventions]);
  const doneTotal = useMemo(() => interventions.filter((i) => i.status === "completed").length, [interventions]);

  const [tab, setTab] = useState<TabKey>(upcoming.length > 0 || done.length === 0 ? "upcoming" : "done");
  const [toPostpone, setToPostpone] = useState<Intervention | null>(null);

  if (interventions.length === 0) {
    return (
      <div className="min-h-[52px] flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-wider text-slate-500">
        <HistoryIcon size={16} /> Aucune activité enregistrée
      </div>
    );
  }

  const tabClass = (active: boolean, tone: "blue" | "green") =>
    `flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] ${
      active
        ? tone === "blue"
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-emerald-600 text-white shadow-sm"
        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
    }`;

  return (
    <>
      {/* Onglets : smartphone uniquement */}
      <div className="md:hidden flex gap-2 mb-4" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "upcoming"} onClick={() => setTab("upcoming")} className={tabClass(tab === "upcoming", "blue")}>
          À venir ({upcomingTotal})
        </button>
        <button type="button" role="tab" aria-selected={tab === "done"} onClick={() => setTab("done")} className={tabClass(tab === "done", "green")}>
          Réalisées ({doneTotal})
        </button>
      </div>

      <div className="md:grid md:grid-cols-5 md:gap-6">
        {/* Colonne À venir */}
        <section className={`${tab === "upcoming" ? "block" : "hidden"} md:block md:col-span-3`}>
          <h5 className="hidden md:flex items-center gap-2 mb-3 text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Prochaines visites <CountBadge n={upcomingTotal} tone="blue" />
          </h5>
          <div className="space-y-3.5">
            {upcoming.length > 0 ? (
              upcoming.map((inter) => (
                <ActivityInterventionCard key={inter.id} inter={inter} onSelect={onSelect} onPostpone={setToPostpone} />
              ))
            ) : (
              <EmptyRow label="Aucune visite planifiée" />
            )}
          </div>
        </section>

        {/* Colonne Réalisées */}
        <section className={`${tab === "done" ? "block" : "hidden"} md:block md:col-span-2`}>
          <h5 className="hidden md:flex items-center gap-2 mb-3 text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Historique réalisé <CountBadge n={doneTotal} tone="green" />
          </h5>
          <div className="space-y-3.5">
            {done.length > 0 ? (
              done.map((inter) => <ActivityInterventionCard key={inter.id} inter={inter} onSelect={onSelect} />)
            ) : (
              <EmptyRow label="Aucune visite réalisée" />
            )}
          </div>
        </section>
      </div>

      {toPostpone && (
        <PostponeVisitModal inter={toPostpone} onClose={() => setToPostpone(null)} onDone={onRefresh} />
      )}
    </>
  );
};
