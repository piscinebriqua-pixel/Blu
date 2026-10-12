import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Wrench, 
  Package, 
  Settings, 
  Plus, 
  Search, 
  X, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Users 
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import PageLayout from '../components/PageLayout';
import { AdminUserCard } from '../components/admin/AdminUserCard';
import { AdminUserModals } from '../components/admin/AdminUserModals';
import type { 
  Profile, 
  Technician, 
  Client, 
  AdminRoleFilter, 
  AdminActionType 
} from '../components/admin/types';

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Filtering & Search
  const [activeFilter, setActiveFilter] = useState<AdminRoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Actions
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [actionType, setActionType] = useState<AdminActionType>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'revoke' | 'delete'; profileId: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [devisCount, setDevisCount] = useState(0);

  const [passwordInput, setPasswordInput] = useState('');
  const [newUserForm, setNewUserForm] = useState({ full_name: '', email: '', role: 'client' });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all profiles so we have live counters and instant filtering
      const { data: profs, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

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
      toast.error('Erreur de chargement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time counter metrics
  const counts = useMemo(() => {
    const total = profiles.length;
    const pending = profiles.filter((p) => !p.is_approved).length;
    const technician = profiles.filter((p) => p.is_approved && p.role === 'technician').length;
    const client = profiles.filter((p) => p.role === 'client' && p.is_approved).length;
    const admin = profiles.filter((p) => p.role === 'admin' && p.is_approved).length;
    return { total, pending, technician, client, admin };
  }, [profiles]);

  // Filtered & Searched list
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Role filter
      if (activeFilter === 'pending' && p.is_approved) return false;
      if (activeFilter === 'technician' && (!p.is_approved || p.role !== 'technician')) return false;
      if (activeFilter === 'client' && (!p.is_approved || p.role !== 'client')) return false;
      if (activeFilter === 'admin' && (!p.is_approved || p.role !== 'admin')) return false;

      // Text query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = (p.full_name || '').toLowerCase().includes(query);
        const matchEmail = (p.email || '').toLowerCase().includes(query);
        return matchName || matchEmail;
      }
      return true;
    });
  }, [profiles, activeFilter, searchQuery]);

  const handleUpdateProfile = async (role: string, linkId?: string) => {
    if (!selectedProfile) return;
    setIsProcessing(true);
    try {
      let finalLinkId = linkId;

      if (linkId === 'CREATE_NEW') {
        if (role === 'technician') {
          const { data: techData, error: techErr } = await supabase
            .from('technicians')
            .insert({ full_name: selectedProfile.full_name, email: selectedProfile.email, active: true })
            .select()
            .single();
          if (techErr) throw techErr;
          finalLinkId = techData.id;
        } else if (role === 'client') {
          const nameParts = selectedProfile.full_name.split(' ');
          const fName = nameParts[0];
          const lName = nameParts.slice(1).join(' ') || '';
          const { data: cliData, error: cliErr } = await supabase
            .from('clients')
            .insert({
              first_name: fName,
              last_name: lName,
              full_name: selectedProfile.full_name,
              email: selectedProfile.email,
            })
            .select()
            .single();
          if (cliErr) throw cliErr;
          finalLinkId = cliData.id;
        }
      }

      let updateData: any = { is_approved: true, role };
      updateData.technician_id = role === 'technician' ? finalLinkId : null;
      updateData.client_id = role === 'client' ? finalLinkId : null;

      const { error } = await supabase.from('profiles').update(updateData).eq('id', selectedProfile.id);
      if (error) throw error;

      toast.success('Profil mis à jour !');
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
        new_password: passwordInput,
      });
      if (error) throw error;
      toast.success('Mot de passe réinitialisé !');
      setPasswordInput('');
      setSelectedProfile(null);
      setActionType(null);
    } catch (e: any) {
      toast.error('Erreur de modification: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.full_name || !passwordInput) {
      toast.error('Nom complet et mot de passe requis');
      return;
    }
    setIsProcessing(true);
    try {
      let finalEmail = newUserForm.email?.trim() || '';
      if (!finalEmail) {
        const cleanName = newUserForm.full_name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '.')
          .toLowerCase();
        finalEmail = `${cleanName}@blu.com`;
      }

      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );

      const { data, error } = await tempSupabase.auth.signUp({
        email: finalEmail,
        password: passwordInput,
        options: { data: { full_name: newUserForm.full_name, role: newUserForm.role } },
      });

      if (error) throw error;

      if (data?.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: finalEmail,
          full_name: newUserForm.full_name,
          role: newUserForm.role,
          is_approved: false,
        });
      }

      toast.success("Utilisateur créé ! Retrouvez-le dans l'onglet En Attente.", { duration: 6000 });
      setActionType(null);
      setNewUserForm({ full_name: '', email: '', role: 'client' });
      setPasswordInput('');
      fetchData();
    } catch (e: any) {
      toast.error('Erreur création: ' + e.message, { duration: 6000 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async (profileId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('profiles').update({ is_approved: false }).eq('id', profileId);
      if (error) throw error;
      toast.success('Accès révoqué');
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, is_approved: false } : p)));
      setConfirmAction(null);
    } catch (e: any) {
      toast.error('Erreur: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmAction) return;
    const profileId = confirmAction.profileId;
    setIsProcessing(true);
    try {
      await supabase.rpc('admin_delete_user', { target_user_id: profileId });
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) throw error;
      toast.success('Compte supprimé');
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      setConfirmAction(null);
    } catch (e: any) {
      toast.error('Erreur suppression: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <PageLayout title="ADMINISTRATION" showBackButton={true}>
        <div className="p-12 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest text-base">
          Chargement des utilisateurs...
        </div>
      </PageLayout>
    );
  }

  const toolbar = (
    <button
      onClick={() => {
        setActionType('create_user');
        setNewUserForm({ full_name: '', email: '', role: 'client' });
        setPasswordInput('');
      }}
      className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
    >
      <Plus size={18} strokeWidth={3} /> Nouveau Profil
    </button>
  );

  return (
    <PageLayout
      title="ADMINISTRATION"
      subtitle="Gestion des utilisateurs & rôles"
      showBackButton={true}
      toolbar={toolbar}
    >
      <main className="main-container !pt-4 space-y-6">
        {/* Banner Alert if pending accounts exist */}
        {counts.pending > 0 && activeFilter !== 'pending' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {counts.pending} compte{counts.pending > 1 ? 's' : ''} en attente d'approbation et d'attribution
              </p>
            </div>
            <button
              onClick={() => setActiveFilter('pending')}
              className="min-h-[44px] px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-600 active:scale-95 transition-all"
            >
              Voir les demandes
            </button>
          </div>
        )}

        {/* Search & Dynamic Role Filter Pills */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              className="w-full h-12 pl-11 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-base text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Role Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
            <button
              onClick={() => setActiveFilter('all')}
              className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 border ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50'
              }`}
            >
              <Users size={16} />
              Tous <span className="opacity-75">({counts.total})</span>
            </button>

            <button
              onClick={() => setActiveFilter('pending')}
              className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 border ${
                activeFilter === 'pending'
                  ? 'bg-amber-500 text-white border-transparent shadow-md shadow-amber-500/20'
                  : counts.pending > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              <Clock size={16} />
              En attente <span className="opacity-80">({counts.pending})</span>
            </button>

            <button
              onClick={() => setActiveFilter('technician')}
              className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 border ${
                activeFilter === 'technician'
                  ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50'
              }`}
            >
              <Wrench size={16} />
              Techniciens <span className="opacity-75">({counts.technician})</span>
            </button>

            <button
              onClick={() => setActiveFilter('client')}
              className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 border ${
                activeFilter === 'client'
                  ? 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50'
              }`}
            >
              <UserCheck size={16} />
              Clients <span className="opacity-75">({counts.client})</span>
            </button>

            <button
              onClick={() => setActiveFilter('admin')}
              className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 border ${
                activeFilter === 'admin'
                  ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck size={16} />
              Admins <span className="opacity-75">({counts.admin})</span>
            </button>
          </div>
        </div>

        {/* User Cards List */}
        <div className="grid gap-4">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map((p) => (
              <AdminUserCard
                key={p.id}
                profile={p}
                technicians={technicians}
                clients={clients}
                onLinkTechnician={(prof) => {
                  setSelectedProfile(prof);
                  setActionType('link_technician');
                }}
                onLinkClient={(prof) => {
                  setSelectedProfile(prof);
                  setActionType('link_client');
                }}
                onMakeAdmin={(prof) => {
                  setSelectedProfile(prof);
                  handleUpdateProfile('admin');
                }}
                onEditProfile={(prof) => {
                  setSelectedProfile(prof);
                  setActionType('edit_profile');
                  setSelectedLinkId(prof.technician_id || prof.client_id || '');
                }}
                onResetPassword={(prof) => {
                  setSelectedProfile(prof);
                  setActionType('reset_password');
                  setPasswordInput('');
                }}
                onReject={(prof) => setConfirmAction({ type: 'delete', profileId: prof.id })}
                onRevoke={(prof) => setConfirmAction({ type: 'revoke', profileId: prof.id })}
              />
            ))
          ) : (
            <div className="py-16 text-center bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <Users size={32} className="mx-auto mb-3 text-slate-400 opacity-60" />
              <p className="text-base font-bold text-slate-500">
                Aucun utilisateur trouvé {searchQuery ? `pour "${searchQuery}"` : 'dans cette catégorie'}
              </p>
            </div>
          )}
        </div>

        {/* Administration Bottom Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Compteur de Devis</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuration & Statistiques</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Total des Devis émis</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-primary">{devisCount}</span>
                <span className="text-xs font-bold text-slate-500 uppercase">Documents</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/chantiers')}
              className="w-full mt-4 min-h-[44px] py-3.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
            >
              <Settings size={16} /> Gérer la base chantiers
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Catalogue Quick-Add</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prestations & Matériels</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/settings/services')}
                className="group min-h-[44px] flex flex-col items-center gap-3 p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 rounded-3xl hover:bg-blue-100 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-blue-900/50 flex items-center justify-center text-blue-600 shadow-sm">
                  <Wrench size={18} />
                </div>
                <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">Ajouter Service</span>
              </button>

              <button
                onClick={() => navigate('/settings/services')}
                className="group min-h-[44px] flex flex-col items-center gap-3 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 rounded-3xl hover:bg-emerald-100 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 shadow-sm">
                  <Package size={18} />
                </div>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Ajouter Produit</span>
              </button>
            </div>
            <p className="mt-6 text-xs text-center font-bold text-slate-400 uppercase tracking-wider italic">
              L'ajout direct ouvrira le gestionnaire de catalogue
            </p>
          </div>
        </div>
      </main>

      {/* Portaled Modals */}
      <AdminUserModals
        actionType={actionType}
        selectedProfile={selectedProfile}
        selectedLinkId={selectedLinkId}
        setSelectedLinkId={setSelectedLinkId}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        technicians={technicians}
        clients={clients}
        isProcessing={isProcessing}
        onClose={() => {
          setSelectedProfile(null);
          setActionType(null);
          setSelectedLinkId('');
          setPasswordInput('');
        }}
        onUpdateProfile={handleUpdateProfile}
        onResetPassword={handleResetPassword}
        onCreateUser={handleCreateUser}
        setSelectedProfile={setSelectedProfile}
      />

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
