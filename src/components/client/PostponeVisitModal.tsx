import React, { useState } from "react";
import { addDays, format } from "date-fns";
import { toast } from "react-hot-toast";
import { CalendarClock } from "lucide-react";
import ModalLayout from "../ModalLayout";
import { postponeTourIntervention } from "../../lib/recurrenceService";
import type { Intervention } from "./types";

interface PostponeVisitModalProps {
  inter: Intervention;
  onClose: () => void;
  onDone: () => void;
}

/** Modale de report d'une visite planifiée (date + motif obligatoire). */
export const PostponeVisitModal: React.FC<PostponeVisitModalProps> = ({ inter, onClose, onDone }) => {
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = newDate !== "" && reason.trim().length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await postponeTourIntervention(inter.id, newDate, reason, inter.notes);
      toast.success("Visite reportée");
      onDone();
      onClose();
    } catch (error) {
      console.error("Erreur report visite:", error);
      toast.error("Impossible de reporter la visite");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalLayout
      title="Reporter la visite"
      onClose={onClose}
      compact
      actions={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
          >
            <CalendarClock size={16} />
            {saving ? "Report..." : "Confirmer"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Nouvelle date
          </label>
          <input
            type="date"
            min={format(new Date(), "yyyy-MM-dd")}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Motif (obligatoire)
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex : client absent, mauvais temps..."
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Le jour de passage habituel du contrat n'est pas modifié : seule cette visite est déplacée.
        </p>
      </div>
    </ModalLayout>
  );
};
