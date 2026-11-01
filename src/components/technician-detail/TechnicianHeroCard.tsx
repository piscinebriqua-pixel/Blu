import React, { useState } from 'react';
import { Phone, MessageCircle, Key, Edit3, Trash2, Eye, EyeOff, Wrench } from 'lucide-react';

export interface TechnicianInfo {
    id: string;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    photo_url?: string | null;
    active: boolean;
    pin_code?: string | null;
    created_at?: string;
}

interface TechnicianHeroCardProps {
    technician: TechnicianInfo;
    onEdit: () => void;
    onDelete: () => void;
}

export const TechnicianHeroCard: React.FC<TechnicianHeroCardProps> = ({
    technician,
    onEdit,
    onDelete
}) => {
    const [showPin, setShowPin] = useState(false);

    // Initiales pour l'avatar si pas de photo
    const initials = technician.full_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Numéro nettoyé pour appel et WhatsApp
    const cleanPhone = (technician.phone || '').replace(/\s+/g, '');
    const whatsappUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : (cleanPhone.startsWith('216') ? cleanPhone : `216${cleanPhone}`)}`
        : null;

    return (
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Partie Gauche : Avatar + Nom + Statut */}
            <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                    {technician.photo_url ? (
                        <img
                            src={technician.photo_url}
                            alt={technician.full_name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-md"
                        />
                    ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                            {initials || <Wrench size={28} />}
                        </div>
                    )}
                    <span 
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                            technician.active ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-rose-500'
                        }`}
                        title={technician.active ? "En service" : "Inactif"}
                    />
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                            technician.active 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                        }`}>
                            {technician.active ? "En Service" : "Inactif"}
                        </span>
                        {technician.pin_code && (
                            <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="min-h-[28px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center gap-1 hover:bg-slate-200 transition-colors"
                                title="Afficher/Masquer le code PIN"
                            >
                                <Key size={12} className="text-amber-500" />
                                <span>PIN: {showPin ? technician.pin_code : '••••'}</span>
                                {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                        )}
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                        {technician.full_name}
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {technician.email || 'Aucun email configuré'}
                    </p>
                </div>
            </div>

            {/* Partie Droite : Actions Rapides Terrain (Touch Targets >= 44px) */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 justify-start md:justify-end">
                {cleanPhone && (
                    <>
                        <a
                            href={`tel:${cleanPhone}`}
                            className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
                            title="Appeler le technicien"
                        >
                            <Phone size={16} />
                            <span>Appeler</span>
                        </a>

                        {whatsappUrl && (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center transition-all"
                                title="Message WhatsApp"
                            >
                                <MessageCircle size={18} />
                            </a>
                        )}
                    </>
                )}

                <button
                    type="button"
                    onClick={onEdit}
                    className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all"
                    title="Modifier la fiche"
                >
                    <Edit3 size={16} />
                    <span className="hidden sm:inline">Modifier</span>
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center transition-all"
                    title="Supprimer le technicien"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default TechnicianHeroCard;

