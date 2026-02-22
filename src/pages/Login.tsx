import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import BccpLogo from '../components/BccpLogo';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            const redirectUrl = window.location.origin.includes('localhost')
                ? window.location.origin
                : window.location.origin; // Keep it simple but dynamic

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la connexion Google.');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Identifiants invalides.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-br from-primary to-primary-dark rounded-b-[60px] z-0 shadow-lg" />

            {/* Content Wrapper */}
            <div className="z-10 w-full max-w-sm px-6 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header / Logo */}
                <div className="flex flex-col items-center text-center -mb-4">
                    <BccpLogo
                        width={280}
                        fillColor="white"
                        className="drop-shadow-2xl"
                    />
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-blue-900/10">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-black text-slate-800">Bon retour</h2>
                        <p className="text-sm text-slate-400 font-medium mt-1">
                            Veuillez vous identifier pour continuer.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 mb-6 animate-in fade-in zoom-in-95 duration-200">
                            <AlertCircle size={20} className="text-red-500 shrink-0" />
                            <p className="text-red-600 text-xs font-bold">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-5">
                        {/* Google Button */}
                        <button
                            onClick={handleGoogleLogin}
                            type="button"
                            className="w-full py-4 rounded-2xl font-bold bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Continuer avec Google</span>
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">OU</span>
                            <div className="grow border-t border-slate-200"></div>
                        </div>

                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wide ml-3">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="nom@entreprise.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wide ml-3">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 mt-4 rounded-2xl font-black bg-primary text-white shadow-xl shadow-primary/30 active:scale-[0.98] hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "SE CONNECTER"}
                            </button>
                        </form>
                    </div>
                </div>


                {/* Footer */}
                <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-60">
                        Conception et développement par M.A.K
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
