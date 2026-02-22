import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
    Loader2,
    Edit2,
    Trash2,
    Wrench,
    Plus,
    Search as SearchIcon,
    Wallet,
    X
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface Service {
    id: string;
    name: string;
    price: number;
}

const ServicesManager: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState({ name: '', price: '' });
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => { fetchServices(); }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('name');
            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (service: Service | null = null) => {
        if (service) {
            setEditingService(service);
            setFormData({ name: service.name, price: service.price.toString() });
        } else {
            setEditingService(null);
            setFormData({ name: '', price: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                price: parseFloat(formData.price) || 0
            };
            if (editingService) {
                await supabase.from('services').update(payload).eq('id', editingService.id);
            } else {
                await supabase.from('services').insert([payload]);
            }
            setIsModalOpen(false);
            toast.success(editingService ? 'Service mis à jour ✓' : 'Service ajouté ✓');
            fetchServices();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!serviceToDelete) return;
        setIsDeleting(true);
        try {
            await supabase.from('services').delete().eq('id', serviceToDelete.id);
            toast.success('Service supprimé');
            setServiceToDelete(null);
            fetchServices();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toolbar = (
        <div className="flex items-center gap-3">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={16} />
                <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-9 pr-4 py-2.5 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 rounded-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 w-44"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button
                onClick={() => handleOpenModal()}
                aria-label="Ajouter un service"
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md"
            >
                <Plus size={20} />
            </button>
        </div>
    );

    return (
        <PageLayout
            title="Services"
            subtitle={`${filteredServices.length} prestation${filteredServices.length > 1 ? 's' : ''} enregistrée${filteredServices.length > 1 ? 's' : ''}`}
            toolbar={toolbar}
            loading={loading && services.length === 0}
            showBackButton={true}
        >
            <div className="flex flex-col gap-3">

                {/* Empty State */}
                {filteredServices.length === 0 && !loading && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500">
                            <Wrench size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Aucun service</h3>
                            <p className="text-slate-400 text-sm mt-1">Ajoutez votre première prestation.</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> Ajouter un service
                        </button>
                    </div>
                )}

                {/* Service Cards */}
                {filteredServices.map(service => (
                    <div
                        key={service.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all group"
                    >
                        {/* Icon + Name */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                                <Wrench size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-slate-800 dark:text-white text-sm truncate">{service.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disponible</span>
                                </div>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1 flex-shrink-0">
                            <span className="text-xl font-black text-slate-800 dark:text-white">{service.price.toFixed(0)}</span>
                            <span className="text-xs font-bold text-slate-400">DT</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                                onClick={() => handleOpenModal(service)}
                                aria-label="Modifier"
                                className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => setServiceToDelete(service)}
                                aria-label="Supprimer"
                                className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Modal Ajouter / Modifier ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-slate-100 dark:border-slate-700">

                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-7">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">
                                    {editingService ? 'Modifier le service' : 'Nouveau service'}
                                </h2>
                                <p className="text-slate-400 text-sm mt-0.5">
                                    {editingService ? 'Mettre à jour la prestation' : 'Ajouter au catalogue'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                aria-label="Fermer"
                                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                    Nom de la prestation
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Entretien mensuel, Hivernage..."
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                    Tarif (DT)
                                </label>
                                <div className="relative">
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 text-xs uppercase flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="animate-spin" size={16} />}
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Confirm Delete ── */}
            <ConfirmModal
                isOpen={!!serviceToDelete}
                title="Supprimer ce service ?"
                message={`Voulez-vous vraiment supprimer la prestation "${serviceToDelete?.name}" ? Cette action est irréversible.`}
                confirmLabel="SUPPRIMER"
                onConfirm={handleDelete}
                onClose={() => setServiceToDelete(null)}
                loading={isDeleting}
            />
        </PageLayout>
    );
};

export default ServicesManager;
