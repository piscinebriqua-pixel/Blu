import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import ModalLayout from '../components/ModalLayout';
import NewIntervention from '../components/NewIntervention';
import { supabase } from '../lib/supabase';
import {
    Search,
    Calendar,
    Filter,
    ChevronRight,
    FileText,
    UserCheck,
    Droplets,
    Clock,
    CreditCard,
    Plus,
    User,
    ArrowRight
} from 'lucide-react';

interface Intervention {
    id: string;
    visit_date: string;
    created_at: string;
    ph_level: number;
    chlorine_level: number;
    water_temp: number;
    notes: string;
    technician: { full_name: string };
    pool: {
        name: string;
        client: { id: string; first_name: string; last_name: string }
    };
    services: { price_at_time: number }[];
    products: { total_price: number }[];
}

const Interventions: React.FC = () => {
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

    // Add Intervention State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [selClient, setSelClient] = useState<any>(null);
    const [pools, setPools] = useState<any[]>([]);
    const [selPoolId, setSelPoolId] = useState<string | null>(null);
    const [isNewInterventionModalOpen, setIsNewInterventionModalOpen] = useState(false);

    useEffect(() => {
        fetchInterventions();
    }, []);

    const fetchInterventions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('interventions')
                .select(`
                    *,
                    technician:technicians(full_name),
                    pool:pools(
                        name,
                        client:clients(id, first_name, last_name)
                    ),
                    services:intervention_services(price_at_time),
                    products:intervention_products(total_price)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInterventions(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, first_name, last_name').order('last_name');
        setClients(data || []);
    };

    const fetchPools = async (clientId: string) => {
        const { data } = await supabase.from('pools').select('id, name').eq('client_id', clientId);
        setPools(data || []);
    };

    const handleOpenAddModal = () => {
        fetchClients();
        setIsAddModalOpen(true);
    };

    const handleSelectClient = (client: any) => {
        setSelClient(client);
        fetchPools(client.id);
    };

    const handleStartIntervention = () => {
        if (selPoolId) {
            setIsAddModalOpen(false);
            setIsNewInterventionModalOpen(true);
        }
    };

    const calculateTotal = (inter: Intervention) => {
        const sTotal = inter.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0;
        const pTotal = inter.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0;
        return sTotal + pTotal;
    };

    const filteredInterventions = interventions.filter(i => {
        const clientName = `${i.pool?.client?.first_name} ${i.pool?.client?.last_name}`.toLowerCase();
        const techName = i.technician?.full_name?.toLowerCase() || '';
        return clientName.includes(searchTerm.toLowerCase()) || techName.includes(searchTerm.toLowerCase());
    });

    const toolbar = (
        <div className="flex items-center justify-between w-full gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                    type="text"
                    placeholder="Filtrer..."
                    className="search-input !pl-10 h-[44px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="btn-primary h-[44px] !px-4" onClick={handleOpenAddModal}>
                <Plus size={18} />
                <span className="hidden sm:inline">NOUVEAU</span>
            </button>
        </div>
    );

    const todayInterventions = interventions.filter(i => {
        const today = new Date().toISOString().split('T')[0];
        const interDate = (i.visit_date || i.created_at).split('T')[0];
        return interDate === today;
    });

    const totalRevenue = interventions.reduce((acc, i) => acc + calculateTotal(i), 0);

    return (
        <PageLayout
            title="HISTORIQUE"
            subtitle={`${interventions.length} RAPPORTS`}
            toolbar={toolbar}
            loading={loading && interventions.length === 0}
            showBackButton={true}
        >
            {/* Stats Overview */}
            <div className="data-grid grid-2 !gap-3 mb-6">
                <div className="card-premium vibrant grad-blue !p-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-column">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Aujourd'hui</span>
                            <span className="text-2xl font-black text-white">{todayInterventions.length}</span>
                        </div>
                        <Calendar size={20} className="text-white/30" />
                    </div>
                </div>
                <div className="card-premium vibrant grad-violet !p-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-column">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Valeur</span>
                            <span className="text-2xl font-black text-white">{totalRevenue.toFixed(0)} <span className="text-xs">DT</span></span>
                        </div>
                        <CreditCard size={20} className="text-white/30" />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-column gap-3">
                {filteredInterventions.map(inter => (
                    <button
                        key={inter.id}
                        className="card-premium group !flex-row !items-center !gap-4 text-left hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => setSelectedIntervention(inter)}
                    >
                        <div className="w-11 h-11 rounded-2xl bg-primary-glow flex-center text-primary border border-primary/20 shrink-0 group-hover:scale-105 transition-transform">
                            <FileText size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="text-xs font-black text-white uppercase truncate">
                                    {inter.pool?.client?.first_name} {inter.pool?.client?.last_name}
                                </h4>
                                <span className="text-[11px] font-black text-primary ml-2">
                                    {calculateTotal(inter).toFixed(0)} DT
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted mt-1">
                                <UserCheck size={10} className="text-status-green" />
                                <span className="text-[9px] font-bold uppercase truncate">{inter.technician?.full_name}</span>
                                <span className="text-[8px] opacity-30">•</span>
                                <Clock size={10} />
                                <span className="text-[9px] font-bold uppercase">{new Date(inter.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                            </div>
                        </div>

                        <ChevronRight size={16} className="text-muted group-hover:text-primary transition-colors" />
                    </button>
                ))}
            </div>

            {/* Selection Modal for adding */}
            {isAddModalOpen && (
                <ModalLayout
                    title="Nouvelle Intervention"
                    onClose={() => setIsAddModalOpen(false)}
                    actions={
                        <button
                            className="btn-primary w-full h-[50px]"
                            disabled={!selPoolId}
                            onClick={handleStartIntervention}
                        >
                            SUIVANT <ArrowRight size={18} />
                        </button>
                    }
                >
                    <div className="flex-column gap-5">
                        <div className="flex-column gap-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Choisir un Client</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                <select
                                    className="search-input !pl-12 cursor-pointer"
                                    onChange={(e) => {
                                        const c = clients.find(cl => cl.id === e.target.value);
                                        if (c) handleSelectClient(c);
                                    }}
                                    value={selClient?.id || ''}
                                    title="Sélectionner un client"
                                >
                                    <option value="">Sélectionner un client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selClient && (
                            <div className="flex-column gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Choisir un Bassin</label>
                                <div className="data-grid grid-1 !gap-2">
                                    {pools.length > 0 ? pools.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelPoolId(p.id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selPoolId === p.id ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/5 text-muted hover:bg-white/10'}`}
                                        >
                                            <span className="text-xs font-black uppercase">{p.name}</span>
                                            {selPoolId === p.id && <Droplets size={16} className="text-primary" />}
                                        </button>
                                    )) : (
                                        <p className="text-[10px] text-status-orange font-bold uppercase p-4 bg-status-orange/10 rounded-xl border border-status-orange/20">
                                            Aucun bassin enregistré pour ce client.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </ModalLayout>
            )}

            {/* New Intervention Form */}
            {isNewInterventionModalOpen && selClient && selPoolId && (
                <NewIntervention
                    clientId={selClient.id}
                    poolId={selPoolId}
                    onClose={() => {
                        setIsNewInterventionModalOpen(false);
                        setSelClient(null);
                        setSelPoolId(null);
                    }}
                    onSuccess={() => {
                        setIsNewInterventionModalOpen(false);
                        setSelClient(null);
                        setSelPoolId(null);
                        fetchInterventions();
                    }}
                />
            )}

            {/* Details Modal */}
            {selectedIntervention && (
                <ModalLayout
                    title="Détails Rapport"
                    onClose={() => setSelectedIntervention(null)}
                >
                    <div className="flex-column gap-6">
                        <div className="card-premium !bg-white/5 !p-4 flex-column items-center">
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">Montant Total</p>
                            <p className="text-4xl font-black text-white mt-2">{calculateTotal(selectedIntervention).toFixed(0)} <span className="text-base">DT</span></p>
                        </div>

                        <div className="flex-column gap-4">
                            <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/20 pb-2">Informations</h5>
                            <div className="data-grid grid-2 !gap-3">
                                <div className="flex-column gap-1">
                                    <span className="text-[8px] font-bold text-muted uppercase">Client</span>
                                    <span className="text-xs font-black text-white uppercase truncate">{selectedIntervention.pool?.client?.first_name} {selectedIntervention.pool?.client?.last_name}</span>
                                </div>
                                <div className="flex-column gap-1 text-right">
                                    <span className="text-[8px] font-bold text-muted uppercase">Bassin</span>
                                    <span className="text-xs font-black text-white uppercase truncate">{selectedIntervention.pool?.name}</span>
                                </div>
                                <div className="flex-column gap-1">
                                    <span className="text-[8px] font-bold text-muted uppercase">Agent</span>
                                    <span className="text-xs font-black text-white uppercase truncate">{selectedIntervention.technician?.full_name}</span>
                                </div>
                                <div className="flex-column gap-1 text-right">
                                    <span className="text-[8px] font-bold text-muted uppercase">Date</span>
                                    <span className="text-xs font-black text-white uppercase truncate">{new Date(selectedIntervention.created_at).toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-column gap-4">
                            <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/20 pb-2">Mesures Techniques</h5>
                            <div className="data-grid grid-2 !gap-3">
                                <div className="card-premium !bg-white/5 !p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-status-violet/10 flex-center text-status-violet">
                                        <Droplets size={16} />
                                    </div>
                                    <div className="flex-column">
                                        <span className="text-[8px] font-bold text-muted uppercase">pH</span>
                                        <span className="text-sm font-black text-white">{selectedIntervention.ph_level || '-'}</span>
                                    </div>
                                </div>
                                <div className="card-premium !bg-white/5 !p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-status-blue/10 flex-center text-primary">
                                        <Droplets size={16} />
                                    </div>
                                    <div className="flex-column">
                                        <span className="text-[8px] font-bold text-muted uppercase">Chlore</span>
                                        <span className="text-sm font-black text-white">{selectedIntervention.chlorine_level || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedIntervention.notes && (
                            <div className="flex-column gap-2">
                                <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Observations</h5>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[11px] leading-relaxed text-muted italic">"{selectedIntervention.notes}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalLayout>
            )}
        </PageLayout>
    );
};

export default Interventions;
