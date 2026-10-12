import { useState, useEffect, useCallback } from 'react';

export function useAppUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkForUpdate = useCallback(async () => {
    // Ne rien faire si l'environnement de build n'est pas défini
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
        // Si la version sur le serveur est différente de la version actuellement en mémoire
        if (data.version !== __APP_BUILD_TIME__) {
          setHasUpdate(true);
        }
      }
    } catch {
      // Ignorer silencieusement les erreurs réseau (ex: mode hors-ligne)
    }
  }, []);

  useEffect(() => {
    // 1. Première vérification 3 secondes après le montage
    const initialTimer = setTimeout(() => {
      checkForUpdate();
    }, 3000);

    // 2. Vérification périodique toutes les 3 minutes
    const intervalTimer = setInterval(() => {
      checkForUpdate();
    }, 180000);

    // 3. Vérification au retour au premier plan (ex: switch d'application sur smartphone)
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
  }, []);

  const dismissUpdate = useCallback(() => {
    setIsDismissed(true);
  }, []);

  return {
    hasUpdate: hasUpdate && !isDismissed,
    reloadApp,
    dismissUpdate,
    checkForUpdate,
  };
}
