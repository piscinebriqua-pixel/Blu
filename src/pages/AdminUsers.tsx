import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { UserPlus, X, FileText, Wrench, Package, Settings, Key, Plus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import PageLayout from '../components/PageLayout';

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
    full_name: string;
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

    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [actionType, setActionType] = useState<'link_technician' | 'link_client' | 'create_technician' | 'create_client' | 'make_admin' | 'edit_profile' | 'reset_password' | 'create_user' | null>(null);
    const [selectedLinkId, setSelectedLinkId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('all');
    const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'delete', profileId: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [devisCount, setDevisCount] = useState(0);

    const [passwordInput, setPasswordInput] = useState('');
    const [newUserForm, setNewUserForm] = useState({ full_name: '', email: '', role: 'client' });

    const fetchData = async () => {
        try {
            setLoading(true);
            let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

            if (activeTab === 'pending') {
                query = query.eq('is_approved', false);
            }

            const { data: profs, error: profError } = await query;
            if (profError) throw profError;
            setProfiles(profs || []);

            const { data: techs } = await supabase.from('technicians').select('*').order('full_name');
            if (techs) setTechnicians(techs);

            const { data: cli } = await supabase.from('clients').select('*').order('last_name');
            if (cli) setClients(cli);

            const { count: dCount } = await supabase.from('devis').select('*', { count: 'exact', head: true });
            setDevisCount(dCount || 0);

        } catch (error: any) {
            console.error('Erreur fetchData:', error);
            toast.error("Erreur de chargement: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleUpdateProfile = async (role: string, linkId?: string) => {
        if (!selectedProfile) return;
        setIsProcessing(true);
        try {
            let finalLinkId = linkId;

            // Logique de création explicite d'une nouvelle fiche technique ou client
            if (linkId === 'CREATE_NEW') {
                if (role === 'technician') {
                    const { data: techData, error: techErr } = await supabase.from('technicians').insert({
                        full_name: selectedProfile.full_name,
                        email: selectedProfile.email,
                        active: true
                    }).select().single();
                    if (techErr) throw techErr;
                    finalLinkId = techData.id;
                } else if (role === 'client') {
                    const nameParts = selectedProfile.full_name.split(' ');
                    const fName = nameParts[0];
                    const lName = nameParts.slice(1).join(' ') || '';
                    const { data: cliData, error: cliErr } = await supabase.from('clients').insert({
                        first_name: fName,
                        last_name: lName,
                        full_name: selectedProfile.full_name,
                        email: selectedProfile.email
                    }).select().single();
                    if (cliErr) throw cliErr;
                    finalLinkId = cliData.id;
                }
            }

            let updateData: any = { is_approved: true, role };

            // Clean up old links
            updateData.technician_id = null;
            updateData.client_id = null;

            if (role === 'technician') updateData.technician_id = finalLinkId;
            else if (role === 'client') updateData.client_id = finalLinkId;

            const { error } = await supabase.from('profiles').update(updateData).eq('id', selectedProfile.id);
            if (error) throw error;

            toast.success("Profil mis à jour !");
            setSelectedProfile(null);
            setActionType(null);
            setSelectedLinkId('');
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedProfile || !passwordInput) return;
        setIsProcessing(true);
        try {
            const { error } = await supabase.rpc('admin_reset_password', {
                target_user_id: selectedProfile.id,
                new_password: passwordInput
            });
            if (error) throw error;
            toast.success("Mot de passe réinitialisé !");
            setPasswordInput('');
            setSelectedProfile(null);
            setActionType(null);
        } catch (e: any) {
            toast.error("Erreur de modification. Avez-vous exécuté le code SQL ? Détails: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUserForm.full_name || !passwordInput) {
            toast.error("Nom complet et mot de passe requis");
            return;
        }
        setIsProcessing(true);
        try {
            // Generate pseudo email if not provided
            let finalEmail = newUserForm.email?.trim() || '';
            if (!finalEmail) {
                const cleanName = newUserForm.full_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.').toLowerCase();
                finalEmail = `${cleanName}@blu.com`;
            }

            console.log("Creating user with email:", finalEmail);

            // Utiliser un client temporaire pour ne pas écraser la session de l'administrateur
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            const { data, error } = await tempSupabase.auth.signUp({
                email: finalEmail,
                password: passwordInput,
                options: {
                    data: {
                        full_name: newUserForm.full_name,
                        role: newUserForm.role
                    }
                }
            });

            if (error) throw error;
            
            // Si l'auth est un succès, on crée UNIQUEMENT le profil avec is_approved: false
            // L'administrateur devra aller dans "Validation" pour le lier ou créer la fiche explicitement.
            if (data?.user) {
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    email: finalEmail,
                    full_name: newUserForm.full_name,
                    role: newUserForm.role,
                    is_approved: false
                });
            }

            toast.success("Utilisateur créé! Allez dans l'onglet Validation pour le lier.", { duration: 8000 });
            
            // Profil sera probablement en attente de validation ou créé directement
            // On ferme la fenêtre
            setActionType(null);
            setNewUserForm({ full_name: '', email: '', role: 'client' });
            setPasswordInput('');
            fetchData();
        } catch (e: any) {
            console.error("Signup error:", e);
            toast.error("Erreur création: " + e.message, { duration: 6000 });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRevoke = async (profileId: string) => {
        setIsProcessing(true);
        try {
            const { error } = await supabase.from('profiles').update({ is_approved: false }).eq('id', profileId);
            if (error) throw error;

            toast.success("Accès révoqué");
            // Mise à jour immédiate de l'état local
            setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_approved: false } : p));
            setConfirmAction(null);

            // Si on est sur l'onglet validation, on filtre carrément
            if (activeTab === 'pending') {
                setProfiles(prev => prev.filter(p => p.id !== profileId));
            }
        } catch (e: any) {
            toast.error("Erreur: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmAction) return;
        const profileId = confirmAction.profileId;
        setIsProcessing(true);
        try {
            // Supprimer d'abord de l'authentification Supabase (via RPC)
            const { error: authError } = await supabase.rpc('admin_delete_user', {
                target_user_id: profileId
            });
            
            if (authError) {
                console.warn("Could not delete from auth, maybe not found or RPC missing:", authError);
            }

            // Supprimer le profil local
            const { error } = await supabase.from('profiles').delete().eq('id', profileId);
            if (error) throw error;

            toast.success("Compte et accès supprimés");
            // Mise à jour immédiate de l'état local : on retire le profil de la liste
            setProfiles(prev => prev.filter(p => p.id !== profileId));
            setConfirmAction(null);
        } catch (e: any) {
            toast.error("Erreur suppression: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading && profiles.length === 0) return (
        <PageLayout title="ADMINISTRATION" showBackButton={true}>
            <div className="p-12 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Chargement...</div>
        </PageLayout>
    );

    const toolbar = (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto max-w-xs border border-slate-200/50 dark:border-slate-700/50">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending'
                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    Validation
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all'
                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    Tous
                </button>
            </div>
            <button
                onClick={() => { setActionType('create_user'); setNewUserForm({ full_name: '', email: '', role: 'client' }); setPasswordInput(''); }}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={16} strokeWidth={3} /> Nouveau
            </button>
        </div>
    );

    return (
        <PageLayout
            title="ADMINISTRATION"
            subtitle={activeTab === 'pending' ? 'Validation des comptes' : 'Gestion des utilisateurs'}
            showBackButton={true}
            toolbar={toolbar}
        >
            <main className="main-container !pt-4">
                <div className="grid gap-4">
                    {profiles.length > 0 ? (
                        profiles.map((p) => (
                            <div key={p.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400">
                                        <UserPlus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{p.full_name || 'Sans Nom'}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {activeTab === 'pending' ? (
                                        <>
                                            <button onClick={() => { setSelectedProfile(p); setActionType('link_technician'); }} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-[10px] font-black uppercase transition-all hover:scale-105 active:scale-95">Lier Tech</button>
                                            <button onClick={() => { setSelectedProfile(p); setActionType('link_client'); }} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase transition-all hover:scale-105 active:scale-95">Lier Client</button>
                                            <button onClick={() => { setSelectedProfile(p); handleUpdateProfile('admin'); }} className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-[10px] font-black uppercase transition-all hover:scale-105 active:scale-95">Admin</button>
                                            <button onClick={() => setConfirmAction({ type: 'delete', profileId: p.id })} className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-100 hover:scale-105 active:scale-95 flex items-center gap-1.5" title="Refuser la demande">
                                                <X size={14} strokeWidth={3} />
                                                Refuser
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="px-3 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-[10px] font-black uppercase text-slate-500">{p.role}</span>
                                            <button
                                                title="Modifier le rôle"
                                                onClick={() => {
                                                    setSelectedProfile(p);
                                                    setActionType('edit_profile');
                                                    setSelectedLinkId((p as any).technician_id || (p as any).client_id || '');
                                                }}
                                                className="p-2 text-primary hover:bg-blue-50 rounded-xl transition-colors"
                                            >
                                                <UserPlus size={20} />
                                            </button>
                                            <button
                                                title="Réinitialiser le mot de passe"
                                                onClick={() => {
                                                    setSelectedProfile(p);
                                                    setActionType('reset_password');
                                                    setPasswordInput('');
                                                }}
                                                className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                                            >
                                                <Key size={20} />
                                            </button>
                                            <button title="Supprimer l'accès" onClick={() => setConfirmAction({ type: 'revoke', profileId: p.id })} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><X size={20} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center opacity-40">Aucun utilisateur trouvé</div>
                    )}
                </div>

                {/* Administration Bottom Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Devis Counter Section */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Compteur de Devis</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration & Statistiques</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Total des Devis émis</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-primary">{devisCount}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Documents</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/chantiers')}
                            className="w-full mt-4 py-4 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                        >
                            <Settings size={14} /> Gérer la base chantiers
                        </button>
                    </div>

                    {/* Quick Add Catalog Section */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Catalogue Quick-Add</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prestations & Matériels</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/settings/services')}
                                className="group flex flex-col items-center gap-3 p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 rounded-3xl hover:bg-blue-100 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-blue-900/50 flex items-center justify-center text-blue-600 shadow-sm">
                                    <Wrench size={18} />
                                </div>
                                <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Ajouter Service</span>
                            </button>

                            <button
                                onClick={() => navigate('/settings/services')}
                                className="group flex flex-col items-center gap-3 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 rounded-3xl hover:bg-emerald-100 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 shadow-sm">
                                    <Package size={18} />
                                </div>
                                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Ajouter Produit</span>
                            </button>
                        </div>

                        <p className="mt-6 text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest italic opacity-60">L'ajout direct ouvrira le gestionnaire de catalogue</p>
                    </div>
                </div>
            </main>

            {selectedProfile && (actionType === 'link_technician' || actionType === 'link_client' || actionType === 'edit_profile') && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">
                            {actionType === 'edit_profile' ? 'Modifier le compte' : 'Lier un compte'}
                        </h2>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">Profil: {selectedProfile.full_name}</p>

                        <div className="space-y-6">
                            {actionType === 'edit_profile' && (
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Rôle de l'utilisateur</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['admin', 'technician', 'client'].map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => {
                                                    setSelectedProfile({ ...selectedProfile, role: r });
                                                    setSelectedLinkId('');
                                                }}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${selectedProfile.role === r
                                                    ? 'border-primary bg-blue-50 text-primary'
                                                    : 'border-slate-100 text-slate-400'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(actionType === 'link_technician' || (actionType === 'edit_profile' && selectedProfile.role === 'technician')) && (
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélectionner le Technicien</label>
                                    <select
                                        title="Choisir le technicien"
                                        className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-slate-800 dark:text-white"
                                        value={selectedLinkId}
                                        onChange={(e) => setSelectedLinkId(e.target.value)}
                                    >
                                        <option value="">Choisir...</option>
                                        <option value="CREATE_NEW">➕ Créer une NOUVELLE FICHE avec ce nom</option>
                                        <optgroup label="Lier à un existant">
                                            {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            )}

                            {(actionType === 'link_client' || (actionType === 'edit_profile' && selectedProfile.role === 'client')) && (
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélectionner le Client</label>
                                    <select
                                        title="Choisir le client"
                                        className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-slate-800 dark:text-white"
                                        value={selectedLinkId}
                                        onChange={(e) => setSelectedLinkId(e.target.value)}
                                    >
                                        <option value="">Choisir...</option>
                                        <option value="CREATE_NEW">➕ Créer une NOUVELLE FICHE avec ce nom</option>
                                        <optgroup label="Lier à un existant">
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => { setSelectedProfile(null); setActionType(null); setSelectedLinkId(''); }} className="flex-1 h-14 rounded-2xl font-black uppercase text-[13px] tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Annuler</button>
                            <button
                                onClick={() => {
                                    if (actionType === 'edit_profile') handleUpdateProfile(selectedProfile.role, selectedLinkId);
                                    else if (actionType === 'link_technician') handleUpdateProfile('technician', selectedLinkId);
                                    else if (actionType === 'link_client') handleUpdateProfile('client', selectedLinkId);
                                }}
                                disabled={isProcessing || ((selectedProfile.role === 'technician' || selectedProfile.role === 'client') && !selectedLinkId)}
                                className="flex-2 h-14 bg-primary text-white rounded-2xl font-black uppercase text-[13px] tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
                            >
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedProfile && actionType === 'reset_password' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                            <Key className="text-amber-500" /> Mot de passe
                        </h2>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">Profil: {selectedProfile.full_name}</p>

                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                            <input
                                type="text"
                                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Saisir min 6 caractères..."
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                            />
                            <p className="text-[10px] text-slate-400 opacity-60">
                                Un appel SQL sera fait pour forcer cette modification.
                            </p>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => { setSelectedProfile(null); setActionType(null); setPasswordInput(''); }} className="flex-1 h-14 rounded-2xl font-black uppercase text-[13px] tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Annuler</button>
                            <button
                                onClick={handleResetPassword}
                                disabled={isProcessing || passwordInput.length < 6}
                                className="flex-2 h-14 bg-amber-500 text-white rounded-2xl font-black uppercase text-[13px] tracking-widest shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {actionType === 'create_user' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                            <UserPlus className="text-primary" /> Nouveau Profil
                        </h2>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">Création manuelle</p>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom complet *</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 w-full h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newUserForm.full_name}
                                    onChange={e => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                                />
                            </div>
                            
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email <span className="opacity-50">(Laisser vide si pas d'email)</span></label>
                                <input
                                    type="email"
                                    className="mt-1 w-full h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Ex: test@blu.interne"
                                    value={newUserForm.email}
                                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Rôle initial</label>
                                <select
                                    className="mt-1 w-full h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newUserForm.role}
                                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                >
                                    <option value="client">Client</option>
                                    <option value="technician">Technicien</option>
                                    <option value="admin">Administrateur</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe provisoire *</label>
                                <input
                                    type="text"
                                    required
                                    minLength={6}
                                    className="mt-1 w-full h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={passwordInput}
                                    onChange={e => setPasswordInput(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => { setActionType(null); setNewUserForm({full_name: '', email: '', role: 'client'}); setPasswordInput(''); }} className="flex-1 h-14 rounded-2xl font-black uppercase text-[13px] tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Annuler</button>
                            <button
                                onClick={handleCreateUser}
                                disabled={isProcessing || !newUserForm.full_name || passwordInput.length < 6}
                                className="flex-2 h-14 bg-primary text-white rounded-2xl font-black uppercase text-[13px] tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
                            >
                                Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmAction && (
                <ConfirmModal
                    isOpen={!!confirmAction}
                    title={confirmAction.type === 'revoke' ? "Révoquer l'accès" : "Supprimer le compte"}
                    message="Cette action est irréversible. Voulez-vous continuer ?"
                    confirmLabel="Confirmer"
                    onConfirm={confirmAction.type === 'revoke' ? () => handleRevoke(confirmAction.profileId) : handleDelete}
                    onClose={() => setConfirmAction(null)}
                    loading={isProcessing}
                />
            )}
        </PageLayout>
    );
};

export default AdminUsers;
