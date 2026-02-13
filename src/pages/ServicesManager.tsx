import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Search,
    Loader2,
    Edit2,
    Trash2,
    Scissors,
    Zap,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

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
            fetchServices();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Supprimer "${name}" ?`)) return;
        setLoading(true);
        try {
            await supabase.from('services').delete().eq('id', id);
            fetchServices();
        } catch (error: any) { alert(error.message); }
        finally { setLoading(false); }
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container pb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/')} className="btn-pill btn-outline" style={{ padding: '0.75rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="welcome-text" style={{ fontSize: '1.75rem' }}>Catalogue Services</h1>
                        <p className="date-text">GESTION DES TARIFS & PRESTATIONS</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleOpenModal()} className="btn-pill btn-outline" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <Plus size={18} /> NOUVEAU
                    </button>
                    <button className="btn-pill btn-primary" style={{ background: 'var(--grad-purple)', border: 'none' }}>
                        <Zap size={18} /> ACTION RAPIDE
                    </button>
                </div>
            </div>

            <div className="relative mb-10">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher une prestation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-premium"
                    style={{ paddingLeft: '4rem', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.03)' }}
                />
            </div>

            <div className="space-y-4">
                {loading && services.length === 0 ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
                ) : filteredServices.map(service => (
                    <div key={service.id} className="premium-card flex justify-between items-center group">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                <Scissors size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-white text-base uppercase tracking-tight">{service.name}</h4>
                                <p className="text-[10px] text-muted font-black tracking-widest mt-1">ID: {service.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="hidden lg:block">
                                <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Status</p>
                                <span className="text-[10px] font-black py-1 px-3 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">ACTIF</span>
                            </div>
                            <div className="text-right min-w-[100px]">
                                <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Prix Unitaire</p>
                                <p className="font-black text-xl text-white">{service.price.toFixed(0)} <span className="text-xs">DT</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenModal(service)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted hover:bg-white/10 hover:text-white transition-all">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(service.id, service.name)} className="w-10 h-10 rounded-full bg-pink-500/5 flex items-center justify-center text-pink-500/50 hover:bg-pink-500/20 hover:text-pink-500 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', padding: '2.5rem' }}>
                        <h2 className="welcome-text mb-8" style={{ fontSize: '1.5rem', background: 'none', webkitTextFillColor: 'white' }}>{editingService ? 'Modifier Service' : 'Nouveau Service'}</h2>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <label className="mini-stat-label">Libellé de la prestation</label>
                                <input
                                    type="text" className="form-input" required
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Nettoyage Filtre"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="mini-stat-label">Tarif de base (TND)</label>
                                <input
                                    type="number" step="1" className="form-input" required
                                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-pill btn-outline flex-1">Annuler</button>
                                <button type="submit" className="btn-pill btn-primary flex-1">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesManager;
