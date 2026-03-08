import React, { useState } from 'react';
import ModalLayout from './ModalLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Droplets, Edit2, MessageCircle, Trash2, Loader2, X, Calendar, ClipboardList, Package, Info, CheckCircle2, Wrench } from 'lucide-react';
import BccpLogo from './BccpLogo';

interface Intervention {
    id: string;
    visit_date?: string;
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
    onStatusChange?: () => void;
}

const InterventionDetailsModal: React.FC<InterventionDetailsModalProps> = ({ intervention, onClose, onEdit, onDelete, onStatusChange }) => {
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

    return (
        <ModalLayout onClose={onClose} title="Rapport d'Intervention" bodyClassName="!p-0 bg-slate-50 dark:bg-[#0f141e]">
            {/* Header Premium avec Gradient & Logo */}
            <div className="relative overflow-hidden pt-8 pb-10 px-6 bg-gradient-to-br from-[#0077B6] to-[#023E8A]">
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none rotate-12">
                    <BccpLogo width={280} fillColor="white" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-4 shadow-2xl">
                        <ClipboardList size={38} className="text-white" />
                    </div>

                    <span className="text-xs font-black text-white/80 uppercase tracking-[0.3em] mb-2 drop-shadow-sm">Fiche Entretien</span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                        {intervention.pool?.client?.first_name} {intervention.pool?.client?.last_name}
                    </h2>

                    <div className="mt-4 flex items-center gap-3">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl flex flex-col items-center">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Solde</span>
                            <span className={`text-base font-black ${intervention.pool?.client?.balance && intervention.pool.client.balance < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                                {(intervention.pool?.client?.balance || 0).toFixed(0)} DT
                            </span>
                        </div>
                        <div className="px-5 py-3 bg-white text-[#023E8A] rounded-[22px] shadow-xl flex flex-col items-center ring-4 ring-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">Total Rapport</span>
                            <div className="flex items-baseline gap-0.5 leading-none">
                                <span className="text-2xl font-black tracking-tighter">{totalAmount.toFixed(0)}</span>
                                <span className="text-xs font-black">DT</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body avec Cards Premium */}
            <div className="px-5 py-6 -mt-6 bg-slate-50 dark:bg-[#0f141e] rounded-t-[40px] relative z-20 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">

                {/* 1. Informations Générales */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600"><Info size={14} /></div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bassin</span>
                        </div>
                        <span className="text-base font-black text-slate-800 dark:text-white uppercase truncate block">
                            {intervention.pool_name || intervention.pool?.name || 'Piscine Principale'}
                        </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600"><Calendar size={14} /></div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                        </div>
                        <span className="text-base font-black text-slate-800 dark:text-white uppercase block">
                            {new Date(intervention.scheduled_date || intervention.visit_date || intervention.created_at).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                </div>

                {/* 2. Statut & Action Rapide */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">État de l'intervention</span>
                        <div className="text-[10px] font-black text-slate-300 uppercase">Réf: #{intervention.id.slice(0, 6)}</div>
                    </div>
                    <div className="relative group">
                        <select
                            title="Changer le statut"
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isUpdatingStatus}
                            className={`w-full h-14 text-base font-black uppercase rounded-2xl px-5 outline-none appearance-none cursor-pointer transition-all border-2 border-transparent ${currentStatus === "completed"
                                ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20"
                                : currentStatus === "in_progress"
                                    ? "bg-amber-50 text-amber-600 ring-amber-500/20"
                                    : "bg-blue-50 text-blue-600 ring-blue-500/20"
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

                {/* 3. Mesures Chimiques */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 text-center">Mesures Techniques</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-[#1a2332] rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center shrink-0">
                                <Droplets size={22} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Niveau pH</span>
                                <div className="text-xl font-black text-slate-800 dark:text-white leading-none mt-1">{intervention.ph_level || '--'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-[#1a2332] rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                                <Droplets size={22} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Chlore</span>
                                <div className="text-xl font-black text-slate-800 dark:text-white leading-none mt-1">{intervention.chlorine_level || '--'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Checklist & Tâches */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-5 text-center">Protocole d'Entretien</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {[
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
                        ].map(task => {
                            const isDone = intervention[task.key as keyof Intervention];
                            return (
                                <div key={task.key} className="flex items-center group">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-3 transition-all ${isDone ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110" : "bg-slate-100 dark:bg-slate-700 text-transparent"}`}>
                                        <CheckCircle2 size={16} strokeWidth={3} />
                                    </div>
                                    <span className={`text-[13px] font-bold uppercase tracking-tight transition-colors ${isDone ? 'text-slate-800 dark:text-white font-black' : 'text-slate-400'}`}>
                                        {task.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Facturation Détails */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 text-center">Détail Facturation</h4>
                    {!intervention.services?.length && !intervention.products?.length ? (
                        <div className="py-4 text-center text-sm font-bold text-slate-300 uppercase tracking-widest italic">Aucun article facturé</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {intervention.services?.map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-[#1a2332] rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Wrench size={16} /></div>
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">{s.service?.name}</span>
                                    </div>
                                    <span className="text-base font-black text-slate-900 dark:text-white">{s.price_at_time} DT</span>
                                </div>
                            ))}
                            {intervention.products?.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-50 dark:border-emerald-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><Package size={16} /></div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">{p.product?.name}</span>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Quantité: {p.quantity} {p.product?.unit}</span>
                                        </div>
                                    </div>
                                    <span className="text-base font-black text-slate-900 dark:text-white">{p.total_price} DT</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 6. Photos & Reportage */}
                {(intervention.photo_before_url || intervention.photo_after_url) && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                        <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-5 text-center">Preuve Visuelle</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Avant Intervention</span>
                                <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-slate-100 ring-4 ring-slate-50 relative group">
                                    {intervention.photo_before_url ? (
                                        <img src={intervention.photo_before_url} alt="Avant" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-20"><BccpLogo width={60} /></div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Après Intervention</span>
                                <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-slate-100 ring-4 ring-slate-50 relative group">
                                    {intervention.photo_after_url ? (
                                        <img src={intervention.photo_after_url} alt="Après" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-20"><BccpLogo width={60} /></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. Notes & Observations */}
                {intervention.notes && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-[28px] p-6 border border-amber-100 dark:border-amber-900/20 mb-4 shadow-inner">
                        <div className="flex items-center gap-2 mb-3">
                            <Info size={18} className="text-amber-600" />
                            <span className="text-[12px] font-black text-amber-600 uppercase tracking-widest">Observations du technicien</span>
                        </div>
                        <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200 font-medium italic">
                            "{intervention.notes}"
                        </p>
                    </div>
                )}
            </div>

            {/* Actions Footer Fixé */}
            <div className="bg-white dark:bg-slate-800 px-6 py-5 border-t border-slate-100 dark:border-white/5 flex gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-30">
                {onEdit && (
                    <button
                        className="flex-1 h-14 bg-[#0077B6] text-white rounded-[22px] font-black uppercase text-[12px] tracking-widest shadow-xl shadow-[#0077B6]/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        onClick={() => onEdit(intervention)}
                    >
                        <Edit2 size={16} strokeWidth={3} />
                        Modifier
                    </button>
                )}

                {intervention.pool?.client?.phone && (
                    <button
                        className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[22px] flex items-center justify-center shrink-0 transition-all hover:bg-emerald-100 active:scale-90"
                        onClick={handleWhatsAppShare}
                        title="Partager via WhatsApp"
                    >
                        <MessageCircle size={22} strokeWidth={2.5} />
                    </button>
                )}

                {onDelete && (
                    <button
                        className="w-14 h-14 bg-rose-50 text-rose-500 rounded-[22px] flex items-center justify-center shrink-0 transition-all hover:bg-rose-100 active:scale-90"
                        onClick={() => onDelete(intervention)}
                        title="Supprimer Rapport"
                    >
                        <Trash2 size={22} strokeWidth={2.5} />
                    </button>
                )}

                <button
                    className="w-14 h-14 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-[22px] flex items-center justify-center shrink-0 transition-all hover:bg-slate-200 active:scale-90"
                    onClick={onClose}
                    title="Fermer"
                >
                    <X size={22} strokeWidth={3} />
                </button>
            </div>
        </ModalLayout>
    );
};

export default InterventionDetailsModal;
