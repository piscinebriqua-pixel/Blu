import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Users, FileText, QrCode, Settings, Activity, Briefcase } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRevenue } from '../../lib/formatters';
import type { DashboardCounts, UserProfile } from '../../hooks/useDashboardStats';

interface OperationsBentoCardsProps {
    counts: DashboardCounts;
    profile: UserProfile | null;
    onOpenQrModal: () => void;
}

export const OperationsBentoCards: React.FC<OperationsBentoCardsProps> = ({
    counts,
    profile,
    onOpenQrModal
}) => {
    const navigate = useNavigate();

    return (
        <>
            {/* CA Mensuel / Annuel */}
            <div onClick={() => navigate('/revenue')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                        <Wallet size={24} />
                    </div>
                    <h3 className="text-sm 2xl:text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight truncate">CA Mensuel</h3>
                </div>
                <div className="flex flex-col gap-1 min-w-0 mt-auto">
                    <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest truncate">Revenus annuels</p>
                    <p className="text-2xl 2xl:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate leading-none">{formatRevenue(counts.annualRevenue)} DT</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1 truncate">Comparaison précédente</p>
                </div>
            </div>

            {/* Fiches Clients */}
            <div onClick={() => navigate('/clients')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Users size={24} />
                    </div>
                    <h3 className="text-sm 2xl:text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight truncate">Fiches Clients</h3>
                </div>
                <div className="avatar-stack mb-3">
                    <div className="avatar-stack-item bg-[#334155] ring-2 ring-white dark:ring-[#020617]">JD</div>
                    <div className="avatar-stack-item bg-[#475569] ring-2 ring-white dark:ring-[#020617]">MK</div>
                    <div className="avatar-stack-item bg-[#1e293b] ring-2 ring-white dark:ring-[#020617]">AL</div>
                    <div className="avatar-stack-item bg-[#111827] ring-2 ring-white dark:ring-[#020617]">RB</div>
                    <div className="avatar-stack-item bg-slate-900 ring-2 ring-white dark:ring-[#020617] text-blue-400">+{counts.clients > 4 ? counts.clients - 4 : 2}</div>
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight truncate">Mohamed Name, Conne, Wahran...</p>
            </div>

            {/* Paiements */}
            <div onClick={() => navigate('/payments')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Wallet size={24} />
                    </div>
                    <h3 className="text-sm 2xl:text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight truncate">Paiements</h3>
                </div>
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-full border-[6px] border-emerald-500/20 border-t-emerald-500 rotate-45 shrink-0" />
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-none truncate">Prm... 45K DT</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-none truncate">Pro... 25K DT</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chantiers */}
            <div onClick={() => navigate('/chantiers')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-sm 2xl:text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight truncate">Chantiers</h3>
                </div>
                <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Travaux en cours</p>
                        <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="w-2/3 h-full bg-cyan-500" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progression des chantiers</span>
                    </div>
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-2">Suivi d'activité</p>
                </div>
            </div>

            {/* Espace Client QR */}
            <div onClick={onOpenQrModal} className="bento-card-luxe bento-col-3 group cursor-pointer">
                <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-white flex items-center justify-center shrink-0">
                        <QrCode size={24} />
                    </div>
                    <h3 className="text-sm 2xl:text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight truncate">Espace Client</h3>
                </div>
                <div className="flex-1 flex items-center justify-center py-2">
                    <div className="p-3 bg-white dark:bg-white/90 rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
                        <QRCodeSVG value={`${window.location.origin}/mon-espace`} size={90} fgColor="#0F172A" />
                    </div>
                </div>
            </div>

            {/* Caisse Admin */}
            {profile?.role === 'admin' && (
                <div onClick={() => navigate('/admin-finance')} className="bento-card-luxe bento-col-3 group cursor-pointer !bg-slate-900 border-none">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center ring-1 ring-orange-500/30 shrink-0">
                                <Wallet size={24} />
                            </div>
                            <h3 className="text-sm 2xl:text-base font-black text-white uppercase tracking-wider leading-tight truncate">Gestion Caisse</h3>
                        </div>
                        <span className="bg-orange-500/90 px-2 py-0.5 rounded text-xs font-black text-white shrink-0 tracking-wider">ADMIN</span>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 mt-auto">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest truncate">Actions Requises</p>
                        <p className="text-2xl 2xl:text-3xl font-black text-white tracking-tight truncate leading-none">FINANCES</p>
                    </div>
                </div>
            )}

            {/* Configuration Admin */}
            {profile?.role === 'admin' && (
                <div onClick={() => navigate('/settings')} className="bento-card-luxe bento-col-3 group cursor-pointer !bg-blue-900 border-none">
                    <div className="flex items-center gap-3.5 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center ring-1 ring-blue-500/30 shrink-0">
                            <Settings size={24} />
                        </div>
                        <h3 className="text-sm 2xl:text-base font-black text-white uppercase tracking-wider leading-tight truncate">Configuration</h3>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 mt-auto">
                        <p className="text-xs font-black text-blue-300/70 uppercase tracking-widest truncate">Système</p>
                        <p className="text-2xl 2xl:text-3xl font-black text-white tracking-tight truncate leading-none">PARAMÈTRES</p>
                    </div>
                </div>
            )}

            {/* Ma Tournée */}
            <div onClick={() => navigate('/technician-portal')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <Activity size={24} />
                    </div>
                    <h3 className="text-sm 2xl:text-base font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight truncate">Ma Tournée</h3>
                </div>
                <div className="flex justify-between items-end mb-2 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{counts.scheduled} en cours</p>
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">/ {counts.scheduled + 5} total</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-3">
                    <div className="w-1/3 h-full bg-rose-500" />
                </div>
                <div className="space-y-1.5 min-w-0">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">Project Name A</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">Project Name B</p>
                </div>
            </div>

            {/* Équipe */}
            <div onClick={() => navigate('/technicians')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <Users size={24} />
                    </div>
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight truncate">Équipe</h3>
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-2 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative z-10 text-center">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{counts.technicians}</p>
                        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Membres</p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-primary/20 rounded-full animate-ping" />
                </div>
            </div>

            {/* Partenaires */}
            <div onClick={() => navigate('/partners')} className="bento-card-luxe bento-col-3 group cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                        <Briefcase size={24} />
                    </div>
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-tight truncate">Partenaires</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="aspect-video bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-800" />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
