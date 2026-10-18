import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, ArrowUpRight } from 'lucide-react';

interface DashboardActivityCardProps {
    interventions: any[];
}

export const DashboardActivityCard: React.FC<DashboardActivityCardProps> = ({ interventions }) => {
    const navigate = useNavigate();

    return (
        <div className="bento-card-luxe bento-col-6 group min-h-[220px] flex flex-col justify-between">
            {/* EN-TÊTE DE LA CARTE */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Activity size={22} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-tight">
                                Flux d'activité
                            </h3>
                            <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Live
                            </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            Dernières interventions effectuées
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/interventions')}
                    className="flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:underline py-1.5 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                >
                    <span>Voir tout</span>
                    <ArrowUpRight size={14} />
                </button>
            </div>

            {/* LISTE COMPACTE DES INTERVENTIONS */}
            <div className="space-y-2 flex-1 flex flex-col justify-center">
                {interventions.length === 0 ? (
                    <div className="py-6 px-4 text-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <p className="text-xs font-bold text-slate-500">Aucune intervention récente</p>
                    </div>
                ) : (
                    interventions.map((inter) => {
                        const clientName = inter.pool?.client
                            ? `${inter.pool.client.first_name || ''} ${inter.pool.client.last_name || ''}`.trim()
                            : 'Client inconnu';
                        const techName = inter.technician?.full_name || 'Technicien inconnu';
                        const dateStr = inter.created_at
                            ? new Date(inter.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                              })
                            : '';
                        const isCompleted = inter.status === 'completed';
                        const isInProgress = inter.status === 'in_progress';
                        const dotClass = isCompleted
                            ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                            : isInProgress
                            ? 'bg-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-slate-400 ring-2 ring-slate-400/20';

                        return (
                            <div
                                key={inter.id}
                                onClick={() => navigate('/interventions')}
                                className="group/item min-h-[46px] px-3 py-2 rounded-xl bg-slate-50/70 hover:bg-blue-50/60 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-slate-100 dark:border-white/5 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                                            {clientName}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                                            {techName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-500 whitespace-nowrap">
                                        {dateStr}
                                    </span>
                                    <ChevronRight size={14} className="text-slate-500 group-hover/item:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
