import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Wallet,
    TrendingUp,
    Calendar,
    Search,
    PieChart,
    BarChart3,
    CreditCard,
    Coins,
    Banknote,
    FileDown,
    Wrench,
    ChevronRight
} from 'lucide-react';

interface RevenueStats {
    total: number; // Paid
    realizedTotal: number; // Completed work value
    lastMonthTotal: number;
    growth: number;
    avgTicket: number;
    transactionCount: number;
    byMethod: { method: string, amount: number }[];
    byTech: { name: string, amount: number }[];
    pendingTotal: number;
}

const Revenue: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<RevenueStats>({
        total: 0,
        realizedTotal: 0,
        lastMonthTotal: 0,
        growth: 0,
        avgTicket: 0,
        transactionCount: 0,
        byMethod: [],
        byTech: [],
        pendingTotal: 0
    });
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');

    useEffect(() => {
        fetchRevenueData();
    }, [timeRange]);

    const fetchRevenueData = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Define dates
            const now = new Date();
            let startDate = new Date();
            if (timeRange === 'day') startDate.setHours(0, 0, 0, 0);
            else if (timeRange === 'week') startDate.setDate(now.getDate() - 7);
            else if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
            else if (timeRange === 'year') startDate.setFullYear(now.getFullYear() - 1);
            else startDate = new Date(0);

            console.log(`[Finance] Fetching for period: ${timeRange} (from ${startDate.toISOString()})`);

            // 1. Fetch Payments with client/tech info
            const { data: payments, error: pErr } = await supabase
                .from('payments')
                .select(`
                    amount,
                    method,
                    payment_date,
                    technician:technicians(full_name)
                `)
                .neq('method', 'remise')
                .gte('payment_date', startDate.toISOString())
                .order('payment_date', { ascending: false });

            if (pErr) throw pErr;

            // 2. Fetch Last Month for growth
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            const { data: lastMonthData } = await supabase
                .from('payments')
                .select('amount')
                .neq('method', 'remise')
                .gte('payment_date', lastMonthStart.toISOString())
                .lte('payment_date', lastMonthEnd.toISOString());

            // 3. Fetch Completed Interventions for Realized CA
            const { data: completedInterventions } = await supabase
                .from('interventions')
                .select(`
                    id,
                    services:intervention_services(price_at_time),
                    products:intervention_products(total_price)
                `)
                .eq('status', 'completed')
                .gte('visit_date', startDate.toISOString());

            // 4. Fetch ALL clients with debt (balance < 0) - GLOBAL (no dates)
            const { data: debtClients, error: cErr } = await supabase
                .from('clients')
                .select('id, balance')
                .lt('balance', 0);

            if (cErr) console.error('[Finance] Error fetching debts:', cErr);

            // Calculations
            const total = payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;
            const lastTotal = lastMonthData?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;

            const realizedTotal = completedInterventions?.reduce((acc: number, inter: any) => {
                const sTotal = inter.services?.reduce((sAcc: number, s: any) => sAcc + (s.price_at_time || 0), 0) || 0;
                const pTotal = inter.products?.reduce((pAcc: number, p: any) => pAcc + (p.total_price || 0), 0) || 0;
                return acc + sTotal + pTotal;
            }, 0) || 0;

            const growth = lastTotal > 0 ? ((total - lastTotal) / lastTotal) * 100 : 0;
            const avgTicket = payments && payments.length > 0 ? total / payments.length : 0;

            // Sum of absolute values of negative balances
            const pendingTotal = debtClients?.reduce((acc: number, c: any) => acc + Math.abs(c.balance || 0), 0) || 0;

            console.log(`[Finance] Resumé: CA=${total}, Realisé=${realizedTotal}, Dettes=${pendingTotal} (${debtClients?.length || 0} clients)`);

            // Method breakdown
            const methodsMap: Record<string, number> = {};
            payments?.forEach(p => {
                methodsMap[p.method] = (methodsMap[p.method] || 0) + (p.amount || 0);
            });
            const byMethod = Object.entries(methodsMap).map(([method, amount]) => ({ method, amount }));

            // Tech breakdown
            const techMap: Record<string, number> = {};
            payments?.forEach((p: any) => {
                const name = p.technician?.full_name || 'Inconnu';
                techMap[name] = (techMap[name] || 0) + (p.amount || 0);
            });
            const byTech = Object.entries(techMap)
                .map(([name, amount]) => ({ name, amount }))
                .sort((a, b) => b.amount - a.amount);

            setStats({
                total,
                realizedTotal,
                lastMonthTotal: lastTotal,
                growth,
                avgTicket,
                transactionCount: payments?.length || 0,
                byMethod,
                byTech,
                pendingTotal
            });

        } catch (error) {
            console.error('Revenue error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const now = new Date().toLocaleDateString('fr-FR');

        // Header
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text('RAPPORT FINANCIER BCCP', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Généré le: ${now}`, 14, 30);
        doc.text(`Période: ${timeRange.toUpperCase()}`, 14, 35);

        // Resume Stats
        doc.setFontSize(14);
        doc.setTextColor(59, 130, 246); // blue-500
        doc.text('RÉSUMÉ DES PERFORMANCES', 14, 50);

        autoTable(doc, {
            startY: 55,
            head: [['Indicateur', 'Valeur']],
            body: [
                ['Production (Réalisé)', `${stats.realizedTotal.toLocaleString()} DT`],
                ['Encaissements (Cash)', `${stats.total.toLocaleString()} DT`],
                ['Taux de Recouvrement', `${stats.realizedTotal > 0 ? ((stats.total / stats.realizedTotal) * 100).toFixed(1) : 0}%`],
                ['Reste à Percevoir', `${Math.max(0, stats.realizedTotal - stats.total).toLocaleString()} DT`],
                ['Panier Moyen', `${stats.avgTicket.toFixed(0)} DT`],
                ['Nombre de Transactions', stats.transactionCount.toString()],
                ['Croissance vs Mois Dernier', `${stats.growth.toFixed(1)}%`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        // Method Breakdown
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.text('RÉPARTITION PAR MODE DE PAIEMENT', 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Mode de Paiement', 'Montant (DT)', '% du Total']],
            body: stats.byMethod.map(m => [
                m.method,
                m.amount.toLocaleString(),
                `${((m.amount / stats.total) * 100).toFixed(1)}%`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] } // emerald-500
        });

        // Tech Performance
        const techY = (doc as any).lastAutoTable.finalY + 15;
        doc.text('PERFORMANCE PAR TECHNICIEN', 14, techY);

        autoTable(doc, {
            startY: techY + 5,
            head: [['Technicien', 'C.A Généré (DT)']],
            body: stats.byTech.map(t => [t.name, t.amount.toLocaleString()]),
            theme: 'striped',
            headStyles: { fillColor: [139, 92, 246] } // purple-500
        });

        doc.save(`Rapport_CA_BCCP_${timeRange}_${now.replace(/\//g, '-')}.pdf`);
    };

    return (
        <PageLayout
            title="ANALYSE DU CA"
            subtitle="PILOTAGE FINANCIER"
            showBackButton={true}
            loading={loading}
        >
            <div className="flex flex-col gap-6">
                <style>
                    {`
                        ${stats.byMethod.map((item, i) => `.bar-method-${i} { width: ${(item.amount / stats.total) * 100}%; }`).join('\n')}
                        ${stats.byTech.map((item, i) => `.bar-tech-${i} { width: ${(item.amount / (stats.byTech[0]?.amount || 1)) * 100}%; }`).join('\n')}
                    `}
                </style>

                {/* Time range selector */}
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm self-start">
                    {(['day', 'week', 'month', 'year'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-2 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${timeRange === range
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            {range === 'day' ? 'Jour' : range === 'week' ? 'Semaine' : range === 'month' ? 'Mois' : 'Année'}
                        </button>
                    ))}
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                    <div
                        onClick={() => navigate(`/payments?range=${timeRange}`)}
                        className="card-premium vibrant grad-blue p-4 md:p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95"
                    >
                        <div className="flex justify-between items-start relative z-10 mb-1">
                            <p className="text-premium-label !text-white/70">Encaissements (Cash)</p>
                            <ChevronRight size={18} className="text-white/30 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black text-white tracking-tighter">
                                {stats.total.toLocaleString()} <span className="text-sm opacity-60">DT</span>
                            </h3>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${stats.growth >= 0 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'}`}>
                                    {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(0)}%
                                </span>
                                <span className="text-[10px] font-medium text-blue-100/60 uppercase">vs mois dernier</span>
                            </div>
                        </div>
                        <Wallet className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                    </div>

                    <div className="card-white p-4 md:p-6 border-blue-100/50 dark:border-blue-800/30">
                        <p className="text-premium-label text-blue-600 dark:text-blue-400 mb-1">Production (Réalisé)</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {stats.realizedTotal.toLocaleString()} <span className="text-sm opacity-40">DT</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Wrench size={14} className="text-blue-500" />
                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase">Valeur Interventions</span>
                        </div>
                    </div>

                    <div className="card-white p-4 md:p-6 border-emerald-100/50 dark:border-emerald-800/30">
                        <p className="text-premium-label text-emerald-600 dark:text-emerald-400 mb-1">Panier Moyen</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {stats.avgTicket.toFixed(0)} <span className="text-sm opacity-40">DT</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <TrendingUp size={14} className="text-emerald-500" />
                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase">{stats.transactionCount} transactions</span>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/clients?filter=Dettes')}
                        className="card-white p-4 md:p-6 border-rose-100/50 dark:border-rose-800/30 cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-lg hover:-translate-y-1 transition-all group active:scale-95"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-premium-label text-rose-600 dark:text-rose-400">Reste à Percevoir</p>
                            <ChevronRight size={16} className="text-rose-300 dark:text-rose-700 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {stats.pendingTotal.toLocaleString()} <span className="text-sm opacity-40">DT</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Calendar size={14} className="text-rose-400" />
                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase">
                                Total Dettes Clients
                            </span>
                        </div>
                    </div>

                    <div className="card-white p-4 md:p-6">
                        <p className="text-premium-label text-blue-600 dark:text-blue-400 mb-1">Record Mensuel</p>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {stats.lastMonthTotal.toLocaleString()} <span className="text-sm opacity-40">DT</span>
                        </h3>
                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 mt-2 uppercase">Mois Précédent</p>
                    </div>
                </div>

                {/* Secondary Charts / Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                    {/* Payment Methods */}
                    <div className="card-white !p-4 md:!p-8 flex flex-col gap-4 md:gap-6 md:col-span-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <PieChart size={16} className="text-primary" /> Modes de Paiement
                            </h4>
                        </div>
                        <div className="flex flex-col gap-5">
                            {stats.byMethod.map((item) => (
                                <div key={item.method} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                {item.method === 'Espèces' ? <Coins size={14} className="text-amber-500" /> :
                                                    item.method === 'Carte' ? <CreditCard size={14} className="text-blue-500" /> :
                                                        <Banknote size={14} className="text-emerald-500" />}
                                                {item.method}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400">{((item.amount / stats.total) * 100).toFixed(0)}% du total</span>
                                        </div>
                                        <span className="text-base font-black text-slate-800 dark:text-white">{item.amount.toLocaleString()} <span className="text-[10px] opacity-40">DT</span></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 bar-method-${stats.byMethod.indexOf(item)} ${item.method === 'Espèces' ? 'bg-amber-500' : item.method === 'Carte' ? 'bg-blue-500' : 'bg-emerald-500'
                                                }`}
                                        />
                                    </div>
                                </div>
                            ))}
                            {stats.byMethod.length === 0 && <p className="text-slate-400 text-center py-6 italic text-sm">Aucune donnée disponible</p>}
                        </div>
                    </div>

                    {/* Performance by Technician */}
                    <div className="card-white !p-4 md:!p-8 flex flex-col gap-4 md:gap-6 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={16} className="text-primary" /> CA par Technicien (Encaissements)
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats.byTech.map((item) => (
                                <div key={item.name} className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-800 hover:border-primary/20 transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary font-black text-lg">
                                        {item.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-[13px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight">{item.name}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-primary rounded-full bar-tech-${stats.byTech.indexOf(item)}`}
                                                />
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-900 dark:text-white shrink-0">{item.amount.toLocaleString()} <span className="text-[9px] opacity-40">DT</span></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.byTech.length === 0 && <p className="text-slate-400 text-center py-6 italic text-sm">Aucune donnée disponible</p>}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate('/payments')}
                        className="flex-1 min-w-[200px] h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group"
                    >
                        <Search size={18} className="text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[12px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Voir toutes les transactions</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={stats.total === 0}
                        className={`flex-1 min-w-[200px] h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group ${stats.total === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <FileDown size={18} className="text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[12px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Exporter rapport (PDF)</span>
                    </button>
                </div>
            </div>
        </PageLayout >
    );
};

export default Revenue;
