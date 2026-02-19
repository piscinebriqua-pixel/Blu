import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Droplets, Waves } from 'lucide-react';
import ModalLayout from './ModalLayout';
import Input from './ui/Input';
import Button from './ui/Button';

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

    const actions = (
        <div className="flex gap-2 w-full">
            <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
            >
                ANNULER
            </Button>
            <Button
                type="submit"
                form="add-pool-form"
                className="flex-[2]"
                loading={loading}
            >
                AJOUTER LE BASSIN
            </Button>
        </div>
    );

    return (
        <ModalLayout
            title="NOUVEAU BASSIN"
            onClose={onClose}
            actions={actions}
        >
            <form id="add-pool-form" onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4 mb-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        <Waves size={24} />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration technique</p>
                        <h3 className="text-lg font-bold uppercase text-slate-800 leading-none">Détails du bassin</h3>
                    </div>
                </div>

                <Input
                    label="Nom du bassin"
                    required
                    placeholder="Piscine Principale, Spa, etc."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />

                <Input
                    label="Volume d'eau (m³)"
                    icon={Droplets}
                    type="number"
                    required
                    placeholder="Ex: 45"
                    value={formData.volume_m3}
                    onChange={e => setFormData({ ...formData, volume_m3: e.target.value })}
                />

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Méthode de traitement</label>
                    <div className="relative">
                        <select
                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-medium text-slate-700 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            value={formData.treatment_method}
                            onChange={e => setFormData({ ...formData, treatment_method: e.target.value })}
                        >
                            <option value="chlorine">🧪 Traitement au Chlore</option>
                            <option value="salt">🧂 Électrolyse au Sel</option>
                            <option value="bromine">💎 Traitement au Brome</option>
                            <option value="active_oxygen">💨 Oxygène Actif</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>
            </form>
        </ModalLayout>
    );
};

export default AddPoolModal;
