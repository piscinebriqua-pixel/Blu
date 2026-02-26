import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { UserPlus, X } from 'lucide-react';
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
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [actionType, setActionType] = useState<'link_technician' | 'link_client' | 'create_technician' | 'create_client' | 'make_admin' | 'edit_profile' | null>(null);
    const [selectedLinkId, setSelectedLinkId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'delete', profileId: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleApproval = async () => {
        if (!selectedProfile || !actionType) return;
        setIsProcessing(true);
        try {
            let updateData: any = { is_approved: true };
            if (actionType === 'make_admin') updateData.role = 'admin';
            else if (actionType === 'link_technician') {
                updateData.role = 'technician';
                updateData.technician_id = selectedLinkId;
            } else if (actionType === 'link_client') {
                updateData.role = 'client';
                updateData.client_id = selectedLinkId;
            }

            const { error } = await supabase.from('profiles').update(updateData).eq('id', selectedProfile.id);
            if (error) throw error;
            toast.success("Compte approuvé !");
            setSelectedProfile(null);
            setActionType(null);
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRevoke = async (profileId: string) => {
        setIsProcessing(true);
        const { error } = await supabase.from('profiles').update({ is_approved: false }).eq('id', profileId);
        if (error) toast.error("Erreur: " + error.message);
        else {
            toast.success("Accès révoqué");
            setConfirmAction(null);
            fetchData();
        }
        setIsProcessing(false);
    };

    const handleDelete = async () => {
        if (!confirmAction) return;
        setIsProcessing(true);
        const { error } = await supabase.from('profiles').delete().eq('id', confirmAction.profileId);
        if (error) toast.error("Erreur suppression: " + error.message);
        else {
            toast.success("Compte supprimé");
            setConfirmAction(null);
            fetchData();
        }
        setIsProcessing(false);
    };

    if (loading && profiles.length === 0) return (
        <PageLayout title="ADMINISTRATION" showBackButton={true}>
            <div className="p-12 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Chargement...</div>
        </PageLayout>
    );

    const toolbar = (
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xs border border-slate-200/50 dark:border-slate-700/50">
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
                                            <button onClick={() => { setSelectedProfile(p); setActionType('link_technician'); }} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-[10px] font-black uppercase">Lier Tech</button>
                                            <button onClick={() => { setSelectedProfile(p); setActionType('link_client'); }} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase">Lier Client</button>
                                            <button onClick={() => { setSelectedProfile(p); setActionType('make_admin'); handleApproval(); }} className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-[10px] font-black uppercase">Admin</button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="px-3 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-[10px] font-black uppercase text-slate-500">{p.role}</span>
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
            </main>

            {selectedProfile && (actionType === 'link_technician' || actionType === 'link_client') && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Lier un compte</h2>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">Profil: {selectedProfile.full_name}</p>

                        <div className="space-y-4 mb-8">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélectionner l'entité</label>
                            <select
                                title="Choisir l'entité à lier"
                                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                value={selectedLinkId}
                                onChange={(e) => setSelectedLinkId(e.target.value)}
                            >
                                <option value="">Choisir...</option>
                                {actionType === 'link_technician' ? (
                                    technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)
                                ) : (
                                    clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)
                                )}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => { setSelectedProfile(null); setActionType(null); }} className="flex-1 h-14 rounded-2xl font-black uppercase text-[13px] tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Annuler</button>
                            <button onClick={handleApproval} disabled={!selectedLinkId || isProcessing} className="flex-2 h-14 bg-primary text-white rounded-2xl font-black uppercase text-[13px] tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all">Valider</button>
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
