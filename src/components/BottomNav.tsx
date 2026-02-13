import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Scissors, Grid, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BottomNav: React.FC = () => {
    return (
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

            <NavLink to="/settings/services" className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}>
                {({ isActive }) => (
                    <>
                        <Scissors size={22} strokeWidth={isActive ? 2.5 : 2} />
                        <span>Services</span>
                    </>
                )}
            </NavLink>

            <NavLink to="/technicians" className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}>
                {({ isActive }) => (
                    <>
                        <Grid size={22} strokeWidth={isActive ? 2.5 : 2} />
                        <span>Équipe</span>
                    </>
                )}
            </NavLink>

            <button onClick={() => supabase.auth.signOut()} className="nav-item-premium" style={{ background: 'none', border: 'none', color: 'var(--pink)' }}>
                <LogOut size={22} />
                <span>Sortir</span>
            </button>
        </nav>
    );
};

export default BottomNav;
