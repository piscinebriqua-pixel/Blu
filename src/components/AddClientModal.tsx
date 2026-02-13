import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, Phone, MapPin, Save, Loader2, UserPlus } from 'lucide-react';

interface AddClientModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error: clientError } = await supabase
                .from('clients')
                .insert([{
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    address: formData.address,
                    notes: formData.notes,
                    balance: 0
                }]);

            if (clientError) throw clientError;

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
            <div className="modal-content">
                <button className="bg-[#242b38] p-2 rounded-lg text-muted hover:text-white transition-colors border-none absolute top-8 right-8 cursor-pointer" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <UserPlus className="text-indigo-500" size={24} />
                    </div>
                    <h2 className="welcome-text" style={{ fontSize: '1.25rem', margin: 0 }}>Nouveau Client</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="mini-stat-label">Prénom</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={formData.first_name}
                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="Jean"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="mini-stat-label">Nom</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={formData.last_name}
                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                placeholder="Dupont"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="mini-stat-label">Téléphone (WhatsApp)</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="tel"
                                className="form-input"
                                required
                                style={{ paddingLeft: '3rem' }}
                                placeholder="+216 ..."
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="mini-stat-label">Adresse de la Piscine</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="text"
                                className="form-input"
                                required
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Cité El Mourouj, Tunis..."
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full h-14 mt-4" disabled={loading} style={{ background: 'var(--blue)' }}>
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={20} /> ENREGISTRER LE CLIENT</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddClientModal;
