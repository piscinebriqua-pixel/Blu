import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    LogOut, 
    Clock, 
    CreditCard, 
    CheckCircle2, 
    ChevronRight, 
    Droplets,
    History,
    TrendingUp,
    Phone,
    Info,
    Camera,
    FlaskConical,
    Activity,
    Check
} from 'lucide-react';
import { formatBalance } from '../lib/formatters';
import { toast } from 'react-hot-toast';
import ModalLayout from '../components/ModalLayout';

interface ClientData {
    id: string;
    first_name: string;
    last_name: string;
    balance: number;
    phone: string;
    city: string;
}

interface Intervention {
    id: string;
    scheduled_date: string;
    completed_date: string | null;
    status: string;
    notes: string | null;
    ph_level: number | null;
    chlorine_level: number | null;
    photo_before_url: string | null;
    photo_after_url: string | null;
    task_balai: boolean;
    task_lavage: boolean;
    task_rincage: boolean;
    task_test_chlore: boolean;
    task_test_ph: boolean;
    task_remplissage: boolean;
    task_panier_prefiltre: boolean;
    task_traitement: boolean;
    task_verif_vanne: boolean;
    task_temps_fonctionnement: boolean;
    pool: { name: string };
    total_amount: number;
    services?: {
        price_at_time: number;
        service: { name: string; }
    }[];
    products?: {
        quantity: number;
        total_price: number;
        product: { name: string; unit: string; }
    }[];
    technician?: { full_name: string };
}

interface Payment {
    id: string;
    amount: number;
    payment_date: string;
    method: string;
    notes?: string;
    technician?: { full_name: string };
}

const ClientDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<ClientData | null>(null);
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [activeTab, setActiveTab] = useState<'history' | 'payments'>('history');
    const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

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

            // 1. Fetch Client Info
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            // 2. Fetch Interventions (via pools)
            const { data: poolsData } = await supabase
                .from('pools')
                .select('id')
                .eq('client_id', clientId);
            
            const poolIds = poolsData?.map(p => p.id) || [];

            if (poolIds.length > 0) {
                const { data: interData } = await supabase
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
                    .limit(10);
                
                const interventionsWithTotal = (interData || []).map(inter => {
                    const sTotal = inter.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
                    const pTotal = inter.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
                    return {
                        ...inter,
                        total_amount: sTotal + pTotal
                    };
                });
                
                setInterventions(interventionsWithTotal);
            }

            // 3. Fetch Payments
            const { data: payData } = await supabase
                .from('payments')
                .select('*, technician_id')
                .eq('client_id', clientId)
                .order('payment_date', { ascending: false })
                .limit(20);

            // Fetch technicians separately to avoid inner join issues if some exist
            if (payData && payData.length > 0) {
                const techIds = [...new Set(payData.map(p => p.technician_id).filter(Boolean))];
                if (techIds.length > 0) {
                    const { data: techs } = await supabase.from('technicians').select('id, full_name').in('id', techIds);
                    const paymentsWithTech = payData.map(p => ({
                        ...p,
                        technician: techs?.find(t => t.id === p.technician_id)
                    }));
                    setPayments(paymentsWithTech);
                } else {
                    setPayments(payData);
                }
            } else {
                setPayments([]);
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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement de votre espace...</p>
            </div>
        );
    }

    if (!client) return null;

    const balanceInfo = formatBalance(client.balance);
    const [pools, setPools] = useState<any[]>([]);

    useEffect(() => {
        const clientId = localStorage.getItem('blu_client_id');
        if (clientId) {
            supabase.from('pools').select('*, photos:pool_photos(url, is_main)').eq('client_id', clientId).then(({ data }) => {
                if (data) setPools(data);
            });
        }
    }, [client]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f141e] flex flex-col pb-20">
            {/* Header / Profile Info */}
            <div className="bg-gradient-to-br from-[#0077B6] to-[#023E8A] pt-8 pb-10 px-0 rounded-b-[40px] shadow-lg relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl overflow-hidden pointer-events-none"></div>
                
                {/* Internal container with padding for static content */}
                <div className="px-6 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                <span className="text-xl font-black text-white">{(client.first_name || '').charAt(0)}{(client.last_name || '').charAt(0)}</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">
                                    {client.first_name}
                                </h1>
                                <p className="text-lg font-bold text-white/80 uppercase tracking-tighter -mt-1">{client.last_name}</p>
                                <div className="flex items-center gap-2 text-blue-100/70 text-[10px] font-bold uppercase tracking-widest mt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    {client.city || 'Ville'}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Balance Card - Now clean under the header */}
            <div className="px-6 -mt-6">
                <div className={`rounded-[32px] p-6 shadow-xl overflow-hidden transition-all duration-500 ${client.balance < 0 ? 'fintech-card-red-luxe shadow-rose-900/20' : 'fintech-card-money-luxe shadow-slate-900/20'}`}>
                    <div className="fintech-pattern" />
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">Votre Solde Actuel</span>
                        
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">
                                {balanceInfo.amount}
                            </span>
                            <span className="text-2xl font-black text-white/30 uppercase tracking-tighter">DT</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-px w-8 bg-white/10"></div>
                            <p className="text-[13px] font-black text-white/90 uppercase tracking-[0.1em]">
                                {client.balance === 0 ? "Tout est en règle" : client.balance < 0 ? "Compte débiteur" : "Avoir disponible"}
                            </p>
                            <div className="h-px w-8 bg-white/10"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mes Piscines Visual */}
            {pools.length > 0 && (
                <div className="mt-8 px-6">
                    <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Mes Bassins</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {pools.map(pool => (
                            <div key={pool.id} className="shrink-0 w-48 bg-white dark:bg-slate-800 rounded-[2rem] p-3 shadow-sm border border-slate-100 dark:border-white/5">
                                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 mb-3">
                                    {pool.photos?.[0]?.url ? (
                                        <img src={pool.photos.find((p: any) => p.is_main)?.url || pool.photos[0].url} alt={pool.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Droplets size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="px-1">
                                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase truncate">{pool.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pool.volume_m3} m³ • {pool.treatment_method}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Tabs */}
            <div className="mt-8 px-6 flex flex-col gap-6">
                
                {/* Tab Switcher - Premium Glassmorphism */}
                <div className="flex p-1.5 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-[#0077B6] shadow-xl ring-1 ring-black/5' : 'text-slate-500'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <History size={18} className={activeTab === 'history' ? 'animate-pulse' : ''} />
                            PASSAGES
                        </div>
                    </button>
                    <button 
                        onClick={() => setActiveTab('payments')}
                        className={`flex-1 py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-white dark:bg-slate-700 text-[#0077B6] shadow-xl ring-1 ring-black/5' : 'text-slate-500'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <CreditCard size={18} className={activeTab === 'payments' ? 'animate-pulse' : ''} />
                            RÈGLEMENTS
                        </div>
                    </button>
                </div>

                {/* List Container */}
                <div className="flex flex-col gap-3 pb-8">
                    {activeTab === 'history' ? (
                        interventions.length > 0 ? (
                            interventions.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setSelectedIntervention(item)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4 transition-all active:scale-[0.98] hover:border-blue-500/30 cursor-pointer group"
                                >
                                    {/* Amount Badge on Left */}
                                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-lg border transition-transform group-hover:scale-105 ${item.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800'}`}>
                                        <span className="text-lg font-black leading-none">{item.total_amount || 0}</span>
                                        <span className="text-[10px] font-black opacity-50 uppercase tracking-widest mt-0.5">DT</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="mb-0.5">
                                            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                                {new Date(item.completed_date || item.scheduled_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                                            </h3>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                                {item.technician?.full_name || 'Équipe Blu'}
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                {item.pool?.name || 'Visite Entretien'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900/40 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-white" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center opacity-60">
                                <History size={40} className="text-slate-300 mb-4" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aucun historique</p>
                            </div>
                        )
                    ) : (
                        payments.length > 0 ? (
                            payments.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setSelectedPayment(item)}
                                    className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-5 transition-all active:scale-[0.98] hover:border-emerald-500/30 cursor-pointer group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                                        <TrendingUp size={26} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight truncate">
                                                Versement validé
                                            </h3>
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                {new Date(item.payment_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                            <CreditCard size={12} className="text-emerald-500" />
                                            {item.method || 'Libellé'}
                                            <div className="w-1 h-1 rounded-full bg-emerald-200"></div>
                                            <span className="text-emerald-600 font-black text-[14px]">+{item.amount} DT</span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900/40 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-white" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center opacity-60">
                                <CreditCard size={40} className="text-slate-300 mb-4" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aucun paiement enregistré</p>
                            </div>
                        )
                    )}
                </div>

                {/* Support Card */}
                <div className="bg-gradient-to-r from-[#0077B6] to-[#023E8A] p-7 rounded-[32px] text-white flex items-center justify-between shadow-2xl shadow-blue-600/30 relative overflow-hidden group">
                    <div className="fintech-pattern opacity-10" />
                    <div className="relative z-10 max-w-[70%]">
                        <h4 className="text-xl font-black leading-tight mb-2 uppercase tracking-tight">Besoin d'assistance ?</h4>
                        <p className="text-[13px] font-bold text-blue-100/80 uppercase tracking-wider leading-relaxed">
                            Nos experts sont disponibles pour répondre à vos questions techniques.
                        </p>
                    </div>
                    <a href={`tel:${client.phone}`} className="relative z-10 w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all shadow-lg backdrop-blur-sm">
                        <Phone size={28} />
                    </a>
                </div>

                <div className="text-center py-6">
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em] opacity-40">
                        Membre Blu • Expertise Piscine
                    </p>
                </div>
            </div>

            {/* Intervention Detail Modal */}
            {selectedIntervention && (
                <ModalLayout
                    title="Détail de l'intervention"
                    onClose={() => setSelectedIntervention(null)}
                    className="max-w-lg"
                >
                    <div className="p-4 space-y-6">
                        {/* Summary Header - Date & Technician */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-blue-500">
                                    <Clock size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Date</span>
                                    <span className="text-[13px] font-black text-slate-900 dark:text-white uppercase leading-none">
                                        {new Date(selectedIntervention.completed_date || selectedIntervention.scheduled_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                            <div className="flex items-center gap-3 flex-1 justify-end">
                                <div className="flex flex-col text-right">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Expert</span>
                                    <span className="text-[13px] font-black text-slate-900 dark:text-white uppercase leading-none truncate max-w-[120px]">
                                        {selectedIntervention.technician?.full_name || 'Équipe Blu'}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-emerald-500">
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Header Stats */}
                        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                            <div className="shrink-0 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                <FlaskConical size={18} className="text-blue-500" />
                                <div>
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Niveau pH</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedIntervention.ph_level || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                <Activity size={18} className="text-indigo-500" />
                                <div>
                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Chlore (ppm)</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedIntervention.chlorine_level || 'N/A'}</p>
                                </div>
                            </div>
                            {selectedIntervention.total_amount > 0 && (
                                <div className="shrink-0 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                                    <CreditCard size={18} className="text-emerald-500" />
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Facturé</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedIntervention.total_amount} DT</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Photos Section */}
                        {(selectedIntervention.photo_before_url || selectedIntervention.photo_after_url) && (
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Camera size={12} />
                                    PHOTOS DU PASSAGE
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedIntervention.photo_before_url ? (
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase text-center">Avant</p>
                                            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-800">
                                                <img src={selectedIntervention.photo_before_url} alt="Avant" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-30">
                                            <span className="text-[10px] font-black uppercase">Pas de photo</span>
                                        </div>
                                    )}
                                    {selectedIntervention.photo_after_url ? (
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase text-center">Après</p>
                                            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-800">
                                                <img src={selectedIntervention.photo_after_url} alt="Après" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-30">
                                            <span className="text-[10px] font-black uppercase">Pas de photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tasks Checklist */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <CheckCircle2 size={12} />
                                TRAVAUX EFFECTUÉS
                            </h4>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                {[
                                    { label: 'Passage balai', done: selectedIntervention.task_balai },
                                    { label: 'Lavage filtre', done: selectedIntervention.task_lavage },
                                    { label: 'Rinçage filtre', done: selectedIntervention.task_rincage },
                                    { label: 'Test Chlore', done: selectedIntervention.task_test_chlore },
                                    { label: 'Test pH', done: selectedIntervention.task_test_ph },
                                    { label: 'Remplissage', done: selectedIntervention.task_remplissage },
                                    { label: 'Panier/Préfiltre', done: selectedIntervention.task_panier_prefiltre },
                                    { label: 'Traitement', done: selectedIntervention.task_traitement },
                                    { label: 'Vanne/Réseau', done: selectedIntervention.task_verif_vanne },
                                    { label: 'Temps fonct.', done: selectedIntervention.task_temps_fonctionnement }
                                ].map((task, i) => (
                                    <div key={i} className={`flex items-center gap-2 ${task.done ? 'opacity-100' : 'opacity-20'}`}>
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${task.done ? 'bg-emerald-500 text-white' : 'bg-slate-300'}`}>
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{task.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Services & Products */}
                        {(selectedIntervention.services?.length || 0) > 0 || (selectedIntervention.products?.length || 0) > 0 ? (
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Détail Facturation</h4>
                                <div className="space-y-2">
                                    {selectedIntervention.services?.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs font-bold bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <span className="text-slate-600 dark:text-slate-300 uppercase">{s.service.name}</span>
                                            <span className="text-blue-600">{s.price_at_time} DT</span>
                                        </div>
                                    ))}
                                    {selectedIntervention.products?.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs font-bold bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <span className="text-slate-600 dark:text-slate-300 uppercase">{p.product.name} ({p.quantity} {p.product.unit})</span>
                                            <span className="text-blue-600">{p.total_price} DT</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Notes */}
                        {selectedIntervention.notes && (
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Info size={12} />
                                    OBSERVATIONS
                                </h4>
                                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic">"{selectedIntervention.notes}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            onClick={() => setSelectedIntervention(null)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95"
                        >
                            Compris, Fermer
                        </button>
                    </div>
                </ModalLayout>
            )}
            {/* Payment Detail Modal */}
            {selectedPayment && (
                <ModalLayout
                    title="Détail du Règlement"
                    onClose={() => setSelectedPayment(null)}
                    className="max-w-md !min-h-0"
                    compact={true}
                    bodyClassName="!p-0 !overflow-hidden"
                >
                    <div className="p-5 space-y-5 flex flex-col max-h-[85vh]">
                        {/* Transaction Header - Compact */}
                        <div className="flex flex-col items-center justify-center py-2">
                            <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-3 animate-bounce-subtle">
                                <TrendingUp size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {selectedPayment.amount} <span className="text-lg opacity-40 ml-1">DT</span>
                            </h2>
                            <p className="text-[11px] font-black text-emerald-500/80 uppercase tracking-[0.2em] mt-1">Transaction Validée</p>
                        </div>

                        {/* Info Grid - More compact */}
                        <div className="grid grid-cols-1 gap-2">
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-400">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date de réception</p>
                                        <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase">
                                            {new Date(selectedPayment.payment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-400">
                                        <CreditCard size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode de règlement</p>
                                        <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase">{selectedPayment.method || 'Non spécifié'}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedPayment.technician && (
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-400">
                                            <Droplets size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encaissé par</p>
                                            <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase">{selectedPayment.technician.full_name}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedPayment.notes && (
                                <div className="bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 shadow-none">Note</p>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">"{selectedPayment.notes}"</p>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => setSelectedPayment(null)}
                            className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 mt-2"
                        >
                            Fermer
                        </button>
                    </div>
                </ModalLayout>
            )}
        </div>
    );
};

export default ClientDashboard;
