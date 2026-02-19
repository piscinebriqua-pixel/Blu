import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserCheck, Shield, UserPlus, ArrowLeft, ChevronDown } from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_approved: boolean;
    created_at: string;
}

interface Technician {
    id: string;
    full_name: string;
    email: string | null;
}

interface Client {
    id: string;
    full_name: string; // Adjusted to match likely schema or computed
    first_name: string;
    last_name: string;
    email: string | null;
}

const AdminUsers: React.FC = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // Modal State
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [actionType, setActionType] = useState<'link_technician' | 'link_client' | 'create_technician' | 'create_client' | 'make_admin' | null>(null);
    const [selectedLinkId, setSelectedLinkId] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch pending profiles
        const { data: profs } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        if (profs) setProfiles(profs);

        // Fetch Technicians for linking
        const { data: techs } = await supabase.from('technicians').select('*').order('full_name');
        if (techs) setTechnicians(techs);

        // Fetch Clients for linking
        const { data: cli } = await supabase.from('clients').select('*').order('last_name');
        if (cli) setClients(cli); // Note: might need to form full_name manually

        setLoading(false);
    };

    const handleApproval = async () => {
        if (!selectedProfile || !actionType) return;

        let updateData: any = { is_approved: true };

        if (actionType === 'make_admin') {
            updateData.role = 'admin';
        }
        else if (actionType === 'link_technician') {
            updateData.role = 'technician';
            updateData.technician_id = selectedLinkId;
            // Determine if we need to update the technician record with the user's email? Maybe.
        }
        else if (actionType === 'link_client') {
            updateData.role = 'client';
            updateData.client_id = selectedLinkId;
        }
        else if (actionType === 'create_technician') {
            // Transaction-like logic needed: Create tech then update profile.
            // Simplified: 
            const { data: newTech, error } = await supabase.from('technicians').insert({
                full_name: selectedProfile.full_name || selectedProfile.email,
                email: selectedProfile.email
            }).select().single();

            if (error) {
                alert("Erreur création technicien: " + error.message);
                return;
            }
            updateData.role = 'technician';
            updateData.technician_id = newTech.id;
        }

        const { error } = await supabase.from('profiles').update(updateData).eq('id', selectedProfile.id);

        if (error) alert("Erreur mise à jour profil: " + error.message);
        else {
            setSelectedProfile(null);
            setActionType(null);
            fetchData();
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Chargement...</div>;

    return (
        <div className="gabarit-wrapper">
            <header className="header-gradient flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        title="Retour au tableau de bord"
                        className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight">Administration</h1>
                        <p className="text-blue-100 text-xs font-medium opacity-80">Validation des comptes</p>
                    </div>
                </div>

                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md">
                    <Shield size={20} />
                </div>
            </header>

            <main className="main-container">
                {profiles.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-4 transition-colors">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500 mb-2">
                            <UserCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Tout est à jour !</h3>
                            <p className="text-slate-400 text-sm">Aucune demande en attente pour le moment.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 px-2 mb-2">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {profiles.length} demande{profiles.length > 1 ? 's' : ''} en attente
                            </span>
                        </div>

                        {profiles.map(profile => (
                            <div key={profile.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100/50 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-lg">
                                        {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{profile.full_name || 'Sans nom'}</h3>
                                        <p className="text-slate-400 text-sm font-mono">{profile.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setSelectedProfile(profile); setActionType('link_technician'); }}
                                        className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors uppercase tracking-wide"
                                    >
                                        + Technicien
                                    </button>
                                    <button
                                        onClick={() => { setSelectedProfile(profile); setActionType('link_client'); }}
                                        className="px-4 py-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors uppercase tracking-wide"
                                    >
                                        + Client
                                    </button>
                                    <button
                                        onClick={() => { setSelectedProfile(profile); setActionType('make_admin'); handleApproval(); }}
                                        className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 text-slate-200 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors uppercase tracking-wide flex items-center gap-2"
                                    >
                                        <Shield size={14} /> Admin
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal for Linking/Creating */}
            {selectedProfile && (actionType === 'link_technician' || actionType === 'link_client') && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 max-w-md w-full animate-in fade-in zoom-in-95 shadow-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">
                            Approuver ce compte
                        </h2>
                        <p className="text-slate-400 text-sm mb-6 font-medium">Pour {selectedProfile.email}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                    Lier à une fiche existante
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary appearance-none transition-colors"
                                        onChange={(e) => setSelectedLinkId(e.target.value)}
                                        value={selectedLinkId}
                                        title={`Sélectionner un ${actionType === 'link_technician' ? 'Technicien' : 'Client'}`}
                                    >
                                        <option value="">Sélectionner un {actionType === 'link_technician' ? 'Technicien' : 'Client'}...</option>
                                        {actionType === 'link_technician'
                                            ? technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)
                                            : clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)
                                        }
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="relative py-2 text-center">
                                <span className="bg-white dark:bg-slate-800 px-2 text-xs font-bold text-slate-300 uppercase relative z-10 transition-colors">OU</span>
                                <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 dark:bg-slate-700"></div>
                            </div>

                            <button
                                onClick={() => { setActionType(actionType === 'link_technician' ? 'create_technician' : 'create_client'); handleApproval(); }}
                                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 group"
                            >
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                    <UserPlus size={14} />
                                </div>
                                Créer une nouvelle fiche
                            </button>

                            <button
                                onClick={handleApproval}
                                disabled={!selectedLinkId}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed mt-4 active:scale-95 transition-transform"
                            >
                                Valider et Lier
                            </button>

                            <button onClick={() => setSelectedProfile(null)} className="w-full py-2 text-slate-400 font-bold text-xs hover:text-slate-600 uppercase tracking-widest">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
