import React, { useState, useMemo } from 'react';
import { format, addWeeks, addDays, startOfDay, parseISO, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sparkles, Calendar, ShieldCheck, Clock } from 'lucide-react';
import ModalLayout from '../ModalLayout';
import type { BatchGenerationOptions } from '../../lib/recurrenceService';

interface GenerateRecurrencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: BatchGenerationOptions) => Promise<void>;
    loading: boolean;
}

type IntervalPreset = '1_week' | '2_weeks' | '1_month' | '3_months' | 'custom';

export const GenerateRecurrencesModal: React.FC<GenerateRecurrencesModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    loading
}) => {
    const [preset, setPreset] = useState<IntervalPreset>('1_month');
    const [customMode, setCustomMode] = useState<'weeks' | 'date'>('weeks');
    const [customWeeks, setCustomWeeks] = useState<number>(6);
    
    // Par défaut pour la date personnalisée : aujourd'hui + 6 semaines
    const defaultCustomDate = useMemo(() => {
        return format(addWeeks(new Date(), 6), 'yyyy-MM-dd');
    }, []);
    const [customEndDate, setCustomEndDate] = useState<string>(defaultCustomDate);

    const minDateStr = useMemo(() => {
        return format(addDays(new Date(), 1), 'yyyy-MM-dd');
    }, []);

    // Calcul de l'horizon réel en fonction du choix
    const { horizonDate, weeksCalculated, daysCount } = useMemo(() => {
        const today = startOfDay(new Date());
        let targetHorizon: Date;
        let w = 4;

        if (preset === '1_week') {
            w = 1;
            targetHorizon = addWeeks(today, 1);
        } else if (preset === '2_weeks') {
            w = 2;
            targetHorizon = addWeeks(today, 2);
        } else if (preset === '1_month') {
            w = 4;
            targetHorizon = addWeeks(today, 4);
        } else if (preset === '3_months') {
            w = 12;
            targetHorizon = addWeeks(today, 12);
        } else {
            // custom
            if (customMode === 'weeks') {
                w = Math.max(1, Math.min(52, customWeeks || 1));
                targetHorizon = addWeeks(today, w);
            } else {
                const parsed = parseISO(customEndDate);
                if (!isNaN(parsed.getTime()) && !isBefore(parsed, today)) {
                    targetHorizon = startOfDay(parsed);
                } else {
                    targetHorizon = addWeeks(today, 4);
                }
                const diffMs = targetHorizon.getTime() - today.getTime();
                w = Math.max(1, Math.ceil(diffMs / (7 * 24 * 3600 * 1000)));
            }
        }

        const diffDays = Math.round((targetHorizon.getTime() - today.getTime()) / (24 * 3600 * 1000));

        return {
            horizonDate: targetHorizon,
            weeksCalculated: w,
            daysCount: diffDays
        };
    }, [preset, customMode, customWeeks, customEndDate]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        if (preset === 'custom' && customMode === 'date') {
            await onConfirm({
                endDate: horizonDate,
                weeksAhead: weeksCalculated
            });
        } else {
            await onConfirm({
                weeksAhead: weeksCalculated,
                endDate: horizonDate
            });
        }
    };

    const presetsList: { id: IntervalPreset; label: string; badge: string; desc: string }[] = [
        { id: '1_week', label: '1 Semaine', badge: '+7 jours', desc: 'Tournées immédiates' },
        { id: '2_weeks', label: '2 Semaines', badge: '+14 jours', desc: 'Quinzaine' },
        { id: '1_month', label: '1 Mois', badge: '+4 semaines', desc: 'Recommandé (Mensuel)' },
        { id: '3_months', label: '3 Mois', badge: '+12 semaines', desc: 'Trimestre complet' },
        { id: 'custom', label: 'Intervalle libre', badge: 'Personnalisé', desc: 'Date exacte ou durée libre' },
    ];

    return (
        <ModalLayout
            title="Générer les Visites Récurrentes"
            onClose={onClose}
            className="!max-w-xl"
            actions={
                <div className="flex items-center justify-end gap-3 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Sparkles size={16} className={loading ? "animate-spin" : ""} />
                        <span>{loading ? "Génération en cours..." : `Générer sur ${daysCount} jours`}</span>
                    </button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* BANNIÈRE D'EXPLICATION */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Planification automatique en lot
                        </h4>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Choisissez l'horizon temporel souhaité. Le système générera les visites pour tous les bassins sous contrat selon leur jour de passage nominal.
                        </p>
                    </div>
                </div>

                {/* SÉLECTION DES PRÉSETS */}
                <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                        Choisir l'intervalle de génération
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {presetsList.map(p => {
                            const isSelected = preset === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPreset(p.id)}
                                    className={`flex items-center justify-between p-3.5 min-h-[52px] rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black uppercase tracking-tight ${
                                                isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                                            }`}>
                                                {p.label}
                                            </span>
                                            {p.id === '1_month' && (
                                                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    Optimal
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {p.desc}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${
                                        isSelected
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                        {p.badge}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ZONE CONDITIONNELLE : INTERVALLE LIBRE */}
                {preset === 'custom' && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setCustomMode('weeks')}
                                className={`flex-1 py-2 px-3 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                    customMode === 'weeks'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                Nombre de semaines
                            </button>
                            <button
                                type="button"
                                onClick={() => setCustomMode('date')}
                                className={`flex-1 py-2 px-3 min-h-[44px] rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                    customMode === 'date'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                Date limite exacte
                            </button>
                        </div>

                        {customMode === 'weeks' ? (
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Durée personnalisée (en semaines)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        max="52"
                                        value={customWeeks}
                                        onChange={(e) => setCustomWeeks(parseInt(e.target.value) || 1)}
                                        className="w-32 min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-slate-500">
                                        semaines (~{(customWeeks || 1) * 7} jours)
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Générer jusqu'à la date du :
                                </label>
                                <input
                                    type="date"
                                    min={minDateStr}
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* RÉSUMÉ D'HORIZON EN TEMPS RÉEL */}
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Clock size={18} className="text-blue-500 shrink-0" />
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                                Période planifiée :
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Du {format(new Date(), 'dd MMM yyyy', { locale: fr })} au {format(horizonDate, 'dd MMMM yyyy', { locale: fr })}
                            </span>
                        </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                        {daysCount} jours
                    </span>
                </div>

                {/* RAPPEL ANTI-DOUBLON */}
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                    <ShieldCheck size={16} className="shrink-0" />
                    <span>Sécurité anti-doublon : Les interventions déjà planifiées sur cette période ne seront jamais dupliquées.</span>
                </div>
            </form>
        </ModalLayout>
    );
};
