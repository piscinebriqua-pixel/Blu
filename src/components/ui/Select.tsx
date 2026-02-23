import React, { type SelectHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    icon?: LucideIcon;
    options: string[];
    containerClassName?: string;
}

const Select: React.FC<SelectProps> = ({
    label,
    icon: Icon,
    options,
    containerClassName = '',
    className = '',
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-2 ${containerClassName}`}>
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
                    <option value="">Sélectionner une ville...</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Select;
