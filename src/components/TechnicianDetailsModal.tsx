import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Loader2,
    MapPin,
    Phone,
    History,
    Calendar,
    Wrench,
    TrendingUp,
    CheckCircle2
} from 'lucide-react';
import ModalLayout from './ModalLayout';

interface TechnicianDetailsModalProps {
    technicianId: string;
    onClose: () => void;
}

const TechnicianDetailsModal: React.FC<TechnicianDetailsModalProps> = ({ technicianId, onClose }) => {
    const [technician, setTechnician] = useState<any>(null);
    const [interventions, setInterventions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ completed: 0, pending: 0, rating: 0 });

    useEffect(() => {
        fetchTechnicianData();
    }, [technicianId]);

    const fetchTechnicianData = async () => {
        try {
            setLoading(true);
            const { data: techData } = await supabase
                .from('technicians')
                .select('*')
                .eq('id', technicianId)
                .single();
            setTechnician(techData);

            // Fetch recent interventions assigned to this technician (mock logic if table relation doesn't exist yet)
            // Assuming 'interventions' has a 'technician_id' column or similar.
            // If not, we'll just fetch some global interventions for demo or skip if not ready.
            // For now, let's try to fetch if column exists, or handle gracefully.
            const { data: interData } = await supabase
                .from('interventions')
                .select('id, scheduled_date, created_at, status, pool:pools(name, client:clients(city))')
                .eq('technician_id', technicianId) // Assuming this column exists
                .order('scheduled_date', { ascending: false })
                .limit(5);

            setInterventions(interData || []);

            // Mock stats
            setStats({
                completed: interData?.filter((i: any) => i.status === 'completed').length || 0,
                pending: interData?.filter((i: any) => i.status === 'pending').length || 0,
                rating: 4.8 // Mock rating
            });

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !technician) {
        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const footer = (
        <button onClick={onClose} className="w-full py-4 bg-white/5 dark:bg-slate-800 text-slate-500 dark:text-slate-500 font-bold rounded-2xl uppercase tracking-widest text-base hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Fermer
        </button>
    );

    return (
        <ModalLayout
            title="FICHE TECHNICIEN"
            onClose={onClose}
            actions={footer}
        >
            <div className="flex flex-col gap-6">
                {/* Identity Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-primary/30">
                            {(technician.full_name || '')[0]}
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight truncate leading-none">
                                {technician.full_name}
                            </h4>
                            <div className="flex items-center gap-2 text-white/40">
                                <Wrench size={12} className="text-primary/80" />
                                <span className="text-[13px] font-bold uppercase tracking-widest truncate">Technicien Certifié</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-white/40 mb-1">
                                <CheckCircle2 size={12} />
                                <span className="text-[13px] font-black uppercase tracking-widest">Interventions</span>
                            </div>
                            <p className="text-lg font-black leading-none text-white">
                                {interventions.length} <span className="text-xs opacity-50 uppercase font-normal">Total</span>
                            </p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-white/40 mb-1">
                                <TrendingUp size={12} />
                                <span className="text-[13px] font-black uppercase tracking-widest">Performance</span>
                            </div>
                            <p className="text-lg font-black text-white leading-none">
                                {stats.rating} <span className="text-xs opacity-50 uppercase font-normal">/ 5.0</span>
                            </p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-white/60">
                            <Phone size={14} />
                            <span className="text-xs font-medium">{technician.phone || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60">
                            <MapPin size={14} />
                            <span className="text-xs font-medium">{technician.email || 'Non renseigné'}</span>
                        </div>
                    </div>
                </div>

                {/* Recent History */}
                <div>
                    <h3 className="text-[13px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <History size={14} /> Dernières Activités
                    </h3>

                    <div className="flex flex-col gap-3">
                        {interventions.length > 0 ? (
                            interventions.map((inter: any) => (
                                <div key={inter.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 uppercase leading-none">
                                                {inter.pool?.name || 'Bassin Inconnu'}
                                            </p>
                                            <p className="text-base text-slate-500 font-medium mt-1">
                                                {new Date(inter.created_at || inter.completed_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-[13px] font-bold uppercase ${inter.status === 'completed' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                        {inter.status === 'completed' ? 'Terminé' : 'En cours'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-base italic bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                Aucune intervention récente
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ModalLayout>
    );
};

export default TechnicianDetailsModal;
