import React, { useState } from 'react';
import {
    Users,
    Check,
    AlertTriangle,
    ChevronRight,
    MapPin,
    Camera,
    FlaskConical,
    TestTube,
    Droplets,
    ArrowLeft,
    Sun
} from 'lucide-react';
import '../design.css';

const MockupShowcase: React.FC = () => {
    const [view, setView] = useState<'dash' | 'detail'>('dash');

    if (view === 'dash') {
        return (
            <div className="gabarit-wrapper">
                <header className="header-gradient">
                    <div className="flex justify-between items-center mb-6">
                        <h1>DeepBlue Flow</h1>
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                            <Sun size={20} />
                        </div>
                    </div>
                    <p>Good morning, Team!</p>
                </header>

                <main className="main-container">
                    <div className="progress-container">
                        <div className="flex justify-between items-center text-sm font-bold mb-2">
                            <span>4/8 Pools Visited</span>
                            <button className="text-primary bg-primary-light/30 px-4 py-1 rounded-full text-xs">View Map</button>
                        </div>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: '50%' }}></div>
                        </div>
                    </div>

                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Today's Schedule</h2>

                    <div className="flex flex-col gap-3">
                        <div className="flow-card" onClick={() => setView('detail')}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-500 rounded-xl">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Hotel Blue Lagoon</h3>
                                    <p className="text-xs text-slate-400">Pratc Man</p>
                                </div>
                            </div>
                            <div className="status-dot bg-amber-500">
                                <AlertTriangle size={14} />
                            </div>
                        </div>

                        {['Villa del Sol', 'Residence Aqua', 'Oasis Resort', 'Oasis Resort'].map((name, i) => (
                            <div key={i} className="flow-card">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 text-blue-500 rounded-xl">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{name}</h3>
                                        <p className="text-xs text-slate-400">Location area</p>
                                    </div>
                                </div>
                                <div className="status-dot bg-green-500">
                                    <Check size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="gabarit-wrapper">
            <header className="px-6 pt-6 pb-2 flex items-center justify-between">
                <button title="Retour" onClick={() => setView('dash')} className="btn-back-flow">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-blue-500/30">
                    <Sun size={14} /> Outdoor Mode
                </div>
            </header>

            <main className="main-container !mt-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Current Status</h2>
                        <p className="text-sm text-slate-400">Hotel Blue Lagoon</p>
                    </div>
                </div>

                <div className="gauge-container">
                    <div className="circular-gauge">
                        <div className="gauge-circle">
                            <svg className="absolute w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#FF4D4D" strokeWidth="8" strokeDasharray="251" strokeDashoffset="60" strokeLinecap="round" />
                            </svg>
                            <span className="gauge-value">6.8</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">pH Level</span>
                    </div>

                    <div className="circular-gauge">
                        <div className="gauge-circle">
                            <svg className="absolute w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#00D2FF" strokeWidth="8" strokeDasharray="251" strokeDashoffset="180" strokeLinecap="round" />
                            </svg>
                            <div className="flex flex-col items-center">
                                <span className="gauge-value">3.2</span>
                                <span className="text-[10px] text-slate-400">ppm</span>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Chlorine</span>
                    </div>
                </div>

                <div className="action-grid">
                    <div className="action-item">
                        <FlaskConical className="text-green-500" size={24} />
                        <span>Alkalnity</span>
                    </div>
                    <div className="action-item">
                        <TestTube className="text-blue-500" size={24} />
                        <span>Stabilizer</span>
                    </div>
                    <div className="action-item">
                        <Droplets className="text-red-500" size={24} />
                        <span>Calcium</span>
                    </div>
                </div>

                <div className="photo-dropzone">
                    <Camera size={28} className="mx-auto mb-2 text-blue-500" />
                    <p className="text-xs font-bold">Drag & Drop Photos</p>
                    <p className="text-[10px]">Before / After</p>
                </div>

                <button className="btn-complete" onClick={() => setView('dash')}>
                    Complete Service
                </button>
            </main>
        </div>
    );
};

export default MockupShowcase;
