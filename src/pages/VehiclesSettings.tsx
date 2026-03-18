import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import ModalLayout from '../components/ModalLayout';
import {
    Plus,
    Trash2,
    Edit2,
    Car,
    Truck,
    Bike,
    Bus,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Vehicle {
    id: string;
    name: string;
    plate: string;
    type: string;
    is_active: boolean;
}

const VEHICLE_TYPES = [
    { value: 'van', label: 'Fourgonnette', icon: <Truck size={20} /> },
    { value: 'car', label: 'Voiture', icon: <Car size={20} /> },
    { value: 'truck', label: 'Camion', icon: <Bus size={20} /> },
    { value: 'moto', label: 'Moto', icon: <Bike size={20} /> },
];

const getVehicleIcon = (type: string, size = 22) => {
    switch (type) {
        case 'car': return <Car size={size} />;
        case 'truck': return <Bus size={size} />;
        case 'moto': return <Bike size={size} />;
        default: return <Truck size={size} />;
    }
};

const VehiclesSettings: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedType, setSelectedType] = useState('van');

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('name');
        if (error) toast.error(error.message);
        setVehicles(data || []);
        setLoading(false);
    };

    const openAddModal = () => {
        setEditingVehicle(null);
        setSelectedType('van');
        setIsModalOpen(true);
    };

    const openEditModal = (v: Vehicle) => {
        setEditingVehicle(v);
        setSelectedType(v.type);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = {
            name: formData.get('name') as string,
            plate: formData.get('plate') as string,
            type: selectedType,
        };

        if (!payload.name) return toast.error('Nom du véhicule requis');

        setIsSubmitting(true);
        try {
            if (editingVehicle) {
                const { error } = await supabase.from('vehicles').update(payload).eq('id', editingVehicle.id);
                if (error) throw error;
                toast.success('Véhicule modifié');
            } else {
                const { error } = await supabase.from('vehicles').insert(payload);
                if (error) throw error;
                toast.success('Véhicule ajouté');
            }
            setIsModalOpen(false);
            fetchVehicles();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleActive = async (v: Vehicle) => {
        const { error } = await supabase.from('vehicles').update({ is_active: !v.is_active }).eq('id', v.id);
        if (error) return toast.error(error.message);
        toast.success(v.is_active ? 'Véhicule désactivé' : 'Véhicule activé');
        fetchVehicles();
    };

    const handleDelete = async (v: Vehicle) => {
        if (!confirm(`Supprimer "${v.name}" ?`)) return;
        const { error } = await supabase.from('vehicles').delete().eq('id', v.id);
        if (error) return toast.error('Impossible de supprimer : ce véhicule est lié à des dépenses.');
        toast.success('Véhicule supprimé');
        fetchVehicles();
    };

    const activeVehicles = vehicles.filter(v => v.is_active);
    const inactiveVehicles = vehicles.filter(v => !v.is_active);

    return (
        <PageLayout
            title="Véhicules"
            subtitle="Flotte de l'entreprise"
            showBackButton={true}
        >
            <div className="flex flex-col gap-8 pb-24">

                {/* Header Action */}
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-slate-500">
                            {activeVehicles.length} véhicule{activeVehicles.length !== 1 ? 's' : ''} actif{activeVehicles.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="h-12 px-6 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        <Plus size={18} /> Ajouter
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900/50 rounded-[24px] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Active Vehicles */}
                        {activeVehicles.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Actifs</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeVehicles.map(v => (
                                        <div
                                            key={v.id}
                                            className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[24px] shadow-sm"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                                {getVehicleIcon(v.type, 24)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-black text-slate-800 dark:text-white uppercase truncate">{v.name}</p>
                                                <p className="text-sm font-bold text-slate-500">{v.plate || 'Sans immatriculation'}</p>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => openEditModal(v)}
                                                    className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => toggleActive(v)}
                                                    className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-500/5 rounded-xl transition-all"
                                                    title="Désactiver"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(v)}
                                                    className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Inactive Vehicles */}
                        {inactiveVehicles.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Inactifs</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-50">
                                    {inactiveVehicles.map(v => (
                                        <div
                                            key={v.id}
                                            className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-[24px]"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                                                {getVehicleIcon(v.type, 24)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-black text-slate-600 dark:text-slate-400 uppercase truncate">{v.name}</p>
                                                <p className="text-sm font-bold text-slate-400">{v.plate || 'Sans immatriculation'}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleActive(v)}
                                                className="h-9 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 text-xs font-black uppercase tracking-wider transition-all hover:bg-primary/10 hover:text-primary"
                                            >
                                                Activer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {vehicles.length === 0 && (
                            <div className="text-center py-20 bg-white/50 dark:bg-slate-800/10 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                                <Truck size={40} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-base font-black text-slate-400 uppercase tracking-widest">Aucun véhicule enregistré</p>
                                <p className="text-sm font-bold text-slate-300 mt-1">Ajoutez votre première flotte</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <ModalLayout
                    title={editingVehicle ? 'Modifier le Véhicule' : 'Ajouter un Véhicule'}
                    onClose={() => setIsModalOpen(false)}
                    actions={
                        <button
                            form="vehicle-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-flow btn-primary w-full !h-14 disabled:opacity-50"
                        >
                            {isSubmitting ? 'ENREGISTREMENT...' : (editingVehicle ? 'ENREGISTRER' : 'AJOUTER LE VÉHICULE')}
                        </button>
                    }
                >
                    <form id="vehicle-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

                        {/* Type selector */}
                        <div className="flex flex-col gap-3">
                            <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de véhicule</label>
                            <div className="grid grid-cols-4 gap-2">
                                {VEHICLE_TYPES.map(t => (
                                    <label
                                        key={t.value}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                                            selectedType === t.value
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400 hover:border-slate-200'
                                        }`}
                                        onClick={() => setSelectedType(t.value)}
                                    >
                                        {t.icon}
                                        <span className="text-[12px] font-black uppercase">{t.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Name */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom / Modèle</label>
                            <input
                                name="name"
                                required
                                defaultValue={editingVehicle?.name}
                                placeholder="Ex: Renault Express, Ford Transit..."
                                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 font-bold text-base text-slate-800 dark:text-white"
                            />
                        </div>

                        {/* Plate */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Immatriculation</label>
                            <input
                                name="plate"
                                defaultValue={editingVehicle?.plate}
                                placeholder="Ex: 123 TUN 16"
                                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 font-bold text-base text-slate-800 dark:text-white uppercase"
                            />
                        </div>
                    </form>
                </ModalLayout>
            )}
        </PageLayout>
    );
};

export default VehiclesSettings;
