import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type PoolRow } from '../lib/supabase';
import { 
    LogOut, 
    CreditCard, 
    ChevronRight, 
    Droplets,
    History,
    TrendingUp,
    Phone,
    AlertTriangle
} from 'lucide-react';
import { formatBalance } from '../lib/formatters';
import { toast } from 'react-hot-toast';
import { PortalInterventionModal, type PortalIntervention } from '../components/portal/PortalInterventionModal';
import { PortalPaymentModal, type PortalPayment } from '../components/portal/PortalPaymentModal';
import { PortalReclamationsTab } from '../components/portal/PortalReclamationsTab';
import { PortalNewReclamationModal } from '../components/portal/PortalNewReclamationModal';
import { getClientReclamations } from '../services/reclamationService';
import type { ReclamationRow } from '../lib/supabase';

interface PoolPhoto {
    url: string;
    is_main: boolean;
}

interface ClientPool extends PoolRow {
    photos?: PoolPhoto[];
}

interface ClientData {
    id: string;
    first_name: string;
    last_name: string;
    balance: number;
    phone: string;
    city: string;
}

const ClientDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<ClientData | null>(null);
    const [interventions, setInterventions] = useState<PortalIntervention[]>([]);
    const [payments, setPayments] = useState<PortalPayment[]>([]);
    const [reclamations, setReclamations] = useState<ReclamationRow[]>([]);
    const [pools, setPools] = useState<ClientPool[]>([]);
    const [activeTab, setActiveTab] = useState<'history' | 'payments' | 'reclamations'>('history');
    const [selectedIntervention, setSelectedIntervention] = useState<PortalIntervention | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<PortalPayment | null>(null);
    const [isNewReclamationOpen, setIsNewReclamationOpen] = useState(false);

    useEffect(() => {
        const clientId = localStorage.getItem('blu_client_id');
        if (!clientId) {
            navigate('/mon-espace/login');
            return;
        }
        fetchData(clientId);
    }, [navigate]);

    const fetchData = async (clientId: string) => {
        try {
            setLoading(true);

            // 1. Parallélisation massive : Client, Pools, Payments et Reclamations chargés en 1 seul aller-retour réseau
            const [clientRes, poolsRes, payRes, recData] = await Promise.all([
                supabase
                    .from('clients')
                    .select('id, first_name, last_name, balance, phone, city')
                    .eq('id', clientId)
                    .maybeSingle(),
                supabase
                    .from('pools')
                    .select('*, photos:pool_photos(url, is_main)')
                    .eq('client_id', clientId),
                supabase
                    .from('payments')
                    .select('*, technician:technicians(id, full_name)')
                    .eq('client_id', clientId)
                    .order('payment_date', { ascending: false })
                    .limit(20),
                getClientReclamations(clientId)
            ]);

            if (clientRes.error) throw clientRes.error;
            if (!clientRes.data) {
                localStorage.removeItem('blu_client_id');
                navigate('/mon-espace/login');
                return;
            }

            setClient(clientRes.data);
            const clientPools = (poolsRes.data as unknown as ClientPool[]) || [];
            setPools(clientPools);
            setPayments((payRes.data as unknown as PortalPayment[]) || []);
            setReclamations(recData || []);

            // 2. Fetch Interventions pour les bassins du client (max 20 pour garder un temps de réponse instantané)
            const poolIds = clientPools.map(p => p.id);
            if (poolIds.length > 0) {
                const { data: interData, error: interError } = await supabase
                    .from('interventions')
                    .select(`
                        *, 
                        technician:technicians!technician_id(full_name),
                        pool:pools!pool_id(name),
                        services:intervention_services(
                            price_at_time,
                            service:services(name)
                        ),
                        products:intervention_products(
                            quantity,
                            total_price,
                            product:inventory_products(name, unit)
                        )
                    `)
                    .in('pool_id', poolIds)
                    .order('scheduled_date', { ascending: false })
                    .limit(20);
                
                if (interError) {
                    console.error('Interventions query error:', interError);
                } else if (interData) {
                    const interventionsWithTotal: PortalIntervention[] = interData.map(inter => {
                        const sTotal = inter.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
                        const pTotal = inter.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
                        return {
                            ...inter,
                            total_amount: sTotal + pTotal
                        };
                    });
                    setInterventions(interventionsWithTotal);
                }
            } else {
                setInterventions([]);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error("Impossible de charger vos données.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('blu_client_id');
        localStorage.removeItem('blu_client_name');
        navigate('/mon-espace/login');
    };

    if (loading) {
        return (
            <div className="flex-1 w-full h-full bg-slate-50 dark:bg-[#0f141e] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Chargement de votre espace...</p>
            </div>
        );
    }

    if (!client) return null;

    const balanceInfo = formatBalance(client.balance);

    return (
        <div className="flex-1 w-full h-full overflow-y-auto overscroll-contain bg-slate-50 dark:bg-[#0f141e] flex flex-col pb-24">
            {/* Header / Profile Info */}
            <div className="bg-gradient-to-br from-[#0077B6] to-[#023E8A] pt-6 pb-8 px-6 rounded-b-[36px] shadow-lg relative shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl overflow-hidden pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-xl shrink-0">
                            <span className="text-xl font-black text-white">{(client.first_name || '').charAt(0)}{(client.last_name || '').charAt(0)}</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                                {client.first_name} {client.last_name}
                            </h1>
                            <div className="flex items-center gap-2 text-blue-100/90 text-xs font-bold uppercase tracking-widest mt-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                {client.city || 'Client Blu'}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        title="Se déconnecter"
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 flex items-center justify-center text-white/90 hover:bg-white/20 transition-all border border-white/15 backdrop-blur-sm"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Balance Card */}
            <div className="px-5 -mt-4 shrink-0">
                <div className={`rounded-[28px] p-5 shadow-xl overflow-hidden transition-all duration-500 ${client.balance < 0 ? 'fintech-card-red-luxe shadow-rose-900/20' : 'fintech-card-money-luxe shadow-slate-900/20'}`}>
                    <div className="fintech-pattern" />
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-xs font-black text-white/80 uppercase tracking-[0.25em] mb-2">Votre Solde Actuel</span>
                        
                        <div className="flex items-baseline gap-2.5 mb-2.5">
                            <span className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl">
                                {balanceInfo.amount}
                            </span>
                            <span className="text-xl font-black text-white/80 uppercase tracking-tighter">DT</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-px w-8 bg-white/20"></div>
                            <p className="text-xs font-black text-white uppercase tracking-widest">
                                {client.balance === 0 ? "Tout est en règle" : client.balance < 0 ? "Compte débiteur" : "Avoir disponible"}
                            </p>
                            <div className="h-px w-8 bg-white/20"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mes Piscines Visual - Compact & Responsive */}
            {pools.length > 0 && (
                <div className="mt-5 px-5 shrink-0">
                    <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5">
                        Mes Bassins ({pools.length})
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                        {pools.map(pool => {
                            const mainPhoto = pool.photos?.find(p => p.is_main)?.url || pool.photos?.[0]?.url;
                            const details = [
                                pool.volume ? `${pool.volume} m³` : null,
                                pool.pool_type ? `Type ${pool.pool_type}` : null
                            ].filter(Boolean).join(' • ');

                            return (
                                <div key={pool.id} className="shrink-0 bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-3 min-w-[240px]">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 shrink-0 flex items-center justify-center text-blue-500">
                                        {mainPhoto ? (
                                            <img src={mainPhoto} alt={pool.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Droplets size={22} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase truncate">{pool.name}</p>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
                                            {details || 'Bassin suivi Blu'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Content Tabs & List */}
            <div className="mt-5 px-5 flex flex-col gap-4">
                {/* Tab Switcher */}
                <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 gap-1">
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 min-h-[44px] px-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-[#0077B6] shadow-md ring-1 ring-black/5' : 'text-slate-500'}`}
                    >
                        <History size={15} className={`shrink-0 ${activeTab === 'history' ? 'animate-pulse' : ''}`} />
                        <span className="truncate">Passages ({interventions.length})</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('payments')}
                        className={`flex-1 min-h-[44px] px-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'payments' ? 'bg-white dark:bg-slate-700 text-[#0077B6] shadow-md ring-1 ring-black/5' : 'text-slate-500'}`}
                    >
                        <CreditCard size={15} className={`shrink-0 ${activeTab === 'payments' ? 'animate-pulse' : ''}`} />
                        <span className="truncate">Règlements ({payments.length})</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('reclamations')}
                        className={`flex-1 min-h-[44px] px-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'reclamations' ? 'bg-white dark:bg-slate-700 text-[#0077B6] shadow-md ring-1 ring-black/5' : 'text-slate-500'}`}
                    >
                        <AlertTriangle size={15} className={`shrink-0 ${activeTab === 'reclamations' ? 'animate-pulse' : ''}`} />
                        <span className="truncate">Réclamations ({reclamations.length})</span>
                    </button>
                </div>

                {/* List Container */}
                <div className="flex flex-col gap-3">
                    {activeTab === 'history' ? (
                        interventions.length > 0 ? (
                            interventions.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setSelectedIntervention(item)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-3.5 transition-all active:scale-[0.98] hover:border-blue-500/30 cursor-pointer group"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md border ${item.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800'}`}>
                                        <span className="text-lg font-black leading-none">{item.total_amount || 0}</span>
                                        <span className="text-xs font-black opacity-60 uppercase tracking-widest mt-0.5">DT</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                            {new Date(item.completed_date || item.scheduled_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">
                                            <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                            {item.technician?.full_name || 'Équipe Blu'}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            {item.pool?.name || 'Visite Entretien'}
                                        </div>
                                    </div>
                                    <div className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/40 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                                        <ChevronRight size={18} className="text-slate-400 group-hover:text-white" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                <History size={36} className="text-slate-400 mb-2" />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Aucun passage enregistré</p>
                            </div>
                        )
                    ) : activeTab === 'payments' ? (
                        payments.length > 0 ? (
                            payments.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setSelectedPayment(item)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-3.5 transition-all active:scale-[0.98] hover:border-emerald-500/30 cursor-pointer group"
                                >
                                    <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0 shadow-md">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight truncate">
                                                Versement validé
                                            </h3>
                                            <span className="text-xs font-black text-slate-500 uppercase">
                                                {new Date(item.payment_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                                            <span>{item.method || 'Versement'}</span>
                                            <span>•</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-black">+{item.amount} DT</span>
                                        </div>
                                    </div>
                                    <div className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900/40 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                                        <ChevronRight size={18} className="text-slate-400 group-hover:text-white" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                <CreditCard size={36} className="text-slate-400 mb-2" />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Aucun versement enregistré</p>
                            </div>
                        )
                    ) : (
                        <PortalReclamationsTab 
                            reclamations={reclamations}
                            onOpenNewModal={() => setIsNewReclamationOpen(true)}
                        />
                    )}
                </div>

                {/* Support Card */}
                <div className="bg-gradient-to-r from-[#0077B6] to-[#023E8A] p-5 rounded-2xl text-white flex items-center justify-between shadow-xl relative overflow-hidden group mt-2">
                    <div className="fintech-pattern opacity-10" />
                    <div className="relative z-10 max-w-[75%]">
                        <h4 className="text-base font-black leading-tight mb-1 uppercase tracking-tight">Besoin d'assistance ?</h4>
                        <p className="text-xs font-bold text-white/85 uppercase tracking-wide leading-relaxed">
                            Nos experts sont disponibles pour vos questions d'entretien.
                        </p>
                    </div>
                    {client.phone && (
                        <a 
                            href={`tel:${client.phone}`} 
                            title="Appeler l'assistance"
                            className="relative z-10 min-w-[44px] min-h-[44px] rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20 active:scale-95 transition-all shadow-md backdrop-blur-sm shrink-0"
                        >
                            <Phone size={22} />
                        </a>
                    )}
                </div>

                <div className="text-center py-4">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">
                        Membre Blu • Entretien & Rénovation Piscine
                    </p>
                </div>
            </div>

            {/* Modals */}
            <PortalInterventionModal 
                intervention={selectedIntervention}
                onClose={() => setSelectedIntervention(null)}
            />
            <PortalPaymentModal 
                payment={selectedPayment}
                onClose={() => setSelectedPayment(null)}
            />
            <PortalNewReclamationModal 
                isOpen={isNewReclamationOpen}
                onClose={() => setIsNewReclamationOpen(false)}
                clientId={client.id}
                pools={pools}
                onCreated={(newRec) => {
                    setReclamations(prev => [newRec, ...prev]);
                    setActiveTab('reclamations');
                }}
            />
        </div>
    );
};

export default ClientDashboard;
