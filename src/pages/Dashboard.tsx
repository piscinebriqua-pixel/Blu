import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Droplets,
    Calendar,
    Settings,
    Scissors,
    Loader2,
    Clock,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({ totalClients: 0, totalPools: 0, interventionsToday: 0, balance: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { count: c } = await supabase.from('clients').select('*', { count: 'exact', head: true });
            const { count: p } = await supabase.from('pools').select('*', { count: 'exact', head: true });
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const { count: i } = await supabase.from('interventions').select('*', { count: 'exact', head: true }).gte('visit_date', today.toISOString());
            const { data: b } = await supabase.from('clients').select('balance');
            const totalB = b?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0;

            setStats({ totalClients: c || 0, totalPools: p || 0, interventionsToday: i || 0, balance: totalB });
        } finally { setLoading(false); }
    };

    const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
    );

    return (
        <div className="page-container pb-28">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                <div>
                    <h1 className="welcome-text">Bienvenue ! 👋</h1>
                    <p className="date-text">Nous sommes le <span style={{ color: 'var(--accent-blue)', fontWeight: '700' }}>{todayStr}</span></p>
                </div>
                <div className="flex gap-4">
                    <div className="premium-card flex items-center gap-3" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)' }}>
                        <Clock size={16} className="text-blue-400" />
                        <span className="font-black text-sm">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <ThemeToggle />
                    <button className="btn-pill bg-white text-black hover:bg-gray-100 border-none transition-all">
                        <Settings size={18} /> ADMIN
                    </button>
                </div>
            </header>

            {/* Mini Stat Row */}
            <div className="mini-stat-grid mb-12">
                <div className="mini-stat-card">
                    <p className="mini-stat-label">Solde Clients</p>
                    <p className="mini-stat-value" style={{ color: 'var(--accent-green)' }}>{stats.balance.toFixed(0)} <span className="text-xs">DT</span></p>
                </div>
                <div className="mini-stat-card">
                    <p className="mini-stat-label">Interventions</p>
                    <p className="mini-stat-value">{stats.interventionsToday}</p>
                </div>
                <div className="mini-stat-card">
                    <p className="mini-stat-label">Prestations</p>
                    <p className="mini-stat-value">54</p>
                </div>
                <div className="mini-stat-card">
                    <p className="mini-stat-label">Bassins</p>
                    <p className="mini-stat-value">{stats.totalPools}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-8">
                <Droplets size={20} className="text-blue-500" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Centre depilotage</h2>
            </div>

            {/* Main Nav Grid */}
            <div className="nav-grid">
                <Link to="/settings/services" className="nav-card" style={{ background: 'linear-gradient(135deg, #5856D6, #AF52DE)', boxShadow: '0 10px 40px -10px rgba(88, 86, 214, 0.4)' }}>
                    <div className="nav-card-icon"><Scissors size={24} /></div>
                    <div>
                        <h3 className="welcome-text" style={{ fontSize: '1.4rem', background: 'none', WebkitTextFillColor: 'white' }}>CATALOGUE</h3>
                        <p className="date-text" style={{ color: 'rgba(255,255,255,0.8)' }}>Services & Tarifs</p>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-2xl font-black text-white">54 Prestat.</span>
                        <ArrowRight size={24} className="text-white opacity-50" />
                    </div>
                </Link>

                <Link to="/clients" className="nav-card" style={{ background: 'linear-gradient(135deg, #007AFF, #5AC8FA)', boxShadow: '0 10px 40px -10px rgba(0, 122, 255, 0.4)' }}>
                    <div className="nav-card-icon"><Calendar size={24} /></div>
                    <div>
                        <h3 className="welcome-text" style={{ fontSize: '1.4rem', background: 'none', WebkitTextFillColor: 'white' }}>PLANNING</h3>
                        <p className="date-text" style={{ color: 'rgba(255,255,255,0.8)' }}>Suivi technique</p>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-2xl font-black text-white">{stats.interventionsToday} Visites</span>
                        <ArrowRight size={24} className="text-white opacity-50" />
                    </div>
                </Link>

                <Link to="/technicians" className="nav-card" style={{ background: 'linear-gradient(135deg, #FF9500, #FFCC00)', boxShadow: '0 10px 40px -10px rgba(255, 149, 0, 0.4)' }}>
                    <div className="nav-card-icon"><Users size={24} /></div>
                    <div>
                        <h3 className="welcome-text" style={{ fontSize: '1.4rem', background: 'none', WebkitTextFillColor: 'white' }}>ÉQUIPE</h3>
                        <p className="date-text" style={{ color: 'rgba(255,255,255,0.8)' }}>Gestion personnel</p>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-2xl font-black text-white">12 Membres</span>
                        <ArrowRight size={24} className="text-white opacity-50" />
                    </div>
                </Link>

                <Link to="/clients" className="nav-card" style={{ background: 'linear-gradient(135deg, #34C759, #32D74B)', boxShadow: '0 10px 40px -10px rgba(52, 199, 89, 0.4)' }}>
                    <div className="nav-card-icon"><Users size={24} /></div>
                    <div>
                        <h3 className="welcome-text" style={{ fontSize: '1.4rem', background: 'none', WebkitTextFillColor: 'white' }}>CLIENTS</h3>
                        <p className="date-text" style={{ color: 'rgba(255,255,255,0.8)' }}>Base de données</p>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-2xl font-black text-white">{stats.totalClients} fiches</span>
                        <ArrowRight size={24} className="text-white opacity-50" />
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
