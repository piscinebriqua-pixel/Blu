import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ModalLayout from '../ModalLayout';

interface DashboardQrModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DashboardQrModal: React.FC<DashboardQrModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const portalUrl = `${window.location.origin}/mon-espace`;
    const cleanUrl = window.location.origin.replace(/^https?:\/\//, '') + '/mon-espace';

    return (
        <ModalLayout isOpen={isOpen} onClose={onClose} size="sm">
            <div className="relative p-6 text-center flex flex-col items-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
                >
                    <X size={20} />
                </button>

                <div className="relative z-10 p-6 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)] mb-6 mt-4">
                    <div className="relative rounded-2xl overflow-hidden p-2 bg-white">
                        <QRCodeSVG
                            value={portalUrl}
                            size={180}
                            level="H"
                            includeMargin={false}
                            fgColor="#0F172A"
                        />
                    </div>
                </div>

                <div className="relative z-10 space-y-3 w-full">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        Accès <span className="text-blue-500">Client</span>
                    </h4>
                    
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Scannez pour accéder au portail BCCP
                    </p>

                    <div className="mt-4 flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 w-full">
                        <div className="py-2 px-3 flex-1 text-center overflow-hidden">
                            <code className="text-xs font-black text-blue-600 dark:text-blue-400 break-all select-all truncate block">
                                {cleanUrl}
                            </code>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(portalUrl);
                                toast.success("Lien copié dans le presse-papier");
                            }}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md active:scale-95"
                            title="Copier le lien"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </ModalLayout>
    );
};
