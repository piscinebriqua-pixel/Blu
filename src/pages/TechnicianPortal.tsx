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
        fetchDailyTour();
    }, []);

    const fetchDailyTour = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Fetch profile and technician info
            // Using a simple .select() then [0] is more robust against 406 errors than .single()/.maybeSingle()
            const [profileRes, techRes] = await Promise.all([
                supabase.from('profiles').select('role').eq('id', session.user.id),
                supabase.from('technicians').select('id').eq('email', session.user.email)
            ]);

            const profileData = profileRes.data?.[0];
            const techData = techRes.data?.[0];

            const isAdmin = profileData?.role === 'admin';
            const techId = techData?.id;

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
                .or(`status.eq.scheduled,and(status.eq.completed,created_at.gte.${todayStr})`)
                .order('scheduled_date', { ascending: true });

            if (!isAdmin && techId) {
                query = query.eq('technician_id', techId);
            } else if (!isAdmin && !techId) {
                setInterventions([]);
                return;
            }

            const { data, error } = await query;
            if (error) throw error;
            setInterventions(data || []);
        } catch (error) {
            console.error('Error fetching tour:', error);
            // toast.error('Impossible de charger votre tournée');
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = (phone: string) => {
        let formatted = phone.replace(/[\s\-\.]/g, '');
        if (formatted && !formatted.startsWith('216') && !formatted.startsWith('+')) {
            formatted = `216${formatted}`;
        }
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
                    <span className="text-[13px] font-black">+</span>
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
            <div className="flex flex-col gap-6 pb-32">
                {/* Stats Summary - LUXURY REFINED */}
                <div className="card-premium vibrant grad-blue shadow-xl shadow-blue-500/20 p-5 sm:p-8 mt-0 transition-all hover:scale-[1.01] border-none group relative overflow-hidden rounded-[24px] sm:rounded-[32px]">
                    {/* Abstract Glassmorphism decorative elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />

                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-100/80 leading-none mb-1">Programme du</p>
                            <div className="flex flex-col">
                                <span className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none text-white">
                                    {new Date().toLocaleDateString('fr-FR', { day: 'numeric' })}
                                </span>
                                <span className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] text-blue-100/90">
                                    {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-18 h-18 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] shadow-xl flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500">
                            <span className="text-2xl sm:text-4xl font-black text-white leading-none">{interventions.length}</span>
                            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-white/70">Visites</span>
                        </div>
                    </div>
                </div>

                {/* Itinerary List */}
                <div className="flex flex-col gap-5">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800/30 rounded-[24px] animate-pulse" />
                        ))
                    ) : interventions.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-6 bg-white/50 dark:bg-slate-800/10 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800/50 transition-all px-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center shadow-inner">
                                <Calendar size={40} className="opacity-10" />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-lg font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Aucune visite</p>
                                <p className="text-[13px] font-bold opacity-50 uppercase tracking-widest leading-relaxed max-w-xs">
                                    Votre planning est à jour.
                                </p>
                            </div>
                            <button
                                onClick={handleOpenManual}
                                className="mt-2 px-10 py-4 bg-primary text-white rounded-[20px] text-[13px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Commencer ICI
                            </button>
                        </div>
                    ) : (
                        interventions.map((inter, idx) => (
                            <div
                                key={inter.id}
                                className={`card-white flex flex-col !items-stretch p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border-none rounded-[22px] sm:rounded-[28px] group animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards dark:bg-slate-800/60 ${idx < 10 ? `stagger-${idx + 1}` : ''}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-lg ${inter.status === 'completed'
                                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                            : 'bg-blue-600 text-white shadow-blue-600/20'}`}>
                                            {inter.status === 'completed' ? <Droplets size={22} className="sm:size-[28px]" strokeWidth={2.5} /> : <Clock size={22} className="sm:size-[28px]" strokeWidth={2.5} />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h3 className="text-[15px] sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-tight truncate">
                                                {inter.pool?.client?.first_name} {inter.pool?.client?.last_name}
                                            </h3>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${inter.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                <p className="text-[12px] sm:text-[14px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none truncate opacity-80">
                                                    {inter.pool?.name || 'Bassin principal'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${inter.status === 'completed'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                                        {inter.status === 'completed' ? 'Terminé' : 'Prévu'}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mb-4 bg-slate-50/50 dark:bg-slate-900/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100/50 dark:border-slate-800 transition-colors">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                                            <MapPin size={14} className="text-blue-600" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Destination</span>
                                            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                                {inter.pool?.client?.address ? `${inter.pool?.client?.address}${(inter.pool?.client?.city ? `, ${inter.pool?.client?.city}` : '')}` : 'Adresse non renseignée'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2.5">
                                    <button
                                        onClick={() => runNavigation(`${inter.pool?.client?.address} ${inter.pool?.client?.city}`)}
                                        className="w-11 h-11 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95"
                                        title="Navigation"
                                    >
                                        <Navigation size={20} className="sm:size-[24px]" strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => openWhatsApp(inter.pool?.client?.phone)}
                                        className="w-11 h-11 sm:w-14 sm:h-14 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95"
                                        title="WhatsApp"
                                    >
                                        <MessageCircle size={20} className="sm:size-[24px]" strokeWidth={2.5} />
                                    </button>
                                    {inter.status !== 'completed' && (
                                        <button
                                            onClick={() => { setSelectedInter(inter); setIsReporting(true); }}
                                            className="flex-1 h-11 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                        >
                                            <Play size={14} className="sm:size-[18px]" fill="currentColor" strokeWidth={0} />
                                            <span className="text-[12px] sm:text-[14px] font-black uppercase tracking-[0.2em]">Démarrer</span>
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
                            <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest ml-1">Choisir un Client</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
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
                                <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest ml-1">Choisir un Bassin</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {pools.length > 0 ? pools.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelPoolId(p.id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selPoolId === p.id ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        >
                                            <span className="text-[13px] font-black uppercase">{p.name}</span>
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
