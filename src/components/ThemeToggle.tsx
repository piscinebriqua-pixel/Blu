import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(
        (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
    );

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <button
            onClick={toggleTheme}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-orange-400 hover:bg-orange-500 hover:text-white transition-all duration-500 cursor-pointer shadow-lg backdrop-blur-md group"
            title={`Passer en mode ${theme === 'light' ? 'sombre' : 'clair'}`}
        >
            <div className="group-hover:rotate-180 transition-transform duration-700">
                {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </div>
        </button>
    );
};

export default ThemeToggle;
