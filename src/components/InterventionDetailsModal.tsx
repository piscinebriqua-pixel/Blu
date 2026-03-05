import React, { useState } from 'react';
import ModalLayout from './ModalLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Droplets, Edit2, MessageCircle, Trash2, Loader2, X } from 'lucide-react';

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

        const totalAmount = (intervention.services?.reduce((acc, s) => acc + s.price_at_time, 0) || 0) +
            (intervention.products?.reduce((acc, p) => acc + p.total_price, 0) || 0);

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

    return (
        <ModalLayout onClose={onClose} title="Détails Rapport" bodyClassName="!p-4 sm:!p-5">
            <div className="flex flex-col gap-4 pb-1">
                {/* Header Section Compact */}
                <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500/70 mb-0.5">Rapport d'intervention</span>
                    <h2 className="text-xl leading-tight font-black text-slate-900 dark:text-white uppercase tracking-tight text-center break-words max-w-full">
                        {intervention.pool?.client?.first_name} {intervention.pool?.client?.last_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[12px] font-black uppercase px-2 py-0.5 rounded-md ${intervention.pool?.client?.balance && intervention.pool.client.balance < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            Solde: {(intervention.pool?.client?.balance || 0).toFixed(0)} DT
                        </span>
                        <div className="flex items-baseline gap-1 bg-primary/5 px-3 py-0.5 rounded-lg border border-primary/10">
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {intervention.services && ((intervention.services.reduce((acc, s) => acc + (s.price_at_time || 0), 0) + (intervention.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0)) || 0).toFixed(0)}
                            </span>
                            <span className="text-sm font-bold text-primary">DT</span>
                        </div>
                    </div>
                </div>

                {/* Quick Info Grid - Flat & Tight */}
                <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-white/10 rounded-xl overflow-hidden border border-slate-100 dark:border-white/5">
                    <div className="p-3 bg-white dark:bg-slate-900 flex flex-col justify-center">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Bassin</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase truncate leading-none">
                            {intervention.pool_name || intervention.pool?.name || 'Piscine'}
                        </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 flex flex-col justify-center">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Date Rapport</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase leading-none">
                            {new Date(intervention.scheduled_date || intervention.visit_date || intervention.created_at).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 flex flex-col justify-center">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Référence</span>
                        <span className="text-[13px] font-black text-slate-500/80 uppercase truncate leading-none">#{intervention.id.slice(0, 8)}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 flex flex-col justify-center relative">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 ml-1">Statut</span>
                        <select
                            title="Statut de l'intervention"
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isUpdatingStatus}
                            className={`w-full text-base font-black uppercase rounded-lg px-2 py-1 outline-none appearance-none cursor-pointer transition-all ${currentStatus === "completed"
                                ? "bg-emerald-50 text-emerald-600"
                                : currentStatus === "in_progress"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-blue-50 text-blue-600"
                                }`}
                        >
                            <option value="scheduled">Planifié</option>
                            <option value="cancelled">Annulé</option>
                            <option value="completed" disabled hidden>Terminé</option>
                        </select>
                        {isUpdatingStatus && (
                            <Loader2 size={12} className="absolute right-3 top-1/2 animate-spin text-slate-400" />
                        )}
                    </div>
                </div>

                {/* Technical Measures & Tasks Section */}
                {(intervention.ph_level || intervention.chlorine_level || intervention.water_level_adjusted !== undefined || true) && (
                    <div className="space-y-2">
                        <h5 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] text-center border-b border-slate-100 dark:border-white/5 pb-1">Mesures & Contrôles</h5>

                        <div className="grid grid-cols-2 gap-2">
                            {intervention.ph_level !== undefined && intervention.ph_level !== null && (
                                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-white/5 rounded-xl">
                                    <Droplets size={16} className="text-cyan-500 shrink-0" />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">pH</span>
                                        <span className="text-base font-black text-slate-800 dark:text-white leading-none">{intervention.ph_level}</span>
                                    </div>
                                </div>
                            )}

                            {intervention.chlorine_level !== undefined && intervention.chlorine_level !== null && (
                                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-white/5 rounded-xl">
                                    <Droplets size={16} className="text-blue-500 shrink-0" />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Chlore</span>
                                        <span className="text-base font-black text-slate-800 dark:text-white leading-none">{intervention.chlorine_level}</span>
                                    </div>
                                </div>
                            )}

                            {intervention.water_level_adjusted !== undefined && (
                                <div className={`flex items-center gap-2 p-2 rounded-xl col-span-2 ${intervention.water_level_adjusted ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                                    <Droplets size={16} className="shrink-0" />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[11px] font-black uppercase tracking-widest mb-1">Niveau d'eau</span>
                                        <span className="text-[12px] font-black uppercase tracking-tight leading-none">
                                            {intervention.water_level_adjusted ? 'Ajusté' : 'Non ajusté'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Flat Checklist */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1">
                            {[
                                { key: 'task_balai', label: 'Balai' },
                                { key: 'task_lavage', label: 'Lavage' },
                                { key: 'task_rincage', label: 'Rinçage' },
                                { key: 'task_test_chlore', label: 'Teste Chlore' },
                                { key: 'task_test_ph', label: 'Teste PH' },
                                { key: 'task_remplissage', label: 'Remplissage' },
                                { key: 'task_panier_prefiltre', label: 'Pré-filtre' },
                                { key: 'task_traitement', label: 'Traitement' },
                                { key: 'task_verif_vanne', label: 'Vannes' },
                                { key: 'task_temps_fonctionnement', label: 'Temps Fonct.' }
                            ].map(task => {
                                const isDone = intervention[task.key as keyof Intervention];
                                return (
                                    <div key={task.key} className={`flex items-center py-1.5 px-2 rounded-md ${isDone ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mr-2 ${isDone ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                                            {isDone && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-tight truncate ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>{task.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Photos Section */}
                {(intervention.photo_before_url || intervention.photo_after_url) && (
                    <div className="space-y-2 mt-2">
                        <h5 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] text-center border-b border-slate-100 dark:border-white/5 pb-1">Reportage Visuel</h5>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black text-slate-500 uppercase text-center">Avant</span>
                                <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-white/5">
                                    {intervention.photo_before_url ? (
                                        <img src={intervention.photo_before_url} alt="Avant" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-30 grayscale"><Droplets size={24} /></div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black text-slate-500 uppercase text-center">Après</span>
                                <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-white/5">
                                    {intervention.photo_after_url ? (
                                        <img src={intervention.photo_after_url} alt="Après" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-30 grayscale"><Droplets size={24} /></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Billing / Details Condensed */}
                <div className="space-y-2 mt-2">
                    <h5 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] text-center border-b border-slate-100 dark:border-white/5 pb-1">Prestations & Produits</h5>
                    {(!intervention.services || intervention.services.length === 0) && (!intervention.products || intervention.products.length === 0) ? (
                        <p className="text-center text-[12px] font-bold text-slate-500 uppercase py-2">Aucune facturation associée</p>
                    ) : (
                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2 space-y-1">
                            {intervention.services?.map((s, i) => (
                                <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-200/50 dark:border-white/5 last:border-0">
                                    <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase truncate pr-2">
                                        {s.service?.name || "Service"}
                                    </span>
                                    <span className="text-[13px] font-black text-slate-900 dark:text-white whitespace-nowrap">{s.price_at_time} DT</span>
                                </div>
                            ))}
                            {intervention.products?.map((p, i) => (
                                <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-200/50 dark:border-white/5 last:border-0">
                                    <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase truncate pr-2">
                                        {p.quantity}x {p.product?.name || "Produit"}
                                    </span>
                                    <span className="text-[13px] font-black text-slate-900 dark:text-white whitespace-nowrap">{p.total_price} DT</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Observations */}
                {intervention.notes && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-900/20 mt-2">
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest block mb-1">Notes Techniques</span>
                        <p className="text-[13px] leading-snug text-slate-700 dark:text-slate-200 font-medium">"{intervention.notes}"</p>
                    </div>
                )}

                <div className="flex gap-2 pt-3 mt-1 border-t border-slate-100 dark:border-white/5">
                    {onEdit && (
                        <button className="flex-1 btn-flow btn-primary !h-11 !rounded-xl !p-0" onClick={() => onEdit(intervention)} title="Modifier">
                            <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                    )}
                    {currentStatus === "scheduled" && onEdit && (
                        <button className="flex-[2] btn-flow bg-emerald-500 !text-white !h-11 !rounded-xl !p-0" onClick={() => onEdit(intervention)}>
                            <span className="font-black uppercase tracking-[0.1em] text-[11px]">Terminer</span>
                        </button>
                    )}
                    {intervention.pool?.client?.phone && (
                        <button className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0" onClick={handleWhatsAppShare} title="WhatsApp">
                            <MessageCircle size={16} strokeWidth={2.5} />
                        </button>
                    )}
                    {onDelete && (
                        <button className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0" onClick={() => onDelete(intervention)} title="Supprimer">
                            <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                    )}
                    <button className="w-11 h-11 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={onClose} title="Fermer">
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </ModalLayout>
    );
};

export default InterventionDetailsModal;
