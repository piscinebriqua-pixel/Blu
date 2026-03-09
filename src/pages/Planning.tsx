import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    User,
    List,
    Clock,
    LayoutGrid,
    Filter,
    RotateCcw,
    Edit2,
    Trash2
} from 'lucide-react';
import NewIntervention from '../components/NewIntervention';
import InterventionDetailsModal from '../components/InterventionDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-hot-toast';
import PageLayout from '../components/PageLayout';

interface Intervention {
    id: string;
    pool_id: string;
    visit_date: string;
    scheduled_date?: string;
    created_at: string;
    status: string;
    technician: { full_name: string };
    pool?: {
        name: string;
        client?: {
            id: string;
            first_name: string;
            last_name: string;
            balance: number;
            phone: string;
        };
    };
}

const Planning: React.FC = () => {
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [editingInterventionId, setEditingInterventionId] = useState<string | null>(null);
    const [interventionToDelete, setInterventionToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedTech, setSelectedTech] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [startMode, setStartMode] = useState(false);

    const fetchInterventions = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, technician_id')
                .eq('id', session.user.id)
                .single();

            let query = supabase
                .from('interventions')
                .select(`
                    *,
                    technician:technicians!technician_id(full_name),
                    pool:pools!pool_id(
                        name,
                        client:clients(id, first_name, last_name, balance, phone)
                    ),
                    services:intervention_services(price_at_time, service:services(name)),
                    products:intervention_products(quantity, total_price, product:inventory_products(name, unit))
                `)
                .in('status', ['scheduled', 'completed', 'in_progress', 'pending', 'cancelled']);

            if (profile?.role !== 'admin' && profile?.technician_id) {
                query = query.eq('technician_id', profile.technician_id);
            } else if (profile?.role !== 'admin' && !profile?.technician_id) {
                // If not admin and no tech_id, show nothing to be safe
                setInterventions([]);
                setLoading(false);
                return;
            }

            const { data, error } = await query;
            if (error) throw error;
            setInterventions(data || []);
        } catch (error: any) {
            console.error('Erreur Supabase:', error);
            toast.error("Impossible de charger le planning");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTechnicians = useCallback(async () => {
        const { data } = await supabase.from('technicians').select('id, full_name');
        setTechnicians(data || []);
    }, []);

    const handleDeleteIntervention = async () => {
        if (!interventionToDelete) return;

        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('interventions')
                .delete()
                .eq('id', interventionToDelete);

            if (error) throw error;

            toast.success("Entretien supprimé");
            setInterventionToDelete(null);
            fetchInterventions();
        } catch (error: any) {
            console.error('Error deleting:', error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchInterventions();
        fetchTechnicians();
    }, [fetchInterventions, fetchTechnicians]);

    const filteredInterventions = interventions.filter(i => {
        const matchesTech = selectedTech === 'all' ||
            (i.technician?.full_name === technicians.find(t => t.id === selectedTech)?.full_name);
        const matchesStatus = selectedStatus === 'all' || i.status === selectedStatus;
        return matchesTech && matchesStatus;
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                if (viewMode === 'month' || viewMode === 'week') setViewMode('agenda');
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [viewMode]);

    const changeDate = (amount: number) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + amount);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() + amount * 7);
        else newDate.setDate(newDate.getDate() + amount);
        setCurrentDate(newDate);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = startPadding; i > 0; i--) {
            days.push(new Date(year, month, 1 - i));
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        const endPadding = 42 - days.length;
        for (let i = 1; i <= endPadding; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    };

    const getDaysInWeek = (date: Date) => {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const formatDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getInterventionsForDate = (date: Date) => {
        const targetKey = formatDateKey(date);
        return filteredInterventions.filter(i => {
            if (!i.scheduled_date) return false;
            const interDateStr = String(i.scheduled_date);
            const interDatePart = interDateStr.includes('T')
                ? interDateStr.split('T')[0]
                : interDateStr.substring(0, 10);
            return interDatePart === targetKey;
        });
    };

    const WeekStrip = () => {
        const days = getDaysInWeek(currentDate);
        return (
            <div className="flex justify-between items-center gap-1 bg-white dark:bg-slate-800 p-2 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm mb-2">
                {days.map((d, i) => {
                    const isSelected = formatDateKey(d) === formatDateKey(currentDate);
                    const isToday = formatDateKey(d) === formatDateKey(new Date());
                    const hasInterventions = getInterventionsForDate(d).length > 0;

                    return (
                        <button
                            key={i}
                            onClick={() => setCurrentDate(d)}
                            className={`flex-1 flex flex-col items-center py-3 rounded-2xl transition-all relative ${isSelected
                                ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg scale-105 z-10'
                                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                            </span>
                            <span className="text-sm font-black leading-none">{d.getDate()}</span>
                            {!isSelected && isToday && (
                                <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
                            )}
                            {hasInterventions && !isSelected && (
                                <div className="w-1 h-1 bg-slate-200 mt-1 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    const InterventionCard = ({ i }: { i: Intervention }) => (
        <div
            onClick={() => setSelectedIntervention(i)}
            className={`group p-3 rounded-2xl border shadow-sm transition-all cursor-pointer flex items-center gap-3 ${i.status === 'completed'
                ? 'bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
                : i.status === 'cancelled'
                    ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-white/5 opacity-60'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 hover:shadow-xl hover:border-primary/30'
                }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${i.status === 'completed'
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                : i.status === 'cancelled'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                }`}>
                <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`text-base font-black uppercase tracking-tight truncate ${i.status === 'completed' ? 'text-emerald-800 dark:text-emerald-200' :
                        i.status === 'cancelled' ? 'text-slate-400 line-through' :
                            'text-slate-800 dark:text-white'
                        }`}>
                        {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-black uppercase truncate ${i.status === 'cancelled' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {i.technician?.full_name || '...'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditingInterventionId(i.id);
                        setStartMode(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                    title="Modifier"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setInterventionToDelete(i.id);
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                    title="Supprimer"
                >
                    <Trash2 size={16} />
                </button>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-all ml-1" />
            </div>
        </div>
    );

    const renderMonthView = () => {
        const days = getDaysInMonth(currentDate);
        const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        return (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
                <div className="grid grid-cols-7 mb-4">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                    {days.map((d, i) => {
                        const dayInterventions = getInterventionsForDate(d);
                        const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                        const isToday = formatDateKey(d) === formatDateKey(new Date());

                        return (
                            <div
                                key={i}
                                onClick={() => {
                                    setCurrentDate(d);
                                    setViewMode('day'); // Switch to day view when clicking a day with details
                                }}
                                className={`min-h-[100px] p-2 rounded-2xl flex flex-col items-start gap-2 relative transition-all cursor-pointer ${isCurrentMonth
                                    ? isToday
                                        ? 'bg-primary text-white shadow-xl shadow-primary/40 ring-4 ring-primary/20 z-10 scale-[1.02]'
                                        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:shadow-2xl hover:-translate-y-1'
                                    : 'bg-transparent text-slate-300 dark:text-slate-600/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start w-full mb-1">
                                    <span className={`text-lg font-black ${!isCurrentMonth ? 'opacity-30' : ''}`}>{d.getDate()}</span>
                                    {dayInterventions.length > 0 && (
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${isToday
                                            ? 'bg-white text-primary ring-2 ring-primary/20'
                                            : 'bg-primary text-white border-2 border-white dark:border-slate-800'
                                            }`}>
                                            {dayInterventions.length}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1 w-full mt-auto overflow-hidden">
                                    {dayInterventions.slice(0, 2).map(inter => (
                                        <div
                                            key={inter.id}
                                            className={`text-[10px] font-bold truncate px-2 py-1 rounded-lg leading-none w-full shadow-sm ${isToday
                                                ? 'bg-white/30 text-white backdrop-blur-sm'
                                                : 'bg-slate-50 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5'
                                                }`}
                                        >
                                            {inter.pool?.client?.last_name || '...'}
                                        </div>
                                    ))}
                                    {dayInterventions.length > 2 && (
                                        <div className={`text-[8px] font-bold uppercase opacity-60 ml-1 mt-0.5`}>
                                            + {dayInterventions.length - 2} plus
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const days = getDaysInWeek(currentDate);
        return (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 animate-in slide-in-from-right-4 duration-500 mt-4">
                {days.map((d, i) => {
                    const dayInterventions = getInterventionsForDate(d);
                    const isToday = formatDateKey(d) === formatDateKey(new Date());

                    return (
                        <div key={i} className="flex flex-col gap-3 min-h-[300px]">
                            <div onClick={() => { setCurrentDate(d); setViewMode('day'); }} className={`flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all ${isToday ? 'bg-primary text-white shadow-xl ring-4 ring-primary/10' : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                                <span className="text-sm font-black">{d.getDate()}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {dayInterventions.map(inter => (
                                    <div
                                        key={inter.id}
                                        onClick={() => setSelectedIntervention(inter)}
                                        className={`p-3 rounded-2xl text-[11px] font-bold border transition-all cursor-pointer shadow-sm ${inter.status === 'completed'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-700'
                                            : inter.status === 'cancelled'
                                                ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-white/5 text-slate-400 opacity-60 line-through'
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/10 text-slate-700 dark:text-slate-200'
                                            }`}
                                    >
                                        <div className="truncate font-black mb-1">{inter.pool?.client?.last_name}</div>
                                        <div className="opacity-70 truncate text-[9px] flex items-center gap-1">
                                            <Clock size={10} />
                                            {inter.scheduled_date && new Date(inter.scheduled_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderAgendaView = () => {
        const agendaInterventions = [...filteredInterventions]
            .filter(i => i.scheduled_date)
            .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime());

        // Hierarchical Grouping: Month -> Day -> Interventions
        const grouped: Record<string, Record<string, Intervention[]>> = {};

        agendaInterventions.forEach(i => {
            const date = new Date(i.scheduled_date!);
            // Use local date parts to avoid UTC shift issues in headers
            const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            const dayKey = date.toISOString().split('T')[0];

            if (!grouped[monthKey]) grouped[monthKey] = {};
            if (!grouped[monthKey][dayKey]) grouped[monthKey][dayKey] = [];
            grouped[monthKey][dayKey].push(i);
        });

        const months = Object.keys(grouped);
        const todayKey = new Date().toISOString().split('T')[0];

        return (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 mt-2">
                <div className="flex flex-col gap-6">
                    {months.length > 0 ? (
                        months.map(month => (
                            <div key={month} className="flex flex-col gap-2">
                                {/* Month Header */}
                                <div className="sticky top-0 z-20 py-2 px-4 bg-slate-50/80 dark:bg-[#0f141e]/80 backdrop-blur-md">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                        <span className="bg-primary w-1.5 h-6 rounded-full shadow-lg shadow-primary/20" />
                                        {month}
                                    </h2>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {Object.keys(grouped[month]).map(dayKey => {
                                        const dateObj = new Date(dayKey);
                                        const isToday = dayKey === todayKey;

                                        return (
                                            <div key={dayKey} className="flex flex-col gap-4 pl-3 border-l-2 border-slate-100 dark:border-white/5 ml-1">
                                                {/* Day Separator */}
                                                <div className="flex items-center gap-3 -ml-[17px]">
                                                    <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-[#0f141e] shadow-sm z-10 ${isToday ? 'bg-primary scale-125 ring-4 ring-primary/20' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            {dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                        </span>
                                                        {isToday && (
                                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-full tracking-widest">AUJOURD'HUI</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    {grouped[month][dayKey].map(i => (
                                                        <InterventionCard key={i.id} i={i} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                            <List size={48} className="opacity-20 mb-4" />
                            <p className="font-bold uppercase tracking-widest">Aucune intervention planifiée</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const dayInterventions = getInterventionsForDate(currentDate);
        return (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 mt-4">
                <WeekStrip />

                <div className="flex flex-col gap-3">
                    {dayInterventions.length > 0 ? (
                        dayInterventions.map(i => <InterventionCard key={i.id} i={i} />)
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center bg-white/30 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-white/5">
                            <CalendarIcon size={32} className="text-slate-200 mb-4" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Aucune intervention</h3>
                            <p className="text-[10px] font-bold text-slate-300 uppercase">Journée libre</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const toolbar = (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between gap-2 md:gap-4 w-full">
                {/* Prominent Left-aligned Selector with Today/Back button */}
                <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/70 p-2 rounded-[24px] border border-white/40 dark:border-white/10 backdrop-blur-md shadow-lg ring-1 ring-slate-200/20">
                    <div className="flex items-center gap-1">
                        <button title="Précédent" onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-2xl shadow-sm text-slate-500 hover:text-primary transition-all active:scale-90">
                            <ChevronLeft size={20} strokeWidth={3} />
                        </button>
                        <button
                            title="Aujourd'hui / Retour"
                            onClick={() => setCurrentDate(new Date())}
                            className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm active:rotate-[-90deg]"
                        >
                            <RotateCcw size={18} strokeWidth={3} />
                        </button>
                        <button title="Suivant" onClick={() => changeDate(1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-2xl shadow-sm text-slate-500 hover:text-primary transition-all active:scale-90">
                            <ChevronRight size={20} strokeWidth={3} />
                        </button>
                    </div>
                    <div className="flex flex-col pr-4 min-w-[120px]">
                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.25em] leading-none mb-1">
                            {viewMode === 'month' ? 'Mensuel' : viewMode === 'week' ? 'Hebdomadaire' : 'Quotidien'}
                        </span>
                        <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none truncate">
                            {viewMode === 'agenda'
                                ? 'Tout l\'Agenda'
                                : viewMode === 'day'
                                    ? currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                            }
                        </h3>
                    </div>
                </div>

                {/* Filters Dropdowns */}
                <div className="hidden lg:flex items-center gap-2">
                    <div className="relative">
                        <select
                            title="Filtrer par technicien"
                            value={selectedTech}
                            onChange={(e) => setSelectedTech(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-800 border-none rounded-2xl py-2 px-4 pr-10 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">Tous les techniciens</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                        <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select
                            title="Filtrer par statut"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-800 border-none rounded-2xl py-2 px-4 pr-10 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="scheduled">Planifié</option>
                            <option value="completed">Terminé</option>
                            <option value="cancelled">Annulé</option>
                        </select>
                        <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* View Switcher Buttons - Right aligned */}
                <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200/50 dark:border-white/5 backdrop-blur-xl shrink-0 shadow-sm">
                    <button
                        title="Vue Mensuelle"
                        onClick={() => setViewMode('month')}
                        className={`p-2.5 rounded-full transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <CalendarIcon size={18} />
                    </button>
                    <button
                        title="Vue Hebdomadaire"
                        onClick={() => setViewMode('week')}
                        className={`p-2.5 rounded-full transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        title="Vue Journalière"
                        onClick={() => setViewMode('day')}
                        className={`p-2.5 rounded-full transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Clock size={18} />
                    </button>
                    <button
                        title="Vue Agenda"
                        onClick={() => setViewMode('agenda')}
                        className={`p-2.5 rounded-full transition-all ${viewMode === 'agenda' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Mobile Filters */}
            <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {/* Simplified filters for mobile */}
                <div className="flex-1">
                    <select
                        title="Filtrer par technicien (Mobile)"
                        value={selectedTech}
                        onChange={(e) => setSelectedTech(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm"
                    >
                        <option value="all">Tous Techniciens</option>
                        {technicians.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <select
                        title="Filtrer par statut (Mobile)"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm"
                    >
                        <option value="all">Tous Statuts</option>
                        <option value="scheduled">Planifié</option>
                        <option value="completed">Terminé</option>
                        <option value="cancelled">Annulé</option>
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <PageLayout
            title="PLANNING"
            subtitle={`${filteredInterventions.length} INTERVENTIONS`}
            showBackButton={true}
            toolbar={toolbar}
            loading={loading && interventions.length === 0}
            className="bg-slate-50 dark:bg-[#0f141e]"
        >
            <div className="pb-32 px-1 md:px-4 min-h-[60vh]">
                {interventions.length === 0 && !loading ? (
                    <div className="py-24 flex flex-col items-center justify-center animate-in fade-in duration-1000">
                        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8">
                            <Plus size={40} className="text-primary/20" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Aucune donnée</h2>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center max-w-xs">Planifiez votre première intervention pour commencer</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'month' && renderMonthView()}
                        {viewMode === 'week' && renderWeekView()}
                        {viewMode === 'day' && renderDayView()}
                        {viewMode === 'agenda' && renderAgendaView()}
                    </>
                )}
            </div>

            <button
                title="Planifier une nouvelle intervention"
                onClick={() => {
                    setSelectedDate(formatDateKey(currentDate));
                    setIsNewModalOpen(true);
                }}
                className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group ring-4 ring-white dark:ring-slate-900"
            >
                <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>

            {selectedIntervention && (
                <InterventionDetailsModal
                    intervention={selectedIntervention as any}
                    onClose={() => setSelectedIntervention(null)}
                    onEdit={(i) => {
                        setEditingInterventionId(i.id);
                        setStartMode(false);
                        setSelectedIntervention(null);
                    }}
                    onStart={(i) => {
                        setEditingInterventionId(i.id);
                        setStartMode(true);
                        setSelectedIntervention(null);
                    }}
                    onDelete={(i) => {
                        setInterventionToDelete(i.id);
                        setSelectedIntervention(null);
                    }}
                    onStatusChange={fetchInterventions}
                />
            )}

            <ConfirmModal
                isOpen={!!interventionToDelete}
                title="Supprimer Intervention"
                message="Voulez-vous vraiment supprimer cet entretien ? Cette action est irréversible."
                confirmLabel="SUPPRIMER"
                onConfirm={handleDeleteIntervention}
                onClose={() => setInterventionToDelete(null)}
                loading={isDeleting}
                variant="danger"
            />

            {(isNewModalOpen || editingInterventionId) && (
                <NewIntervention
                    interventionId={editingInterventionId || undefined}
                    scheduledDate={selectedDate || undefined}
                    type={startMode ? "direct" : "scheduled"}
                    onClose={() => {
                        setIsNewModalOpen(false);
                        setEditingInterventionId(null);
                        setSelectedDate(null);
                        setStartMode(false);
                    }}
                    onSuccess={() => {
                        setIsNewModalOpen(false);
                        setEditingInterventionId(null);
                        setSelectedDate(null);
                        fetchInterventions();
                    }}
                />
            )}
        </PageLayout>
    );
};

export default Planning;
