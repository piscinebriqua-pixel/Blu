import React from 'react';
import { createPortal } from 'react-dom';


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
                        <button
                            type="button"
                            className="min-h-[44px] px-4 py-2 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-black uppercase tracking-wider border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer active:scale-95 shadow-sm"
                            onClick={onClose}
                            title="Fermer la boîte de dialogue"
                            aria-label="Fermer"
                        >
                            <span>Fermer</span>
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
