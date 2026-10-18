import React from 'react';
import ReactDOM from 'react-dom';
import { Key, UserPlus } from 'lucide-react';
import type { Profile, Technician, Client, AdminActionType } from './types';

interface AdminUserModalsProps {
  actionType: AdminActionType;
  selectedProfile: Profile | null;
  selectedLinkId: string;
  setSelectedLinkId: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  newUserForm: { full_name: string; email: string; role: string };
  setNewUserForm: React.Dispatch<React.SetStateAction<{ full_name: string; email: string; role: string }>>;
  technicians: Technician[];
  clients: Client[];
  isProcessing: boolean;
  onClose: () => void;
  onUpdateProfile: (role: string, linkId?: string) => Promise<void>;
  onResetPassword: () => Promise<void>;
  onCreateUser: () => Promise<void>;
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

export const AdminUserModals: React.FC<AdminUserModalsProps> = ({
  actionType,
  selectedProfile,
  selectedLinkId,
  setSelectedLinkId,
  passwordInput,
  setPasswordInput,
  newUserForm,
  setNewUserForm,
  technicians,
  clients,
  isProcessing,
  onClose,
  onUpdateProfile,
  onResetPassword,
  onCreateUser,
  setSelectedProfile,
}) => {
  if (typeof document === 'undefined') return null;

  // 1. MODAL LIER / MODIFIER PROFIL
  if (
    selectedProfile &&
    (actionType === 'link_technician' || actionType === 'link_client' || actionType === 'edit_profile')
  ) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">
            {actionType === 'edit_profile' ? 'Modifier le compte' : 'Lier un compte'}
          </h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">
            Profil : {selectedProfile.full_name}
          </p>

          <div className="space-y-6">
            {actionType === 'edit_profile' && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Rôle de l'utilisateur
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'technician', 'client'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setSelectedProfile({ ...selectedProfile, role: r });
                        setSelectedLinkId('');
                      }}
                      className={`py-3.5 rounded-xl text-xs font-black uppercase border-2 transition-all min-h-[44px] ${
                        selectedProfile.role === r
                          ? 'border-primary bg-blue-50 dark:bg-blue-900/30 text-primary'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {r === 'admin' ? 'Admin' : r === 'technician' ? 'Technicien' : 'Client'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(actionType === 'link_technician' ||
              (actionType === 'edit_profile' && selectedProfile.role === 'technician')) && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Sélectionner la fiche Technicien
                </label>
                <select
                  title="Choisir le technicien"
                  className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                >
                  <option value="">Choisir un technicien...</option>
                  <option value="CREATE_NEW">➕ Créer une NOUVELLE FICHE avec ce nom</option>
                  <optgroup label="Lier à une fiche existante">
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {(actionType === 'link_client' ||
              (actionType === 'edit_profile' && selectedProfile.role === 'client')) && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Sélectionner la fiche Client
                </label>
                <select
                  title="Choisir le client"
                  className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                >
                  <option value="">Choisir un client...</option>
                  <option value="CREATE_NEW">➕ Créer une NOUVELLE FICHE avec ce nom</option>
                  <optgroup label="Lier à un client existant">
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-2xl font-black uppercase text-xs tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (actionType === 'edit_profile') onUpdateProfile(selectedProfile.role, selectedLinkId);
                else if (actionType === 'link_technician') onUpdateProfile('technician', selectedLinkId);
                else if (actionType === 'link_client') onUpdateProfile('client', selectedLinkId);
              }}
              disabled={
                isProcessing ||
                ((selectedProfile.role === 'technician' || selectedProfile.role === 'client') && !selectedLinkId)
              }
              className="flex-1 min-h-[48px] bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all"
            >
              Valider
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 2. MODAL RÉINITIALISATION DU MOT DE PASSE
  if (selectedProfile && actionType === 'reset_password') {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight flex items-center gap-3">
            <Key className="text-amber-500" /> Mot de passe
          </h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">
            Profil : {selectedProfile.full_name}
          </p>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
              Nouveau mot de passe
            </label>
            <input
              type="text"
              className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Saisir min 6 caractères..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Un appel sécurisé sera effectué pour réassigner le mot de passe utilisateur.
            </p>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-2xl font-black uppercase text-xs tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onResetPassword}
              disabled={isProcessing || passwordInput.length < 6}
              className="flex-1 min-h-[48px] bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 3. MODAL CRÉATION NOUVEAU PROFIL
  if (actionType === 'create_user') {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight flex items-center gap-3">
            <UserPlus className="text-primary" /> Nouveau Profil
          </h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">
            Création d'accès sécurisé
          </p>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nom complet *</label>
              <input
                type="text"
                required
                className="mt-1 w-full h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                Email <span className="opacity-70">(Laisser vide si pas d'email)</span>
              </label>
              <input
                type="email"
                className="mt-1 w-full h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: test@blu.com"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Rôle initial</label>
              <select
                className="mt-1 w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              >
                <option value="client">Client</option>
                <option value="technician">Technicien</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                Mot de passe provisoire *
              </label>
              <input
                type="text"
                required
                minLength={6}
                className="mt-1 w-full h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-2xl font-black uppercase text-xs tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onCreateUser}
              disabled={isProcessing || !newUserForm.full_name || passwordInput.length < 6}
              className="flex-1 min-h-[48px] bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all"
            >
              Créer
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return null;
};
