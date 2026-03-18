import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import ModalLayout from '../components/ModalLayout';
import { 
    Wallet, 
    CheckCircle2, 
    XCircle, 
    Users,
    ArrowUpRight,
    Minus,
    ArrowRight,
    Plus,
    LayoutGrid,
    Trash2,
    Edit2,
    Truck,
    Fuel,
    Banknote
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Combobox from '../components/ui/Combobox';

interface FinanceItem {
    id: string;
    technician_id: string;
    amount: number;
    description: string;
    status: 'pending' | 'validated' | 'rejected';
    created_at: string;
    type: 'expense' | 'advance' | 'remittance' | 'payment';
    category_name?: string;
    technician_name?: string;
    method?: string;
    client_name?: string;
    category_id?: string;
    date?: string;
}

const AdminFinance: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'pending' | 'technicians' | 'recettes' | 'expenses' | 'advances' | 'history' | 'vehicles'>('pending');
    const [items, setItems] = useState<FinanceItem[]>([]);
    const [techSummaries, setTechSummaries] = useState<any[]>([]);
    const [adminSummaries, setAdminSummaries] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('month');
    
    const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
    const [advanceCategories, setAdvanceCategories] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [vehicleStats, setVehicleStats] = useState<any[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [selectedCategoryRequiresVehicle, setSelectedCategoryRequiresVehicle] = useState(false);

    // Manual insertion
    const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
    const [insertionInfo, setInsertionInfo] = useState<{ type: 'expense' | 'advance', techId: string, techName: string } | null>(null);
    const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    // Collect (récupérer caisse)
    const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
    const [collectTarget, setCollectTarget] = useState<{ techId: string, techName: string, balance: number } | null>(null);
    const [collectAmount, setCollectAmount] = useState('');
    const [collectMethod, setCollectMethod] = useState<'cash' | 'check' | 'transfer'>('cash');
    const [collectNote, setCollectNote] = useState('');
    const [isCollecting, setIsCollecting] = useState(false);

    useEffect(() => {
        fetchFinanceData();
        fetchCategories();
        fetchVehicles();
    }, [tab, timeRange]);

    const fetchCategories = async () => {
        const [expRes, advRes] = await Promise.all([
            supabase.from('expense_categories').select('*').order('name'),
            supabase.from('advance_categories').select('*').order('name')
        ]);
        setExpenseCategories(expRes.data || []);
        setAdvanceCategories(advRes.data || []);
    };

    const fetchVehicles = async () => {
        const { data } = await supabase.from('vehicles').select('*').eq('is_active', true).order('name');
        setVehicles(data || []);
    };

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();
            if (timeRange === 'day') startDate.setHours(0,0,0,0);
            else if (timeRange === 'week') startDate.setDate(now.getDate() - 7);
            else if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
            else startDate = new Date(0);

            if (tab === 'pending') {
                const [expRes, advRes, remRes] = await Promise.all([
                    supabase.from('expenses').select('*, technician:technicians(full_name), category:expense_categories(name)').eq('status', 'pending'),
                    supabase.from('advances').select('*, technician:technicians(full_name), category:advance_categories(name)').eq('status', 'pending'),
                    supabase.from('remittances').select('*, technician:technicians(full_name)').eq('status', 'pending')
                ]);

                const combined: FinanceItem[] = [
                    ...(expRes.data || []).map(i => ({ ...i, type: 'expense', technician_name: i.technician?.full_name, category_name: i.category?.name })),
                    ...(advRes.data || []).map(i => ({ ...i, type: 'advance', technician_name: i.technician?.full_name, category_name: i.category?.name })),
                    ...(remRes.data || []).map(i => ({ ...i, type: 'remittance', technician_name: i.technician?.full_name }))
                ] as any;

                setItems(combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            } else if (tab === 'technicians') {
                const { data: techs } = await supabase.from('technicians').select('id, full_name').eq('active', true);
                if (techs) {
                    const summaries = await Promise.all(techs.map(async (t) => {
                        const [payRes, expRes, advRes, remRes] = await Promise.all([
                            supabase.from('payments').select('amount').eq('technician_id', t.id).gte('payment_date', startDate.toISOString()),
                            supabase.from('expenses').select('amount').eq('technician_id', t.id).eq('status', 'validated').gte('expense_date', startDate.toISOString().split('T')[0]),
                            supabase.from('advances').select('amount').eq('technician_id', t.id).eq('status', 'validated').gte('advance_date', startDate.toISOString().split('T')[0]),
                            supabase.from('remittances').select('amount').eq('technician_id', t.id).eq('status', 'validated').gte('remittance_date', startDate.toISOString().split('T')[0])
                        ]);

                        const receipts = payRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
                        const expenses = expRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
                        const advances = advRes.data?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
                        const remittances = remRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

                        return {
                            ...t,
                            receipts,
                            expenses,
                            advances,
                            remittances,
                            balance: receipts - expenses - advances - remittances
                        };
                    }));
                    setTechSummaries(summaries);
                }

                // --- NEW : Calculate Admin Wallets ---
                const { data: allRemittances } = await supabase.from('remittances').select('amount, validated_by, profiles(full_name)').eq('status', 'validated');
                const { data: allPaidOutExp } = await supabase.from('expenses').select('amount, validated_by').eq('status', 'validated');
                const { data: allPaidOutAdv } = await supabase.from('advances').select('amount, validated_by').eq('status', 'validated');

                const admins: Record<string, any> = {};
                (allRemittances || []).forEach(r => {
                    const id = r.validated_by;
                    if (!id) return;
                    if (!admins[id]) admins[id] = { id, name: (r as any).profiles?.full_name || 'Admin Inconnu', balance: 0, collected: 0, spent: 0 };
                    admins[id].collected += Number(r.amount);
                    admins[id].balance += Number(r.amount);
                });
                (allPaidOutExp || []).forEach(e => {
                    const id = e.validated_by;
                    if (!id || !admins[id]) return;
                    admins[id].spent += Number(e.amount);
                    admins[id].balance -= Number(e.amount);
                });
                (allPaidOutAdv || []).forEach(a => {
                    const id = a.validated_by;
                    if (!id || !admins[id]) return;
                    admins[id].spent += Number(a.amount);
                    admins[id].balance -= Number(a.amount);
                });
                setAdminSummaries(Object.values(admins));
            } else if (tab === 'recettes') {
                const { data: recRes } = await supabase
                    .from('payments')
                    .select('*, technician:technicians(full_name), client:clients(first_name, last_name)')
                    .gte('payment_date', startDate.toISOString())
                    .order('payment_date', { ascending: false });

                const combined: FinanceItem[] = (recRes || []).map(i => ({ 
                    ...i, 
                    type: 'payment', 
                    technician_name: i.technician?.full_name,
                    client_name: i.client ? `${i.client.first_name} ${i.client.last_name}` : 'Client Inconnu',
                    created_at: i.payment_date 
                })) as any;

                setItems(combined);
            } else if (tab === 'history') {
                const [expRes, advRes, remRes, payRes] = await Promise.all([
                    supabase.from('expenses').select('*, technician:technicians(full_name), category:expense_categories(name)').gte('expense_date', startDate.toISOString().split('T')[0]).order('created_at', { ascending: false }).limit(100),
                    supabase.from('advances').select('*, technician:technicians(full_name), category:advance_categories(name)').gte('advance_date', startDate.toISOString().split('T')[0]).order('created_at', { ascending: false }).limit(100),
                    supabase.from('remittances').select('*, technician:technicians(full_name)').gte('remittance_date', startDate.toISOString().split('T')[0]).order('created_at', { ascending: false }).limit(100),
                    supabase.from('payments').select('*, technician:technicians(full_name)').gte('payment_date', startDate.toISOString()).order('payment_date', { ascending: false }).limit(100)
                ]);

                const combined: FinanceItem[] = [
                    ...(expRes.data || []).map(i => ({ ...i, type: 'expense', date: i.expense_date, technician_name: i.technician?.full_name, category_name: i.category?.name })),
                    ...(advRes.data || []).map(i => ({ ...i, type: 'advance', date: i.advance_date, technician_name: i.technician?.full_name, category_name: i.category?.name })),
                    ...(remRes.data || []).map(i => ({ ...i, type: 'remittance', date: i.remittance_date, technician_name: i.technician?.full_name })),
                    ...(payRes.data || []).map(i => ({ ...i, type: 'payment', date: i.payment_date, technician_name: i.technician?.full_name, created_at: i.payment_date }))
                ] as any;

                setItems(combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            } else if (tab === 'expenses') {
                const { data: expRes } = await supabase
                    .from('expenses')
                    .select('*, technician:technicians(full_name), category:expense_categories(name)')
                    .gte('expense_date', startDate.toISOString().split('T')[0])
                    .order('expense_date', { ascending: false });
                
                setItems((expRes || []).map(i => ({ 
                    ...i, 
                    type: 'expense', 
                    date: i.expense_date, 
                    technician_name: i.technician?.full_name, 
                    category_name: i.category?.name 
                })) as any);
            } else if (tab === 'advances') {
                const { data: advRes } = await supabase
                    .from('advances')
                    .select('*, technician:technicians(full_name), category:advance_categories(name)')
                    .gte('advance_date', startDate.toISOString().split('T')[0])
                    .order('advance_date', { ascending: false });
                
                setItems((advRes || []).map(i => ({ 
                    ...i, 
                    type: 'advance', 
                    date: i.advance_date, 
                    technician_name: i.technician?.full_name, 
                    category_name: i.category?.name 
                })) as any);
            }
        } catch (error) {
            console.error('Error fetching finance:', error);
        } finally {
            setLoading(false);
        }

        // Fetch vehicle stats separately if on vehicles tab
        if (tab === 'vehicles') {
            try {
                const { data: vsData } = await supabase
                    .from('expenses')
                    .select('amount, liters, kilometers, vehicle:vehicles(id, name, plate, type)')
                    .not('vehicle_id', 'is', null)
                    .eq('status', 'validated');

                const grouped: Record<string, any> = {};
                (vsData || []).forEach((e: any) => {
                    if (!e.vehicle) return;
                    const vid = e.vehicle.id;
                    if (!grouped[vid]) {
                        grouped[vid] = { ...e.vehicle, totalCost: 0, totalLiters: 0, totalKm: 0, count: 0 };
                    }
                    grouped[vid].totalCost += Number(e.amount) || 0;
                    grouped[vid].totalLiters += Number(e.liters) || 0;
                    grouped[vid].totalKm += Number(e.kilometers) || 0;
                    grouped[vid].count += 1;
                });
                setVehicleStats(Object.values(grouped).sort((a, b) => b.totalCost - a.totalCost));
            } catch (err) {
                console.error('Vehicle stats error:', err);
            }
        }
    };

    const handleAction = async (item: FinanceItem, action: 'validated' | 'rejected') => {
        try {
            const table = item.type === 'expense' ? 'expenses' : (item.type === 'advance' ? 'advances' : 'remittances');
            const { error } = await supabase
                .from(table)
                .update({ 
                    status: action,
                    validated_by: (await supabase.auth.getUser()).data.user?.id,
                    validated_at: new Date().toISOString()
                })
                .eq('id', item.id);

            if (error) throw error;
            toast.success(action === 'validated' ? 'Opération validée' : 'Opération rejetée');
            fetchFinanceData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleOpenInsertModal = (type: 'expense' | 'advance', techId: string, techName: string) => {
        setInsertionInfo({ type, techId, techName });
        setEditingItem(null);
        setSelectedCategoryId('');
        setSelectedVehicleId('');
        setSelectedCategoryRequiresVehicle(false);
        setIsInsertModalOpen(true);
    };

    const handleEdit = (item: FinanceItem) => {
        setEditingItem(item);
        setInsertionInfo({ type: item.type as 'expense' | 'advance', techId: item.technician_id, techName: item.technician_name || '' });
        setSelectedCategoryId(item.category_id || '');
        setSelectedVehicleId('');
        setSelectedCategoryRequiresVehicle(false);
        setIsInsertModalOpen(true);
    };

    const handleDelete = async (item: FinanceItem) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) return;
        
        try {
            const table = item.type === 'expense' ? 'expenses' : 'advances';
            const { error } = await supabase.from(table).delete().eq('id', item.id);
            if (error) throw error;
            toast.success('Opération supprimée');
            fetchFinanceData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleManualInsert = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!insertionInfo) return;
        
        const formData = new FormData(e.currentTarget);
        const amount = Number(formData.get('amount'));
        const category_id = selectedCategoryId;
        const description = formData.get('description') as string;
        const date = formData.get('date') as string;

        if (!amount || !category_id) return toast.error('Montant et catégorie requis');

        setIsSubmitting(true);
        try {
            const table = insertionInfo.type === 'expense' ? 'expenses' : 'advances';
            const adminId = (await supabase.auth.getUser()).data.user?.id;
            
            const payload: any = {
                technician_id: insertionInfo.techId,
                amount,
                category_id,
                description,
                status: 'validated',
                validated_by: adminId,
                validated_at: new Date().toISOString()
            };
            
            if (insertionInfo.type === 'expense') {
                payload.expense_date = date || new Date().toISOString().split('T')[0];
                if (selectedVehicleId) payload.vehicle_id = selectedVehicleId;
                const km = formData.get('kilometers');
                const lt = formData.get('liters');
                if (km) payload.kilometers = Number(km);
                if (lt) payload.liters = Number(lt);
            } else {
                payload.advance_date = date || new Date().toISOString().split('T')[0];
            }

            if (editingItem) {
                const { error } = await supabase.from(table).update(payload).eq('id', editingItem.id);
                if (error) throw error;
                toast.success('Opération mise à jour');
            } else {
                const { error } = await supabase.from(table).insert(payload);
                if (error) throw error;
                toast.success(`${insertionInfo.type === 'expense' ? 'Dépense' : 'Avance'} enregistrée avec succès`);
            }
            
            setIsInsertModalOpen(false);
            setEditingItem(null);
            fetchFinanceData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleOpenCollect = (tech: any) => {
        setCollectTarget({ techId: tech.id, techName: tech.full_name, balance: tech.balance });
        setCollectAmount(tech.balance > 0 ? tech.balance.toString() : '0');
        setCollectMethod('cash');
        setCollectNote('');
        setIsCollectModalOpen(true);
    };

    const handleCollect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!collectTarget) return;
        const amount = Number(collectAmount);
        if (!amount || amount <= 0) return;

        setIsCollecting(true);
        try {
            const adminId = (await supabase.auth.getUser()).data.user?.id;
            const { error } = await supabase.from('remittances').insert({
                technician_id: collectTarget.techId,
                amount,
                method: collectMethod,
                description: collectNote || `Récupération caisse par admin — ${new Date().toLocaleDateString('fr-FR')}`,
                status: 'validated',
                validated_by: adminId,
                validated_at: new Date().toISOString()
            });
            if (error) throw error;
            toast.success(`✅ ${amount.toLocaleString()} TND récupérés de ${collectTarget.techName}`);
            setIsCollectModalOpen(false);
            fetchFinanceData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsCollecting(false);
        }
    };

    const renderVehicleStats = () => (
        <div className="flex flex-col gap-4">
            {vehicleStats.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-800/10 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                    <Truck size={40} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-base font-black text-slate-400 uppercase tracking-widest">Aucune donnée carburant</p>
                    <p className="text-sm font-bold text-slate-300 mt-1">Ajoutez des dépenses de type Carburant</p>
                </div>
            ) : (
                <>
                    {/* Global summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-teal-500/10 p-5 rounded-[24px] flex flex-col gap-1">
                            <span className="text-xs font-black text-teal-600 uppercase tracking-widest">Coût Total</span>
                            <span className="text-xl font-black text-teal-700 dark:text-teal-400">
                                {vehicleStats.reduce((s, v) => s + v.totalCost, 0).toLocaleString()} <span className="text-xs opacity-60">TND</span>
                            </span>
                        </div>
                        <div className="bg-blue-500/10 p-5 rounded-[24px] flex flex-col gap-1">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Litres</span>
                            <span className="text-xl font-black text-blue-700 dark:text-blue-400">
                                {vehicleStats.reduce((s, v) => s + v.totalLiters, 0).toLocaleString()} <span className="text-xs opacity-60">L</span>
                            </span>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-[24px] flex flex-col gap-1">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Pleins</span>
                            <span className="text-xl font-black text-slate-700 dark:text-slate-300">
                                {vehicleStats.reduce((s, v) => s + v.count, 0)}
                            </span>
                        </div>
                    </div>

                    {/* Per vehicle cards */}
                    {vehicleStats.map(v => (
                        <div key={v.id} className="card-white p-6 rounded-[28px] border-none shadow-sm animate-in fade-in">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center flex-shrink-0">
                                    <Truck size={26} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase">{v.name}</h3>
                                    <p className="text-sm font-bold text-slate-500">{v.plate || 'Sans immatriculation'} • {v.count} plein{v.count !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{v.totalCost.toLocaleString()} <span className="text-xs opacity-40">TND</span></p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Litres</p>
                                    <p className="text-lg font-black text-slate-700 dark:text-slate-300">{v.totalLiters > 0 ? v.totalLiters.toFixed(0) : '—'} L</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Km relevés</p>
                                    <p className="text-lg font-black text-slate-700 dark:text-slate-300">{v.totalKm > 0 ? v.totalKm.toLocaleString() : '—'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl text-center">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Coût/km</p>
                                    <p className="text-lg font-black text-slate-700 dark:text-slate-300">
                                        {v.totalKm > 0 ? (v.totalCost / v.totalKm).toFixed(2) : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );

    const renderPending = () => (
        <div className="flex flex-col gap-4">
            {items.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-800/10 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Aucune demande en attente</p>
                </div>
            ) : (
                items.map(item => (
                    <div key={item.id} className="card-white p-5 sm:p-6 rounded-[24px] border-none shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    item.type === 'expense' ? 'bg-rose-500/10 text-rose-50' : 
                                    item.type === 'advance' ? 'bg-amber-500/10 text-amber-500' : 
                                    'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                    {item.type === 'expense' ? <Minus size={24} /> : 
                                     item.type === 'advance' ? <ArrowUpRight size={24} /> : 
                                     <ArrowRight size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        {item.type === 'expense' ? `Dépense : ${item.category_name}` : 
                                         item.type === 'advance' ? `Avance : ${item.category_name || 'Demande'}` : 
                                         `Versement : ${item.method}`}
                                    </h3>
                                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.technician_name} • {new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{item.amount.toLocaleString()} <span className="text-xs opacity-40">TND</span></p>
                                <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 text-[11px] font-black uppercase tracking-widest rounded-md">En attente</span>
                            </div>
                        </div>
                        
                        {item.description && (
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl mb-4 border border-slate-100 dark:border-slate-800">
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{item.description}"</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleAction(item, 'validated')}
                                className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                <CheckCircle2 size={18} /> Valider
                            </button>
                            <button 
                                onClick={() => handleAction(item, 'rejected')}
                                className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <XCircle size={18} /> Rejeter
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderTechnicians = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {techSummaries.map(tech => (
                <div key={tech.id} className="card-white p-6 rounded-[32px] border-none shadow-sm animate-in fade-in zoom-in">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{tech.full_name}</h3>
                        </div>
                        <div className={`px-5 py-2 rounded-xl text-xl font-black ${tech.balance >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'}`}>
                            {tech.balance.toLocaleString()} <span className="text-xs opacity-60">TND</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-[24px] flex flex-col gap-1.5">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Recettes</span>
                            <span className="text-xl font-black text-slate-700 dark:text-slate-300">{tech.receipts.toLocaleString()} <span className="text-xs opacity-40">TND</span></span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-[24px] flex flex-col gap-1.5">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Dépenses</span>
                            <span className="text-xl font-black text-rose-500">{tech.expenses.toLocaleString()} <span className="text-xs opacity-40">TND</span></span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-[24px] flex flex-col gap-1.5">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Avances</span>
                            <span className="text-xl font-black text-amber-500">{tech.advances.toLocaleString()} <span className="text-xs opacity-40">TND</span></span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-[24px] flex flex-col gap-1.5">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Versements</span>
                            <span className="text-xl font-black text-emerald-500">{tech.remittances.toLocaleString()} <span className="text-xs opacity-40">TND</span></span>
                        </div>
                    </div>

                    {/* Collect button — highlighted when balance > 0 */}
                    {tech.balance > 0 && (
                        <button
                            onClick={() => handleOpenCollect(tech)}
                            className="w-full h-14 mb-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Banknote size={20} />
                            Récupérer la caisse — {tech.balance.toLocaleString()} TND
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleOpenInsertModal('expense', tech.id, tech.full_name)}
                            className="flex-1 h-12 bg-rose-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Dépense
                        </button>
                        <button 
                            onClick={() => handleOpenInsertModal('advance', tech.id, tech.full_name)}
                            className="flex-1 h-12 bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Avance
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderRecettes = () => (
        <div className="flex flex-col gap-6">
            {/* Admin Wallets Summary */}
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Répartition des caisses Admins</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {adminSummaries.map(admin => (
                        <div key={admin.id} className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                        <Wallet size={20} />
                                    </div>
                                    <span className="font-black text-slate-700 dark:text-white uppercase text-sm truncate max-w-[120px]">{admin.name}</span>
                                </div>
                                <span className="text-lg font-black text-indigo-600">{admin.balance.toLocaleString()} <span className="text-[10px] opacity-60">TND</span></span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <span>Collecté: {admin.collected.toLocaleString()}</span>
                                <span className="text-rose-400">Sorties: {admin.spent.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    <div className="bg-indigo-600 p-5 rounded-[24px] text-white flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total En Main Admins</span>
                        <span className="text-2xl font-black">{adminSummaries.reduce((sum, a) => sum + a.balance, 0).toLocaleString()} TND</span>
                    </div>
                </div>
            </div>

            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Journal des recettes</h3>
            <div className="flex flex-col gap-3">
                 {items.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-800/10 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Aucune recette sur cette période</p>
                </div>
            ) : (
                items.map(item => (
                    <div key={item.id} className="card-white p-5 rounded-[24px] border-none shadow-sm animate-in fade-in">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{item.client_name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.technician_name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-emerald-500 leading-none mb-1">{item.amount.toLocaleString()} <span className="text-[10px] opacity-40">TND</span></p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</p>
                            </div>
                        </div>
                        {item.method && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase rounded-md tracking-widest">{item.method}</span>
                            </div>
                        )}
                    </div>
                ))
            )}
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="flex flex-col gap-3">
            {items.map(item => (
                <div key={`${item.type}-${item.id}`} className="card-white p-4 rounded-[24px] border-none shadow-sm animate-in fade-in overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                item.type === 'payment' ? 'bg-emerald-500/10 text-emerald-500' :
                                item.type === 'expense' ? 'bg-rose-500/10 text-rose-500' :
                                item.type === 'advance' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-blue-500/10 text-blue-500'
                            }`}>
                                {item.type === 'payment' ? <ArrowRight size={20} /> : 
                                 item.type === 'expense' ? <Minus size={20} /> : 
                                 item.type === 'advance' ? <ArrowUpRight size={20} /> :
                                 <Plus size={20} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-1">
                                    {item.type === 'payment' ? 'Encaissement' : 
                                     item.type === 'expense' ? 'Dépense' :
                                     item.type === 'advance' ? 'Avance' : 'Versement'} • {item.technician_name}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    {new Date(item.created_at).toLocaleString()} {item.category_name ? `• ${item.category_name}` : ''}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-base font-black ${item.type === 'payment' || item.type === 'remittance' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                {item.type === 'expense' || item.type === 'advance' ? '-' : '+'}{item.amount.toLocaleString()} <span className="text-xs opacity-40">TND</span>
                            </p>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                item.status === 'validated' || item.type === 'payment' ? 'text-emerald-500' : 
                                item.status === 'rejected' ? 'text-rose-500' : 
                                'text-orange-500'
                            }`}>
                                {item.type === 'payment' ? 'ENCAISSÉ' : item.status?.toUpperCase() || 'VALIDÉ'}
                            </span>
                        </div>
                    </div>
                    
                    {(tab === 'expenses' || tab === 'advances') && (
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <button 
                                onClick={() => handleEdit(item)}
                                className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <Edit2 size={14} /> Modifier
                            </button>
                            <button 
                                onClick={() => handleDelete(item)}
                                className="h-10 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} /> Supprimer
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <PageLayout
            title="Gestion Caisse"
            subtitle="Finances Techniciens"
            showBackButton={true}
        >
            <div className="flex flex-col gap-6">
                {/* Global Stats Summary */}
                <div className="card-premium grad-blue p-6 rounded-[32px] flex items-center justify-between shadow-xl shadow-blue-500/20">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 leading-none">Total En Attente</span>
                        <h2 className="text-4xl font-black text-white tracking-tighter">
                            {tab === 'pending' ? items.reduce((sum, i) => sum + i.amount, 0).toLocaleString() : '---'} <span className="text-sm opacity-50">TND</span>
                        </h2>
                    </div>
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[20px] flex items-center justify-center text-white border border-white/20">
                        <Wallet size={32} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl">
                    {[
                        { id: 'pending', label: 'En attente' },
                        { id: 'technicians', label: 'Techs' },
                        { id: 'recettes', label: 'Recettes' },
                        { id: 'expenses', label: 'Dépenses' },
                        { id: 'advances', label: 'Avances' },
                        { id: 'history', label: 'Journal' },
                        { id: 'vehicles', label: '🚐 Véhicules' }
                    ].map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`px-3 h-10 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${tab === t.id ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Time Range Filter */}
                {(tab === 'technicians' || tab === 'recettes' || tab === 'history') && (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {[
                            { label: 'Auj.', val: 'day' },
                            { label: '7 Jours', val: 'week' },
                            { label: '30 Jours', val: 'month' },
                            { label: 'Tout', val: 'all' }
                        ].map(f => (
                            <button
                                key={f.val}
                                onClick={() => setTimeRange(f.val as any)}
                                className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${timeRange === f.val ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {tab === 'pending' && renderPending()}
                        {tab === 'technicians' && renderTechnicians()}
                        {tab === 'recettes' && renderRecettes()}
                        {(tab === 'history' || tab === 'expenses' || tab === 'advances') && renderHistory()}
                        {tab === 'vehicles' && renderVehicleStats()}
                    </>
                )}
            </div>

            {/* MANUAL INSERTION MODAL */}
            {isInsertModalOpen && insertionInfo && (
                <ModalLayout
                    title={editingItem ? 'Modifier Opération' : `Ajouter ${insertionInfo.type === 'expense' ? 'une Dépense' : 'une Avance'}`}
                    onClose={() => setIsInsertModalOpen(false)}
                    actions={
                        <button form="insert-form" type="submit" disabled={isSubmitting} className="btn-flow btn-primary w-full !h-14 disabled:opacity-50">
                            {isSubmitting ? 'ENREGISTREMENT...' : (editingItem ? 'MODIFIER' : 'VALIDER L\'OPÉRATION')}
                        </button>
                    }
                >
                    <form id="insert-form" onSubmit={handleManualInsert} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                             <Combobox 
                                label="Catégorie"
                                icon={LayoutGrid}
                                placeholder="Choisir un type..."
                                options={(insertionInfo.type === 'expense' ? expenseCategories : advanceCategories).map(cat => ({
                                    label: cat.name,
                                    value: cat.id
                                }))}
                                value={selectedCategoryId}
                                onChange={(val) => {
                                    setSelectedCategoryId(val);
                                    if (insertionInfo.type === 'expense') {
                                        const cat = expenseCategories.find(c => c.id === val);
                                        setSelectedCategoryRequiresVehicle(cat?.requires_vehicle || false);
                                        setSelectedVehicleId('');
                                    }
                                }}
                             />
                        </div>

                        {/* Vehicle selector — shown only for expense categories that require it */}
                        {insertionInfo.type === 'expense' && selectedCategoryRequiresVehicle && (
                            <div className="flex flex-col gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800">
                                <p className="text-sm font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest flex items-center gap-2">
                                    <Fuel size={14} /> Informations Carburant
                                </p>
                                <Combobox
                                    label="Véhicule"
                                    icon={Truck}
                                    placeholder="Sélectionner un véhicule..."
                                    options={vehicles.map(v => ({ label: `${v.name}${v.plate ? ' — ' + v.plate : ''}`, value: v.id }))}
                                    value={selectedVehicleId}
                                    onChange={setSelectedVehicleId}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Kilométrage</label>
                                        <input name="kilometers" type="number" placeholder="Ex: 12400"
                                            className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-base" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Litres</label>
                                        <input name="liters" type="number" step="0.1" placeholder="Ex: 45"
                                            className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-base" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (TND)</label>
                                <input 
                                    name="amount" type="number" step="0.01" required placeholder="0.00"
                                    defaultValue={editingItem?.amount}
                                    className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-black text-2xl"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                <input 
                                    name="date" type="date" required 
                                    defaultValue={editingItem?.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                                    className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-bold text-lg"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Motif</label>
                            <textarea 
                                name="description" rows={2} placeholder="Précisez la raison..."
                                defaultValue={(editingItem as any)?.description}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-base"
                            />
                        </div>
                    </form>
                </ModalLayout>
            )}
            {/* COLLECT MODAL — Admin récupère la caisse d'un technicien */}
            {isCollectModalOpen && collectTarget && (
                <ModalLayout
                    title={`Récupérer la caisse`}
                    onClose={() => setIsCollectModalOpen(false)}
                    actions={
                        <button
                            form="collect-form"
                            type="submit"
                            disabled={isCollecting || Number(collectAmount) <= 0}
                            className="btn-flow btn-primary w-full !h-14 disabled:opacity-50"
                        >
                            {isCollecting ? 'ENREGISTREMENT...' : `CONFIRMER LA RÉCUPÉRATION`}
                        </button>
                    }
                >
                    <form id="collect-form" onSubmit={handleCollect} className="flex flex-col gap-6">

                        {/* Tech info banner */}
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                <Users size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Technicien</p>
                                <p className="text-lg font-black text-slate-800 dark:text-white uppercase">{collectTarget.techName}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Solde dû</p>
                                <p className="text-2xl font-black text-emerald-600">{collectTarget.balance.toLocaleString()} <span className="text-sm opacity-60">TND</span></p>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant récupéré (TND)</label>
                                {collectTarget.balance > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setCollectAmount(collectTarget.balance.toString())}
                                        className="text-xs font-black text-primary uppercase tracking-wider hover:underline"
                                    >
                                        Tout récupérer
                                    </button>
                                )}
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={collectAmount}
                                onChange={(e) => setCollectAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-16 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 focus:border-primary rounded-2xl px-6 font-black text-3xl text-slate-800 dark:text-white outline-none transition-colors"
                            />
                        </div>

                        {/* Method */}
                        <div className="flex flex-col gap-3">
                            <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Mode de remise</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'cash', label: 'Espèces', icon: <Banknote size={20} /> },
                                    { value: 'check', label: 'Chèque', icon: <Wallet size={20} /> },
                                    { value: 'transfer', label: 'Virement', icon: <ArrowRight size={20} /> }
                                ].map(m => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setCollectMethod(m.value as any)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                                            collectMethod === m.value
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600'
                                                : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        {m.icon}
                                        <span className="text-xs font-black uppercase">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Note */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Note (optionnel)</label>
                            <textarea
                                rows={2}
                                value={collectNote}
                                onChange={(e) => setCollectNote(e.target.value)}
                                placeholder="Ex: Remise journée du 18/03..."
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-base text-slate-700 dark:text-slate-300"
                            />
                        </div>
                    </form>
                </ModalLayout>
            )}
        </PageLayout>
    );
};

export default AdminFinance;
