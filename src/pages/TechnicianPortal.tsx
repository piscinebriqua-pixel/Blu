import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Calendar,
  Wallet,
  TrendingUp,
  Minus,
  ArrowUpRight,
  ArrowRight,
  User,
  Droplets,
  CheckCircle2,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import NewIntervention from '../components/NewIntervention';
import ModalLayout from '../components/ModalLayout';
import Combobox from '../components/ui/Combobox';
import { toast } from 'react-hot-toast';
import {
  completeTourInterventionQuick,
  markTourInterventionUnvisited,
  postponeTourIntervention,
  cancelTourInterventionOccurrence,
  suspendTourRecurrence,
  syncActiveTours,
  extractNominalAnchorDate,
} from '../lib/recurrenceService';
import { TourCard, type TourIntervention } from '../components/technician/TourCard';
import { TourUnvisitedBacklog } from '../components/technician/TourUnvisitedBacklog';
import { TourUnvisitedModal } from '../components/technician/TourUnvisitedModal';
import { TechnicianFinanceModals } from '../components/technician/TechnicianFinanceModals';

const TechnicianPortal: React.FC = () => {
  const [interventions, setInterventions] = useState<TourIntervention[]>([]);
  const [unvisitedList, setUnvisitedList] = useState<TourIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInter, setSelectedInter] = useState<any>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [arbitrageInter, setArbitrageInter] = useState<TourIntervention | null>(null);

  // Manual intervention state
  const [isManualSelectionOpen, setIsManualSelectionOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selClient, setSelClient] = useState<any>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [selPoolId, setSelPoolId] = useState<string | null>(null);

  // Finance State
  const [balance, setBalance] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [advanceCategories, setAdvanceCategories] = useState<any[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isRemittanceModalOpen, setIsRemittanceModalOpen] = useState(false);
  const [techId, setTechId] = useState<string | null>(null);
  const [isFinancing, setIsFinancing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const fetchDailyTour = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [profileRes, techRes] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', session.user.id),
        supabase.from('technicians').select('id, full_name').eq('email', session.user.email).eq('active', true),
      ]);

      const profileData = profileRes.data?.[0];
      const techData = techRes.data?.[0];
      const currentTechId = techData?.id || null;
      if (currentTechId) setTechId(currentTechId);

      const isAdmin = profileData?.role === 'admin';

      // 1. Synchronisation automatique des tournées récurrentes du jour
      await syncActiveTours(isAdmin ? null : currentTechId);

      const todayStr = new Date().toISOString().split('T')[0];

      // 2. Récupération des interventions du jour
      let tourQuery = supabase
        .from('interventions')
        .select(`
          *,
          pool:pools(
            id, name,
            client:clients(id, first_name, last_name, phone, address, city)
          )
        `)
        .or(`and(status.eq.scheduled,scheduled_date.eq.${todayStr}),and(status.eq.completed,created_at.gte.${todayStr})`)
        .order('scheduled_date', { ascending: true });

      if (!isAdmin && currentTechId) {
        tourQuery = tourQuery.eq('technician_id', currentTechId);
      } else if (!isAdmin && !currentTechId) {
        setInterventions([]);
        setUnvisitedList([]);
        return;
      }

      // 3. Récupération des interventions non visitées en souffrance (Backlog persistant)
      let backlogQuery = supabase
        .from('interventions')
        .select(`
          *,
          pool:pools(
            id, name,
            client:clients(id, first_name, last_name, phone, address, city)
          )
        `)
        .or(`status.eq.unvisited,and(status.eq.scheduled,scheduled_date.lt.${todayStr})`)
        .order('scheduled_date', { ascending: false });

      if (!isAdmin && currentTechId) {
        backlogQuery = backlogQuery.eq('technician_id', currentTechId);
      }

      const [tourRes, backlogRes] = await Promise.all([tourQuery, backlogQuery]);
      if (tourRes.error) throw tourRes.error;

      setInterventions(tourRes.data || []);
      setUnvisitedList(backlogRes.data || []);
    } catch (error) {
      console.error('Error fetching tour:', error);
      toast.error('Erreur lors du chargement de la tournée');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFinanceData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: techData } = await supabase
        .from('technicians')
        .select('id')
        .eq('email', session.user.email)
        .eq('active', true)
        .maybeSingle();

      if (!techData) return;
      const currentTechId = techData.id;

      const [catRes, advCatRes, payRes, expRes, advRes, remRes] = await Promise.all([
        supabase.from('expense_categories').select('*').order('name'),
        supabase.from('advance_categories').select('*').order('name'),
        supabase.from('payments').select('amount').eq('technician_id', currentTechId).neq('method', 'remise'),
        supabase.from('expenses').select('amount').eq('technician_id', currentTechId).eq('status', 'validated'),
        supabase.from('advances').select('amount').eq('technician_id', currentTechId).eq('status', 'validated'),
        supabase.from('remittances').select('amount').eq('technician_id', currentTechId).eq('status', 'validated'),
      ]);

      setCategories(catRes.data || []);
      setAdvanceCategories(advCatRes.data || []);

      const totalPay = payRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalExp = expRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalAdv = advRes.data?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
      const totalRem = remRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      setBalance(totalPay - totalExp - totalAdv - totalRem);
    } catch (error) {
      console.error('Error fetching finance:', error);
    }
  }, []);

  useEffect(() => {
    fetchDailyTour();
    fetchFinanceData();
  }, [fetchDailyTour, fetchFinanceData]);

  // Validation rapide en 1 clic
  const handleQuickComplete = async (inter: TourIntervention) => {
    try {
      const nominalDate = extractNominalAnchorDate(inter);
      const nominalDateStr = nominalDate.toISOString().split('T')[0];

      await completeTourInterventionQuick(inter.id, inter.pool_id, nominalDateStr);
      toast.success('Visite cochée et validée !');
      fetchDailyTour();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la validation');
    }
  };

  const pendingVisits = interventions.filter((i) => i.status === 'scheduled');
  const completedVisits = interventions.filter((i) => i.status === 'completed');

  return (
    <PageLayout
      title="Ma Tournée"
      subtitle="Interventions du jour & Suivi"
      showBackButton={true}
      toolbar={
        <button
          onClick={async () => {
            const { data } = await supabase.from('clients').select('id, first_name, last_name').order('last_name');
            setClients(data || []);
            setIsManualSelectionOpen(true);
          }}
          className="min-h-[44px] min-w-[44px] w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg"
          title="Ajout manuel d'intervention"
        >
          <Calendar size={22} strokeWidth={2.5} />
        </button>
      }
    >
      <div className="flex flex-col gap-6 pb-32">
        {/* Résumé de la date & Nombre de visites */}
        <div className="card-premium vibrant grad-blue shadow-xl shadow-blue-500/20 p-5 sm:p-8 border-none relative overflow-hidden rounded-[24px] sm:rounded-[32px]">
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-100/80 leading-none mb-2">Programme du</p>
              <div className="flex flex-col">
                <span className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-white">
                  {new Date().toLocaleDateString('fr-FR', { day: 'numeric' })}
                </span>
                <span className="text-xl sm:text-3xl font-black uppercase tracking-[0.1em] text-blue-100/90">
                  {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-24 h-24 rounded-2xl shadow-xl flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white leading-none">{pendingVisits.length}</span>
              <span className="text-xs font-black uppercase tracking-[0.1em] text-white/80 mt-1">À Faire</span>
            </div>
          </div>
        </div>

        {/* Bac permanent des clients non visités / En attente */}
        <TourUnvisitedBacklog
          unvisitedList={unvisitedList}
          onQuickComplete={handleQuickComplete}
          onOpenArbitrageModal={(inter) => setArbitrageInter(inter)}
        />

        {/* Widget Ma Caisse */}
        <div className="bg-white dark:bg-slate-800/80 rounded-[32px] p-6 border border-slate-100 dark:border-white/5 shadow-xl">
          <div className="flex justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Wallet size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Ma Caisse</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solde théorique</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-sm opacity-50">TND</span>
              </span>
              <div className="flex items-center gap-1 mt-0.5 text-emerald-500 text-xs font-black uppercase">
                <TrendingUp size={12} />
                <span>Disponible</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={() => { setSelectedCategoryId(''); setIsExpenseModalOpen(true); }}
              className="min-h-[44px] flex flex-col items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl hover:bg-rose-100 transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-rose-500/20 flex items-center justify-center text-rose-600 shadow-sm">
                <Minus size={20} strokeWidth={3} />
              </div>
              <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase">Dépense</span>
            </button>
            <button
              onClick={() => { setSelectedCategoryId(''); setIsAdvanceModalOpen(true); }}
              className="min-h-[44px] flex flex-col items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl hover:bg-amber-100 transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
                <ArrowUpRight size={20} strokeWidth={3} />
              </div>
              <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase">Avance</span>
            </button>
            <button
              onClick={() => setIsRemittanceModalOpen(true)}
              className="min-h-[44px] flex flex-col items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl hover:bg-emerald-100 transition-all active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm">
                <ArrowRight size={20} strokeWidth={3} />
              </div>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">Versement</span>
            </button>
          </div>
        </div>

        {/* Section Tournée du jour */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
              Tournée d'Aujourd'hui
            </h3>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {pendingVisits.length} restante(s) • {completedVisits.length} terminée(s)
            </span>
          </div>

          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800/30 rounded-[24px] animate-pulse" />
            ))
          ) : pendingVisits.length === 0 && completedVisits.length === 0 ? (
            <div className="min-h-[52px] p-4 flex items-center justify-between rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">Aucune visite programmée aujourd'hui</p>
                  <p className="text-xs font-semibold text-slate-500">Votre tournée journalière est à jour</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {pendingVisits.map((inter, idx) => (
                <TourCard
                  key={inter.id}
                  intervention={inter}
                  idx={idx}
                  onQuickComplete={handleQuickComplete}
                  onOpenUnvisitedModal={(i) => setArbitrageInter(i)}
                  onStartFullReport={(i) => { setSelectedInter(i); setIsReporting(true); }}
                />
              ))}

              {/* Visites déjà terminées aujourd'hui */}
              {completedVisits.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1 text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={16} />
                    <span>Visites terminées aujourd'hui ({completedVisits.length})</span>
                  </div>
                  {completedVisits.map((inter, idx) => (
                    <TourCard
                      key={inter.id}
                      intervention={inter}
                      idx={idx}
                      onQuickComplete={() => {}}
                      onOpenUnvisitedModal={() => {}}
                      onStartFullReport={(i) => { setSelectedInter(i); setIsReporting(true); }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal d'arbitrage pour client non visité */}
      {arbitrageInter && (
        <TourUnvisitedModal
          intervention={arbitrageInter}
          onClose={() => setArbitrageInter(null)}
          onMarkUnvisited={async (reason) => {
            await markTourInterventionUnvisited(arbitrageInter.id, reason, arbitrageInter.notes);
            fetchDailyTour();
          }}
          onPostpone={async (newDate, reason) => {
            await postponeTourIntervention(arbitrageInter.id, newDate, reason, arbitrageInter.notes);
            fetchDailyTour();
          }}
          onCancelVisit={async (reason) => {
            const nominalDate = extractNominalAnchorDate(arbitrageInter);
            const nominalDateStr = nominalDate.toISOString().split('T')[0];
            await cancelTourInterventionOccurrence(arbitrageInter.id, arbitrageInter.pool_id, reason, nominalDateStr, arbitrageInter.notes);
            fetchDailyTour();
          }}
          onSuspendLoop={async (reason) => {
            await suspendTourRecurrence(arbitrageInter.pool_id, arbitrageInter.id, reason, arbitrageInter.notes);
            fetchDailyTour();
          }}
        />
      )}

      {/* Modale d'ajout manuel */}
      {isManualSelectionOpen && (
        <ModalLayout
          title="Nouvelle Intervention"
          onClose={() => setIsManualSelectionOpen(false)}
          actions={
            <button
              className="btn-flow btn-primary w-full !h-14"
              disabled={!selPoolId}
              onClick={() => {
                setIsManualSelectionOpen(false);
                setIsReporting(true);
              }}
            >
              SUIVANT <ArrowRight size={18} />
            </button>
          }
        >
          <div className="flex flex-col gap-5">
            <Combobox
              label="Choisir un Client"
              icon={User}
              placeholder="Rechercher un client..."
              options={clients.map((c) => ({ label: `${c.first_name} ${c.last_name}`, value: c.id }))}
              value={selClient?.id || ''}
              onChange={async (val) => {
                const c = clients.find((cl) => cl.id === val);
                if (c) {
                  setSelClient(c);
                  const { data } = await supabase.from('pools').select('id, name').eq('client_id', c.id);
                  setPools(data || []);
                }
              }}
            />
            {selClient && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Choisir un Bassin</label>
                <div className="grid grid-cols-1 gap-2">
                  {pools.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelPoolId(p.id)}
                      className={`min-h-[44px] flex items-center justify-between p-4 rounded-xl border transition-all ${
                        selPoolId === p.id ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <span className="text-sm font-black uppercase">{p.name}</span>
                      {selPoolId === p.id && <Droplets size={16} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalLayout>
      )}

      {/* Rapport complet NewIntervention */}
      {isReporting && (selectedInter || (selClient && selPoolId)) && (
        <NewIntervention
          poolId={selectedInter?.pool_id || selPoolId}
          clientId={selectedInter?.pool?.client?.id || selClient?.id}
          interventionId={selectedInter?.id}
          onClose={() => {
            setIsReporting(false);
            setSelectedInter(null);
            setSelClient(null);
            setSelPoolId(null);
          }}
          onSuccess={() => {
            setIsReporting(false);
            setSelectedInter(null);
            setSelClient(null);
            setSelPoolId(null);
            fetchDailyTour();
            fetchFinanceData();
          }}
        />
      )}

      {/* Modales financières extraites */}
      <TechnicianFinanceModals
        techId={techId}
        isExpenseModalOpen={isExpenseModalOpen}
        setIsExpenseModalOpen={setIsExpenseModalOpen}
        isAdvanceModalOpen={isAdvanceModalOpen}
        setIsAdvanceModalOpen={setIsAdvanceModalOpen}
        isRemittanceModalOpen={isRemittanceModalOpen}
        setIsRemittanceModalOpen={setIsRemittanceModalOpen}
        categories={categories}
        advanceCategories={advanceCategories}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        isFinancing={isFinancing}
        setIsFinancing={setIsFinancing}
        onRefreshFinance={fetchFinanceData}
      />
    </PageLayout>
  );
};

export default TechnicianPortal;
