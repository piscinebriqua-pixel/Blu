import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
        setIsDark(!isDark);
    };

    return (
        <button
            onClick={toggleTheme}
            title="Changer le mode"
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md"
        >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
};

export default ThemeToggle;
