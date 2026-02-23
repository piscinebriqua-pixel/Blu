import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, User, Calendar, FileText, ChevronRight, ArrowUpRight, Edit2 } from 'lucide-react';
import ModalLayout from './ModalLayout';

interface PaymentDetailsModalProps {
    payment: {
        id: string;
        amount: number;
        payment_date: string;
        method: string;
        notes: string;
        client_id: string;
        client?: {
            first_name: string;
            last_name: string;
            balance: number;
        };
        technician?: {
            full_name: string;
        };
        technician_id: string;
    };
    onClose: () => void;
    isAdmin?: boolean;
    onEdit?: () => void;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({ payment, onClose, isAdmin, onEdit }) => {
    const navigate = useNavigate();

    const handleViewClient = () => {
        onClose();
        navigate(`/client/${payment.client_id}`);
    };

    return (
        <ModalLayout onClose={onClose} title="Détails du Paiement">
            <div className="flex flex-col gap-8 pb-4">
                {/* Header Section */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                        <Wallet size={32} strokeWidth={2.5} />
                    </div>
                    <p className="text-[13px] font-black uppercase tracking-[0.4em] text-slate-500">Encaissement Réalisé</p>
                    <div className="flex items-center gap-4 text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        +{payment.amount.toFixed(0)}
                        <span className="text-xl font-bold text-emerald-500 dark:text-emerald-400 ml-1">DT</span>
                        {isAdmin && (
                            <button
                                onClick={onEdit}
                                className="ml-2 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-100/50 dark:border-blue-800/20"
                                title="Modifier"
                            >
                                <Edit2 size={18} />
                            </button>
                        )}
                    </div>

                    {/* Method Badge */}
                    <div className={`mt-2 px-4 py-1.5 rounded-full text-[13px] font-black uppercase tracking-widest border transition-colors ${payment.method === 'Espèces' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' :
                        payment.method === 'Carte' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' :
                            'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30'
                        }`}>
                        {payment.method}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleViewClient}
                        className="flex flex-col gap-1 p-5 bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 text-left group hover:border-primary/30 transition-all"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">Client</span>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <span className="text-base font-black text-slate-800 dark:text-white uppercase truncate">
                            {payment.client?.first_name} {payment.client?.last_name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${payment.client?.balance && payment.client.balance < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className="text-[13px] font-bold text-slate-500">Solde: {payment.client?.balance?.toFixed(0)} DT</span>
                        </div>
                    </button>

                    <div className="flex flex-col gap-1 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                        <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-1">Responsable</span>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                <User size={14} />
                            </div>
                            <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 truncate">
                                {payment.technician?.full_name || 'Non spécifié'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Secondary Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
                        <h5 className="text-[13px] font-black text-primary dark:text-blue-400 uppercase tracking-[0.3em]">Informations Temporelles</h5>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <Calendar size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Date de l'opération</span>
                                <span className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    {new Date(payment.payment_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Heure</span>
                            <p className="text-base font-bold text-slate-600">{new Date(payment.payment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                {payment.notes && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 ml-1 text-slate-500">
                            <FileText size={14} />
                            <h5 className="text-[13px] font-black uppercase tracking-[0.2em]">Observations</h5>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 relative">
                            <div className="absolute top-0 left-6 w-8 h-1 bg-emerald-500/20 rounded-full" />
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-500 italic font-medium">
                                "{payment.notes}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex gap-4 pt-4 mt-2">
                    <button
                        className="flex-1 btn-flow btn-primary !h-16 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        onClick={handleViewClient}
                    >
                        <ArrowUpRight size={20} strokeWidth={2.5} />
                        <span className="font-black uppercase tracking-[0.15em] text-xs">Accéder à la fiche client</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-500 rounded-2xl font-black uppercase tracking-widest text-base hover:bg-slate-200 transition-all active:scale-95"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </ModalLayout>
    );
};

export default PaymentDetailsModal;
