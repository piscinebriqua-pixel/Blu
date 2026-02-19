import React, { type ButtonHTMLAttributes } from 'react';
import { type LucideIcon, Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    icon?: LucideIcon;
    loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    loading = false,
    className = '',
    ...props
}) => {

    const baseStyles = "font-bold tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
        primary: "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/30",
        secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200",
        danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30",
        ghost: "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
        icon: "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl"
    };

    const sizes = {
        sm: "h-10 px-4 text-xs rounded-xl",
        md: "h-12 px-6 text-sm rounded-xl",
        lg: "h-14 px-8 text-base rounded-2xl",
        icon: "w-10 h-10 p-0 rounded-xl"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} /> : (
                <>
                    {Icon && <Icon size={size === 'sm' ? 16 : 20} />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
