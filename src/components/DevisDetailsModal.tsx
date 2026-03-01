import React, { useEffect, useState } from 'react';
import ModalLayout from './ModalLayout';
import { MessageCircle, Edit2, Trash2, Clock, CheckCircle2, XCircle, Loader2, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface DevisItem {
    id: string;
    designation: string;
    quantity: number;
    unit_price: number;
    unit: string;
    is_header: boolean;
}

interface DevisDetailsModalProps {
    devis: any;
    onClose: () => void;
    onEdit?: (devisId: string) => void;
    onDelete?: (devis: any) => void;
    onStatusChange?: (devisId: string, status: 'pending' | 'closed' | 'cancelled') => void;
}

const DevisDetailsModal: React.FC<DevisDetailsModalProps> = ({ devis, onClose, onEdit, onDelete, onStatusChange }) => {
    const [items, setItems] = useState<DevisItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('devis_items')
                    .select('*')
                    .eq('devis_id', devis.id)
                    .order('id', { ascending: true });

                if (error) throw error;
                setItems(data || []);
            } catch (err) {
                console.error("Erreur lors du chargement des articles de devis:", err);
                toast.error("Impossible de charger le détail du devis");
            } finally {
                setLoading(false);
            }
        };

        if (devis?.id) {
            fetchItems();
        }
    }, [devis?.id]);

    const handleWhatsAppShare = () => {
        if (!devis.client?.phone) {
            toast.error("Aucun numéro de téléphone pour ce client");
            return;
        }

        const date = new Date(devis.created_at).toLocaleDateString('fr-FR');

        let message = `*DEVIS ${devis.number}*\n`;
        message += `Titre: ${devis.title}\n`;
        message += `📅 Date: ${date}\n\n`;

        if (items.length > 0) {
            message += `*Détails des prestations :*\n`;
            items.forEach(item => {
                if (item.is_header) {
                    message += `\n_${item.designation.toUpperCase()}_\n`;
                } else {
                    const lineTotal = item.quantity * item.unit_price;
                    message += `- ${item.designation} (${item.quantity} ${item.unit || 'u'}) : ${lineTotal.toFixed(0)} DT\n`;
                }
            });
            message += `\n`;
        }

        message += `*Total Devis : ${(devis.total_amount || 0).toFixed(0)} DT*\n\n`;

        if (devis.status === 'closed') {
            message += `✅ Ce devis a été accepté/clôturé.\n\n`;
        } else if (devis.status === 'cancelled') {
            message += `❌ Ce devis est annulé.\n\n`;
        }

        message += `Merci de votre confiance ! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        let phone = devis.client.phone.replace(/\s+/g, '').replace('+', '');

        // Si c'est un numéro tunisien à 8 chiffres, ajouter l'indicatif 216
        if (phone.length === 8) {
            phone = `216${phone}`;
        }

        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    const handleGeneratePDF = () => {
        window.print();
    };

    return (
        <ModalLayout onClose={onClose} title="Détails du Devis" className="max-w-4xl">
            <div className="flex flex-col gap-6 pb-4">
                {/* Header Section */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60 mb-1">Résumé du Chantier</span>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center">
                            {devis.title || 'Devis'}
                        </h2>
                        <h3 className="text-base font-bold text-slate-500 dark:text-slate-400 capitalize mt-1">
                            {devis.client?.first_name} {devis.client?.last_name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3 text-4xl font-black text-slate-900 dark:text-white tracking-tighter mt-4">
                        {(devis.total_amount || 0).toFixed(0)}
                        <span className="text-xl font-bold text-primary dark:text-blue-400">DT</span>
                    </div>

                    <div className={`mt-2 px-4 py-1.5 rounded-xl uppercase tracking-widest text-[11px] font-black ${devis.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                        devis.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {devis.status === 'closed' ? 'Clôturé' : devis.status === 'cancelled' ? 'Annulé' : 'En cours'}
                    </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Numéro</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {devis.number}
                        </span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Devis</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase">
                            {new Date(devis.created_at).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Articles</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {items.length} lignes
                        </span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ville</span>
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {devis.client?.city || 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
                        <h5 className="text-[13px] font-black text-primary dark:text-blue-400 uppercase tracking-[0.3em]">Détail des Prestations</h5>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-2 md:p-6 border border-slate-100 dark:border-white/5 min-h-[150px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-10 h-full w-full">
                                <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Chargement des articles...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <p className="text-center text-[13px] font-bold text-slate-500 uppercase py-10">Aucun article dans ce devis</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {items.map((item) => {
                                    if (item.is_header) {
                                        return (
                                            <div key={item.id} className="mt-4 mb-2 first:mt-0 p-3 bg-blue-500 text-white rounded-2xl flex items-center justify-between shadow-sm">
                                                <h4 className="text-sm font-black uppercase tracking-widest">{item.designation}</h4>
                                            </div>
                                        );
                                    } else {
                                        const lineTotal = item.quantity * item.unit_price;
                                        return (
                                            <div key={item.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all group">
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-[13px] font-black text-slate-900 dark:text-white uppercase leading-snug group-hover:text-blue-500 transition-colors">
                                                        {item.designation}
                                                    </h5>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                                                            Qté: {item.quantity} {item.unit}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                                            P.U: {item.unit_price.toFixed(2)} DT
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center sm:block justify-between border-t sm:border-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                                    <span className="text-[10px] sm:hidden font-black text-slate-400 uppercase tracking-widest">Total Ligne</span>
                                                    <div className="text-base font-black text-slate-900 dark:text-white">
                                                        {lineTotal.toFixed(0)} <span className="text-xs font-bold text-slate-500 uppercase">DT</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                {(devis.pool_details || devis.notes || devis.payment_terms) && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
                            <h5 className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Informations Complémentaires</h5>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {devis.pool_details && (
                                <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 border border-slate-100 dark:border-white/5">
                                    <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Caractéristiques Bassin</h6>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line">{devis.pool_details}</p>
                                </div>
                            )}
                            {devis.payment_terms && (
                                <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 border border-slate-100 dark:border-white/5">
                                    <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Modalités de Paiement</h6>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line">{devis.payment_terms}</p>
                                </div>
                            )}
                            {devis.notes && (
                                <div className={`bg-slate-50 dark:bg-white/5 rounded-3xl p-5 border border-slate-100 dark:border-white/5 ${(!devis.pool_details || !devis.payment_terms) ? 'md:col-span-2' : ''}`}>
                                    <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Notes</h6>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line italic">{devis.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions Toolbar at Bottom */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 p-4 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10">
                    <div className="flex gap-2">
                        {onStatusChange && devis.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => onStatusChange(devis.id, 'closed')}
                                    className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                    title="Clôturer le devis"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                                <button
                                    onClick={() => onStatusChange(devis.id, 'cancelled')}
                                    className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                    title="Annuler le devis"
                                >
                                    <XCircle size={18} />
                                </button>
                            </>
                        )}
                        {onStatusChange && devis.status !== 'pending' && (
                            <button
                                onClick={() => onStatusChange(devis.id, 'pending')}
                                className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                title="Remettre en cours"
                            >
                                <Clock size={18} />
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={() => { onClose(); onEdit(devis.id); }}
                                className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                title="Modifier le devis"
                            >
                                <Edit2 size={18} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => { onClose(); onDelete(devis); }}
                                className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                title="Supprimer le devis"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap flex-1 justify-end gap-3 min-w-[200px]">
                        <button
                            onClick={handleGeneratePDF}
                            title="Télécharger en PDF"
                            className="flex-1 md:flex-none btn-flow bg-slate-800 hover:bg-slate-900 !text-white !h-12 shadow-md transition-all flex items-center justify-center gap-2 px-6"
                        >
                            <Download size={18} strokeWidth={2.5} />
                            <span className="font-black uppercase tracking-[0.2em] text-[11px] hidden sm:block">PDF</span>
                        </button>

                        {devis.client?.phone && (
                            <button
                                className="flex-1 md:flex-none btn-flow bg-emerald-500 hover:bg-emerald-600 !text-white !h-12 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 px-6"
                                onClick={handleWhatsAppShare}
                            >
                                <MessageCircle size={18} strokeWidth={2.5} />
                                <span className="font-black uppercase tracking-[0.2em] text-[11px]">WhatsApp</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 md:flex-none px-8 !h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[20px] font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                        >
                            Fermer
                        </button>
                    </div>
                </div>

            </div>
        </ModalLayout>
    );
};

export default DevisDetailsModal;
