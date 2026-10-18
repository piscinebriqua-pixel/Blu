import React, { useState } from 'react';
import { AlertCircle, Send, Droplets, Wrench, Calendar, Receipt, HelpCircle } from 'lucide-react';
import ModalLayout from '../ModalLayout';
import { createClientReclamation } from '../../services/reclamationService';
import type { PoolRow, ReclamationRow } from '../../lib/supabase';

interface PortalNewReclamationModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    pools: PoolRow[];
    onCreated: (reclamation: ReclamationRow) => void;
}

const CATEGORIES = [
    { id: 'eau', label: "Qualité de l'eau", icon: Droplets, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
    { id: 'materiel', label: "Matériel / Pompe", icon: Wrench, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
    { id: 'passage', label: "Passage d'entretien", icon: Calendar, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30' },
    { id: 'facturation', label: "Facturation", icon: Receipt, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
    { id: 'autre', label: "Autre demande", icon: HelpCircle, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
] as const;

export const PortalNewReclamationModal: React.FC<PortalNewReclamationModalProps> = ({
    isOpen,
    onClose,
    clientId,
    pools,
    onCreated
}) => {
    const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id || '');
    const [category, setCategory] = useState<'eau' | 'materiel' | 'passage' | 'facturation' | 'autre'>('eau');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!subject.trim()) {
            setErrorMsg("Veuillez indiquer l'objet de votre réclamation.");
            return;
        }

        if (!description.trim() || description.trim().length < 10) {
            setErrorMsg("Veuillez décrire votre problème plus en détail (au moins 10 caractères).");
            return;
        }

        try {
            setSubmitting(true);
            const created = await createClientReclamation({
                clientId,
                poolId: selectedPoolId || null,
                subject,
                category,
                description
            });

            if (created) {
                // Reset form
                setSubject('');
                setDescription('');
                setCategory('eau');
                onCreated(created);
                onClose();
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalLayout
            title="Nouvelle Réclamation"
            onClose={onClose}
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {errorMsg && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3.5 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">{errorMsg}</p>
                    </div>
                )}

                {/* Bassin concerné (si plus de 1 bassin) */}
                {pools.length > 1 && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                            Bassin concerné
                        </label>
                        <select
                            value={selectedPoolId}
                            onChange={(e) => setSelectedPoolId(e.target.value)}
                            className="w-full min-h-[44px] px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-base focus:outline-none focus:border-blue-500"
                        >
                            {pools.map(pool => (
                                <option key={pool.id} value={pool.id}>{pool.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Catégorie */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Motif de la demande
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = category === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={`min-h-[44px] p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                                        isSelected 
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500' 
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                                        <Icon size={16} />
                                    </div>
                                    <span className="text-xs font-black truncate">{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Objet / Titre */}
                <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Objet de la réclamation
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ex: Eau trouble après le passage, bruit pompe..."
                        className="w-full min-h-[44px] px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                        required
                    />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Description du problème
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez précisément ce que vous constatez afin que notre équipe intervienne efficacement..."
                        rows={4}
                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
                        required
                    />
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 min-h-[44px] py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 min-h-[44px] py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={16} />
                                Envoyer
                            </>
                        )}
                    </button>
                </div>
            </form>
        </ModalLayout>
    );
};
