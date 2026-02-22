import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Users,
    Wrench,
    ChevronRight,
    TrendingUp,
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
    const [counts, setCounts] = useState({ clients: 0, technicians: 0 });
    const [profile, setProfile] = useState<{ name: string, role: string } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Erreur déconnexion:', error.message);
        navigate('/login');
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name, role')
                        .eq('id', session.user.id)
                        .single();
                    if (profileData) {
                        setProfile({
                            name: profileData.full_name || 'Utilisateur',
                            role: profileData.role
                        });
                    }
                }

                const [clientsRes, techRes] = await Promise.all([
                    supabase.from('clients').select('id', { count: 'exact', head: true }),
                    supabase.from('technicians').select('id', { count: 'exact', head: true })
                ]);
                setCounts({
                    clients: clientsRes.count || 0,
                    technicians: techRes.count || 0
                });
            } catch (error) {
                console.error('Erreur stats:', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="gabarit-wrapper">
            <header className="header-gradient flex justify-between items-start">
                <div>
                    <BccpLogo
                        width={180}
                        fillColor="white"
                        className="drop-shadow-lg -ml-4 -mt-2"
                    />
                    <div className="flex flex-row items-center gap-2 opacity-80 mt-1 ml-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Système Actif</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {/* Simplified Profile Menu */}
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
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsMenuOpen(false)}
                                ></div>
                                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                                        <p className="text-sm font-black text-slate-800 dark:text-white truncate">{profile?.name}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile?.role}</p>
                                    </div>

                                    {profile?.role === 'admin' && (
                                        <button
                                            onClick={() => { navigate('/admin/users'); setIsMenuOpen(false); }}
                                            className="w-full px-4 py-2.5 text-left text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors uppercase"
                                        >
                                            <Shield size={16} className="text-amber-500" />
                                            Administration
                                        </button>
                                    )}

                                    <button
                                        onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors uppercase"
                                    >
                                        <Users size={16} className="text-blue-500" />
                                        Mon Profil
                                    </button>

                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2.5 text-left text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 transition-colors uppercase"
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

                {/* Main Stats Summary */}

                <div className="progress-container animate-slide-up dark:bg-slate-800 dark:border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-primary dark:text-primary-light" />
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Objectif Quotidien</span>
                        </div>
                        <span className="text-lg font-black text-primary dark:text-blue-400">80%</span>
                    </div>
                    <div className="progress-bar-bg dark:bg-slate-700">
                        <div className="progress-bar-fill w-[80%]"></div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div onClick={() => navigate('/clients')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 mb-2 dark:bg-blue-900/30 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                        <span className="mt-1 dark:text-slate-300">Fiches Clients</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{counts.clients} <span className="text-[10px] font-normal text-slate-400">clients</span></p>
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
                        <p className="text-xl font-bold text-slate-800 dark:text-white">12 <span className="text-[10px] font-normal text-slate-400">active</span></p>
                        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>

                    <div onClick={() => navigate('/interventions')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 mb-2 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Wrench size={24} />
                        </div>
                        <span className="mt-1 dark:text-slate-300">Interventions</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">Planning <span className="text-[10px] font-normal text-slate-400">suivi</span></p>
                    </div>



                    <div
                        onClick={() => navigate('/technician-portal')}
                        className="action-item cursor-pointer hover:scale-[1.02] transition-transform bg-orange-50/50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-800/20"
                    >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-orange-600 mb-2 dark:bg-orange-900/50 dark:text-orange-400">
                            <Activity size={24} />
                        </div>
                        <span className="mt-1 dark:text-orange-300 font-bold">Ma Tournée</span>
                        <p className="text-xs text-orange-600/60 dark:text-orange-400/60 uppercase font-black">Espace Tech</p>
                    </div>

                    <div className="action-item cursor-pointer hover:scale-[1.02] transition-transform dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-teal-50 text-teal-600 mb-2 dark:bg-teal-900/30 dark:text-teal-400">
                            <TrendingUp size={24} />
                        </div>
                        <span className="mt-1 dark:text-slate-300">Rapports</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">OK</p>
                    </div>

                    <div onClick={() => navigate('/technicians')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-50 text-purple-600 mb-2 dark:bg-purple-900/30 dark:text-purple-400">
                            <Users size={24} />
                        </div>
                        <span className="mt-1 dark:text-slate-300">Techniciens</span>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{counts.technicians} <span className="text-[10px] font-normal text-slate-400">membres</span></p>
                    </div>

                    {profile?.role === 'admin' && (
                        <div onClick={() => navigate('/settings/services')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform bg-violet-50/50 border-violet-100 dark:bg-violet-900/10 dark:border-violet-800/20">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-violet-600 mb-2 dark:bg-violet-900/50 dark:text-violet-400">
                                <Settings size={24} />
                            </div>
                            <span className="mt-1 dark:text-violet-300 font-bold">Services</span>
                            <p className="text-xs text-violet-600/60 dark:text-violet-400/60 uppercase font-black">Configuration</p>
                        </div>
                    )}
                </div>

                {/* Logs Feed */}
                <div className="mt-12">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Flux d'activité</h3>
                        <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-500">LIVE</div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flow-card animate-slide-up hover:scale-[1.01] transition-transform cursor-pointer dark:bg-slate-800 dark:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="status-dot bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Point de mesure #{100 + i * 15}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Validation technique • Agent {['M. Hamdi', 'M. Saleh', 'M. Younes'][i - 1]}</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                            </div>
                        ))}
                    </div>
                </div>
            </main >
        </div >
    );
};

export default Dashboard;
