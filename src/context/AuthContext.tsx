import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { handleAppError } from '../lib/errorHandler';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'technicien' | 'client' | 'pending' | string;
  is_approved: boolean;
  technician_id?: string | null;
  client_id?: string | null;
  created_at?: string;
}

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
  const isFetchingRef = useRef<string | null>(null);

  // Safety Timeout: Prevent any infinite loading freeze under all circumstances
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn('[AuthContext] Timeout de sécurité atteint : déblocage forcé du chargement.');
          return false;
        }
        return false;
      });
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const fetchProfileWithRetry = async (userId: string) => {
    if (isFetchingRef.current === userId) return;
    isFetchingRef.current = userId;

    let attempts = 2;
    const delay = 600;

    while (attempts > 0) {
      try {
        const queryPromise = supabase
          .from('profiles' as any)
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        // Timeout généreux de 8s adapté aux connexions mobiles / cold-start Supabase
        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout réseau profil')), 8000)
        );

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

        if (error) throw error;

        if (data) {
          setUserProfile(data as UserProfile);
          setCachedProfile(data as UserProfile);
          setProfileNotFound(false);
          setLoading(false);
          isFetchingRef.current = null;
          return;
        }

        // Si le serveur a répondu explicitement data === null (profil inexistant dans la base)
        if (data === null) {
          console.warn('[AuthContext] Aucun profil trouvé en base pour userId:', userId);
          setProfileNotFound(true);
          setUserProfile(null);
          setCachedProfile(null);
          setLoading(false);
          isFetchingRef.current = null;
          return;
        }
      } catch (err: any) {
        console.warn(`[AuthContext] Chargement profil tentative (${3 - attempts}/2):`, err.message);
      }

      attempts--;
      if (attempts > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    isFetchingRef.current = null;
    const cached = getCachedProfile(userId);
    if (cached) {
      setUserProfile(cached);
      setLoading(false);
    } else {
      // Si aucun profil en cache et que les requêtes ont échoué
      setLoading(false);
      setProfileNotFound(true);
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      isFetchingRef.current = null;
      await fetchProfileWithRetry(session.user.id);
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }; error: null }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: null }), 3000)
        );

        const { data, error } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

        if (error) {
          if (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token')) {
            console.warn('[AuthContext] Session expirée ou invalide. Purge...');
            await signOut();
            return;
          }
          throw error;
        }

        const initialSession = data?.session ?? null;
        setSession(initialSession);

        if (initialSession?.user) {
          const cached = getCachedProfile(initialSession.user.id);
          if (cached) {
            setUserProfile(cached);
            setLoading(false);
          }
          await fetchProfileWithRetry(initialSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Erreur initialisation auth:', err);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);

      if (currentSession?.user) {
        const cached = getCachedProfile(currentSession.user.id);
        if (cached) {
          setUserProfile(cached);
          setLoading(false);
        }
        if (isFetchingRef.current !== currentSession.user.id) {
          await fetchProfileWithRetry(currentSession.user.id);
        }
      } else {
        setUserProfile(null);
        setCachedProfile(null);
        setProfileNotFound(false);
        isFetchingRef.current = null;
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
