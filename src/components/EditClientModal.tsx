import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, Phone, MapPin, Save, Loader2, Mail, Building, Edit2 } from 'lucide-react';

interface EditClientModalProps {
    client: any;
    onClose: () => void;
    onSuccess: () => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ client, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        notes: client.notes || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    notes: formData.notes
                })
                .eq('id', client.id);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '550px' }}>
                <button className="bg-[#242b38] p-2 rounded-lg text-muted hover:text-white transition-colors border-none absolute top-8 right-8 cursor-pointer" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                        <Edit2 className="text-blue-500" size={24} />
                    </div>
                    <h2 className="welcome-text" style={{ fontSize: '1.25rem', margin: 0 }}>Modifier la fiche</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="mini-stat-label">Prénom</label>
                            <input
                                type="text" className="form-input" required
                                value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                style={{ paddingLeft: '1.25rem' }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mini-stat-label">Nom</label>
                            <input
                                type="text" className="form-input" required
                                value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                style={{ paddingLeft: '1.25rem' }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="mini-stat-label">Téléphone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                <input
                                    type="tel" className="form-input" style={{ paddingLeft: '3rem' }}
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="mini-stat-label">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                <input
                                    type="email" className="form-input" style={{ paddingLeft: '3rem' }}
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="mini-stat-label">Adresse Physique</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="text" className="form-input" style={{ paddingLeft: '3rem' }}
                                value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="mini-stat-label">Ville</label>
                        <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="text" className="form-input" style={{ paddingLeft: '3rem' }}
                                value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="mini-stat-label">Notes & Observations privées</label>
                        <textarea
                            className="form-input" rows={3}
                            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            style={{ paddingLeft: '1.25rem' }}
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full h-14 mt-4" disabled={loading} style={{ background: 'var(--blue)' }}>
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={20} /> METTRE À JOUR LA FICHE</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditClientModal;
