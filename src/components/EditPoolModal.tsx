import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Droplets, Waves, Calendar, AlertCircle } from 'lucide-react';
import ModalLayout from './ModalLayout';
import Input from './ui/Input';
import Button from './ui/Button';

interface Pool {
    id: string;
    name: string;
    volume_m3: number;
    treatment_method: string;
    lining_type: string;
    filter_type: string;
    is_contracted: boolean;
    maintenance_frequency: string;
    preferred_day: number;
}

interface EditPoolModalProps {
    pool: Pool;
    onClose: () => void;
    onSuccess: () => void;
}

const EditPoolModal: React.FC<EditPoolModalProps> = ({ pool, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: pool.name,
        volume_m3: pool.volume_m3.toString(),
        lining_type: pool.lining_type || 'liner',
        treatment_method: pool.treatment_method || 'chlorine',
        filter_type: pool.filter_type || 'sand',
        is_contracted: pool.is_contracted || false,
        maintenance_frequency: pool.maintenance_frequency || 'weekly',
        preferred_day: pool.preferred_day?.toString() || '1'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('pools')
                .update({
                    name: formData.name,
                    volume_m3: parseFloat(formData.volume_m3),
                    lining_type: formData.lining_type,
                    treatment_method: formData.treatment_method,
                    filter_type: formData.filter_type,
                    is_contracted: formData.is_contracted,
                    maintenance_frequency: formData.maintenance_frequency,
                    preferred_day: parseInt(formData.preferred_day)
                })
                .eq('id', pool.id);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Une erreur est survenue');
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
                form="edit-pool-form"
                className="flex-[2]"
                loading={loading}
            >
                ENREGISTRER
            </Button>
        </div>
    );

    return (
        <ModalLayout
            title="MODIFIER LE BASSIN"
            onClose={onClose}
            actions={actions}
        >
            <form id="edit-pool-form" onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4 mb-2 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 dark:border-primary/20">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        <Waves size={24} />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Configuration technique</p>
                        <h3 className="text-lg font-bold uppercase text-slate-800 dark:text-white leading-none">{pool.name}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Nom du bassin"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label="Volume (m³)"
                        icon={Droplets}
                        type="number"
                        required
                        value={formData.volume_m3}
                        onChange={e => setFormData({ ...formData, volume_m3: e.target.value })}
                    />
                </div>

                {/* Maintenance Section */}
                <div className="flex flex-col gap-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-800/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest">Contrat Entretien</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Planification automatique</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_contracted: !formData.is_contracted })}
                            className={`w-12 h-6 rounded-full transition-all relative ${formData.is_contracted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            title="Activer le contrat"
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_contracted ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {formData.is_contracted && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fréquence</label>
                                <select
                                    className="search-input !h-12 text-sm"
                                    value={formData.maintenance_frequency}
                                    onChange={e => setFormData({ ...formData, maintenance_frequency: e.target.value })}
                                    title="Fréquence d'entretien"
                                >
                                    <option value="weekly">Hebdomadaire (7j)</option>
                                    <option value="biweekly">Quinzomadaire (14j)</option>
                                    <option value="monthly">Mensuelle (30j)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Jour préféré</label>
                                <select
                                    className="search-input !h-12 text-sm"
                                    value={formData.preferred_day}
                                    onChange={e => setFormData({ ...formData, preferred_day: e.target.value })}
                                    title="Jour de passage préféré"
                                >
                                    <option value="1">Lundi</option>
                                    <option value="2">Mardi</option>
                                    <option value="3">Mercredi</option>
                                    <option value="4">Jeudi</option>
                                    <option value="5">Vendredi</option>
                                    <option value="6">Samedi</option>
                                    <option value="0">Dimanche</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/20">
                    <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-orange-700 dark:text-orange-300 leading-normal">
                        L'activation du contrat créera automatiquement la prochaine visite dès qu'une intervention est marquée comme terminée.
                    </p>
                </div>
            </form>
        </ModalLayout>
    );
};

export default EditPoolModal;
