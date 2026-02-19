import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Plus,
    MessageCircle,
    Navigation,
    Edit2,
    CheckCircle2,
    MapPin,
    Phone,
    User,
    ArrowRight,
    Waves,
    History,
    Wallet,
    Mail,
    Calendar,
    ChevronRight,
    Search
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
                <div className="card-premium grad-blue vibrant !p-6 relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <User size={200} />
                    </div>

                    <div className="relative z-10 flex-column gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-3xl bg-white/20 flex-center text-white border border-white/20 font-black text-3xl shadow-2xl backdrop-blur-sm">
                                {client?.first_name.charAt(0)}{client?.last_name.charAt(0)}
                            </div>
                            <div className="flex-column gap-1">
                                <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                                    {client?.first_name} {client?.last_name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-white/70">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        <MapPin size={12} className="text-white/50" /> {client?.city || 'Tunisie'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        <Mail size={12} className="text-white/50" /> {client?.email || 'Pas d\'email'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Metrics */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex-column">
                                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Solde</span>
                                <span className={`text-sm font-black mt-2 ${client && client.balance < 0 ? 'text-red-300' : 'text-green-300'}`}>
                                    {client?.balance.toFixed(0)} <span className="text-[10px]">DT</span>
                                </span>
                            </div>
                            <div className="bg-black/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex-column">
                                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Bassins</span>
                                <span className="text-sm font-black text-white mt-2">{pools.length}</span>
                            </div>
                            <div className="bg-black/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex-column">
                                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Dernier</span>
                                <span className="text-sm font-black text-white mt-2 truncate">
                                    {interventions[0] ? new Date(interventions[0].created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '--/--'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="data-grid grid-1 md:grid-2 !gap-6">
                    {/* 2. Bassins Section */}
                    <div className="flex-column gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-4 bg-primary rounded-full shadow-glow-primary" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Équipements & Bassins</h3>
                            </div>
                            <button
                                onClick={() => setIsPoolModalOpen(true)}
                                className="btn-icon !w-9 !h-9 !border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white"
                                title="Ajouter une structure"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="flex-column gap-3">
                            {pools.map(pool => (
                                <div key={pool.id} className="card-premium !bg-secondary/10 hover:border-primary/40 border-white/5 transition-all group/pool !p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-primary/10 flex-center text-primary border border-primary/20 group-hover/pool:scale-105 transition-transform">
                                                <Waves size={20} />
                                            </div>
                                            <div className="flex-column gap-0.5">
                                                <h4 className="text-xs font-black uppercase text-white tracking-tight">{pool.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-muted uppercase">{pool.volume_m3} m³</span>
                                                    <span className="text-[8px] opacity-20 text-white">•</span>
                                                    <span className="text-[9px] font-bold text-primary uppercase">{pool.treatment_method}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedPoolId(pool.id); setIsInterventionModalOpen(true); }}
                                            className="btn-primary !h-[38px] !px-4 !text-[9px] font-black group-hover/pool:translate-x-1 transition-transform"
                                        >
                                            RAPPORT <ArrowRight size={14} className="ml-1" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {pools.length === 0 && (
                                <button
                                    onClick={() => setIsPoolModalOpen(true)}
                                    className="flex-center flex-column py-12 border-2 border-dashed border-white/5 rounded-3xl text-muted hover:border-primary/30 hover:text-primary transition-all gap-3 bg-white/2"
                                >
                                    <Plus size={30} className="opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ajouter le premier bassin</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 3. Journal d'activités Section */}
                    <div className="flex-column gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-status-violet rounded-full shadow-glow-violet" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Derniers Facturables</h3>
                        </div>

                        <div className="flex-column gap-3">
                            {interventions.map(inter => (
                                <div key={inter.id} className="card-premium !bg-secondary/10 border-white/5 hover:border-status-violet/30 transition-all !p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-status-violet/10 flex-center text-status-violet border border-status-violet/10">
                                                <Calendar size={18} />
                                            </div>
                                            <div className="flex-column gap-0.5">
                                                <p className="text-xs font-black text-white uppercase">
                                                    {new Date(inter.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                                                </p>
                                                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">{inter.pool_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex-column items-end gap-1">
                                            <div className="flex gap-1.5">
                                                {inter.ph_level && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[8px] font-black border border-primary/10">PH {inter.ph_level}</span>}
                                                {inter.chlorine_level && <span className="bg-status-violet/10 text-status-violet px-2 py-0.5 rounded-lg text-[8px] font-black border border-status-violet/10">CL {inter.chlorine_level}</span>}
                                            </div>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${inter.status === 'completed' ? 'text-status-green bg-status-green/10' : 'text-status-orange bg-status-orange/10'}`}>
                                                {inter.status}
                                            </span>
                                        </div>
                                    </div>
                                    {inter.notes && (
                                        <div className="mt-3 p-3 bg-black/20 rounded-xl border-l-2 border-primary/40">
                                            <p className="text-[10px] text-muted font-medium italic leading-relaxed">"{inter.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {interventions.length === 0 && (
                                <div className="flex-center flex-column py-12 border-2 border-dashed border-white/5 rounded-3xl text-muted gap-3 bg-white/2">
                                    <History size={30} className="opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Aucune intervention réglée</span>
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
