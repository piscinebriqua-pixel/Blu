import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import ClientsList from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import ServicesManager from './pages/ServicesManager';
import Interventions from './pages/Interventions';
import PendingApproval from './pages/PendingApproval';
import AdminUsers from './pages/AdminUsers';
import TechnicianPortal from './pages/TechnicianPortal';
import './index.css';

const ClientRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/client/${id}`} replace />;
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        fetchProfileWithRetry(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfileWithRetry(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // The original fetchProfile function is replaced by the new retry logic.
  // The user provided two versions, the second one (fetchProfileWithRetry) is explicitly
  // marked as "Revised fetchProfile to handle async retries better" and uses a while loop,
  // which is generally preferred over recursion for retries in JS to avoid stack depth issues.
  // The instruction also mentions increasing timeout to 15s, which is incorporated below.

  // Revised fetchProfile to handle async retries better
  const fetchProfileWithRetry = async (userId: string) => {
    let attempts = 3;
    while (attempts > 0) {
      try {
        // Timeout promise (15s to be safe)
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000));

        // Fetch promise
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        const { data, error } = await Promise.race([fetchPromise, timeout]) as any;

        if (error) throw error;
        if (data) {
          setUserProfile(data);
          setLoading(false); // Success, stop loading
          return; // Success
        }
      } catch (e) {
        console.error(`Profile fetch error (attempts left: ${attempts - 1})`, e);
        attempts--;
        if (attempts > 0) {
          await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds before retrying
        }
      }
    }
    setLoading(false); // Done trying, stop loading (failed)
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#0f141e] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <button
          onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}
          className="text-slate-500 text-xs hover:text-white underline"
        >
          Chargement long ? Se déconnecter
        </button>
      </div>
    );
  }

  // Protection & Role Logic
  const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
    if (!session) return <Navigate to="/login" />;

    // If profile is still missing after loading (e.g. trigger failed), we might allow them in or block?
    // Let's block to be safe and ask to contact admin.
    if (!userProfile) {
      return <ProfileNotFound />;
    }

    if (!userProfile.is_approved || userProfile.role === 'pending') {
      return <Navigate to="/pending" />;
    }

    if (requireAdmin && userProfile.role !== 'admin') {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <Router>
      <div className="app-layout">
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

          <Route path="/pending" element={
            session ? (
              userProfile?.is_approved ? <Navigate to="/" /> : <PendingApproval />
            ) : <Navigate to="/login" />
          } />

          {/* Admin Routes */}
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin={true}>
              <div className="app-container">
                <AdminUsers />
              </div>
            </ProtectedRoute>
          } />

          {/* Main Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <div className="app-container"><Dashboard /></div>
            </ProtectedRoute>
          } />

          <Route path="/clients" element={
            <ProtectedRoute>
              <div className="app-container"><ClientsList /></div>
            </ProtectedRoute>
          } />

          <Route path="/clients/:id" element={<ClientRedirect />} />

          <Route path="/client/:id" element={
            <ProtectedRoute>
              <div className="app-container"><ClientDetail /></div>
            </ProtectedRoute>
          } />

          <Route path="/technicians" element={
            <ProtectedRoute>
              <div className="app-container"><Technicians /></div>
            </ProtectedRoute>
          } />

          <Route path="/settings/services" element={
            <ProtectedRoute>
              <div className="app-container"><ServicesManager /></div>
            </ProtectedRoute>
          } />

          <Route path="/interventions" element={
            <ProtectedRoute>
              <div className="app-container"><Interventions /></div>
            </ProtectedRoute>
          } />
          <Route path="/technician-portal" element={
            <ProtectedRoute>
              <div className="app-container"><TechnicianPortal /></div>
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

const ProfileNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" /></svg>
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Profil introuvable</h2>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-8">
        Votre compte est bien authentifié mais votre profil de base n'a pas pu être chargé. Veuillez contacter un administrateur.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-xs tracking-widest uppercase"
        >
          Réessayer
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full py-4 bg-white text-slate-400 rounded-2xl font-black border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 text-xs tracking-widest uppercase"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default App;
