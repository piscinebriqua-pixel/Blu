import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Loader2, Package, Wallet, Tag } from 'lucide-react';
import ModalLayout from './ModalLayout';

interface CreateProductModalProps {
    onClose: () => void;
    onSuccess: (newProduct: { id: string; name: string; unit: string; price_per_unit: number }) => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({ onClose, onSuccess }) => {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', unit: '', price_per_unit: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                unit: form.unit,
                price_per_unit: parseFloat(form.price_per_unit) || 0
            };
            const { data, error } = await supabase
                .from('inventory_products')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            toast.success('Produit ajouté au catalogue ✓');
            onSuccess(data);
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const actions = (
        <div className="flex gap-2 w-full">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-colors"
            >
                Annuler
            </button>
            <button
                type="submit"
                form="create-product-form"
                disabled={saving || !form.name || !form.price_per_unit || !form.unit}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all text-xs uppercase flex items-center justify-center gap-2"
            >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
        </div>
    );

    return (
        <ModalLayout title="NOUVEAU PRODUIT" onClose={onClose} actions={actions}>
            <form id="create-product-form" onSubmit={handleSubmit} className="p-4 space-y-6">
                <div>
                    <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Nom du produit</label>
                    <div className="relative">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            required
                            autoFocus
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Chlore 90%..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Unité</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                required
                                value={form.unit}
                                onChange={e => setForm({ ...form, unit: e.target.value })}
                                placeholder="kg, L..."
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Prix Unitaire</label>
                        <div className="relative">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="number"
                                required
                                value={form.price_per_unit}
                                onChange={e => setForm({ ...form, price_per_unit: e.target.value })}
                                placeholder="0"
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </ModalLayout>
    );
};

export default CreateProductModal;
