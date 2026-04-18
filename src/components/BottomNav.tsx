import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, Waves, Briefcase, LogOut, Image as ImageIcon } from 'lucide-react';
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

            <button onClick={() => supabase.auth.signOut()} className="nav-item-premium text-[#F472B6]">
                <LogOut size={22} />
                <span>Sortir</span>
            </button>
        </nav>
    );
};

export default BottomNav;
