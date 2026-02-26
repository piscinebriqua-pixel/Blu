import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageLayoutProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    toolbar?: React.ReactNode;
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
    rightContent?: React.ReactNode;
    leftContent?: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    subtitle,
    showBackButton = false,
    toolbar,
    loading = false,
    children,
    className = "",
    rightContent,
    leftContent
}) => {
    const navigate = useNavigate();

    const handleBack = () => navigate(-1); // Added handleBack function

    return (
        <div className="gabarit-wrapper dark:bg-[#0F172A] min-h-screen flex flex-col animate-in fade-in duration-500">
            {/* Header Fixe Standardisé */}
            <header className="page-header h-20 md:h-24 shadow-lg flex items-center relative transition-all duration-300">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                        {showBackButton && (
                            <button
                                onClick={handleBack}
                                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md shadow-lg border border-white/10 shrink-0"
                                aria-label="Retour"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        )}
                        {leftContent ? leftContent : (
                            <div className="flex flex-col truncate">
                                {title && (
                                    <h1 className="text-lg md:text-xl font-black text-white leading-tight uppercase tracking-tight truncate">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none truncate">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {rightContent && (
                        <div className="flex items-center gap-3 shrink-0">
                            {rightContent}
                        </div>
                    )}
                </div>
            </header>

            {/* Barre d'outils secondaire (Toolbar) */}
            {toolbar && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 page-toolbar py-3 sticky top-0 z-30 transition-all flex items-center">
                    <div className="max-w-7xl mx-auto w-full">
                        {toolbar}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className={`main-container relative flex-1 pt-6 page-content pb-12 transition-all duration-300 ${className}`}>
                <div className="max-w-7xl mx-auto w-full">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-primary animate-spin mb-6"></div>
                            <span className="text-base font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Chargement en cours...</span>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-backwards">
                            {children}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};


export default PageLayout;
