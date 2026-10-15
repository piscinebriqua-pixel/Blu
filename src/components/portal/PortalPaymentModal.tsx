import React from 'react';
import { TrendingUp, Clock, CreditCard, Droplets } from 'lucide-react';
import ModalLayout from '../ModalLayout';

export interface PortalPayment {
    id: string;
    amount: number;
    payment_date: string;
    method: string;
    notes?: string;
    technician?: { full_name: string };
}

interface PortalPaymentModalProps {
    payment: PortalPayment | null;
    onClose: () => void;
}

export const PortalPaymentModal: React.FC<PortalPaymentModalProps> = ({
    payment,
    onClose
}) => {
    if (!payment) return null;

    return (
        <ModalLayout
            title="Détail du Règlement"
            onClose={onClose}
            className="max-w-md !min-h-0"
            compact={true}
            bodyClassName="!p-0 !overflow-hidden"
        >
            <div className="p-5 space-y-5 flex flex-col max-h-[85vh]">
                {/* Transaction Header - Compact */}
                <div className="flex flex-col items-center justify-center py-2">
                    <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-3 animate-bounce-subtle">
                        <TrendingUp size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {payment.amount} <span className="text-lg opacity-40 ml-1">DT</span>
                    </h2>
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1">Transaction Validée</p>
                </div>

                {/* Info Grid - More compact */}
                <div className="grid grid-cols-1 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-500">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Date de réception</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">
                                    {new Date(payment.payment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-500">
                                <CreditCard size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Mode de règlement</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{payment.method || 'Non spécifié'}</p>
                            </div>
                        </div>
                    </div>

                    {payment.technician && (
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-500">
                                    <Droplets size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Encaissé par</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{payment.technician.full_name}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {payment.notes && (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1 shadow-none">Note</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">"{payment.notes}"</p>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={onClose}
                    className="w-full min-h-[44px] h-auto px-4 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 mt-2 flex items-center justify-center text-center leading-snug"
                >
                    Fermer
                </button>
            </div>
        </ModalLayout>
    );
};
