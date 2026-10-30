import React, { useState, useEffect, useRef } from 'react';
import ModalLayout from '../ModalLayout';
import { type ExpenseRow, type ExpenseCategoryRow, type ExpensePaymentMethod } from '../../lib/supabase';
import { createExpense, updateExpense, uploadReceiptFile } from '../../services/expenseService';
import { Camera, Trash2, AlertCircle, Truck, CreditCard, Banknote, Building2, FileText, Check, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (expense: ExpenseRow) => void;
    initialData?: ExpenseRow | null;
    categories: ExpenseCategoryRow[];
    technicians: Array<{ id: string; full_name: string }>;
    vehicles: Array<{ id: string; name: string; plate: string | null }>;
    clients?: Array<{ id: string; first_name: string; last_name: string }>;
}

const METHODS: Array<{ id: ExpensePaymentMethod; label: string; icon: React.FC<{ size?: number; className?: string }> }> = [
    { id: 'company_card', label: 'Carte Pro', icon: CreditCard },
    { id: 'cash_technician', label: 'Caisse Tech (Espèces)', icon: Banknote },
    { id: 'company_transfer', label: 'Virement', icon: Building2 },
    { id: 'cash_company', label: 'Caisse Bureau', icon: Banknote },
    { id: 'check', label: 'Chèque', icon: FileText }
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
    isOpen, onClose, onSaved, initialData, categories, technicians, vehicles, clients = []
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);

    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [expenseDate, setExpenseDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('company_card');
    const [technicianId, setTechnicianId] = useState('');
    const [supplier, setSupplier] = useState('');
    const [description, setDescription] = useState('');
    const [receiptUrl, setReceiptUrl] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [kilometers, setKilometers] = useState('');
    const [liters, setLiters] = useState('');
    const [clientId, setClientId] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        if (initialData) {
            setAmount(initialData.amount ? initialData.amount.toString() : '');
            setCategoryId(initialData.category_id || categories[0]?.id || '');
            setExpenseDate(initialData.expense_date || new Date().toISOString().split('T')[0]);
            setPaymentMethod(initialData.payment_method || 'company_card');
            setTechnicianId(initialData.technician_id || '');
            setSupplier(initialData.supplier || '');
            setDescription(initialData.description || '');
            setReceiptUrl(initialData.receipt_url || '');
            setVehicleId(initialData.vehicle_id || '');
            setKilometers(initialData.kilometers ? initialData.kilometers.toString() : '');
            setLiters(initialData.liters ? initialData.liters.toString() : '');
            setClientId(initialData.client_id || '');
        } else {
            setAmount('');
            setCategoryId(categories[0]?.id || '');
            setExpenseDate(new Date().toISOString().split('T')[0]);
            setPaymentMethod('company_card');
            setTechnicianId('');
            setSupplier('');
            setDescription('');
            setReceiptUrl('');
            setVehicleId('');
            setKilometers('');
            setLiters('');
            setClientId('');
        }
    }, [isOpen, initialData, categories]);

    if (!isOpen) return null;

    const selectedCat = categories.find(c => c.id === categoryId);
    const isVehicleRequired = selectedCat?.requires_vehicle || 
        selectedCat?.name?.toLowerCase().includes('carburant') || 
        selectedCat?.name?.toLowerCase().includes('véhicule');

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingReceipt(true);
        const url = await uploadReceiptFile(file);
        setUploadingReceipt(false);
        if (url) {
            setReceiptUrl(url);
            toast.success('Justificatif attaché');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) return toast.error('Montant invalide');
        if (!categoryId) return toast.error('Catégorie requise');
        if (paymentMethod === 'cash_technician' && !technicianId) return toast.error('Désignez le technicien débité');

        setSubmitting(true);
        const payload = {
            category_id: categoryId,
            amount: numAmount,
            expense_date: expenseDate,
            payment_method: paymentMethod,
            technician_id: technicianId || null,
            supplier: supplier || null,
            description: description || null,
            receipt_url: receiptUrl || null,
            vehicle_id: isVehicleRequired && vehicleId ? vehicleId : null,
            kilometers: isVehicleRequired && kilometers ? parseFloat(kilometers) : null,
            liters: isVehicleRequired && liters ? parseFloat(liters) : null,
            client_id: clientId || null,
            status: 'validated' as const
        };

        const result = initialData ? await updateExpense(initialData.id, payload) : await createExpense(payload);
        setSubmitting(false);
        if (result) {
            onSaved(result);
            onClose();
        }
    };

    return (
        <ModalLayout title={initialData ? "Modifier la dépense" : "Nouvelle dépense"} onClose={onClose} className="max-w-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 sm:p-6 text-slate-800 dark:text-slate-100">
                {/* 1. MONTANT & DATE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Montant TTC (DT) *</label>
                        <input
                            type="number" step="0.001" inputMode="decimal" required placeholder="0.000"
                            value={amount} onChange={(e) => setAmount(e.target.value)}
                            className="w-full min-h-[48px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Date de dépense *</label>
                        <input
                            type="date" required value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)}
                            className="w-full min-h-[48px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* 2. CATÉGORIE & FOURNISSEUR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Catégorie *</label>
                        <select
                            value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"
                        >
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Fournisseur</label>
                        <input
                            type="text" placeholder="ex: Total, Bricorama..." value={supplier} onChange={(e) => setSupplier(e.target.value)}
                            className="w-full min-h-[44px] px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-medium text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* 3. MODE DE PAIEMENT */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Mode de règlement *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {METHODS.map((pm) => {
                            const IconCmp = pm.icon;
                            const isSelected = paymentMethod === pm.id;
                            return (
                                <button
                                    key={pm.id} type="button" onClick={() => setPaymentMethod(pm.id)}
                                    className={`min-h-[44px] px-3 py-2 rounded-xl border-2 flex items-center gap-2 transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300 font-bold' 
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <IconCmp size={18} className="shrink-0" />
                                    <span className="text-xs tracking-tight">{pm.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {paymentMethod === 'cash_technician' && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <p>Déduit automatiquement du solde d'espèces que ce technicien doit reverser.</p>
                    </div>
                )}

                {/* 4. TECHNICIEN & CLIENT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                            Technicien {paymentMethod === 'cash_technician' ? '*' : '(Optionnel)'}
                        </label>
                        <select
                            value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}
                            required={paymentMethod === 'cash_technician'}
                            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-semibold text-slate-900 dark:text-white"
                        >
                            <option value="">-- Dépense Société Globale --</option>
                            {technicians.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Client / Chantier (Optionnel)</label>
                        <select
                            value={clientId} onChange={(e) => setClientId(e.target.value)}
                            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-medium text-slate-900 dark:text-white"
                        >
                            <option value="">-- Aucun rattachement client --</option>
                            {clients.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                        </select>
                    </div>
                </div>

                {/* 5. VÉHICULE & CARBURANT */}
                {isVehicleRequired && (
                    <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-black text-xs uppercase">
                            <Truck size={16} /> Véhicule & Plein
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                                value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}
                                className="w-full min-h-[44px] px-2 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 text-base font-semibold text-slate-900 dark:text-white"
                            >
                                <option value="">-- Véhicule --</option>
                                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} {v.plate ? `(${v.plate})` : ''}</option>)}
                            </select>
                            <input
                                type="number" placeholder="Litres" value={liters} onChange={(e) => setLiters(e.target.value)}
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 text-base font-medium text-slate-900 dark:text-white"
                            />
                            <input
                                type="number" placeholder="Km relevé" value={kilometers} onChange={(e) => setKilometers(e.target.value)}
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 text-base font-medium text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                )}

                {/* 6. NOTE & MOTIF */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Motif ou Description</label>
                    <textarea
                        rows={2} placeholder="Précisions sur la dépense..." value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-medium text-slate-900 dark:text-white"
                    />
                </div>

                {/* 7. JUSTIFICATIF PHOTO */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Justificatif / Reçu Photo</label>
                    <input type="file" ref={fileInputRef} accept="image/*" capture="environment" onChange={handleReceiptUpload} className="hidden" />
                    {receiptUrl ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                                <img src={receiptUrl} alt="Reçu" className="w-12 h-12 rounded-lg object-cover border" />
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 underline">Voir le justificatif</span>
                            </a>
                            <button
                                type="button" onClick={() => setReceiptUrl('')}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 rounded-xl"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button" disabled={uploadingReceipt} onClick={() => fileInputRef.current?.click()}
                            className="min-h-[48px] px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase"
                        >
                            {uploadingReceipt ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Camera size={18} />}
                            {uploadingReceipt ? 'Compression & Envoi...' : 'Prendre une photo du ticket'}
                        </button>
                    )}
                </div>

                {/* 8. ACTIONS */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button" onClick={onClose}
                        className="min-h-[44px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit" disabled={submitting || uploadingReceipt}
                        className="min-h-[44px] px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md disabled:opacity-50 active:scale-95 transition-all"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {initialData ? 'Mettre à jour' : 'Enregistrer la dépense'}
                    </button>
                </div>
            </form>
        </ModalLayout>
    );
};

export default ExpenseFormModal;
