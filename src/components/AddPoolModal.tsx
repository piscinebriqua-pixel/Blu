import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Droplets, Save, Loader2, Waves } from 'lucide-react';

interface AddPoolModalProps {
    clientId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AddPoolModal: React.FC<AddPoolModalProps> = ({ clientId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: 'Piscine Principale',
        volume_m3: '',
        lining_type: 'liner',
        treatment_method: 'chlorine',
        filter_type: 'sand'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('pools')
                .insert([{
                    client_id: clientId,
                    name: formData.name || 'Piscine',
                    volume_m3: formData.volume_m3 ? parseFloat(formData.volume_m3) : 0,
                    lining_type: formData.lining_type,
                    treatment_method: formData.treatment_method,
                    filter_type: formData.filter_type
                }]);

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
            <div className="modal-content" style={{ maxWidth: '450px' }}>
                <button className="bg-[#242b38] p-2 rounded-lg text-muted hover:text-white transition-colors border-none absolute top-8 right-8 cursor-pointer" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                        <Waves className="text-cyan-500" size={24} />
                    </div>
                    <h2 className="welcome-text" style={{ fontSize: '1.25rem', margin: 0 }}>Nouveau Bassin</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="mini-stat-label">Nom du bassin</label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            placeholder="Piscine Principale, Spa, etc."
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ paddingLeft: '1.25rem' }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="mini-stat-label">Volume d'eau (m³)</label>
                        <div className="relative">
                            <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="number"
                                className="form-input"
                                required
                                style={{ paddingLeft: '3.5rem' }}
                                placeholder="Ex: 45"
                                value={formData.volume_m3}
                                onChange={e => setFormData({ ...formData, volume_m3: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="mini-stat-label">Méthode de traitement</label>
                        <select
                            className="form-input"
                            value={formData.treatment_method}
                            onChange={e => setFormData({ ...formData, treatment_method: e.target.value })}
                            style={{ paddingLeft: '1.25rem' }}
                        >
                            <option value="chlorine">🧪 Traitement au Chlore</option>
                            <option value="salt">🧂 Électrolyse au Sel</option>
                            <option value="bromine">💎 Traitement au Brome</option>
                            <option value="active_oxygen">💨 Oxygène Actif</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-primary w-full h-14 mt-4" disabled={loading} style={{ background: 'var(--blue)' }}>
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={20} /> AJOUTER LA STRUCTURE</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddPoolModal;
