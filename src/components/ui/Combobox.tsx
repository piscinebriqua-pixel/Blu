import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ComboboxProps {
    label?: string;
    icon?: LucideIcon;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    containerClassName?: string;
}

const Combobox: React.FC<ComboboxProps> = ({
    label,
    icon: Icon,
    options,
    value,
    onChange,
    placeholder = "Rechercher...",
    containerClassName = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialiser le terme de recherche avec la valeur actuelle si elle existe
    useEffect(() => {
        if (value && !searchTerm) {
            setSearchTerm(value);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Si on ferme sans sélectionner, on remet le terme de recherche à la valeur actuelle
                setSearchTerm(value);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value]);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option: string) => {
        onChange(option);
        setSearchTerm(option);
        setIsOpen(false);
    };

    return (
        <div className={`flex flex-col gap-2 relative ${containerClassName}`} ref={containerRef}>
            {label && (
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                    {Icon && <Icon size={12} className="text-slate-400" />}
                    {label}
                </label>
            )}

            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none z-10">
                        <Icon size={20} />
                    </div>
                )}

                <input
                    type="text"
                    className={`
                        w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl 
                        ${Icon ? 'pl-12' : 'pl-4'} pr-12
                        font-semibold text-slate-800 dark:text-white placeholder:text-slate-400
                        focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 
                        transition-all
                    `}
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />

                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                    <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[240px] overflow-y-auto p-2 space-y-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`
                                            w-full flex items-center justify-between px-4 py-3 rounded-xl text-left font-semibold transition-all
                                            ${value === option
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}
                                        `}
                                    >
                                        {option}
                                        {value === option && <Check size={16} />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-slate-500 italic">
                                    Aucun résultat trouvé
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Combobox;
