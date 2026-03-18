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
                    .order('position', { ascending: true })
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

        let cleanPhone = phone.replace(/[\s\-\.]/g, '');
        if (cleanPhone && !cleanPhone.startsWith('216') && !cleanPhone.startsWith('+')) {
            cleanPhone = `216${cleanPhone}`;
        }
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    };

    const handleGeneratePDF = () => {
        window.print();
    };

    return (
        <ModalLayout onClose={onClose} title="Détails du Devis" className="max-w-4xl">
            <div className="flex flex-col gap-6 print:gap-4 pb-4 print:pb-0">
                {/* Header Section */}
                <div className="flex flex-col items-center gap-2 print:gap-1 print:mt-4">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60 mb-1 print:mb-0">Résumé du Chantier</span>
                        <h2 className="text-2xl print:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center">
                            {devis.title || 'Devis'}
                        </h2>
                        <h3 className="text-base print:text-sm font-bold text-slate-500 dark:text-slate-400 capitalize mt-1 print:mt-0">
                            {devis.client?.first_name} {devis.client?.last_name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3 text-4xl print:text-2xl font-black text-slate-900 dark:text-white tracking-tighter mt-4 print:mt-2">
                        {(devis.total_amount || 0).toFixed(0)}
                        <span className="text-xl print:text-sm font-bold text-primary dark:text-blue-400">DT</span>
                    </div>

                    <div className={`mt-2 print:mt-1 px-4 py-1.5 print:py-1 rounded-xl uppercase tracking-widest text-[11px] print:text-[9px] font-black ${devis.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                        devis.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {devis.status === 'closed' ? 'Clôturé' : devis.status === 'cancelled' ? 'Annulé' : 'En cours'}
                    </div>
                </div>

                {/* Company & Header Content (NEW) */}
                {(devis.header_content || devis.company_phone) && (
                    <div className="flex flex-col gap-4 print:gap-2">
                        {/* Company Info row for PDF */}
                        {(devis.company_phone || devis.company_address) && (
                            <div className="hidden print:flex flex-col border-b border-slate-100 pb-4 mb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-0.5">
                                        <div className="text-[12px] font-black uppercase text-slate-900 leading-none">Votre Prestataire</div>
                                        <div className="text-[10px] font-bold text-slate-600">Tel: {devis.company_phone}</div>
                                        <div className="text-[10px] font-bold text-slate-600">Email: {devis.company_email}</div>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <div className="text-[10px] font-bold text-slate-600">{devis.company_address}</div>
                                        <div className="text-[10px] font-black uppercase text-slate-400">MF: {devis.company_tax_id}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {devis.header_content && (
                            <div className="p-6 print:p-2 bg-blue-50/30 dark:bg-white/5 rounded-[2rem] print:rounded-none border border-blue-50 dark:border-white/5">
                                <p className="text-sm print:text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed italic">
                                    {devis.header_content}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-2 print:gap-1">
                    <div className="p-4 print:p-2 bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg border border-slate-100 dark:border-white/5 flex flex-col">
                        <span className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 print:mb-0">Numéro</span>
                        <span className="text-[13px] print:text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {devis.number}
                        </span>
                    </div>
                    <div className="p-4 print:p-2 bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg border border-slate-100 dark:border-white/5 flex flex-col">
                        <span className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 print:mb-0">Date Devis</span>
                        <span className="text-[13px] print:text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase">
                            {new Date(devis.created_at).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                    <div className="p-4 print:p-2 bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg border border-slate-100 dark:border-white/5 flex flex-col">
                        <span className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 print:mb-0">Articles</span>
                        <span className="text-[13px] print:text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {items.length} lignes
                        </span>
                    </div>
                    <div className="p-4 print:p-2 bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg border border-slate-100 dark:border-white/5 flex flex-col">
                        <span className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 print:mb-0">Ville</span>
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

                    <div className="bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg p-2 md:p-6 print:p-2 border border-slate-100 dark:border-white/5 min-h-[150px] print:min-h-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-10 h-full w-full">
                                <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Chargement des articles...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <p className="text-center text-[13px] font-bold text-slate-500 uppercase py-10">Aucun article dans ce devis</p>
                        ) : (
                            <div className="flex flex-col gap-2 print:gap-1">
                                {items.map((item) => {
                                    if (item.is_header) {
                                        return (
                                            <div key={item.id} className="mt-4 print:mt-2 mb-2 print:mb-1 first:mt-0 p-3 print:p-2 bg-blue-500 text-white rounded-2xl print:rounded flex items-center justify-between shadow-sm">
                                                <h4 className="text-sm print:text-xs font-black uppercase tracking-widest">{item.designation}</h4>
                                            </div>
                                        );
                                    } else {
                                        const lineTotal = item.quantity * item.unit_price;
                                        return (
                                            <div key={item.id} className="p-4 print:p-2 bg-white dark:bg-slate-800 rounded-2xl print:rounded border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-3 print:gap-1 shadow-sm hover:shadow-md transition-all group">
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-[13px] print:text-[11px] font-black text-slate-900 dark:text-white uppercase leading-snug group-hover:text-blue-500 transition-colors">
                                                        {item.designation}
                                                    </h5>
                                                    <div className="flex flex-wrap items-center gap-3 print:gap-2 mt-1.5 print:mt-0.5">
                                                        <span className="text-[11px] print:text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg print:rounded border border-slate-200 dark:border-slate-600">
                                                            Qté: {item.quantity} {item.unit}
                                                        </span>
                                                        <span className="text-[11px] print:text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                            P.U: {item.unit_price.toFixed(2)} DT
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center sm:block print:block justify-between border-t sm:border-0 print:border-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 print:pt-0 mt-2 sm:mt-0 print:mt-0">
                                                    <span className="text-[10px] sm:hidden print:hidden font-black text-slate-400 uppercase tracking-widest">Total Ligne</span>
                                                    <div className="text-base print:text-sm font-black text-slate-900 dark:text-white">
                                                        {lineTotal.toFixed(0)} <span className="text-xs print:text-[10px] font-bold text-slate-500 uppercase">DT</span>
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
                    <div className="space-y-4 print:space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
                            <h5 className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] print:text-[10px]">Informations Complémentaires</h5>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-3 gap-4 print:gap-2">
                            {devis.pool_details && (
                                <div className="bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg p-5 print:p-3 border border-slate-100 dark:border-white/5">
                                    <h6 className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 print:mb-1">Caractéristiques Bassin</h6>
                                    <p className="text-xs print:text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{devis.pool_details}</p>
                                </div>
                            )}
                            {devis.payment_terms && (
                                <div className="bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg p-5 print:p-3 border border-slate-100 dark:border-white/5">
                                    <h6 className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 print:mb-1">Modalités de Paiement</h6>
                                    <p className="text-xs print:text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{devis.payment_terms}</p>
                                </div>
                            )}
                            {devis.notes && (
                                <div className={`bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg p-5 print:p-3 border border-slate-100 dark:border-white/5 ${(!devis.pool_details || !devis.payment_terms) ? 'md:col-span-2 print:col-span-1' : ''}`}>
                                    <h6 className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 print:mb-1">Notes</h6>
                                    <p className="text-xs print:text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed italic">{devis.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Content (NEW) */}
                {devis.footer_content && (
                    <div className="mt-8 print:mt-4 p-8 print:p-4 bg-slate-900 text-white rounded-[2.5rem] print:rounded-xl border border-slate-800 shadow-xl shadow-slate-900/10">
                        <h6 className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 print:mb-2">Mentions & Engagement</h6>
                        <p className="text-xs print:text-[10px] font-bold text-slate-300 whitespace-pre-line leading-relaxed">
                            {devis.footer_content}
                        </p>
                        
                        {/* Signature Area for Print */}
                        <div className="hidden print:grid grid-cols-2 gap-8 mt-12">
                            <div className="border-t border-slate-700 pt-4 flex flex-col gap-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Signature Cachet Client</span>
                                <div className="h-48"></div>
                                <span className="text-[9px] font-bold">Lu et Approuvé le : ____/____/20____</span>
                            </div>
                            <div className="border-t border-slate-700 pt-4 flex flex-col gap-1 text-right">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Signature Entreprise</span>
                                <div className="h-48"></div>
                                <span className="text-[9px] font-bold italic underline">Bon pour accord</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions Toolbar at Bottom - Caché pour l'impression */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 p-4 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10 print:hidden">
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
