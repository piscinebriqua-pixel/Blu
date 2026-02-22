import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import {
    Search,
    Wallet,
    Plus,
    User,
    Calendar,
    ChevronRight,
    Filter,
    ArrowUpRight,
    Trash2
} from 'lucide-react';
import GlobalPaymentModal from '../components/GlobalPaymentModal';

interface Payment {
    id: string;
    client_id: string;
    technician_id: string;
    amount: number;
    method: string;
    notes: string;
    payment_date: string;
    created_at: string;
    client: {
        first_name: string;
        last_name: string;
    };
    technician: {
        full_name: string;
    };
}

const Payments: React.FC = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        fetchUserAndPayments();
    }, []);

    const fetchUserAndPayments = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            const isUserAdmin = profile?.role === 'admin';
            setIsAdmin(isUserAdmin);

            let query = supabase
                .from('payments')
                .select(`
                    *,
                    client:clients(first_name, last_name),
                    technician:technicians(full_name)
                `)
                .order('payment_date', { ascending: false });

            if (!isUserAdmin) {
                if (profile?.technician_id) {
                    query = query.eq('technician_id', profile.technician_id);
                } else {
                    setPayments([]);
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            setPayments(data || []);

        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, clientId: string, amount: number) => {
        if (!isAdmin) return;
        if (!window.confirm('Voulez-vous vraiment supprimer ce paiement ? Le solde du client sera ajusté.')) return;

        try {
            // 1. Get current balance
            const { data: client } = await supabase.from('clients').select('balance').eq('id', clientId).single();
            const currentBalance = client?.balance || 0;

            // 2. Delete payment
            const { error: deleteError } = await supabase.from('payments').delete().eq('id', id);
            if (deleteError) throw deleteError;

            // 3. Update balance (Subtract the payment that was added)
            const { error: updateError } = await supabase
                .from('clients')
                .update({ balance: currentBalance - amount })
                .eq('id', clientId);

            if (updateError) throw updateError;

            fetchUserAndPayments();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const filteredPayments = payments.filter(p => {
        const clientName = `${p.client?.first_name} ${p.client?.last_name}`.toLowerCase();
        const techName = p.technician?.full_name?.toLowerCase() || '';
        return clientName.includes(searchTerm.toLowerCase()) || techName.includes(searchTerm.toLowerCase());
    });

    const totalAmount = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

    return (
        <PageLayout
            title="ENCAISSEMENTS"
            subtitle="GESTION DES PAIEMENTS"
            showBackButton={true}
        >
            <div className="flex flex-col gap-6">

                {/* Stats Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card-premium vibrant grad-blue p-6 flex justify-between items-center shadow-lg">
                        <div>
                            <p className="text-premium-label !text-white/60 mb-2">Total Période</p>
                            <h3 className="text-3xl font-black text-white leading-none">
                                {totalAmount.toLocaleString()} <span className="text-xs opacity-60 ml-1">DT</span>
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Wallet size={24} className="text-white" />
                        </div>
                    </div>

                    <div className="card-white p-6 flex justify-between items-center">
                        <div>
                            <p className="text-premium-label mb-2">Transactions</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                                {filteredPayments.length}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700/50">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/clients?filter=Dettes')}
                        className="card-white !bg-slate-50 dark:!bg-slate-900/50 p-6 flex justify-between items-center border-dashed hover:border-primary transition-all active:scale-95 group"
                    >
                        <div className="text-left">
                            <p className="text-premium-label !text-primary mb-2">Action Rapide</p>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase">Relancer Dettes</h3>
                        </div>
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-700">
                            <Filter size={20} />
                        </div>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par client ou technicien..."
                        className="search-input !pl-12 !h-14"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Payments List */}
                <div className="flex flex-col gap-3">
                    {filteredPayments.map((p, idx) => (
                        <div
                            key={p.id}
                            onClick={() => navigate(`/client/${p.client_id}`)}
                            className={`card-white !flex-row !items-center !gap-4 !p-5 group animate-in fade-in slide-in-from-bottom-4 stagger-${(idx % 5) + 1} cursor-pointer hover:border-primary/20 transition-all`}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-800/30">
                                <Wallet size={20} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white truncate uppercase">
                                        {p.client?.first_name} {p.client?.last_name}
                                    </h4>
                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                        +{p.amount.toFixed(0)} DT
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <User size={12} className="opacity-50" />
                                        {p.technician?.full_name}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} className="opacity-50" />
                                        {new Date(p.payment_date).toLocaleDateString()}
                                    </div>
                                    <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400">
                                        {p.method}
                                    </div>
                                </div>
                                {p.notes && p.notes !== 'Paiement direct' && (
                                    <p className="mt-2 text-[10px] text-slate-400 italic font-medium truncate">"{p.notes}"</p>
                                )}
                            </div>

                            {isAdmin && (
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(p.id, p.client_id, p.amount);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                            <ChevronRight size={18} className="text-slate-200" />
                        </div>
                    ))}

                    {filteredPayments.length === 0 && !loading && (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                            <Wallet size={48} className="opacity-20" />
                            <p className="text-xs font-black uppercase tracking-widest">Aucun paiement trouvé</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-600/30 flex items-center justify-center hover:bg-emerald-700 hover:scale-110 active:scale-95 transition-all z-30"
                aria-label="Enregistrer un paiement"
            >
                <Plus size={28} />
            </button>

            {/* Modals */}
            {isAddModalOpen && (
                <GlobalPaymentModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchUserAndPayments}
                />
            )}
        </PageLayout>
    );
};

export default Payments;
