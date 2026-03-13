import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Users,
    ChevronRight,
    Activity,
    Wallet,
    Settings,
    FileText,
    Briefcase,
    QrCode,
    X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import BccpLogo from '../components/BccpLogo';
import PageLayout from '../components/PageLayout';
import ModalLayout from '../components/ModalLayout';
import UserMenu from '../components/UserMenu';
import { QRCodeSVG } from 'qrcode.react';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ 
        clients: 0, 
        technicians: 0, 
        interventions: 0, 
        scheduled: 0, 
        revenue: 0, 
        lastMonthRevenue: 0, 
        rollingRevenue: 0,
        annualRevenue: 0,
        devis: 0 
    });
    const [profile, setProfile] = useState<{ name: string, role: string } | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [recentInterventions, setRecentInterventions] = useState<any[]>([]);



    useEffect(() => {
        const fetchStats = async () => {
            try {
                let currentProfile = null;
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name, role')
                        .eq('id', session.user.id)
                        .maybeSingle();
                    if (profileData) {
                        currentProfile = profileData;
                        setProfile({
                            name: profileData.full_name || 'Utilisateur',
                            role: profileData.role
                        });
                    }
                }

                // Fetch each count independently
                let clientCount = 0;
                let techCount = 0;
                let interventionCount = 0;
                let scheduledCount = 0;
                let devisCount = 0;

                try {
                    const [clientsRes, techRes, intRes, schedRes] = await Promise.all([
                        supabase.from('clients').select('id', { count: 'exact', head: true }),
                        supabase.from('technicians').select('id', { count: 'exact', head: true }).eq('active', true),
                        supabase.from('interventions').select('id', { count: 'exact', head: true }),
                        supabase.from('interventions').select('id', { count: 'exact', head: true }).eq('status', 'scheduled')
                    ]);
                    clientCount = clientsRes.count ?? 0;
                    techCount = techRes.count ?? 0;
                    interventionCount = intRes.count ?? 0;
                    scheduledCount = schedRes.count ?? 0;

                    // Fetch devis separately to avoid affecting other stats if it fails
                    const devisRes = await supabase.from('devis').select('id, status');
                    if (devisRes.data) {
                        devisCount = devisRes.data.filter(d => d.status === 'pending' || !d.status).length;
                    }
                } catch (e) {
                    console.warn('Counts fetch failed:', e);
                }

                // Fetch CA pour les admins
                let monthlyRevenue = 0;
                let lastMonthRevenue = 0;
                let rollingRevenue = 0;
                let annualRevenue = 0;

                if (currentProfile?.role === 'admin') {
                    try {
                        const now = new Date();
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                        const rolling30d = new Date();
                        rolling30d.setDate(now.getDate() - 30);
                        const startOfYear = new Date(now.getFullYear(), 0, 1);

                        const [currentRes, lastRes, rollingRes, annualResFull] = await Promise.all([
                            supabase.from('payments').select('amount').neq('method', 'remise').gte('payment_date', startOfMonth.toISOString()),
                            supabase.from('payments').select('amount').neq('method', 'remise').gte('payment_date', startOfLastMonth.toISOString()).lte('payment_date', endOfLastMonth.toISOString()),
                            supabase.from('payments').select('amount').neq('method', 'remise').gte('payment_date', rolling30d.toISOString()),
                            supabase.from('payments').select('amount, payment_date').neq('method', 'remise').gte('payment_date', startOfYear.toISOString())
                        ]);

                        monthlyRevenue = currentRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                        lastMonthRevenue = lastRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                        rollingRevenue = rollingRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                        
                        if (annualResFull.data) {
                            annualResFull.data.forEach(p => {
                                annualRevenue += (p.amount || 0);
                            });
                        }
                    } catch (e) {
                        console.warn('Revenue fetch failed:', e);
                    }
                }

                setCounts({
                    clients: clientCount,
                    technicians: techCount,
                    interventions: interventionCount,
                    scheduled: scheduledCount,
                    revenue: monthlyRevenue,
                    lastMonthRevenue: lastMonthRevenue,
                    rollingRevenue: rollingRevenue,
                    annualRevenue: annualRevenue,
                    devis: devisCount
                });

                // RESTORE: Fetch 3 dernières interventions
                try {
                    const { data: interventions } = await supabase
                        .from('interventions')
                        .select(`
                            id,
                            created_at,
                            status,
                            technician:technicians!technician_id(full_name),
                            pool:pools!pool_id(client:clients(first_name,last_name))
                        `)
                        .order('created_at', { ascending: false })
                        .limit(3);
                    if (interventions) setRecentInterventions(interventions);
                } catch (e) {
                    console.warn('Recent interventions fetch failed:', e);
                }

            } catch (error) {
                console.error('Erreur stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="gabarit-wrapper flex items-center justify-center h-screen bg-[#0f172a]">
                <div className="flex flex-col items-center gap-4">
                    <BccpLogo width={80} fillColor="white" className="animate-pulse" />
                    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-progress-loading"></div>
                    </div>
                </div>
            </div>
        );
    }

    const formatRevenue = (val: number) => {
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return `${val.toFixed(0)}`;
    };


    const leftContent = (
        <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/10 group-hover:bg-white/30 transition-all shrink-0">
                <BccpLogo fillColor="white" className="logo-adaptive transition-all duration-300" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-3xl font-black text-white tracking-tighter leading-none">BCCP</h1>
                <p className="text-[10px] font-black text-blue-100/60 uppercase tracking-[0.2em] leading-none mt-1">Clean and Clean Pool</p>
            </div>
        </div>
    );

    const rightContent = (
        <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2">
                {profile?.role === 'admin' && (
                    <button 
                        onClick={() => navigate('/settings')}
                        className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/70 transition-all border border-white/10"
                        title="Configuration"
                    >
                        <Settings size={18} />
                    </button>
                )}
                <button 
                    onClick={() => setIsQrModalOpen(true)}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/70 transition-all border border-white/10 relative"
                    title="QR Code d'accès"
                >
                    <QrCode size={18} />
                    <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-slate-950" />
                </button>
            </div>
            <UserMenu />
        </div>
    );

    return (
        <PageLayout title="" leftContent={leftContent} rightContent={rightContent} className="!p-0">
            <div className="min-h-screen p-6 lg:p-8">
                <div className="bento-dashboard-grid">
                {/* RANGEE 1 : PERFORMANCES & PLANNING */}
                <div onClick={() => navigate('/revenue')} className="bento-card-luxe bento-col-8 group cursor-pointer min-h-[320px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em] mb-1">Performances Annuelles</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Évolution des paiements par mois</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Live : {new Date().getFullYear()}
                        </div>
                    </div>
                    <div className="flex-1 flex items-end relative overflow-hidden mb-4">
                        {/* Real Chart Line */}
                        <svg className="w-full h-[120px] drop-shadow-[0_10px_15px_rgba(59,130,246,0.3)]" viewBox="0 0 400 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chart-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="stroke-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path 
                                d="M0 80 Q 50 20 100 70 T 200 40 T 300 60 T 400 30 L 400 100 L 0 100 Z"
                                fill="url(#chart-grad)"
                                className="animate-in fade-in duration-1000"
                            />
                            {/* Stroke line */}
                            <path 
                                d="M0 80 Q 50 20 100 70 T 200 40 T 300 60 T 400 30" 
                                fill="none" 
                                stroke="url(#stroke-grad)" 
                                strokeWidth="4" 
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="chart-line-demo"
                            />
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
                    </div>
                    <div className="absolute bottom-6 right-8 text-right">
                        <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{formatRevenue(counts.rollingRevenue)} <span className="text-2xl ml-1">DT</span></p>
                        <p className="text-emerald-500 text-base font-bold">
                            {counts.lastMonthRevenue > 0 ? `(+${Math.round(((counts.revenue - counts.lastMonthRevenue) / counts.lastMonthRevenue) * 100)}%)` : '(+0%)'}
                        </p>
                    </div>
                </div>

                <div onClick={() => navigate('/planning')} className="bento-card-luxe bento-col-4 group cursor-pointer">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em]">Planning</h3>
                        <div className="flex gap-1">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white text-[10px]">
                                &lt;
                            </div>
                            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white text-[10px]">
                                &gt;
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(d => (
                            <span key={d} className="text-[9px] font-black text-slate-600 uppercase mb-2">{d}</span>
                        ))}
                        {Array.from({ length: 14 }).map((_, i) => (
                            <div key={i} className={`h-8 flex items-center justify-center rounded-lg text-xs font-bold ${i === 13 ? 'bg-primary text-white' : 'text-slate-400'}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                        <p className="text-slate-900 dark:text-white text-2xl font-black">{counts.scheduled} PRÉVUS</p>
                        <p className="text-slate-700 dark:text-slate-400 text-xs font-black uppercase tracking-widest mt-1">{counts.interventions} TOTAL</p>
                    </div>
                </div>

                {/* RANGEE 2 : STATS & PROJECTS */}
                <div onClick={() => navigate('/revenue')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            <Wallet size={28} />
                        </div>
                        <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">CA Mensuel</h3>
                    </div>
                    <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">Revenus annuels</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{formatRevenue(counts.annualRevenue)} DT</p>
                    <p className="text-slate-700 dark:text-slate-400 text-[10px] font-bold mt-2">Comparison précédentes</p>
                </div>

                <div onClick={() => navigate('/clients')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Users size={28} />
                        </div>
                        <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Fiches Clients</h3>
                    </div>
                    <div className="avatar-stack mb-4">
                        <div className="avatar-stack-item bg-[#334155] ring-2 ring-white dark:ring-[#020617]">JD</div>
                        <div className="avatar-stack-item bg-[#475569] ring-2 ring-white dark:ring-[#020617]">MK</div>
                        <div className="avatar-stack-item bg-[#1e293b] ring-2 ring-white dark:ring-[#020617]">AL</div>
                        <div className="avatar-stack-item bg-[#111827] ring-2 ring-white dark:ring-[#020617]">RB</div>
                        <div className="avatar-stack-item bg-slate-900 ring-2 ring-white dark:ring-[#020617] text-blue-400">+{counts.clients > 4 ? counts.clients - 4 : 2}</div>
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-400 leading-tight">Mohamed Name, Conne, Wahran...</p>
                </div>

                <div onClick={() => navigate('/payments')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Wallet size={28} />
                        </div>
                        <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Paiements</h3>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full border-[8px] border-emerald-500/20 border-t-emerald-500 rotate-45" />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">Prm... 45K DT</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">Pro... 25K DT</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div onClick={() => navigate('/chantiers')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                            <FileText size={28} />
                        </div>
                        <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Chantiers</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Project A</p>
                            <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="w-2/3 h-full bg-cyan-500" />
                            </div>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400">Technician 1, Project A</span>
                        </div>
                        <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-2">Total {counts.devis}</p>
                    </div>
                </div>

                {/* RANGEE 3 : QR, TECH & MAP */}
                <div onClick={() => setIsQrModalOpen(true)} className="bento-card-luxe bento-col-3 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-white flex items-center justify-center">
                            <QrCode size={28} />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Espace Client</h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center py-2">
                        <div className="p-3 bg-white dark:bg-white/90 rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
                            <QRCodeSVG value={`${window.location.origin}/mon-espace`} size={100} fgColor="#0F172A" />
                        </div>
                    </div>
                </div>

                {profile?.role === 'admin' && (
                    <div onClick={() => navigate('/admin-finance')} className="bento-card-luxe bento-col-3 group cursor-pointer !bg-slate-900 border-none">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center ring-1 ring-orange-500/30">
                                <Wallet size={28} />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest leading-none">Gestion Caisse</h3>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Actions Requises</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-white tracking-tighter leading-none">FINANCES</p>
                                <div className="mb-1 bg-orange-500 px-2 py-0.5 rounded text-[10px] font-black text-white animate-pulse">ADMIN</div>
                            </div>
                        </div>
                    </div>
                )}

                {profile?.role === 'admin' && (
                    <div onClick={() => navigate('/settings')} className="bento-card-luxe bento-col-3 group cursor-pointer !bg-blue-900 border-none">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center ring-1 ring-blue-500/30">
                                <Settings size={28} />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-widest leading-none">Configuration</h3>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-blue-300/60 uppercase tracking-widest mb-1">Système</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-white tracking-tighter leading-none">PARAMÈTRES</p>
                            </div>
                        </div>
                    </div>
                )}

                <div onClick={() => navigate('/technician-portal')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                            <Activity size={28} />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Ma Tournée</h3>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-base font-bold text-slate-900 dark:text-white">{counts.scheduled} en cours</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">/ {counts.scheduled + 5} total</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-4">
                        <div className="w-1/3 h-full bg-rose-500" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Project Name A</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Project Name B</p>
                    </div>
                </div>

                <div onClick={() => navigate('/technicians')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Équipe</h3>
                    </div>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-2 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="relative z-10 text-center">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{counts.technicians}</p>
                            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Membres</p>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-primary/20 rounded-full animate-ping" />
                    </div>
                </div>

                <div onClick={() => navigate('/partners')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center">
                            <Briefcase size={24} />
                        </div>
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">Partenaires</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-video bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-800" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-10">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Flux d'activité</h3>
                    <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/50 rounded text-[11px] font-black text-slate-500 uppercase tracking-widest">LIVE</div>
                </div>
                <div className="flex flex-col gap-3">
                    {recentInterventions.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-8 rounded-[2rem] text-center">
                            <p className="text-sm font-bold text-slate-400">Aucune activité récente</p>
                        </div>
                    ) : (
                        recentInterventions.map((inter, idx) => {
                            const clientName = inter.pool?.client
                                ? `${inter.pool.client.first_name || ''} ${inter.pool.client.last_name || ''}`.trim()
                                : 'Client inconnu';
                            const techName = inter.technician?.full_name || 'Technicien inconnu';
                            const dateStr = inter.created_at
                                ? new Date(inter.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : '';
                            const isCompleted = inter.status === 'completed';
                            const isInProgress = inter.status === 'in_progress';
                            const dotClass = isCompleted
                                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                                : isInProgress
                                    ? 'bg-blue-500 shadow-lg shadow-blue-500/20'
                                    : 'bg-slate-400';

                            return (
                                <div
                                    key={inter.id}
                                    onClick={() => navigate('/interventions')}
                                    className={`group bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-4 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards stagger-${(idx % 10) + 1}`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center relative shrink-0">
                                        <Activity size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${dotClass}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{clientName}</h4>
                                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0 ml-2">{dateStr}</span>
                                        </div>
                                        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate opacity-80">{techName}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {isQrModalOpen && (
                <ModalLayout
                    onClose={() => setIsQrModalOpen(false)}
                    title=""
                    hideHeader={true}
                    className="!max-w-md !bg-slate-950 border-white/10 !rounded-[2.5rem] overflow-hidden"
                    bodyClassName="!p-0"
                >
                    <div className="flex flex-col items-center justify-center p-10 bg-slate-950 text-center relative overflow-hidden min-h-[500px]">
                        {/* Custom Close Button */}
                        <button 
                            onClick={() => setIsQrModalOpen(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full flex items-center justify-center backdrop-blur-xl border border-white/5 z-[100] transition-all active:scale-90"
                        >
                            <X size={20} />
                        </button>
                        {/* Background Accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none" />
                        <div className="fintech-pattern opacity-[0.05] pointer-events-none" />

                        {/* Premium QR Container */}
                        <div className="relative z-10 p-8 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)] mb-8">
                            <div className="relative rounded-2xl overflow-hidden p-1 bg-white/5">
                                <QRCodeSVG
                                    value={`${window.location.origin}/mon-espace`}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#FFFFFF"
                                    bgColor="transparent"
                                />
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,1)] animate-[bounce_4s_ease-in-out_infinite] opacity-40 pointer-events-none" />
                            </div>
                        </div>

                        {/* Typography Section */}
                        <div className="relative z-10 space-y-4">
                            <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                                ACCÈS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">CLIENT</span>
                            </h4>
                            
                            <p className="text-[13px] font-medium text-slate-400 tracking-wider max-w-[260px] mx-auto opacity-70">
                                Scannez pour accéder au portail BCCP
                            </p>

                            {/* Copy URL Section */}
                            <div className="mt-6 flex items-center justify-center gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md w-full">
                                <div className="bg-white/5 rounded-xl py-2 px-4 flex-1 text-center overflow-hidden">
                                    <code className="text-[10px] font-black text-blue-400/90 break-all select-all tracking-widest truncate block">
                                        {window.location.origin.replace(/^https?:\/\//, '')}/mon-espace
                                    </code>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(`${window.location.origin}/mon-espace`);
                                        toast.success("Lien copié");
                                    }}
                                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-xl shadow-blue-900/40"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalLayout>
            )}
            </div>
        </PageLayout>
    );
};

export default Dashboard;
