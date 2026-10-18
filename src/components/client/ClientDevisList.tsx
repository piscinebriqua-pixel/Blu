import React from "react";
import { FileText, Edit2, Copy, Trash2 } from "lucide-react";
import type { Devis } from "./types";

interface ClientDevisListProps {
  devis: Devis[];
  onSelectDevis: (devis: Devis) => void;
  onEditDevis: (devisId: string) => void;
  onDuplicateDevis: (devis: Devis) => void;
  onDeleteDevis: (devis: Devis) => void;
}

export const ClientDevisList: React.FC<ClientDevisListProps> = ({
  devis,
  onSelectDevis,
  onEditDevis,
  onDuplicateDevis,
  onDeleteDevis,
}) => {
  if (devis.length === 0) {
    return (
      <div className="py-16 text-center bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
        <FileText size={44} className="mx-auto mb-3 text-slate-500" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Aucun devis enregistré
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devis.map((d) => (
        <div
          key={d.id}
          onClick={() => onSelectDevis(d)}
          className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:border-blue-500/50 hover:shadow-md transition-all gap-4"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                d.status === "closed"
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600"
                  : d.status === "cancelled"
                  ? "bg-rose-100 dark:bg-rose-950 text-rose-600"
                  : "bg-blue-100 dark:bg-blue-950 text-blue-600"
              }`}
            >
              <FileText size={22} />
            </div>
            <div>
              <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {d.title}
              </h5>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {d.number} • {new Date(d.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-left sm:text-right">
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {(d.total_amount || 0).toFixed(0)} DT
              </div>
              <span
                className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md inline-block ${
                  d.status === "closed"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : d.status === "cancelled"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                }`}
              >
                {d.status === "closed" ? "Terminé" : d.status === "cancelled" ? "Annulé" : "En cours"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditDevis(d.id);
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-black text-slate-600 hover:text-blue-600 border border-slate-200 dark:border-slate-700 uppercase flex items-center justify-center gap-1 shadow-sm transition-all"
                title="Modifier ce devis"
              >
                <Edit2 size={14} /> Modif.
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateDevis(d);
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-black text-slate-600 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 uppercase flex items-center justify-center gap-1 shadow-sm transition-all"
                title="Dupliquer ce devis"
              >
                <Copy size={14} /> Copier
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDevis(d);
                }}
                className="min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-black text-slate-600 hover:text-rose-600 border border-slate-200 dark:border-slate-700 uppercase flex items-center justify-center gap-1 shadow-sm transition-all"
                title="Supprimer ce devis"
              >
                <Trash2 size={14} /> Suppr.
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
