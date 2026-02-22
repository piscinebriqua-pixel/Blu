import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import ModalLayout from '../components/ModalLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
    Loader2,
    Edit2,
    Trash2,
    Scissors,
    Plus,
    Search as SearchIcon,
    Wallet
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
        setLoading(true);
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
            toast.success(editingService ? 'Service mis à jour' : 'Service ajouté');
            fetchServices();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
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
        <div className="flex items-center justify-between w-full gap-3">
            <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                    type="text"
                    placeholder="Rechercher un service..."
                    className="search-input !pl-10 h-[44px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="btn-primary h-[44px] !px-4" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                <span className="hidden sm:inline">AJOUTER</span>
            </button>
        </div>
    );

    return (
        <PageLayout
            title="CATALOGUE"
            subtitle={`${filteredServices.length} prestations enregistrées`}
            toolbar={toolbar}
            loading={loading && services.length === 0}
            showBackButton={true}
        >
            <div className="data-grid grid-2 !gap-3">
                {filteredServices.map(service => (
                    <div key={service.id} className="card-premium group hover:border-primary/50 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary-glow flex-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                                <Scissors size={18} />
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleOpenModal(service)} className="btn-icon !w-8 !h-8 !border-none" title="Modifier">
                                    <Edit2 size={14} className="text-primary" />
                                </button>
                                <button onClick={() => setServiceToDelete(service)} className="btn-icon !w-8 !h-8 !border-none" title="Supprimer">
                                    <Trash2 size={14} className="text-status-red" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-column mb-3">
                            <h4 className="text-xs font-black text-white uppercase leading-tight truncate">{service.name}</h4>
                            <p className="text-[8px] text-muted font-bold tracking-widest mt-0.5">#{service.id.slice(0, 8).toUpperCase()}</p>
                        </div>

                        <div className="pt-3 border-t border-border-subtle flex justify-between items-end">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
                                <span className="text-[8px] font-black text-muted uppercase">Disponible</span>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-white">
                                    <p className="text-sm font-black">{service.price.toFixed(0)}</p>
                                    <span className="text-[9px] font-bold opacity-60">DT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <ModalLayout
                    title={editingService ? 'Modifier Service' : 'Nouveau Service'}
                    onClose={() => setIsModalOpen(false)}
                    actions={
                        <button
                            type="submit"
                            form="service-form"
                            className="btn-primary w-full h-[54px]"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'ENREGISTRER LA PRESTATION'}
                        </button>
                    }
                >
                    <form id="service-form" onSubmit={handleSave} className="flex-column gap-6">
                        <div className="flex-column gap-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Libellé de la prestation</label>
                            <input
                                type="text"
                                className="search-input"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Nettoyage Filtre"
                            />
                        </div>
                        <div className="flex-column gap-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Tarif de base (TND)</label>
                            <div className="relative">
                                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                <input
                                    type="number"
                                    step="1"
                                    className="search-input !pl-12"
                                    required
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </form>
                </ModalLayout>
            )}

            <ConfirmModal
                isOpen={!!serviceToDelete}
                title="Supprimer Service"
                message={`Voulez-vous vraiment supprimer la prestation "${serviceToDelete?.name}" ?`}
                confirmLabel="SUPPRIMER"
                onConfirm={handleDelete}
                onClose={() => setServiceToDelete(null)}
                loading={isDeleting}
            />
        </PageLayout>
    );
};

export default ServicesManager;
