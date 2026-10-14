import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { ProfileRow } from '../lib/supabase';
import { handleAppError } from '../lib/errorHandler';

export type UserProfile = ProfileRow;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileNotFound: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEY = 'blu_cached_profile';

const getCachedProfile = (userId?: string): UserProfile | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (userId && parsed?.id !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
};

const setCachedProfile = (profile: UserProfile | null) => {
  try {
    if (profile) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getCachedProfile());
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [loading, setLoading] = useState(!getCachedProfile());

  // 1. Initialisation de la Session & Écouteur d'authentification
  useEffect(() => {
    let isMounted = true;

    // Récupération de la session initiale sans timeout arbitraire agressif
    supabase.auth.getSession().then(({ data: { session: initSession }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('[AuthContext] Session invalide ou expirée:', error);
        if (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token')) {
          signOut();
          return;
        }
      }
      setSession(initSession);
      if (!initSession) {
        setLoading(false);
      }
    }).catch((err) => {
      if (!isMounted) return;
      console.error('[AuthContext] Erreur getSession:', err);
      setLoading(false);
    });

    // Écouteur Auth : STRICTEMENT SYNCHRONE
    // IMPORTANT: Ne JAMAIS faire d'appels PostgREST (supabase.from) awaités dans ce callback !
    // Cela provoque un deadlock fatal avec le verrou interne du client Supabase (auth token lock).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      if (!currentSession) {
        setUserProfile(null);
        setCachedProfile(null);
        setProfileNotFound(false);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Chargement du profil découplé du listener auth (évite tout deadlock)
  useEffect(() => {
    const user = session?.user;
    if (!user) {
      setUserProfile(null);
      setProfileNotFound(false);
      return;
    }

    let isMounted = true;
    const userId = user.id;
    const userEmail = user.email || '';

    // Utilisation immédiate du cache s'il correspond à l'utilisateur
    const cached = getCachedProfile(userId);
    if (cached) {
      setUserProfile(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchProfile = async () => {
      let attempts = 3;
      const delay = 600;

      while (attempts > 0 && isMounted) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);

          // 1. Recherche directe par ID utilisateur
          let { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .abortSignal(controller.signal)
            .maybeSingle();

          clearTimeout(timer);

          if (error) throw error;

          // 2. Fallback de résilience : si non trouvé par ID mais email présent
          // (ex: compte créé par admin/mdp, puis connecté via Google OAuth avec ID différent)
          if (!data && userEmail) {
            const { data: byEmail, error: emailErr } = await supabase
              .from('profiles')
              .select('*')
              .ilike('email', userEmail)
              .maybeSingle();

            if (!emailErr && byEmail) {
              console.info('[AuthContext] Profil retrouvé par correspondance email:', userEmail);
              data = byEmail;
              // Synchroniser l'ID en base en tâche de fond pour les prochaines requêtes
              supabase
                .from('profiles')
                .update({ id: userId })
                .eq('id', byEmail.id)
                .then(() => {}, () => {});
            }
          }

          if (data && isMounted) {
            const profile = data as UserProfile;
            setUserProfile(profile);
            setCachedProfile(profile);
            setProfileNotFound(false);
            setLoading(false);
            return;
          }

          if (attempts > 1) {
            console.info(`[AuthContext] Profil en cours de synchronisation (${4 - attempts}/3)...`);
          }
        } catch (err: any) {
          console.warn(`[AuthContext] Tentative chargement profil (${4 - attempts}/3):`, err.message || err);
        }

        attempts--;
        if (attempts > 0 && isMounted) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      if (!isMounted) return;

      const fallback = getCachedProfile(userId);
      if (fallback) {
        setUserProfile(fallback);
        setProfileNotFound(false);
      } else {
        console.warn('[AuthContext] Aucun profil trouvé en base après 3 tentatives pour userId:', userId);
        setProfileNotFound(true);
        setUserProfile(null);
        setCachedProfile(null);
      }
      setLoading(false);
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && data) {
        const profile = data as UserProfile;
        setUserProfile(profile);
        setCachedProfile(profile);
        setProfileNotFound(false);
      }
    } catch (err) {
      console.warn('[AuthContext] Erreur refreshProfile:', err);
    }
  };

  const signOut = async () => {
    try {
      setCachedProfile(null);
      setProfileNotFound(false);
      setUserProfile(null);
      setSession(null);
      setLoading(false);

      if (typeof window !== 'undefined') {
        try {
          const keysToRemove: string[] = [CACHE_KEY];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
          sessionStorage.clear();
        } catch (e) {
          console.warn('[AuthContext] Erreur nettoyage storage:', e);
        }
      }

      await Promise.race([
        supabase.auth.signOut(),
        new Promise((r) => setTimeout(r, 1000))
      ]).catch(() => {});
    } catch (err) {
      handleAppError(err, { fallbackMessage: 'Erreur lors de la déconnexion' });
      setSession(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  // Safety Timeout global : empêche tout blocage infini du loader principal (10s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn('[AuthContext] Timeout de sécurité atteint : déblocage forcé du loader.');
          return false;
        }
        return false;
      });
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        userProfile,
        loading,
        profileNotFound,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
