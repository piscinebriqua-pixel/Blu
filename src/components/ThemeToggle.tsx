import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            setIsDark(true);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        setIsDark(!isDark);
    };

    return (
        <div className="theme-toggle" onClick={toggleTheme} title="Changer le mode">
            <div className="theme-toggle-dot">
                {isDark ? <Moon size={12} /> : <Sun size={12} />}
            </div>
        </div>
    );
};

export default ThemeToggle;
