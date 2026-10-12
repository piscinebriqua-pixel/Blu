import React, { useState } from 'react';
import ModalLayout from '../ModalLayout';
import { Calendar, XCircle, PauseCircle, Clock, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { addDays, format } from 'date-fns';

interface TourUnvisitedModalProps {
  intervention: {
    id: string;
    pool_id: string;
    scheduled_date: string;
    notes?: string | null;
    pool?: {
      name?: string;
      client?: {
        first_name?: string;
        last_name?: string;
      };
    };
  };
  onClose: () => void;
  onPostpone: (newDate: string, reason: string) => Promise<void>;
  onMarkUnvisited: (reason: string) => Promise<void>;
  onCancelVisit: (reason: string) => Promise<void>;
  onSuspendLoop: (reason: string) => Promise<void>;
}

const QUICK_REASONS = [
  'Portail verrouillé',
  'Client absent',
  'Intempéries / Météo',
  'Chien en liberté',
  'Accès impossible',
  'Client injoignable'
];

export const TourUnvisitedModal: React.FC<TourUnvisitedModalProps> = ({
  intervention,
  onClose,
  onPostpone,
  onMarkUnvisited,
  onCancelVisit,
  onSuspendLoop,
}) => {
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState<'pending' | 'postpone' | 'cancel' | 'suspend'>('pending');
  const [postponeDate, setPostponeDate] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  const clientName = `${intervention.pool?.client?.first_name || ''} ${intervention.pool?.client?.last_name || ''}`.trim() || 'Client';

  const handleApply = async () => {
    if (!reason.trim()) {
      toast.error('Veuillez saisir un motif ou choisir un motif rapide');
      return;
    }

    setLoading(true);
    try {
      if (decision === 'pending') {
        await onMarkUnvisited(reason);
        toast.success('Visite conservée dans la liste des non-visités');
      } else if (decision === 'postpone') {
        if (!postponeDate) {
          toast.error('Veuillez sélectionner une date de report');
          setLoading(false);
          return;
        }
        await onPostpone(postponeDate, reason);
        toast.success(`Visite reportée au ${format(new Date(postponeDate), 'dd/MM/yyyy')}`);
      } else if (decision === 'cancel') {
        await onCancelVisit(reason);
        toast.success('Visite ponctuelle annulée. Prochain cycle maintenu.');
      } else if (decision === 'suspend') {
        await onSuspendLoop(reason);
        toast.success('Boucle de contrat suspendue');
      }
      onClose();
    } catch (err: any) {
      console.error('Erreur arbitrage visite:', err);
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalLayout
      title={`Non visité : ${clientName}`}
      onClose={onClose}
      actions={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
            disabled={loading}
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 min-h-[44px] px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Motif rapide */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Motif de non-passage (Obligatoire)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  reason === r
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Précisez la situation ou un détail particulier..."
            rows={2}
            className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Décision du technicien */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Action à appliquer
          </label>
          <div className="grid grid-cols-1 gap-2">
            {/* Option 1: Laisser en attente */}
            <button
              type="button"
              onClick={() => setDecision('pending')}
              className={`min-h-[52px] flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                decision === 'pending'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase">Garder en attente (Sans reporter)</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Reste visible en permanence dans vos alertes de non-visités
                  </span>
                </div>
              </div>
              {decision === 'pending' && <Check size={18} className="text-amber-600 shrink-0" />}
            </button>

            {/* Option 2: Reporter */}
            <button
              type="button"
              onClick={() => setDecision('postpone')}
              className={`min-h-[52px] flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                decision === 'postpone'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-200'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase">Reporter à une date ultérieure</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Fixe un passage précis sans décaler l'ancre nominale future
                  </span>
                </div>
              </div>
              {decision === 'postpone' && <Check size={18} className="text-blue-600 shrink-0" />}
            </button>

            {/* Choix de date de report si sélectionné */}
            {decision === 'postpone' && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-blue-800 dark:text-blue-300">
                  Nouvelle date de passage
                </label>
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={postponeDate}
                  onChange={(e) => setPostponeDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl text-base font-bold text-slate-800 dark:text-white"
                />
              </div>
            )}

            {/* Option 3: Annuler */}
            <button
              type="button"
              onClick={() => setDecision('cancel')}
              className={`min-h-[52px] flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                decision === 'cancel'
                  ? 'bg-rose-500/10 border-rose-500 text-rose-900 dark:text-rose-200'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase">Annuler uniquement cette visite</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Annule ce passage, la prochaine visite aura lieu au cycle suivant
                  </span>
                </div>
              </div>
              {decision === 'cancel' && <Check size={18} className="text-rose-600 shrink-0" />}
            </button>

            {/* Option 4: Suspendre la boucle */}
            <button
              type="button"
              onClick={() => setDecision('suspend')}
              className={`min-h-[52px] flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                decision === 'suspend'
                  ? 'bg-slate-600/10 border-slate-500 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <PauseCircle size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase">Suspendre la boucle des visites</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Met en pause le contrat récurrent jusqu'à réactivation
                  </span>
                </div>
              </div>
              {decision === 'suspend' && <Check size={18} className="text-slate-600 shrink-0" />}
            </button>
          </div>
        </div>
      </div>
    </ModalLayout>
  );
};
