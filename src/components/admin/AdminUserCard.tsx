import React from 'react';
import { 
  UserCheck, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Key, 
  UserCog, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import type { Profile, Technician, Client } from './types';

interface AdminUserCardProps {
  profile: Profile;
  technicians: Technician[];
  clients: Client[];
  onLinkTechnician: (p: Profile) => void;
  onLinkClient: (p: Profile) => void;
  onMakeAdmin: (p: Profile) => void;
  onEditProfile: (p: Profile) => void;
  onResetPassword: (p: Profile) => void;
  onReject: (p: Profile) => void;
  onRevoke: (p: Profile) => void;
}

export const AdminUserCard: React.FC<AdminUserCardProps> = ({
  profile: p,
  technicians,
  clients,
  onLinkTechnician,
  onLinkClient,
  onMakeAdmin,
  onEditProfile,
  onResetPassword,
  onReject,
  onRevoke,
}) => {
  const isPending = !p.is_approved;

  // Resolve linked entity
  const linkedTech = p.technician_id
    ? technicians.find((t) => t.id === p.technician_id)
    : null;

  const linkedClient = p.client_id
    ? clients.find((c) => c.id === p.client_id)
    : null;

  // Role style metadata
  const getRoleBadge = () => {
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800/40">
          <Clock size={14} strokeWidth={2.5} /> En Attente
        </span>
      );
    }

    switch (p.role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/40">
            <ShieldCheck size={14} strokeWidth={2.5} /> Administrateur
          </span>
        );
      case 'technician':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800/40">
            <Wrench size={14} strokeWidth={2.5} /> Technicien
          </span>
        );
      case 'client':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/40">
            <UserCheck size={14} strokeWidth={2.5} /> Client
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider">
            {p.role}
          </span>
        );
    }
  };

  const getRoleIcon = () => {
    if (isPending) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 border border-amber-200/60 dark:border-amber-800/40 shadow-sm shrink-0">
          <Clock size={24} strokeWidth={2.2} />
        </div>
      );
    }

    switch (p.role) {
      case 'admin':
        return (
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm shrink-0">
            <ShieldCheck size={24} strokeWidth={2.2} />
          </div>
        );
      case 'technician':
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 shadow-sm shrink-0">
            <Wrench size={22} strokeWidth={2.2} />
          </div>
        );
      case 'client':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm shrink-0">
            <UserCheck size={24} strokeWidth={2.2} />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
            <UserCheck size={22} strokeWidth={2.2} />
          </div>
        );
    }
  };

  return (
    <div className={`p-5 rounded-3xl border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      isPending
        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40'
        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 hover:shadow-md'
    }`}>
      {/* Identity & Link info */}
      <div className="flex items-start sm:items-center gap-4 min-w-0">
        {getRoleIcon()}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-base sm:text-lg truncate">
              {p.full_name || 'Sans Nom'}
            </h3>
            {getRoleBadge()}
          </div>

          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide truncate">
            {p.email}
          </p>

          {/* Linking metadata */}
          {!isPending && (
            <div className="pt-0.5">
              {p.role === 'technician' && (
                linkedTech ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                    Fiche terrain : {linkedTech.full_name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                    Fiche terrain non liée
                  </span>
                )
              )}

              {p.role === 'client' && (
                linkedClient ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    Compte client : {linkedClient.first_name} {linkedClient.last_name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                    Fiche client non liée
                  </span>
                )
              )}

              {p.role === 'admin' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
                  Accès complet Superviseur
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
        {isPending ? (
          <>
            <button
              onClick={() => onLinkTechnician(p)}
              className="min-h-[44px] px-3.5 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95 flex items-center gap-1.5"
            >
              <Wrench size={16} /> Lier Tech
            </button>
            <button
              onClick={() => onLinkClient(p)}
              className="min-h-[44px] px-3.5 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95 flex items-center gap-1.5"
            >
              <UserCheck size={16} /> Lier Client
            </button>
            <button
              onClick={() => onMakeAdmin(p)}
              className="min-h-[44px] px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 flex items-center gap-1.5"
            >
              <ShieldCheck size={16} /> Admin
            </button>
            <button
              onClick={() => onReject(p)}
              className="min-h-[44px] px-3.5 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 flex items-center gap-1.5"
              title="Refuser la demande"
            >
              <X size={16} strokeWidth={2.5} /> Refuser
            </button>
          </>
        ) : (
          <>
            <button
              title="Modifier le rôle et la liaison"
              onClick={() => onEditProfile(p)}
              className="min-h-[44px] min-w-[44px] p-2 text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all flex items-center justify-center active:scale-95"
            >
              <UserCog size={20} />
            </button>
            <button
              title="Réinitialiser le mot de passe"
              onClick={() => onResetPassword(p)}
              className="min-h-[44px] min-w-[44px] p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all flex items-center justify-center active:scale-95"
            >
              <Key size={20} />
            </button>
            <button
              title="Révoquer l'accès"
              onClick={() => onRevoke(p)}
              className="min-h-[44px] min-w-[44px] p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all flex items-center justify-center active:scale-95"
            >
              <X size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
