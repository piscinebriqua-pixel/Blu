import React, { useState, useEffect } from 'react';
import { X, Search, Check, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
        t.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Sélectionner un technicien</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Fermer">
                        <X size={20} className="text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                            <User size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-bold uppercase">Aucun technicien trouvé</p>
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
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black mr-4 uppercase shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                        }`}>
                                        {tech.photo_url ? (
                                            <img src={tech.photo_url} alt={tech.full_name} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            tech.full_name.charAt(0)
                                        )}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`text-sm font-black ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{tech.full_name}</p>
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Technicien</p>
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
        </div>
    );
};

export default TechnicianSelectionModal;
