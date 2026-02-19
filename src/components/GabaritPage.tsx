import React from 'react';

interface GabaritProps {
    title: string;
    headerActions?: React.ReactNode;
    toolbar?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
}

const GabaritPage: React.FC<GabaritProps> = ({ title, headerActions, toolbar, footer, children }) => {
    return (
        <div className="gabarit-wrapper">
            <div className="app-bg" />

            <header className="gabarit-header">
                <h1>{title}</h1>
                <div className="flex gap-3">
                    {headerActions}
                </div>
            </header>

            {toolbar && (
                <div className="gabarit-toolbar">
                    {toolbar}
                </div>
            )}

            <main className="gabarit-content">
                {children}
            </main>

            {footer && (
                <footer className="gabarit-footer">
                    {footer}
                </footer>
            )}
        </div>
    );
};

export default GabaritPage;
