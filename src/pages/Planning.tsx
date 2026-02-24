import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Clock,
    User,
    ArrowLeft,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NewIntervention from '../components/NewIntervention';
import InterventionDetailsModal from '../components/InterventionDetailsModal';
import { toast } from 'react-hot-toast';

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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
                .select('*, technician:technicians(full_name), pool:pools(name, client:clients(id, first_name, last_name))')
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
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && viewMode === 'month') {
                setViewMode('agenda');
            }
        };

        handleResize(); // Initial check
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

        // Add padding from previous month
        const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = startPadding; i > 0; i--) {
            days.push(new Date(year, month, 1 - i));
        }

        // Add days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        // Add padding for next month
        const endPadding = 42 - days.length;
        for (let i = 1; i <= endPadding; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    };

    const getDaysInWeek = (date: Date) => {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Start with Monday
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

            // Database stores ISO strings: YYYY-MM-DDTHH:MM:SS...
            // Extracting the first 10 characters is the most reliable comparison
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
                        <div key={d} className="text-center text-[13px] font-black text-slate-500 uppercase tracking-widest py-2">
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
                                    } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''} hover:border-blue-500/50 hover:shadow-lg`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[13px] font-black ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                                        {day.getDate()}
                                    </span>
                                    {dayInterventions.length > 0 && (
                                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[13px] font-black">
                                            {dayInterventions.length}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    {dayInterventions.slice(0, 3).map(i => {
                                        const isDone = i.status === 'completed';
                                        return (
                                            <div
                                                key={i.id}
                                                className={`text-xs md:text-[13px] font-bold py-0.5 px-1.5 rounded-md truncate border ${isDone
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/30'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/30'
                                                    }`}
                                            >
                                                {i.pool?.client?.last_name || 'Client'}
                                            </div>
                                        );
                                    })}
                                    {dayInterventions.length > 3 && (
                                        <span className="text-xs text-slate-500 font-bold ml-1">+{dayInterventions.length - 3} de plus</span>
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
                                <div className={`p-4 rounded-3xl border text-center transition-all ${isToday ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                    <p className={`text-[13px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-blue-100' : 'text-slate-500'}`}>
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
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-500'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${i.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                                    <span className={`text-[13px] font-black uppercase truncate ${i.status === 'completed' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                                                        {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-500 uppercase truncate">
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
                                        className="py-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-slate-300 hover:text-blue-500 hover:border-blue-500/50 transition-all flex items-center justify-center"
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
                {/* 7-Day Navigation Strip - Integrated Look */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => changeDate(-7)}
                        className="w-8 h-12 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90"
                        title="Semaine précédente"
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
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105 z-10'
                                        : 'hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    <span className={`text-[9px] font-black uppercase tracking-tighter mb-0.5 ${isSelected ? 'text-blue-100' : 'opacity-60'}`}>
                                        {day.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
                                    </span>
                                    <span className="text-[15px] font-black leading-none">{day.getDate()}</span>

                                    {/* Intelligence Dot: shows if appointments exist */}
                                    {dayInters.length > 0 && !isSelected && (
                                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
                                    )}
                                    {isToday && !isSelected && (
                                        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-amber-500"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => changeDate(7)}
                        className="w-8 h-12 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90"
                        title="Semaine suivante"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Agenda List */}
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
                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                        }`}>
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h4 className="font-black text-[14px] text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                                {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                            </h4>
                                            <div className="flex items-center gap-1.5">
                                                {i.status === 'completed' && (
                                                    <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">Fait</span>
                                                )}
                                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${i.status === 'completed'
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
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
                        <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-lg shadow-blue-500/30">
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
                    <button
                        onClick={() => {
                            setSelectedDate(formatDateKey(currentDate));
                            setIsNewModalOpen(true);
                        }}
                        className="w-14 h-14 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all"
                        title="Ajouter RDV"
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {dayInterventions.length > 0 ? (
                        dayInterventions.map(i => (
                            <div
                                key={i.id}
                                onClick={() => setSelectedIntervention(i)}
                                className={`group p-5 rounded-[2rem] border shadow-sm transition-all cursor-pointer flex items-center gap-5 ${i.status === 'completed'
                                    ? 'bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-blue-500/30'
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${i.status === 'completed'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                                    }`}>
                                    <User size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-black uppercase tracking-tight truncate ${i.status === 'completed' ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-800 dark:text-white'}`}>
                                            {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                        </h3>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${i.status === 'completed' ? 'bg-emerald-100/50 dark:bg-emerald-900/30' : 'bg-blue-50/50 dark:bg-blue-900/30'
                                            }`}>
                                            {i.status === 'completed' ? <Check size={12} className="text-emerald-500" /> : <Clock size={12} className="text-blue-500" />}
                                            <span className={`text-[13px] font-black uppercase ${i.status === 'completed' ? 'text-emerald-600' : 'text-blue-600'}`}>
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
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${i.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-300 group-hover:bg-blue-500 group-hover:text-white'
                                    }`}>
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-white/30 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                                <CalendarIcon size={40} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Aucun RDV</h3>
                            <p className="text-slate-500 text-base font-bold uppercase tracking-widest mt-2">Cliquez sur le + pour planifier</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="gabarit-wrapper">
            <header className="header-gradient !pt-10 !pb-20 relative overflow-visible">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-md shrink-0 border border-white/10"
                            title="Retour au Tableau de Bord"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 onClick={() => setViewMode('month')} className="text-lg font-black text-white leading-tight cursor-pointer hover:opacity-80 transition-opacity">
                                PLANNING
                            </h1>
                            <p className="text-blue-100 text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">
                                {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex bg-black/20 backdrop-blur-xl rounded-2xl p-1 border border-white/5 shadow-2xl shrink-0">
                        {(['agenda', 'month', 'week', 'day'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode
                                    ? 'bg-white text-blue-600 shadow-lg scale-105'
                                    : 'text-white/50 hover:text-white'
                                    }`}
                            >
                                {mode === 'month' ? 'Mois' : mode === 'week' ? 'Sem' : mode === 'day' ? 'Jour' : 'Agenda'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Integrated Controls for Desktop/Non-Agenda */}
                {viewMode !== 'agenda' && (
                    <div className="absolute -bottom-6 left-10 right-10 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <button
                                onClick={() => changeDate(-1)}
                                className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xl border border-slate-100 dark:border-slate-700/50 hover:scale-105 active:scale-95 transition-all"
                                title="Précédent"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-6 h-12 bg-white dark:bg-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white shadow-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 transition-all"
                            >
                                AUJOURD'HUI
                            </button>
                            <button
                                onClick={() => changeDate(1)}
                                className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xl border border-slate-100 dark:border-slate-700/50 hover:scale-105 active:scale-95 transition-all"
                                title="Suivant"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <main className="main-container !pt-10 !pb-24">
                {/* Specific Agenda Navigation Bar (Mobile-friendly) */}
                {viewMode === 'agenda' && (
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="bg-white dark:bg-slate-800 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/50 active:scale-95 transition-all"
                        >
                            AUJOURD'HUI
                        </button>
                    </div>
                )}

                {/* Calendar Content */}
                {viewMode === 'agenda' && renderAgendaView()}
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => {
                    setSelectedDate(formatDateKey(currentDate));
                    setIsNewModalOpen(true);
                }}
                className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-30"
                aria-label="Nouveau RDV"
            >
                <Plus size={32} strokeWidth={3} />
            </button>

            {/* Modals */}

            {selectedIntervention && (
                <InterventionDetailsModal
                    intervention={selectedIntervention as any}
                    onClose={() => setSelectedIntervention(null)}
                    onEdit={(i) => {
                        setEditingInterventionId(i.id);
                        setSelectedIntervention(null);
                    }}
                    onDelete={handleDeleteIntervention}
                />
            )}

            {(isNewModalOpen || editingInterventionId) && (
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
            )}
        </div>
    );
};

export default Planning;
