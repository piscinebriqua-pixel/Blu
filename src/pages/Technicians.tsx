import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Search,
    Phone,
    Loader2,
    Edit2,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Mail,
    ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Technician {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    photo_url: string;
    active: boolean;
}

const Technicians: React.FC = () => {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTech, setEditingTech] = useState<Technician | null>(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        active: true
    });

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('technicians')
                .select('*')
                .order('full_name');

            if (error) throw error;
            setTechnicians(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (tech: Technician | null = null) => {
        if (tech) {
            setEditingTech(tech);
            setFormData({
                full_name: tech.full_name,
                phone: tech.phone || '',
                email: tech.email || '',
                active: tech.active
            });
        } else {
            setEditingTech(null);
            setFormData({
                full_name: '',
                phone: '',
                email: '',
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingTech) {
                const { error } = await supabase.from('technicians').update(formData).eq('id', editingTech.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('technicians').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchTechnicians();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (tech: Technician) => {
        try {
            const { error } = await supabase.from('technicians').update({ active: !tech.active }).eq('id', tech.id);
            if (error) throw error;
            fetchTechnicians();
        } catch (error: any) { alert(error.message); }
    };

    const filteredTechnicians = technicians.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.phone && t.phone.includes(searchTerm))
    );

    return (
        <div className="page-container pb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/')} className="btn-pill btn-outline" style={{ padding: '0.75rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="welcome-text" style={{ fontSize: '1.75rem' }}>L'Équipe</h1>
                        <p className="date-text">{technicians.length} TECHNICIENS ACTIFS</p>
                    </div>
                </div>
                <button className="btn-pill btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Ajouter un Membre
                </button>
            </div>

            <div className="relative mb-10">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher un technicien..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-premium"
                    style={{ paddingLeft: '4rem', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.03)' }}
                />
            </div>

            {loading && technicians.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                </div>
            ) : (
                <div className="cards-grid">
                    {filteredTechnicians.map(tech => (
                        <div key={tech.id} className="premium-card relative group" style={{ opacity: tech.active ? 1 : 0.6 }}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-xl font-black text-orange-500 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    {tech.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => toggleStatus(tech)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-muted hover:text-white transition-all border-none cursor-pointer">
                                        {tech.active ? <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} /> : <XCircle size={16} style={{ color: 'var(--accent-pink)' }} />}
                                    </button>
                                    <button onClick={() => handleOpenModal(tech)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-muted hover:text-white transition-all border-none cursor-pointer">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-black uppercase tracking-tight text-white mb-2">{tech.full_name}</h3>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-muted text-xs font-bold">
                                    <Phone size={12} className="text-blue-400" />
                                    <span>{tech.phone || 'Non renseigné'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted text-xs font-bold">
                                    <Mail size={12} className="text-purple-400" />
                                    <span>{tech.email || 'Pas d\'email'}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className={`text-[10px] font-black tracking-[0.2em] ${tech.active ? 'text-blue-400' : 'text-muted'}`}>
                                    {tech.active ? 'OPÉRATIONNEL' : 'HORS LIGNE'}
                                </span>
                                <ShieldAlert size={14} className={tech.active ? 'text-green-500' : 'text-pink-500'} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', padding: '2.5rem' }}>
                        <h2 className="welcome-text mb-8" style={{ fontSize: '1.5rem', background: 'none', WebkitTextFillColor: 'white' }}>{editingTech ? 'Détails Membre' : 'Nouveau Membre'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="mini-stat-label">Identité Complète</label>
                                <input
                                    type="text" className="form-input" required
                                    value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Nom & Prénom"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="mini-stat-label">Contact Téléphone</label>
                                    <input
                                        type="tel" className="form-input"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+216"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="mini-stat-label">Adresse Email</label>
                                    <input
                                        type="email" className="form-input"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@blu.com"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-pill btn-outline flex-1">Fermer</button>
                                <button type="submit" className="btn-pill btn-primary flex-1" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Technicians;
