import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import PersonCard from '../components/PersonCard';
import type { Person } from '../components/PersonCard';
import AddClientModal from '../components/AddClientModal';
import EditClientModal from '../components/EditClientModal';
import ClientDetailsModal from '../components/ClientDetailsModal';
import Button from '../components/ui/Button';

// Adapt Client to Person interface
const toPerson = (client: any): Person => ({
    id: client.id,
    full_name: `${client.first_name} ${client.last_name}`,
    phone: client.phone,
    email: client.email,
    active: true, // Clients are active by default for now
    city: client.city,
    address: client.address
});

const ClientsList: React.FC = () => {
    // navigate is not used in this version as PageLayout handles back button
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<any | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

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

    const handleDelete = async (person: Person) => {
        if (!window.confirm(`Supprimer le client ${person.full_name} ?`)) return;
        try {
            const { error } = await supabase.from('clients').delete().eq('id', person.id);
            if (error) throw error;
            fetchClients();
        } catch (error) {
            alert('Erreur lors de la suppression.');
        }
    };

    const filtered = clients.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    const toolbar = (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher un client..."
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button
                onClick={() => setIsAddModalOpen(true)}
                icon={Plus}
                className="w-full sm:w-auto"
            >
                NOUVEAU CLIENT
            </Button>
        </div>
    );

    return (
        <PageLayout
            title="CLIENTS"
            subtitle={`${clients.length} FICHES RÉPERTORIÉES`}
            toolbar={toolbar}
            loading={loading && clients.length === 0}
            showBackButton={true}
        >
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                    {filtered.map(client => (
                        <PersonCard
                            key={client.id}
                            person={toPerson(client)}
                            type="client"
                            onEdit={() => setClientToEdit(client)}
                            onDelete={handleDelete}
                            onClick={() => setSelectedClientId(client.id)}
                        />
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Search size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Aucun client trouvé</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            Essayez de modifier vos critères de recherche ou ajoutez un nouveau client.
                        </p>
                    </div>
                )
            )}

            {isAddModalOpen && <AddClientModal onClose={() => setIsAddModalOpen(false)} onSuccess={fetchClients} />}
            {clientToEdit && <EditClientModal client={clientToEdit} onClose={() => setClientToEdit(null)} onSuccess={fetchClients} />}
            {selectedClientId && <ClientDetailsModal clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />}
        </PageLayout>
    );
};

export default ClientsList;
