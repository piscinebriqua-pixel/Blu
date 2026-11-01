import React, { useState } from 'react';
import { 
    Calendar, 
    Wallet, 
    Receipt, 
    User, 
    CheckCircle2, 
    Clock, 
    MapPin, 
    CreditCard, 
    Banknote, 
    Eye,
    Wrench,
    Mail,
    Phone,
    Shield
} from 'lucide-react';
import { type ExpenseRow } from '../../lib/supabase';
import type { TechnicianInfo } from './TechnicianHeroCard';

export type TechDetailTab = 'interventions' | 'payments' | 'expenses' | 'profile';

interface TechnicianTabsProps {
    technician: TechnicianInfo;
    interventions: any[];
    payments: any[];
    expenses: ExpenseRow[];
    onViewReceipt: (url: string) => void;
}

export const TechnicianTabs: React.FC<TechnicianTabsProps> = ({
    technician,
    interventions,
    payments,
    expenses,
    onViewReceipt
}) => {
    const [activeTab, setActiveTab] = useState<TechDetailTab>('interventions');

    return (
        <div className="flex flex-col gap-3">
            {/* Barre d'Onglets Segmentés Mobile-First */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar touch-pan-x">
                {[
                    { id: 'interventions', label: 'Interventions', count: interventions.length, icon: Calendar },
                    { id: 'payments', label: 'Encaissements', count: payments.length, icon: Wallet },
                    { id: 'expenses', label: 'Dépenses & Carburant', count: expenses.length, icon: Receipt },
                    { id: 'profile', label: 'Fiche Complète', count: null, icon: User }
                ].map((t) => {
                    const IconComponent = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id as TechDetailTab)}
                            className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <IconComponent size={16} />
                            <span>{t.label}</span>
                            {t.count !== null && (
                                <span className={`px-1.5 py-0.5 rounded-md text-xs font-black ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* CONTENU EN GRILLE 2 COLONNES (HAUTE DENSITÉ - ZÉRO ESPACE PERDU) */}
            <div className="min-h-[250px]">
                {/* 1. ONGLET INTERVENTIONS */}
                {activeTab === 'interventions' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                        {interventions.length === 0 ? (
                            <div className="col-span-full p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-900">
                                <Calendar size={28} className="mx-auto mb-2 text-slate-400" />
                                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Aucune intervention assignée</p>
                            </div>
                        ) : (
                            interventions.map((item) => {
                                const isCompleted = item.status === 'completed';
                                const dateFormatted = new Date(item.completed_date || item.scheduled_date || item.created_at)
                                    .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

                                return (
                                    <div
                                        key={item.id}
                                        className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-row items-center justify-between gap-3 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 text-left flex-1">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                isCompleted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-blue-100 text-blue-600 dark:bg-blue-950/40'
                                            }`}>
                                                {isCompleted ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                                                        {item.pool?.client?.first_name} {item.pool?.client?.last_name}
                                                    </span>
                                                    <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                                                        isCompleted 
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                    }`}>
                                                        {isCompleted ? 'Fait' : 'Prévu'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                                                    <span>{item.pool?.name || 'Bassin'}</span>
                                                    {item.pool?.client?.city && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-0.5 truncate"><MapPin size={12} className="shrink-0" /> {item.pool.client.city}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                {dateFormatted}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* 2. ONGLET ENCAISSEMENTS */}
                {activeTab === 'payments' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                        {payments.length === 0 ? (
                            <div className="col-span-full p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-900">
                                <Wallet size={28} className="mx-auto mb-2 text-slate-400" />
                                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Aucun encaissement enregistré</p>
                            </div>
                        ) : (
                            payments.map((p) => {
                                const isCash = p.method === 'cash';
                                return (
                                    <div
                                        key={p.id}
                                        className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-row items-center justify-between gap-3 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 text-left flex-1">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                isCash ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40'
                                            }`}>
                                                {isCash ? <Banknote size={18} /> : <CreditCard size={18} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                                                    {p.client?.first_name} {p.client?.last_name || 'Client comptoir'}
                                                </div>
                                                <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                    <span>{new Date(p.payment_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                                    <span>•</span>
                                                    <span className="uppercase font-bold text-slate-600 dark:text-slate-400">
                                                        {p.method === 'cash' ? 'Espèces' : p.method}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-base sm:text-lg font-black text-emerald-600">
                                                +{Number(p.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs">DT</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* 3. ONGLET DÉPENSES & CARBURANT */}
                {activeTab === 'expenses' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                        {expenses.length === 0 ? (
                            <div className="col-span-full p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-900">
                                <Receipt size={28} className="mx-auto mb-2 text-slate-400" />
                                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Aucune dépense imputée à ce technicien</p>
                            </div>
                        ) : (
                            expenses.map((e) => (
                                <div
                                    key={e.id}
                                    className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-row items-center justify-between gap-3 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0 text-left flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                                            <Wrench size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                {e.supplier || e.description || e.category?.name || 'Dépense terrain'}
                                            </div>
                                            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <span>{new Date(e.expense_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                                <span>•</span>
                                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                                    {e.payment_method === 'cash_technician' ? 'Déduit Caisse' : 'Carte Pro'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <span className="text-base sm:text-lg font-black text-rose-500">
                                            -{Number(e.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs">DT</span>
                                        </span>
                                        {e.receipt_url && (
                                            <button
                                                type="button"
                                                onClick={() => onViewReceipt(e.receipt_url!)}
                                                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-blue-600 transition-colors shrink-0"
                                                title="Voir le reçu"
                                            >
                                                <Eye size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 4. ONGLET FICHE ADMINISTRATIVE */}
                {activeTab === 'profile' && (
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col gap-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                            Coordonnées & Informations Administratives
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                                    <Phone size={14} /> Téléphone Mobile
                                </span>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                    {technician.phone || 'Non renseigné'}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                                    <Mail size={14} /> Email / Compte Connexion
                                </span>
                                <p className="text-base font-black text-slate-900 dark:text-white truncate">
                                    {technician.email || 'Aucun email'}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                                    <Shield size={14} /> Statut d'activité
                                </span>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                    {technician.active ? 'Actif sur les plannings' : 'Compte suspendu'}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                                    <User size={14} /> Identifiant Unique
                                </span>
                                <p className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 truncate">
                                    {technician.id}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicianTabs;
