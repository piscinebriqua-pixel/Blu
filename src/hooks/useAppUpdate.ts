import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'blu_dismissed_update_version';

export function useAppUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  const checkForUpdate = useCallback(async () => {
    // 1. Désactiver en mode développement local pour ne pas polluer l'écran en continu
    if (import.meta.env.DEV) {
      setHasUpdate(false);
      return;
    }

    // 2. Ne rien faire si l'environnement de build n'est pas injecté
    if (typeof __APP_BUILD_TIME__ === 'undefined') return;

    try {
      // Requête avec cache-busting pour forcer une réponse fraîche du serveur
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data?.version && typeof data.version === 'string') {
        setLatestVersion(data.version);

        // Si la version sur le serveur est différente de la version actuellement en mémoire
        if (data.version !== __APP_BUILD_TIME__) {
          // Vérifier si cette version spécifique a déjà été acquittée ou ignorée par l'utilisateur
          const dismissedVersion = localStorage.getItem(STORAGE_KEY);
          if (dismissedVersion === data.version) {
            setHasUpdate(false);
            return;
          }
          setHasUpdate(true);
        } else {
          setHasUpdate(false);
        }
      }
    } catch {
      // Ignorer silencieusement les erreurs réseau (ex: mode hors-ligne)
    }
  }, []);

  useEffect(() => {
    // Ne pas démarrer de timers en environnement de développement
    if (import.meta.env.DEV) return;

    // 1. Première vérification 5 secondes après le chargement
    const initialTimer = setTimeout(() => {
      checkForUpdate();
    }, 5000);

    // 2. Vérification périodique toutes les 5 minutes
    const intervalTimer = setInterval(() => {
      checkForUpdate();
    }, 300000);

    // 3. Vérification au retour au premier plan
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    // 4. Vérification lors de la reconnexion au réseau
    const handleOnline = () => {
      checkForUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkForUpdate]);

  const reloadApp = useCallback(async () => {
    try {
      // Mémoriser la version acquittée pour ne pas réafficher le toast au rechargement
      if (latestVersion) {
        localStorage.setItem(STORAGE_KEY, latestVersion);
      }
      // Vider les caches de CacheStorage si l'API est disponible
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
    } catch (err) {
      console.warn('Erreur lors du nettoyage du cache:', err);
    }
    // Rechargement forcé de la page
    window.location.reload();
  }, [latestVersion]);

  const dismissUpdate = useCallback(() => {
    if (latestVersion) {
      localStorage.setItem(STORAGE_KEY, latestVersion);
    }
    setIsDismissed(true);
    setHasUpdate(false);
  }, [latestVersion]);

  return {
    hasUpdate: hasUpdate && !isDismissed,
    reloadApp,
    dismissUpdate,
    checkForUpdate,
  };
}

export default useAppUpdate;
