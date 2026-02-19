import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Loader2,
    MapPin,
    Wallet,
    Phone,
    History,
    Calendar,
    Waves,
    Plus,
    ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModalLayout from './ModalLayout';
import Button from './ui/Button';
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
    const [activeTab, setActiveTab] = useState<'bassins' | 'journal'>('bassins');
    const navigate = useNavigate();

    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
    const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);

    useEffect(() => {
        if (clientId) fetchClientData();
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
                    .select('*, pools(name)')
                    .in('pool_id', poolIds)
                    .order('created_at', { ascending: false })
                    .limit(5);

                const formattedInters = interData?.map((i: any) => ({
                    ...i,
                    pool_name: i.pools?.name
                })) || [];
                setInterventions(formattedInters);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ModalLayout title="CHARGEMENT..." onClose={onClose}>
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
            </ModalLayout>
        );
    }

    if (!client) return null; // Keep this check in case client data fails to load

    return (
        <ModalLayout
            title="APERÇU CLIENT"
            onClose={onClose}
            actions={
                <div className="flex gap-2 w-full">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        FERMER
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigate(`/client/${client.id}`)}
                        className="flex-[2]"
                    >
                        <ExternalLink size={18} className="mr-2" />
                        DOSSIER COMPLET
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-6 p-4">
                {/* Identity Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                                {client.first_name} {client.last_name}
                            </h2>
                            <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm gap-2">
                                <MapPin size={14} />
                                <span>{client.address}, {client.city}</span>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${client.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                            {client.status === 'active' ? 'ACTIF' : 'INACTIF'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                            <div className="flex items-center gap-2 mb-1 text-slate-400 dark:text-slate-300">
                                <Wallet size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Solde</span>
                            </div>
                            <p className={`text-lg font-bold ${client.balance < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                                {client.balance?.toFixed(0)} <span className="text-xs text-slate-400 dark:text-slate-500">DT</span>
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                            <div className="flex items-center gap-2 mb-1 text-slate-400 dark:text-slate-300">
                                <Phone size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Contact</span>
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {client.phone || '-----'}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                {client.email || '-----'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                        onClick={() => setActiveTab('bassins')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider ${activeTab === 'bassins' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <Waves size={14} /> Bassins ({pools.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('journal')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider ${activeTab === 'journal' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <History size={14} /> Journal ({interventions.length})
                    </button>
                </div>

                {/* List Content */}
                <div className="flex flex-col gap-3 min-h-[200px]">
                    {activeTab === 'bassins' && (
                        <div className="flex flex-col gap-3">
                            {pools.length > 0 ? pools.map(pool => (
                                <div key={pool.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-700 transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400">
                                            <Waves size={20} />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">{pool.name}</h5>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">{pool.volume_m3}m³ • {pool.treatment_method}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedPoolId(pool.id); setIsInterventionModalOpen(true); }}
                                        className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                        title="Nouvelle intervention"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Waves className="mx-auto mb-2 opacity-50" size={24} />
                                    <p className="text-xs">Aucun bassin enregistré</p>
                                </div>
                            )}
                            <button
                                onClick={() => setIsPoolModalOpen(true)}
                                className="w-full py-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Ajouter un bassin
                            </button>
                        </div>
                    )}

                    {activeTab === 'journal' && (
                        <div className="flex flex-col gap-3">
                            {interventions.length > 0 ? interventions.map(inter => (
                                <div key={inter.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 dark:text-purple-400">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                {new Date(inter.created_at || inter.visit_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-bold">{inter.pool_name}</p>
                                        </div>
                                    </div>
                                    {inter.ph_level && (
                                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-600">
                                            PH {inter.ph_level}
                                        </span>
                                    )}
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <History className="mx-auto mb-2 opacity-50" size={24} />
                                    <p className="text-xs">Aucune intervention récente</p>
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
        </ModalLayout>
    );
};

export default ClientDetailsModal;
