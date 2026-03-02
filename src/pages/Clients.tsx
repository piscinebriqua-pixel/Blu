import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Plus, Filter, MapPin, ChevronRight, LayoutList, Map as MapIcon } from 'lucide-react';
import AddClientModal from '../components/AddClientModal';
import GlobalMap from '../components/GlobalMap';
import PageLayout from '../components/PageLayout';

const ClientsList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [activeFilter, setActiveFilter] = useState('Tous');

    useEffect(() => {
        fetchClients();
        const params = new URLSearchParams(location.search);
        const filterParam = params.get('filter');
        if (filterParam) {
            setActiveFilter(filterParam);
            setShowFilters(true);
        }
    }, [location.search]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('last_name');
            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c => {
        const matchesSearch = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.phone && c.phone.includes(searchTerm));

        if (!matchesSearch) return false;

        if (activeFilter === 'Dettes') {
            return c.balance !== 0;
        }

        return true;
    });

    // The toolbar and PageLayout structure are replaced by the new return block
    // const toolbar = (
    //     <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
    //         <div className="relative w-full sm:w-96">
    //             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
    //             <input
    //                 type="text"
    //                 placeholder="Rechercher un client..."
    //                 className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 font-medium text-slate-700 placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
    //                 value={searchTerm}
    //                 onChange={(e) => setSearchTerm(e.target.value)}
    //             />
    //         </div>
    //         <Button
    //             onClick={() => setIsAddModalOpen(true)}
    //             icon={Plus}
    //             className="w-full sm:w-auto"
    //         >
    //             NOUVEAU CLIENT
    //         </Button>
    //     </div>
    // );

    const toolbar = (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un client..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                    <button title="Mode Liste" onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <LayoutList size={20} />
                    </button>
                    <button title="Mode Carte" onClick={() => setViewMode('map')} className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <MapIcon size={20} />
                    </button>
                </div>
                <button title="Filtrer les clients" onClick={() => setShowFilters(!showFilters)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border shrink-0 ${showFilters ? 'bg-primary text-white border-primary shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/50 dark:border-slate-700'}`}>
                    <Filter size={18} />
                </button>
            </div>

            {showFilters && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar animate-in fade-in slide-in-from-top-2">
                    {['Tous', 'Dettes', 'Actifs', 'En attente', 'Archivés'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm border whitespace-nowrap transition-all ${activeFilter === filter ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <>
            <PageLayout
                title="Fiches Clients"
                subtitle={`${filteredClients.length} dossiers actifs`}
                showBackButton={true}
                toolbar={toolbar}
                className={viewMode === 'map' ? '!pt-0 !px-0' : ''}
            >
                {viewMode === 'map' ? (
                    <div className="absolute inset-0 z-0 flex flex-col pb-16">
                        <GlobalMap clients={filteredClients} />
                    </div>
                ) : (
                    <main className={`pb-12`}>
                        <div className="flex flex-col gap-3 relative z-10">
                            {filteredClients.length > 0 ? (
                                filteredClients.map((client, idx) => (
                                    // eslint-disable-next-line
                                    <div
                                        key={client.id}
                                        onClick={() => navigate(`/client/${client.id}`)}
                                        className={`bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-sm border border-slate-100/50 dark:border-slate-700 flex flex-col gap-2.5 active:scale-[0.98] transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards ${idx < 10 ? `stagger-${idx + 1}` : ''}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                    {(client.first_name || '?').charAt(0)}{(client.last_name || '').charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-[15px] font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">
                                                        {client.first_name || 'Sans Prénom'} {client.last_name || ''}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 opacity-80">
                                                        <MapPin size={10} className="text-slate-300 dark:text-slate-600" />
                                                        {client.city || 'Ville inconnue'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border ${client.balance < 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border-red-100 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'}`}>
                                                    {client.balance < 0 ? 'Dette' : 'À jour'}
                                                </div>
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                    {Math.abs(client.balance || 0).toFixed(0)} <span className="text-[10px] opacity-50 uppercase">DT</span>
                                                </span>
                                                <ChevronRight size={16} className="text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !loading && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                            <Search size={32} className="text-slate-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-white">Aucun client trouvé</h3>
                                        <p className="text-slate-500 dark:text-slate-500 max-w-xs mx-auto mt-2">
                                            Essayez de modifier vos critères de recherche ou ajoutez un nouveau client.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </main>
                )}

                {/* Floating Action Button */}
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="fab-adaptive w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary-dark hover:scale-110 active:scale-95 transition-all"
                    aria-label="Ajouter un client"
                >
                    <Plus size={28} />
                </button>

            </PageLayout>

            {isAddModalOpen && (
                <AddClientModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchClients}
                />
            )}
        </>
    );
};

export default ClientsList;
