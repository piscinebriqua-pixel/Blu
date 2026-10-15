import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowUpRight, Calendar } from 'lucide-react';
import { formatRevenue } from '../../lib/formatters';

interface AnnualPerformanceBentoCardProps {
    annualRevenue: number;
    monthlyRevenue: number;
    lastMonthRevenue: number;
    rollingRevenue?: number;
    monthlyBreakdown: number[]; // 12 montants réels (Janvier à Décembre)
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTH_FULL_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const AnnualPerformanceBentoCard: React.FC<AnnualPerformanceBentoCardProps> = ({
    annualRevenue,
    monthlyRevenue,
    lastMonthRevenue,
    monthlyBreakdown
}) => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth(); // 0 = Janvier, 9 = Octobre

    // Mois sélectionné pour le détail interactif (par défaut mois en cours)
    const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number>(currentMonthIndex);

    // Calcul de l'évolution vs mois précédent
    const growthPercent = useMemo(() => {
        if (lastMonthRevenue <= 0) return 0;
        return Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    }, [monthlyRevenue, lastMonthRevenue]);

    // Génération mathématique des points de la courbe réelle (viewBox 0 0 550 140)
    const { pathD, areaD, points } = useMemo(() => {
        const width = 550;
        const height = 130;
        const paddingX = 24;
        const paddingBottom = 20;
        const paddingTop = 25;
        const usableWidth = width - 2 * paddingX;
        const usableHeight = height - paddingTop - paddingBottom;

        // Trouver la valeur maximale pour calibrer l'échelle verticale
        const max = Math.max(...monthlyBreakdown, 500);
        // Arrondir au millier supérieur pour un repère stable
        const safeMax = Math.ceil(max * 1.15);

        // Calcul des coordonnées réelles (x, y) pour chaque mois
        const pts = monthlyBreakdown.map((val, idx) => {
            const x = paddingX + (idx * usableWidth) / 11;
            const ratio = Math.max(0, val) / safeMax;
            const y = height - paddingBottom - ratio * usableHeight;
            return { x, y, val, month: MONTH_LABELS[idx], fullMonth: MONTH_FULL_NAMES[idx] };
        });

        // Construction du tracé de Bézier lisse (Cubic Bezier Spline)
        let strokePath = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const curr = pts[i];
            const next = pts[i + 1];
            // Points de contrôle pour une courbure naturelle
            const cp1x = curr.x + (next.x - curr.x) / 2;
            const cp1y = curr.y;
            const cp2x = curr.x + (next.x - curr.x) / 2;
            const cp2y = next.y;
            strokePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }

        // Zone de remplissage dégradée fermée sous la courbe
        const lastPt = pts[pts.length - 1];
        const firstPt = pts[0];
        const areaPath = `${strokePath} L ${lastPt.x} ${height} L ${firstPt.x} ${height} Z`;

        return { pathD: strokePath, areaD: areaPath, points: pts };
    }, [monthlyBreakdown]);

    const activePoint = points[hoveredMonthIndex] || points[currentMonthIndex];

    return (
        <div 
            onClick={() => navigate('/revenue')}
            className="bento-card-luxe bento-col-8 group cursor-pointer min-h-[340px] flex flex-col justify-between relative overflow-hidden"
        >
            {/* EN-TÊTE : TITRE & CHIFFRES CLÉS */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                            Performances Annuelles
                        </span>
                        <div className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Live : {currentYear}
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        Évolution réelle des encaissements mensuels
                    </p>
                </div>

                {/* KPI PRINCIPAL : CA ANNUEL & ÉVOLUTION */}
                <div className="flex items-baseline sm:flex-col sm:items-end gap-3 sm:gap-0.5">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {formatRevenue(annualRevenue)}
                        </span>
                        <span className="text-base font-bold text-slate-500">DT Total</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md ${
                            growthPercent >= 0 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                            {growthPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{growthPercent >= 0 ? `+${growthPercent}%` : `${growthPercent}%`}</span>
                            <span className="text-slate-400 font-semibold text-xs ml-0.5">vs m-1</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BADGE DU MOIS SÉLECTIONNÉ AU SURVOL / FOCUS */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 mb-2">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {activePoint?.fullMonth} {currentYear} :
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {Math.round(activePoint?.val || 0).toLocaleString('fr-FR')} DT
                    </span>
                    {hoveredMonthIndex === currentMonthIndex && (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider ml-1">
                            (Mois en cours)
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    <span>Détails Finances</span>
                    <ArrowUpRight size={14} />
                </div>
            </div>

            {/* ZONE GRAPHIQUE SVG RÉELLE */}
            <div className="flex-1 flex flex-col justify-end relative mt-1">
                <svg 
                    className="w-full h-[140px] overflow-visible drop-shadow-[0_10px_20px_rgba(59,130,246,0.2)]" 
                    viewBox="0 0 550 130" 
                    preserveAspectRatio="none"
                >
                    <defs>
                        {/* Dégradé de remplissage sous la courbe */}
                        <linearGradient id="real-chart-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                            <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>

                        {/* Dégradé du trait de courbe */}
                        <linearGradient id="real-stroke-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="60%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                    </defs>

                    {/* Lignes de repère horizontales discrètes */}
                    <line x1="24" y1="25" x2="526" y2="25" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
                    <line x1="24" y1="67" x2="526" y2="67" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
                    <line x1="24" y1="110" x2="526" y2="110" stroke="currentColor" strokeOpacity="0.08" />

                    {/* Aire sous la courbe avec fade-in */}
                    <path 
                        key={`area-${pathD}`}
                        d={areaD} 
                        fill="url(#real-chart-grad)" 
                        className="chart-area-fade transition-all duration-700 ease-out"
                    />

                    {/* Ligne principale de la courbe avec animation de tracé dynamique */}
                    <path 
                        key={`line-${pathD}`}
                        d={pathD} 
                        fill="none" 
                        stroke="url(#real-stroke-grad)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="chart-line-demo transition-all duration-700 ease-out"
                    />

                    {/* Ligne verticale indicatrice sur le mois actif */}
                    {activePoint && (
                        <line 
                            x1={activePoint.x} 
                            y1="20" 
                            x2={activePoint.x} 
                            y2="115" 
                            stroke="#3b82f6" 
                            strokeWidth="1.5" 
                            strokeDasharray="2 2"
                            strokeOpacity="0.7"
                        />
                    )}

                    {/* Points réels sur chaque mois */}
                    {points.map((pt, i) => {
                        const isCurrent = i === currentMonthIndex;
                        const isSelected = i === hoveredMonthIndex;
                        const hasRevenue = pt.val > 0;

                        return (
                            <g 
                                key={i} 
                                onMouseEnter={() => setHoveredMonthIndex(i)}
                                className="cursor-pointer"
                            >
                                {/* Zone d'appui tactile élargie */}
                                <circle 
                                    cx={pt.x} 
                                    cy={pt.y} 
                                    r="14" 
                                    fill="transparent" 
                                />

                                {/* Halo lumineux sur le mois sélectionné ou en cours */}
                                {(isSelected || isCurrent) && (
                                    <circle 
                                        cx={pt.x} 
                                        cy={pt.y} 
                                        r={isSelected ? "9" : "7"} 
                                        className={isCurrent ? "fill-blue-500/20 animate-ping" : "fill-blue-500/30"} 
                                    />
                                )}

                                {/* Pastille du point */}
                                <circle 
                                    cx={pt.x} 
                                    cy={pt.y} 
                                    r={isSelected ? "5" : isCurrent ? "4.5" : hasRevenue ? "3.5" : "2"} 
                                    className={`transition-all duration-300 ${
                                        isSelected 
                                            ? 'fill-white stroke-blue-600 stroke-[3]' 
                                            : isCurrent 
                                                ? 'fill-blue-600 stroke-white dark:stroke-slate-900 stroke-2' 
                                                : hasRevenue 
                                                    ? 'fill-indigo-500 dark:fill-indigo-400' 
                                                    : 'fill-slate-300 dark:fill-slate-600'
                                    }`}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* AXE HORIZONTAL DES 12 MOIS */}
                <div className="grid grid-cols-12 gap-0 text-center pt-2 border-t border-slate-100 dark:border-white/5">
                    {MONTH_LABELS.map((label, idx) => {
                        const isCurrent = idx === currentMonthIndex;
                        const isSelected = idx === hoveredMonthIndex;
                        const hasRevenue = (monthlyBreakdown[idx] || 0) > 0;

                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setHoveredMonthIndex(idx);
                                }}
                                onMouseEnter={() => setHoveredMonthIndex(idx)}
                                className={`text-xs uppercase transition-all py-1 rounded-lg ${
                                    isSelected 
                                        ? 'font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' 
                                        : isCurrent 
                                            ? 'font-black text-emerald-600 dark:text-emerald-400 underline decoration-2' 
                                            : hasRevenue 
                                                ? 'font-bold text-slate-700 dark:text-slate-300' 
                                                : 'font-semibold text-slate-400 dark:text-slate-500'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
