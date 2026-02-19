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
    Mail
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import NewIntervention from '../components/NewIntervention';
import AddPoolModal from '../components/AddPoolModal';
import EditClientModal from '../components/EditClientModal';

interface Pool {
    id: string;
    name: string;
    volume_m3: number;
    treatment_method: string;
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
    const [loading, setLoading] = useState(true);

    const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
    const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

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

        } catch (error) {
            console.error('Erreur:', error);
            navigate('/clients');
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = () => {
        if (client?.phone) {
            const formattedPhone = client.phone.replace(/\s/g, '').replace('+', '');
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
                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 font-black text-4xl shadow-xl ring-4 ring-white/5">
                                    {client?.first_name.charAt(0)}{client?.last_name.charAt(0)}
                                </div>
                                <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-[#0B2347] ${client?.balance && client.balance < 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                    {client?.balance && client.balance < 0 ? 'Dû' : 'Ok'}
                                </div>
                            </div>

                            <div className="flex-1 space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-lg">
                                    {client?.first_name} <span className="text-blue-300">{client?.last_name}</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-blue-100/80">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                                        <MapPin size={12} className="text-cyan-300" /> {client?.city || 'Tunisie'}
                                    </div>
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
                                <div key={pool.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100/50 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all group/pool relative overflow-hidden" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 rounded-bl-full opacity-50" />

                                    <div className="flex flex-col gap-4 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner group-hover/pool:scale-110 transition-transform duration-500">
                                                <Waves size={24} />
                                            </div>
                                            <button
                                                onClick={() => { setSelectedPoolId(pool.id); setIsInterventionModalOpen(true); }}
                                                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10"
                                            >
                                                Rapport
                                            </button>
                                        </div>

                                        <div>
                                            <h4 className="text-base font-black text-slate-800 dark:text-white leading-tight mb-1">{pool.name}</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                                                    {pool.volume_m3} m³
                                                </span>
                                                <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                                    {pool.treatment_method}
                                                </span>
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
                                <div key={inter.id} className="animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-backwards relative pl-14 group/inter" style={{ animationDelay: `${idx * 150}ms` }}>
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
        </PageLayout>
    );
};

export default ClientDetail;
