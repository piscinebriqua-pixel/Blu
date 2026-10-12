import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Check, Calendar, MapPin, MessageCircle, Navigation } from 'lucide-react';
import { openWhatsAppChat } from '../../lib/phoneUtils';

interface BacklogIntervention {
  id: string;
  pool_id: string;
  scheduled_date: string;
  status: string;
  notes?: string | null;
  pool?: {
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

interface TourUnvisitedBacklogProps {
  unvisitedList: BacklogIntervention[];
  onQuickComplete: (inter: BacklogIntervention) => void;
  onOpenArbitrageModal: (inter: BacklogIntervention) => void;
}

export const TourUnvisitedBacklog: React.FC<TourUnvisitedBacklogProps> = ({
  unvisitedList,
  onQuickComplete,
  onOpenArbitrageModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (unvisitedList.length === 0) return null;

  const runNavigation = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/30 rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 transition-all shadow-lg shadow-amber-500/5">
      {/* Header cliquable pour replier/déplier */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <AlertTriangle size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-amber-950 dark:text-amber-200 uppercase tracking-tight">
                Non Visités / En Attente
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-black">
                {unvisitedList.length}
              </span>
            </div>
            <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-300/80">
              Clients en attente d'arbitrage ou de rattrapage
            </p>
          </div>
        </div>

        <button
          type="button"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 transition-colors"
          title={isExpanded ? 'Réduire' : 'Développer'}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Liste des fiches clients non visités */}
      {isExpanded && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-amber-500/20">
          {unvisitedList.map((inter) => {
            const client = inter.pool?.client;
            const fullAddress = `${client?.address || ''}${client?.city ? `, ${client.city}` : ''}`.trim();
            const dateStr = inter.scheduled_date ? new Date(inter.scheduled_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

            // Extraire le motif des notes s'il existe
            const motifMatch = inter.notes?.match(/\[Non visité.*?:\s*(.*?)\]/);
            const recordedMotif = motifMatch ? motifMatch[1] : null;

            return (
              <div
                key={inter.id}
                className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/40 shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-black text-slate-900 dark:text-white uppercase truncate">
                      {client?.first_name} {client?.last_name}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                      {inter.pool?.name || 'Bassin principal'} • Prévu le {dateStr}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-black uppercase whitespace-nowrap">
                    En attente
                  </span>
                </div>

                {recordedMotif && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-black uppercase mr-1">Motif :</span>
                    <span className="font-semibold">{recordedMotif}</span>
                  </div>
                )}

                {fullAddress && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                    <MapPin size={14} className="text-blue-500 shrink-0" />
                    <span className="truncate">{fullAddress}</span>
                  </div>
                )}

                {/* Boutons d'action pour le technicien */}
                <div className="flex items-center gap-2 pt-1">
                  {fullAddress && (
                    <button
                      type="button"
                      onClick={() => runNavigation(fullAddress)}
                      className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-blue-600 transition-colors"
                      title="Navigation GPS"
                    >
                      <Navigation size={18} strokeWidth={2.5} />
                    </button>
                  )}

                  {client?.phone && (
                    <button
                      type="button"
                      onClick={() => openWhatsAppChat(client.phone || '')}
                      className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-emerald-500 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle size={18} strokeWidth={2.5} />
                    </button>
                  )}

                  {/* Bouton Décider / Arbitrer */}
                  <button
                    type="button"
                    onClick={() => onOpenArbitrageModal(inter)}
                    className="flex-1 min-h-[44px] px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Calendar size={15} />
                    <span>Arbitrer</span>
                  </button>

                  {/* Bouton Valider / Rattrapé */}
                  <button
                    type="button"
                    onClick={() => onQuickComplete(inter)}
                    className="min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                    title="Valider la visite réalisée"
                  >
                    <Check size={16} strokeWidth={3} />
                    <span>Validé</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
