import React from 'react';
import ModalLayout from './ModalLayout';
import { Droplets, FileText, Edit2, MessageCircle } from 'lucide-react';

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
}

interface InterventionDetailsModalProps {
    intervention: Intervention;
    onClose: () => void;
    onEdit?: (intervention: Intervention) => void;
}

const InterventionDetailsModal: React.FC<InterventionDetailsModalProps> = ({ intervention, onClose, onEdit }) => {
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

        message += `Merci de votre confiance ! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        let phone = intervention.pool.client.phone.replace(/\s+/g, '').replace('+', '');

        // Si c'est un numéro tunisien à 8 chiffres, ajouter l'indicatif 216
        if (phone.length === 8) {
            phone = `216${phone}`;
        }

        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    return (
        <ModalLayout onClose={onClose} title="Détails Rapport">
            <div className="flex flex-col gap-8 pb-4">
                {/* Header Section */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2">
                        <FileText size={32} strokeWidth={2.5} />
                    </div>
                    <p className="text-[13px] font-black uppercase tracking-[0.4em] text-slate-500">Rapport d'intervention</p>
                    <div className="flex items-center gap-4 text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {intervention.services && ((intervention.services.reduce((acc, s) => acc + (s.price_at_time || 0), 0) + (intervention.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0)) || 0).toFixed(0)}
                        <span className="text-xl font-bold text-primary dark:text-blue-400 ml-1">DT</span>
                    </div>

                    {/* Client Info Badge */}
                    {intervention.pool?.client && (
                        <div className="mt-4 flex flex-col items-center gap-1">
                            <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase px-4 py-1.5 bg-white/40 dark:bg-white/5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                                {intervention.pool.client.first_name} {intervention.pool.client.last_name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Compte Client:</span>
                                <span className={`text-[13px] font-black uppercase ${intervention.pool.client.balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {(intervention.pool.client.balance || 0).toFixed(0)} DT
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Bassin</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">{intervention.pool_name || intervention.pool?.name}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Statut</span>
                        <span className={`text-[13px] font-black uppercase text-center rounded-lg py-0.5 ${intervention.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"}`}>
                            {intervention.status === "completed" ? "Terminé" : intervention.status}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Date</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase">
                            {new Date(intervention.scheduled_date || intervention.visit_date || intervention.created_at).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">ID</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">#{intervention.id.slice(0, 8)}</span>
                    </div>
                </div>

                {/* Technical Measures Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
                        <h5 className="text-[13px] font-black text-primary dark:text-blue-400 uppercase tracking-[0.3em]">Mesures Techniques</h5>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                                <Droplets size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Potentiel Hydrogène (pH)</span>
                                <span className="text-2xl font-black text-slate-800 dark:text-white">
                                    {(intervention.ph_level !== null && intervention.ph_level !== undefined) ? intervention.ph_level : "-"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 group hover:border-blue-400/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Droplets size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Taux de Chlore (ppm)</span>
                                <span className="text-2xl font-black text-slate-800 dark:text-white">
                                    {(intervention.chlorine_level !== null && intervention.chlorine_level !== undefined) ? intervention.chlorine_level : "-"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Photos Section */}
                {(intervention.photo_before_url || intervention.photo_after_url) && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
                            <h5 className="text-[13px] font-black text-primary dark:text-blue-400 uppercase tracking-[0.3em]">Reportage Visuel</h5>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest ml-1">Avant Intervention</span>
                                <div className="aspect-video rounded-[1.5rem] overflow-hidden border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 shadow-inner group">
                                    {intervention.photo_before_url ? (
                                        <img src={intervention.photo_before_url} alt="Avant" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-30 grayscale"><Droplets size={24} /></div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest ml-1">Après Intervention</span>
                                <div className="aspect-video rounded-[1.5rem] overflow-hidden border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 shadow-inner group">
                                    {intervention.photo_after_url ? (
                                        <img src={intervention.photo_after_url} alt="Après" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-30 grayscale"><Droplets size={24} /></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Billing / Details Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
                        <h5 className="text-[13px] font-black text-primary dark:text-blue-400 uppercase tracking-[0.3em]">Services & Consommables</h5>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5 space-y-4">
                        {(!intervention.services || intervention.services.length === 0) && (!intervention.products || intervention.products.length === 0) ? (
                            <p className="text-center text-[13px] font-bold text-slate-500 uppercase">Aucun service ou produit enregistré</p>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {intervention.services?.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white/50 dark:bg-white/5 p-3 rounded-2xl">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                                    {s.service?.name || "Service Technique"}
                                                </span>
                                                <span className="text-[13px] font-bold text-slate-500 uppercase">Service Main d'œuvre</span>
                                            </div>
                                            <span className="text-base font-black text-slate-800 dark:text-white">{s.price_at_time} DT</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    {intervention.products?.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white/50 dark:bg-white/5 p-3 rounded-2xl">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                                    {p.product?.name || "Produit Utilisé"}
                                                </span>
                                                <span className="text-[13px] font-bold text-slate-500 uppercase">
                                                    Quantité: {p.quantity} {p.product?.unit || 'unités'}
                                                </span>
                                            </div>
                                            <span className="text-base font-black text-slate-800 dark:text-white">{p.total_price} DT</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Observations */}
                {intervention.notes && (
                    <div className="space-y-3">
                        <h5 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Observations Techniques</h5>
                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 relative">
                            <div className="absolute top-0 left-6 w-8 h-1 bg-primary/20 rounded-full" />
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-500 italic font-medium">
                                "{intervention.notes}"
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
                    {onEdit && (
                        <button
                            className="flex-1 btn-flow btn-primary !h-14 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => onEdit(intervention)}
                        >
                            <Edit2 size={18} strokeWidth={2.5} />
                            <span className="font-black uppercase tracking-[0.2em] text-[11px]">Modifier le rapport</span>
                        </button>
                    )}
                    {intervention.pool?.client?.phone && (
                        <button
                            className="flex-1 btn-flow bg-emerald-500 hover:bg-emerald-600 !text-white !h-14 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            onClick={handleWhatsAppShare}
                        >
                            <MessageCircle size={18} strokeWidth={2.5} />
                            <span className="font-black uppercase tracking-[0.2em] text-[11px]">WhatsApp</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 !h-14 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-500 rounded-[20px] font-black uppercase tracking-widest text-[13px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </ModalLayout>
    );
};

export default InterventionDetailsModal;
