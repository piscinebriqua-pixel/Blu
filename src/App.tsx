import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import React, { Suspense, Component } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import BccpLogo from './components/BccpLogo';
import BottomNav from './components/BottomNav';
import PageLoadingSkeleton from './components/PageLoadingSkeleton';
import UpdateNotificationBanner from './components/UpdateNotificationBanner';
import './index.css';

// Lazy-loaded Pages (Code Splitting for fast mobile startup)
const Login = React.lazy(() => import('./pages/Login'));
const ClientsList = React.lazy(() => import('./pages/Clients'));
const ClientDetail = React.lazy(() => import('./pages/ClientDetail'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Technicians = React.lazy(() => import('./pages/Technicians'));
const TechnicianDetail = React.lazy(() => import('./pages/TechnicianDetail'));
const ServicesManager = React.lazy(() => import('./pages/ServicesManager'));
const Interventions = React.lazy(() => import('./pages/Interventions'));
const PendingApproval = React.lazy(() => import('./pages/PendingApproval'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const InterventionTemplates = React.lazy(() => import('./pages/InterventionTemplates'));
const TechnicianPortal = React.lazy(() => import('./pages/TechnicianPortal'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Planning = React.lazy(() => import('./pages/Planning'));
const Revenue = React.lazy(() => import('./pages/Revenue'));
const Chantiers = React.lazy(() => import('./pages/Chantiers'));
const ClientLogin = React.lazy(() => import('./pages/ClientLogin'));
const ClientDashboard = React.lazy(() => import('./pages/ClientDashboard'));
const AdminFinance = React.lazy(() => import('./pages/AdminFinance'));
const Settings = React.lazy(() => import('./pages/Settings'));
const FinanceSettings = React.lazy(() => import('./pages/FinanceSettings'));
const CompanySettings = React.lazy(() => import('./pages/CompanySettings'));
const DevisTemplates = React.lazy(() => import('./pages/DevisTemplates'));
const VehiclesSettings = React.lazy(() => import('./pages/VehiclesSettings'));
const Partners = React.lazy(() => import('./pages/Partners'));
const PartnerDetail = React.lazy(() => import('./pages/PartnerDetail'));
const PoolCatalogue = React.lazy(() => import('./pages/PoolCatalogue'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const Devis = React.lazy(() => import('./pages/Devis'));

const ClientRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/client/${id}`} replace />;
};

// Protected Route Component based on AuthContext
const ProtectedRoute = ({
  children,
  requireAdmin = false
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) => {
  const { session, userProfile, profileNotFound, loading } = useAuth();

  if (loading && !userProfile) {
    return <PageLoadingSkeleton />;
  }

  if (!session) return <Navigate to="/login" replace />;

  if (profileNotFound || !userProfile) {
    return <ProfileNotFound />;
  }

  if (!userProfile.is_approved || userProfile.role === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  if (requireAdmin && userProfile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Profile Not Found Screen with safe SignOut
const ProfileNotFound = () => {
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 p-6 text-center">
      <div className="w-20 h-20 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100 dark:border-red-900/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="17" y1="8" x2="22" y2="13" />
          <line x1="22" y1="8" x2="17" y2="13" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Profil introuvable</h2>
      <p className="text-slate-500 dark:text-slate-400 text-base max-w-xs leading-relaxed mb-8">
        Votre compte est authentifié mais votre profil de base n'a pas pu être chargé. Veuillez contacter un administrateur.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 text-xs tracking-widest uppercase"
        >
          Réessayer
        </button>
        <button
          onClick={() => signOut()}
          className="w-full py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95 text-xs tracking-widest uppercase"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

// Bottom Navigation Visibility Logic
const NavVisibilityWrapper = () => {
  const location = useLocation();
  const isClientPortal = location.pathname.startsWith('/mon-espace');
  if (isClientPortal) return null;
  return <BottomNav />;
};

function AppContent() {
  const { session, userProfile, loading, signOut } = useAuth();

  if (loading && !userProfile) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#0f141e] gap-6 px-10">
        <BccpLogo width={90} fillColor="white" className="animate-pulse mb-4" />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <button
          onClick={async () => {
            try {
              localStorage.clear();
              sessionStorage.clear();
            } catch (e) {}
            await signOut();
            window.location.href = '/login';
          }}
          className="text-slate-400 text-sm hover:text-white underline mt-2"
        >
          Chargement long ? Réinitialiser et se déconnecter
        </button>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-layout">
        <Suspense fallback={<PageLoadingSkeleton />}>
          <Routes>
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />

            <Route path="/pending" element={
              session ? (
                userProfile?.is_approved ? <Navigate to="/" replace /> : <PendingApproval />
              ) : <Navigate to="/login" replace />
            } />

            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin={true}>
                <div className="app-container"><AdminUsers /></div>
              </ProtectedRoute>
            } />

            {/* Main Operational Routes */}
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

            <Route path="/technician/:id" element={
              <ProtectedRoute>
                <div className="app-container"><TechnicianDetail /></div>
              </ProtectedRoute>
            } />

            <Route path="/settings/services" element={
              <ProtectedRoute>
                <div className="app-container"><ServicesManager /></div>
              </ProtectedRoute>
            } />

            <Route path="/settings/templates" element={
              <ProtectedRoute>
                <div className="app-container"><InterventionTemplates /></div>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute requireAdmin={true}>
                <div className="app-container"><Settings /></div>
              </ProtectedRoute>
            } />

            <Route path="/settings/finance-types" element={
              <ProtectedRoute requireAdmin={true}>
                <div className="app-container"><FinanceSettings /></div>
              </ProtectedRoute>
            } />

            <Route path="/settings/company" element={
              <ProtectedRoute requireAdmin={true}>
                <div className="app-container"><CompanySettings /></div>
              </ProtectedRoute>
            } />

            <Route path="/settings/devis-templates" element={
              <ProtectedRoute requireAdmin={true}>
                <div className="app-container"><DevisTemplates /></div>
              </ProtectedRoute>
            } />

            <Route path="/settings/vehicles" element={
              <ProtectedRoute requireAdmin={true}>
                <div className="app-container"><VehiclesSettings /></div>
              </ProtectedRoute>
            } />

            <Route path="/partners" element={
              <ProtectedRoute>
                <div className="app-container"><Partners /></div>
              </ProtectedRoute>
            } />

            <Route path="/partners/:id" element={
              <ProtectedRoute>
                <div className="app-container"><PartnerDetail /></div>
              </ProtectedRoute>
            } />

            <Route path="/interventions" element={
              <ProtectedRoute>
                <div className="app-container"><Interventions /></div>
              </ProtectedRoute>
            } />

            <Route path="/payments" element={
              <ProtectedRoute>
                <div className="app-container"><Payments /></div>
              </ProtectedRoute>
            } />

            <Route path="/factures" element={
              <ProtectedRoute>
                <div className="app-container"><Invoices /></div>
              </ProtectedRoute>
            } />

            <Route path="/invoices" element={<Navigate to="/factures" replace />} />

            <Route path="/devis" element={
              <ProtectedRoute>
                <div className="app-container"><Devis /></div>
              </ProtectedRoute>
            } />

            <Route path="/revenue" element={
              <ProtectedRoute requireAdmin={true}>
                <div className="app-container"><Revenue /></div>
              </ProtectedRoute>
            } />

            <Route path="/admin-finance" element={
              <ProtectedRoute requireAdmin={true}>
                <div className="app-container"><AdminFinance /></div>
              </ProtectedRoute>
            } />

            <Route path="/technician-portal" element={
              <ProtectedRoute>
                <div className="app-container"><TechnicianPortal /></div>
              </ProtectedRoute>
            } />

            <Route path="/planning" element={
              <ProtectedRoute>
                <div className="app-container"><Planning /></div>
              </ProtectedRoute>
            } />

            <Route path="/chantiers" element={
              <ProtectedRoute>
                <div className="app-container"><Chantiers /></div>
              </ProtectedRoute>
            } />

            <Route path="/catalogue" element={
              <ProtectedRoute>
                <div className="app-container"><PoolCatalogue /></div>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="app-container"><Profile /></div>
              </ProtectedRoute>
            } />

            <Route path="/mon-espace/login" element={<ClientLogin />} />
            <Route path="/mon-espace" element={<ClientDashboard />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <NavVisibilityWrapper />
        <UpdateNotificationBanner />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            padding: '16px 24px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.1)',
            }
          },
        }}
      />
    </Router>
  );
}

// Global Error Boundary - Prevents white screen crashes
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Erreur inconnue' };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('🚨 ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 p-6 text-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100 dark:border-red-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Une erreur est survenue</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed mb-2">{this.state.errorMessage}</p>
          <p className="text-slate-400 text-xs max-w-xs leading-relaxed mb-8">L'application a rencontré un problème inattendu.</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => { this.setState({ hasError: false, errorMessage: '' }); window.location.href = '/'; }}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg hover:bg-primary-dark transition-all active:scale-95 text-xs tracking-widest uppercase"
            >
              Retourner à l'accueil
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95 text-xs tracking-widest uppercase"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export { ErrorBoundary };
