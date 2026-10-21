import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, User } from 'lucide-react';

export type InterventionTab = 'planifie' | 'termine' | 'annule';
export type InterventionFilterType = 'all' | 'classique' | 'chantier';

interface InterventionsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: InterventionFilterType;
  onTypeChange: (value: InterventionFilterType) => void;
  selectedTech: string;
  onTechChange: (value: string) => void;
  technicians: string[];
  activeTab: InterventionTab;
  onTabChange: (tab: InterventionTab) => void;
}

export const InterventionsToolbar: React.FC<InterventionsToolbarProps> = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedTech,
  onTechChange,
  technicians,
  activeTab,
  onTabChange
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      {/* Search & View Switcher */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher client, tech..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 dark:text-white"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/planning')}
          className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl text-slate-500 border border-slate-100 dark:border-white/5 shadow-sm active:scale-90 transition-all hover:text-primary"
          title="Vue Calendrier"
        >
          <Calendar size={22} />
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            aria-label="Type"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as InterventionFilterType)}
            className="w-full min-h-[44px] p-3 pl-4 pr-10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 text-base font-bold text-slate-800 dark:text-white appearance-none outline-none focus:border-primary/50"
          >
            <option value="all">Tous Types</option>
            <option value="classique">Visite</option>
            <option value="chantier">Chantier</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <Clock size={16} />
          </div>
        </div>

        <div className="relative flex-1">
          <select
            aria-label="Technicien"
            value={selectedTech}
            onChange={(e) => onTechChange(e.target.value)}
            className="w-full min-h-[44px] p-3 pl-4 pr-10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 text-base font-bold text-slate-800 dark:text-white appearance-none outline-none focus:border-primary/50"
          >
            <option value="all">Tous Techs</option>
            {technicians.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <User size={16} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-white/5">
        {(['planifie', 'termine', 'annule'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all min-h-[44px] ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 text-primary shadow-lg ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'planifie' ? 'À faire' : tab === 'termine' ? 'Terminé' : 'Annulé'}
          </button>
        ))}
      </div>
    </div>
  );
};
