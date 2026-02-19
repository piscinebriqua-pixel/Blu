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
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Timeout promise
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));

      // Fetch promise
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeout]) as any;

      if (error) throw error;
      if (data) setUserProfile(data);

    } catch (e) {
      console.error("Error fetching profile", e);
      // If error, force logout if it's a 500 or timeout to avoid loop? 
      // Or just let them in as "Guest"? No, ProtectedRoute will block.
    } finally {
      setLoading(false);
    }
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
      // Retry fetch or show error?
      return (
        <div className="flex flex-col items-center justify-center h-screen text-slate-500">
          <p>Profil utilisateur introuvable.</p>
          <button onClick={() => supabase.auth.signOut()} className="text-primary font-bold mt-4">Se déconnecter</button>
        </div>
      );
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

        </Routes>
      </div>
    </Router>
  );
}

export default App;
