import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Droplets, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

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
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Identifiants invalides.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden" style={{ background: 'var(--grad-ocean)' }}>
            {/* Background Decorative Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px]"></div>

            <div className="premium-card w-full max-w-[450px] p-10 relative z-10 mx-4" style={{ borderRadius: '40px' }}>
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-[30px] flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
                        <Droplets size={36} className="text-blue-500" />
                    </div>
                    <h1 className="welcome-text" style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'none', webkitTextFillColor: 'white' }}>BLU CMS</h1>
                    <p className="date-text" style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem' }}>Panel de Commandes</p>
                </div>

                {error && (
                    <div className="bg-pink-500/10 border border-pink-500/20 p-5 rounded-2xl flex items-center gap-4 mb-8 text-pink-500 text-sm font-black">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-3">
                        <label className="mini-stat-label">Email Professionnel</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={20} />
                            <input
                                type="email"
                                required
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nom@entreprise.com"
                                style={{ paddingLeft: '4rem', borderRadius: 'var(--radius-pill)' }}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="mini-stat-label">Code d'autorisation</label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={20} />
                            <input
                                type="password"
                                required
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ paddingLeft: '4rem', borderRadius: 'var(--radius-pill)' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-pill btn-primary w-full h-[70px] mt-4" disabled={loading} style={{ fontSize: '1.2rem' }}>
                        {loading ? (
                            <Loader2 className="animate-spin" size={28} />
                        ) : (
                            <>ACCÉDER AU SYSTÈME <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">
                        Securisé par Cryptographie AES-256
                    </p>
                </div>
            </div>

            <div className="absolute bottom-8 text-center w-full">
                <p className="text-[10px] text-muted font-bold">© 2026 BLU TECHNOLOGIES • TOUS DROITS RÉSERVÉS</p>
            </div>
        </div>
    );
};

export default Login;
