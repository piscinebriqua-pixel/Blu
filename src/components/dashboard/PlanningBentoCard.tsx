import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Users, User, ArrowUpRight, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PlanningBentoCardProps {
    counts: {
        scheduled: number;
        interventions: number;
    };
}

interface TechWorkload {
    id: string;
    full_name: string;
    scheduledCount: number;
}

export const PlanningBentoCard: React.FC<PlanningBentoCardProps> = ({ counts }) => {
    const navigate = useNavigate();
    const [techWorkloads, setTechWorkloads] = useState<TechWorkload[]>([]);
    const [loadingTechs, setLoadingTechs] = useState(true);

    useEffect(() => {
        const loadTechWorkloads = async () => {
            try {
                setLoadingTechs(true);
                // 1. Récupérer les techniciens actifs
                const { data: techs, error: techsError } = await supabase
                    .from('technicians')
                    .select('id, full_name')
                    .eq('active', true)
                    .order('full_name');

                if (techsError) throw techsError;

                if (!techs || techs.length === 0) {
                    setTechWorkloads([]);
                    return;
                }

                // 2. Récupérer les interventions planifiées
                const { data: interventions, error: intError } = await supabase
                    .from('interventions')
                    .select('id, technician_id, status')
                    .in('status', ['scheduled', 'in_progress']);

                if (intError) throw intError;

                // 3. Calculer la charge par technicien
                const countsByTech: Record<string, number> = {};
                (interventions || []).forEach(inter => {
                    if (inter.technician_id) {
                        countsByTech[inter.technician_id] = (countsByTech[inter.technician_id] || 0) + 1;
                    }
                });

                const workloads: TechWorkload[] = techs.map(t => ({
                    id: t.id,
                    full_name: t.full_name,
                    scheduledCount: countsByTech[t.id] || 0
                }));

                setTechWorkloads(workloads);
            } catch (err) {
                console.error("Erreur lors du chargement des charges techniciens:", err);
            } finally {
                setLoadingTechs(false);
            }
        };

        loadTechWorkloads();
    }, []);

    const handleGoToPlanning = (techId?: string) => {
        if (techId && techId !== 'all') {
            navigate(`/planning?tech=${encodeURIComponent(techId)}`);
        } else {
            navigate('/planning?tech=all');
        }
    };

    return (
        <div className="bento-card-luxe bento-col-4 group flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300">
            {/* EN-TETE DE LA CARTE */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                                Planning Tournées
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                Tour de contrôle & Calendrier
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleGoToPlanning('all')}
                        title="Ouvrir le calendrier global"
                        className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all active:scale-95 cursor-pointer"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* SYNTHÈSE GLOBALE RAPIDE */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div 
                        onClick={() => handleGoToPlanning('all')}
                        className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    >
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-0.5">
                            Prévues
                        </span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {counts.scheduled}
                        </p>
                    </div>
                    <div 
                        onClick={() => handleGoToPlanning('all')}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-all"
                    >
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-0.5">
                            Total Visites
                        </span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {counts.interventions}
                        </p>
                    </div>
                </div>

                {/* SECTION FILTRAGE PAR TECHNICIEN */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={14} className="text-blue-500" />
                            Filtrer par technicien
                        </span>
                        <button
                            type="button"
                            onClick={() => handleGoToPlanning('all')}
                            className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wider"
                        >
                            Tous ({techWorkloads.length})
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1 scrollbar-thin">
                        {loadingTechs ? (
                            <div className="py-4 text-center text-xs font-semibold text-slate-400">
                                Chargement des techniciens...
                            </div>
                        ) : techWorkloads.length === 0 ? (
                            <div className="py-3 px-3 text-center text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                                Aucun technicien actif
                            </div>
                        ) : (
                            techWorkloads.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleGoToPlanning(t.id)}
                                    title={`Voir le planning de ${t.full_name}`}
                                    className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all active:scale-[0.99] text-left group/item cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center shrink-0">
                                            {t.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                                            {t.full_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                                            t.scheduledCount > 0
                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200/60 dark:border-white/10'
                                        }`}>
                                            {t.scheduledCount} {t.scheduledCount > 1 ? 'visites' : 'visite'}
                                        </span>
                                        <ArrowUpRight size={14} className="text-slate-400 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* PIED DE CARTE (ACTION PRINCIPALE) */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                    type="button"
                    onClick={() => handleGoToPlanning('all')}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                    <Calendar size={16} />
                    <span>Consulter le calendrier global</span>
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
