import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PageLayoutProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    toolbar?: React.ReactNode;
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    subtitle,
    showBackButton = false,
    toolbar,
    loading = false,
    children,
    className = "" // Initialize className
}) => {
    const navigate = useNavigate();

    const handleBack = () => navigate(-1); // Added handleBack function

    return (
        <div className="gabarit-wrapper dark:bg-[#0F172A] min-h-screen flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <header className="header-gradient px-6 pt-12 pb-24 md:pb-32 shadow-lg relative z-10 transition-all duration-300">
                <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {showBackButton && (
                            <button
                                onClick={handleBack}
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 hover:scale-105 active:scale-95 transition-all backdrop-blur-md shadow-lg"
                                aria-label="Retour"
                            >
                                <ArrowLeft size={22} strokeWidth={2.5} />
                            </button>
                        )}
                        <div className="flex flex-col">
                            {title && (
                                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tight drop-shadow-sm">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-blue-100 text-xs md:text-sm font-bold uppercase tracking-widest opacity-90 mt-1">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {toolbar && (
                        <div className="flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                            {toolbar}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className={`main-container relative z-20 flex-1 -mt-16 md:-mt-24 px-4 md:px-8 pb-12 transition-all duration-300 ${className}`}>
                <div className="max-w-7xl mx-auto w-full">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-primary animate-spin mb-6"></div>
                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Chargement en cours...</span>
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
