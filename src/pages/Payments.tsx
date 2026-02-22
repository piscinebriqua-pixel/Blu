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
import RecordPaymentModal from '../components/RecordPaymentModal';
import PaymentDetailsModal from '../components/PaymentDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-hot-toast';

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
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<{ id: string, clientId: string, amount: number } | null>(null);
    const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDelete = async () => {
        if (!isAdmin || !paymentToDelete) return;

        try {
            setIsDeleting(true);
            const { id, clientId, amount } = paymentToDelete;

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

            toast.success('Paiement supprimé');
            setPaymentToDelete(null);
            fetchUserAndPayments();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
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
                    <div className="card-premium vibrant grad-blue p-6 flex justify-between items-center shadow-lg group hover:scale-[1.02] transition-all">
                        <div className="relative z-10">
                            <p className="text-premium-label !text-white/70 mb-2">Total Période</p>
                            <h3 className="text-4xl font-black text-white leading-none tracking-tighter">
                                {totalAmount.toLocaleString()} <span className="text-sm opacity-60 ml-1">DT</span>
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner group-hover:rotate-12 transition-transform">
                            <Wallet size={28} className="text-white" />
                        </div>
                        <div className="fintech-pattern !opacity-5" />
                    </div>

                    <div className="card-white !bg-emerald-50/50 dark:!bg-emerald-900/10 p-6 flex justify-between items-center border-emerald-100/50 dark:border-emerald-800/30 hover:border-emerald-500/30 transition-all group">
                        <div>
                            <p className="text-premium-label !text-emerald-700 dark:!text-emerald-400 mb-2">Transactions</p>
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">
                                {filteredPayments.length}
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-800/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50 group-hover:scale-110 transition-transform">
                            <ArrowUpRight size={28} />
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/clients?filter=Dettes')}
                        className="card-white !bg-slate-50 dark:!bg-slate-900/50 p-6 flex justify-between items-center border-dashed hover:border-primary/50 transition-all active:scale-95 group"
                    >
                        <div className="text-left">
                            <p className="text-premium-label !text-primary mb-2">Action Rapide</p>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Recouvrer Dettes</h3>
                        </div>
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all border border-slate-100 dark:border-slate-700">
                            <Filter size={20} />
                        </div>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par client ou technicien..."
                        className="search-input !pl-14 !h-16 !text-base focus:ring-4 focus:ring-primary/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Payments List */}
                <div className="flex flex-col gap-4">
                    {filteredPayments.map((p, idx) => (
                        <div
                            key={p.id}
                            onClick={() => setSelectedPayment(p)}
                            className={`card-white !flex-row !items-center !gap-5 !p-6 group animate-in fade-in slide-in-from-bottom-4 stagger-${(idx % 5) + 1} cursor-pointer hover:border-primary/30 hover:shadow-xl transition-all relative overflow-hidden`}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-800/30 group-hover:scale-110 transition-transform">
                                <Wallet size={24} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-base font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                        {p.client?.first_name} {p.client?.last_name}
                                    </h4>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                            +{p.amount.toFixed(0)} <span className="text-xs opacity-60">DT</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        <User size={14} className="text-slate-300 dark:text-slate-600" />
                                        {p.technician?.full_name}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        <Calendar size={14} className="text-slate-300 dark:text-slate-600" />
                                        {new Date(p.payment_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </div>

                                    <div className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-[0.1em] border ${p.method === 'Espèces' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' :
                                        p.method === 'Carte' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' :
                                            'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30'
                                        }`}>
                                        {p.method}
                                    </div>
                                </div>

                                {p.notes && p.notes !== 'Paiement direct' && (
                                    <div className="mt-3 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/30">
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium truncate">"{p.notes}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {isAdmin && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPaymentToDelete({ id: p.id, clientId: p.client_id, amount: p.amount });
                                        }}
                                        className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100/50 dark:border-red-800/20"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <ChevronRight size={20} className="text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}

                    {filteredPayments.length === 0 && !loading && (
                        <div className="py-24 flex flex-col items-center justify-center text-slate-300 gap-6">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Wallet size={40} className="opacity-20 translate-y-1" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Aucun résultat</p>
                                <p className="text-[11px] font-bold text-slate-300 dark:text-slate-600 mt-1">Ajustez vos filtres de recherche</p>
                            </div>
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

            {selectedPayment && (
                <PaymentDetailsModal
                    payment={selectedPayment as any}
                    onClose={() => setSelectedPayment(null)}
                    isAdmin={isAdmin}
                    onEdit={() => {
                        setPaymentToEdit(selectedPayment);
                        setSelectedPayment(null);
                    }}
                />
            )}

            {paymentToEdit && (
                <RecordPaymentModal
                    clientId={paymentToEdit.client_id}
                    payment={paymentToEdit as any}
                    onClose={() => setPaymentToEdit(null)}
                    onSuccess={() => {
                        setPaymentToEdit(null);
                        fetchUserAndPayments();
                    }}
                />
            )}

            <ConfirmModal
                isOpen={!!paymentToDelete}
                title="Supprimer Paiement"
                message="Voulez-vous vraiment supprimer ce paiement ? Le solde du client sera ajusté."
                confirmLabel="SUPPRIMER"
                onConfirm={handleDelete}
                onClose={() => setPaymentToDelete(null)}
                loading={isDeleting}
            />
        </PageLayout>
    );
};

export default Payments;
