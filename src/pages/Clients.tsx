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
import ThemeToggle from '../components/ThemeToggle';

const ClientsList: React.FC = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
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
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <button onClick={() => navigate('/')} className="btn-pill btn-outline shrink-0" style={{ padding: '0.6rem 1rem', fontSize: '0.7rem' }}>
                        <ArrowLeft size={16} /> <span className="hidden xs:inline ml-2">RETOUR</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h1 className="welcome-text" style={{ fontSize: '1.1rem', marginBottom: '0', whiteSpace: 'nowrap' }}>GESTION CLIENTS</h1>
                            <p className="date-text" style={{ fontSize: '0.6rem' }}>FICHIER & COMPTES</p>
                        </div>
                    </div>
                    <div className="sm:hidden w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">KH</div>
                </div>

                <div className="hidden sm:flex items-center gap-4">
                    {/* Current Time Display */}
                    <div className="premium-card hidden lg:flex items-center gap-2" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.03)' }}>
                        <ClockIcon size={14} className="text-blue-400" />
                        <TimeDisplay className="text-xs font-black" />
                    </div>
                    <ThemeToggle />
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-xs font-black text-white">KH</div>
                </div>
            </div>

            {/* Main Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="relative w-full md:w-80 lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-premium w-full"
                        style={{
                            paddingLeft: '3rem',
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.03)',
                            height: '44px',
                            fontSize: '0.8rem'
                        }}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {/* View Switchers Group */}
                    <div className="control-group shrink-0">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`control-item ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            <LayoutList size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`control-item ${viewMode === 'grid' ? 'active' : ''}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('compact')}
                            className={`control-item ${viewMode === 'compact' ? 'active' : ''}`}
                        >
                            <Grid3X3 size={16} />
                        </button>
                    </div>

                    {/* QR Code Button */}
                    <button className="control-group bg-transparent hover:bg-white/5 transition-all shrink-0" style={{ padding: '0.4rem' }}>
                        <div className="control-item" style={{ width: '36px', height: '36px' }}>
                            <QrCode size={18} />
                        </div>
                    </button>

                    {/* Add Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-pill btn-primary ml-auto md:ml-0 shrink-0"
                        style={{
                            height: '44px',
                            padding: '0 1.25rem',
                            fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #5856D6, #AF52DE)',
                            boxShadow: '0 8px 20px -5px rgba(88, 86, 214, 0.4)'
                        }}
                    >
                        <Plus size={16} className="mr-1.5" /> <span className="whitespace-nowrap">NOUVELLE CLIENTE</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
            ) : (
                <div className="w-full">
                    {/* List View (Table - Hidden on mobile by default unless forced) */}
                    {viewMode === 'list' && (
                        <div className="premium-table-container">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>CLIENTE <ChevronDown size={12} className="inline ml-1 opacity-50" /></th>
                                        <th className="hidden md:table-cell">TYPE</th>
                                        <th className="hidden lg:table-cell">SOLDE</th>
                                        <th className="text-right">ACTIONS</th>
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
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-white">{client.first_name} {client.last_name}</span>
                                                        <span className="text-[10px] text-muted sm:hidden">{client.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell">
                                                <span className="badge-pill-table">NORMAL</span>
                                            </td>
                                            <td className="hidden lg:table-cell">
                                                <span className="font-black text-green-400">
                                                    {client.balance.toFixed(0)} <span className="text-[10px] opacity-60">TND</span>
                                                </span>
                                            </td>
                                            <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-all">
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

                    {/* Grid View (Cards - Great for all devices) */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => setSelectedClientId(client.id)}
                                    className="premium-card group cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="initials-avatar w-14 h-14 text-lg" style={{ background: 'linear-gradient(135deg, #5856D6, #AF52DE)', borderRadius: '18px' }}>
                                            {getInitials(client.first_name, client.last_name)}
                                        </div>
                                        <div className="text-right">
                                            <span className="badge-pill-table mb-2 block">CLIENTE</span>
                                            <p className="font-black text-green-400">{client.balance.toFixed(0)} <span className="text-[10px] opacity-60">TND</span></p>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-1 uppercase">{client.first_name} {client.last_name}</h3>
                                    <p className="text-muted text-sm font-bold mb-4">{client.phone || 'Pas de téléphone'}</p>
                                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <Search size={14} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-white transition-all">Voir la fiche</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Compact View (Small items - for mobile) */}
                    {viewMode === 'compact' && (
                        <div className="space-y-3">
                            {filtered.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => setSelectedClientId(client.id)}
                                    className="premium-card flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-all"
                                    style={{ borderRadius: '16px' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="initials-avatar w-10 h-10 text-xs" style={{ background: 'linear-gradient(135deg, #5856D6, #AF52DE)', borderRadius: '12px' }}>
                                            {getInitials(client.first_name, client.last_name)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white uppercase text-sm">{client.first_name} {client.last_name}</h4>
                                            <p className="text-[10px] text-muted font-bold">{client.phone}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-green-400 text-sm">{client.balance.toFixed(0)} DT</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
