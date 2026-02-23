import React, { type InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon;
    containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    icon: Icon,
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
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                        <Icon size={20} />
                    </div>
                )}
                <input
                    className={`
                        w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl 
                        ${Icon ? 'pl-12' : 'pl-4'} pr-4 
                        font-semibold text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500
                        focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        ${className}
                    `}
                    {...props}
                />
            </div>
        </div>
    );
};

export default Input;
