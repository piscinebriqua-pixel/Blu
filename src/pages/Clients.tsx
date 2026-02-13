import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Search,
    Loader2,
    ArrowLeft,
    ShieldCheck,
    Edit2,
    Trash2,
    List as LayoutList,
    LayoutGrid,
    Grid3X3,
    QrCode,
    ChevronDown,
    Clock as ClockIcon,
    Settings
} from 'lucide-react';
import AddClientModal from '../components/AddClientModal';
import ClientDetailsModal from '../components/ClientDetailsModal';

const ClientsList: React.FC = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data } = await supabase.from('clients').select('*').order('first_name');
            setClients(data || []);
        } finally { setLoading(false); }
    };

    const getInitials = (first: string, last: string) => {
        return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();
    };

    const filtered = clients.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="page-container pb-24">
            {/* Premium Navigation Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/')} className="btn-pill btn-outline" style={{ padding: '0.6rem 1.2rem', fontSize: '0.75rem' }}>
                        <ArrowLeft size={16} className="mr-2" /> RETOUR
                    </button>
                    <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h1 className="welcome-text" style={{ fontSize: '1.2rem', marginBottom: '0' }}>GESTION CLIENTS</h1>
                            <p className="date-text" style={{ fontSize: '0.65rem' }}>FICHIER & COMPTES</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Current Time Display */}
                    <div className="premium-card hidden md:flex items-center gap-2" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.03)' }}>
                        <ClockIcon size={14} className="text-blue-400" />
                        <TimeDisplay className="text-xs font-black" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-orange-400">
                        <Settings size={18} />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-xs font-black text-white">KH</div>
                </div>
            </div>

            {/* Main Action Bar (Matches Screenshot) */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-10">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher une cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-premium w-full"
                        style={{
                            paddingLeft: '3.5rem',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            height: '48px',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                    {/* View Switchers Group */}
                    <div className="control-group">
                        <button className="control-item active"><LayoutList size={18} /></button>
                        <button className="control-item"><LayoutGrid size={18} /></button>
                        <button className="control-item"><Grid3X3 size={18} /></button>
                    </div>

                    {/* QR Code Button */}
                    <button className="control-group bg-transparent hover:bg-white/5 transition-all" style={{ padding: '0.5rem' }}>
                        <div className="control-item" style={{ width: '40px', height: '40px' }}>
                            <QrCode size={20} />
                        </div>
                    </button>

                    {/* Add Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-pill btn-primary"
                        style={{
                            height: '48px',
                            padding: '0 2rem',
                            fontSize: '0.85rem',
                            background: 'linear-gradient(135deg, #5856D6, #AF52DE)',
                            boxShadow: '0 10px 30px -5px rgba(88, 86, 214, 0.4)'
                        }}
                    >
                        <Plus size={18} className="mr-2" /> NOUVELLE CLIENTE
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
            ) : (
                <div className="premium-table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>CLIENTE <ChevronDown size={12} className="inline ml-1 opacity-50" /></th>
                                <th className="hidden md:table-cell">TYPE <ChevronDown size={12} className="inline ml-1 opacity-50" /></th>
                                <th className="hidden lg:table-cell">NIVEAU <ChevronDown size={12} className="inline ml-1 opacity-50" /></th>
                                <th className="hidden sm:table-cell text-right">POINTS <ChevronDown size={12} className="inline ml-1 opacity-50" /></th>
                                <th className="text-right">CHIFFRE D'AFFAIRES <ChevronDown size={12} className="inline ml-1 opacity-50" /></th>
                                <th className="text-right">ACTIONS <ChevronDown size={12} className="inline ml-1 opacity-50" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(client => (
                                <tr key={client.id} className="cursor-pointer group" onClick={() => setSelectedClientId(client.id)}>
                                    <td>
                                        <div className="flex items-center gap-4">
                                            <div className="initials-avatar" style={{ background: 'linear-gradient(135deg, #5856D6, #AF52DE)' }}>
                                                {getInitials(client.first_name, client.last_name)}
                                            </div>
                                            <span className="font-black text-white">{client.first_name} {client.last_name}</span>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell">
                                        <span className="badge-pill-table">NORMAL</span>
                                    </td>
                                    <td className="hidden lg:table-cell">
                                        <span className="text-muted font-bold">Bronze</span>
                                    </td>
                                    <td className="hidden sm:table-cell text-right">
                                        <span className="font-black text-blue-400">120 pts</span>
                                    </td>
                                    <td className="text-right">
                                        <span className="font-black text-green-400">
                                            {client.balance.toFixed(0)} <span className="text-[10px] opacity-60">TND</span>
                                        </span>
                                    </td>
                                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-all">
                                            <ShieldCheck size={16} className="text-orange-500" />
                                            <Edit2 size={16} className="text-blue-400" />
                                            <Trash2 size={16} className="text-pink-500" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <AddClientModal onClose={() => setIsModalOpen(false)} onSuccess={fetchClients} />
            )}

            {selectedClientId && (
                <ClientDetailsModal
                    clientId={selectedClientId}
                    onClose={() => setSelectedClientId(null)}
                />
            )}
        </div>
    );
};

// Internal TimeDisplay component
const TimeDisplay: React.FC<{ className?: string }> = ({ className = "" }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);
    return <span className={className}>{time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
};

export default ClientsList;
