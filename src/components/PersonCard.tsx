import React from 'react';
import { Phone, Mail, MapPin, Edit2, Trash2, Shield, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';

export interface Person {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    photo_url?: string;
    active?: boolean;
    city?: string;
    address?: string; // Added address field
    balance?: number;
}

interface PersonCardProps {
    person: Person;
    type: 'client' | 'technician';
    onEdit?: (person: Person) => void;
    onDelete?: (person: Person) => void;
    onToggleStatus?: (person: Person) => void;
    onClick?: (person: Person) => void;
}

const PersonCard: React.FC<PersonCardProps> = ({
    person,
    type,
    onEdit,
    onDelete,
    onToggleStatus,
    onClick
}) => {
    const isActive = person.active !== false;
    const initial = person.full_name ? person.full_name.charAt(0).toUpperCase() : '?';

    return (
        <div
            onClick={() => onClick && onClick(person)}
            className={`
                group relative bg-white rounded-3xl p-6 shadow-sm border border-slate-100
                hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                ${!isActive ? 'opacity-75 grayscale-[0.8] hover:grayscale-0' : ''}
                ${onClick ? 'cursor-pointer' : ''}
            `}
        >
            {/* Top Right Actions - Always Visible now */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                {onEdit && (
                    <Button
                        variant="icon"
                        size="icon"
                        className="!bg-slate-50 !text-slate-500 hover:!bg-blue-500 hover:!text-white shadow-sm"
                        onClick={(e) => { e.stopPropagation(); onEdit(person); }}
                        title="Modifier"
                    >
                        <Edit2 size={16} />
                    </Button>
                )}
                {onToggleStatus && (
                    <Button
                        variant="icon"
                        size="icon"
                        className={`shadow-sm ${isActive ? '!bg-slate-50 !text-green-600 hover:!bg-red-500 hover:!text-white' : '!bg-slate-50 !text-slate-400 hover:!bg-green-500 hover:!text-white'}`}
                        onClick={(e) => { e.stopPropagation(); onToggleStatus(person); }}
                        title={isActive ? "Désactiver" : "Activer"}
                    >
                        {isActive ? <ShieldCheck size={16} /> : <Shield size={16} />}
                    </Button>
                )}
                {onDelete && (
                    <Button
                        variant="icon"
                        size="icon"
                        className="!bg-slate-50 !text-red-400 hover:!bg-red-500 hover:!text-white shadow-sm"
                        onClick={(e) => { e.stopPropagation(); onDelete(person); }}
                        title="Supprimer"
                    >
                        <Trash2 size={16} />
                    </Button>
                )}
            </div>

            <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg flex-shrink-0
                    ${isActive
                        ? (type === 'client'
                            ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-blue-200'
                            : 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-sky-200')
                        : 'bg-slate-100 text-slate-400'}
                `}>
                    {initial}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-bold text-slate-800 truncate pr-20">{person.full_name}</h3>

                    <div className="flex flex-col gap-2 mt-3">
                        {/* Phone Badge */}
                        <div className="flex items-center gap-2 text-slate-600">
                            <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                <Phone size={14} className="text-green-600" />
                            </div>
                            <span className="text-sm font-medium">{person.phone || 'N/A'}</span>
                        </div>

                        {/* Email Badge (Technician) */}
                        {type === 'technician' && (
                            <div className="flex items-center gap-2 text-slate-600">
                                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Mail size={14} className="text-blue-600" />
                                </div>
                                <span className="text-sm font-medium truncate">{person.email || 'N/A'}</span>
                            </div>
                        )}

                        {/* Address/City Badge (Client) */}
                        {type === 'client' && (
                            <div className="flex items-center gap-2 text-slate-600">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                    <MapPin size={14} className="text-indigo-600" />
                                </div>
                                <span className="text-sm font-medium truncate">
                                    {person.address ? person.address : (person.city || 'Adresse non renseignée')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Line */}
            <div className={`mt-5 h-1 w-full rounded-full ${isActive ? 'bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50' : 'bg-transparent'}`} />
        </div>
    );
};

export default PersonCard;
