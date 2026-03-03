import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import {
    Building2, Phone, Mail, FileText, Users, Wallet, AlertCircle, ChevronRight, History as HistoryIcon, User, Wrench
} from 'lucide-react';
import AddPartnerPaymentModal from '../components/AddPartnerPaymentModal';
import AddPartnerModal from '../components/AddPartnerModal';
import AddClientModal from '../components/AddClientModal';
import NewIntervention from '../components/NewIntervention';
import SpeedDial from '../components/SpeedDial';
import PartnerPDFPreviewModal from '../components/PartnerPDFPreviewModal';
import ConfirmModal from '../components/ConfirmModal';
import { Edit2, Share2, FileDown, Trash2 } from 'lucide-react';

interface Partner {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
    phone: string;
    email: string;
    role: string;
    is_billing_partner: boolean;
}

interface ClientIntervention {
    id: string;
    visit_date: string;
    pool_name: string;
    status: string;
    client_name: string;
    client_id: string;
    services: any[];
    products: any[];
    paid_amount?: number;
}

const PartnerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);
    const [assignedClients, setAssignedClients] = useState<any[]>([]);
    const [interventions, setInterventions] = useState<ClientIntervention[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isEditPartnerModalOpen, setIsEditPartnerModalOpen] = useState(false);
    const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
    const [isNewInterventionOpen, setIsNewInterventionOpen] = useState(false);
    const [clientToUnassign, setClientToUnassign] = useState<any | null>(null);
    const [isUnassigningClient, setIsUnassigningClient] = useState(false);
    const [interventionFilter, setInterventionFilter] = useState<'all' | 'paid' | 'unpaid'>('unpaid');

    const fetchPartnerData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Partner Details
            const { data: partnerData, error: partnerError } = await supabase
                .from('partners')
                .select('*')
                .eq('id', id)
                .single();

            if (partnerError) throw partnerError;
            if (!partnerData) {
                toast.error("Partenaire introuvable");
                navigate('/partners');
                return;
            }
            setPartner(partnerData);

            // 2. Fetch all clients assigned to this partner
            const { data: allClients, error: allClientsError } = await supabase
                .from('clients')
                .select('id, first_name, last_name, city, phone, balance')
                .or(`architect_id.eq.${id},entrepreneur_id.eq.${id},plumber_id.eq.${id},electrician_id.eq.${id},site_manager_id.eq.${id},pool_builder_id.eq.${id},billing_partner_id.eq.${id}`)
                .order('last_name');

            if (allClientsError) throw allClientsError;
            setAssignedClients(allClients || []);

            // 3. Fetch interventions (if billing partner)
            if (partnerData.is_billing_partner && allClients && allClients.length > 0) {
                const clientIds = allClients.map(c => c.id);

                // Fetch pools for these clients first
                const { data: poolData } = await supabase
                    .from('pools')
                    .select('id')
                    .in('client_id', clientIds);

                const poolIds = poolData?.map(p => p.id) || [];

                if (poolIds.length > 0) {
                    const { data: interData, error: interError } = await supabase
                        .from('interventions')
                        .select(`
                            id, visit_date, status,
                            pool:pools(name, client_id),
                            services:intervention_services(price_at_time, service:services(name)),
                            products:intervention_products(quantity, total_price, product:inventory_products(name, unit)),
                            payments:intervention_payments(amount_applied)
                        `)
                        .in('pool_id', poolIds)
                        .order('visit_date', { ascending: false });

                    if (interError) throw interError;

                    if (interData) {
                        const mappedInters = interData.map((inter: any) => {
                            const client = allClients.find(c => c.id === inter.pool?.client_id);
                            const paidAmount = inter.payments?.reduce((acc: number, p: any) => acc + (p.amount_applied || 0), 0) || 0;
                            return {
                                ...inter,
                                client_id: inter.pool?.client_id,
                                pool_name: inter.pool?.name || 'Inconnu',
                                client_name: client ? `${client.first_name} ${client.last_name}` : 'Client Inconnu',
                                paid_amount: paidAmount
                            };
                        });
                        setInterventions(mappedInters);
                    }
                }
            }

            // 4. Fetch Global Payments
            const { data: payData, error: payError } = await supabase
                .from('partner_payments')
                .select(`
                    *,
                    recipient:profiles(full_name)
                `)
                .eq('partner_id', id)
                .order('payment_date', { ascending: false });

            if (payError) throw payError;
            setPayments(payData || []);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPartnerData();
    }, [id]);

    // Calculate Finances
    const totalBilled = interventions.reduce((acc, inter) => {
        const sTotal = inter.services?.reduce((sAcc, s) => sAcc + (s.price_at_time || 0), 0) || 0;
        const pTotal = inter.products?.reduce((pAcc, p) => pAcc + (p.total_price || 0), 0) || 0;
        return acc + sTotal + pTotal;
    }, 0);

    if (loading) return <PageLayout title="Chargement..." loading={true}><div /></PageLayout>;
    if (!partner) return null;

    const totalPaid = payments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
    const balance = totalBilled - totalPaid;

    const filteredInterventions = interventions.filter(inter => {
        const sTotal = inter.services?.reduce((sAcc, s) => sAcc + (s.price_at_time || 0), 0) || 0;
        const pTotal = inter.products?.reduce((pAcc, p) => pAcc + (p.total_price || 0), 0) || 0;
        const totalBilledInter = sTotal + pTotal;
        const remaining = totalBilledInter - (inter.paid_amount || 0);

        if (interventionFilter === 'paid') return remaining <= 0.5;
        if (interventionFilter === 'unpaid') return remaining > 0.5;
        return true; // 'all'
    });

    const handleShareWhatsApp = () => {
        if (!partner) return;
        const partnerName = `${partner.first_name} ${partner.last_name}`.trim() || partner.company;
        const title = partner.is_billing_partner ? "*SUIVI DE COMPTE - UNITEC*" : "*SUIVI DES AVANCES*";

        let message = `${title}\n\n`;
        message += `👤 *Partenaire :* ${partnerName}\n`;
        if (partner.company) message += `🏢 *Société :* ${partner.company}\n`;
        message += `📅 *Date :* ${new Date().toLocaleDateString('fr-FR')}\n\n`;

        message += `💰 *SOLDE : ${Math.abs(balance).toFixed(0)} DT*\n`;
        message += `📝 _${balance > 0 ? "Somme restant due" : "Avance / Crédit disponible"}_\n\n`;

        if (partner.is_billing_partner) {
            message += `📈 Total Facturé : ${totalBilled.toFixed(0)} DT\n`;
            message += `📉 Total Encaissé : ${totalPaid.toFixed(0)} DT\n`;
        } else {
            message += `📉 Total Versé : ${totalPaid.toFixed(0)} DT\n`;
        }

        if (assignedClients.length > 0) {
            message += `\n👥 *CLIENTS AFFECTÉS :*\n`;
            assignedClients.slice(0, 10).forEach(c => {
                message += `- ${c.first_name} ${c.last_name} (${c.city || '-'})\n`;
            });
            if (assignedClients.length > 10) message += `... et ${assignedClients.length - 10} autres.\n`;
        }

        const encodedMessage = encodeURIComponent(message);
        let cleanPhone = partner.phone?.replace(/[\s\-\.]/g, '') || '';
        if (cleanPhone && !cleanPhone.startsWith('216') && !cleanPhone.startsWith('+')) {
            cleanPhone = `216${cleanPhone}`;
        }
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleUnassignClient = async () => {
        if (!partner || !id || !clientToUnassign) return;

        try {
            setIsUnassigningClient(true);
            const clientId = clientToUnassign.id;
            // We need to clear this partner's ID from any role field it might occupy in the client record
            const { error } = await supabase
                .from('clients')
                .update({
                    architect_id: null,
                    entrepreneur_id: null,
                    plumber_id: null,
                    electrician_id: null,
                    site_manager_id: null,
                    pool_builder_id: null,
                    billing_partner_id: null
                })
                .eq('id', clientId)
                // Security: only clear if the field actually matches our current partner ID
                .or(`architect_id.eq.${id},entrepreneur_id.eq.${id},plumber_id.eq.${id},electrician_id.eq.${id},site_manager_id.eq.${id},pool_builder_id.eq.${id},billing_partner_id.eq.${id}`);

            if (error) throw error;
            toast.success("Client retiré avec succès");
            setClientToUnassign(null);
            fetchPartnerData(); // Refresh list
        } catch (error: any) {
            toast.error("Erreur lors de la désassignation : " + error.message);
        } finally {
            setIsUnassigningClient(false);
        }
    };

    const speedDialActions = [
        {
            icon: Wrench,
            label: "Nouvelle Intervention",
            onClick: () => setIsNewInterventionOpen(true),
            color: "bg-orange-600 text-white"
        },
        {
            icon: Users,
            label: "Nouveau Client / Affectation",
            onClick: () => setIsAddClientModalOpen(true),
            color: "bg-emerald-600 text-white"
        },
        {
            icon: Edit2,
            label: "Modifier le profil",
            onClick: () => setIsEditPartnerModalOpen(true),
            color: "bg-slate-700 text-white"
        },
        {
            icon: Share2,
            label: "Partager WhatsApp",
            onClick: handleShareWhatsApp,
            color: "bg-emerald-500 text-white"
        },
        {
            icon: FileDown,
            label: "Exporter en PDF",
            onClick: () => setIsPDFPreviewOpen(true),
            color: "bg-red-600 text-white"
        }
    ];

    // ALWAYS add the payment action (for advances or global billing)
    speedDialActions.push({
        icon: Wallet,
        label: "Enregistrer Paiement / Avance",
        onClick: () => setShowPaymentModal(true),
        color: "bg-blue-600 text-white"
    });

    return (
        <PageLayout
            title={partner.company || `${partner.first_name} ${partner.last_name}`}
            subtitle={partner.role.toUpperCase()}
            showBackButton={true}
        >
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* ROW 1: CONTACT & CLIENT ASSIGNMENTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Contact Details */}
                    <div className="card-bento p-6">
                        <h4 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Coordonnées</h4>
                        <div className="space-y-4">
                            {partner.phone && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                                        <Phone size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Téléphone</span>
                                        <a href={`tel:${partner.phone}`} className="text-sm font-black text-slate-900 dark:text-white hover:text-blue-500 transition-colors uppercase truncate">{partner.phone}</a>
                                    </div>
                                </div>
                            )}
                            {partner.email && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                        <Mail size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Email</span>
                                        <a href={`mailto:${partner.email}`} className="text-sm font-black text-slate-900 dark:text-white hover:text-blue-500 transition-colors uppercase truncate max-w-[150px]">{partner.email}</a>
                                    </div>
                                </div>
                            )}
                            {partner.company && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                                        <Building2 size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Société</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{partner.company}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Projects */}
                    <div className="lg:col-span-2 card-bento p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Affectations Projets</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase">{assignedClients.length} dossiers actifs</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {assignedClients.length > 0 ? assignedClients.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => navigate(`/client/${client.id}`)}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 md:hover:border-primary/30 transition-all cursor-pointer shadow-sm group"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 md:group-hover:bg-primary/10 md:group-hover:text-primary transition-colors">
                                            <Users size={18} />
                                        </div>
                                        <div className="min-w-0 pr-2">
                                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase truncate md:group-hover:text-primary transition-colors">
                                                {client.first_name} {client.last_name}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{client.city || 'Ville'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setClientToUnassign(client);
                                            }}
                                            className="w-12 h-12 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/20 md:bg-transparent md:dark:bg-transparent md:hover:bg-red-50 dark:md:hover:bg-red-900/20 rounded-2xl transition-all relative z-10"
                                            title="Retirer ce client"
                                        >
                                            <Trash2 size={20} className="pointer-events-none" />
                                        </button>
                                        <ChevronRight size={16} className="text-slate-300 md:group-hover:text-primary md:group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-40">
                                    <Users size={48} className="text-slate-400 mb-4" />
                                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">Aucun client affecté</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ROW 2: FINANCES & INTERVENTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Finances */}
                    <div className="lg:col-span-1">
                        <div className="card-bento p-6 grad-blue text-white relative overflow-hidden h-full border-none shadow-xl">
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-orange-500/20 blur-2xl rounded-full translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 opacity-80">
                                        <Wallet size={18} />
                                        <h3 className="text-[11px] font-black uppercase tracking-widest">
                                            {partner.is_billing_partner ? "Balance Financière" : "Suivi des Avances"}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
                                        title="Enregistrer un paiement ou une avance"
                                    >
                                        <Wallet size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                                <div className="mb-auto">
                                    <p className="text-sm font-bold text-white/60 mb-1 uppercase tracking-tighter">
                                        {balance > 0 ? "Solde restant" : "Crédit / Avance"}
                                    </p>
                                    <h4 className={`text-4xl font-black ${balance > 0 ? 'text-white' : 'text-emerald-300'}`}>
                                        {Math.abs(balance).toFixed(0)} <span className="text-xl opacity-50">DT</span>
                                    </h4>
                                    <p className="text-[10px] font-bold text-white/50 uppercase mt-2">
                                        {partner.is_billing_partner
                                            ? `Facturé: ${totalBilled.toFixed(0)} | Encaissé: ${totalPaid.toFixed(0)}`
                                            : `Total Versé: ${totalPaid.toFixed(0)}`
                                        }
                                    </p>
                                </div>

                                {partner.is_billing_partner && (
                                    <div className="grid grid-cols-1 gap-4 border-t border-slate-700/50 pt-6 mt-6">
                                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="flex items-center gap-2 text-orange-400 mb-1">
                                                <AlertCircle size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-200">Tiers-Payant Actif</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-white/60 uppercase">
                                                {interventions.length} interventions à charge.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Interventions */}
                    <div className="lg:col-span-2 card-bento p-6 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Historique de sous-traitance</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase">{filteredInterventions.length} interventions listées</p>
                            </div>
                        </div>

                        {/* FILTER BUTTONS */}
                        <div className="flex bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-xl mb-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
                            <button
                                onClick={() => setInterventionFilter('all')}
                                className={`flex-1 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${interventionFilter === 'all'
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Toutes
                            </button>
                            <button
                                onClick={() => setInterventionFilter('unpaid')}
                                className={`flex-1 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${interventionFilter === 'unpaid'
                                        ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                À payer / Partiel
                            </button>
                            <button
                                onClick={() => setInterventionFilter('paid')}
                                className={`flex-1 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${interventionFilter === 'paid'
                                        ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Payées
                            </button>
                        </div>

                        <div className="space-y-3">
                            {filteredInterventions.length > 0 ? filteredInterventions.map(inter => {
                                const sTotal = inter.services?.reduce((sAcc, s) => sAcc + (s.price_at_time || 0), 0) || 0;
                                const pTotal = inter.products?.reduce((pAcc, p) => pAcc + (p.total_price || 0), 0) || 0;
                                const totalBilledInter = sTotal + pTotal;
                                const remaining = totalBilledInter - (inter.paid_amount || 0);

                                return (
                                    <div key={inter.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-orange-500/30 transition-all gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[11px] font-black bg-white dark:bg-slate-700 px-2 py-0.5 rounded shadow-sm text-slate-600 dark:text-slate-300">
                                                    {new Date(inter.visit_date).toLocaleDateString('fr-FR')}
                                                </span>
                                                <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-lg ${remaining <= 0.5 ? 'bg-emerald-100 text-emerald-600' : (inter.paid_amount && inter.paid_amount > 0) ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {remaining <= 0.5 ? 'Payé' : (inter.paid_amount && inter.paid_amount > 0) ? 'Partiel' : 'À payer'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white cursor-pointer hover:text-blue-500 transition-colors uppercase" onClick={() => navigate(`/client/${inter.client_id}`)}>
                                                {inter.client_name}
                                            </p>
                                            <p className="text-xs font-bold text-slate-500 uppercase">{inter.pool_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-slate-900 dark:text-white">{totalBilledInter.toFixed(0)} <span className="text-xs opacity-50">DT</span></p>
                                            {remaining > 0 && remaining < totalBilledInter && (
                                                <p className="text-[10px] font-bold text-orange-500 uppercase mt-0.5">Reste {remaining.toFixed(0)} DT</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                    <HistoryIcon size={48} className="text-slate-400 mb-4" />
                                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">Aucun historique de facturation</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ROW 3: PAYMENT HISTORY */}
                {payments.length > 0 && (
                    <div className="card-bento p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                                <HistoryIcon size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Historique des Encaissements</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase">{payments.length} versements reçus</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {payments.map(pay => (
                                <div key={pay.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded uppercase tracking-tighter">
                                            {pay.payment_method}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400">
                                            {new Date(pay.payment_date).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-3">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{pay.amount.toFixed(0)}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">DT</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 line-clamp-1">
                                            <User size={10} strokeWidth={3} />
                                            Reçu par: <span className="text-slate-900 dark:text-slate-200">{pay.recipient?.full_name || 'Admin'}</span>
                                        </p>
                                        {pay.reference && (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
                                                Ref: {pay.reference}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Multi-Action Speed Dial */}
            <SpeedDial actions={speedDialActions} />

            {showPaymentModal && (
                <AddPartnerPaymentModal
                    partnerId={partner.id}
                    partnerName={partner.company || `${partner.first_name} ${partner.last_name}`}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={fetchPartnerData}
                />
            )}

            {isPDFPreviewOpen && partner && (
                <PartnerPDFPreviewModal
                    partner={partner}
                    interventions={interventions}
                    assignedClients={assignedClients}
                    totalBilled={totalBilled}
                    totalPaid={totalPaid}
                    balance={balance}
                    onClose={() => setIsPDFPreviewOpen(false)}
                />
            )}

            {isEditPartnerModalOpen && (
                <AddPartnerModal
                    partner={partner}
                    onClose={() => setIsEditPartnerModalOpen(false)}
                    onSuccess={() => {
                        fetchPartnerData();
                        setIsEditPartnerModalOpen(false);
                    }}
                />
            )}

            {isAddClientModalOpen && (
                <AddClientModal
                    onClose={() => setIsAddClientModalOpen(false)}
                    onSuccess={() => {
                        setIsAddClientModalOpen(false);
                        fetchPartnerData();
                    }}
                />
            )}

            {isNewInterventionOpen && (
                <NewIntervention
                    onClose={() => setIsNewInterventionOpen(false)}
                    onSuccess={() => {
                        setIsNewInterventionOpen(false);
                        fetchPartnerData();
                    }}
                />
            )}
            <ConfirmModal
                isOpen={!!clientToUnassign}
                title="Retirer le client"
                message={`Voulez-vous vraiment retirer ce client de la liste de ${partner?.first_name} ${partner?.last_name} ?`}
                confirmLabel="RETIRER"
                onConfirm={handleUnassignClient}
                onClose={() => setClientToUnassign(null)}
                loading={isUnassigningClient}
                variant="danger"
            />
        </PageLayout>
    );
};

export default PartnerDetail;
