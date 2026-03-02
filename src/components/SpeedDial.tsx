import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

export interface SpeedDialAction {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color?: string;
}

interface SpeedDialProps {
    actions: SpeedDialAction[];
    mainIcon?: React.ElementType;
}

const SpeedDial: React.FC<SpeedDialProps> = ({ actions, mainIcon: MainIcon = Plus }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3" ref={menuRef}>
            {/* Action Buttons */}
            <div className={`flex flex-col items-end gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-50 pointer-events-none'}`}>
                {actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {action.label}
                        </span>
                        <button
                            onClick={() => {
                                action.onClick();
                                setIsOpen(false);
                            }}
                            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${action.color || 'bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700'}`}
                            title={action.label}
                        >
                            <action.icon size={20} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-900 text-white rotate-45' : 'bg-primary text-white'}`}
            >
                {isOpen ? <X size={28} /> : <MainIcon size={28} />}
            </button>
        </div>
    );
};

export default SpeedDial;
