import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Receipt, ChevronRight } from 'lucide-react';
import type { DashboardCounts } from '../../hooks/useDashboardStats';

interface CommercialBentoCardsProps {
    counts: Pick<DashboardCounts, 'devis' | 'devisPendingAmount' | 'invoicesCount' | 'invoicesPendingAmount'>;
}

export const CommercialBentoCards: React.FC<CommercialBentoCardsProps> = ({ counts }) => {
    const navigate = useNavigate();

    return (
        <>
            {/* CARTE DEVIS COMMERCIAUX */}
            <div 
                onClick={() => navigate('/devis')} 
                className="bento-card-luxe bento-col-6 group cursor-pointer hover:border-amber-500/50 transition-all min-h-[140px] flex flex-col justify-between"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                                Devis Commerciaux
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 mt-1">
                                Offres & Propositions en cours
                            </p>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                    </div>
                </div>
                <div className="flex items-end justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                    <div>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                            {counts.devis} en négociation
                        </span>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                            {counts.devisPendingAmount.toFixed(0)} <span className="text-base text-slate-500 font-bold">DT</span>
                        </p>
                    </div>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                        Gérer les devis
                    </span>
                </div>
            </div>

            {/* CARTE FACTURATION */}
            <div 
                onClick={() => navigate('/factures')} 
                className="bento-card-luxe bento-col-6 group cursor-pointer hover:border-blue-500/50 transition-all min-h-[140px] flex flex-col justify-between"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Receipt size={28} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                                Facturation
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 mt-1">
                                Pièces comptables & Recouvrement
                            </p>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                    </div>
                </div>
                <div className="flex items-end justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                    <div>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                            {counts.invoicesCount} facture(s) émises
                        </span>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                            {counts.invoicesPendingAmount.toFixed(0)} <span className="text-base text-slate-500 font-bold">DT à recouvrer</span>
                        </p>
                    </div>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-200/50 dark:border-blue-900/40">
                        Voir les factures
                    </span>
                </div>
            </div>
        </>
    );
};
