import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';

export interface TechnicianOption {
  id: string;
  full_name: string;
}

interface TechnicianSelectDropdownProps {
  technicians: TechnicianOption[];
  selectedTechId: string;
  onSelect: (techId: string) => void;
  /** Permet de calculer le nombre d'interventions pour un techId donné (ou total pour 'all') */
  getInterventionCount: (techId: string) => number;
  className?: string;
}

/**
 * Bouton-menu sélecteur de technicien tactile (44px) avec badge de charge.
 * Remplace la barre de pilules encombrante pour maximiser l'espace du calendrier.
 */
export const TechnicianSelectDropdown: React.FC<TechnicianSelectDropdownProps> = ({
  technicians,
  selectedTechId,
  onSelect,
  getInterventionCount,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermeture automatique au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedTech = technicians.find(t => t.id === selectedTechId);
  const currentCount = getInterventionCount(selectedTechId);
  const totalCount = getInterventionCount('all');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton Principal Tactile (Min-Height 44px) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2.5 w-full min-h-[44px] px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 shadow-sm transition-all active:scale-[0.99] text-left"
        title="Filtrer par technicien"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedTechId === 'all' ? (
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
              {selectedTech?.full_name.charAt(0).toUpperCase() || 'T'}
            </div>
          )}
          <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
            {selectedTechId === 'all' ? 'Tous les techniciens' : selectedTech?.full_name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-xs">
            {currentCount}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Menu Déroulant Popover (Z-50) */}
      {isOpen && (
        <div className="absolute right-0 left-0 sm:left-auto sm:w-72 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-72 overflow-y-auto space-y-1 scrollbar-thin">
            {/* Option : Tous les techniciens */}
            <button
              type="button"
              onClick={() => {
                onSelect('all');
                setIsOpen(false);
              }}
              className={`flex items-center justify-between w-full min-h-[44px] px-3 py-2 rounded-xl text-left transition-all ${
                selectedTechId === 'all'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-bold'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <span className="text-xs uppercase tracking-tight truncate">Tous les techniciens</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black">
                  {totalCount}
                </span>
                {selectedTechId === 'all' && <Check size={16} className="text-blue-600" />}
              </div>
            </button>

            {/* Séparateur */}
            <div className="border-t border-slate-100 dark:border-slate-700/60 my-1" />

            {/* Liste de chaque technicien */}
            {technicians.map((t) => {
              const isSelected = selectedTechId === t.id;
              const count = getInterventionCount(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelect(t.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full min-h-[44px] px-3 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs uppercase tracking-tight truncate">{t.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black">
                      {count}
                    </span>
                    {isSelected && <Check size={16} className="text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
