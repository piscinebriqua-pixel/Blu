import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { UserCheck, Shield, UserPlus, ArrowLeft, ChevronDown, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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
    const [actionType, setActionType] = useState<'link_technician' | 'link_client' | 'create_technician' | 'create_client' | 'make_admin' | 'change_role' | null>(null);
    const [selectedLinkId, setSelectedLinkId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [newRole, setNewRole] = useState<string>('');
    const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'delete', profileId: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        // Fetch profiles based on active tab
        let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

        if (activeTab === 'pending') {
            query = query.eq('is_approved', false);
        }

        const { data: profs } = await query;
        if (profs) setProfiles(profs);

        // Fetch Technicians for linking
        const { data: techs } = await supabase.from('technicians').select('*').order('full_name');
        if (techs) setTechnicians(techs);

        // Fetch Clients for linking
        const { data: cli } = await supabase.from('clients').select('*').order('last_name');
        if (cli) setClients(cli);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApproval = async () => {
        if (!selectedProfile || !actionType) return;

        let updateData: any = { is_approved: true };

        if (actionType === 'make_admin') {
            updateData.role = 'admin';
        }
        else if (actionType === 'link_technician') {
            updateData.role = 'technician';
            updateData.technician_id = selectedLinkId;
        }
        else if (actionType === 'link_client') {
            updateData.role = 'client';
            updateData.client_id = selectedLinkId;
        }
        else if (actionType === 'create_technician') {
            const { data: newTech, error } = await supabase.from('technicians').insert({
                full_name: selectedProfile.full_name || selectedProfile.email,
                email: selectedProfile.email
            }).select().single();

            if (error) {
                toast.error("Erreur création technicien: " + error.message);
                return;
            }
            updateData.role = 'technician';
            updateData.technician_id = newTech.id;
        }
        else if (actionType === 'change_role') {
            updateData.role = newRole;
        }

        const { error } = await supabase.from('profiles').update(updateData).eq('id', selectedProfile.id);

        if (error) toast.error("Erreur mise à jour profil: " + error.message);
        else {
            toast.success("Profil mis à jour avec succès");
            setSelectedProfile(null);
            setActionType(null);
            setNewRole('');
            fetchData();
        }
    };

    const handleRevoke = async () => {
        if (!confirmAction || confirmAction.type !== 'revoke') return;
        setIsProcessing(true);
        const { error } = await supabase.from('profiles').update({ is_approved: false }).eq('id', confirmAction.profileId);
        if (error) toast.error("Erreur revocation: " + error.message);
        else {
            toast.success("Accès révoqué");
            setConfirmAction(null);
            fetchData();
        }
        setIsProcessing(false);
    };

    const handleDelete = async () => {
        if (!confirmAction || confirmAction.type !== 'delete') return;
        setIsProcessing(true);
        // In Supabase, deleting from auth.users requires admin/service role. 
        // We can delete from public.profiles, but auth user remains.
        // For now, let's just delete the profile record.
        const { error } = await supabase.from('profiles').delete().eq('id', confirmAction.profileId);
        if (error) toast.error("Erreur suppression: " + error.message);
        else {
            toast.success("Compte supprimé");
            setConfirmAction(null);
            fetchData();
        }
        setIsProcessing(false);
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
                <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200 dark:border-slate-700 mb-8">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        En Attente
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        Tous les comptes
                    </button>
                </div>

                {profiles.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-4 transition-colors">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mb-2">
                            <UserCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Aucun profil</h3>
                            <p className="text-slate-400 text-sm">Il n'y a aucun compte dans cette catégorie.</p>
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
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${profile.role === 'admin' ? 'bg-slate-900 dark:bg-slate-700 text-white' :
                                        profile.role === 'technician' ? 'bg-blue-500 text-white' :
                                            'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                        }`}>
                                        {profile.role === 'admin' ? <Shield size={18} /> : (profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?')}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-800 dark:text-white">{profile.full_name || 'Sans nom'}</h3>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${profile.role === 'admin' ? 'bg-slate-900 text-white' :
                                                profile.role === 'technician' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                {profile.role}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-xs font-medium">{profile.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {activeTab === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => { setSelectedProfile(profile); setActionType('link_technician'); }}
                                                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors uppercase"
                                            >
                                                + Tech
                                            </button>
                                            <button
                                                onClick={() => { setSelectedProfile(profile); setActionType('link_client'); }}
                                                className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-xs hover:bg-purple-100 transition-colors uppercase"
                                            >
                                                + Client
                                            </button>
                                            <button
                                                onClick={() => { setSelectedProfile(profile); setActionType('make_admin'); handleApproval(); }}
                                                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-colors uppercase"
                                            >
                                                Admin
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => { setSelectedProfile(profile); setActionType('change_role'); setNewRole(profile.role); }}
                                                className="px-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors uppercase"
                                            >
                                                Rôle
                                            </button>
                                            {profile.is_approved ? (
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'revoke', profileId: profile.id })}
                                                    className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl font-bold text-xs hover:bg-amber-100 transition-colors uppercase"
                                                >
                                                    Révoquer
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', profile.id);
                                                        if (error) toast.error(error.message); else { toast.success("Compte approuvé"); fetchData(); }
                                                    }}
                                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors uppercase"
                                                >
                                                    Approuver
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setConfirmAction({ type: 'delete', profileId: profile.id })}
                                                className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
                                                title="Supprimer le compte"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    )}
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
                                <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 dark:border-slate-700"></div>
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

            {selectedProfile && actionType === 'change_role' && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 max-w-md w-full animate-in fade-in zoom-in-95 shadow-2xl border border-slate-100 dark:border-slate-700 transition-colors text-center">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Changer le rôle</h2>
                        <p className="text-slate-400 text-sm mb-6">{selectedProfile.email}</p>

                        <div className="flex flex-col gap-3">
                            {['admin', 'technician', 'client', 'pending'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => setNewRole(role)}
                                    className={`py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2 ${newRole === role
                                        ? 'bg-primary/5 border-primary text-primary'
                                        : 'bg-slate-50 dark:bg-slate-700 border-transparent text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}

                            <button
                                onClick={handleApproval}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 mt-4 active:scale-95 transition-transform"
                            >
                                Mettre à jour
                            </button>
                            <button onClick={() => setSelectedProfile(null)} className="w-full py-2 text-slate-400 font-bold text-xs hover:text-slate-600 uppercase tracking-widest">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmAction}
                title={confirmAction?.type === 'revoke' ? 'Révoquer Accès' : 'Supprimer Compte'}
                message={confirmAction?.type === 'revoke'
                    ? "Voulez-vous vraiment révoquer l'accès de cet utilisateur ? Il ne pourra plus se connecter."
                    : "Voulez-vous vraiment supprimer définitivement ce compte ? Cette action est irréversible."
                }
                confirmLabel={confirmAction?.type === 'revoke' ? 'REVOQUER' : 'SUPPRIMER'}
                onConfirm={confirmAction?.type === 'revoke' ? handleRevoke : handleDelete}
                onClose={() => setConfirmAction(null)}
                loading={isProcessing}
            />
        </div>
    );
};

export default AdminUsers;
