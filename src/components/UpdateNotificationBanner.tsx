import React, { useState } from 'react';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export const UpdateNotificationBanner: React.FC = () => {
  const { hasUpdate, reloadApp, dismissUpdate } = useAppUpdate();
  const [reloading, setReloading] = useState(false);

  if (!hasUpdate) return null;

  const handleReload = () => {
    setReloading(true);
    reloadApp();
  };

  return (
    <aside
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 left-3 right-3 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-[120] animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-blue-500/40 rounded-3xl p-4 shadow-2xl shadow-blue-950/50 ring-1 ring-blue-500/30 text-white flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white leading-tight">
                Mise à jour disponible 🚀
              </h4>
              <p className="text-xs font-semibold text-slate-300 mt-1 leading-relaxed">
                Une nouvelle version de Blu a été déployée. Actualisez pour charger les dernières fonctions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissUpdate}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 active:scale-95 transition-all shrink-0"
            title="Ignorer pour l'instant"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={dismissUpdate}
            className="flex-1 min-h-[44px] px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-black uppercase tracking-wider text-slate-300 transition-all active:scale-95"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={handleReload}
            disabled={reloading}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          >
            <RefreshCw size={16} className={reloading ? 'animate-spin' : ''} />
            <span>{reloading ? 'Chargement...' : 'Actualiser'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default UpdateNotificationBanner;
