import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    X,
    Droplets,
    Plus,
    MessageCircle,
    Key,
    CheckCircle2,
    Calendar,
    Waves,
    Loader2,
    ChevronRight,
    Phone
} from 'lucide-react';
import NewIntervention from './NewIntervention';
import AddPoolModal from './AddPoolModal';

interface ClientDetailsModalProps {
    clientId: string;
    onClose: () => void;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ clientId, onClose }) => {
    const [client, setClient] = useState<any>(null);
    const [pools, setPools] = useState<any[]>([]);
    const [interventions, setInterventions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('bassins');

    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
    const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);

    useEffect(() => {
        fetchClientData();
    }, [clientId]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const { data: clientData } = await supabase.from('clients').select('*').eq('id', clientId).single();
            setClient(clientData);

            const { data: poolData } = await supabase.from('pools').select('*').eq('client_id', clientId);
            setPools(poolData || []);

            if (poolData && poolData.length > 0) {
                const poolIds = poolData.map(p => p.id);
                const { data: interData } = await supabase
                    .from('interventions')
                    .select('id, visit_date, notes, ph_level, chlorine_level, status, pools(name), intervention_products(quantity, inventory_products(name, unit))')
                    .in('pool_id', poolIds)
                    .order('visit_date', { ascending: false });

                const formattedInters = interData?.map((i: any) => ({
                    ...i,
                    pool_name: i.pools?.name
                })) || [];
                setInterventions(formattedInters);
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (first: string, last: string) => {
        return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();
    };

    if (loading || !client) {
        return (
            <div className="modal-premium-backdrop">
                <div className="modal-premium-content items-center justify-center">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                </div>
            </div>
        );
    }

    return (
        <div className="modal-premium-backdrop" onClick={onClose}>
            <div className="modal-premium-content" onClick={e => e.stopPropagation()}>
                {/* Header Section */}
                <div className="modal-header-premium flex flex-col md:flex-row justify-between items-center gap-8 relative" style={{ padding: '3.5rem' }}>
                    {/* Integrated Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 rounded-[32px] bg-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl overflow-hidden border-4 border-white/10">
                            {getInitials(client.first_name, client.last_name)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">{client.first_name} {client.last_name}</h2>
                            <div className="flex flex-wrap gap-3">
                                <div className="badge-premium badge-grey">
                                    <Phone size={14} />
                                    {client.phone}
                                </div>
                                <button className="badge-premium badge-whatsapp">
                                    <MessageCircle size={14} /> WHATSAPP
                                </button>
                                <button className="badge-premium badge-pin">
                                    <Key size={14} /> PIN
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-12 mr-8">
                        <div className="text-right">
                            <p className="stat-label-premium">BASSINS</p>
                            <p className="text-3xl font-black text-white">{pools.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="stat-label-premium">VISITES</p>
                            <p className="text-3xl font-black text-white">{interventions.length}</p>
                        </div>
                        <div className="solde-badge-premium" style={{ minWidth: '140px' }}>
                            <p className="stat-label-premium" style={{ color: 'var(--accent-green)', opacity: 0.8 }}>SOLDE</p>
                            <p className="stat-value-premium" style={{ color: 'var(--accent-green)', fontSize: '1.8rem' }}>
                                {client.balance.toFixed(0)} <span className="text-xs opacity-60">DT</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tab-bar-premium">
                    <button
                        className={`tab-btn-premium ${activeTab === 'bassins' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bassins')}
                    >
                        <Waves size={16} /> BASSINS ({pools.length})
                    </button>
                    <button
                        className={`tab-btn-premium ${activeTab === 'journal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('journal')}
                    >
                        <Calendar size={16} /> JOURNAL ({interventions.length})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    {activeTab === 'bassins' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[11px] font-black text-muted uppercase tracking-[0.3em]">Structures Enregistrées</h4>
                                <button
                                    onClick={() => setIsPoolModalOpen(true)}
                                    className="btn-pill btn-outline text-[10px] px-6 py-3 border-white/10 hover:border-white/20"
                                >
                                    + AJOUTER UN BASSIN
                                </button>
                            </div>

                            {pools.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pools.map(pool => (
                                        <div key={pool.id} className="ticket-card-premium group" style={{ padding: '1.5rem 2rem' }}>
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                                    <Droplets size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white text-lg mb-1 uppercase tracking-tight">{pool.name}</h4>
                                                    <p className="text-[10px] text-white/30 font-black tracking-widest uppercase">{pool.volume_m3} m³ • {pool.treatment_method}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedPoolId(pool.id); setIsInterventionModalOpen(true); }}
                                                className="btn-pill btn-primary text-[10px] px-8 py-3 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                                            >
                                                RAPPORT
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-white/5 rounded-3xl">
                                    <Waves size={64} className="mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Aucun bassin enregistré</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'journal' && (
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-muted uppercase tracking-[0.3em] mb-4">Historique des interventions</h4>
                            {interventions.length > 0 ? (
                                interventions.map((inter) => (
                                    <div key={inter.id} className="ticket-card-premium" style={{ padding: '1.5rem 2.5rem' }}>
                                        <div className="flex items-center gap-8">
                                            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/10">
                                                <CheckCircle2 size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <h4 className="font-black text-white text-lg uppercase">{new Date(inter.visit_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-green-500/20">Terminée</span>
                                                </div>
                                                <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest">{inter.pool_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex gap-3">
                                                {inter.ph_level && <div className="bg-white/5 text-blue-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/5">pH {inter.ph_level}</div>}
                                                {inter.chlorine_level && <div className="bg-white/5 text-purple-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/5">CL {inter.chlorine_level}</div>}
                                            </div>
                                            <button className="text-white/20 hover:text-white transition-all ml-4">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-white/5 rounded-3xl">
                                    <Calendar size={64} className="mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Aucun historique de visite</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isInterventionModalOpen && selectedPoolId && (
                <NewIntervention poolId={selectedPoolId} clientId={clientId} onClose={() => setIsInterventionModalOpen(false)} onSuccess={fetchClientData} />
            )}
            {isPoolModalOpen && (
                <AddPoolModal clientId={clientId} onClose={() => setIsPoolModalOpen(false)} onSuccess={fetchClientData} />
            )}
        </div>
    );
};

export default ClientDetailsModal;
