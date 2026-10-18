import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Clock, ShieldAlert, RotateCw } from 'lucide-react';

const PendingApproval: React.FC = () => {
    const navigate = useNavigate();
    const { session, refreshProfile, signOut } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const handleCheckApproval = async () => {
        setRefreshing(true);
        try {
            await refreshProfile();
        } finally {
            setTimeout(() => setRefreshing(false), 500);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const userEmail = session?.user?.email || 'Compte non spécifié';

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
                    <p className="text-slate-500 font-medium text-base mb-4">
                        Votre demande d'inscription a bien été reçue.
                    </p>

                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 mb-6">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-1">
                            Compte connecté
                        </span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 break-all">
                            {userEmail}
                        </span>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 flex flex-col items-center gap-3">
                        <ShieldAlert className="text-amber-500 shrink-0" size={32} />
                        <p className="text-amber-800 text-xs font-bold leading-relaxed">
                            Un administrateur doit valider votre compte et vous attribuer un rôle avant que vous ne puissiez accéder à l'application.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleCheckApproval}
                            disabled={refreshing}
                            className="w-full min-h-[48px] py-3.5 rounded-2xl font-black bg-primary text-white hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-wider shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            <RotateCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            <span>{refreshing ? 'Vérification...' : 'Vérifier la validation'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full min-h-[48px] py-3.5 rounded-2xl font-black bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-wider"
                        >
                            <LogOut size={16} />
                            <span>Changer de compte / Se déconnecter</span>
                        </button>
                    </div>
                </div>

                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] opacity-80">
                    BCCP Security
                </p>
            </div>
        </div>
    );
};

export default PendingApproval;
