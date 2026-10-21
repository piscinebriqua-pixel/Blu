import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getPendingReclamations, getPendingReclamationsCount } from '../services/reclamationService';
import type { ReclamationRow } from '../lib/supabase';

export interface DashboardCounts {
    clients: number;
    technicians: number;
    interventions: number;
    scheduled: number;
    revenue: number;
    lastMonthRevenue: number;
    rollingRevenue: number;
    annualRevenue: number;
    monthlyBreakdown: number[];
    devis: number;
    devisPendingAmount: number;
    invoicesCount: number;
    invoicesPendingAmount: number;
}

export interface UserProfile {
    name: string;
    role: string;
}

export const useDashboardStats = () => {
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<DashboardCounts>({ 
        clients: 0, 
        technicians: 0, 
        interventions: 0, 
        scheduled: 0, 
        revenue: 0, 
        lastMonthRevenue: 0, 
        rollingRevenue: 0,
        annualRevenue: 0,
        monthlyBreakdown: Array(12).fill(0),
        devis: 0,
        devisPendingAmount: 0,
        invoicesCount: 0,
        invoicesPendingAmount: 0
    });
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [recentInterventions, setRecentInterventions] = useState<any[]>([]);
    const [pendingReclamations, setPendingReclamations] = useState<ReclamationRow[]>([]);
    const [pendingRecsCount, setPendingRecsCount] = useState<number>(0);
    const [isReclamationsModalOpen, setIsReclamationsModalOpen] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            let currentProfile: UserProfile | null = null;
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', session.user.id)
                    .maybeSingle();
                if (profileData) {
                    currentProfile = {
                        name: profileData.full_name || 'Utilisateur',
                        role: profileData.role
                    };
                    setProfile(currentProfile);
                }
            }

            // --- TENTATIVE D'EXÉCUTION RPC HAUTE PERFORMANCE (Postgres direct) ---
            let rpcSucceeded = false;
            try {
                const currentYear = new Date().getFullYear();
                const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_analytics', {
                    target_year: currentYear
                });

                if (!rpcError && rpcData) {
                    const isAdminUser = currentProfile?.role === 'admin';
                    setCounts({
                        clients: Number(rpcData.clients) || 0,
                        technicians: Number(rpcData.technicians) || 0,
                        interventions: Number(rpcData.interventions) || 0,
                        scheduled: Number(rpcData.scheduled) || 0,
                        devis: Number(rpcData.devis) || 0,
                        devisPendingAmount: Number(rpcData.devisPendingAmount) || 0,
                        invoicesCount: Number(rpcData.invoicesCount) || 0,
                        invoicesPendingAmount: Number(rpcData.invoicesPendingAmount) || 0,
                        // Masquer les métriques financières si non-admin
                        revenue: isAdminUser ? (Number(rpcData.revenue) || 0) : 0,
                        lastMonthRevenue: isAdminUser ? (Number(rpcData.lastMonthRevenue) || 0) : 0,
                        rollingRevenue: isAdminUser ? (Number(rpcData.rollingRevenue) || 0) : 0,
                        annualRevenue: isAdminUser ? (Number(rpcData.annualRevenue) || 0) : 0,
                        monthlyBreakdown: isAdminUser && Array.isArray(rpcData.monthlyBreakdown)
                            ? rpcData.monthlyBreakdown.map(Number)
                            : Array(12).fill(0)
                    });
                    rpcSucceeded = true;
                }
            } catch (err) {
                // RPC pas encore déployée ou erreur réseau : fallback automatique
                rpcSucceeded = false;
            }

            // --- FALLBACK CLIENT-SIDE (si RPC non disponible) ---
            if (!rpcSucceeded) {
                let clientCount = 0;
                let techCount = 0;
                let interventionCount = 0;
                let scheduledCount = 0;
                let devisCount = 0;
                let devisPendingAmt = 0;
                let invCount = 0;
                let invPendingAmt = 0;

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

                    const [devisRes, invoicesRes] = await Promise.all([
                        supabase
                            .from('devis')
                            .select('id, status, total_amount, is_template')
                            .or('is_template.is.null,is_template.eq.false'),
                        supabase
                            .from('invoices')
                            .select('id, status, total_ttc, paid_amount')
                    ]);

                    if (devisRes.data) {
                        const pendingDevis = devisRes.data.filter(d => d.status === 'pending' || !d.status);
                        devisCount = pendingDevis.length;
                        devisPendingAmt = pendingDevis.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
                    }

                    if (invoicesRes.data) {
                        invCount = invoicesRes.data.length;
                        const unpaidInvoices = invoicesRes.data.filter(i => i.status === 'issued' || i.status === 'partially_paid');
                        invPendingAmt = unpaidInvoices.reduce((sum, i) => {
                            const due = (Number(i.total_ttc) || 0) - (Number(i.paid_amount) || 0);
                            return sum + Math.max(0, due);
                        }, 0);
                    }
                } catch (e) {
                    console.warn('Counts fetch failed:', e);
                }

                let monthlyRevenue = 0;
                let lastMonthRevenue = 0;
                let rollingRevenue = 0;
                let annualRevenue = 0;
                const monthlyBreakdown = Array(12).fill(0);

                if (currentProfile?.role === 'admin') {
                    try {
                        const now = new Date();
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                        const rolling30d = new Date();
                        rolling30d.setDate(now.getDate() - 30);
                        const startOfYear = new Date(now.getFullYear(), 0, 1);
                        const currentYear = now.getFullYear();

                        const earliestDate = startOfLastMonth < startOfYear ? startOfLastMonth : startOfYear;
                        const { data: paymentsData } = await supabase
                            .from('payments')
                            .select('amount, payment_date')
                            .neq('method', 'remise')
                            .gte('payment_date', earliestDate.toISOString());

                        if (paymentsData) {
                            const startOfMonthTime = startOfMonth.getTime();
                            const startOfLastMonthTime = startOfLastMonth.getTime();
                            const endOfLastMonthTime = endOfLastMonth.getTime();
                            const rolling30dTime = rolling30d.getTime();
                            const startOfYearTime = startOfYear.getTime();

                            paymentsData.forEach(p => {
                                const amt = Number(p.amount) || 0;
                                const pDate = new Date(p.payment_date);
                                const pTime = pDate.getTime();

                                if (pTime >= startOfMonthTime) monthlyRevenue += amt;
                                if (pTime >= startOfLastMonthTime && pTime <= endOfLastMonthTime) lastMonthRevenue += amt;
                                if (pTime >= rolling30dTime) rollingRevenue += amt;
                                if (pTime >= startOfYearTime) annualRevenue += amt;

                                if (pDate.getFullYear() === currentYear) {
                                    const m = pDate.getMonth();
                                    if (m >= 0 && m < 12) {
                                        monthlyBreakdown[m] += amt;
                                    }
                                }
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
                    monthlyBreakdown: monthlyBreakdown,
                    devis: devisCount,
                    devisPendingAmount: devisPendingAmt,
                    invoicesCount: invCount,
                    invoicesPendingAmount: invPendingAmt
                });
            }

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

            try {
                const [recs, rCount] = await Promise.all([
                    getPendingReclamations(2),
                    getPendingReclamationsCount()
                ]);
                setPendingReclamations(recs);
                setPendingRecsCount(rCount);
            } catch (e) {
                console.warn('Reclamations fetch failed:', e);
            }

        } catch (error) {
            console.error('Erreur stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        loading,
        counts,
        profile,
        recentInterventions,
        pendingReclamations,
        pendingRecsCount,
        isReclamationsModalOpen,
        setIsReclamationsModalOpen,
        fetchStats
    };
};
