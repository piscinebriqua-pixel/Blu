import React, { useState, useEffect } from 'react';
import { Search, Check, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ModalLayout from './ModalLayout';

interface Technician {
    id: string;
    full_name: string;
    photo_url?: string;
    active: boolean;
}

interface TechnicianSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (techId: string, techName: string) => void;
    selectedTechId?: string;
}

const TechnicianSelectionModal: React.FC<TechnicianSelectionModalProps> = ({ isOpen, onClose, onSelect, selectedTechId }) => {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchTechnicians();
        }
    }, [isOpen]);

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('technicians')
                .select('*')
                .eq('active', true)
                .order('full_name');

            if (error) throw error;
            setTechnicians(data || []);
        } catch (error) {
            console.error('Error fetching technicians:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filtered = technicians.filter(t =>
        (t.full_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const actions = (
        <button
            onClick={onClose}
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
        >
            Annuler
        </button>
    );

    return (
        <ModalLayout
            title="SÉLECTIONNER UN TECHNICIEN"
            onClose={onClose}
            actions={actions}
        >
            <div className="flex flex-col gap-4 p-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-base font-bold text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* List */}
                <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-500">
                            <User size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-[13px] font-bold uppercase">Aucun technicien trouvé</p>
                        </div>
                    ) : (
                        filtered.map(tech => {
                            const isSelected = selectedTechId === tech.id;
                            return (
                                <button
                                    key={tech.id}
                                    onClick={() => onSelect(tech.id, tech.full_name)}
                                    className={`w-full flex items-center p-3 rounded-2xl border-2 transition-all group ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                        : 'border-white dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black mr-4 uppercase shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                        }`}>
                                        {tech.photo_url ? (
                                            <img src={tech.photo_url} alt={tech.full_name || 'Technicien'} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            (tech.full_name?.[0] || '?')
                                        )}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`text-base font-black ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{tech.full_name}</p>
                                        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wide">Technicien</p>
                                    </div>
                                    {isSelected && (
                                        <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-300">
                                            <Check size={16} strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </ModalLayout>
    );
};

export default TechnicianSelectionModal;
