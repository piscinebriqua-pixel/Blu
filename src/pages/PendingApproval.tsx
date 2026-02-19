import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Clock, ShieldAlert } from 'lucide-react';

const PendingApproval: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 w-full h-[40vh] bg-gradient-to-br from-slate-800 to-slate-900 rounded-b-[60px] z-0 shadow-lg" />

            <div className="z-10 w-full max-w-md px-6 flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">

                <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xl ring-4 ring-white/20">
                    <Clock size={48} className="text-amber-400 drop-shadow-lg" />
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-slate-900/10 text-center w-full">
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Compte en attente</h1>
                    <p className="text-slate-500 font-medium text-sm mb-6">
                        Votre demande d'inscription a bien été reçue.
                    </p>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 flex flex-col items-center gap-3">
                        <ShieldAlert className="text-amber-500" size={32} />
                        <p className="text-amber-700 text-xs font-bold leading-relaxed">
                            Un administrateur doit valider votre compte et vous attribuer un rôle avant que vous ne puissiez accéder à l'application.
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full py-4 rounded-2xl font-black bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        <span>SE DÉCONNECTER</span>
                    </button>
                </div>

                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-60">
                    DeepBlue Security
                </p>
            </div>
        </div>
    );
};

export default PendingApproval;
