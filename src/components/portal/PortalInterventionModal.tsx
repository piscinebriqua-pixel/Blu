import React from 'react';
import { 
    Clock, 
    CreditCard, 
    CheckCircle2, 
    Camera, 
    FlaskConical, 
    Activity, 
    Check, 
    Info 
} from 'lucide-react';
import ModalLayout from '../ModalLayout';

export interface PortalIntervention {
    id: string;
    scheduled_date: string;
    completed_date: string | null;
    status: string;
    notes: string | null;
    ph_level: number | null;
    chlorine_level: number | null;
    photo_before_url: string | null;
    photo_after_url: string | null;
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
    pool: { name: string };
    total_amount: number;
    services?: {
        price_at_time: number;
        service: { name: string; }
    }[];
    products?: {
        quantity: number;
        total_price: number;
        product: { name: string; unit: string; }
    }[];
    technician?: { full_name: string };
}

interface PortalInterventionModalProps {
    intervention: PortalIntervention | null;
    onClose: () => void;
}

export const PortalInterventionModal: React.FC<PortalInterventionModalProps> = ({
    intervention,
    onClose
}) => {
    if (!intervention) return null;

    return (
        <ModalLayout
            title="Détail de l'intervention"
            onClose={onClose}
            className="max-w-lg"
        >
            <div className="p-4 space-y-6">
                {/* Summary Header - Date & Technician */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-blue-500">
                            <Clock size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Date</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none">
                                {new Date(intervention.completed_date || intervention.scheduled_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                    <div className="flex items-center gap-3 flex-1 justify-end">
                        <div className="flex flex-col text-right">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Expert</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none truncate max-w-[140px]">
                                {intervention.technician?.full_name || 'Équipe Blu'}
                            </span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={22} />
                        </div>
                    </div>
                </div>

                {/* Header Stats */}
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    <div className="shrink-0 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <FlaskConical size={20} className="text-blue-500" />
                        <div>
                            <p className="text-xs font-black text-blue-600 uppercase tracking-wider">Niveau pH</p>
                            <p className="text-base font-black text-slate-900 dark:text-white">{intervention.ph_level ?? 'N/A'}</p>
                        </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <Activity size={20} className="text-indigo-500" />
                        <div>
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">Chlore (ppm)</p>
                            <p className="text-base font-black text-slate-900 dark:text-white">{intervention.chlorine_level ?? 'N/A'}</p>
                        </div>
                    </div>
                    {intervention.total_amount > 0 && (
                        <div className="shrink-0 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                            <CreditCard size={20} className="text-emerald-500" />
                            <div>
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Facturé</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">{intervention.total_amount} DT</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Photos Section */}
                {(intervention.photo_before_url || intervention.photo_after_url) && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Camera size={14} />
                            PHOTOS DU PASSAGE
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {intervention.photo_before_url ? (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-black text-slate-500 uppercase text-center">Avant</p>
                                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-800">
                                        <img src={intervention.photo_before_url} alt="Avant" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-40">
                                    <span className="text-xs font-black uppercase text-slate-500">Pas de photo</span>
                                </div>
                            )}
                            {intervention.photo_after_url ? (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-black text-slate-500 uppercase text-center">Après</p>
                                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-800">
                                        <img src={intervention.photo_after_url} alt="Après" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-40">
                                    <span className="text-xs font-black uppercase text-slate-500">Pas de photo</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tasks Checklist */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        TRAVAUX EFFECTUÉS
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        {[
                            { label: 'Passage balai', done: intervention.task_balai },
                            { label: 'Lavage filtre', done: intervention.task_lavage },
                            { label: 'Rinçage filtre', done: intervention.task_rincage },
                            { label: 'Test Chlore', done: intervention.task_test_chlore },
                            { label: 'Test pH', done: intervention.task_test_ph },
                            { label: 'Remplissage', done: intervention.task_remplissage },
                            { label: 'Panier/Préfiltre', done: intervention.task_panier_prefiltre },
                            { label: 'Traitement', done: intervention.task_traitement },
                            { label: 'Vanne/Réseau', done: intervention.task_verif_vanne },
                            { label: 'Temps fonct.', done: intervention.task_temps_fonctionnement }
                        ].map((task, i) => (
                            <div key={i} className={`flex items-center gap-2.5 ${task.done ? 'opacity-100' : 'opacity-25'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${task.done ? 'bg-emerald-500 text-white' : 'bg-slate-300'}`}>
                                    <Check size={12} strokeWidth={3} />
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{task.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services & Products */}
                {((intervention.services?.length || 0) > 0 || (intervention.products?.length || 0) > 0) && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Détail Facturation</h4>
                        <div className="space-y-2">
                            {intervention.services?.map((s, i) => (
                                <div key={i} className="flex justify-between items-center text-xs font-bold bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-700 dark:text-slate-300 uppercase">{s.service.name}</span>
                                    <span className="text-blue-600 font-black">{s.price_at_time} DT</span>
                                </div>
                            ))}
                            {intervention.products?.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-xs font-bold bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-700 dark:text-slate-300 uppercase">{p.product.name} ({p.quantity} {p.product.unit})</span>
                                    <span className="text-blue-600 font-black">{p.total_price} DT</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {intervention.notes && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Info size={14} />
                            OBSERVATIONS
                        </h4>
                        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{intervention.notes}"</p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                    onClick={onClose}
                    className="w-full min-h-[44px] h-auto px-4 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-black/10 transition-all active:scale-95 flex items-center justify-center text-center leading-snug"
                >
                    Compris, Fermer
                </button>
            </div>
        </ModalLayout>
    );
};
