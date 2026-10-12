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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef<string | null>(null);

  // Safety Timeout: Prevent any infinite loading freeze under all circumstances
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn('[AuthContext] Timeout de sécurité (3.5s) atteint : déblocage forcé du chargement.');
          return false;
        }
        return false;
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const fetchProfileWithRetry = async (userId: string) => {
    if (isFetchingRef.current === userId) return;
    isFetchingRef.current = userId;

    let attempts = 2; // Maximum 2 tentatives rapides pour éviter de bloquer l'écran
    const delay = 800;

    while (attempts > 0) {
      try {
        const queryPromise = supabase
          .from('profiles' as any)
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        // 2.5s max par requête pour ne pas bloquer si Supabase lag
        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout requête profil')), 2500)
        );

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

        if (error) throw error;

        if (data) {
          setUserProfile(data as UserProfile);
          setLoading(false);
          isFetchingRef.current = null;
          return;
        }

        // Si absent à la 1re tentative, tentative de création de secours
        if (attempts === 2) {
          const { data: sessionData } = await supabase.auth.getSession();
          const currUser = sessionData?.session?.user;
          if (currUser) {
            try {
              await supabase.from('profiles' as any).insert({
                id: currUser.id,
                email: currUser.email,
                full_name: currUser.user_metadata?.full_name || currUser.email,
                role: 'pending',
                is_approved: false
              });
            } catch {
              // Ignore fallback insert failure
            }
          }
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
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      isFetchingRef.current = null;
      await fetchProfileWithRetry(session.user.id);
    }
  };

  const signOut = async () => {
    try {
      // 1. Purge synchrone immédiate des tokens dans localStorage pour éliminer tout verrou bloquant
      if (typeof window !== 'undefined') {
        try {
          const keysToRemove: string[] = [];
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

      // 2. Appel Supabase signOut avec timeout court
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((r) => setTimeout(r, 1000))
      ]).catch(() => {});

      setSession(null);
      setUserProfile(null);
      setLoading(false);
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
          setTimeout(() => resolve({ data: { session: null }, error: null }), 2000)
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
        if (isFetchingRef.current !== currentSession.user.id) {
          await fetchProfileWithRetry(currentSession.user.id);
        }
      } else {
        setUserProfile(null);
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
