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
    Trash2
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
    visit_date: string;
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
}

const ClientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [pools, setPools] = useState<Pool[]>([]);
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
    const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditPoolModalOpen, setIsEditPoolModalOpen] = useState(false);
    const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [selectedInterventionForView, setSelectedInterventionForView] = useState<any | null>(null);
    const [paymentToEdit, setPaymentToEdit] = useState<any | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'pools' | 'interventions' | 'payments' | 'balance' | 'gps' | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
    const [poolToDelete, setPoolToDelete] = useState<Pool | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingPool, setIsDeletingPool] = useState(false);

    const totalIntersAmount = interventions.reduce((acc, inter) => {
        const sTotal = inter.services?.reduce((sAcc: number, s: any) => sAcc + (s.price_at_time || 0), 0) || 0;
        const pTotal = inter.products?.reduce((pAcc: number, p: any) => pAcc + (p.total_price || 0), 0) || 0;
        return acc + sTotal + pTotal;
    }, 0);

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

    useEffect(() => {
        if (id) {
            fetchClientData();
        }
    }, [id]);

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
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                setIsAdmin(profile?.role === 'admin');
            }

            const { data: clientData, error: clientError } = await supabase.from('clients').select('*').eq('id', id).single();
            if (clientError) throw clientError;
            setClient(clientData);

            const { data: poolData } = await supabase.from('pools').select('*').eq('client_id', id);
            setPools(poolData || []);

            const { data: interData } = await supabase
                .from('interventions')
                .select(`
                    id, 
                    visit_date, 
                    created_at,
                    notes, 
                    ph_level, 
                    chlorine_level, 
                    status, 
                    photo_before_url,
                    photo_after_url,
                    pool:pools(name, client:clients(id, first_name, last_name, balance, phone)), 
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

            const formattedInters = interData?.map((i: any) => ({
                ...i,
                pool_name: i.pool?.name
            })) || [];
            setInterventions(formattedInters);

            const { data: payData } = await supabase
                .from('payments')
                .select('*, technician:technicians(full_name)')
                .eq('client_id', id)
                .order('payment_date', { ascending: false });
            setPayments(payData || []);

        } catch (error) {
            console.error('Erreur:', error);
            navigate('/clients');
        } finally {
            setLoading(false);
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

    const openWhatsApp = () => {
        if (client?.phone) {
            let formattedPhone = client.phone.replace(/\s/g, '').replace('+', '');
            // Si le numéro commence par un chiffre autre que 216 et fait 8 chiffres, on ajoute le préfixe Tunisie
            if (formattedPhone.length === 8 && !formattedPhone.startsWith('216')) {
                formattedPhone = '216' + formattedPhone;
            }
            window.open(`https://wa.me/${formattedPhone}`, '_blank');
        }
    };

    const openGPS = () => {
        if (client?.gps_lat && client?.gps_lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${client.gps_lat},${client.gps_lng}`, '_blank');
        } else if (client?.address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address + ' ' + (client.city || ''))}`, '_blank');
        }
    };

    if (!client && !loading) return null;

    const toolbar = (
        <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2">
                <button onClick={openWhatsApp} className="btn-icon !bg-[#25D366] !text-white !border-none !w-10 !h-10 shadow-lg shadow-green-500/20" title="WhatsApp">
                    <MessageCircle size={18} />
                </button>
                <button onClick={openGPS} className="btn-icon !bg-orange-500 !text-white !border-none !w-10 !h-10 shadow-lg shadow-orange-500/20" title="Navigation">
                    <Navigation size={18} />
                </button>
            </div>
            <button onClick={() => setIsEditClientModalOpen(true)} className="btn-icon !bg-blue-600 !text-white !border-none !w-10 !h-10 shadow-lg shadow-blue-500/20" title="Modifier Profil">
                <Edit2 size={18} />
            </button>
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
            <div className="bento-grid-2">
                {/* LEFT COLUMN: CONTACT & LOCATION */}
                <div className="flex flex-col gap-4">
                    {/* 1. Contact Details Tile */}
                    <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6">
                        <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Coordonnées</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase">Téléphone Principal</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{client?.phone}</span>
                                </div>
                            </div>

                            {client?.phone2 && (
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <Phone size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase">Téléphone Secondaire</span>
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
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase">Email</span>
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
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase">Localisation</span>
                                        <span className="text-lg font-black text-slate-900 dark:text-white">{client?.city}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Payment List Tile (Timeline Style) */}
                    <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6 flex-1 cursor-pointer group" onClick={() => setActiveCategory('payments')}>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Historique Financier</h4>
                            <Wallet size={16} className="text-slate-400" />
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
                                            <p className="text-xs font-black text-slate-500 uppercase">{new Date(pay.payment_date).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                                    <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest group-hover:underline">Consulter tout l'historique</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 opacity-30">
                                <Wallet size={24} />
                                <p className="text-xs font-black uppercase tracking-widest">Aucun paiement</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: FINANCE & STATUS */}
                <div className="flex flex-col gap-4">
                    {/* 3. Financial Fintech Tile */}
                    <div
                        onClick={() => setActiveCategory('balance')}
                        className={`card-bento cursor-pointer relative overflow-hidden transition-all duration-500 min-h-[180px] flex flex-col justify-center ${(totalPaymentsAmount - totalIntersAmount) < 0 ? 'border-none shadow-2xl fintech-card-red-luxe' : 'border-none shadow-xl fintech-card-money-luxe'}`}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">État Financier</p>
                                <Wallet size={24} className="text-white/40" />
                            </div>
                            <h3 className="text-6xl font-black tracking-tighter leading-none mb-2 text-white">
                                {Math.abs(totalPaymentsAmount - totalIntersAmount).toFixed(0)}
                                <span className="text-xl font-black ml-1 uppercase text-white/60">Dt</span>
                            </h3>
                            <p className="text-[12px] font-black uppercase tracking-widest text-white">
                                {(totalPaymentsAmount - totalIntersAmount) < 0 ? 'Crédit à recouvrer' : 'Compte positif'}
                            </p>
                        </div>

                        {/* Decorative Grid Lines like a Fintech app */}
                        <div className="fintech-pattern" />
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
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Bassins</span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{pools.length}</span>
                        </button>

                        <button
                            onClick={() => setActiveCategory('interventions')}
                            className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 hover:bg-white/80 transition-all p-5 flex flex-col items-center text-center justify-center group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <HistoryIcon size={28} />
                            </div>
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Suivi</span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{interventions.length}</span>
                        </button>
                    </div>

                    {/* 5. Quick Actions Tile */}
                    <div className="card-bento bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 flex-1 min-h-[140px]">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Actions de Gestion</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setIsInterventionModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-blue-500 transition-all group">
                                <Plus size={16} className="text-blue-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">Intervention</span>
                            </button>
                            <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-emerald-500 transition-all group">
                                <Wallet size={16} className="text-emerald-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">Encaissement</span>
                            </button>
                            <button onClick={() => setIsPoolModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-indigo-500 transition-all group">
                                <Plus size={16} className="text-indigo-500 group-hover:scale-125 transition-transform" />
                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">Info Bassin</span>
                            </button>
                            <button onClick={() => setIsEditClientModalOpen(true)} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl hover:border-slate-900 transition-all group">
                                <Edit2 size={16} className="text-slate-400 group-hover:scale-125 transition-transform" />
                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">Editer Profil</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Activity Timeline Tile (Bottom Wide Box) */}
            <div className="mt-4">
                <div className="card-bento glass-morphism border-slate-200/50 dark:border-slate-700/50 p-6 min-h-[200px]">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dernière Activité</h4>
                        <HistoryIcon size={16} className="text-slate-400" />
                    </div>

                    {interventions.length > 0 ? (
                        <div className="space-y-4">
                            {interventions.slice(0, 3).map((inter) => (
                                <div key={inter.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => setSelectedInterventionForView(inter)}>
                                    <div className="w-1.5 h-12 rounded-full bg-blue-500/30 flex-shrink-0 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full bg-blue-500 transition-all duration-500 group-hover:h-full h-3" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Rapport de Maintenance</h5>
                                            <span className="text-xs font-black text-slate-500">{new Date(inter.created_at).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-black uppercase mt-1">Bassin: {inter.pool_name} • {inter.status || 'Terminé'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-20 opacity-30">
                            <HistoryIcon size={28} />
                            <p className="text-xs font-black uppercase tracking-widest">Aucune activité enregistrée</p>
                        </div>
                    )}

                    <button onClick={() => setActiveCategory('interventions')} className="w-full mt-6 py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-500 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase tracking-widest">
                        Consulter l'historique complet
                    </button>
                </div>
            </div>

            {/* Categorized Details Modal */}
            {
                activeCategory && (
                    <ModalLayout
                        title={
                            activeCategory === 'pools' ? 'Parc Aquatique' :
                                activeCategory === 'interventions' ? 'Historique des Entretiens' :
                                    activeCategory === 'payments' ? 'Historique des Paiements' :
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
                                <Button onClick={() => setActiveCategory(null)} variant="secondary">FERMER</Button>
                            </div>
                        }
                    >
                        <div className="p-2">
                            {activeCategory === 'balance' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Interventions</p>
                                            <h4 className="text-2xl font-black text-slate-800 dark:text-white">-{totalIntersAmount.toFixed(0)} <span className="text-xs opacity-60">DT</span></h4>
                                        </div>
                                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
                                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Total Paiements</p>
                                            <h4 className="text-2xl font-black text-emerald-600">+{totalPaymentsAmount.toFixed(0)} <span className="text-xs opacity-60 text-emerald-400">DT</span></h4>
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/20 text-center">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Solde Final</p>
                                        <h3 className="text-5xl font-black tracking-tighter">
                                            {(totalPaymentsAmount - totalIntersAmount) < 0 ? (
                                                <span className="text-rose-400">Credit {Math.abs(totalPaymentsAmount - totalIntersAmount).toFixed(0)}</span>
                                            ) : (
                                                <span>{(totalPaymentsAmount - totalIntersAmount).toFixed(0)}</span>
                                            )}
                                            <span className="text-lg opacity-40 ml-2">DT</span>
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
                                                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-600 transition-colors"
                                                    >
                                                        Nouveau Rapport
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedPool(pool); setIsEditPoolModalOpen(true); }}
                                                        className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 text-slate-400 flex items-center justify-center hover:text-blue-600 border border-slate-100 dark:border-slate-600 shadow-sm transition-all"
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
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{pool.volume_m3} m³</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">{pool.treatment_method}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsPoolModalOpen(true)}
                                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Plus size={24} className="text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <span className="text-xs font-black text-slate-400 group-hover:text-blue-500 uppercase tracking-widest">Ajouter un bassin</span>
                                    </button>
                                </div>
                            )}

                            {activeCategory === 'interventions' && (
                                <div className="space-y-6">
                                    {/* Summary Header in Modal */}
                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/20 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center">
                                                <HistoryIcon size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Cumul des Travaux</p>
                                                <h4 className="text-2xl font-black text-slate-800 dark:text-white">{totalIntersAmount.toFixed(0)} <span className="text-xs opacity-60">DT</span></h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fréquence</p>
                                            <h4 className="text-2xl font-black text-slate-800 dark:text-white">{interventions.length} <span className="text-xs opacity-60">Visites</span></h4>
                                        </div>
                                    </div>

                                    {interventions.length > 0 ? (
                                        <div className="relative before:absolute before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                            {interventions.map((inter) => (
                                                <div
                                                    key={inter.id}
                                                    onClick={() => setSelectedInterventionForView(inter)}
                                                    className="relative pl-14 mb-4 group cursor-pointer"
                                                >
                                                    <div className="absolute left-[22px] top-6 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-[3.5px] border-slate-200 dark:border-slate-700 group-hover:border-indigo-500 group-hover:scale-125 transition-all z-10" />
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-transparent hover:border-indigo-500/20 transition-all">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                    {new Date(inter.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </span>
                                                                <p className="text-sm text-slate-400 font-bold uppercase mt-1">Bassin: {inter.pool_name}</p>
                                                            </div>
                                                            <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg uppercase tracking-widest">
                                                                {inter.status || 'TERMINE'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-6 pt-3 border-t border-slate-100 dark:border-slate-700">
                                                            {inter.ph_level && <span className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">PH: <strong className="text-slate-900 dark:text-white ml-1">{inter.ph_level}</strong></span>}
                                                            {inter.chlorine_level && <span className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Chlore: <strong className="text-slate-900 dark:text-white ml-1">{inter.chlorine_level}</strong></span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem]">
                                            <HistoryIcon size={48} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aucun historique technique</p>
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
                                                            <p className="text-sm text-slate-400 font-black uppercase tracking-widest">
                                                                {new Date(pay.payment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} • {pay.method}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-black text-slate-500 uppercase shadow-sm">
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
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aucun mouvement financier</p>
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
                isInterventionModalOpen && (
                    <NewIntervention
                        poolId={selectedPoolId || undefined}
                        clientId={id!}
                        onClose={() => setIsInterventionModalOpen(false)}
                        onSuccess={fetchClientData}
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
                    />
                )
            }

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
        </PageLayout>
    );
};

export default ClientDetail;
