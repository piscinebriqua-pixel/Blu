import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Moon, Sun, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

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
    const [userInitial, setUserInitial] = useState('U');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Theme sync
        const savedTheme = localStorage.getItem('theme');
        setIsDark(savedTheme === 'dark');

        // User initial sync
        const getProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', session.user.id)
                    .single();
                if (profile?.full_name) {
                    setUserInitial(profile.full_name.charAt(0).toUpperCase());
                }
            }
        };
        getProfile();
    }, []);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
        setIsDark(!isDark);
    };

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

                    {!rightContent && (
                        <div className="flex items-center gap-2.5 shrink-0">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                title="Changer le mode"
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-[18px] flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md border border-white/10 shadow-lg"
                            >
                                {isDark ? <Moon size={20} /> : <Sun size={20} />}
                            </button>

                            {/* Home Button */}
                            <button
                                onClick={() => navigate('/')}
                                title="Accueil"
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-[18px] flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md border border-white/10 shadow-lg"
                            >
                                <Home size={20} />
                            </button>

                            {/* Settings */}
                            <button
                                onClick={() => navigate('/profile')}
                                title="Paramètres"
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-[18px] flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md border border-white/10 shadow-lg"
                            >
                                <Settings size={20} />
                            </button>

                            {/* Profile Button with initial "U" */}
                            <button
                                onClick={() => navigate('/profile')}
                                title="Profil"
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-[18px] flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md border border-white/15 shadow-xl relative overflow-visible"
                            >
                                <span className="font-black text-lg md:text-xl tracking-tighter">{userInitial}</span>
                                {/* Green Dot (Online Status) */}
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#1E40AF] shadow-sm transform translate-x-1/4 translate-y-1/4" />
                            </button>
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
            <main className={`main-container relative flex-1 pt-6 page-content pb-12 transition-all duration-300 ${className} flex flex-col`}>
                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 animate-pulse flex-1">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-primary animate-spin mb-6"></div>
                            <span className="text-base font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Chargement en cours...</span>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-backwards flex-1 flex flex-col min-h-0">
                            {children}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};


export default PageLayout;
