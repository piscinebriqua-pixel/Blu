import React, { useState } from 'react';
import ModalLayout from './ModalLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Droplets, Edit2, MessageCircle, Trash2, Loader2, X, Calendar, ClipboardList, Package, Info, CheckCircle2, Wrench } from 'lucide-react';
import BccpLogo from './BccpLogo';
import { formatBalance } from '../lib/formatters';

interface Intervention {
    id: string;
    completed_date?: string | null;
    scheduled_date?: string;
    created_at: string;
    notes: string;
    ph_level: number;
    chlorine_level: number;
    status: string;
    pool_name?: string;
    pool_id?: string;
    pool?: {
        name: string;
        client?: {
            id: string;
            first_name: string;
            last_name: string;
            balance: number;
            phone?: string;
        }
    };
    services?: {
        price_at_time: number;
        service?: { name: string; }
    }[];
    products?: {
        quantity: number;
        total_price: number;
        product?: { name: string; unit: string; }
    }[];
    photo_before_url?: string;
    photo_after_url?: string;
    water_level_adjusted?: boolean;
    task_balai?: boolean;
    task_lavage?: boolean;
    task_rincage?: boolean;
    task_test_chlore?: boolean;
    task_test_ph?: boolean;
    task_remplissage?: boolean;
    task_panier_prefiltre?: boolean;
    task_traitement?: boolean;
    task_verif_vanne?: boolean;
    task_temps_fonctionnement?: boolean;
}

interface InterventionDetailsModalProps {
    intervention: Intervention;
    onClose: () => void;
    onEdit?: (intervention: Intervention) => void;
    onDelete?: (intervention: Intervention) => void;
    onStart?: (intervention: Intervention) => void;
    onStatusChange?: () => void;
}

const InterventionDetailsModal: React.FC<InterventionDetailsModalProps> = ({ intervention, onClose, onEdit, onDelete, onStart, onStatusChange }) => {
    const [currentStatus, setCurrentStatus] = useState(intervention.status);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            const { error } = await supabase
                .from('interventions')
                .update({ status: newStatus })
                .eq('id', intervention.id);

            if (error) throw error;
            setCurrentStatus(newStatus);
            toast.success('Statut mis à jour');
            if (onStatusChange) {
                onStatusChange();
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error(error.message || 'Erreur lors de la mise à jour du statut');
            setCurrentStatus(intervention.status); // revert
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleWhatsAppShare = () => {
        if (!intervention.pool?.client?.phone) return;

        const date = new Date(intervention.created_at).toLocaleDateString('fr-FR');
        const services = intervention.services?.map(s => `- ${s.service?.name} : ${s.price_at_time} DT`).join('\n') || '';
        const products = intervention.products?.map(p => `- ${p.product?.name} (${p.quantity} ${p.product?.unit}) : ${p.total_price} DT`).join('\n') || '';

        const totalAmount = (intervention.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0) +
            (intervention.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0);

        let message = `*Rapport d'intervention - ${intervention.pool?.name || 'Piscine'}*\n`;
        message += `📅 Date: ${date}\n\n`;

        if (intervention.ph_level || intervention.chlorine_level) {
            message += `*Mesures techniques :*\n`;
            if (intervention.ph_level) message += `🧪 pH : ${intervention.ph_level}\n`;
            if (intervention.chlorine_level) message += `💧 Chlore : ${intervention.chlorine_level} ppm\n\n`;
        }

        if (services) {
            message += `*Services effectués :*\n${services}\n\n`;
        }

        if (products) {
            message += `*Produits utilisés :*\n${products}\n\n`;
        }

        message += `*Total : ${(totalAmount || 0).toFixed(0)} DT*\n\n`;

        if (intervention.notes) {
            message += `*Note :* ${intervention.notes}\n\n`;
        }

        if (intervention.photo_before_url || intervention.photo_after_url) {
            message += `*Photos du rapport :*\n`;
            if (intervention.photo_before_url) message += `📸 Avant : ${intervention.photo_before_url}\n`;
            if (intervention.photo_after_url) message += `📸 Après : ${intervention.photo_after_url}\n\n`;
        }

        const tasks = [
            { key: 'task_balai', label: 'Balai' },
            { key: 'task_lavage', label: 'Lavage' },
            { key: 'task_rincage', label: 'Rinçage' },
            { key: 'task_test_chlore', label: 'Teste Chlore' },
            { key: 'task_test_ph', label: 'Teste PH' },
            { key: 'task_remplissage', label: 'Remplissage' },
            { key: 'task_panier_prefiltre', label: 'Panier Pré-filtre' },
            { key: 'task_traitement', label: 'Traitement' },
            { key: 'task_verif_vanne', label: 'Vérification Vanne' },
            { key: 'task_temps_fonctionnement', label: 'Temps Fonct.' }
        ].filter(t => intervention[t.key as keyof Intervention])
            .map(t => `✅ ${t.label}`)
            .join('\n');

        if (tasks) {
            message += `*Tâches d'entretien :*\n${tasks}\n\n`;
        }

        message += `Merci de votre confiance ! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        let phone = intervention.pool.client.phone.replace(/\s+/g, '').replace('+', '');

        // Si c'est un numéro tunisien à 8 chiffres, ajouter l'indicatif 216
        let cleanPhone = phone.replace(/[\s\-\.]/g, '');
        if (cleanPhone && !cleanPhone.startsWith('216') && !cleanPhone.startsWith('+')) {
            cleanPhone = `216${cleanPhone}`;
        }
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    };

    const totalAmount = (intervention.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0) +
        (intervention.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0);

    const checklistTasks = [
        { key: 'task_balai', label: 'Passage Balai' },
        { key: 'task_lavage', label: 'Lavage Filtre' },
        { key: 'task_rincage', label: 'Rinçage' },
        { key: 'task_test_chlore', label: 'Test Chlore' },
        { key: 'task_test_ph', label: 'Test PH' },
        { key: 'task_remplissage', label: 'Remplissage' },
        { key: 'task_panier_prefiltre', label: 'Pré-filtre' },
        { key: 'task_traitement', label: 'Traitement' },
        { key: 'task_verif_vanne', label: 'Vannes' },
        { key: 'task_temps_fonctionnement', label: 'Réglage Temps' }
    ];
    const completedTasksCount = checklistTasks.filter(t => (intervention as any)[t.key]).length;
    const totalTasksCount = checklistTasks.length;
    const progressPercentage = (completedTasksCount / totalTasksCount) * 100;

    return (
        <ModalLayout 
            onClose={onClose} 
            title="Rapport d'Intervention" 
            bodyClassName="!p-0 bg-slate-50 dark:bg-[#0f141e]"
            actions={
                <div className="flex flex-col w-full gap-3">
                    {/* Actions Principales */}
                    {( (intervention.status?.toLowerCase() !== 'completed' && onStart) || onEdit ) && (
                        <div className="flex w-full gap-3">
                            {intervention.status?.toLowerCase() !== 'completed' && onStart && (
                                <button
                                    className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl shadow-emerald-500/30 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3"
                                    onClick={() => onStart(intervention)}
                                >
                                    <Droplets size={18} strokeWidth={3} className="animate-pulse" />
                                    Démarrer
                                </button>
                            )}

                            {onEdit && (
                                <button
                                    className="flex-1 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-black uppercase text-[12px] tracking-[0.2em] shadow-xl transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3"
                                    onClick={() => onEdit(intervention)}
                                >
                                    <Edit2 size={18} strokeWidth={3} />
                                    Modifier
                                </button>
                            )}
                        </div>
                    )}

                    {/* Actions Secondaires */}
                    <div className="flex gap-2 justify-center">
                        {intervention.pool?.client?.phone && (
                            <button
                                className="flex-1 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-[24px] flex items-center justify-center transition-all hover:bg-emerald-100 active:scale-90 shadow-sm gap-2"
                                onClick={handleWhatsAppShare}
                                title="Partager via WhatsApp"
                            >
                                <MessageCircle size={20} strokeWidth={2.5} />
                                <span className="text-[10px] font-black uppercase">WhatsApp</span>
                            </button>
                        )}

                        {onDelete && (
                            <button
                                className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-[24px] flex items-center justify-center transition-all hover:bg-rose-100 active:scale-90 shadow-sm shrink-0"
                                onClick={() => onDelete(intervention)}
                                title="Supprimer Rapport"
                            >
                                <Trash2 size={20} strokeWidth={2.5} />
                            </button>
                        )}

                        <button
                            className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-[24px] flex items-center justify-center transition-all hover:bg-slate-200 active:scale-90 shrink-0"
                            onClick={onClose}
                            title="Fermer"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            }
        >
            {/* Header Premium "Crystal Vision" */}
            <div className="relative overflow-hidden pt-8 pb-16 px-6 bg-gradient-to-br from-[#0077B6] via-[#023E8A] to-[#03045E]">
                {/* Background Floating Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute top-20 -right-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-700" />
                    <div className="absolute -bottom-20 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>
                
                <div className="absolute -right-8 bottom-4 opacity-10 pointer-events-none rotate-12">
                    <BccpLogo width={200} fillColor="white" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    {/* Floating Icon Container */}
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-4 shadow-2xl ring-4 ring-white/5 float-animation">
                        <ClipboardList size={32} className="text-white" />
                    </div>

                    {/* Glass Client Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[24px] px-8 py-4 shadow-2xl text-center max-w-xs w-full">
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em] block mb-1">Rapport Client</span>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                            {intervention.pool?.client?.first_name} {intervention.pool?.client?.last_name}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Depth Indicators Panel (Chevauchement) */}
            <div className="relative z-30 px-6 -mt-10 flex gap-4">
                <div className={`flex-1 ${formatBalance(intervention.pool?.client?.balance || 0).bg} rounded-[28px] p-5 shadow-xl border ${formatBalance(intervention.pool?.client?.balance || 0).border} flex flex-col items-center group hover:scale-[1.02] transition-transform`}>
                    <span className={`text-[10px] font-black ${formatBalance(intervention.pool?.client?.balance || 0).text} opacity-50 uppercase tracking-widest mb-1`}>Solde Actuel</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-black ${formatBalance(intervention.pool?.client?.balance || 0).text}`}>
                            {formatBalance(intervention.pool?.client?.balance || 0).amount}
                        </span>
                        <span className={`text-xs font-black ${formatBalance(intervention.pool?.client?.balance || 0).text} opacity-30`}>{formatBalance(intervention.pool?.client?.balance || 0).unit}</span>
                    </div>
                </div>
                <div className="flex-1 grad-blue rounded-[28px] p-5 shadow-xl shadow-[#0077B6]/20 flex flex-col items-center group hover:scale-[1.02] transition-transform">
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Total Rapport</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white tracking-tighter">
                            {totalAmount.toFixed(0)}
                        </span>
                        <span className="text-xs font-black text-white/50">DT</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="px-5 pt-8 pb-32 flex flex-col gap-6">
                
                {/* 1. Monitoring Technique */}
                <div className="card-white p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Analyse Technique</h4>
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                            <Calendar size={12} className="text-blue-500" />
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                                {new Date(intervention.completed_date || intervention.scheduled_date || intervention.created_at).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-[#0f141e] p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center mb-3">
                                <Droplets size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Niveau pH</span>
                            <div className="text-2xl font-black text-slate-800 dark:text-white">{intervention.ph_level || '--'}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0f141e] p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-3">
                                <Droplets size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Chlore</span>
                            <div className="text-2xl font-black text-slate-800 dark:text-white">{intervention.chlorine_level || '--'}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Statut Quick-Manage */}
                <div className="card-white p-5 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Statut Intervention</span>
                        <div className="text-[10px] font-black text-slate-300 uppercase">#{intervention.id.slice(0, 6)}</div>
                    </div>
                    <div className="relative group">
                        <select
                            title="Changer le statut"
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isUpdatingStatus}
                            className={`w-full h-12 text-sm font-black uppercase rounded-2xl px-5 outline-none appearance-none cursor-pointer transition-all border-2 border-transparent ${currentStatus === "completed"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20"
                                : currentStatus === "in_progress"
                                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20"
                                    : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20"
                                } focus:ring-4`}
                        >
                            <option value="scheduled">Planifié</option>
                            <option value="cancelled">Annulé</option>
                            <option value="completed" disabled hidden>Terminé</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            {isUpdatingStatus ? <Loader2 size={18} className="animate-spin" /> : <Edit2 size={16} />}
                        </div>
                    </div>
                </div>

                {/* 3. Protocole d'Entretien avec Progression */}
                <div className="card-white p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">Protocole Technique</h4>
                        <div className="flex flex-col items-end">
                            <span className="text-[14px] font-black text-emerald-600">{completedTasksCount}/{totalTasksCount}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Missions complétées</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden border border-slate-100 dark:border-white/5">
                        <div 
                            className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {checklistTasks.map(task => {
                            const isDone = (intervention as any)[task.key];
                            return (
                                <div key={task.key} className="flex items-center group">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-3 transition-all ${isDone ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110" : "bg-slate-100 dark:bg-slate-700 text-transparent border border-slate-100 dark:border-white/5"}`}>
                                        <CheckCircle2 size={16} strokeWidth={3} />
                                    </div>
                                    <span className={`text-[13px] font-bold uppercase tracking-tight transition-colors ${isDone ? 'text-slate-800 dark:text-white font-black' : 'text-slate-400 opacity-60'}`}>
                                        {task.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Facturation Détails */}
                <div className="card-white p-6">
                    <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-6">Détail Facturation</h4>
                    {!intervention.services?.length && !intervention.products?.length ? (
                        <div className="py-8 text-center bg-slate-50 dark:bg-[#0f141e] rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Aucun article facturé</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {intervention.services?.map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-50 dark:border-blue-900/10 hover:bg-blue-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center"><Wrench size={18} /></div>
                                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{s.service?.name}</span>
                                    </div>
                                    <span className="text-base font-black px-4 py-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm">{s.price_at_time} DT</span>
                                </div>
                            ))}
                            {intervention.products?.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-50 dark:border-emerald-900/10 hover:bg-emerald-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center"><Package size={18} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{p.product?.name}</span>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Quantité: {p.quantity} {p.product?.unit}</span>
                                        </div>
                                    </div>
                                    <span className="text-base font-black px-4 py-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm">{p.total_price} DT</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 5. Photos Section */}
                {(intervention.photo_before_url || intervention.photo_after_url) && (
                    <div className="card-white p-6">
                        <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] mb-6">Preuve Visuelle</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Avant</span>
                                <div className="aspect-[3/4] rounded-[28px] overflow-hidden bg-slate-100 dark:bg-slate-800 ring-4 ring-slate-100/50 dark:ring-white/5 relative group shadow-lg">
                                    {intervention.photo_before_url ? (
                                        <img src={intervention.photo_before_url} alt="Avant" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-10"><BccpLogo width={50} /></div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Après</span>
                                <div className="aspect-[3/4] rounded-[28px] overflow-hidden bg-slate-100 dark:bg-slate-800 ring-4 ring-slate-100/50 dark:ring-white/5 relative group shadow-lg">
                                    {intervention.photo_after_url ? (
                                        <img src={intervention.photo_after_url} alt="Après" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-10"><BccpLogo width={50} /></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Notes & Observations */}
                {intervention.notes && (
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border-2 border-dashed border-amber-200 dark:border-amber-900/30 mb-4 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rotate-45 -mr-8 -mt-8" />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center"><Info size={20} /></div>
                            <span className="text-[12px] font-black text-amber-600 uppercase tracking-widest">Observations techniques</span>
                        </div>
                        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium italic pl-2 border-l-4 border-l-amber-500/30">
                            "{intervention.notes}"
                        </p>
                    </div>
                )}
            </div>

        </ModalLayout>
    );
};

export default InterventionDetailsModal;
