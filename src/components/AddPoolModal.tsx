import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import ModalLayout from './ModalLayout';
import { toast } from 'react-hot-toast';
import Input from './ui/Input';
import Button from './ui/Button';
import PhotoUpload from './ui/PhotoUpload';
import { Plus, X } from 'lucide-react';

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
        filter_type: 'sand',
        is_contracted: false,
        maintenance_frequency: 'weekly',
        preferred_day: '1',
        template_id: '',
        technician_id: ''
    });
    const [photos, setPhotos] = useState<string[]>([]);

    const [templates, setTemplates] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            const [tRes, techRes] = await Promise.all([
                supabase.from('intervention_templates').select('id, name').order('name'),
                supabase.from('technicians').select('id, full_name').eq('active', true).order('full_name')
            ]);
            if (tRes.data) setTemplates(tRes.data);
            if (techRes.data) setTechnicians(techRes.data);
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: poolData, error } = await supabase
                .from('pools')
                .insert([{
                    client_id: clientId,
                    name: formData.name || 'Piscine',
                    volume_m3: formData.volume_m3 ? parseFloat(formData.volume_m3) : 0,
                    lining_type: formData.lining_type,
                    treatment_method: formData.treatment_method,
                    filter_type: formData.filter_type,
                    is_contracted: formData.is_contracted,
                    maintenance_frequency: formData.maintenance_frequency,
                    preferred_day: parseInt(formData.preferred_day)
                }])
                .select()
                .single();

            if (error) throw error;

            if (formData.is_contracted && poolData) {
                await supabase.from('recurrence_rules').insert([{
                    pool_id: poolData.id,
                    template_id: formData.template_id || null,
                    technician_id: formData.technician_id || null,
                    frequency: formData.maintenance_frequency,
                    day_of_week: parseInt(formData.preferred_day),
                    active: true
                }]);
            }

            // Insertion des photos
            if (photos.length > 0 && poolData) {
                const photosToInsert = photos.map((url, index) => ({
                    pool_id: poolData.id,
                    url: url,
                    is_main: index === 0 // La première photo est la principale par défaut
                }));
                const { error: photoError } = await supabase.from('pool_photos').insert(photosToInsert);
                if (photoError) throw photoError;
            }

            toast.success('Bassin ajouté avec succès ✓');
            onSuccess();
            onClose();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
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
                VALIDER
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
                <div className="flex items-center gap-4 mb-2 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 dark:border-primary/20">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        <Waves size={24} />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Configuration technique</p>
                        <h3 className="text-lg font-bold uppercase text-slate-800 dark:text-white leading-none">Détails du bassin</h3>
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

                <div className="flex flex-col gap-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-800/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                            </div>
                            <div>
                                <h4 className="text-[13px] font-black uppercase text-slate-800 dark:text-white tracking-widest">Contrat Entretien</h4>
                                <p className="text-[13px] font-bold text-slate-500 uppercase tracking-tight">Planification automatique</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_contracted: !formData.is_contracted })}
                            className={`w-12 h-6 rounded-full transition-all relative ${formData.is_contracted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_contracted ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {formData.is_contracted && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black uppercase text-slate-500 ml-1">Modèle d'intervention</label>
                                <select
                                    className="w-full h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-medium"
                                    value={formData.template_id}
                                    onChange={e => setFormData({ ...formData, template_id: e.target.value })}
                                >
                                    <option value="">(Aucun modèle)</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black uppercase text-slate-500 ml-1">Technicien attitré</label>
                                <select
                                    className="w-full h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-medium"
                                    value={formData.technician_id}
                                    onChange={e => setFormData({ ...formData, technician_id: e.target.value })}
                                >
                                    <option value="">(Auto / Non assigné)</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black uppercase text-slate-500 ml-1">Fréquence</label>
                                <select
                                    className="w-full h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-medium"
                                    value={formData.maintenance_frequency}
                                    onChange={e => setFormData({ ...formData, maintenance_frequency: e.target.value })}
                                >
                                    <option value="weekly">Hebdomadaire (7j)</option>
                                    <option value="biweekly">Quinzomadaire (14j)</option>
                                    <option value="monthly">Mensuelle (30j)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black uppercase text-slate-500 ml-1">Jour préféré</label>
                                <select
                                    className="w-full h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-medium"
                                    value={formData.preferred_day}
                                    onChange={e => setFormData({ ...formData, preferred_day: e.target.value })}
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

                {/* Section Photos */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Photos du Bassin</label>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            {photos.length} Photo(s)
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {photos.map((url, index) => (
                            <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 group">
                                <img src={url} alt={`Bassin ${index}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <X size={14} />
                                </button>
                                {index === 0 && (
                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-md shadow-lg">
                                        Principale
                                    </span>
                                )}
                            </div>
                        ))}
                        
                        <div className="flex flex-col">
                           <PhotoUpload 
                                label="Ajouter une photo" 
                                bucket="pools"
                                onUploadComplete={(url) => setPhotos([...photos, url])} 
                            />
                        </div>
                    </div>
                </div>
            </form>
        </ModalLayout>
    );
};

export default AddPoolModal;
