import React, { useState, useEffect } from 'react';
import { Search, User, MapPin, Plus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ModalLayout from './ModalLayout';
import AddClientModal from './AddClientModal';

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    city: string;
}

interface ClientSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (client: Client) => void;
    selectedClientId?: string;
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({ isOpen, onClose, onSelect, selectedClientId }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('last_name');
            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c => {
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
            (c.phone && c.phone.includes(searchTerm));
    });

    if (!isOpen) return null;

    if (showAddModal) {
        return (
            <AddClientModal
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    fetchClients();
                    setShowAddModal(false);
                    // On ne sélectionne pas automatiquement ici car on n'a pas l'ID facilement sans refaire un fetch
                }}
            />
        );
    }

    const actions = (
        <button
            onClick={onClose}
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
        >
            Annuler
        </button>
    );

    return (
        <ModalLayout
            title="SÉLECTIONNER UN CLIENT"
            onClose={onClose}
            actions={actions}
        >
            <div className="flex flex-col gap-4 p-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-[54px] h-[54px] bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shrink-0"
                        title="Nouveau Client"
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <User size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-[13px] font-bold uppercase">Aucun client trouvé</p>
                        </div>
                    ) : (
                        filteredClients.map(client => {
                            const isSelected = selectedClientId === client.id;
                            return (
                                <button
                                    key={client.id}
                                    onClick={() => onSelect(client)}
                                    className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all group ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                        : 'border-white dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-700'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black mr-4 uppercase shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                        }`}>
                                        {(client.first_name?.[0] || '')}{(client.last_name?.[0] || '')}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`text-base font-black ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {client.first_name} {client.last_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                            <MapPin size={10} />
                                            {client.city || 'Ville inconnue'}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
                                            <Check size={16} strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </ModalLayout>
    );
};

export default ClientSelectionModal;
