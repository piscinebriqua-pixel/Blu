import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Plus,
    MessageCircle,
    Navigation,
    Edit2,
    MapPin,
    User,
    Waves,
    History,
    Wallet,
    Mail,
    Calendar,
    Phone
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import NewIntervention from '../components/NewIntervention';
import MapPicker from '../components/MapPicker';
import AddPoolModal from '../components/AddPoolModal';
import EditClientModal from '../components/EditClientModal';
import RecordPaymentModal from '../components/RecordPaymentModal';
import EditPoolModal from '../components/EditPoolModal';

interface Pool {
    id: string;
    name: string;
    volume_m3: number;
    treatment_method: string;
    lining_type: string;
    filter_type: string;
    is_contracted: boolean;
    maintenance_frequency: string;
    preferred_day: number;
}

interface Intervention {
    id: string;
    visit_date: string;
    created_at: string;
    notes: string;
    ph_level: number;
    chlorine_level: number;
    status: string;
    pool_name?: string;
    intervention_products?: {
        quantity: number;
        inventory_products: { name: string; unit: string; }
    }[];
}

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    phone2?: string;
    email: string;
    address: string;
    city: string;
    balance: number;
    notes: string;
    gps_lat: number | null;
    gps_lng: number | null;
}

const ClientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [pools, setPools] = useState<Pool[]>([]);
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'finance'>('profile');
    const [loading, setLoading] = useState(true);

    const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
    const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditPoolModalOpen, setIsEditPoolModalOpen] = useState(false);
    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

    useEffect(() => {
        if (id) {
            fetchClientData();
        }
    }, [id]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const { data: clientData, error: clientError } = await supabase.from('clients').select('*').eq('id', id).single();
            if (clientError) throw clientError;
            setClient(clientData);

            const { data: poolData } = await supabase.from('pools').select('*').eq('client_id', id);
            setPools(poolData || []);

            const { data: interData } = await supabase
                .from('interventions')
                .select(`
                    id, 
                    visit_date, 
                    created_at,
                    notes, 
                    ph_level, 
                    chlorine_level, 
                    status, 
                    pool:pools(name), 
                    intervention_products(quantity, inventory_products(name, unit))
                `)
                .in('pool_id', poolData?.map(p => p.id) || [])
                .order('created_at', { ascending: false })
                .limit(10);

            const formattedInters = interData?.map((i: any) => ({
                ...i,
                pool_name: i.pool?.name
            })) || [];
            setInterventions(formattedInters);

            const { data: payData } = await supabase
                .from('payments')
                .select('*, technician:technicians(full_name)')
                .eq('client_id', id)
                .order('payment_date', { ascending: false });
            setPayments(payData || []);

        } catch (error) {
            console.error('Erreur:', error);
            navigate('/clients');
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = () => {
        if (client?.phone) {
            let formattedPhone = client.phone.replace(/\s/g, '').replace('+', '');
            // Si le numéro commence par un chiffre autre que 216 et fait 8 chiffres, on ajoute le préfixe Tunisie
            if (formattedPhone.length === 8 && !formattedPhone.startsWith('216')) {
                formattedPhone = '216' + formattedPhone;
            }
            window.open(`https://wa.me/${formattedPhone}`, '_blank');
        }
    };

    const openGPS = () => {
        if (client?.gps_lat && client?.gps_lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${client.gps_lat},${client.gps_lng}`, '_blank');
        } else if (client?.address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address + ' ' + (client.city || ''))}`, '_blank');
        }
    };

    if (!client && !loading) return null;

    const toolbar = (
        <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2">
                <button onClick={openWhatsApp} className="btn-icon !bg-[#25D366] !text-white !border-none !w-10 !h-10 shadow-lg shadow-green-500/20" title="WhatsApp">
                    <MessageCircle size={18} />
                </button>
                <button onClick={openGPS} className="btn-icon !bg-orange-500 !text-white !border-none !w-10 !h-10 shadow-lg shadow-orange-500/20" title="Navigation">
                    <Navigation size={18} />
                </button>
            </div>
            <button onClick={() => setIsEditClientModalOpen(true)} className="btn-secondary !h-[40px] !px-4 !text-[10px] font-black">
                <Edit2 size={14} /> <span className="hidden sm:inline">MODIFIER PROFIL</span>
            </button>
        </div>
    );

    return (
        <PageLayout
            title="Dossier Client"
            subtitle={`${client?.first_name} ${client?.last_name}`}
            showBackButton={true}
            toolbar={toolbar}
            loading={loading}
        >
            <div className="flex-column gap-6">

                {/* 1. Header Card - Premium Identity */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0B2347] to-[#1e3a8a] p-8 shadow-2xl transition-all duration-500 hover:shadow-blue-900/20 group">
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="absolute -right-8 -top-8 opacity-[0.03] rotate-12 transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-6">
                        <User size={300} />
                    </div>

                    <div className="relative z-10 flex flex-col gap-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

                            <div className="flex-1 space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-lg">
                                    {client?.first_name} <span className="text-blue-300">{client?.last_name}</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-blue-100/80">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                                        <MapPin size={12} className="text-cyan-300" /> {client?.city || 'Tunisie'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                                        <Phone size={12} className="text-cyan-300" /> {client?.phone}
                                    </div>
                                    {client?.phone2 && (
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                                            <Phone size={12} className="text-cyan-300" /> {client.phone2}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                                        <Mail size={12} className="text-cyan-300" /> {client?.email || 'Pas d\'email'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/5 transition-colors group/stat">
                                <span className="flex items-center gap-2 text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">
                                    <Wallet size={12} /> Solde Actuel
                                </span>
                                <span className={`text-2xl font-black block tracking-tight ${client && client.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {client?.balance.toFixed(0)} <span className="text-xs opacity-60 font-bold">DT</span>
                                </span>
                            </div>

                            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/5 transition-colors group/stat">
                                <span className="flex items-center gap-2 text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">
                                    <Waves size={12} /> Bassins
                                </span>
                                <span className="text-2xl font-black text-white block tracking-tight">
                                    {pools.length} <span className="text-xs opacity-60 font-bold text-blue-200">Unités</span>
                                </span>
                            </div>

                            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/5 transition-colors group/stat">
                                <span className="flex items-center gap-2 text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">
                                    <History size={12} /> Dernière visite
                                </span>
                                <span className="text-2xl font-black text-white block tracking-tight">
                                    {interventions[0] ? new Date(interventions[0].created_at).getDate() : '--'} <span className="text-xs opacity-60 font-bold text-blue-200 uppercase">{interventions[0] ? new Date(interventions[0].created_at).toLocaleDateString('fr-FR', { month: 'short' }) : ''}</span>
                                </span>
                            </div>

                            <button onClick={() => setIsEditClientModalOpen(true)} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all active:scale-95 group/btn flex flex-col justify-center items-center gap-2 text-center">
                                <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-200 group-hover/btn:scale-110 transition-transform">
                                    <Edit2 size={16} />
                                </span>
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Modifier Profil</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'}`}
                    >
                        Détails
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'finance' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'}`}
                    >
                        Finance
                    </button>
                </div>

                {activeTab === 'profile' ? (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                        {/* 1.5 GPS Map Preview */}
                        {client?.gps_lat && client?.gps_lng && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-yellow-400 rounded-full" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Localisation GPS</h3>
                                </div>
                                <div className="p-1.5 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700">
                                    <MapPicker
                                        lat={client.gps_lat}
                                        lng={client.gps_lng}
                                        readonly={true}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* 2. Bassins Section */}
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Parc & Équipements</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsPoolModalOpen(true)}
                                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Ajouter une structure"
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {pools.map((pool, idx) => (
                                        // eslint-disable-next-line
                                        <div key={pool.id} className={`animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100/50 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all group/pool relative overflow-hidden ${idx < 10 ? `stagger-${idx + 1}` : ''}`}>
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 rounded-bl-full opacity-50" />

                                            <div className="flex flex-col gap-4 relative z-10">
                                                <div className="flex justify-between items-start">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner group-hover/pool:scale-110 transition-transform duration-500">
                                                        <Waves size={24} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => { setSelectedPoolId(pool.id); setIsInterventionModalOpen(true); }}
                                                            className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10"
                                                        >
                                                            Rapport
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedPool(pool); setIsEditPoolModalOpen(true); }}
                                                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all"
                                                            title="Paramètres bassin"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-base font-black text-slate-800 dark:text-white leading-tight">{pool.name}</h4>
                                                        {(pool as any).is_contracted && (
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" title="Sous contrat d'entretien" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                                                            {pool.volume_m3} m³
                                                        </span>
                                                        {(pool as any).is_contracted ? (
                                                            <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                                                                <Calendar size={10} /> {(pool as any).maintenance_frequency === 'weekly' ? '7j' : (pool as any).maintenance_frequency === 'biweekly' ? '14j' : '30j'}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                                                {pool.treatment_method}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => setIsPoolModalOpen(true)}
                                        className="min-h-[160px] flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group/add"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center group-hover/add:scale-110 transition-transform">
                                            <Plus size={24} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Nouveau Bassin</span>
                                    </button>
                                </div>
                            </div>

                            {/* 3. Journal d'activités Section */}
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-1.5 h-6 bg-gradient-to-b from-violet-500 to-fuchsia-400 rounded-full" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Journal d'Activité</h3>
                                </div>

                                <div className="flex flex-col gap-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent dark:before:from-slate-700 before:content-['']">
                                    {interventions.map((inter, idx) => (
                                        // eslint-disable-next-line
                                        <div key={inter.id} className={`animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-backwards relative pl-14 group/inter ${idx < 10 ? `stagger-${idx + 1}` : ''}`}>
                                            {/* Timeline Dot */}
                                            <div className="absolute left-[21px] top-6 w-2.5 h-2.5 rounded-full bg-white dark:bg-slate-800 border-[3px] border-slate-300 dark:border-slate-600 group-hover/inter:border-violet-500 group-hover/inter:scale-125 transition-all z-10" />

                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-violet-100 dark:hover:border-violet-900 transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wide">
                                                            {new Date(inter.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                                            {inter.pool_name}
                                                        </span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${inter.status === 'completed' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800'}`}>
                                                        {inter.status}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {inter.ph_level && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">PH <span className="text-slate-900 dark:text-white">{inter.ph_level}</span></span>
                                                        </div>
                                                    )}
                                                    {inter.chlorine_level && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">CL <span className="text-slate-900 dark:text-white">{inter.chlorine_level}</span></span>
                                                        </div>
                                                    )}
                                                </div>

                                                {inter.notes && (
                                                    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 italic">
                                                        "{inter.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {interventions.length === 0 && (
                                        <div className="ml-14 py-8 px-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center gap-2 text-slate-400">
                                            <History size={24} className="opacity-50" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Aucune activité récente</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                        {/* Finance Content */}
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Gestion Financière</h3>
                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="px-5 py-2.5 bg-[#0077B6]/10 text-[#0077B6] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0077B6] hover:text-white transition-all"
                            >
                                <Plus size={14} className="mr-1" /> NOUVEAU PAIEMENT
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Interventions Récentes</h4>
                                <div className="space-y-4">
                                    {interventions.map(inter => (
                                        <div key={inter.id} className="card-white flex flex-col !items-stretch !p-5 hover:scale-[1.01]">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{inter.id.slice(0, 8)}</span>
                                                <span className="text-xs font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">- 45 DT</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{inter.pool_name}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Calendar size={10} className="text-slate-400" />
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{new Date(inter.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Historique Paiements</h4>
                                <div className="space-y-4">
                                    {payments.length === 0 ? (
                                        <div className="p-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] text-center text-slate-300">
                                            <Wallet size={24} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Aucun règlement</p>
                                        </div>
                                    ) : (
                                        payments.map(pay => (
                                            <div key={pay.id} className="card-white flex justify-between items-center !p-5 hover:scale-[1.01]">
                                                <div>
                                                    <p className="text-sm font-black text-emerald-500">+{pay.amount} DT</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{pay.method} • {new Date(pay.payment_date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{pay.technician?.full_name || 'Admin'}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Notes Générales / Footer */}
                {client?.notes && (
                    <div className="card-premium !bg-secondary/30 !border-white/5 !p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <History size={14} className="text-muted" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted">Notes Internes</h4>
                        </div>
                        <p className="text-xs text-muted leading-relaxed italic">{client.notes}</p>
                    </div>
                )}

            </div>

            {/* Modals */}
            {isInterventionModalOpen && selectedPoolId && (
                <NewIntervention
                    poolId={selectedPoolId}
                    clientId={id!}
                    onClose={() => setIsInterventionModalOpen(false)}
                    onSuccess={fetchClientData}
                />
            )}
            {isPoolModalOpen && (
                <AddPoolModal
                    clientId={id!}
                    onClose={() => setIsPoolModalOpen(false)}
                    onSuccess={fetchClientData}
                />
            )}
            {isEditClientModalOpen && (
                <EditClientModal
                    client={client}
                    onClose={() => setIsEditClientModalOpen(false)}
                    onSuccess={fetchClientData}
                />
            )}
            {isPaymentModalOpen && (
                <RecordPaymentModal
                    clientId={id!}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={() => {
                        setIsPaymentModalOpen(false);
                        fetchClientData();
                    }}
                />
            )}
            {isEditPoolModalOpen && selectedPool && (
                <EditPoolModal
                    pool={selectedPool}
                    onClose={() => { setIsEditPoolModalOpen(false); setSelectedPool(null); }}
                    onSuccess={fetchClientData}
                />
            )}
        </PageLayout>
    );
};

export default ClientDetail;
