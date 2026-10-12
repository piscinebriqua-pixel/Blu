import React, { type SelectHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    icon?: LucideIcon;
    options: string[] | { label: string; value: string }[];
    placeholder?: string;
    containerClassName?: string;
}

const Select: React.FC<SelectProps> = ({
    label,
    icon: Icon,
    options,
    placeholder = "Sélectionner...",
    containerClassName = '',
    className = '',
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-2 ${containerClassName}`}>
            {label && (
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    {Icon && <Icon size={14} className="text-slate-500" />}
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors pointer-events-none z-10">
                        <Icon size={20} />
                    </div>
                )}
                <select
                    className={`
                        w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl 
                        ${Icon ? 'pl-12' : 'pl-4'} pr-10 
                        font-semibold text-slate-800 dark:text-white appearance-none
                        focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        ${className}
                    `}
                    {...props}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => {
                        const optVal = typeof option === 'string' ? option : option.value;
                        const optLabel = typeof option === 'string' ? option : option.label;
                        return (
                            <option key={optVal} value={optVal}>
                                {optLabel}
                            </option>
                        );
                    })}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Select;
