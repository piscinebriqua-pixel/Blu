import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import {
    User,
    Mail,
    Shield,
    Calendar,
    LogOut,
    ChevronRight,
    Lock
} from 'lucide-react';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (error) throw error;
                    setProfile(data);
                } else {
                    navigate('/login');
                }
            } catch (error: any) {
                console.error('Erreur profil:', error.message);
                alert('Impossible de charger le profil');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Erreur déconnexion');
        } else {
            navigate('/login');
        }
    };

    return (
        <PageLayout
            title="Mon Profil"
            subtitle="Gérer vos informations personnelles"
            showBackButton={true}
            loading={loading}
        >
            <div className="max-w-2xl mx-auto flex flex-col gap-8">
                {/* Profile Hero Card */}
                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-blue-500/20 mb-6 relative">
                        {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-white">
                            <Shield size={14} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight">
                        {profile?.full_name || 'Utilisateur'}
                    </h2>
                    <p className="text-sm font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-full mb-8">
                        {profile?.role || 'Membre'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Mail size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{profile?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Calendar size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscrit le</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Paramètres du compte</h3>

                    <button className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-500 transition-all text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Modifier les infos</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom, Prénom, Photo</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>

                    <button className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                <Lock size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Mot de passe</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sécurité du compte</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="group flex items-center justify-between p-5 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left mt-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-rose-500 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110">
                                <LogOut size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-rose-600 uppercase tracking-tight text-shadow-sm">Se déconnecter</p>
                                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Fermer la session actuelle</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-rose-300 group-hover:text-rose-500 transition-colors" />
                    </button>
                </div>

                {/* Quick Info Bar */}
                <div className="text-center py-8">
                    <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
                        DeepBlue Version 2.4.0 • Propulsé par Google Mind
                    </p>
                </div>
            </div>
        </PageLayout>
    );
};

export default Profile;
