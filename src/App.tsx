import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import ClientsList from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import ServicesManager from './pages/ServicesManager';
import Interventions from './pages/Interventions';
import './index.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f141e]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-layout">
        <Routes>
          <Route
            path="/login"
            element={!session ? <Login /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={session ? (
              <div className="app-container">
                <Dashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )}
          />
          <Route
            path="/clients"
            element={session ? (
              <div className="app-container">
                <ClientsList />
              </div>
            ) : (
              <Navigate to="/login" />
            )}
          />
          <Route
            path="/technicians"
            element={session ? (
              <div className="app-container">
                <Technicians />
              </div>
            ) : (
              <Navigate to="/login" />
            )}
          />
          <Route
            path="/settings/services"
            element={session ? (
              <div className="app-container">
                <ServicesManager />
              </div>
            ) : (
              <Navigate to="/login" />
            )}
          />
          <Route
            path="/client/:id"
            element={session ? (
              <div className="app-container">
                <ClientDetail />
              </div>
            ) : (
              <Navigate to="/login" />
            )}
          />
          <Route
            path="/interventions"
            element={session ? (
              <div className="app-container">
                <Interventions />
              </div>
            ) : (
              <Navigate to="/login" />
            )}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
