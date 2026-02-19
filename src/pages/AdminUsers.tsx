import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserCheck, Shield, UserPlus } from 'lucide-react';

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

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <Shield className="text-primary" />
                Administration Utilisateurs
            </h1>

            {profiles.length === 0 ? (
                <div className="bg-green-50 p-8 rounded-3xl text-center borderBorder-green-100">
                    <UserCheck className="mx-auto text-green-500 mb-4" size={48} />
                    <p className="text-green-800 font-bold">Aucune demande en attente.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {profiles.map(profile => (
                        <div key={profile.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{profile.full_name || 'Sans nom'}</h3>
                                <p className="text-slate-500 text-sm font-mono">{profile.email}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase">
                                    En attente
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setSelectedProfile(profile); setActionType('link_technician'); }}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                                >
                                    + TECHNICIEN
                                </button>
                                <button
                                    onClick={() => { setSelectedProfile(profile); setActionType('link_client'); }}
                                    className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold text-xs hover:bg-purple-100 transition-colors"
                                >
                                    + CLIENT
                                </button>
                                <button
                                    onClick={() => { setSelectedProfile(profile); setActionType('make_admin'); handleApproval(); }}
                                    className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-700 transition-colors"
                                >
                                    ADMIN
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Linking/Creating */}
            {selectedProfile && (actionType === 'link_technician' || actionType === 'link_client') && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full animate-in fade-in zoom-in-95">
                        <h2 className="text-xl font-black text-slate-800 mb-4">
                            Approuver {selectedProfile.email}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                    Option 1: Lier à un existant
                                </label>
                                <select
                                    className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-primary"
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
                            </div>

                            <div className="relative py-2 text-center">
                                <span className="bg-white px-2 text-xs font-bold text-slate-300 uppercase">OU</span>
                                <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 -z-10"></div>
                            </div>

                            <button
                                onClick={() => { setActionType(actionType === 'link_technician' ? 'create_technician' : 'create_client'); handleApproval(); }}
                                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl font-bold text-slate-500 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                            >
                                <UserPlus size={18} />
                                Créer une nouvelle fiche
                            </button>

                            <button
                                onClick={handleApproval}
                                disabled={!selectedLinkId}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                Valider et Lier
                            </button>

                            <button onClick={() => setSelectedProfile(null)} className="w-full py-2 text-slate-400 font-bold text-xs hover:text-slate-600">
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
