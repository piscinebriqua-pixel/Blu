import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Phone, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import BccpLogo from '../components/BccpLogo';
import { toast } from 'react-hot-toast';

const ClientLogin: React.FC = () => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Rechercher le client par son numéro de téléphone
            // On enlève les espaces et caractères spéciaux pour la recherche
            const cleanPhone = phone.replace(/\s/g, '');
            
            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('id, first_name, last_name')
                .or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data) {
                // Succès : on stocke l'ID client dans le localStorage
                localStorage.setItem('blu_client_id', data.id);
                localStorage.setItem('blu_client_name', `${data.first_name} ${data.last_name}`);
                toast.success(`Bienvenue ${data.first_name} !`);
                navigate('/mon-espace');
            } else {
                setError("Numéro de téléphone inconnu. Veuillez contacter votre technicien.");
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError("Une erreur est survenue lors de la connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Accent - Bleu plus clair pour l'espace client */}
            <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-br from-blue-400 to-blue-600 rounded-b-[60px] z-0 shadow-lg" />

            <div className="z-10 w-full max-w-sm px-6 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                <div className="flex flex-col items-center text-center -mb-4">
                    <BccpLogo 
                        width={90} 
                        fillColor="white" 
                        className="drop-shadow-2xl mb-2" 
                    />
                    <h1 className="text-white font-black text-xl tracking-tighter uppercase opacity-90">Espace Client</h1>
                </div>

                <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-blue-900/10 border border-white/50 backdrop-blur-sm">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-black text-slate-800">Bonjour !</h2>
                        <p className="text-base text-slate-500 font-medium mt-1">
                            Entrez votre numéro de téléphone pour consulter votre dossier.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-in fade-in zoom-in-95">
                            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-600 text-[13px] font-bold leading-snug">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro de téléphone</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="tel"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="06 12 34 56 78"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4.5 rounded-2xl font-black bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 active:scale-[0.98] hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 group h-14"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={22} />
                            ) : (
                                <>
                                    ACCÉDER À MON ESPACE
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-60">
                        Propulsé par Blu • Système de Gestion Piscine
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
