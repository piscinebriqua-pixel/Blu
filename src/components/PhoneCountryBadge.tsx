import React from 'react';
import { detectPhoneInfo } from '../lib/phoneUtils';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface PhoneCountryBadgeProps {
    phone: string;
    className?: string;
}

export const PhoneCountryBadge: React.FC<PhoneCountryBadgeProps> = ({ phone, className = '' }) => {
    if (!phone || !phone.trim()) return null;

    const info = detectPhoneInfo(phone);

    if (!info.cleanNumber) return null;

    if (info.isValid) {
        return (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold w-fit animate-in fade-in transition-all ${className}`}>
                <span className="text-sm">{info.flag}</span>
                <span>{info.country} ({info.code || 'Intl'})</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1">WA: {info.cleanNumber}</span>
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 ml-0.5" />
            </div>
        );
    }

    if (info.country === 'En cours...') {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium w-fit ${className}`}>
                <Clock size={12} className="text-slate-400" />
                <span>{info.displayHint || 'Saisie en cours...'}</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold w-fit ${className}`}>
            <AlertCircle size={13} className="text-amber-600 dark:text-amber-400" />
            <span>{info.displayHint || 'Format incomplet'}</span>
        </div>
    );
};
