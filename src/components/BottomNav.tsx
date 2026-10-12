import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, Briefcase, LogOut, Image as ImageIcon, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

const BottomNav: React.FC = () => {
    const { signOut } = useAuth();
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

    return (
        <>
            <nav className="bottom-nav-premium">
                <NavLink to="/" className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}>
                    {({ isActive }) => (
                        <>
                            <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span>Accueil</span>
                        </>
                    )}
                </NavLink>

                <NavLink to="/clients" className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}>
                    {({ isActive }) => (
                        <>
                            <Users size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span>Clients</span>
                        </>
                    )}
                </NavLink>

                <NavLink to="/factures" className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}>
                    {({ isActive }) => (
                        <>
                            <Receipt size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span>Factures</span>
                        </>
                    )}
                </NavLink>

                <NavLink to="/planning" className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}>
                    {({ isActive }) => (
                        <>
                            <Calendar size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span>Planning</span>
                        </>
                    )}
                </NavLink>

                <NavLink to="/catalogue" className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}>
                    {({ isActive }) => (
                        <>
                            <ImageIcon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span>Catalogue</span>
                        </>
                    )}
                </NavLink>

                <NavLink to="/partners" className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}>
                    {({ isActive }) => (
                        <>
                            <Briefcase size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span>Réseau</span>
                        </>
                    )}
                </NavLink>

                <button
                    onClick={() => setIsSignOutModalOpen(true)}
                    className="nav-item-premium text-rose-500 hover:text-rose-600 transition-colors"
                    title="Déconnexion"
                >
                    <LogOut size={22} />
                    <span>Sortir</span>
                </button>
            </nav>

            <ConfirmModal
                isOpen={isSignOutModalOpen}
                title="Déconnexion"
                message="Êtes-vous sûr de vouloir vous déconnecter de votre compte ?"
                confirmLabel="SE DÉCONNECTER"
                variant="danger"
                showIrreversibleWarning={false}
                onConfirm={() => {
                    setIsSignOutModalOpen(false);
                    signOut();
                }}
                onClose={() => setIsSignOutModalOpen(false)}
            />
        </>
    );
};

export default BottomNav;
