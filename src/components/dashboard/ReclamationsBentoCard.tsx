import React from 'react';
import { AlertTriangle, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import type { ReclamationRow } from '../../lib/supabase';

interface ReclamationsBentoCardProps {
    pendingCount: number;
    pendingReclamations: ReclamationRow[];
    onOpenModal: () => void;
}

export const ReclamationsBentoCard: React.FC<ReclamationsBentoCardProps> = ({
    pendingCount,
    pendingReclamations,
    onOpenModal
}) => {
    return (
        <div 
            onClick={onOpenModal} 
            className="bento-card-luxe bento-col-12 group cursor-pointer hover:border-amber-500/50 transition-all flex flex-col justify-between"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* Header (Gauche) */}
                <div className="lg:col-span-5 flex items-center justify-between lg:justify-start gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                            pendingCount > 0 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                        }`}>
                            <AlertTriangle size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                                    Réclamations & SAV
                                </h3>
                                {pendingCount > 0 && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping lg:hidden" />
                                )}
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-1">
                                Retours clients & demandes d'intervention
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {pendingCount > 0 ? (
                            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-500/20 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                {pendingCount} en attente
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20 shrink-0">
                                <CheckCircle2 size={13} />
                                À jour
                            </span>
                        )}

                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
                            <ChevronRight size={18} />
                        </div>
                    </div>
                </div>

                {/* Body : aperçu des réclamations récentes (Droite) */}
                <div className="lg:col-span-7 space-y-2">
                    {pendingReclamations.length === 0 ? (
                        <div className="py-3 px-4 text-left flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Aucune réclamation en attente
                                </p>
                                <p className="text-xs font-semibold text-slate-500 truncate">
                                    Toutes les demandes clients sont traitées.
                                </p>
                            </div>
                        </div>
                    ) : (
                        pendingReclamations.slice(0, 2).map((rec) => {
                            const clientName = rec.client 
                                ? `${rec.client.first_name} ${rec.client.last_name}` 
                                : 'Client Blu';

                            return (
                                <div 
                                    key={rec.id}
                                    className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 group-hover:border-slate-200 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">
                                                {clientName}
                                            </p>
                                            {rec.client?.city && (
                                                <span className="text-xs font-bold text-slate-500 truncate">
                                                    • {rec.client.city}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                            {rec.subject}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(rec.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 mt-4">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Centre de traitement SAV
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40 whitespace-nowrap shrink-0">
                    Gérer & Clôturer les réclamations
                </span>
            </div>
        </div>
    );
};
