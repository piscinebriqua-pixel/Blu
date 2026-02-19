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
        <div className="login-container">
            <div className="login-header-section px-flow">
                <div className="login-logo-glow float-animation">
                    <Droplets size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">DeepBlue</h1>
                <p className="text-white/60 font-medium tracking-widest uppercase text-xs">Entretien Piscine Premium</p>

                <div className="login-waves">
                    <svg className="login-wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="var(--wave-fill)" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,149.3C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
            </div>

            <div className="login-card-wrapper px-flow">
                <div className="card-white p-8 animate-slide-up shadow-2xl">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Bon retour</h2>
                        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Veuillez entrer vos identifiants pour continuer.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in fade-in duration-300">
                            <AlertCircle size={18} className="text-red-500" />
                            <p className="text-red-600 text-xs font-semibold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="input-group">
                            <label className="input-label">Adresse Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="input-field !pl-12"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nom@entreprise.com"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="input-field !pl-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-flow btn-primary h-[60px] text-lg mt-2" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={24} /> : "Se Connecter"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="login-footer-text px-flow">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Conception et développement par M.A.K
                </p>
            </div>
        </div>
    );
};

export default Login;
