import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Users,
    Wrench,
    ChevronRight,
    CheckCircle2,
    Calendar,
    LogOut,
    Activity,
    Shield,
    Wallet,
    Settings
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import BccpLogo from '../components/BccpLogo';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ clients: 0, technicians: 0, interventions: 0, scheduled: 0, revenue: 0, lastMonthRevenue: 0 });
    const [profile, setProfile] = useState<{ name: string, role: string } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [recentInterventions, setRecentInterventions] = useState<any[]>([]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Erreur déconnexion:', error.message);
        navigate('/login');
    };

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

                try {
                    const [clientsRes, techRes, intRes, schedRes] = await Promise.all([
                        supabase.from('clients').select('id', { count: 'exact', head: true }),
                        supabase.from('technicians').select('id', { count: 'exact', head: true }),
                        supabase.from('interventions').select('id', { count: 'exact', head: true }),
                        supabase.from('interventions').select('id', { count: 'exact', head: true }).eq('status', 'scheduled')
                    ]);
                    clientCount = clientsRes.count ?? 0;
                    techCount = techRes.count ?? 0;
                    interventionCount = intRes.count ?? 0;
                    scheduledCount = schedRes.count ?? 0;
                } catch (e) {
                    console.warn('Counts fetch failed:', e);
                }

                // Fetch CA (Mensuel) pour les admins
                let monthlyRevenue = 0;
                let lastMonthRevenue = 0;
                if (currentProfile?.role === 'admin') {
                    try {
                        const now = new Date();
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

                        const [currentRes, lastRes] = await Promise.all([
                            supabase.from('payments').select('amount').gte('payment_date', startOfMonth.toISOString()),
                            supabase.from('payments').select('amount').gte('payment_date', startOfLastMonth.toISOString()).lte('payment_date', endOfLastMonth.toISOString())
                        ]);

                        monthlyRevenue = currentRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                        lastMonthRevenue = lastRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
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
                    lastMonthRevenue: lastMonthRevenue
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

    return (
        <div className="gabarit-wrapper">
            <header className="header-gradient relative flex justify-between items-center z-10">
                <BccpLogo width={90} fillColor="white" className="drop-shadow-lg" />

                <div className="flex items-center gap-3 relative z-10">
                    <ThemeToggle />

                    {profile?.role === 'admin' && (
                        <button
                            onClick={() => navigate('/settings/services')}
                            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md shadow-lg"
                            title="Configuration"
                        >
                            <Settings size={18} />
                        </button>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md shadow-lg font-black text-lg relative group"
                        >
                            {profile?.name?.charAt(0).toUpperCase() || 'U'}
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-[#0f172a] rounded-full"></div>
                        </button>

                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                                        <p className="text-base font-black text-slate-800 dark:text-white truncate">{profile?.name}</p>
                                        <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest">{profile?.role}</p>
                                    </div>

                                    {profile?.role === 'admin' && (
                                        <button
                                            onClick={() => { navigate('/admin/users'); setIsMenuOpen(false); }}
                                            className="w-full px-4 py-2.5 text-left text-[13px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors uppercase"
                                        >
                                            <Shield size={16} className="text-amber-500" />
                                            Administration
                                        </button>
                                    )}

                                    <button
                                        onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-[13px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors uppercase"
                                    >
                                        <Users size={16} className="text-blue-500" />
                                        Mon Profil
                                    </button>

                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2.5 text-left text-[13px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 transition-colors uppercase"
                                    >
                                        <LogOut size={16} />
                                        Déconnexion
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="main-container">
                {profile?.role === 'admin' && (
                    <div className="card-premium vibrant grad-blue !p-6 shadow-xl shadow-blue-500/20 mb-8 -mt-4 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
                        <div className="flex justify-between items-center relative z-10 text-white">
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/70 mb-1 leading-none">Chiffre d'Affaires Mensuel</p>
                                <div
                                    className="flex items-baseline gap-3 cursor-pointer group/nav w-fit"
                                    onClick={() => navigate('/revenue')}
                                >
                                    <h3 className="text-4xl font-black tracking-tighter leading-none">
                                        {(counts.revenue || 0).toLocaleString()} <span className="text-base font-bold opacity-60">DT</span>
                                    </h3>
                                    <div className="flex items-center gap-1 group-hover/nav:translate-x-1 transition-transform">
                                        <ChevronRight size={20} className="text-white/40 group-hover/nav:text-white transition-colors" />
                                    </div>
                                </div>
                                {counts.lastMonthRevenue > 0 && (
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black mt-2 w-fit ${counts.revenue >= counts.lastMonthRevenue
                                            ? 'bg-emerald-400/20 text-emerald-300'
                                            : 'bg-rose-400/20 text-rose-300'
                                        }`}>
                                        {counts.revenue >= counts.lastMonthRevenue ? '↑' : '↓'}
                                        {Math.abs(((counts.revenue - counts.lastMonthRevenue) / counts.lastMonthRevenue) * 100).toFixed(0)}%
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mt-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${counts.revenue >= counts.lastMonthRevenue ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`}></div>
                                    <p className="text-[11px] font-bold text-blue-100/90 uppercase tracking-widest leading-none">
                                        vs {counts.lastMonthRevenue.toLocaleString()} DT le mois dernier
                                    </p>
                                </div>
                            </div>
                            <div className="w-16 h-16 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500 shrink-0">
                                <Wallet size={28} className="text-white" />
                            </div>
                        </div>

                        {/* Background pattern */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100" height="100" fill="url(#grid)" />
                            </svg>
                        </div>
                    </div>
                )}

                <div className={profile?.role === 'admin' ? "" : "pt-4"}></div>

                <div className="dashboard-grid">
                    <div onClick={() => navigate('/clients')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 mb-2 dark:bg-blue-900/30 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                        <span className="mt-1 dark:text-slate-300">Fiches Clients</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{counts.clients} <span className="text-xs font-normal text-slate-500">clients</span></p>
                    </div>

                    <div onClick={() => navigate('/payments')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/20">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-emerald-600 mb-2 dark:bg-emerald-900/50 dark:text-emerald-400">
                            <Wallet size={24} />
                        </div>
                        <span className="mt-1 dark:text-emerald-300 font-bold">Paiements</span>
                        <p className="text-xs text-emerald-600/60 dark:text-emerald-400/60 uppercase font-black">Encaissements</p>
                    </div>

                    <div onClick={() => navigate('/planning')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-50 text-cyan-600 mb-2 dark:bg-cyan-900/30 dark:text-cyan-400">
                            <Calendar size={24} />
                        </div>
                        <span className="mt-1 dark:text-slate-300">Planning RDV</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{counts.scheduled} <span className="text-xs font-normal text-slate-500">prévus</span></p>
                        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>

                    <div onClick={() => navigate('/interventions')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 mb-2 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Wrench size={24} />
                        </div>
                        <span className="mt-1 dark:text-slate-300">Interventions</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{counts.interventions} <span className="text-xs font-normal text-slate-500">total</span></p>
                    </div>

                    <div onClick={() => navigate('/technician-portal')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform bg-orange-50/50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-800/20">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-orange-600 mb-2 dark:bg-orange-900/50 dark:text-orange-400">
                            <Activity size={24} />
                        </div>
                        <span className="mt-1 dark:text-orange-300 font-bold">Ma Tournée</span>
                        <p className="text-xs text-orange-600/60 dark:text-orange-400/60 uppercase font-black">Espace Tech</p>
                    </div>

                    <div onClick={() => navigate('/technicians')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-50 text-purple-600 mb-2 dark:bg-purple-900/30 dark:text-purple-400">
                            <Users size={24} />
                        </div>
                        <span className="mt-1 dark:text-slate-300">Techniciens</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{counts.technicians} <span className="text-xs font-normal text-slate-500">membres</span></p>
                    </div>
                </div>

                <div className="mt-12">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Flux d'activité</h3>
                        <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[13px] font-bold text-slate-500">LIVE</div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {recentInterventions.length === 0 ? (
                            <div className="flow-card dark:bg-slate-800 dark:border-slate-700">
                                <p className="text-base text-slate-400 dark:text-slate-500 text-center py-2">Aucune intervention réalisée</p>
                            </div>
                        ) : (
                            recentInterventions.map((inter) => {
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
                                    ? 'status-dot bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : isInProgress
                                        ? 'status-dot bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'status-dot bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
                                return (
                                    <div
                                        key={inter.id}
                                        onClick={() => navigate('/interventions')}
                                        className="flow-card animate-slide-up hover:scale-[1.01] transition-transform cursor-pointer dark:bg-slate-800 dark:border-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={dotClass}>
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-slate-800 dark:text-slate-200 truncate">{clientName}</p>
                                                <p className="text-[13px] text-slate-500 dark:text-slate-500 truncate">{techName} • {dateStr}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
