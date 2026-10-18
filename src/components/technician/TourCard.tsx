import React from 'react';
import { Check, Clock, Droplets, MapPin, MessageCircle, Navigation, Play, AlertCircle } from 'lucide-react';
import { openWhatsAppChat } from '../../lib/phoneUtils';

export interface TourIntervention {
  id: string;
  pool_id: string;
  scheduled_date: string;
  status: string;
  notes?: string | null;
  pool?: {
    id?: string;
    name?: string;
    client?: {
      id?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      address?: string;
      city?: string;
    };
  };
}

interface TourCardProps {
  intervention: TourIntervention;
  idx: number;
  onQuickComplete: (inter: TourIntervention) => void;
  onOpenUnvisitedModal: (inter: TourIntervention) => void;
  onStartFullReport: (inter: TourIntervention) => void;
}

export const TourCard: React.FC<TourCardProps> = ({
  intervention,
  idx,
  onQuickComplete,
  onOpenUnvisitedModal,
  onStartFullReport,
}) => {
  const client = intervention.pool?.client;
  const fullAddress = `${client?.address || ''}${client?.city ? `, ${client.city}` : ''}`.trim();
  const isCompleted = intervention.status === 'completed';

  const runNavigation = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div
      className={`card-white flex flex-col !items-stretch p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border-none rounded-[22px] sm:rounded-[28px] group animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards dark:bg-slate-800/60 ${
        idx < 10 ? `stagger-${idx + 1}` : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-lg ${
              isCompleted
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-blue-600 text-white shadow-blue-600/20'
            }`}
          >
            {isCompleted ? (
              <Droplets size={22} className="sm:size-[28px]" strokeWidth={2.5} />
            ) : (
              <Clock size={22} className="sm:size-[28px]" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight truncate">
              {client?.first_name} {client?.last_name}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none truncate">
                {intervention.pool?.name || 'Bassin principal'}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            isCompleted
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}
        >
          {isCompleted ? 'Terminé' : 'À Visiter'}
        </div>
      </div>

      {/* Adresse */}
      <div className="flex flex-col gap-3 mb-4 bg-slate-50/50 dark:bg-slate-900/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100/50 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
              Destination
            </span>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
              {fullAddress || 'Adresse non renseignée'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions Tactiles */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {fullAddress && (
          <button
            type="button"
            onClick={() => runNavigation(fullAddress)}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95"
            title="Itinéraire GPS"
          >
            <Navigation size={20} strokeWidth={2.5} />
          </button>
        )}

        {client?.phone && (
          <button
            type="button"
            onClick={() => openWhatsAppChat(client.phone || '')}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 text-slate-500 hover:text-emerald-500 rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95"
            title="WhatsApp"
          >
            <MessageCircle size={20} strokeWidth={2.5} />
          </button>
        )}

        {!isCompleted && (
          <>
            {/* Bouton "Non visité / Signaler" */}
            <button
              type="button"
              onClick={() => onOpenUnvisitedModal(intervention)}
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider active:scale-95 transition-all"
              title="Signaler un imprévu ou reporter"
            >
              <AlertCircle size={16} className="text-amber-500" />
              <span>Non visité</span>
            </button>

            {/* Bouton "Démarrer rapport complet" */}
            <button
              type="button"
              onClick={() => onStartFullReport(intervention)}
              className="min-h-[44px] px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center gap-1 text-xs font-black uppercase tracking-wider active:scale-95 transition-all"
              title="Remplir le rapport technique complet"
            >
              <Play size={14} fill="currentColor" strokeWidth={0} />
              <span className="hidden sm:inline">Rapport</span>
            </button>

            {/* Bouton Validation Rapide en 1 clic (Cocher) */}
            <button
              type="button"
              onClick={() => onQuickComplete(intervention)}
              className="flex-1 min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              title="Valider la visite terminée"
            >
              <Check size={18} strokeWidth={3} />
              <span className="text-xs font-black uppercase tracking-wider">Cocher Visité</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
