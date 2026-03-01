import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    FileText,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    User,
    Calendar,
    ArrowUpRight,
    Plus,
    Edit2,
    Trash2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import AddDevisModal from '../components/AddDevisModal';

interface Devis {
    id: string;
    number: string;
    title: string;
    total_amount: number;
    status: 'pending' | 'closed' | 'cancelled';
    created_at: string;
    client_id: string;
    client?: {
        first_name: string;
        last_name: string;
        city: string;
    };
}

const Chantiers: React.FC = () => {
    const navigate = useNavigate();
    const [devis, setDevis] = useState<Devis[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'closed' | 'cancelled'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDevisId, setEditingDevisId] = useState<string | undefined>(undefined);
    const [devisToDelete, setDevisToDelete] = useState<Devis | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchDevis();
    }, []);

    const fetchDevis = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('devis')
                .select(`
                    *,
                    client:clients(first_name, last_name, city)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDevis(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: 'pending' | 'closed' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('devis')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            fetchDevis();
            toast.success('Statut mis à jour');
        } catch (error) {
            console.error('Erreur status:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleDeleteDevis = async () => {
        if (!devisToDelete) return;
        setIsDeleting(true);
        try {
            // First delete associated items (Supabase usually handles this via cascade, but good to be safe if not configured)
            await supabase.from('devis_items').delete().eq('devis_id', devisToDelete.id);

            const { error } = await supabase
                .from('devis')
                .delete()
                .eq('id', devisToDelete.id);

            if (error) throw error;
            toast.success(`Devis ${devisToDelete.number} supprimé`);
            setDevisToDelete(null);
            fetchDevis();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredDevis = devis.filter(d => {
        const matchesSearch =
            d.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${d.client?.first_name} ${d.client?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = activeFilter === 'all' || d.status === activeFilter;

        return matchesSearch && matchesFilter;
    });

    const stats = {
        pending: devis.filter(d => d.status === 'pending').length,
        closed: devis.filter(d => d.status === 'closed').length,
        cancelled: devis.filter(d => d.status === 'cancelled').length
    };

    const toolbar = (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un devis, numéro ou client..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-base font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex overflow-x-auto bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setActiveFilter('pending')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeFilter === 'pending' ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' : 'text-slate-400'}`}
                    >
                        En cours ({stats.pending})
                    </button>
                    <button
                        onClick={() => setActiveFilter('closed')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeFilter === 'closed' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                    >
                        Clôturés ({stats.closed})
                    </button>
                    <button
                        onClick={() => setActiveFilter('cancelled')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeFilter === 'cancelled' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400'}`}
                    >
                        Annulés ({stats.cancelled})
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <PageLayout title="Gestion des Chantiers" subtitle="Chargement..." showBackButton={true}>
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-4"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Récupération des devis...</p>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Gestion des Chantiers"
            subtitle="Suivi des devis et travaux"
            showBackButton={true}
            toolbar={toolbar}
        >
            <div className="flex flex-col gap-4">
                {filteredDevis.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                        <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Aucun devis trouvé</h3>
                    </div>
                ) : (
                    filteredDevis.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${item.status === 'closed' ? 'bg-emerald-500' :
                                item.status === 'cancelled' ? 'bg-rose-500' : 'bg-blue-500'
                                }`} />

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.status === 'closed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                                        item.status === 'cancelled' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                        }`}>
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.number}</span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${item.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                                                item.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {item.status === 'closed' ? 'Clôturé' : item.status === 'cancelled' ? 'Annulé' : 'En cours'}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase truncate tracking-tight group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <User size={12} className="text-slate-400" />
                                                {item.client?.first_name} {item.client?.last_name}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <Calendar size={12} className="text-slate-400" />
                                                {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Devis</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{item.total_amount.toFixed(0)}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">DT</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {item.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(item.id, 'closed')}
                                                    className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center"
                                                    title="Clôturer le devis"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(item.id, 'cancelled')}
                                                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                                                    title="Annuler le devis"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </>
                                        )}
                                        {item.status !== 'pending' && (
                                            <button
                                                onClick={() => handleStatusChange(item.id, 'pending')}
                                                className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-600 hover:text-white transition-all flex items-center justify-center"
                                                title="Remettre en cours"
                                            >
                                                <Clock size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditingDevisId(item.id)}
                                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                                            title="Modifier le devis"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDevisToDelete(item)}
                                            className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                                            title="Supprimer le devis"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/client/${item.client_id}`)}
                                            className="w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                                            title="Voir Client"
                                        >
                                            <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fab-adaptive w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary-dark hover:scale-110 active:scale-95 transition-all"
                aria-label="Nouveau Devis"
            >
                <Plus size={28} />
            </button>

            {(isAddModalOpen || editingDevisId) && (
                <AddDevisModal
                    devisId={editingDevisId}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingDevisId(undefined);
                    }}
                    onSuccess={fetchDevis}
                />
            )}

            {/* Modal de suppression */}
            {devisToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDevisToDelete(null)} />
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} className="text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Supprimer ce devis ?</h2>
                        <p className="text-center justify-center flex items-center gap-2 text-slate-500 mb-8 font-medium">
                            Êtes-vous sûr de vouloir supprimer définitivement le devis <strong className="font-bold text-slate-6e00">{devisToDelete.number}</strong> ? Cette action est irréversible.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDevisToDelete(null)}
                                className="flex-1 py-4 px-6 rounded-2xl font-black text-sm text-slate-600 uppercase tracking-widest bg-slate-100 hover:bg-slate-200 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteDevis}
                                disabled={isDeleting}
                                className="flex-1 py-4 px-6 rounded-2xl font-black text-sm text-white uppercase tracking-widest bg-rose-500 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting ? 'Suppression...' : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
};

export default Chantiers;
