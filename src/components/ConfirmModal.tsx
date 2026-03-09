import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import ModalLayout from './ModalLayout';
import Button from './ui/Button';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onClose: () => void;
    loading?: boolean;
    confirmLabel?: string;
    variant?: 'danger' | 'primary';
    showIrreversibleWarning?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onClose,
    loading = false,
    confirmLabel = "CONFIRMER",
    variant = 'danger',
    showIrreversibleWarning = true
}) => {
    if (!isOpen) return null;

    return (
        <ModalLayout
            title={title}
            onClose={onClose}
            compact={true}
            actions={
                <div className="flex gap-3 w-full">
                    <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
                        ANNULER
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        className={`flex-1 ${variant === 'danger' ? 'danger-button-styled' : ''}`}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col items-center text-center gap-3 py-2 animate-in fade-in zoom-in-95 duration-300">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-1 shadow-sm ${variant === 'danger' ? 'bg-red-50 dark:bg-red-900/10 text-red-500' : 'bg-blue-50 dark:bg-blue-900/10 text-blue-500'}`}>
                    {variant === 'danger' ? <Trash2 size={24} strokeWidth={2.5} /> : <AlertCircle size={24} strokeWidth={2.5} />}
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                    <div className="text-[13px] font-bold text-slate-800 dark:text-white px-2 leading-relaxed">
                        {message}
                    </div>
                    {showIrreversibleWarning && (
                        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                            Cette action est irréversible
                        </p>
                    )}
                </div>
            </div>
        </ModalLayout>
    );
};

export default ConfirmModal;
