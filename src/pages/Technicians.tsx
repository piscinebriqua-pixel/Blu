import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { Plus, Search as SearchIcon } from 'lucide-react';
import PersonCard from '../components/PersonCard';
import type { Person } from '../components/PersonCard';
import TechnicianModal from '../components/TechnicianModal';
import Button from '../components/ui/Button';
import TechnicianDetailsModal from '../components/TechnicianDetailsModal';

// Adapt Technician to Person interface
const toPerson = (tech: any): Person => ({
    id: tech.id,
    full_name: tech.full_name,
    phone: tech.phone,
    email: tech.email,
    active: tech.active,
    photo_url: tech.photo_url
});

interface Technician {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    photo_url: string;
    active: boolean;
}

const Technicians: React.FC = () => {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTech, setEditingTech] = useState<Technician | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('technicians')
                .select('*')
                .order('full_name');

            if (error) throw error;
            setTechnicians(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (tech: Technician | null = null) => {
        setEditingTech(tech);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent, formData: any) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            if (editingTech) {
                const { error } = await supabase.from('technicians').update(formData).eq('id', editingTech.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('technicians').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchTechnicians();
        } catch (error: any) {
            console.error('Erreur:', error);
            alert(error.message || 'Une erreur est survenue');
        } finally {
            setModalLoading(false);
        }
    };

    const toggleStatus = async (person: Person) => {
        const tech = person as unknown as Technician;
        try {
            const { error } = await supabase.from('technicians').update({ active: !tech.active }).eq('id', tech.id);
            if (error) throw error;
            fetchTechnicians();
        } catch (error: any) {
            console.error('Erreur:', error);
            alert("Erreur lors de la mise à jour du statut");
        }
    };

    const filteredTechnicians = technicians.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.phone && t.phone.includes(searchTerm))
    );

    const activeCount = technicians.filter(t => t.active).length;

    const toolbar = (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <div className="relative w-full sm:w-96">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher par nom ou téléphone..."
                    className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button
                onClick={() => handleOpenModal()}
                icon={Plus}
                className="w-full sm:w-auto"
            >
                NOUVEAU MEMBRE
            </Button>
        </div>
    );

    return (
        <PageLayout
            title="ÉQUIPE TECHNIQUE"
            subtitle={`${activeCount} MEMBRES ACTIFS • ${technicians.length} TOTAL`}
            toolbar={toolbar}
            loading={loading && technicians.length === 0}
            showBackButton={true}
        >
            {filteredTechnicians.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                    {filteredTechnicians.map(tech => (
                        <PersonCard
                            key={tech.id}
                            person={toPerson(tech)}
                            type="technician"
                            onEdit={() => handleOpenModal(tech)}
                            onToggleStatus={toggleStatus}
                            onClick={() => setSelectedTechId(tech.id)}
                        />
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <SearchIcon size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Aucun technicien trouvé</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            Essayez de modifier vos critères de recherche ou ajoutez un nouveau membre à l'équipe.
                        </p>
                    </div>
                )
            )}

            <TechnicianModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                technician={editingTech}
                loading={modalLoading}
            />

            {selectedTechId && (
                <TechnicianDetailsModal
                    technicianId={selectedTechId}
                    onClose={() => setSelectedTechId(null)}
                />
            )}
        </PageLayout>
    );
};

export default Technicians;
