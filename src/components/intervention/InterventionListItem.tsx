import React from 'react';
import { FileText, Clock, ChevronRight } from 'lucide-react';
import type { InterventionTab } from './InterventionsToolbar';

export interface InterventionItemData {
  id: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completed_date?: string | null;
  scheduled_date?: string;
  created_at: string;
  technician?: { full_name: string };
  pool?: {
    name: string;
    client?: {
      id: string;
      first_name: string;
      last_name: string;
      balance: number;
      phone?: string;
    };
  };
  [key: string]: any;
}

interface InterventionListItemProps {
  intervention: InterventionItemData;
  activeTab: InterventionTab;
  onClick: () => void;
}

export const InterventionListItem: React.FC<InterventionListItemProps> = ({
  intervention: i,
  activeTab,
  onClick
}) => {
  const isCancelled = i.status === 'cancelled';
  const isCompleted = i.status === 'completed';

  const dateToDisplay = activeTab === 'termine'
    ? new Date(i.completed_date || i.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : new Date(i.scheduled_date || i.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  return (
    <div
      onClick={onClick}
      className={`group p-4 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4 cursor-pointer ${
        isCancelled ? 'opacity-60' : ''
      }`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
          isCompleted
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
            : isCancelled
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white'
        }`}
      >
        {isCompleted ? <FileText size={24} /> : <Clock size={24} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h3
            className={`text-base font-black uppercase tracking-tight truncate ${
              isCancelled ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'
            }`}
          >
            {i.pool?.client?.first_name} {i.pool?.client?.last_name}
          </h3>
          <div
            className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-700'
                : isCancelled
                ? 'bg-slate-100 text-slate-500'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {dateToDisplay}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold uppercase tracking-widest text-slate-500`}
          >
            {i.pool?.name || 'Piscine'}
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <span
            className={`text-xs font-black uppercase text-slate-500`}
          >
            {i.technician?.full_name || 'Non assigné'}
          </span>
        </div>
      </div>

      <ChevronRight
        size={20}
        className="text-slate-300 group-hover:text-primary transition-colors shrink-0"
      />
    </div>
  );
};
