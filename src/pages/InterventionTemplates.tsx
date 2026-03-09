import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
    Loader2,
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

    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ product: Product; quantity: number }[]>([]);

    const [serviceSearch, setServiceSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

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
            setSelectedServices(template.services?.map(ts => dbServices.find(s => s.id === ts.service_id)).filter(Boolean) as Service[] || []);
            setSelectedProducts(template.products?.map(tp => {
                const prod = dbProducts.find(p => p.id === tp.product_id);
                return prod ? { product: prod, quantity: tp.quantity } : null;
            }).filter(Boolean) as { product: Product; quantity: number }[] || []);
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
            setSelectedProducts([]);
        }
        setServiceSearch('');
        setProductSearch('');
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
                    selectedServices.map(s => ({ template_id: templateId, service_id: s.id }))
                );
            }

            if (selectedProducts.length > 0) {
                await supabase.from('template_products').insert(
                    selectedProducts.map(sp => ({
                        template_id: templateId,
                        product_id: sp.product.id,
                        quantity: sp.quantity
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

    const addService = (service: Service) => {
        if (!selectedServices.find(s => s.id === service.id)) {
            setSelectedServices(prev => [...prev, service]);
        }
        setServiceSearch('');
        setIsServiceDropdownOpen(false);
    };

    const removeService = (id: string) => {
        setSelectedServices(prev => prev.filter(s => s.id !== id));
    };

    const addProduct = (product: Product) => {
        if (!selectedProducts.find(sp => sp.product.id === product.id)) {
            setSelectedProducts(prev => [...prev, { product, quantity: 1 }]);
        }
        setProductSearch('');
        setIsProductDropdownOpen(false);
    };

    const removeProduct = (id: string) => {
        setSelectedProducts(prev => prev.filter(sp => sp.product.id !== id));
    };

    const updateProductQty = (id: string, qty: number) => {
        setSelectedProducts(prev => prev.map(sp => 
            sp.product.id === id ? { ...sp, quantity: qty } : sp
        ));
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => handleOpenModal(t)}
                            className="bg-white dark:bg-slate-800 rounded-[2rem] p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-primary/50 hover:scale-[1.02] transition-all cursor-pointer group flex items-center gap-4"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                <ClipboardList size={26} />
                            </div>
                            
                            <div className="flex-1 min-width-0">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm line-clamp-1">{t.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {t.services?.length || 0} Serv.
                                    </span>
                                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {t.products?.length || 0} Prod.
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setTemplateToDelete(t); }} 
                                    className="p-2 text-slate-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
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
                                        
                                        {/* Search Box */}
                                        <div className="relative">
                                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Ajouter un service..."
                                                value={serviceSearch}
                                                onChange={e => {
                                                    setServiceSearch(e.target.value);
                                                    setIsServiceDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsServiceDropdownOpen(true)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 text-sm"
                                            />
                                            {isServiceDropdownOpen && serviceSearch && (
                                                <div className="absolute z-[60] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto no-scrollbar">
                                                    {dbServices
                                                        .filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()) && !selectedServices.find(ss => ss.id === s.id))
                                                        .map(s => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => addService(s)}
                                                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                                            >
                                                                <span className="text-xs font-black uppercase tracking-tight">{s.name}</span>
                                                                <span className="text-[10px] font-bold text-slate-400">{s.price} DT</span>
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Added Services List */}
                                        <div className="flex flex-col gap-2">
                                            {selectedServices.map(s => (
                                                <div key={s.id} className="flex justify-between items-center p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/10">
                                                    <div className="flex items-center gap-3">
                                                        <Wrench size={16} className="text-blue-600" />
                                                        <span className="text-xs font-black uppercase tracking-tight">{s.name}</span>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeService(s.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Produits */}
                                    <div className="space-y-4">
                                        <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1 h-3 bg-violet-600 rounded-full" /> Produits utilisés
                                        </h3>

                                        {/* Search Box */}
                                        <div className="relative">
                                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Ajouter un produit..."
                                                value={productSearch}
                                                onChange={e => {
                                                    setProductSearch(e.target.value);
                                                    setIsProductDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsProductDropdownOpen(true)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-400 text-sm"
                                            />
                                            {isProductDropdownOpen && productSearch && (
                                                <div className="absolute z-[60] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto no-scrollbar">
                                                    {dbProducts
                                                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && !selectedProducts.find(sp => sp.product.id === p.id))
                                                        .map(p => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => addProduct(p)}
                                                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                                            >
                                                                <span className="text-xs font-black uppercase tracking-tight">{p.name}</span>
                                                                <span className="text-[10px] font-bold text-slate-400">{p.unit}</span>
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Added Products List */}
                                        <div className="flex flex-col gap-3">
                                            {selectedProducts.map(sp => (
                                                <div key={sp.product.id} className="p-4 rounded-2xl border bg-violet-50/50 dark:bg-violet-900/10 border-violet-100/50 dark:border-violet-900/10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={16} className="text-violet-600" />
                                                            <span className="text-xs font-black uppercase tracking-tight text-violet-900 dark:text-violet-200">{sp.product.name}</span>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeProduct(sp.product.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                placeholder="Qté"
                                                                value={sp.quantity || ""}
                                                                onChange={e => updateProductQty(sp.product.id, parseFloat(e.target.value))}
                                                                className="w-full bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400 pointer-events-none">
                                                                {sp.product.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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
