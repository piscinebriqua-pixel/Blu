import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Calendar,
    MapPin,
    Clock,
    Play,
    MessageCircle,
    Navigation,
    ArrowRight,
    Droplets,
    User
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import NewIntervention from '../components/NewIntervention';
import ModalLayout from '../components/ModalLayout';

const TechnicianPortal: React.FC = () => {
    const [interventions, setInterventions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInter, setSelectedInter] = useState<any>(null);
    const [isReporting, setIsReporting] = useState(false);

    // Manual intervention state
    const [isManualSelectionOpen, setIsManualSelectionOpen] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [selClient, setSelClient] = useState<any>(null);
    const [pools, setPools] = useState<any[]>([]);
    const [selPoolId, setSelPoolId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDailyTour = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                // Check admin and get technician ID
                const [profileRes, techRes] = await Promise.all([
                    supabase.from('profiles').select('role').eq('id', session.user.id).single(),
                    supabase.from('technicians').select('id').eq('email', session.user.email).single()
                ]);

                const isAdmin = profileRes.data?.role === 'admin';
                const techId = techRes.data?.id;

                const todayStr = new Date().toISOString().split('T')[0];

                let query = supabase
                    .from('interventions')
                    .select(`
                        *,
                        pool:pools(
                            name,
                            client:clients(id, first_name, last_name, phone, address, city)
                        )
                    `)
                    // We want to see scheduled interventions (no matter when, or maybe just for today/past), 
                    // AND interventions completed TODAY.
                    // For a tour, usually you see scheduled and completed.
                    .or(`status.eq.scheduled,and(status.eq.completed,created_at.gte.${todayStr})`)
                    .order('scheduled_date', { ascending: true });

                if (!isAdmin && techId) {
                    query = query.eq('technician_id', techId);
                } else if (!isAdmin && !techId) {
                    // Not a tech, not an admin -> empty
                    setInterventions([]);
                    return;
                }

                const { data, error } = await query;

                if (error) throw error;
                setInterventions(data || []);
            } catch (error) {
                console.error('Error fetching tour:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDailyTour();
    }, []);

    const openWhatsApp = (phone: string) => {
        const formatted = phone.replace(/\s/g, '').replace('+', '');
        window.open(`https://wa.me/${formatted}`, '_blank');
    };

    const runNavigation = (address: string) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    };

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, first_name, last_name').order('last_name');
        setClients(data || []);
    };

    const fetchPools = async (clientId: string) => {
        const { data } = await supabase.from('pools').select('id, name').eq('client_id', clientId);
        setPools(data || []);
    };

    const handleOpenManual = () => {
        fetchClients();
        setIsManualSelectionOpen(true);
    };

    const handleSelectClient = (client: any) => {
        setSelClient(client);
        fetchPools(client.id);
    };

    const toolbar = (
        <button
            onClick={handleOpenManual}
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 hover:scale-105 transition-all backdrop-blur-md shadow-lg"
            title="Nouvelle intervention"
        >
            <div className="relative">
                <Calendar size={22} strokeWidth={2.5} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-primary rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs font-black">+</span>
                </div>
            </div>
        </button>
    );

    return (
        <PageLayout
            title="Ma Tournée"
            subtitle="Interventions du jour"
            showBackButton={true}
            toolbar={toolbar}
        >
            <div className="flex flex-col gap-8 pb-32 px-flow">
                {/* Stats Summary */}
                <div className="card-premium vibrant grad-blue shadow-blue-500/30 !p-8 -mt-10 md:-mt-14 transition-all hover:scale-[1.01]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Programme du</p>
                            <div className="flex flex-col">
                                <span className="text-4xl font-black uppercase tracking-tighter leading-[0.8]">{new Date().toLocaleDateString('fr-FR', { day: 'numeric' })}</span>
                                <span className="text-xl font-black uppercase tracking-[0.1em] opacity-90">{new Date().toLocaleDateString('fr-FR', { month: 'long' })}</span>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-24 h-24 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-1">
                            <span className="text-3xl font-black text-white">{interventions.length}</span>
                            <span className="text-[11px] font-extrabold uppercase tracking-widest opacity-60">Visites</span>
                        </div>
                    </div>
                </div>

                {/* Itinerary List */}
                <div className="flex flex-col gap-4">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
                        ))
                    ) : interventions.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 transition-all">
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                                <Calendar size={40} className="opacity-20" />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-sm font-black uppercase tracking-[0.2em]">Aucune visite planifiée</p>
                                <p className="text-xs font-bold opacity-60 uppercase">Tout est à jour pour aujourd'hui</p>
                            </div>
                            <button
                                onClick={handleOpenManual}
                                className="mt-4 px-6 py-3 bg-primary/10 text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                            >
                                Commencer une intervention
                            </button>
                        </div>
                    ) : (
                        interventions.map((inter) => (
                            <div key={inter.id} className="card-white flex flex-col !items-stretch !p-6 hover:scale-[1.02] transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                                {inter.pool?.client?.first_name} {inter.pool?.client?.last_name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${inter.status === 'completed' ? 'bg-green-400' : 'bg-blue-400'}`} />
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    {inter.pool?.name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {inter.status === 'completed' ? (
                                        <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-black uppercase tracking-widest border border-green-500/20">
                                            Terminé
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/20">
                                            Confirmé
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 mb-8">
                                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                                        <span className="font-medium leading-tight">
                                            {inter.pool?.client?.address}, {inter.pool?.client?.city}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => runNavigation(`${inter.pool?.client?.address} ${inter.pool?.client?.city}`)}
                                        className="w-14 h-14 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                                        title="Lancer la navigation"
                                    >
                                        <Navigation size={22} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => openWhatsApp(inter.pool?.client?.phone)}
                                        className="w-14 h-14 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                                        title="Contacter sur WhatsApp"
                                    >
                                        <MessageCircle size={22} strokeWidth={2.5} />
                                    </button>
                                    {inter.status !== 'completed' && (
                                        <button
                                            onClick={() => { setSelectedInter(inter); setIsReporting(true); }}
                                            className="flex-1 btn-flow btn-primary !h-14 shadow-blue-500/20"
                                        >
                                            <Play size={18} fill="currentColor" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Démarrer</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Selection Modal for manual addition */}
            {isManualSelectionOpen && (
                <ModalLayout
                    title="Nouvelle Intervention"
                    onClose={() => setIsManualSelectionOpen(false)}
                    actions={
                        <button
                            className="btn-flow btn-primary w-full !h-14"
                            disabled={!selPoolId}
                            onClick={() => {
                                setIsManualSelectionOpen(false);
                                setIsReporting(true);
                            }}
                        >
                            SUIVANT <ArrowRight size={18} />
                        </button>
                    }
                >
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Choisir un Client</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    className="search-input !pl-12 cursor-pointer !h-14"
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
                            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Choisir un Bassin</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {pools.length > 0 ? pools.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelPoolId(p.id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selPoolId === p.id ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        >
                                            <span className="text-xs font-black uppercase">{p.name}</span>
                                            {selPoolId === p.id && <Droplets size={16} className="text-primary" />}
                                        </button>
                                    )) : (
                                        <p className="text-xs text-orange-500 font-bold uppercase p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                                            Aucun bassin enregistré pour ce client.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </ModalLayout>
            )}

            {isReporting && (selectedInter || (selClient && selPoolId)) && (
                <NewIntervention
                    poolId={selectedInter?.pool_id || selPoolId}
                    clientId={selectedInter?.pool?.client?.id || selClient?.id}
                    interventionId={selectedInter?.id}
                    onClose={() => {
                        setIsReporting(false);
                        setSelectedInter(null);
                        setSelClient(null);
                        setSelPoolId(null);
                    }}
                    onSuccess={() => {
                        setIsReporting(false);
                        setSelectedInter(null);
                        setSelClient(null);
                        setSelPoolId(null);
                        // Refresh logic could be added here
                    }}
                />
            )}
        </PageLayout>
    );
};

export default TechnicianPortal;
