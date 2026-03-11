import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import ModalLayout from '../components/ModalLayout';
import { 
    Plus,
    Trash2,
    Edit2,
    Fuel,
    Wrench as WrenchIcon,
    Package as PackageIcon,
    Coffee,
    Truck,
    MoreHorizontal,
    Star,
    Coins,
    Wallet
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Category {
    id: string;
    name: string;
    icon: string;
}

const FinanceSettings: React.FC = () => {
    const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
    const [advanceCategories, setAdvanceCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<{ type: 'expense' | 'advance', cat?: Category } | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const [expRes, advRes] = await Promise.all([
            supabase.from('expense_categories').select('*').order('name'),
            supabase.from('advance_categories').select('*').order('name')
        ]);
        setExpenseCategories(expRes.data || []);
        setAdvanceCategories(advRes.data || []);
        setLoading(false);
    };

    const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const icon = formData.get('icon') as string;
        const type = editingCat?.type;

        if (!name || !type) return;

        const table = type === 'expense' ? 'expense_categories' : 'advance_categories';
        
        try {
            if (editingCat.cat) {
                const { error } = await supabase.from(table).update({ name, icon }).eq('id', editingCat.cat.id);
                if (error) throw error;
                toast.success('Catégorie modifiée');
            } else {
                const { error } = await supabase.from(table).insert({ name, icon });
                if (error) throw error;
                toast.success('Catégorie créée');
            }
            setIsCatModalOpen(false);
            fetchCategories();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const deleteCategory = async (type: 'expense' | 'advance', id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
        const table = type === 'expense' ? 'expense_categories' : 'advance_categories';
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            toast.success('Catégorie supprimée');
            fetchCategories();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const getIcon = (iconName: string) => {
        const props = { size: 20 };
        switch (iconName) {
            case 'Fuel': return <Fuel {...props} />;
            case 'Wrench': return <WrenchIcon {...props} />;
            case 'Package': return <PackageIcon {...props} />;
            case 'Coffee': return <Coffee {...props} />;
            case 'Truck': return <Truck {...props} />;
            case 'Star': return <Star {...props} />;
            case 'Coins': return <Coins {...props} />;
            case 'Wallet': return <Wallet {...props} />;
            default: return <MoreHorizontal {...props} />;
        }
    };

    return (
        <PageLayout 
            title="Types de Dépenses & Avances" 
            subtitle="Configuration des catégories financières"
            showBackButton={true}
        >
            <div className="flex flex-col gap-10 pb-20">
                {/* Section Dépenses */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Types de Dépenses</h3>
                            <p className="text-xs font-bold text-slate-400">Pour le carburant, outillage, etc.</p>
                        </div>
                        <button 
                            onClick={() => { setEditingCat({ type: 'expense' }); setIsCatModalOpen(true); }}
                            className="h-11 px-6 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Plus size={18} /> Ajouter
                        </button>
                    </div>
                    {loading ? (
                         <div className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl animate-pulse" />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {expenseCategories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[24px] shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                                            {getIcon(cat.icon)}
                                        </div>
                                        <span className="font-black text-slate-700 dark:text-slate-200 uppercase text-xs tracking-tight">{cat.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingCat({ type: 'expense', cat }); setIsCatModalOpen(true); }} className="p-2 text-slate-300 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"><Edit2 size={16} /></button>
                                        <button onClick={() => deleteCategory('expense', cat.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors hover:bg-rose-500/5 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section Avances */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Types d'Avances</h3>
                            <p className="text-xs font-bold text-slate-400">Acomptes, prêts, frais spéciaux</p>
                        </div>
                        <button 
                            onClick={() => { setEditingCat({ type: 'advance' }); setIsCatModalOpen(true); }}
                            className="h-11 px-6 bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                            <Plus size={18} /> Ajouter
                        </button>
                    </div>
                    {loading ? (
                         <div className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl animate-pulse" />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {advanceCategories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[24px] shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-amber-500">
                                            {getIcon(cat.icon)}
                                        </div>
                                        <span className="font-black text-slate-700 dark:text-slate-200 uppercase text-xs tracking-tight">{cat.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingCat({ type: 'advance', cat }); setIsCatModalOpen(true); }} className="p-2 text-slate-300 hover:text-amber-500 transition-colors hover:bg-amber-500/5 rounded-lg"><Edit2 size={16} /></button>
                                        <button onClick={() => deleteCategory('advance', cat.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors hover:bg-rose-500/5 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {isCatModalOpen && (
                <ModalLayout
                    title={editingCat?.cat ? 'Modifier Catégorie' : 'Ajouter une Catégorie'}
                    onClose={() => setIsCatModalOpen(false)}
                    actions={
                        <button form="cat-form" type="submit" className="btn-flow btn-primary w-full !h-14">
                            {editingCat?.cat ? 'ENREGISTRER LES MODIFICATIONS' : 'CRÉER LA CATÉGORIE'}
                        </button>
                    }
                >
                    <form id="cat-form" onSubmit={handleCategorySubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du type</label>
                            <input 
                                name="name"
                                required
                                defaultValue={editingCat?.cat?.name}
                                placeholder="Ex: Fuel, Avance Exceptionnelle..."
                                className="w-full h-15 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 font-bold text-slate-800 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélectionner une Icône</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['Fuel', 'Wrench', 'Package', 'Coffee', 'Truck', 'Star', 'Coins', 'Wallet', 'MoreHorizontal'].map(icon => (
                                    <label key={icon} className="relative flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all has-[:checked]:bg-primary/10 has-[:checked]:border-primary hover:scale-[1.05]">
                                        <input type="radio" name="icon" value={icon} className="hidden" defaultChecked={editingCat?.cat?.icon === icon} required />
                                        <div className="text-secondary opacity-60">
                                            {getIcon(icon)}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </form>
                </ModalLayout>
            )}
        </PageLayout>
    );
};

export default FinanceSettings;
