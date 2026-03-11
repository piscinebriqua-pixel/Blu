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
    User,
    Wallet,
    TrendingUp,
    Minus,
    ArrowUpRight,
    LayoutGrid,
    Package as PackageIcon
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import NewIntervention from '../components/NewIntervention';
import ModalLayout from '../components/ModalLayout';
import Combobox from '../components/ui/Combobox';
import { toast } from 'react-hot-toast';

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

    // Finance State
    const [balance, setBalance] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);
    const [advanceCategories, setAdvanceCategories] = useState<any[]>([]);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
    const [isRemittanceModalOpen, setIsRemittanceModalOpen] = useState(false);
    const [techId, setTechId] = useState<string | null>(null);
    const [isFinancing, setIsFinancing] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    useEffect(() => {
        fetchDailyTour();
        fetchFinanceData();
    }, []);

    const fetchDailyTour = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Fetch profile and technician info
            const [profileRes, techRes] = await Promise.all([
                supabase.from('profiles').select('role').eq('id', session.user.id),
                supabase.from('technicians').select('id, full_name').eq('email', session.user.email).eq('active', true)
            ]);

            const profileData = profileRes.data?.[0];
            const techData = techRes.data?.[0];

            if (techData?.id) setTechId(techData.id);

            const isAdmin = profileData?.role === 'admin';
            const currentTechId = techData?.id;

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

            if (!isAdmin && currentTechId) {
                query = query.eq('technician_id', currentTechId);
            } else if (!isAdmin && !currentTechId) {
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

    const fetchFinanceData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: techData } = await supabase
                .from('technicians')
                .select('id')
                .eq('email', session.user.email)
                .eq('active', true)
                .single();

            if (!techData) return;

            const currentTechId = techData.id;

            // Categories
            const [catRes, advCatRes] = await Promise.all([
                supabase.from('expense_categories').select('*').order('name'),
                supabase.from('advance_categories').select('*').order('name')
            ]);
            setCategories(catRes.data || []);
            setAdvanceCategories(advCatRes.data || []);

            // Parallel fetches for balance calculation
            const [payRes, expRes, advRes, remRes] = await Promise.all([
                supabase.from('payments').select('amount').eq('technician_id', currentTechId).neq('method', 'remise'),
                supabase.from('expenses').select('amount').eq('technician_id', currentTechId).eq('status', 'validated'),
                supabase.from('advances').select('amount').eq('technician_id', currentTechId).eq('status', 'validated'),
                supabase.from('remittances').select('amount').eq('technician_id', currentTechId).eq('status', 'validated')
            ]);

            const totalPay = payRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
            const totalExp = expRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
            const totalAdv = advRes.data?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
            const totalRem = remRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

            setBalance(totalPay - totalExp - totalAdv - totalRem);
        } catch (error) {
            console.error('Error fetching finance:', error);
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
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-100/80 leading-none mb-2">Programme du</p>
                            <div className="flex flex-col">
                                <span className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-white">
                                    {new Date().toLocaleDateString('fr-FR', { day: 'numeric' })}
                                </span>
                                <span className="text-xl sm:text-3xl font-black uppercase tracking-[0.1em] text-blue-100/90">
                                    {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500">
                            <span className="text-3xl sm:text-5xl font-black text-white leading-none">{interventions.length}</span>
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] text-white/70">Visites</span>
                        </div>
                    </div>
                </div>

                {/* MA CAISSE - REFINED WALLET WIDGET */}
                <div className="bg-white dark:bg-slate-800/80 rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none animate-in fade-in zoom-in duration-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                <Wallet size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Ma Caisse</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1 opacity-70">Balance théorique</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                                {balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-lg opacity-40">TND</span>
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <TrendingUp size={12} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Solde Actuel</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Finance Actions */}
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={() => {
                        setSelectedCategoryId('');
                        setIsExpenseModalOpen(true);
                    }}
                            className="group flex flex-col items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl hover:bg-rose-100 transition-all active:scale-95"
                        >
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-rose-500/20 flex items-center justify-center text-rose-600 shadow-sm group-hover:rotate-12 transition-transform">
                                <Minus size={24} strokeWidth={3} />
                            </div>
                            <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest">Dépense</span>
                        </button>

                        <button 
                            onClick={() => {
                        setSelectedCategoryId('');
                        setIsAdvanceModalOpen(true);
                    }}
                            className="group flex flex-col items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl hover:bg-amber-100 transition-all active:scale-95"
                        >
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm group-hover:-rotate-12 transition-transform">
                                <ArrowUpRight size={24} strokeWidth={3} />
                            </div>
                            <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Avance</span>
                        </button>

                        <button 
                            onClick={() => setIsRemittanceModalOpen(true)}
                            className="group flex flex-col items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl hover:bg-emerald-100 transition-all active:scale-95"
                        >
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                                <ArrowRight size={24} strokeWidth={3} />
                            </div>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Versement</span>
                        </button>
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
                            <Combobox
                                label="Choisir un Client"
                                icon={User}
                                placeholder="Rechercher un client..."
                                options={clients.map(c => ({
                                    label: `${c.first_name} ${c.last_name}`,
                                    value: c.id
                                }))}
                                value={selClient?.id || ''}
                                onChange={(val) => {
                                    const c = clients.find(cl => cl.id === val);
                                    if (c) handleSelectClient(c);
                                }}
                            />
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
                        fetchDailyTour();
                        fetchFinanceData();
                    }}
                />
            )}

            {/* FINANCE MODALS */}
            {isExpenseModalOpen && (
                <ModalLayout
                    title="Déclarer une Dépense"
                    onClose={() => setIsExpenseModalOpen(false)}
                    actions={
                        <button
                            form="expense-form"
                            type="submit"
                            disabled={isFinancing}
                            className="btn-flow btn-primary w-full !h-14 disabled:opacity-50"
                        >
                            {isFinancing ? 'Envoi...' : 'VALIDER LA DÉPENSE'}
                        </button>
                    }
                >
                    <form id="expense-form" className="flex flex-col gap-6" onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const amount = Number(formData.get('amount'));
                        const category_id = formData.get('category_id') as string;
                        const description = formData.get('description') as string;

                        if (!amount || !category_id) return toast.error('Montant et catégorie requis');

                        setIsFinancing(true);
                        try {
                            const { error } = await supabase.from('expenses').insert({
                                technician_id: techId,
                                category_id,
                                amount,
                                description,
                                status: 'pending'
                            });
                            if (error) throw error;
                            toast.success('Dépense enregistrée (En attente de validation)');
                            setIsExpenseModalOpen(false);
                            fetchFinanceData();
                        } catch (err: any) {
                            toast.error(err.message);
                        } finally {
                            setIsFinancing(false);
                        }
                    }}>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Combobox 
                                    label="Type de dépense"
                                    icon={LayoutGrid}
                                    placeholder="Choisir une catégorie..."
                                    options={categories.map(cat => ({
                                        label: cat.name,
                                        value: cat.id
                                    }))}
                                    value={selectedCategoryId}
                                    onChange={setSelectedCategoryId}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (TND)</label>
                                <input 
                                    name="amount"
                                    type="number" 
                                    step="0.01" 
                                    required
                                    placeholder="0.00"
                                    className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-black text-2xl text-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Justification</label>
                                <textarea 
                                    name="description"
                                    rows={2}
                                    placeholder="Détaillez votre dépense..."
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-300 text-base"
                                />
                            </div>
                        </div>
                    </form>
                </ModalLayout>
            )}

            {isAdvanceModalOpen && (
                <ModalLayout
                    title="Demander une Avance"
                    onClose={() => setIsAdvanceModalOpen(false)}
                    actions={
                        <button
                            form="advance-form"
                            type="submit"
                            disabled={isFinancing}
                            className="btn-flow btn-primary w-full !h-14 disabled:opacity-50"
                        >
                            {isFinancing ? 'Envoi...' : 'DEMANDER L\'AVANCE'}
                        </button>
                    }
                >
                    <form id="advance-form" className="flex flex-col gap-6" onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const amount = Number(formData.get('amount'));
                        const category_id = formData.get('category_id') as string;
                        const description = formData.get('description') as string;

                        if (!amount || !category_id) return toast.error('Montant et catégorie requis');

                        setIsFinancing(true);
                        try {
                            const { error } = await supabase.from('advances').insert({
                                technician_id: techId,
                                amount,
                                category_id,
                                description,
                                status: 'pending'
                            });
                            if (error) throw error;
                            toast.success('Demande d\'avance envoyée (En attente de validation)');
                            setIsAdvanceModalOpen(false);
                            fetchFinanceData();
                        } catch (err: any) {
                            toast.error(err.message);
                        } finally {
                            setIsFinancing(false);
                        }
                    }}>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl mb-4">
                            <p className="text-[12px] font-bold text-amber-700 dark:text-amber-400 uppercase leading-relaxed">
                                Note : Les avances sont déduites de votre caisse et devront être validées par l'administrateur.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Combobox 
                                label="Type d'avance"
                                icon={LayoutGrid}
                                placeholder="Choisir une catégorie..."
                                options={advanceCategories.map(cat => ({
                                    label: cat.name,
                                    value: cat.id
                                }))}
                                value={selectedCategoryId}
                                onChange={setSelectedCategoryId}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant de l'avance (TND)</label>
                            <input 
                                name="amount"
                                type="number" 
                                step="0.01" 
                                required
                                placeholder="0.00"
                                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-black text-2xl text-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Motif</label>
                            <textarea 
                                name="description"
                                rows={2}
                                placeholder="Pourquoi avez-vous besoin de cette avance ?"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-300 text-base"
                            />
                        </div>
                    </form>
                </ModalLayout>
            )}

            {isRemittanceModalOpen && (
                <ModalLayout
                    title="Déclarer un Versement"
                    onClose={() => setIsRemittanceModalOpen(false)}
                    actions={
                        <button
                            form="remittance-form"
                            type="submit"
                            disabled={isFinancing}
                            className="btn-flow btn-primary w-full !h-14 disabled:opacity-50"
                        >
                            {isFinancing ? 'Envoi...' : 'CONFIRMER LE VERSEMENT'}
                        </button>
                    }
                >
                    <form id="remittance-form" className="flex flex-col gap-6" onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const amount = Number(formData.get('amount'));
                        const method = formData.get('method') as string;
                        const description = formData.get('description') as string;

                        if (!amount) return toast.error('Montant requis');

                        setIsFinancing(true);
                        try {
                            const { error } = await supabase.from('remittances').insert({
                                technician_id: techId,
                                amount,
                                method,
                                description,
                                status: 'pending'
                            });
                            if (error) throw error;
                            toast.success('Déclaration de versement envoyée');
                            setIsRemittanceModalOpen(false);
                            fetchFinanceData();
                        } catch (err: any) {
                            toast.error(err.message);
                        } finally {
                            setIsFinancing(false);
                        }
                    }}>
                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Mode de Versement</label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                                    <input type="radio" name="method" value="cash" className="hidden" defaultChecked />
                                    <Wallet size={20} className="text-primary" />
                                    <span className="text-[14px] font-black uppercase text-slate-700 dark:text-slate-300">Espèces (Cash)</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                                    <input type="radio" name="method" value="check" className="hidden" />
                                    <PackageIcon size={20} className="text-primary" />
                                    <span className="text-[14px] font-black uppercase text-slate-700 dark:text-slate-300">Chèque</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant versé (TND)</label>
                            <input 
                                name="amount"
                                type="number" 
                                step="0.01" 
                                required
                                placeholder="0.00"
                                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-black text-2xl text-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Commentaires</label>
                            <textarea 
                                name="description"
                                rows={3}
                                placeholder="Précisez le destinataire ou détails du chèque..."
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-300 text-base"
                            />
                        </div>
                    </form>
                </ModalLayout>
            )}
        </PageLayout>
    );
};

export default TechnicianPortal;
