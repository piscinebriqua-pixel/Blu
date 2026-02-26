import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    User,
    Check
} from 'lucide-react';
import NewIntervention from '../components/NewIntervention';
import InterventionDetailsModal from '../components/InterventionDetailsModal';
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
        };
    };
}

const Planning: React.FC = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [editingInterventionId, setEditingInterventionId] = useState<string | null>(null);

    const fetchInterventions = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('interventions')
                .select(`
                    *,
                    technician:technicians(full_name),
                    pool:pools(
                        name,
                        client:clients(id, first_name, last_name, balance, phone)
                    ),
                    services:intervention_services(price_at_time, service:services(name)),
                    products:intervention_products(quantity, total_price, product:inventory_products(name, unit))
                `)
                .in('status', ['scheduled', 'completed', 'in_progress', 'pending']);

            if (error) throw error;
            setInterventions(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDeleteIntervention = async (intervention: any) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cet entretien ?")) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('interventions')
                .delete()
                .eq('id', intervention.id);

            if (error) throw error;

            toast.success("Entretien supprimé");
            setSelectedIntervention(null);
            fetchInterventions();
        } catch (error: any) {
            console.error('Error deleting:', error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterventions();
    }, [fetchInterventions]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768 && viewMode === 'month') {
                setViewMode('agenda');
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
        return interventions.filter(i => {
            if (!i.scheduled_date) return false;
            const interDateStr = String(i.scheduled_date);
            const interDatePart = interDateStr.includes('T')
                ? interDateStr.split('T')[0]
                : interDateStr.substring(0, 10);
            return interDatePart === targetKey;
        });
    };

    const renderMonthView = () => {
        const days = getDaysInMonth(currentDate);
        const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        return (
            <div className="flex flex-col animate-in fade-in duration-500">
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] py-2">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = formatDateKey(day) === formatDateKey(new Date());
                        const dayInterventions = getInterventionsForDate(day);

                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    setSelectedDate(formatDateKey(day));
                                    setViewMode('day');
                                    setCurrentDate(day);
                                }}
                                className={`min-h-[110px] md:min-h-[150px] p-2 rounded-2xl border transition-all cursor-pointer group ${isCurrentMonth
                                    ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-40'
                                    } ${isToday ? 'ring-2 ring-primary ring-inset shadow-lg shadow-primary/10' : ''} hover:border-primary/50 hover:shadow-lg`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[13px] font-black ${isToday ? 'text-primary' : 'text-slate-500'}`}>
                                        {day.getDate()}
                                    </span>
                                    {dayInterventions.length > 0 && (
                                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black">
                                            {dayInterventions.length}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    {dayInterventions.slice(0, 3).map(i => (
                                        <div
                                            key={i.id}
                                            className={`text-[10px] font-bold py-0.5 px-1.5 rounded-lg truncate border ${i.status === 'completed'
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/30'
                                                : 'bg-primary/5 text-primary border-primary/10'
                                                }`}
                                        >
                                            {i.pool?.client?.last_name || 'Client'}
                                        </div>
                                    ))}
                                    {dayInterventions.length > 3 && (
                                        <span className="text-[9px] text-slate-400 font-bold ml-1">+{dayInterventions.length - 3} de plus</span>
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
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {days.map((day, idx) => {
                        const isToday = formatDateKey(day) === formatDateKey(new Date());
                        const dayInterventions = getInterventionsForDate(day);

                        return (
                            <div key={idx} className="flex flex-col gap-3">
                                <div className={`p-4 rounded-3xl border text-center transition-all ${isToday ? 'bg-primary text-white border-primary shadow-xl shadow-primary/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-white/80' : 'text-slate-500'}`}>
                                        {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                    </p>
                                    <p className="text-2xl font-black">{day.getDate()}</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {dayInterventions.length > 0 ? (
                                        dayInterventions.map(i => (
                                            <div
                                                key={i.id}
                                                onClick={() => setSelectedIntervention(i)}
                                                className={`p-3 rounded-2xl border shadow-sm transition-all cursor-pointer group ${i.status === 'completed'
                                                    ? 'bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${i.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'}`}></div>
                                                    <span className={`text-[13px] font-black uppercase truncate ${i.status === 'completed' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                                                        {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
                                                    {i.pool?.name}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                            <CalendarIcon size={20} />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSelectedDate(formatDateKey(day));
                                            setIsNewModalOpen(true);
                                        }}
                                        className="py-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-slate-300 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center"
                                        title="Planifier ici"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderAgendaView = () => {
        const selectedDayInters = getInterventionsForDate(currentDate);

        return (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-6 duration-500 pb-20">
                <div className="flex items-center gap-2">
                    <button
                        title="Semaine précédente"
                        onClick={() => changeDate(-7)}
                        className="w-8 h-12 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex-1 flex justify-between items-center p-1.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl border border-white dark:border-slate-700/50 backdrop-blur-sm">
                        {getDaysInWeek(currentDate).map((day, idx) => {
                            const isSelected = formatDateKey(day) === formatDateKey(currentDate);
                            const isToday = formatDateKey(day) === formatDateKey(new Date());
                            const dayInters = getInterventionsForDate(day);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentDate(day)}
                                    className={`flex flex-col items-center flex-1 py-2.5 rounded-xl transition-all relative ${isSelected
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105 z-10'
                                        : 'hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    <span className={`text-[9px] font-black uppercase tracking-tighter mb-0.5 ${isSelected ? 'text-white/80' : 'opacity-60'}`}>
                                        {day.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
                                    </span>
                                    <span className="text-[15px] font-black leading-none">{day.getDate()}</span>
                                    {dayInters.length > 0 && !isSelected && (
                                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary animate-pulse"></div>
                                    )}
                                    {isToday && !isSelected && (
                                        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-amber-500"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        title="Semaine suivante"
                        onClick={() => changeDate(7)}
                        className="w-8 h-12 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
                    </div>

                    <div className="grid gap-4">
                        {selectedDayInters.length > 0 ? (
                            selectedDayInters.map((i, idx) => (
                                <div
                                    key={i.id}
                                    onClick={() => setSelectedIntervention(i)}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                    className={`p-4 rounded-3xl border shadow-sm flex items-center gap-4 active:scale-[0.97] transition-all animate-in fade-in slide-in-from-bottom-4 ${i.status === 'completed'
                                        ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/20 hover:border-emerald-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 hover:border-primary/20'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${i.status === 'completed'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-primary/10 text-primary'
                                        }`}>
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h4 className="font-black text-[14px] text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                                {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                            </h4>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${i.status === 'completed'
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                                    : 'bg-primary/10 text-primary'
                                                    }`}>
                                                    {i.scheduled_date && new Date(i.scheduled_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                            {i.pool?.name || 'Piscine'} • {i.technician?.full_name}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300" />
                                </div>
                            ))
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 opacity-40">
                                    <CalendarIcon size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Journée libre</h3>
                                <p className="text-[11px] font-bold text-slate-300 uppercase">Aucun rendez-vous planifié</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const dayInterventions = getInterventionsForDate(currentDate);
        return (
            <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-primary rounded-[2rem] flex flex-col items-center justify-center text-white shadow-lg shadow-primary/30">
                            <span className="text-[13px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">{currentDate.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                            <span className="text-2xl font-black leading-none">{currentDate.getDate()}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h2>
                            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                {dayInterventions.length} Entretiens prévus
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {dayInterventions.length > 0 ? (
                        dayInterventions.map(i => (
                            <div
                                key={i.id}
                                onClick={() => setSelectedIntervention(i)}
                                className={`group p-5 rounded-[2rem] border shadow-sm transition-all cursor-pointer flex items-center gap-5 ${i.status === 'completed'
                                    ? 'bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-primary/30'
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${i.status === 'completed'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                                    }`}>
                                    <User size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-black uppercase tracking-tight truncate ${i.status === 'completed' ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-800 dark:text-white'}`}>
                                            {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                        </h3>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${i.status === 'completed' ? 'bg-emerald-100/50 dark:bg-emerald-900/30' : 'bg-primary/10'
                                            }`}>
                                            <span className={`text-[13px] font-black uppercase ${i.status === 'completed' ? 'text-emerald-600' : 'text-primary'}`}>
                                                {i.scheduled_date && new Date(i.scheduled_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                            {i.pool?.name || 'Piscine'}
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                        <span className="text-[13px] font-black text-slate-500 uppercase">
                                            {i.technician?.full_name}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-all" />
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-white/30 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Aucun RDV</h3>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const toolbar = (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                    {(['agenda', 'month', 'week', 'day'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm scale-110'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            {mode === 'month' ? 'Mois' : mode === 'week' ? 'Sem' : mode === 'day' ? 'Jour' : 'Agenda'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button title="Précédent" onClick={() => changeDate(-1)} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200/50"><ChevronLeft size={20} /></button>
                    <button title="Aujourd'hui" onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200/50">Aujourd'hui</button>
                    <button title="Suivant" onClick={() => changeDate(1)} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200/50"><ChevronRight size={20} /></button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <PageLayout
                title="PLANNING"
                subtitle={currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                showBackButton={true}
                toolbar={toolbar}
            >
                <div className="animate-in fade-in duration-700 h-full p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-6"></div>
                            <span className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em]">Chargement...</span>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'agenda' && renderAgendaView()}
                            {viewMode === 'month' && renderMonthView()}
                            {viewMode === 'week' && renderWeekView()}
                            {viewMode === 'day' && renderDayView()}
                        </>
                    )}
                </div>

                <button
                    title="Planifier une nouvelle intervention"
                    onClick={() => {
                        setSelectedDate(formatDateKey(currentDate));
                        setIsNewModalOpen(true);
                    }}
                    className="fab-adaptive w-16 h-16 bg-primary text-white rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all"
                >
                    <Plus size={32} strokeWidth={3} />
                </button>

            </PageLayout>

            {
                selectedIntervention && (
                    <InterventionDetailsModal
                        intervention={selectedIntervention as any}
                        onClose={() => setSelectedIntervention(null)}
                        onEdit={(i) => {
                            setEditingInterventionId(i.id);
                            setSelectedIntervention(null);
                        }}
                        onDelete={handleDeleteIntervention}
                    />
                )
            }

            {
                (isNewModalOpen || editingInterventionId) && (
                    <NewIntervention
                        interventionId={editingInterventionId || undefined}
                        scheduledDate={selectedDate || undefined}
                        onClose={() => {
                            setIsNewModalOpen(false);
                            setEditingInterventionId(null);
                            setSelectedDate(null);
                        }}
                        onSuccess={() => {
                            setIsNewModalOpen(false);
                            setEditingInterventionId(null);
                            setSelectedDate(null);
                            fetchInterventions();
                        }}
                    />
                )
            }
        </>
    );
};

export default Planning;
