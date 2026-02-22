import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
    Loader2,
    Edit2,
    Trash2,
    Wrench,
    Package,
    Plus,
    Search as SearchIcon,
    Wallet,
    X,
    Tag
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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

const ServicesManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

    // --- Services State ---
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [savingService, setSavingService] = useState(false);
    const [serviceSearch, setServiceSearch] = useState('');
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceForm, setServiceForm] = useState({ name: '', price: '' });
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [isDeletingService, setIsDeletingService] = useState(false);

    // --- Products State ---
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [savingProduct, setSavingProduct] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({ name: '', unit: '', price_per_unit: '' });
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeletingProduct, setIsDeletingProduct] = useState(false);

    useEffect(() => { fetchServices(); fetchProducts(); }, []);

    // ── Services CRUD ──────────────────────────────────────────────────
    const fetchServices = async () => {
        try {
            setLoadingServices(true);
            const { data, error } = await supabase.from('services').select('*').order('name');
            if (error) throw error;
            setServices(data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingServices(false); }
    };

    const handleOpenServiceModal = (service: Service | null = null) => {
        setEditingService(service);
        setServiceForm(service ? { name: service.name, price: service.price.toString() } : { name: '', price: '' });
        setIsServiceModalOpen(true);
    };

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingService(true);
        try {
            const payload = { name: serviceForm.name, price: parseFloat(serviceForm.price) || 0 };
            if (editingService) {
                await supabase.from('services').update(payload).eq('id', editingService.id);
            } else {
                await supabase.from('services').insert([payload]);
            }
            setIsServiceModalOpen(false);
            toast.success(editingService ? 'Service mis à jour ✓' : 'Service ajouté ✓');
            fetchServices();
        } catch (error: any) { toast.error(error.message); }
        finally { setSavingService(false); }
    };

    const handleDeleteService = async () => {
        if (!serviceToDelete) return;
        setIsDeletingService(true);
        try {
            await supabase.from('services').delete().eq('id', serviceToDelete.id);
            toast.success('Service supprimé');
            setServiceToDelete(null);
            fetchServices();
        } catch (error: any) { toast.error(error.message); }
        finally { setIsDeletingService(false); }
    };

    // ── Products CRUD ──────────────────────────────────────────────────
    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const { data, error } = await supabase.from('inventory_products').select('*').order('name');
            if (error) throw error;
            setProducts(data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingProducts(false); }
    };

    const handleOpenProductModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setProductForm(product
            ? { name: product.name, unit: product.unit, price_per_unit: product.price_per_unit.toString() }
            : { name: '', unit: '', price_per_unit: '' }
        );
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProduct(true);
        try {
            const payload = {
                name: productForm.name,
                unit: productForm.unit,
                price_per_unit: parseFloat(productForm.price_per_unit) || 0
            };
            if (editingProduct) {
                await supabase.from('inventory_products').update(payload).eq('id', editingProduct.id);
            } else {
                await supabase.from('inventory_products').insert([payload]);
            }
            setIsProductModalOpen(false);
            toast.success(editingProduct ? 'Produit mis à jour ✓' : 'Produit ajouté ✓');
            fetchProducts();
        } catch (error: any) { toast.error(error.message); }
        finally { setSavingProduct(false); }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeletingProduct(true);
        try {
            await supabase.from('inventory_products').delete().eq('id', productToDelete.id);
            toast.success('Produit supprimé');
            setProductToDelete(null);
            fetchProducts();
        } catch (error: any) { toast.error(error.message); }
        finally { setIsDeletingProduct(false); }
    };

    // ── Filters ────────────────────────────────────────────────────────
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

    const toolbar = (
        <div className="flex items-center gap-3">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={15} />
                <input
                    type="text"
                    placeholder="Rechercher..."
                    value={activeTab === 'services' ? serviceSearch : productSearch}
                    onChange={e => activeTab === 'services' ? setServiceSearch(e.target.value) : setProductSearch(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 rounded-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 w-40"
                />
            </div>
            <button
                onClick={() => activeTab === 'services' ? handleOpenServiceModal() : handleOpenProductModal()}
                aria-label="Ajouter"
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md"
            >
                <Plus size={20} />
            </button>
        </div>
    );

    const isLoading = activeTab === 'services' ? (loadingServices && services.length === 0) : (loadingProducts && products.length === 0);

    return (
        <PageLayout
            title="Catalogue"
            subtitle={activeTab === 'services'
                ? `${filteredServices.length} prestation${filteredServices.length > 1 ? 's' : ''}`
                : `${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''}`
            }
            toolbar={toolbar}
            loading={isLoading}
            showBackButton={true}
        >
            {/* ── Tabs ── */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 mb-6">
                <button
                    onClick={() => setActiveTab('services')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'services'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <Wrench size={14} /> Services
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'products'
                        ? 'bg-white dark:bg-slate-700 text-violet-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <Package size={14} /> Produits
                </button>
            </div>

            {/* ══ SERVICES TAB ══════════════════════════════════════════════ */}
            {activeTab === 'services' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {filteredServices.length === 0 && !loadingServices && (
                        <EmptyState
                            icon={<Wrench size={28} />}
                            label="Aucun service"
                            description="Ajoutez votre première prestation."
                            onAdd={() => handleOpenServiceModal()}
                        />
                    )}
                    {filteredServices.map(service => (
                        <div key={service.id} className="bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Wrench size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-800 dark:text-white text-sm truncate">{service.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Disponible</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1 flex-shrink-0">
                                <span className="text-xl font-black text-slate-800 dark:text-white">{service.price.toFixed(0)}</span>
                                <span className="text-xs font-bold text-slate-400">DT</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <ActionBtn color="blue" onClick={() => handleOpenServiceModal(service)} icon={<Edit2 size={14} />} label="Modifier" />
                                <ActionBtn color="red" onClick={() => setServiceToDelete(service)} icon={<Trash2 size={14} />} label="Supprimer" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══ PRODUCTS TAB ══════════════════════════════════════════════ */}
            {activeTab === 'products' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {filteredProducts.length === 0 && !loadingProducts && (
                        <EmptyState
                            icon={<Package size={28} />}
                            label="Aucun produit"
                            description="Ajoutez votre premier article."
                            onAdd={() => handleOpenProductModal()}
                        />
                    )}
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 flex-shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-all">
                                    <Package size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-800 dark:text-white text-sm truncate">{product.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Tag size={10} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{product.unit || '—'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1 flex-shrink-0">
                                <span className="text-xl font-black text-slate-800 dark:text-white">{product.price_per_unit.toFixed(0)}</span>
                                <span className="text-xs font-bold text-slate-400">DT/{product.unit || 'u'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <ActionBtn color="violet" onClick={() => handleOpenProductModal(product)} icon={<Edit2 size={14} />} label="Modifier" />
                                <ActionBtn color="red" onClick={() => setProductToDelete(product)} icon={<Trash2 size={14} />} label="Supprimer" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal Service ── */}
            {isServiceModalOpen && (
                <FormModal
                    title={editingService ? 'Modifier le service' : 'Nouveau service'}
                    subtitle={editingService ? 'Mettre à jour la prestation' : 'Ajouter au catalogue'}
                    onClose={() => setIsServiceModalOpen(false)}
                    onSubmit={handleSaveService}
                    saving={savingService}
                >
                    <InputField label="Nom de la prestation" placeholder="Ex: Entretien mensuel..." value={serviceForm.name} onChange={v => setServiceForm({ ...serviceForm, name: v })} />
                    <InputField label="Tarif (DT)" type="number" placeholder="0" value={serviceForm.price} onChange={v => setServiceForm({ ...serviceForm, price: v })} icon={<Wallet size={18} className="text-slate-400" />} />
                </FormModal>
            )}

            {/* ── Modal Produit ── */}
            {isProductModalOpen && (
                <FormModal
                    title={editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                    subtitle={editingProduct ? 'Mettre à jour l\'article' : 'Ajouter au catalogue'}
                    onClose={() => setIsProductModalOpen(false)}
                    onSubmit={handleSaveProduct}
                    saving={savingProduct}
                >
                    <InputField label="Nom du produit" placeholder="Ex: Chlore granulé..." value={productForm.name} onChange={v => setProductForm({ ...productForm, name: v })} />
                    <InputField label="Unité" placeholder="Ex: kg, L, bidon..." value={productForm.unit} onChange={v => setProductForm({ ...productForm, unit: v })} />
                    <InputField label="Prix par unité (DT)" type="number" placeholder="0" value={productForm.price_per_unit} onChange={v => setProductForm({ ...productForm, price_per_unit: v })} icon={<Wallet size={18} className="text-slate-400" />} />
                </FormModal>
            )}

            {/* ── Confirms ── */}
            <ConfirmModal
                isOpen={!!serviceToDelete}
                title="Supprimer ce service ?"
                message={`Êtes-vous sûr de vouloir supprimer "${serviceToDelete?.name}" ?`}
                confirmLabel="SUPPRIMER"
                onConfirm={handleDeleteService}
                onClose={() => setServiceToDelete(null)}
                loading={isDeletingService}
            />
            <ConfirmModal
                isOpen={!!productToDelete}
                title="Supprimer ce produit ?"
                message={`Êtes-vous sûr de vouloir supprimer "${productToDelete?.name}" ?`}
                confirmLabel="SUPPRIMER"
                onConfirm={handleDeleteProduct}
                onClose={() => setProductToDelete(null)}
                loading={isDeletingProduct}
            />
        </PageLayout>
    );
};

// ── Sub-components ───────────────────────────────────────────────────

const EmptyState = ({ icon, label, description, onAdd }: { icon: React.ReactNode; label: string; description: string; onAdd: () => void }) => (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400">{icon}</div>
        <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">{label}</h3>
            <p className="text-slate-400 text-sm mt-1">{description}</p>
        </div>
        <button onClick={onAdd} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
            <Plus size={16} /> Ajouter
        </button>
    </div>
);

const ActionBtn = ({ color, onClick, icon, label }: { color: 'blue' | 'violet' | 'red'; onClick: () => void; icon: React.ReactNode; label: string }) => {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100',
        violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100',
    };
    return (
        <button onClick={onClick} aria-label={label} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${colors[color]}`}>
            {icon}
        </button>
    );
};

const InputField = ({ label, value, onChange, placeholder, type = 'text', icon }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: React.ReactNode }) => (
    <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</div>}
            <input
                type={type}
                required
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                step={type === 'number' ? '1' : undefined}
                min={type === 'number' ? '0' : undefined}
                className={`w-full py-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all ${icon ? 'pl-12 pr-4' : 'px-4'}`}
            />
        </div>
    </div>
);

const FormModal = ({ title, subtitle, onClose, onSubmit, saving, children }: { title: string; subtitle: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; saving: boolean; children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-7">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">{title}</h2>
                    <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
                </div>
                <button onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                    <X size={16} />
                </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-5">
                {children}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-colors">
                        Annuler
                    </button>
                    <button type="submit" disabled={saving} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2">
                        {saving && <Loader2 className="animate-spin" size={16} />}
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default ServicesManager;
