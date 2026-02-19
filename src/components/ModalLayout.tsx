import React from 'react';
import { X } from 'lucide-react';

interface ModalLayoutProps {
    title: string;
    onClose: () => void;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

const ModalLayout: React.FC<ModalLayoutProps> = ({
    title,
    onClose,
    actions,
    children
}) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container animate-in slide-in-from-bottom-full duration-300" onClick={e => e.stopPropagation()}>
                {/* 1. Modal Header */}
                <header className="modal-header">
                    <h2 className="text-lg font-black tracking-tight">{title}</h2>
                    <button className="btn-icon" onClick={onClose} title="Fermer">
                        <X size={20} />
                    </button>
                </header>

                {/* 2. Modal Body */}
                <div className="modal-body">
                    {children}
                </div>

                {/* 3. Modal Footer (Actions) */}
                {actions && (
                    <footer className="modal-footer">
                        {actions}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default ModalLayout;
