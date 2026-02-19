import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PageLayoutProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    toolbar?: React.ReactNode;
    loading?: boolean;
    children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    subtitle,
    showBackButton = false,
    toolbar,
    loading = false,
    children
}) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="app-wrapper">
            {/* 1. Header Bloc */}
            <header className="page-header">
                <div className="flex items-center gap-4">
                    {showBackButton && (
                        <button className="btn-icon" onClick={() => navigate(-1)} title="Retour">
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-extrabold tracking-tight leading-none mb-1">{title}</h1>
                        {subtitle && <p className="text-sm font-medium text-white/80">{subtitle}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="btn-icon relative" title="Notifications">
                        <span className="absolute top-2 right-2 w-2 h-2 bg-status-red rounded-full" />
                        <Bell size={18} />
                    </button>
                    <button className="btn-icon text-status-red border-red-500/10" onClick={handleLogout} title="Déconnexion">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* 2. Toolbar Bloc (Optional) */}
            {toolbar && (
                <div className="page-toolbar">
                    {toolbar}
                </div>
            )}

            {/* 3. Central Content Bloc */}
            <main className="page-content">
                {loading ? (
                    <div className="flex-center py-20 w-full">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in duration-500">
                        {children}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PageLayout;
