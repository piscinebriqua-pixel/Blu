import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Users,
    ChevronRight,
    Calendar,
    LogOut,
    Activity,
    Shield,
    Wallet,
    Settings,
    FileText,
    Briefcase,
    RefreshCcw,
    QrCode,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import BccpLogo from '../components/BccpLogo';
import PageLayout from '../components/PageLayout';
import ModalLayout from '../components/ModalLayout';
import { QRCodeSVG } from 'qrcode.react';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ clients: 0, technicians: 0, interventions: 0, scheduled: 0, revenue: 0, lastMonthRevenue: 0, devis: 0 });
    const [profile, setProfile] = useState<{ name: string, role: string } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [recentInterventions, setRecentInterventions] = useState<any[]>([]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Erreur déconnexion:', error.message);
        navigate('/login');
    };

    const handleUpdateApp = async () => {
        try {
            toast.loading("Vérification des mises à jour...", { id: 'app-update' });
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }
            setTimeout(() => {
                toast.success("Mise à jour activée !", { id: 'app-update' });
                const url = new URL(window.location.href);
                url.searchParams.set('upd', Date.now().toString());
                window.location.href = url.toString();
            }, 1000);
        } catch (error) {
            console.error('Update failed:', error);
            window.location.reload();
        }
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
                            supabase.from('payments').select('amount').neq('method', 'remise').gte('payment_date', startOfMonth.toISOString()),
                            supabase.from('payments').select('amount').neq('method', 'remise').gte('payment_date', startOfLastMonth.toISOString()).lte('payment_date', endOfLastMonth.toISOString())
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
                    lastMonthRevenue: lastMonthRevenue,
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

    const leftContent = (
        <div onClick={() => navigate('/')} className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/10 group cursor-pointer hover:bg-white/30 transition-all shrink-0">
            <BccpLogo fillColor="white" className="logo-adaptive transition-all duration-300" />
        </div>
    );

    const rightContent = (
        <div className="flex items-center gap-3">
            <ThemeToggle />
            {profile?.role === 'admin' && (
                <button
                    onClick={() => navigate('/settings/services')}
                    className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md shadow-lg border border-white/10"
                    title="Configuration"
                >
                    <Settings size={22} />
                </button>
            )}

            <button
                onClick={() => setIsQrModalOpen(true)}
                className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-black transition-all shadow-lg border border-white/10"
                title="Afficher le QR Code d'accès"
            >
                <QrCode size={22} />
            </button>

            <div className="relative">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md shadow-lg font-black text-lg relative group border border-white/10"
                >
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-primary rounded-full"></div>
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
                                onClick={handleUpdateApp}
                                className="w-full px-4 py-2.5 text-left text-[13px] font-black text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-3 transition-colors uppercase"
                            >
                                <RefreshCcw size={16} className="animate-[spin_10s_linear_infinite]" />
                                Mettre à jour l'app
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
    );

    return (
        <PageLayout title="" leftContent={leftContent} rightContent={rightContent}>
            <div className="dashboard-grid">
                {profile?.role === 'admin' && (
                    <div onClick={() => navigate('/revenue')} className="action-item cursor-pointer group bg-blue-50/30 border-blue-100/50 dark:bg-blue-900/10 dark:border-blue-800/20 shadow-blue-500/10">
                        <div className="icon-wrapper bg-white dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-none">
                            <Wallet size={24} />
                        </div>
                        <div className="content-wrapper">
                            <span>CA Mensuel</span>
                            <p className="text-blue-900 dark:text-white">Revenus</p>
                        </div>
                    </div>
                )}
                <div onClick={() => navigate('/clients')} className="action-item cursor-pointer group dark:bg-slate-800/50 dark:border-slate-700/50">
                    <div className="icon-wrapper bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Users size={24} />
                    </div>
                    <div className="content-wrapper">
                        <span>Fiches Clients</span>
                        <p className="dark:text-white">{counts.clients} <span className="text-[10px] font-normal text-slate-500 lowercase tracking-normal">clients</span></p>
                    </div>
                </div>

                <div onClick={() => navigate('/payments')} className="action-item cursor-pointer group bg-emerald-50/30 border-emerald-100/50 dark:bg-emerald-900/10 dark:border-emerald-800/20">
                    <div className="icon-wrapper bg-white dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                        <Wallet size={24} />
                    </div>
                    <div className="content-wrapper">
                        <span>Paiements</span>
                        <p className="text-emerald-600/60 dark:text-emerald-400/60">Encaissements</p>
                    </div>
                </div>

                <div onClick={() => navigate('/planning')} className="action-item cursor-pointer group relative overflow-hidden dark:bg-slate-800/50 dark:border-slate-700/50">
                    <div className="icon-wrapper bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                        <Calendar size={24} />
                    </div>
                    <div className="content-wrapper">
                        <span>Planning</span>
                        <div className="flex flex-col items-center mt-1">
                            <p className="dark:text-white text-sm">
                                {counts.scheduled} <span className="text-[10px] font-normal text-slate-500 lowercase tracking-normal">prévus</span>
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {counts.interventions} total
                            </p>
                        </div>
                    </div>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                </div>


                <div onClick={() => navigate('/chantiers')} className="action-item cursor-pointer group bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/20">
                    <div className="icon-wrapper bg-white dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100/50">
                        <FileText size={24} />
                    </div>
                    <div className="content-wrapper">
                        <span>Chantiers</span>
                        <p className="text-blue-600 dark:text-blue-400">{counts.devis} <span className="text-[10px] font-normal text-slate-500 lowercase tracking-normal">en cours</span></p>
                    </div>
                </div>

                <div onClick={() => navigate('/technician-portal')} className="action-item cursor-pointer group bg-orange-50/30 border-orange-100/50 dark:bg-orange-900/10 dark:border-orange-800/20">
                    <div className="icon-wrapper bg-white dark:bg-orange-900/50 text-orange-600 dark:text-orange-400">
                        <Activity size={24} />
                    </div>
                    <div className="content-wrapper">
                        <span>Ma Tournée</span>
                        <p className="text-orange-600 dark:text-orange-400">Espace Tech</p>
                    </div>
                </div>

                <div onClick={() => navigate('/technicians')} className="action-item cursor-pointer group dark:bg-slate-800/50 dark:border-slate-700/50">
                    <div className="icon-wrapper bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Users size={24} />
                    </div>
                    <div className="content-wrapper">
                        <span>Techniciens</span>
                        <p className="dark:text-white">{counts.technicians} <span className="text-[10px] font-normal text-slate-500 lowercase tracking-normal">membres</span></p>
                    </div>
                </div>

                <div onClick={() => navigate('/partners')} className="action-item cursor-pointer group bg-slate-100/50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50">
                    <div className="icon-wrapper bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 shadow-sm">
                        <Briefcase size={24} />
                    </div>
                    <div className="content-wrapper">
                        <span>Partenaires</span>
                        <p className="text-slate-600 dark:text-slate-400">Réseau</p>
                    </div>
                </div>

                <div onClick={() => setIsQrModalOpen(true)} className="action-item cursor-pointer group bg-slate-900 border-slate-800 dark:bg-slate-900 dark:border-slate-800 shadow-2xl">
                    <div className="icon-wrapper bg-white/10 text-white border border-white/10">
                        <QrCode size={24} />
                    </div>
                    <div className="content-wrapper">
                        <span className="text-white/60">Espace Client</span>
                        <p className="text-white font-black uppercase tracking-widest">Code QR</p>
                    </div>
                </div>
            </div>

            <div className="mt-10">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Flux d'activité</h3>
                    <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/50 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">LIVE</div>
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
                                            <h4 className="text-[15px] font-black text-slate-800 dark:text-white uppercase truncate tracking-tight">{clientName}</h4>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 ml-2">{dateStr}</span>
                                        </div>
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest truncate opacity-80">{techName}</p>
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
        </PageLayout>
    );
};

export default Dashboard;
