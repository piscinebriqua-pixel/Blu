import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search as SearchIcon, Plus, ChevronRight } from 'lucide-react';
import TechnicianModal from '../components/TechnicianModal';
import PageLayout from '../components/PageLayout';

interface Technician {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    photo_url: string;
    active: boolean;
    pin_code?: string;
}

const Technicians: React.FC = () => {
    const navigate = useNavigate();
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

    const filteredTechnicians = technicians.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.phone && t.phone.includes(searchTerm))
    );

    const activeCount = technicians.filter(t => t.active).length;

    const toolbar = (
        <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder="Rechercher un technicien..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    );

    return (
        <PageLayout
            title="Techniciens"
            subtitle={`${activeCount} actifs`}
            showBackButton={true}
            toolbar={toolbar}
        >
            <div className="pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTechnicians.length > 0 ? (
                        filteredTechnicians.map((tech, idx) => (
                            <div
                                key={tech.id}
                                className={`bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-sm border border-slate-100/50 dark:border-slate-700 flex flex-col gap-3 active:scale-[0.98] transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards ${idx < 10 ? `stagger-${idx + 1}` : ''}`}
                                onClick={() => navigate(`/technician/${tech.id}`)}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-500 font-black text-lg">
                                                {tech.full_name ? tech.full_name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            {tech.active && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>}
                                        </div>
                                        <div>
                                            <h3 className="text-[15px] font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">
                                                {tech.full_name || 'Sans Nom'}
                                            </h3>
                                            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 opacity-80">{tech.email}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-center col-span-full">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                    <SearchIcon size={32} className="text-slate-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-white">Aucun technicien trouvé</h3>
                                <p className="text-slate-500 dark:text-slate-500 max-w-xs mx-auto mt-2">
                                    Essayez de modifier vos critères de recherche ou ajoutez un nouveau membre à l'équipe.
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>

            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fab-adaptive w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all"
                aria-label="Ajouter un technicien"
            >
                <Plus size={28} />
            </button>

            {isAddModalOpen && (
                <TechnicianModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={async (e, data) => {
                        e.preventDefault();
                        const { error } = await supabase.from('technicians').insert([data]);
                        if (!error) {
                            setIsAddModalOpen(false);
                            fetchTechnicians();
                        }
                    }}
                    technician={null}
                    loading={false}
                />
            )}
        </PageLayout>
    );
};

export default Technicians;
