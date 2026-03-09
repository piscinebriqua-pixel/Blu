import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalLayoutProps {
    title: string;
    onClose: () => void;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    compact?: boolean;
    hideHeader?: boolean;
}

const ModalLayout: React.FC<ModalLayoutProps> = ({
    title,
    onClose,
    actions,
    children,
    className = "",
    bodyClassName = "",
    compact = false,
    hideHeader = false
}) => {
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-container bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-full duration-300 ${compact ? '!min-h-0 !max-w-sm' : ''} ${className}`} onClick={e => e.stopPropagation()}>
                {!hideHeader && <div className="drawer-indicator" />}
                
                {/* 1. Modal Header */}
                {!hideHeader && (
                    <header className="modal-header border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">{title}</h2>
                        <button className="btn-icon hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-500" onClick={onClose} title="Fermer">
                            <X size={20} />
                        </button>
                    </header>
                )}

                {/* 2. Modal Body */}
                <div className={`modal-body ${compact ? '!min-h-0' : ''} ${bodyClassName}`}>
                    {children}
                </div>

                {/* 3. Modal Footer (Actions) */}
                {actions && (
                    <footer className="modal-footer">
                        {actions}
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ModalLayout;
