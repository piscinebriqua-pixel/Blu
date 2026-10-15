import React from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ReclamationRow } from '../../lib/supabase';

interface PortalReclamationsTabProps {
    reclamations: ReclamationRow[];
    onOpenNewModal: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
    eau: "Qualité de l'eau",
    materiel: "Matériel / Pompe",
    passage: "Passage d'entretien",
    facturation: "Facturation",
    autre: "Autre"
};

export const PortalReclamationsTab: React.FC<PortalReclamationsTabProps> = ({
    reclamations,
    onOpenNewModal
}) => {
    return (
        <div className="flex flex-col gap-3.5">
            {/* CTA Compact Haute Densité - Conforme règle empty_state_compact_cta */}
            <button
                type="button"
                onClick={onOpenNewModal}
                className="w-full min-h-[52px] px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 dark:border-blue-900/60 dark:hover:border-blue-600 flex items-center justify-between gap-3 shadow-sm transition-all active:scale-[0.99] group text-left"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <AlertTriangle size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide truncate">
                            Signaler un problème
                        </p>
                        <p className="text-xs font-semibold text-slate-500 truncate">
                            Déposer une réclamation technique ou SAV
                        </p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors shrink-0">
                    <Plus size={18} strokeWidth={2.5} />
                </div>
            </button>

            {/* Liste des réclamations */}
            {reclamations.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                    <ShieldCheck size={36} className="text-emerald-500 mb-2" />
                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase">Aucune réclamation</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                        Tout fonctionne parfaitement sur vos bassins.
                    </p>
                </div>
            ) : (
                reclamations.map((item) => {
                    const isClosed = item.status === 'cloturee';

                    return (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-3"
                        >
                            {/* En-tête : Badge statut & Date */}
                            <div className="flex justify-between items-center">
                                {isClosed ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-black uppercase tracking-wider">
                                        <CheckCircle2 size={13} />
                                        CLÔTURÉE
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-black uppercase tracking-wider">
                                        <Clock size={13} className="animate-pulse" />
                                        EN COURS
                                    </span>
                                )}

                                <span className="text-xs font-semibold text-slate-500">
                                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>

                            {/* Objet et Métadonnées */}
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                                    {item.subject}
                                </h4>
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                                    <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                                    {item.pool?.name && (
                                        <>
                                            <span>•</span>
                                            <span>{item.pool.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Message du client */}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {item.description}
                                </p>
                            </div>

                            {/* Réponse / Résolution de l'admin si clôturée */}
                            {isClosed && (
                                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                        <CheckCircle2 size={14} />
                                        Réponse de l'équipe Blu
                                        {item.closed_at && (
                                            <span className="font-semibold text-emerald-600/70 dark:text-emerald-400/70 ml-auto">
                                                {new Date(item.closed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                                        {item.admin_response || "Le problème a été traité et résolu par notre équipe technique."}
                                    </p>
                                </div>
                            )}

                            {/* Statut d'attente si en cours */}
                            {!isClosed && (
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400/90 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                                    Votre demande est actuellement prise en charge par notre équipe technique.
                                </p>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};
