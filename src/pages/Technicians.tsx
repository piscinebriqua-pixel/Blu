import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Search as SearchIcon, ArrowLeft, Key, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import TechnicianModal from '../components/TechnicianModal';
import TechnicianDetailsModal from '../components/TechnicianDetailsModal';

interface Technician {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    photo_url: string;
    active: boolean;
    pin_code?: string; // Added pin_code
}

const Technicians: React.FC = () => {
    const navigate = useNavigate();
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Renamed to match usage
    const [editingTech, setEditingTech] = useState<Technician | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('technicians')
                .select('*')
                .order('full_name');

            if (error) throw error;
            setTechnicians(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (tech: Technician | null = null) => {
        setEditingTech(tech);
        setIsAddModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent, formData: any) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            if (editingTech) {
                const { error } = await supabase.from('technicians').update(formData).eq('id', editingTech.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('technicians').insert([formData]);
                if (error) throw error;
            }
            setIsAddModalOpen(false);
            toast.success(editingTech ? 'Technicien mis à jour' : 'Technicien ajouté');
            fetchTechnicians();
        } catch (error: unknown) {
            console.error('Erreur:', error);
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
        } finally {
            setModalLoading(false);
        }
    };

    const filteredTechnicians = technicians.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.phone && t.phone.includes(searchTerm))
    );

    const activeCount = technicians.filter(t => t.active).length;

    return (
        <div className="gabarit-wrapper">
            <header className="header-gradient flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md"
                        aria-label="Retour"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight">Techniciens</h1>
                        <p className="text-blue-100 text-xs font-medium opacity-80">{activeCount} membres actifs</p>
                    </div>
                </div>
            </header>

            <main className="main-container relative z-0">
                {/* Search */}
                <div className="sticky top-0 z-20 pb-4 pt-1">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher un technicien..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border-none shadow-sm text-slate-800 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Technicians List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                    {filteredTechnicians.length > 0 ? (
                        filteredTechnicians.map((tech, idx) => (
                            // eslint-disable-next-line
                            <div
                                key={tech.id}
                                className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100/50 dark:border-slate-700 flex flex-col gap-4 group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards hover:border-blue-200 dark:hover:border-blue-700 transition-all cursor-pointer ${idx < 10 ? `stagger-${idx + 1}` : ''}`}
                                onClick={() => setSelectedTechId(tech.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xl">
                                            {tech.full_name ? tech.full_name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        {tech.active && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full"></div>}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">
                                            {tech.full_name || 'Sans Nom'}
                                        </h3>
                                        <p className="text-slate-400 text-sm font-mono mt-1">{tech.email}</p>
                                    </div>
                                </div>

                                <hr className="border-slate-50 dark:border-slate-700" />

                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wide">
                                            Technicien
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                            <Key size={12} /> {tech.pin_code || '----'}
                                        </div>
                                    </div>

                                    <button
                                        className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center"
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(tech); }}
                                        aria-label="Modifier"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                    <SearchIcon size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-white">Aucun technicien trouvé</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                                    Essayez de modifier vos critères de recherche ou ajoutez un nouveau membre à l'équipe.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => handleOpenModal(null)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-30"
                aria-label="Ajouter un technicien"
            >
                <Plus size={28} />
            </button>

            {/* Modal */}
            <TechnicianModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleFormSubmit}
                technician={editingTech}
                loading={modalLoading}
            />

            {selectedTechId && (
                <TechnicianDetailsModal
                    technicianId={selectedTechId}
                    onClose={() => setSelectedTechId(null)}
                />
            )}
        </div>
    );
};

export default Technicians;
