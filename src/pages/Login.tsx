import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, AlertCircle, Droplets } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 shadow-2xl ring-1 ring-white/20">
                        <Droplets size={40} className="text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">DeepBlue</h1>
                    <p className="text-blue-100 font-bold tracking-[0.2em] uppercase text-xs opacity-80">
                        Entretien Piscine Premium
                    </p>
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
