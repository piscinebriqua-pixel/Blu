import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Edit2,
    MapPin,
    Waves,
    History as HistoryIcon,
    Wallet,
    Mail,
    Phone,
    MessageCircle,
    Navigation,
    Trash2,
    AlertCircle,
    FileText,
    Copy,
    ExternalLink
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import NewIntervention from '../components/NewIntervention';
import MapPicker from '../components/MapPicker';
import AddPoolModal from '../components/AddPoolModal';
import EditClientModal from '../components/EditClientModal';
import RecordPaymentModal from '../components/RecordPaymentModal';
import EditPoolModal from '../components/EditPoolModal';
import InterventionDetailsModal from '../components/InterventionDetailsModal';
import ModalLayout from '../components/ModalLayout';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ConfirmModal';
import AddDevisModal from '../components/AddDevisModal';
import DevisDetailsModal from '../components/DevisDetailsModal';
import AssignPartnerModal from '../components/AssignPartnerModal';
import { User } from 'lucide-react';
import { formatBalance } from '../lib/formatters';

interface Pool {
    id: string;
    name: string;
    volume_m3: number;
    treatment_method: string;
    lining_type: string;
    filter_type: string;
    is_contracted: boolean;
    maintenance_frequency: string;
    preferred_day: number;
}

interface Intervention {
    id: string;
    completed_date: string | null;
    scheduled_date: string;
    created_at: string;
    notes: string;
    ph_level: number;
    chlorine_level: number;
    status: string;
    pool_name?: string;
    services?: {
        price_at_time: number;
        service: { name: string; }
    }[];
    products?: {
        quantity: number;
        total_price: number;
        product: { name: string; unit: string; }
    }[];
    paid_amount?: number; // Added paid amount from distribution
}

interface Devis { // Added Devis interface
    id: string;
    number: string;
    title: string;
    total_amount: number;
    status: 'pending' | 'closed' | 'cancelled';
    created_at: string;
    pdf_url?: string;
}

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    phone2?: string;
    email: string;
    address: string;
    city: string;
    balance: number;
    notes: string;
    gps_lat: number | null;
    gps_lng: number | null;
    architect_id?: string;
    entrepreneur_id?: string;
    plumber_id?: string;
    electrician_id?: string;
    pool_builder_id?: string;
    site_manager_id?: string;
    billing_partner_id?: string;
}

const ClientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [pools, setPools] = useState<Pool[]>([]);
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [devis, setDevis] = useState<Devis[]>([]); // Added devis state
    const [loading, setLoading] = useState(true);

    const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
    const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditPoolModalOpen, setIsEditPoolModalOpen] = useState(false);
    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [paymentToEdit, setPaymentToEdit] = useState<any | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'pools' | 'interventions' | 'payments' | 'balance' | 'gps' | 'devis' | null>(null); // Updated activeCategory type
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
    const [poolToDelete, setPoolToDelete] = useState<Pool | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingPool, setIsDeletingPool] = useState(false);
    const [isDeletingClient, setIsDeletingClient] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDevisModalOpen, setIsDevisModalOpen] = useState(false); // Added isDevisModalOpen state
    const [editingDevisId, setEditingDevisId] = useState<string | null>(null);
    const [editingInterventionId, setEditingInterventionId] = useState<string | null>(null);
    const [startMode, setStartMode] = useState(false);
    const [interventionToDelete, setInterventionToDelete] = useState<string | null>(null);
    const [partnerToUnassign, setPartnerToUnassign] = useState<any | null>(null);
    const [isUnassigningPartner, setIsUnassigningPartner] = useState(false);
    const [devisToDelete, setDevisToDelete] = useState<Devis | null>(null);
    const [isDeletingDevis, setIsDeletingDevis] = useState(false);
    const [selectedInterventionForView, setSelectedInterventionForView] = useState<any>(null);
    const [selectedDevisForView, setSelectedDevisForView] = useState<any>(null);
    const [isAssignPartnerOpen, setIsAssignPartnerOpen] = useState(false);
    const [clientPartners, setClientPartners] = useState<any[]>([]);
    const [isSolderModalOpen, setIsSolderModalOpen] = useState(false);
    const [isSoldering, setIsSoldering] = useState(false);
    const [interventionFilter, setInterventionFilter] = useState<'all' | 'paid' | 'unpaid'>('unpaid');

    const totalIntersAmount = interventions.reduce((acc, inter) => {
        if (inter.status !== 'completed') return acc;
        const sTotal = inter.services?.reduce((sAcc: number, s: any) => sAcc + (s.price_at_time || 0), 0) || 0;
        const pTotal = inter.products?.reduce((pAcc: number, p: any) => pAcc + (p.total_price || 0), 0) || 0;
        return acc + sTotal + pTotal;
    }, 0);

    const filteredInterventions = interventions.filter(inter => {
        const sTotal = inter.services?.reduce((sAcc: number, s: any) => sAcc + (s.price_at_time || 0), 0) || 0;
        const pTotal = inter.products?.reduce((pAcc: number, p: any) => pAcc + (p.total_price || 0), 0) || 0;
        const totalBilledInter = sTotal + pTotal;
        const remaining = totalBilledInter - (inter.paid_amount || 0);

        if (interventionFilter === 'paid') return remaining <= 0.5;
        if (interventionFilter === 'unpaid') return remaining > 0.5;
        return true; // 'all'
    });

    const totalPaymentsAmount = payments.reduce((acc, pay) => acc + pay.amount, 0);

    const handleDeletePool = async () => {
        if (!poolToDelete) return;
        setIsDeletingPool(true);
        try {
            const { error } = await supabase.from('pools').delete().eq('id', poolToDelete.id);
            if (error) throw error;
            toast.success(`Piscine "${poolToDelete.name}" supprimée`);
            setPoolToDelete(null);
            fetchClientData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeletingPool(false);
        }
    };

    const handleDeleteDevis = async () => {
        if (!devisToDelete) return;
        setIsDeletingDevis(true);
        try {
            await supabase.from('devis_items').delete().eq('devis_id', devisToDelete.id);
            const { error } = await supabase.from('devis').delete().eq('id', devisToDelete.id);
            if (error) throw error;
            toast.success(`Devis ${devisToDelete.number} supprimé`);
            setDevisToDelete(null);
            fetchClientData();
        } catch (error: any) {
            console.error(error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setIsDeletingDevis(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchClientData();
        }
    }, [id, navigate]);

    const handleDuplicateDevis = async (originalDevis: Devis) => {
        try {
            setLoading(true);
            const { data: items } = await supabase.from('devis_items').select('*').eq('devis_id', originalDevis.id);

            const newDevisNumber = `${originalDevis.number}-COPY`;
            const { data: newDevis, error: dError } = await supabase
                .from('devis')
                .insert([{
                    client_id: id,
                    number: newDevisNumber,
                    title: `${originalDevis.title} (Copie)`,
                    total_amount: originalDevis.total_amount,
                    status: 'pending'
                }])
                .select()
                .single();

            if (dError) throw dError;

            if (items && items.length > 0) {
                const itemsToInsert = items.map(item => ({
                    devis_id: newDevis.id,
                    designation: item.designation,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }));
                await supabase.from('devis_items').insert(itemsToInsert);
            }

            toast.success('Devis dupliqué avec succès');
            fetchClientData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-sync balance to database if there's a discrepancy
    useEffect(() => {
        const syncBalance = async () => {
            if (!client || loading) return;
            const calculatedBalance = totalPaymentsAmount - totalIntersAmount;
            if (Math.abs(client.balance - calculatedBalance) > 0.1) {
                console.log(`Syncing balance for client ${client.id}: ${client.balance} -> ${calculatedBalance}`);
                const { error } = await supabase
                    .from('clients')
                    .update({ balance: calculatedBalance })
                    .eq('id', client.id);

                if (!error) {
                    setClient(prev => prev ? { ...prev, balance: calculatedBalance } : null);
                }
            }
        };
        syncBalance();
    }, [client, totalPaymentsAmount, totalIntersAmount, loading]);

    const fetchClientData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profiles } = await supabase.from('profiles').select('role').eq('id', session.user.id);
                setIsAdmin(profiles?.[0]?.role === 'admin');
            }

            const { data: clients, error: clientError } = await supabase.from('clients').select('*').eq('id', id);
            if (clientError) throw clientError;

            const clientData = clients?.[0];
            if (!clientData) {
                toast.error('Client introuvable');
                navigate('/clients');
                return;
            }
            setClient(clientData);

            try {
                const partnerIds = [
                    clientData.architect_id,
                    clientData.entrepreneur_id,
                    clientData.plumber_id,
                    clientData.electrician_id,
                    clientData.pool_builder_id,
                    clientData.site_manager_id,
                    clientData.billing_partner_id
                ].filter(Boolean);

                if (partnerIds.length > 0) {
                    const { data: partnersData } = await supabase.from('partners').select('*').in('id', partnerIds);
                    if (partnersData) setClientPartners(partnersData);
                } else {
                    setClientPartners([]);
                }
            } catch (e) { /* ignore error if table does not exist */ }

            const { data: poolData } = await supabase.from('pools').select('*').eq('client_id', id);
            setPools(poolData || []);

            const { data: interData } = await supabase
                .from('interventions')
                .select(`
                    *,
                    technician:technicians!technician_id(full_name),
                    pool:pools!pool_id(
                        name, 
                        client:clients!client_id(id, first_name, last_name, balance, phone)
                    ), 
                    services:intervention_services(
                        price_at_time,
                        service:services(name)
                    ),
                    products:intervention_products(
                        quantity,
                        total_price,
                        product:inventory_products(name, unit)
                    )
                `)
                .in('pool_id', poolData?.map(p => p.id) || [])
                .order('created_at', { ascending: false });

            // Fetch distributions (intervention payments)
            const { data: distributions } = await supabase
                .from('intervention_payments')
                .select('intervention_id, amount_applied')
                .in('intervention_id', interData?.map(i => i.id) || []);

            const formattedInters = interData?.map((i: any) => {
                const appliedPayments = distributions?.filter(d => d.intervention_id === i.id) || [];
                const totalPaid = appliedPayments.reduce((acc, d) => acc + Number(d.amount_applied), 0);

                return {
                    ...i,
                    pool_name: i.pool?.name,
                    paid_amount: totalPaid
                };
            }) || [];
            setInterventions(formattedInters);

            const { data: payData } = await supabase
                .from('payments')
                .select('*, technician:technicians(full_name)')
                .eq('client_id', id)
                .order('payment_date', { ascending: false });
            setPayments(payData || []);

            const { data: devisData } = await supabase // Fetch devis data
                .from('devis')
                .select('*')
                .eq('client_id', id)
                .order('created_at', { ascending: false });
            setDevis(devisData || []);

        } catch (error) {
            console.error('Erreur:', error);
            navigate('/clients');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (devisId: string, status: 'pending' | 'closed' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('devis')
                .update({ status })
                .eq('id', devisId);

            if (error) throw error;

            if (selectedDevisForView?.id === devisId) {
                setSelectedDevisForView({ ...selectedDevisForView, status });
            }

            fetchClientData();
            toast.success('Statut mis à jour');
        } catch (error) {
            console.error('Erreur status:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleDeletePayment = async () => {
        if (!isAdmin || !paymentToDelete) return;

        try {
            setIsDeleting(true);
            const { error } = await supabase.from('payments').delete().eq('id', paymentToDelete);
            if (error) throw error;

            toast.success('Paiement supprimé');
            setPaymentToDelete(null);
            fetchClientData();
        } catch (error: any) {
            toast.error('Erreur lors de la suppression : ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!isAdmin || !client) return;

        if (interventions.length > 0 || payments.length > 0 || pools.length > 0) {
            toast.error('Impossible de supprimer ce client : il possède un historique (piscines, interventions ou paiements).');
            setShowDeleteConfirm(false);
            return;
        }

        try {
            setIsDeletingClient(true);

            // Note: Cascade deletes should be handled by DB. 
            // If not, we'd need to delete payments, then interventions, then pools.
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', client.id);

            if (error) throw error;

            toast.success('Client supprimé avec succès');
            navigate('/clients', { replace: true });
        } catch (error: any) {
            toast.error('Erreur lors de la suppression du client: ' + error.message);
        } finally {
            setIsDeletingClient(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteIntervention = async () => {
        if (!interventionToDelete) return;

        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('interventions')
                .delete()
                .eq('id', interventionToDelete);

            if (error) throw error;

            toast.success('Intervention supprimée');
            setInterventionToDelete(null);
            fetchClientData();
        } catch (error: any) {
            toast.error('Erreur lors de la suppression : ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const openWhatsApp = () => {
        if (client?.phone) {
            let formattedPhone = client.phone.replace(/\s/g, '').replace('+', '');
            if (formattedPhone.length === 8 && !formattedPhone.startsWith('216')) {
                formattedPhone = '216' + formattedPhone;
            }

            const balance = totalPaymentsAmount - totalIntersAmount;
            let message = `Bonjour ${client.first_name},\n\n`;

            if (balance < -0.5) {
                message += `Voici le point sur votre compte. Votre solde (Credit) est de *${Math.abs(balance).toFixed(0)} DT*.\n\n`;
            } else {
                message += `Nous vous contactons pour vous informer que votre compte est actuellement à jour (Solde : 0 DT). Merci de votre confiance !\n`;
                window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                return;
            }

            const unpaidInters = interventions.filter(inter => {
                const sTotal = inter.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
                const pTotal = inter.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
                const totalBilled = sTotal + pTotal;
                return (totalBilled - (inter.paid_amount || 0)) > 0.5; // Avoid float precision issues
            });

            if (unpaidInters.length > 0) {
                message += `*Détails des interventions en attente :*\n`;
                unpaidInters.forEach(inter => {
                    const sTotal = inter.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
                    const pTotal = inter.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
                    const totalBilled = sTotal + pTotal;
                    const remaining = totalBilled - (inter.paid_amount || 0);
                    const date = new Date(inter.completed_date || inter.scheduled_date || inter.created_at).toLocaleDateString('fr-FR');
                    const paidAmount = inter.paid_amount || 0;
                    if (paidAmount > 0) {
                        message += `• ${date} (${inter.pool_name}) :\n  Total: ${totalBilled.toFixed(0)} DT | Payé: ${paidAmount.toFixed(0)} DT | Reste: *${remaining.toFixed(0)} DT*`;
                    } else {
                        message += `• ${date} (${inter.pool_name}) : *${remaining.toFixed(0)} DT*`;
                    }
                    message += '\n';
                });
            }

            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
        }
    };


    const handleUnassignPartner = async () => {
        if (!client || !partnerToUnassign) return;

        try {
            setIsUnassigningPartner(true);
            const partnerId = partnerToUnassign.id;
            const updateData: any = {};
            if (client.architect_id === partnerId) updateData.architect_id = null;
            if (client.entrepreneur_id === partnerId) updateData.entrepreneur_id = null;
            if (client.plumber_id === partnerId) updateData.plumber_id = null;
            if (client.electrician_id === partnerId) updateData.electrician_id = null;
            if (client.pool_builder_id === partnerId) updateData.pool_builder_id = null;
            if (client.site_manager_id === partnerId) updateData.site_manager_id = null;
            if (client.billing_partner_id === partnerId) updateData.billing_partner_id = null;

            const { error } = await supabase
                .from('clients')
                .update(updateData)
                .eq('id', client.id);

            if (error) throw error;
            toast.success("Partenaire retiré avec succès");
            setPartnerToUnassign(null);
            fetchClientData();
        } catch (error: any) {
            toast.error("Erreur lors du retrait : " + error.message);
        } finally {
            setIsUnassigningPartner(false);
        }
    };

    const openGPS = () => {
        if (client?.gps_lat && client?.gps_lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${client.gps_lat},${client.gps_lng}`, '_blank');
        } else if (client?.address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address + ' ' + (client.city || ''))}`, '_blank');
        }
    };

    if (!client && !loading) {
        return (
            <PageLayout title="Client introuvable" showBackButton={true}>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} className="text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-white">Ce client n'existe plus</h3>
                    <p className="text-slate-500 dark:text-slate-500 max-w-xs mx-auto mt-2">
                        Le dossier a peut-être été supprimé ou l'identifiant est incorrect.
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/clients', { replace: true })}
                        className="mt-6"
                    >
                        RETOUR À LA LISTE
                    </Button>
                </div>
            </PageLayout>
        );
    }

    const handleSolder = () => {
        if (!client) return;
        setIsSolderModalOpen(true);
    };

    const confirmSolder = async () => {
        if (!client) return;
        setIsSoldering(true);
        const missingAmount = Math.abs(totalPaymentsAmount - totalIntersAmount);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: profile } = await supabase.from('profiles').select('technician_id').eq('id', session.user.id).single();

            const { error } = await supabase.from('payments').insert([{
                client_id: client.id,
                technician_id: profile?.technician_id || null, // Best effort
                amount: missingAmount,
                method: 'remise',
                notes: 'Solde de compte automatique (Remise/Perte)',
                payment_date: new Date().toISOString().split('T')[0]
            }]);

            if (error) throw error;

            const { error: balanceUpdateError } = await supabase
                .from('clients')
                .update({ balance: 0 })
                .eq('id', client.id);
            if (balanceUpdateError) throw balanceUpdateError;

            toast.success('Compte soldé avec succès');
            setIsSolderModalOpen(false);
            fetchClientData();
        } catch (e: any) {
            toast.error('Erreur lors du solde: ' + e.message);
        } finally {
            setIsSoldering(false);
        }
    };

    const toolbar = (
        <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2">
                <button onClick={openWhatsApp} className="btn-icon !bg-[#25D366] !text-white !border-none !w-10 !h-10 shadow-lg shadow-green-500/20" title="WhatsApp">
                    <MessageCircle size={18} />
                </button>
                <button onClick={openGPS} className="btn-icon !bg-orange-500 !text-white !border-none !w-10 !h-10 shadow-lg shadow-orange-500/20" title="Navigation">
                    <Navigation size={18} />
                </button>
                <button 
                    onClick={() => {
                        const url = `${window.location.origin}/mon-espace/login`;
                        const text = `Bonjour ${client?.first_name},\nVoici le lien pour accéder à votre espace client BCCP : ${url}\nConnectez-vous avec votre numéro : ${client?.phone}`;
                        navigator.clipboard.writeText(text);
                        toast.success('Lien et accès copiés !');
                    }}
                    className="btn-icon !bg-indigo-600 !text-white !border-none !w-10 !h-10 shadow-lg shadow-indigo-500/20" 
                    title="Partager l'accès client"
                >
                    <ExternalLink size={18} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                {isAdmin && (totalPaymentsAmount - totalIntersAmount) < -0.1 && (
                    <button onClick={handleSolder} className="flex items-center justify-center gap-2 px-3 h-10 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors" title="Solder (Remise)">
                        <Wallet size={16} className="animate-pulse" />
                        <span className="text-[12px] font-black uppercase">Solder</span>
                    </button>
                )}
                <button onClick={() => setIsEditClientModalOpen(true)} className="btn-icon !bg-blue-600 !text-white !border-none !w-10 !h-10 shadow-lg shadow-blue-500/20" title="Modifier Profil">
                    <Edit2 size={18} />
                </button>
                {isAdmin && (
                    <button onClick={() => setShowDeleteConfirm(true)} className="btn-icon !bg-red-500 !text-white !border-none !w-10 !h-10 shadow-lg shadow-red-500/20" title="Supprimer Client">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <PageLayout
            title={client?.first_name || ''}
            subtitle={client?.last_name || ''}
            showBackButton={true}
            toolbar={toolbar}
            loading={loading}
        >
            {/* 0. Financial Fintech Tile (Header) */}
            <div
                onClick={() => setActiveCategory('balance')}
                className={`card-bento cursor-pointer relative overflow-hidden transition-all duration-500 min-h-[100px] mb-4 flex flex-row items-center justify-between px-6 py-4 ${(totalPaymentsAmount - totalIntersAmount) < 0 ? 'border-none shadow-2xl fintech-card-red-luxe' : 'border-none shadow-xl fintech-card-money-luxe'}`}
            >
                <div className="relative z-10 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet size={16} className="text-white/60" />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">État Financier</p>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white/80">
                        {client ? formatBalance(client.balance).label : 'Solde'} sur compte
                    </p>
                </div>

                <div className="relative z-10 text-right">
                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-white">
                        {client ? formatBalance(client.balance).amount : '0'}
                        <span className="text-lg md:text-xl font-black ml-1 uppercase text-white/60">{client ? formatBalance(client.balance).unit : 'DT'}</span>
                    </h3>
                </div>

                {/* Decorative Grid Lines like a Fintech app */}
                <div className="fintech-pattern" />
            </div>

            <div className="bento-grid-2">
                {/* LEFT COLUMN: CONTACT & LOCATION */}
                <div className="flex flex-col gap-4">
                    {/* 1. Contact Details Tile */}
                    <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6">
                        <h4 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Coordonnées</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase">Téléphone Principal</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{client?.phone}</span>
                                </div>
                            </div>

                            {client?.phone2 && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <Phone size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase">Téléphone Secondaire</span>
                                        <span className="text-lg font-black text-slate-900 dark:text-white">{client?.phone2}</span>
                                    </div>
                                </div>
                            )}

                            {client?.email && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Mail size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase">Email</span>
                                        <span className="text-lg font-black text-slate-900 dark:text-white">{client?.email}</span>
                                    </div>
                                </div>
                            )}

                            {client?.city && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase">Localisation</span>
                                        <span className="text-lg font-black text-slate-900 dark:text-white">{client?.city}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Technical Summary Tile */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setActiveCategory('pools')}
                            className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 hover:bg-white/80 transition-all p-5 flex flex-col items-center text-center justify-center group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Waves size={28} />
                            </div>
                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Bassins</span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{pools.length}</span>
                        </button>

                        <button
                            onClick={() => setActiveCategory('interventions')}
                            className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 hover:bg-white/80 transition-all p-5 flex flex-col items-center text-center justify-center group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <HistoryIcon size={28} />
                            </div>
                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Suivi</span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{interventions.length}</span>
                        </button>
                    </div>


                    {/* 2.5 Équipe du Chantier Tile */}
                    <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Équipe du Projet</h4>
                            <button onClick={() => setIsAssignPartnerOpen(true)} className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all" title="Assigner un intervenant">
                                <Plus size={16} />
                            </button>
                        </div>
                        {clientPartners.length > 0 ? (
                            <div className="space-y-4 pt-2">
                                {clientPartners.map(p => (
                                    <div key={p.id} className="flex items-center gap-4 group relative z-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 md:group-hover:scale-110 transition-transform">
                                            <User size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                                                {p.first_name} {p.last_name}
                                                {p.company && <span className="text-xs font-bold text-slate-400 ml-1 block mt-0.5">{p.company}</span>}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest py-0.5 px-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                                    {p.id === client?.billing_partner_id ? 'TIERS-PAYANT' : p.role}
                                                </span>
                                                {p.id === client?.billing_partner_id && (
                                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest py-0.5 px-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                                                        CAISSE
                                                    </span>
                                                )}
                                                {p.phone && <span className="text-[11px] text-slate-400 font-bold md:hover:text-blue-500 cursor-pointer w-max" onClick={() => window.open(`tel:${p.phone}`)}>{p.phone}</span>}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setPartnerToUnassign(p);
                                            }}
                                            className="w-12 h-12 shrink-0 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 md:bg-transparent md:dark:bg-transparent md:hover:bg-red-50 dark:md:hover:bg-red-900/20 transition-all flex items-center justify-center relative z-10"
                                            title="Retirer du projet"
                                        >
                                            <Trash2 size={18} className="pointer-events-none" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 opacity-40 text-center">
                                <User size={24} className="mb-2 text-slate-400" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Aucun intervenant</p>
                            </div>
                        )}
                    </div>

                    {/* 2. Payment List Tile (Timeline Style) */}
                    <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6 flex-1 cursor-pointer group" onClick={() => setActiveCategory('payments')}>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Historique Financier</h4>
                            <Wallet size={16} className="text-slate-500" />
                        </div>

                        {payments.length > 0 ? (
                            <div className="space-y-4">
                                {payments.slice(0, 3).map((pay) => (
                                    <div key={pay.id} className="flex items-center gap-4">
                                        <div className="w-1.5 h-10 rounded-full bg-emerald-500/30 flex-shrink-0 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full bg-emerald-500 h-3" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Encaissement {pay.method}</h5>
                                                <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">+{pay.amount.toFixed(0)} DT</span>
                                            </div>
                                            <p className="text-[13px] font-black text-slate-500 uppercase">{new Date(pay.payment_date).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                                    <span className="text-[13px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest group-hover:underline">Consulter tout l'historique</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 opacity-30">
                                <Wallet size={24} />
                                <p className="text-[13px] font-black uppercase tracking-widest">Aucun paiement</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: FINANCE & STATUS */}
                <div className="flex flex-col gap-4">
                    {/* 5. Quick Actions Tile */}
                    <div className="card-bento bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 flex-1 min-h-[140px]">
                        <h4 className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-4">Actions de Gestion</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setIsInterventionModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-blue-500 transition-all group">
                                <Plus size={16} className="text-blue-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[13px] font-black text-slate-600 dark:text-slate-300 uppercase">Intervention</span>
                            </button>
                            <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-emerald-500 transition-all group">
                                <Wallet size={16} className="text-emerald-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[13px] font-black text-slate-600 dark:text-slate-300 uppercase">Versement</span>
                            </button>
                            <button onClick={() => setIsDevisModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-blue-500 transition-all group">
                                <FileText size={16} className="text-blue-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[13px] font-black text-slate-600 dark:text-slate-300 uppercase">Nouveau Devis</span>
                            </button>
                            <button onClick={() => setIsPoolModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-indigo-500 transition-all group">
                                <Plus size={16} className="text-indigo-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[13px] font-black text-slate-600 dark:text-slate-300 uppercase">Info Bassin</span>
                            </button>
                            <button onClick={() => setIsEditClientModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-slate-900 transition-all group lg:col-span-2">
                                <Edit2 size={16} className="text-slate-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[13px] font-black text-slate-600 dark:text-slate-300 uppercase">Editer Profil</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Bottom Timeline Tiles */}
            <div className={`mt-4 grid gap-4 ${devis.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* 6A. Activity Timeline Tile */}
                <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6 min-h-[200px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Dernière Activité</h4>
                        <HistoryIcon size={16} className="text-slate-500" />
                    </div>

                    <div className="flex-1">
                        {interventions.length > 0 ? (
                            <div className="space-y-4">
                                {interventions.slice(0, 3).map((inter) => (
                                    <div key={inter.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => setSelectedInterventionForView(inter)}>
                                        <div className="w-1.5 h-12 rounded-full bg-blue-500/30 flex-shrink-0 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full bg-blue-500 transition-all duration-500 group-hover:h-full h-3" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Rapport de Maintenance</h5>
                                                <span className="text-[13px] font-black text-slate-500">{new Date(inter.created_at).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-500 font-black uppercase mt-1">Bassin: {inter.pool_name} • {inter.status || 'Terminé'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[100px] opacity-30">
                                <HistoryIcon size={28} className="mb-2" />
                                <p className="text-[13px] font-black uppercase tracking-widest">Aucune activité enregistrée</p>
                            </div>
                        )}
                    </div>

                    <button onClick={() => setActiveCategory('interventions')} className="w-full mt-6 py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-[13px] font-black text-slate-500 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase tracking-widest mt-auto">
                        Consulter l'historique complet
                    </button>
                </div>

                {/* 6B. Devis Timeline Tile */}
                {devis.length > 0 && (
                    <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6 min-h-[200px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Derniers Devis</h4>
                            <FileText size={16} className="text-slate-500" />
                        </div>

                        <div className="flex-1">
                            <div className="space-y-4">
                                {devis.slice(0, 3).map((d) => (
                                    <div key={d.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => setSelectedDevisForView(d)}>
                                        <div className={`w-1.5 h-12 rounded-full flex-shrink-0 relative overflow-hidden ${d.status === 'closed' ? 'bg-emerald-500/30' : d.status === 'cancelled' ? 'bg-rose-500/30' : 'bg-blue-500/30'}`}>
                                            <div className={`absolute top-0 left-0 w-full transition-all duration-500 group-hover:h-full h-3 ${d.status === 'closed' ? 'bg-emerald-500' : d.status === 'cancelled' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{d.title || 'Devis'}</h5>
                                                <span className="text-[13px] font-black text-slate-500">{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-slate-600 dark:text-slate-500 font-black uppercase">
                                                    #{d.number} • {d.status === 'closed' ? 'Clôturé' : d.status === 'cancelled' ? 'Annulé' : 'En cours'}
                                                </p>
                                                <span className="text-[13px] font-black text-slate-800 dark:text-white">{(d.total_amount || 0).toFixed(0)} DT</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => setActiveCategory('devis')} className="w-full mt-6 py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-[13px] font-black text-slate-500 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase tracking-widest mt-auto">
                            Voir tous les devis
                        </button>
                    </div>
                )}
            </div>

            {/* Categorized Details Modal */}
            {
                activeCategory && (
                    <ModalLayout
                        title={
                            activeCategory === 'pools' ? 'Parc Aquatique' :
                                activeCategory === 'interventions' ? 'Historique des Entretiens' :
                                    activeCategory === 'payments' ? 'Historique des Paiements' :
                                        activeCategory === 'devis' ? 'Chantiers & Devis' : // Updated title for devis
                                            activeCategory === 'balance' ? 'Détails du Solde' : 'Localisation GPS'
                        }
                        onClose={() => setActiveCategory(null)}
                        className="max-w-4xl"
                        actions={
                            <div className="flex gap-3 w-full justify-end">
                                {activeCategory === 'pools' && (
                                    <Button onClick={() => setIsPoolModalOpen(true)} className="btn-primary">
                                        <Plus size={18} className="mr-2" /> AJOUTER UN BASSIN
                                    </Button>
                                )}
                                {activeCategory === 'interventions' && (
                                    <Button
                                        onClick={() => {
                                            if (pools.length === 1) setSelectedPoolId(pools[0].id);
                                            else setSelectedPoolId(null);
                                            setIsInterventionModalOpen(true);
                                        }}
                                        className="btn-primary"
                                    >
                                        <Plus size={18} className="mr-2" /> NOUVELLE VISITE
                                    </Button>
                                )}
                                {(activeCategory === 'payments' || activeCategory === 'balance') && (
                                    <Button onClick={() => setIsPaymentModalOpen(true)} className="btn-primary">
                                        <Wallet size={18} className="mr-2" /> ENCAISSER
                                    </Button>
                                )}
                                {activeCategory === 'devis' && ( // Added button for devis
                                    <Button onClick={() => setIsDevisModalOpen(true)} className="btn-primary">
                                        <Plus size={18} className="mr-2" /> CRÉER UN DEVIS
                                    </Button>
                                )}
                                <Button onClick={() => setActiveCategory(null)} variant="secondary">FERMER</Button>
                            </div>
                        }
                    >
                        <div className="p-2">
                            {activeCategory === 'balance' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Interventions</p>
                                            <h4 className="text-2xl font-black text-slate-800 dark:text-white">-{totalIntersAmount.toFixed(0)} <span className="text-xs opacity-60">DT</span></h4>
                                        </div>
                                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
                                            <p className="text-[13px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Paiements</p>
                                            <h4 className="text-2xl font-black text-emerald-600">+{totalPaymentsAmount.toFixed(0)} <span className="text-xs opacity-60 text-emerald-400">DT</span></h4>
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/20 text-center">
                                        <p className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Solde Final</p>
                                        <h3 className="text-5xl font-black tracking-tighter">
                                            {client ? (
                                                <span className={formatBalance(client.balance).text}>{formatBalance(client.balance).amount} <span className="text-lg opacity-40 ml-2">{formatBalance(client.balance).unit}</span> {formatBalance(client.balance).label}</span>
                                            ) : (
                                                <span className="text-slate-400">0 DT</span>
                                            )}
                                        </h3>
                                    </div>
                                </div>
                            )}
                            {activeCategory === 'pools' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pools.map((pool) => (
                                        <div key={pool.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-blue-500/30 transition-all">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                    <Waves size={20} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setSelectedPoolId(pool.id); setIsInterventionModalOpen(true); }}
                                                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[13px] font-black uppercase tracking-wider hover:bg-blue-600 transition-colors"
                                                    >
                                                        Nouveau Rapport
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedPool(pool); setIsEditPoolModalOpen(true); }}
                                                        className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 text-slate-500 flex items-center justify-center hover:text-blue-600 border border-slate-100 dark:border-slate-600 shadow-sm transition-all"
                                                        title="Modifier"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => setPoolToDelete(pool)}
                                                            className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center hover:text-red-600 hover:bg-red-100 border border-red-100 dark:border-red-800/30 shadow-sm transition-all"
                                                            title="Supprimer la piscine"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <h4 className="text-base font-black text-slate-800 dark:text-white mb-1">{pool.name}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">{pool.volume_m3} m³</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[13px] font-bold text-blue-500 uppercase tracking-widest">{pool.treatment_method}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsPoolModalOpen(true)}
                                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Plus size={24} className="text-slate-500 group-hover:text-blue-500" />
                                        </div>
                                        <span className="text-[13px] font-black text-slate-500 group-hover:text-blue-500 uppercase tracking-widest">Ajouter un bassin</span>
                                    </button>
                                </div>
                            )}

                            {activeCategory === 'interventions' && (
                                <div className="space-y-6">
                                    {/* Summary Header in Modal */}
                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center">
                                                <HistoryIcon size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-black text-indigo-500 uppercase tracking-widest">Cumul des Travaux</p>
                                                <h4 className="text-2xl font-black text-slate-800 dark:text-white">{totalIntersAmount.toFixed(0)} <span className="text-xs opacity-60">DT</span></h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Fréquence</p>
                                            <h4 className="text-2xl font-black text-slate-800 dark:text-white">{filteredInterventions.length} <span className="text-xs opacity-60">Visites</span></h4>
                                        </div>
                                    </div>

                                    {/* FILTER BUTTONS */}
                                    <div className="flex bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-xl overflow-x-auto whitespace-nowrap hide-scrollbar">
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

                                    {filteredInterventions.length > 0 ? (
                                        <div className="relative before:absolute before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                            {filteredInterventions.map((inter) => (
                                                <div
                                                    key={inter.id}
                                                    onClick={() => setSelectedInterventionForView(inter)}
                                                    className="relative pl-14 mb-4 group cursor-pointer"
                                                >
                                                    <div className="absolute left-[22px] top-6 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-[3.5px] border-slate-200 dark:border-slate-700 group-hover:border-indigo-500 group-hover:scale-125 transition-all z-10" />
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-transparent hover:border-indigo-500/20 transition-all">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                    {new Date(inter.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </span>
                                                                <p className="text-base text-slate-500 font-bold uppercase mt-1">Bassin: {inter.pool_name}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                {/* Status Badge */}
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                                                                    inter.status === 'completed' 
                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                                    : 'bg-white dark:bg-slate-700 text-blue-500 border-blue-200 dark:border-blue-700'
                                                                }`}>
                                                                    {inter.status === 'completed' ? 'Réalisée' : 'Planifiée'}
                                                                </span>

                                                                <span className={`text-[11px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${(() => {
                                                                    const sTotal = inter.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
                                                                    const pTotal = inter.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
                                                                    const totalBilled = sTotal + pTotal;
                                                                    const remaining = totalBilled - (inter.paid_amount || 0);

                                                                    if (remaining <= 0.5) return 'bg-emerald-500/10 text-emerald-500';
                                                                    if (inter.paid_amount && inter.paid_amount > 0) return 'bg-orange-500/10 text-orange-500';
                                                                    return 'bg-rose-500/10 text-rose-500';
                                                                })()
                                                                    }`}>
                                                                    {(() => {
                                                                        const sTotal = inter.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
                                                                        const pTotal = inter.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
                                                                        const totalBilled = sTotal + pTotal;
                                                                        const remaining = totalBilled - (inter.paid_amount || 0);

                                                                        if (remaining <= 0.5) return 'Payé';
                                                                        if (inter.paid_amount && inter.paid_amount > 0) return 'Partiel';
                                                                        return 'À payer';
                                                                    })()}
                                                                </span>
                                                                {(() => {
                                                                    const sTotal = inter.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
                                                                    const pTotal = inter.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
                                                                    const totalBilled = sTotal + pTotal;
                                                                    const remaining = totalBilled - (inter.paid_amount || 0);
                                                                    if (remaining > 0.5) {
                                                                        return <span className="text-[12px] font-black text-rose-500">{remaining.toFixed(0)} DT restants</span>;
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-700">
                                                            {inter.ph_level && <span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest italic">PH: <strong className="text-slate-900 dark:text-white ml-1">{inter.ph_level}</strong></span>}
                                                            {inter.chlorine_level && <span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest italic">Chlore: <strong className="text-slate-900 dark:text-white ml-1">{inter.chlorine_level}</strong></span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem]">
                                            <HistoryIcon size={48} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-base font-bold text-slate-500 uppercase tracking-widest">Aucun historique technique</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeCategory === 'payments' && (
                                <div className="space-y-4">
                                    {payments.length > 0 ? (
                                        <div className="grid gap-3">
                                            {payments.map(pay => (
                                                <div key={pay.id} className="flex justify-between items-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-emerald-500/30 transition-all">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                                            <Wallet size={24} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xl font-black text-emerald-600">+{pay.amount.toFixed(0)} <span className="text-xs opacity-70">DT</span></p>
                                                            <p className="text-base text-slate-500 font-black uppercase tracking-widest">
                                                                {new Date(pay.payment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} • {pay.method}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[13px] font-black text-slate-500 uppercase shadow-sm">
                                                            {pay.technician?.full_name?.split(' ')[0] || 'Admin'}
                                                        </span>
                                                        {isAdmin && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setPaymentToEdit(pay);
                                                                        setActiveCategory(null);
                                                                    }}
                                                                    className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all border border-blue-100 dark:border-blue-900/30"
                                                                    title="Modifier"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentToDelete(pay.id);
                                                                    }}
                                                                    className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100 dark:border-red-900/30"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem]">
                                            <Wallet size={48} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-base font-bold text-slate-500 uppercase tracking-widest">Aucun mouvement financier</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeCategory === 'devis' && ( // Added devis section
                                <div className="space-y-4">
                                    {devis.length > 0 ? (
                                        devis.map((d) => (
                                            <div key={d.id} onClick={() => setSelectedDevisForView(d)} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-blue-500/50 hover:shadow-sm transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${d.status === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{d.title}</h5>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{d.number} • {new Date(d.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-slate-900 dark:text-white">{d.total_amount.toFixed(0)} DT</div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${d.status === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {d.status === 'closed' ? 'Terminé' : 'En cours'}
                                                    </span>
                                                    <div className="flex items-center justify-end gap-2 mt-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingDevisId(d.id); }}
                                                            className="text-[10px] font-black text-slate-400 hover:text-blue-500 uppercase flex items-center gap-1"
                                                            title="Modifier ce devis"
                                                        >
                                                            <Edit2 size={12} /> Modif.
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDuplicateDevis(d); }}
                                                            className="text-[10px] font-black text-slate-400 hover:text-emerald-500 uppercase flex items-center gap-1"
                                                            title="Dupliquer ce devis"
                                                        >
                                                            <Copy size={12} /> Copier
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDevisToDelete(d); }}
                                                            className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase flex items-center gap-1"
                                                            title="Supprimer ce devis"
                                                        >
                                                            <Trash2 size={12} /> Suppr.
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center opacity-30">
                                            <FileText size={48} className="mx-auto mb-4" />
                                            <p className="text-base font-black uppercase tracking-widest">Aucun devis enregistré</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeCategory === 'gps' && client?.gps_lat && client?.gps_lng && (
                                <div className="rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 h-[500px] border border-slate-200 dark:border-slate-700 p-1">
                                    <MapPicker
                                        lat={client.gps_lat}
                                        lng={client.gps_lng}
                                        readonly={true}
                                    />
                                </div>
                            )}
                        </div>
                    </ModalLayout>
                )
            }

            {/* Modals */}
            {
                (isDevisModalOpen || editingDevisId) && (
                    <AddDevisModal
                        clientId={client?.id}
                        devisId={editingDevisId || undefined}
                        onClose={() => {
                            setIsDevisModalOpen(false);
                            setEditingDevisId(null);
                        }}
                        onSuccess={fetchClientData}
                    />
                )
            }
            {
                (isInterventionModalOpen || editingInterventionId) && (
                    <NewIntervention
                        poolId={selectedPoolId || undefined}
                        clientId={id!}
                        interventionId={editingInterventionId || undefined}
                        type={startMode ? 'direct' : 'scheduled'}
                        onClose={() => {
                            setIsInterventionModalOpen(false);
                            setEditingInterventionId(null);
                            setStartMode(false);
                        }}
                        onSuccess={() => {
                            setIsInterventionModalOpen(false);
                            setEditingInterventionId(null);
                            setStartMode(false);
                            fetchClientData();
                        }}
                    />
                )
            }
            {
                isPoolModalOpen && (
                    <AddPoolModal
                        clientId={id!}
                        onClose={() => setIsPoolModalOpen(false)}
                        onSuccess={fetchClientData}
                    />
                )
            }
            {
                isEditClientModalOpen && (
                    <EditClientModal
                        client={client}
                        onClose={() => setIsEditClientModalOpen(false)}
                        onSuccess={fetchClientData}
                    />
                )
            }
            {
                isPaymentModalOpen && (
                    <RecordPaymentModal
                        clientId={id!}
                        onClose={() => setIsPaymentModalOpen(false)}
                        onSuccess={() => {
                            setIsPaymentModalOpen(false);
                            fetchClientData();
                        }}
                    />
                )
            }
            {
                isEditPoolModalOpen && selectedPool && (
                    <EditPoolModal
                        pool={selectedPool}
                        onClose={() => { setIsEditPoolModalOpen(false); setSelectedPool(null); }}
                        onSuccess={fetchClientData}
                    />
                )
            }
            {paymentToEdit && (
                <RecordPaymentModal
                    clientId={id!}
                    payment={paymentToEdit}
                    onClose={() => setPaymentToEdit(null)}
                    onSuccess={() => {
                        setPaymentToEdit(null);
                        fetchClientData();
                    }}
                />
            )}
            {
                selectedInterventionForView && (
                    <InterventionDetailsModal
                        intervention={selectedInterventionForView}
                        onClose={() => setSelectedInterventionForView(null)}
                        onEdit={(inter) => {
                            setEditingInterventionId(inter.id);
                            setStartMode(false);
                            setSelectedInterventionForView(null);
                        }}
                        onDelete={(inter) => {
                            setInterventionToDelete(inter.id);
                            setSelectedInterventionForView(null);
                        }}
                        onStart={(inter) => {
                            setEditingInterventionId(inter.id);
                            setStartMode(true);
                            setSelectedInterventionForView(null);
                        }}
                        onStatusChange={fetchClientData}
                    />
                )
            }
            {
                selectedDevisForView && (
                    <DevisDetailsModal
                        devis={{ ...selectedDevisForView, client }} // Passing client details to devis
                        onClose={() => setSelectedDevisForView(null)}
                        onEdit={(id) => {
                            setSelectedDevisForView(null);
                            setEditingDevisId(id);
                        }}
                        onDelete={(d) => {
                            setSelectedDevisForView(null);
                            setDevisToDelete(d);
                        }}
                        onStatusChange={handleStatusChange}
                    />
                )
            }
            {isAssignPartnerOpen && (
                <AssignPartnerModal
                    clientId={id!}
                    onClose={() => setIsAssignPartnerOpen(false)}
                    onSuccess={() => {
                        setIsAssignPartnerOpen(false);
                        fetchClientData();
                    }}
                />
            )}

            <ConfirmModal
                isOpen={!!paymentToDelete}
                title="Supprimer Paiement"
                message="Voulez-vous vraiment supprimer ce paiement ? Le solde du client sera automatiquement ajusté."
                confirmLabel="SUPPRIMER"
                onConfirm={handleDeletePayment}
                onClose={() => setPaymentToDelete(null)}
                loading={isDeleting}
            />

            <ConfirmModal
                isOpen={!!poolToDelete}
                title="Supprimer la piscine"
                message={`Voulez-vous vraiment supprimer la piscine "${poolToDelete?.name}" ? Toutes les interventions associées seront perdues.`}
                confirmLabel="SUPPRIMER"
                onConfirm={handleDeletePool}
                onClose={() => setPoolToDelete(null)}
                loading={isDeletingPool}
            />

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Supprimer le Client"
                message={`Êtes-vous sûr de vouloir supprimer ${client?.first_name} ${client?.last_name} ? Cette action supprimera également tous ses bassins, interventions et paiements associés. Cette action est irréversible.`}
                confirmLabel="SUPPRIMER DÉFINITIVEMENT"
                onConfirm={handleDeleteClient}
                onClose={() => setShowDeleteConfirm(false)}
                loading={isDeletingClient}
                variant="danger"
            />

            <ConfirmModal
                isOpen={!!interventionToDelete}
                title="Supprimer Intervention"
                message="Voulez-vous vraiment supprimer ce rapport d'intervention ? Cette action est irréversible et le solde du client sera ajusté."
                confirmLabel="SUPPRIMER"
                onConfirm={handleDeleteIntervention}
                onClose={() => setInterventionToDelete(null)}
                loading={isDeleting}
                variant="danger"
            />

            <ConfirmModal
                isOpen={!!devisToDelete}
                title="Supprimer le Devis"
                message={`Êtes-vous sûr de vouloir supprimer définitivement le devis ${devisToDelete?.number} ? Cette action est irréversible.`}
                confirmLabel="SUPPRIMER"
                onConfirm={handleDeleteDevis}
                onClose={() => setDevisToDelete(null)}
                loading={isDeletingDevis}
                variant="danger"
            />

            <ConfirmModal
                isOpen={!!partnerToUnassign}
                title="Retirer le partenaire"
                message={`Voulez-vous vraiment retirer ${partnerToUnassign?.first_name} ${partnerToUnassign?.last_name} du projet de ce client ?`}
                confirmLabel="RETIRER"
                onConfirm={handleUnassignPartner}
                onClose={() => setPartnerToUnassign(null)}
                loading={isUnassigningPartner}
                variant="danger"
            />

            <ConfirmModal
                isOpen={isSolderModalOpen}
                title="Solder le compte"
                message="Créer une remise (perte) du montant exact manquant pour solder ce compte à 0 DT ?"
                confirmLabel="SOLDER"
                onConfirm={confirmSolder}
                onClose={() => setIsSolderModalOpen(false)}
                loading={isSoldering}
                variant="primary"
            />
        </PageLayout>
    );
};

export default ClientDetail;
