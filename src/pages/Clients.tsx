import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Plus, ArrowLeft, Filter, MapPin, ChevronRight, Mail, LayoutList, Map as MapIcon } from 'lucide-react';
import AddClientModal from '../components/AddClientModal';
import GlobalMap from '../components/GlobalMap';

const ClientsList: React.FC = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    useEffect(() => {
        fetchClients();
    }, []);

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

    const filteredClients = clients.filter(c =>
        `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    // The toolbar and PageLayout structure are replaced by the new return block
    // const toolbar = (
    //     <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
    //         <div className="relative w-full sm:w-96">
    //             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
    //             <input
    //                 type="text"
    //                 placeholder="Rechercher un client..."
    //                 className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
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
                        <h1 className="text-xl font-black text-white leading-tight">Fiches Clients</h1>
                        <p className="text-blue-100 text-xs font-medium opacity-80">{filteredClients.length} dossiers actifs</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode('list')}
                            title="Vue Liste"
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}
                        >
                            <LayoutList size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            title="Vue Carte"
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}
                        >
                            <MapIcon size={20} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all backdrop-blur-md ${showFilters ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        aria-label="Filtres"
                    >
                        <Filter size={20} />
                    </button>
                </div>
            </header>

            <main className="main-container relative z-0">
                {/* Search & Filters */}
                <div className="sticky top-0 z-20 pb-4 pt-1">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
                                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border-none shadow-sm text-slate-800 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {showFilters && (
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar animate-in fade-in slide-in-from-top-2">
                            {['Tous', 'Actifs', 'En attente', 'Archivés'].map((filter) => (
                                <button
                                    key={filter}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 whitespace-nowrap hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="pb-24">
                    {viewMode === 'list' ? (
                        <div className="flex flex-col gap-3">
                            {filteredClients.length > 0 ? (
                                filteredClients.map((client, idx) => (
                                    // eslint-disable-next-line
                                    <div
                                        key={client.id}
                                        onClick={() => navigate(`/client/${client.id}`)}
                                        className={`bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100/50 dark:border-slate-700 flex flex-col gap-3 active:scale-[0.98] transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards ${idx < 10 ? `stagger-${idx + 1}` : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                    {(client.first_name || '?').charAt(0)}{(client.last_name || '').charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight">
                                                        {client.first_name || 'Sans Prénom'} {client.last_name || ''}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                                                        <MapPin size={12} className="text-slate-300 dark:text-slate-600" />
                                                        {client.city || 'Ville inconnue'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                <ChevronRight size={20} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                        </div>

                                        <hr className="border-slate-50 dark:border-slate-700" />

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${client.balance < 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border-red-100 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'}`}>
                                                    {client.balance < 0 ? 'Solde Dû' : 'À jour'}
                                                </div>
                                                {client.email && (
                                                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                                                        <Mail size={12} />
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-sm font-black ${client.balance < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {client.balance.toFixed(0)} <span className="text-[10px] font-bold opacity-60">DT</span>
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !loading && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                            <Search size={32} className="text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-white">Aucun client trouvé</h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                                            Essayez de modifier vos critères de recherche ou ajoutez un nouveau client.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <GlobalMap clients={filteredClients} />
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-30"
                aria-label="Ajouter un client"
            >
                <Plus size={28} />
            </button>

            {/* Modals */}
            {isAddModalOpen && (
                <AddClientModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchClients}
                />
            )}
        </div>
    );
};

export default ClientsList;
