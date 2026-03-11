import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface ComboboxProps {
    label?: string;
    icon?: LucideIcon;
    options: Option[] | string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    containerClassName?: string;
    className?: string; // Additional classes for the input
}

const Combobox: React.FC<ComboboxProps> = ({
    label,
    icon: Icon,
    options,
    value,
    onChange,
    placeholder = "Sélectionner...",
    containerClassName = '',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const normalizedOptions: Option[] = options.map(opt => 
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    // Synchroniser searchTerm avec l'option sélectionnée lors du chargement ou du changement de valeur
    useEffect(() => {
        if (selectedOption) {
            setSearchTerm(selectedOption.label);
        } else if (!value) {
            setSearchTerm('');
        }
    }, [value, selectedOption]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Si on ferme sans sélectionner, on remet le terme de recherche au label actuel
                setSearchTerm(selectedOption ? selectedOption.label : '');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, selectedOption]);

    const filteredOptions = normalizedOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setSearchTerm(option.label);
        setIsOpen(false);
    };

    return (
        <div className={`flex flex-col gap-2 relative ${containerClassName}`} ref={containerRef}>
            {label && (
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                    {Icon && <Icon size={12} className="text-slate-500" />}
                    {label}
                </label>
            )}

            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors pointer-events-none z-10">
                        <Icon size={20} />
                    </div>
                )}

                <input
                    type="text"
                    className={`
                        w-full h-[72px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl 
                        ${Icon ? 'pl-16' : 'pl-8'} pr-16
                        font-black text-[18px] uppercase tracking-widest text-slate-700 dark:text-white placeholder:text-slate-400
                        focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
                        transition-all cursor-pointer ${className}
                    `}
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    // Clear search on focus to facilitate quick search
                    onClick={() => {
                        if (!isOpen) setIsOpen(true);
                        setSearchTerm('');
                    }}
                />

                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronDown size={24} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                    <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[350px] overflow-y-auto p-2.5 space-y-1.5">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`
                                            w-full flex items-center justify-between px-6 py-4.5 rounded-xl text-left font-black text-[15px] uppercase tracking-widest transition-all
                                            ${value === option.value
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}
                                        `}
                                    >
                                        <span className="truncate pr-4">{option.label}</span>
                                        {value === option.value && <Check size={20} strokeWidth={3} />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <Search size={32} className="mx-auto text-slate-300 mb-2 opacity-20" />
                                    <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest">Aucun résultat</p>
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
