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
    Activity
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({ clients: 0, technicians: 0 });

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Erreur déconnexion:', error.message);
        navigate('/login');
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
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
                    <h1>DeepBlue</h1>
                    <div className="flex flex-row items-center gap-2 opacity-80">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        <p>Système Actif</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button title="Déconnexion" onClick={handleLogout} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="main-container">

                {/* Main Stats Summary */}

                <div className="progress-container animate-slide-up">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-primary" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Objectif Quotidien</span>
                        </div>
                        <span className="text-lg font-black text-primary">80%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill w-[80%]"></div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div onClick={() => navigate('/clients')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 mb-2">
                            <Users size={24} />
                        </div>
                        <span className="mt-1">Fiches Clients</span>
                        <p className="text-xl font-bold text-slate-800">{counts.clients} <span className="text-[10px] font-normal text-slate-400">clients</span></p>
                    </div>

                    <div className="action-item cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-50 text-cyan-600 mb-2">
                            <Calendar size={24} />
                        </div>
                        <span className="mt-1">Planning RDV</span>
                        <p className="text-xl font-bold text-slate-800">12 <span className="text-[10px] font-normal text-slate-400">active</span></p>
                        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>

                    <div className="action-item cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 mb-2">
                            <Wrench size={24} />
                        </div>
                        <span className="mt-1">Interventions</span>
                        <p className="text-xl font-bold text-slate-800">{counts.technicians} <span className="text-[10px] font-normal text-slate-400">équipes</span></p>
                    </div>

                    <div className="action-item cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-teal-50 text-teal-600 mb-2">
                            <TrendingUp size={24} />
                        </div>
                        <span className="mt-1">Rapports</span>
                        <p className="text-xl font-bold text-slate-800">OK</p>
                    </div>

                    <div onClick={() => navigate('/technicians')} className="action-item cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-50 text-purple-600 mb-2">
                            <Users size={24} />
                        </div>
                        <span className="mt-1">Techniciens</span>
                        <p className="text-xl font-bold text-slate-800">{counts.technicians} <span className="text-[10px] font-normal text-slate-400">membres</span></p>
                    </div>
                </div>

                {/* Logs Feed */}
                <div className="mt-12">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Flux d'activité</h3>
                        <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-500">LIVE</div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flow-card animate-slide-up hover:scale-[1.01] transition-transform cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="status-dot bg-green-100 text-green-600">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Point de mesure #{100 + i * 15}</p>
                                        <p className="text-xs text-slate-400">Validation technique • Agent {['M. Hamdi', 'M. Saleh', 'M. Younes'][i - 1]}</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
