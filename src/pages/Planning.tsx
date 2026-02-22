import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Clock,
    User,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NewIntervention from '../components/NewIntervention';
import InterventionDetailsModal from '../components/InterventionDetailsModal';

interface Intervention {
    id: string;
    pool_id: string;
    visit_date: string;
    created_at: string;
    status: string;
    scheduled_date: string;
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
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const fetchInterventions = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('interventions')
                .select(`
                    *,
                    technician:technicians!technician_id(full_name),
                    pool:pools(
                        name,
                        client:clients(id, first_name, last_name)
                    )
                `)
                .neq('status', 'cancelled');

            if (error) throw error;
            setInterventions(data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInterventions();
    }, [fetchInterventions]);

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

    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

    const getInterventionsForDate = (date: Date) => {
        const key = formatDateKey(date);
        return interventions.filter(i => {
            const interDate = i.scheduled_date || i.visit_date || i.created_at;
            return interDate.startsWith(key);
        });
    };

    const renderMonthView = () => {
        const days = getDaysInMonth(currentDate);
        const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        return (
            <div className="flex flex-col animate-in fade-in duration-500">
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
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
                                className={`min-h-[80px] md:min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer group ${isCurrentMonth
                                    ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-40'
                                    } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''} hover:border-blue-500/50 hover:shadow-lg`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-black ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                                        {day.getDate()}
                                    </span>
                                    {dayInterventions.length > 0 && (
                                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black">
                                            {dayInterventions.length}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    {dayInterventions.slice(0, 3).map(i => (
                                        <div
                                            key={i.id}
                                            className="text-[8px] md:text-[9px] font-bold py-0.5 px-1.5 rounded-md truncate bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30"
                                        >
                                            {i.pool?.client?.last_name || 'Client'}
                                        </div>
                                    ))}
                                    {dayInterventions.length > 3 && (
                                        <span className="text-[8px] text-slate-400 font-bold ml-1">+{dayInterventions.length - 3} de plus</span>
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
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
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
                                                className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-500 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate">
                                                        {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] font-medium text-slate-400 uppercase truncate">
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

    const renderDayView = () => {
        const dayInterventions = getInterventionsForDate(currentDate);
        return (
            <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">{currentDate.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                            <span className="text-2xl font-black leading-none">{currentDate.getDate()}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {dayInterventions.length} Entretiens prévus
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsNewModalOpen(true)}
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
                                className="group bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all cursor-pointer flex items-center gap-5"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <User size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                            {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 bg-blue-50/50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                                            <Clock size={12} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-blue-600 uppercase">
                                                {new Date(i.scheduled_date || i.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                                            {i.pool?.name || 'Piscine'}
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">
                                            {i.technician?.full_name}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all">
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
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Cliquez sur le + pour planifier</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="gabarit-wrapper">
            <header className="header-gradient flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all backdrop-blur-md"
                        title="Retour au Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight">Planning RDV</h1>
                        <p className="text-blue-100 text-xs font-medium opacity-80 uppercase tracking-widest">
                            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/10 shadow-lg relative">
                    {loading && (
                        <div className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </div>
                    )}
                    {(['month', 'week', 'day'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode
                                ? 'bg-white text-blue-600 shadow-md scale-105'
                                : 'text-white/60 hover:text-white'
                                }`}
                            title={`Vue ${mode === 'month' ? 'Mensuelle' : mode === 'week' ? 'Hebdomadaire' : 'Journalière'}`}
                        >
                            {mode === 'month' ? 'Mois' : mode === 'week' ? 'Sem' : 'Jour'}
                        </button>
                    ))}
                </div>
            </header>

            <main className="main-container !pb-24">
                {/* Navigation Bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => changeDate(-1)}
                            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
                            title="Précédent"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={() => {
                                setCurrentDate(new Date());
                                setViewMode('month');
                            }}
                            className="px-6 h-12 bg-white dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
                        >
                            Aujourd'hui
                        </button>
                        <button
                            onClick={() => changeDate(1)}
                            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
                            title="Suivant"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planifié</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminé</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Content */}
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => {
                    setSelectedDate(formatDateKey(new Date()));
                    setIsNewModalOpen(true);
                }}
                className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-30"
                aria-label="Nouveau RDV"
            >
                <Plus size={32} strokeWidth={3} />
            </button>

            {/* Modals */}
            {isNewModalOpen && (
                <NewIntervention
                    scheduledDate={selectedDate || undefined}
                    onClose={() => {
                        setIsNewModalOpen(false);
                        setSelectedDate(null);
                    }}
                    onSuccess={() => {
                        setIsNewModalOpen(false);
                        setSelectedDate(null);
                        fetchInterventions();
                    }}
                />
            )}

            {selectedIntervention && (
                <InterventionDetailsModal
                    intervention={selectedIntervention as any}
                    onClose={() => setSelectedIntervention(null)}
                    onEdit={() => {
                        // Handle edit if needed
                    }}
                />
            )}
        </div>
    );
};

export default Planning;
