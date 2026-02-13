import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft,
    Droplets,
    Plus,
    MessageCircle,
    Navigation,
    Loader2,
    Edit2,
    CheckCircle2,
    MapPin
} from 'lucide-react';
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

            if (poolData && poolData.length > 0) {
                const poolIds = poolData.map(p => p.id);
                const { data: interData } = await supabase
                    .from('interventions')
                    .select('id, visit_date, notes, ph_level, chlorine_level, status, pools(name), intervention_products(quantity, inventory_products(name, unit))')
                    .in('pool_id', poolIds)
                    .order('visit_date', { ascending: false })
                    .limit(10);

                const formattedInters = interData?.map((i: any) => ({
                    ...i,
                    pool_name: i.pools?.name
                })) || [];
                setInterventions(formattedInters);
            }
        } catch (error) {
            console.error('Erreur:', error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = () => {
        if (client?.phone) {
            const formattedPhone = client.phone.replace(/\s/g, '');
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

    if (loading || !client) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#020617]">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="page-container pb-28">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/clients')} className="btn-pill btn-outline" style={{ padding: '0.75rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="welcome-text" style={{ fontSize: '1.75rem' }}>Fiche Client</h1>
                        <p className="date-text">IDENTIFIANT: {client.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
                <button onClick={() => setIsEditClientModalOpen(true)} className="btn-pill btn-outline">
                    <Edit2 size={16} /> MODIFIER PROFIL
                </button>
            </div>

            {/* Hero Card */}
            <div className="premium-card mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Droplets size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-32 h-32 rounded-[40px] bg-blue-500 flex items-center justify-center text-5xl font-black text-white shadow-[0_20px_40px_rgba(10,132,255,0.4)]">
                        {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="welcome-text" style={{ fontSize: '2.5rem', background: 'none', WebkitTextFillColor: 'white' }}>{client.first_name} {client.last_name}</h2>
                        <p className="text-secondary flex items-center justify-center md:justify-start gap-2 mt-4 font-bold">
                            <MapPin size={18} className="text-blue-500" />
                            {client.address} {client.city ? `(${client.city})` : ''}
                        </p>
                        <div className="flex justify-center md:justify-start gap-4 mt-8">
                            <button onClick={openWhatsApp} className="btn-pill" style={{ background: '#25D366', color: 'white', padding: '0.8rem 2rem' }}>
                                <MessageCircle size={20} /> WHATSAPP
                            </button>
                            <button onClick={openGPS} className="btn-pill btn-outline" style={{ borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)' }}>
                                <Navigation size={20} /> NAVIGUER
                            </button>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="mini-stat-label">Solde Actuel</p>
                        <p className="text-5xl font-black" style={{ color: client.balance < 0 ? 'var(--accent-pink)' : 'var(--accent-green)' }}>
                            {client.balance.toFixed(0)} <span className="text-xl">DT</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Bassins */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="welcome-text" style={{ fontSize: '1.2rem', background: 'none', WebkitTextFillColor: 'white' }}>Structures & Bassins</h3>
                        <button onClick={() => setIsPoolModalOpen(true)} className="btn-pill btn-outline" style={{ fontSize: '0.7rem' }}>
                            <Plus size={14} /> AJOUTER
                        </button>
                    </div>

                    <div className="space-y-4">
                        {pools.map(pool => (
                            <div key={pool.id} className="premium-card flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div>
                                    <h4 className="font-black text-white uppercase tracking-tight text-lg">{pool.name}</h4>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{pool.volume_m3} m³</span>
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{pool.treatment_method}</span>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedPoolId(pool.id); setIsInterventionModalOpen(true); }} className="btn-pill btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.7rem' }}>
                                    RAPPORT
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: History */}
                <div>
                    <h3 className="welcome-text mb-6" style={{ fontSize: '1.2rem', background: 'none', WebkitTextFillColor: 'white' }}>Journal d'activités</h3>
                    <div className="space-y-4">
                        {interventions.map(inter => (
                            <div key={inter.id} className="premium-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem' }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-base">
                                                {new Date(inter.visit_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                            </p>
                                            <p className="text-[10px] text-muted font-black tracking-widest uppercase">{inter.pool_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {inter.ph_level && <span className="bg-[#1c222d] text-blue-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/5">pH {inter.ph_level}</span>}
                                        {inter.chlorine_level && <span className="bg-[#1c222d] text-purple-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/5">CL {inter.chlorine_level}</span>}
                                    </div>
                                </div>

                                {inter.intervention_products && inter.intervention_products.length > 0 && (
                                    <div className="mb-4 flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                        {inter.intervention_products.map((ip: any, idx: number) => (
                                            <div key={idx} className="bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-[10px] font-black text-blue-400">
                                                {ip.inventory_products.name} x{ip.quantity}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {inter.notes && (
                                    <div className="bg-black/20 p-4 rounded-2xl">
                                        <p className="text-xs text-secondary leading-relaxed font-medium italic">"{inter.notes}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isInterventionModalOpen && selectedPoolId && (
                <NewIntervention poolId={selectedPoolId} clientId={id!} onClose={() => setIsInterventionModalOpen(false)} onSuccess={fetchClientData} />
            )}
            {isPoolModalOpen && (
                <AddPoolModal clientId={id!} onClose={() => setIsPoolModalOpen(false)} onSuccess={fetchClientData} />
            )}
            {isEditClientModalOpen && (
                <EditClientModal client={client} onClose={() => setIsEditClientModalOpen(false)} onSuccess={fetchClientData} />
            )}
        </div>
    );
};

export default ClientDetail;
