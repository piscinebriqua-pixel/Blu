import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, QrCode, Receipt } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import BccpLogo from '../components/BccpLogo';
import PageLayout from '../components/PageLayout';
import UserMenu from '../components/UserMenu';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { AnnualPerformanceBentoCard } from '../components/dashboard/AnnualPerformanceBentoCard';
import { PlanningBentoCard } from '../components/dashboard/PlanningBentoCard';
import { CommercialBentoCards } from '../components/dashboard/CommercialBentoCards';
import { ReclamationsBentoCard } from '../components/dashboard/ReclamationsBentoCard';
import { OperationsBentoCards } from '../components/dashboard/OperationsBentoCards';
import { DashboardActivityCard } from '../components/dashboard/DashboardActivityCard';
import { DashboardQrModal } from '../components/dashboard/DashboardQrModal';
import { AdminReclamationModal } from '../components/dashboard/AdminReclamationModal';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const {
        loading,
        counts,
        profile,
        recentInterventions,
        pendingReclamations,
        pendingRecsCount,
        isReclamationsModalOpen,
        setIsReclamationsModalOpen,
        fetchStats
    } = useDashboardStats();

    if (loading) {
        return (
            <div className="gabarit-wrapper flex items-center justify-center h-screen bg-[#0f172a]">
                <div className="flex flex-col items-center gap-4">
                    <BccpLogo width={80} fillColor="white" className="animate-pulse" />
                    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-progress-loading" />
                    </div>
                </div>
            </div>
        );
    }

    const leftContent = (
        <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/10 group-hover:bg-white/30 transition-all shrink-0">
                <BccpLogo variant="emblem" fillColor="white" className="w-8 h-auto transition-all duration-300 group-hover:scale-110 drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-3xl font-black text-white tracking-tighter leading-none">BCCP</h1>
                <p className="text-xs font-black text-blue-100/70 uppercase tracking-[0.2em] leading-none mt-1">
                    Clean and Clean Pool
                </p>
            </div>
        </div>
    );

    const rightContent = (
        <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2">
                {profile?.role === 'admin' && (
                    <>
                        <button 
                            onClick={() => navigate('/factures')}
                            className="min-h-[44px] min-w-[44px] bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10"
                            title="Facturation"
                        >
                            <Receipt size={18} />
                        </button>
                        <button 
                            onClick={() => navigate('/settings')}
                            className="min-h-[44px] min-w-[44px] bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10"
                            title="Configuration"
                        >
                            <Settings size={18} />
                        </button>
                    </>
                )}
                <button 
                    onClick={() => setIsQrModalOpen(true)}
                    className="min-h-[44px] min-w-[44px] bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/70 transition-all border border-white/10 relative"
                    title="QR Code d'accès"
                >
                    <QrCode size={18} />
                    <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-slate-950" />
                </button>
            </div>
            <UserMenu />
        </div>
    );

    return (
        <PageLayout title="" leftContent={leftContent} rightContent={rightContent} className="!p-0">
            <div className="min-h-screen p-6 lg:p-8">
                <div className="bento-dashboard-grid">
                    {/* RANGÉE 1 : PERFORMANCES ANNUELLES & PLANNING (8 + 4 = 12 COLS) */}
                    <AnnualPerformanceBentoCard
                        annualRevenue={counts.annualRevenue}
                        monthlyRevenue={counts.revenue}
                        lastMonthRevenue={counts.lastMonthRevenue}
                        rollingRevenue={counts.rollingRevenue}
                        monthlyBreakdown={counts.monthlyBreakdown}
                    />

                    <PlanningBentoCard counts={counts} />

                    {/* RANGÉE 2 : DEVIS COMMERCIAUX & FACTURATION (6 + 6 = 12 COLS) */}
                    <CommercialBentoCards counts={counts} />

                    {/* RANGÉE 3 : RÉCLAMATIONS CLIENTS (12 COLS) */}
                    <ReclamationsBentoCard 
                        pendingCount={pendingRecsCount}
                        pendingReclamations={pendingReclamations}
                        onOpenModal={() => setIsReclamationsModalOpen(true)}
                    />

                    {/* RANGÉES 4 & 5 & DÉBUT 6 : OPÉRATIONS & SERVICES (10 CARTES BENTO DE 3 COLS) */}
                    <OperationsBentoCards
                        counts={counts}
                        profile={profile}
                        onOpenQrModal={() => setIsQrModalOpen(true)}
                    />

                    {/* FIN RANGÉE 6 : FLUX D'ACTIVITÉ EN CARTE BENTO (6 COLS, FERME LES 12 COLS AVEC ÉQUIPE & PARTENAIRES) */}
                    <DashboardActivityCard interventions={recentInterventions} />
                </div>

                {/* MODALES DÉDIÉES */}
                <DashboardQrModal 
                    isOpen={isQrModalOpen}
                    onClose={() => setIsQrModalOpen(false)}
                />

                <AdminReclamationModal 
                    isOpen={isReclamationsModalOpen}
                    onClose={() => setIsReclamationsModalOpen(false)}
                    onUpdated={fetchStats}
                />
            </div>
        </PageLayout>
    );
};

export default Dashboard;
