import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, User, Users, Shield } from 'lucide-react';

const UserMenu: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [profile, setProfile] = useState<{ name: string, role: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', session.user.id)
                    .maybeSingle();
                
                if (profileData) {
                    setProfile({
                        name: profileData.full_name || 'Utilisateur',
                        role: profileData.role
                    });
                }
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            navigate('/login');
        }
    };

    if (!profile) return null;

    return (
        <div className="relative">
            <div 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="flex items-center gap-3 pl-3 pr-1.5 py-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 cursor-pointer hover:bg-white/20 transition-all group shadow-lg"
            >
                <div className="flex flex-col text-right hidden xs:block">
                    <p className="text-[13px] font-black text-white leading-none">{profile.name}</p>
                    <p className="text-[9px] font-black text-blue-100/40 uppercase tracking-widest mt-1">
                        {profile.role === 'admin' ? 'Administrateur' : 'Technicien'}
                    </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform border border-white/10">
                    {profile.name.charAt(0)}
                </div>
            </div>

            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 z-50" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-white/10 py-2 z-[60] animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/50">
                        {profile.role === 'admin' && (
                            <>
                                <button
                                    onClick={() => { navigate('/admin/users'); setIsMenuOpen(false); }}
                                    className="w-full px-4 py-3 text-left text-[11px] font-black text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors uppercase tracking-[0.1em]"
                                >
                                    <Users size={14} className="text-emerald-500" />
                                    Gestion Utilisateurs
                                </button>
                                <button
                                    onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}
                                    className="w-full px-4 py-3 text-left text-[11px] font-black text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors uppercase tracking-[0.1em]"
                                >
                                    <Shield size={14} className="text-blue-500" />
                                    Administration
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                            className="w-full px-4 py-3 text-left text-[11px] font-black text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors uppercase tracking-[0.1em]"
                        >
                            <User size={14} className="text-blue-400" />
                            Mon Profil
                        </button>
                        <div className="h-px bg-white/5 my-1 mx-4" />
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-[11px] font-black text-rose-500 hover:bg-rose-500/10 flex items-center gap-3 transition-colors uppercase tracking-[0.1em]"
                        >
                            <LogOut size={14} />
                            Déconnexion
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserMenu;
