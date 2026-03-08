import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
    Loader2,
    Edit2,
    Trash2,
    Plus,
    Search as SearchIcon,
    X,
    ClipboardList,
    CheckSquare,
    Square,
    Wrench,
    Package,
    Save
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

interface Template {
    id: string;
    name: string;
    description: string;
    task_balai: boolean;
    task_lavage: boolean;
    task_rincage: boolean;
    task_test_chlore: boolean;
    task_test_ph: boolean;
    task_remplissage: boolean;
    task_panier_prefiltre: boolean;
    task_traitement: boolean;
    task_verif_vanne: boolean;
    task_temps_fonctionnement: boolean;
    created_at: string;
    services?: { service_id: string }[];
    products?: { product_id: string; quantity: number }[];
}

interface Service {
    id: string;
    name: string;
    price: number;
}

interface Product {
    id: string;
    name: string;
    unit: string;
    price_per_unit: number;
}

const InterventionTemplates: React.FC = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [saving, setSaving] = useState(false);

    const [dbServices, setDbServices] = useState<Service[]>([]);
    const [dbProducts, setDbProducts] = useState<Product[]>([]);

    const [form, setForm] = useState<Partial<Template>>({
        name: '',
        description: '',
        task_balai: false,
        task_lavage: false,
        task_rincage: false,
        task_test_chlore: false,
        task_test_ph: false,
        task_remplissage: false,
        task_panier_prefiltre: false,
        task_traitement: false,
        task_verif_vanne: false,
        task_temps_fonctionnement: false,
    });

    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [tRes, sRes, pRes] = await Promise.all([
                supabase.from('intervention_templates').select('*, services:template_services(service_id), products:template_products(product_id, quantity)').order('name'),
                supabase.from('services').select('*').order('name'),
                supabase.from('inventory_products').select('*').order('name')
            ]);

            if (tRes.error) throw tRes.error;
            setTemplates(tRes.data || []);
            setDbServices(sRes.data || []);
            setDbProducts(pRes.data || []);
        } catch (err: any) {
            console.error(err);
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (template: Template | null = null) => {
        setEditingTemplate(template);
        if (template) {
            setForm({
                name: template.name,
                description: template.description,
                task_balai: template.task_balai,
                task_lavage: template.task_lavage,
                task_rincage: template.task_rincage,
                task_test_chlore: template.task_test_chlore,
                task_test_ph: template.task_test_ph,
                task_remplissage: template.task_remplissage,
                task_panier_prefiltre: template.task_panier_prefiltre,
                task_traitement: template.task_traitement,
                task_verif_vanne: template.task_verif_vanne,
                task_temps_fonctionnement: template.task_temps_fonctionnement,
            });
            setSelectedServices(template.services?.map(s => s.service_id) || []);
            const prodMap: Record<string, number> = {};
            template.products?.forEach(p => { prodMap[p.product_id] = p.quantity; });
            setSelectedProducts(prodMap);
        } else {
            setForm({
                name: '',
                description: '',
                task_balai: false,
                task_lavage: false,
                task_rincage: false,
                task_test_chlore: false,
                task_test_ph: false,
                task_remplissage: false,
                task_panier_prefiltre: false,
                task_traitement: false,
                task_verif_vanne: false,
                task_temps_fonctionnement: false,
            });
            setSelectedServices([]);
            setSelectedProducts({});
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return toast.error("Le nom est requis");
        setSaving(true);

        try {
            let templateId = editingTemplate?.id;

            if (editingTemplate) {
                const { error } = await supabase.from('intervention_templates').update(form).eq('id', editingTemplate.id);
                if (error) throw error;
                // Delete old relations
                await Promise.all([
                    supabase.from('template_services').delete().eq('template_id', editingTemplate.id),
                    supabase.from('template_products').delete().eq('template_id', editingTemplate.id)
                ]);
            } else {
                const { data, error } = await supabase.from('intervention_templates').insert([form]).select().single();
                if (error) throw error;
                templateId = data.id;
            }

            // Insert new relations
            if (selectedServices.length > 0) {
                await supabase.from('template_services').insert(
                    selectedServices.map(sId => ({ template_id: templateId, service_id: sId }))
                );
            }

            if (Object.keys(selectedProducts).length > 0) {
                await supabase.from('template_products').insert(
                    Object.entries(selectedProducts).map(([pId, qty]) => ({
                        template_id: templateId,
                        product_id: pId,
                        quantity: qty
                    }))
                );
            }

            toast.success(editingTemplate ? "Modèle mis à jour" : "Modèle créé");
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;
        setIsDeleting(true);
        try {
            await supabase.from('intervention_templates').delete().eq('id', templateToDelete.id);
            toast.success("Modèle supprimé");
            setTemplateToDelete(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleService = (id: string) => {
        setSelectedServices(prev => 
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

    const updateProductQty = (id: string, qty: number) => {
        setSelectedProducts(prev => {
            if (qty <= 0) {
                const newProducts = { ...prev };
                delete newProducts[id];
                return newProducts;
            }
            return { ...prev, [id]: qty };
        });
    };

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageLayout
            title="Modèles d'intervention"
            subtitle={`${filteredTemplates.length} modèle(s) défini(s)`}
            showBackButton={true}
            toolbar={
                <div className="relative w-full">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un modèle..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            }
        >
            {/* ── Tabs ── */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 mb-6">
                <button
                    onClick={() => navigate('/settings/services')}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-slate-600"
                >
                    <Wrench size={14} /> Services
                </button>
                <button
                    onClick={() => navigate('/settings/services')}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-slate-600"
                >
                    <Package size={14} /> Produits
                </button>
                <button
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all bg-white dark:bg-slate-700 text-primary shadow-sm"
                >
                    <ClipboardList size={14} /> Modèles
                </button>
            </div>
            <div className="flex flex-col gap-4 pb-32">
                {filteredTemplates.length === 0 && !loading && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase">Aucun modèle</h3>
                        <p className="text-slate-500 mb-6">Créez des modèles pour vos interventions récurrentes.</p>
                        <button onClick={() => handleOpenModal()} className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                            Créer mon premier modèle
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map(t => (
                        <div key={t.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-primary/50 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <ClipboardList size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.name}</h3>
                                        <p className="text-slate-500 text-xs truncate max-w-[200px]">{t.description || "Pas de description"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleOpenModal(t)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-primary transition-all">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => setTemplateToDelete(t)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.services?.length ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                                    {t.services?.length || 0} Services
                                </span>
                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.products?.length ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                                    {t.products?.length || 0} Produits
                                </span>
                                <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                    Checkpoint OK
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fab */}
            <button
                onClick={() => handleOpenModal()}
                className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
            >
                <Plus size={32} strokeWidth={3} />
            </button>

            {/* Modal de création/édition */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    {editingTemplate ? "Modifier le modèle" : "Nouveau modèle"}
                                </h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Configurez les tâches et fournitures par défaut</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Colonne Gauche: Infos & Tâches */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1 h-3 bg-primary rounded-full" /> Informations de base
                                        </h3>
                                        <input
                                            type="text"
                                            placeholder="Nom du modèle (ex: Hivernage)"
                                            required
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
                                        />
                                        <textarea
                                            placeholder="Description optionnelle..."
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold h-24 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1 h-3 bg-primary rounded-full" /> Checkpoint de Maintenance
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { id: 'task_balai', label: 'Passage Balai' },
                                                { id: 'task_lavage', label: 'Lavage Filtre' },
                                                { id: 'task_rincage', label: 'Rinçage Filtre' },
                                                { id: 'task_test_chlore', label: 'Test Chlore' },
                                                { id: 'task_test_ph', label: 'Test pH' },
                                                { id: 'task_remplissage', label: 'Mise à niveau eau' },
                                                { id: 'task_panier_prefiltre', label: 'Nettoyage Paniers' },
                                                { id: 'task_traitement', label: 'Traitement Choc' },
                                                { id: 'task_verif_vanne', label: 'Vérification Vannes' },
                                                { id: 'task_temps_fonctionnement', label: 'Réglage Horloge' },
                                            ].map(task => (
                                                <button
                                                    key={task.id}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, [task.id]: !form[task.id as keyof Template] })}
                                                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${form[task.id as keyof Template] ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50/50 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                                >
                                                    <span className="text-xs font-black uppercase tracking-widest">{task.label}</span>
                                                    {form[task.id as keyof Template] ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Colonne Droite: Services & Produits */}
                                <div className="space-y-10">
                                    {/* Services */}
                                    <div className="space-y-4">
                                        <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1 h-3 bg-blue-600 rounded-full" /> Services inclus
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                                            {dbServices.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => toggleService(s.id)}
                                                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedServices.includes(s.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Wrench size={16} />
                                                        <span className="text-xs font-black uppercase tracking-tight">{s.name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold">{s.price} DT</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Produits */}
                                    <div className="space-y-4">
                                        <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1 h-3 bg-violet-600 rounded-full" /> Produits utilisés
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                                            {dbProducts.map(p => {
                                                const currentQty = selectedProducts[p.id] || 0;
                                                return (
                                                    <div key={p.id} className={`p-4 rounded-2xl border transition-all ${currentQty > 0 ? 'bg-violet-50 border-violet-200' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700'}`}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Package size={16} className={currentQty > 0 ? 'text-violet-600' : 'text-slate-400'} />
                                                                <span className={`text-xs font-black uppercase tracking-tight ${currentQty > 0 ? 'text-violet-900' : 'text-slate-400'}`}>{p.name}</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.unit}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                value={currentQty || ""}
                                                                onChange={e => updateProductQty(p.id, parseFloat(e.target.value))}
                                                                className="w-full bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 bg-white dark:bg-slate-700 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {editingTemplate ? "Mettre à jour" : "Créer le modèle"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!templateToDelete}
                title="Supprimer ce modèle ?"
                message={`Voulez-vous vraiment supprimer "${templateToDelete?.name}" ?`}
                confirmLabel="OUI, SUPPRIMER"
                onConfirm={handleDelete}
                onClose={() => setTemplateToDelete(null)}
                loading={isDeleting}
                variant="danger"
            />
        </PageLayout>
    );
};

export default InterventionTemplates;
