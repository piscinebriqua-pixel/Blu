import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Save,
  Loader2,
  Plus,
  User,
  X,
  FlaskConical,
  Waves,
  CheckSquare,
  Square,
  Calculator,
} from "lucide-react";
import ModalLayout from "./ModalLayout";
import TechnicianSelectionModal from "./TechnicianSelectionModal";
import PhotoUpload from "./ui/PhotoUpload";
import AddServiceModal from "./AddServiceModal";
import AddProductModal from "./AddProductModal";
import AddPoolModal from "./AddPoolModal";
import ClientSelectionModal from "./ClientSelectionModal";
import { toast } from "react-hot-toast";

interface Service {
  id: string;
  name: string;
  price: number;
}
interface Technician {
  id: string;
  full_name: string;
  email?: string;
}
interface Product {
  id: string;
  name: string;
  unit: string;
  price_per_unit: number;
}

interface NewInterventionProps {
  poolId?: string;
  clientId?: string;
  interventionId?: string;
  scheduledDate?: string;
  type?: "direct" | "scheduled";
  onClose: () => void;
  onSuccess: () => void;
}

const NewIntervention: React.FC<NewInterventionProps> = ({
  poolId: initialPoolId,
  clientId: initialClientId,
  interventionId,
  scheduledDate: initialScheduledDate,
  type = "direct",
  onClose,
  onSuccess,
}) => {
  const mountedRef = React.useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const [loading, setLoading] = useState(false);
  const [interventionType, setInterventionType] = useState<"direct" | "scheduled">(type);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);

  const [dbClients, setDbClients] = useState<{ id: string; first_name: string; last_name: string; city: string }[]>([]);
  const [dbPools, setDbPools] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || "");
  const [selectedPoolId, setSelectedPoolId] = useState(initialPoolId || "");

  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [dbTechnicians, setDbTechnicians] = useState<Technician[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  const [isTechnician, setIsTechnician] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [referencePrices] = useState<Record<string, number>>({});
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [usedProducts, setUsedProducts] = useState<{ [key: string]: { quantity: number; unitPrice: number } }>({});
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    technician_id: "",
    ph_level: "",
    chlorine_level: "",
    water_temp: "",
    notes: "",
    water_level_adjusted: false,
    scheduled_date: (initialScheduledDate || new Date().toISOString()).split("T")[0],
    payment_amount: "",
    payment_method: "espèces" as "espèces" | "chèque" | "virement" | "autre",
    record_payment: false,
    photo_before_url: "",
    photo_after_url: "",
    // Maintenance Tasks
    task_balai: false,
    task_lavage: false,
    task_rincage: false,
    task_test_chlore: false,
    task_test_ph: false,
    task_remplissage: false,
    task_panier_prefiltre: false,
    task_traitement: false,
    task_verif_vanne: false,
    task_temps_fonctionnement: false,
  });

  const fetchInitialData = useCallback(async () => {
    const [sv, tc, pr, cl, session] = await Promise.all([
      supabase.from("services").select("*").order("name"),
      supabase.from("technicians").select("id, full_name, email").order("full_name"),
      supabase.from("inventory_products").select("*").order("name"),
      supabase.from("clients").select("id, first_name, last_name, city").order("last_name"),
      supabase.auth.getSession(),
    ]);

    if (sv.data) setDbServices(sv.data);
    if (tc.data) setDbTechnicians(tc.data);
    if (pr.data) setDbProducts(pr.data);
    if (cl.data) setDbClients(cl.data);

    if (session.data?.session?.user?.email) {
      const tech = tc.data?.find((t) => t.email === session.data?.session?.user?.email);
      if (tech) {
        setFormData((prev) => ({ ...prev, technician_id: tech.id }));
        setIsTechnician(true);
      }
    }
  }, []);

  const fetchExistingIntervention = useCallback(async () => {
    if (!interventionId) return;

    try {
      const { data, error } = await supabase
        .from("interventions")
        .select(`
          *,
          pool:pools(client_id),
          services:intervention_services(service_id, price_at_time),
          products:intervention_products(product_id, quantity, total_price)
        `)
        .eq("id", interventionId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedClientId(data.pool?.client_id || "");
        setSelectedPoolId(data.pool_id || "");
        setFormData(prev => ({
          ...prev,
          technician_id: data.technician_id || "",
          ph_level: data.ph_level?.toString() || "",
          chlorine_level: data.chlorine_level?.toString() || "",
          water_temp: data.water_temp?.toString() || "",
          notes: data.notes || "",
          water_level_adjusted: data.water_level_adjusted || false,
          scheduled_date: data.scheduled_date ? data.scheduled_date.split('T')[0] : prev.scheduled_date,
          photo_before_url: data.photo_before_url || "",
          photo_after_url: data.photo_after_url || "",
          task_balai: data.task_balai || false,
          task_lavage: data.task_lavage || false,
          task_rincage: data.task_rincage || false,
          task_test_chlore: data.task_test_chlore || false,
          task_test_ph: data.task_test_ph || false,
          task_remplissage: data.task_remplissage || false,
          task_panier_prefiltre: data.task_panier_prefiltre || false,
          task_traitement: data.task_traitement || false,
          task_verif_vanne: data.task_verif_vanne || false,
          task_temps_fonctionnement: data.task_temps_fonctionnement || false,
        }));

        const srvObj: Record<string, number> = {};
        data.services?.forEach((s: any) => {
          srvObj[s.service_id] = s.price_at_time;
        });
        setSelectedServices(srvObj);

        const prdObj: Record<string, { quantity: number; unitPrice: number }> = {};
        data.products?.forEach((p: any) => {
          prdObj[p.product_id] = {
            quantity: p.quantity,
            unitPrice: p.quantity > 0 ? p.total_price / p.quantity : 0
          };
        });
        setUsedProducts(prdObj);
      }
    } catch (error) {
      console.error("Error fetching intervention:", error);
    }
  }, [interventionId]);

  useEffect(() => {
    fetchInitialData();
    if (interventionId) {
      fetchExistingIntervention();
    }
  }, [fetchInitialData, fetchExistingIntervention, interventionId]);

  const fetchPools = useCallback(async () => {
    if (!selectedClientId) {
      setDbPools([]);
      return;
    }
    const { data } = await supabase.from("pools").select("id, name").eq("client_id", selectedClientId);
    if (data) {
      setDbPools(data);
      if (data.length > 0) {
        if (!selectedPoolId || !data.find(p => p.id === selectedPoolId)) {
          setSelectedPoolId(data[0].id);
        }
      } else {
        setSelectedPoolId("");
      }
    }
  }, [selectedClientId, selectedPoolId]);

  useEffect(() => {
    if (selectedClientId) fetchPools();
  }, [selectedClientId, fetchPools]);

  const calculateTotal = () => {
    const servicesTotal = Object.values(selectedServices).reduce((acc, price) => acc + price, 0);
    const productsTotal = Object.values(usedProducts).reduce((acc, item) => {
      return acc + (item.unitPrice || 0) * item.quantity;
    }, 0);
    return servicesTotal + productsTotal;
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!formData.technician_id) {
      toast.error("Veuillez sélectionner un technicien");
      return;
    }
    setLoading(true);

    const snapshotServices = { ...selectedServices };
    const snapshotProducts = { ...usedProducts };
    const snapshotClientId = selectedClientId;
    const snapshotPoolId = selectedPoolId;
    const snapshotFormData = { ...formData };

    const servicesTotal = Object.values(snapshotServices).reduce((a, p) => a + p, 0);
    const productsTotal = Object.values(snapshotProducts).reduce((a, item) => {
      return a + (item.unitPrice || 0) * item.quantity;
    }, 0);
    const localTotalAmount = servicesTotal + productsTotal;

    try {
      let tempId = "";
      if (interventionId) {
        const { error } = await supabase.from("interventions").update({
          technician_id: snapshotFormData.technician_id,
          ph_level: interventionType === "direct" && snapshotFormData.ph_level ? parseFloat(snapshotFormData.ph_level) : null,
          chlorine_level: interventionType === "direct" && snapshotFormData.chlorine_level ? parseFloat(snapshotFormData.chlorine_level) : null,
          water_temp: interventionType === "direct" && snapshotFormData.water_temp ? parseFloat(snapshotFormData.water_temp) : null,
          water_level_adjusted: interventionType === "direct" ? snapshotFormData.water_level_adjusted : false,
          notes: snapshotFormData.notes,
          status: interventionType === "direct" ? "completed" : "scheduled",
          scheduled_date: snapshotFormData.scheduled_date || null,
          photo_before_url: snapshotFormData.photo_before_url,
          photo_after_url: snapshotFormData.photo_after_url,
          task_balai: snapshotFormData.task_balai,
          task_lavage: snapshotFormData.task_lavage,
          task_rincage: snapshotFormData.task_rincage,
          task_test_chlore: snapshotFormData.task_test_chlore,
          task_test_ph: snapshotFormData.task_test_ph,
          task_remplissage: snapshotFormData.task_remplissage,
          task_panier_prefiltre: snapshotFormData.task_panier_prefiltre,
          task_traitement: snapshotFormData.task_traitement,
          task_verif_vanne: snapshotFormData.task_verif_vanne,
          task_temps_fonctionnement: snapshotFormData.task_temps_fonctionnement,
        }).eq("id", interventionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("interventions").insert([{
          pool_id: snapshotPoolId || null,
          technician_id: snapshotFormData.technician_id,
          ph_level: interventionType === "direct" && snapshotFormData.ph_level ? parseFloat(snapshotFormData.ph_level) : null,
          chlorine_level: interventionType === "direct" && snapshotFormData.chlorine_level ? parseFloat(snapshotFormData.chlorine_level) : null,
          water_temp: interventionType === "direct" && snapshotFormData.water_temp ? parseFloat(snapshotFormData.water_temp) : null,
          water_level_adjusted: interventionType === "direct" ? snapshotFormData.water_level_adjusted : false,
          notes: snapshotFormData.notes,
          status: interventionType === "direct" ? "completed" : "scheduled",
          scheduled_date: snapshotFormData.scheduled_date || null,
          photo_before_url: snapshotFormData.photo_before_url,
          photo_after_url: snapshotFormData.photo_after_url,
          task_balai: snapshotFormData.task_balai,
          task_lavage: snapshotFormData.task_lavage,
          task_rincage: snapshotFormData.task_rincage,
          task_test_chlore: snapshotFormData.task_test_chlore,
          task_test_ph: snapshotFormData.task_test_ph,
          task_remplissage: snapshotFormData.task_remplissage,
          task_panier_prefiltre: snapshotFormData.task_panier_prefiltre,
          task_traitement: snapshotFormData.task_traitement,
          task_verif_vanne: snapshotFormData.task_verif_vanne,
          task_temps_fonctionnement: snapshotFormData.task_temps_fonctionnement,
        }]).select().single();
        if (error) throw error;
        tempId = data.id;
      }

      const activeInterId = interventionId || tempId;
      if (!activeInterId) throw new Error("ID d'intervention manquant");

      if (interventionId) {
        await Promise.all([
          supabase.from("intervention_services").delete().eq("intervention_id", interventionId),
          supabase.from("intervention_products").delete().eq("intervention_id", interventionId)
        ]);
      }

      if (Object.keys(snapshotServices).length > 0) {
        const { error: srvError } = await supabase.from("intervention_services").insert(
          Object.entries(snapshotServices).map(([sId, price]) => ({
            intervention_id: activeInterId,
            service_id: sId,
            price_at_time: price,
          }))
        );
        if (srvError) throw srvError;
      }

      if (Object.keys(snapshotProducts).length > 0) {
        const { error: prodError } = await supabase.from("intervention_products").insert(
          Object.entries(snapshotProducts).map(([pId, item]) => {
            return {
              intervention_id: activeInterId,
              product_id: pId,
              quantity: item.quantity,
              total_price: item.unitPrice * item.quantity,
            };
          })
        );
        if (prodError) throw prodError;
      }

      if (interventionType === "direct") {
        if (snapshotFormData.record_payment && snapshotFormData.payment_amount) {
          await supabase.from("payments").insert([{
            client_id: snapshotClientId,
            intervention_id: activeInterId,
            technician_id: snapshotFormData.technician_id,
            amount: parseFloat(snapshotFormData.payment_amount),
            method: snapshotFormData.payment_method,
            notes: `Paiement lors de l'intervention ${activeInterId}`,
          }]);
        }
        const { data: clientData } = await supabase.from("clients").select("balance").eq("id", snapshotClientId).single();
        const currentBalance = clientData?.balance || 0;
        const paymentReceived = (snapshotFormData.record_payment && snapshotFormData.payment_amount) ? parseFloat(snapshotFormData.payment_amount) : 0;
        const newBalance = currentBalance + paymentReceived - localTotalAmount;
        await supabase.from("clients").update({ balance: newBalance }).eq("id", snapshotClientId);
      }

      if (!mountedRef.current) return;
      toast.success(interventionId ? 'Rapport mis à jour' : 'Rapport enregistré');
      onSuccess();
      onClose();
    } catch (error: any) {
      if (!mountedRef.current) return;
      console.error("Submit error:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  const actions = (
    <div className="flex flex-col w-full gap-4">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-200 transition-all flex-1"
          disabled={loading}
        >
          ANNULER
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="h-[58px] flex-[2] relative overflow-hidden group rounded-2xl font-black uppercase tracking-widest text-xs transition-all bg-blue-600 shadow-lg text-white hover:scale-[1.02] disabled:opacity-40"
          disabled={loading || !formData.technician_id || !selectedClientId}
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={20} strokeWidth={2.5} /> ENREGISTRER</>}
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <ModalLayout
      title={
        interventionType === "direct"
          ? "RAPPORT D'INTERVENTION"
          : "PLANIFIER UNE INTERVENTION"
      }
      onClose={onClose}
      actions={actions}
    >
      <div className="flex flex-col gap-8 pb-32">
        {/* SECTION 1: CONFIGURATION */}
        <div className="flex flex-col gap-4 p-1">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Client</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase truncate max-w-[120px]">
                  {dbClients.find((c) => c.id === selectedClientId)
                    ? `${dbClients.find((c) => c.id === selectedClientId)?.first_name} ${dbClients.find((c) => c.id === selectedClientId)?.last_name}`
                    : "Choisir"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsTechModalOpen(true)}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Technicien</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase truncate max-w-[120px]">
                  {dbTechnicians.find((t) => t.id === formData.technician_id)?.full_name || "Choisir"}
                </span>
              </div>
            </button>
          </div>

          {/* Pool Selection */}
          {selectedClientId && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Bassin Concerné</label>
                <button
                  type="button"
                  onClick={() => setIsPoolModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                >
                  <Plus size={12} strokeWidth={3} /> Nouveau
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {dbPools.length > 0 ? (
                  dbPools.map(pool => (
                    <button
                      key={pool.id}
                      type="button"
                      onClick={() => setSelectedPoolId(pool.id)}
                      className={`px-6 py-4 rounded-2xl border-2 font-black uppercase tracking-tight text-xs transition-all whitespace-nowrap ${selectedPoolId === pool.id ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-blue-500/30"}`}
                    >
                      {pool.name}
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] font-bold text-slate-400 italic px-2">Aucun bassin trouvé</p>
                )}
              </div>
            </div>
          )}

          <div className="relative">
            <input
              type="date"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              aria-label="Date de l'intervention"
              title="Date de l'intervention"
            />
          </div>
        </div>

        {/* SECTION 2: ANALYSE EAU (SI DIRECT) */}
        {interventionType === "direct" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
              <div className="flex items-center gap-2 text-blue-500">
                <FlaskConical size={18} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Analyse de l'eau</span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">pH</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="7.2"
                  className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-black text-center text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                  value={formData.ph_level}
                  onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chlore</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="1.5"
                  className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-black text-center text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-sm"
                  value={formData.chlorine_level}
                  onChange={(e) => setFormData({ ...formData, chlorine_level: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temp.</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="28"
                    className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-black text-center text-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-sm placeholder:opacity-50"
                    value={formData.water_temp}
                    onChange={(e) => setFormData({ ...formData, water_temp: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">°C</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, water_level_adjusted: !formData.water_level_adjusted })}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${formData.water_level_adjusted ? "bg-blue-500 border-blue-500 text-white shadow-lg" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 hover:border-blue-500/20"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${formData.water_level_adjusted ? "bg-white text-blue-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>
                  <Waves size={16} strokeWidth={3} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Niveau d'eau ajusté</span>
              </div>
              {formData.water_level_adjusted ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={2.5} />}
            </button>

            {/* NEW TASKS CHECKLIST (From image) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare size={16} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Tâches d'entretien effectuées</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'task_balai', label: 'Balai' },
                  { id: 'task_lavage', label: 'Lavage' },
                  { id: 'task_rincage', label: 'Rinçage' },
                  { id: 'task_test_chlore', label: 'Teste Chlore' },
                  { id: 'task_test_ph', label: 'Teste PH' },
                  { id: 'task_remplissage', label: 'Remplissage' },
                  { id: 'task_panier_prefiltre', label: 'Panier Pré-filtre' },
                  { id: 'task_traitement', label: 'Traitement' },
                  { id: 'task_verif_vanne', label: 'Vérification Vanne' },
                  { id: 'task_temps_fonctionnement', label: 'Temps Fonct.' }
                ].map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, [task.id]: !formData[task.id as keyof typeof formData] })}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${formData[task.id as keyof typeof formData] ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/10" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-blue-500/20"}`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-tight">{task.label}</span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${formData[task.id as keyof typeof formData] ? "bg-blue-500 text-white" : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"}`}>
                      {formData[task.id as keyof typeof formData] && <CheckSquare size={14} strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: SERVICES & PRODUITS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
            <div className="flex items-center gap-2 text-violet-500">
              <Calculator size={18} strokeWidth={2.5} />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Intervention & Coûts</span>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
          </div>

          <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            {Object.entries(selectedServices).map(([sId, price]) => (
              <div key={sId} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full animate-in zoom-in duration-200">
                <span className="text-[11px] font-black text-blue-700 dark:text-blue-300 uppercase truncate max-w-[150px]">{dbServices.find(s => s.id === sId)?.name}</span>
                <span className="text-[11px] font-bold text-blue-500">{price} DT</span>
                <button onClick={() => { const next = { ...selectedServices }; delete next[sId]; setSelectedServices(next); }} className="text-blue-400 hover:text-red-500" title="Supprimer ce service"><X size={14} strokeWidth={3} /></button>
              </div>
            ))}
            {Object.entries(usedProducts).map(([pId, item]) => (
              <div key={pId} className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-full animate-in zoom-in duration-200">
                <span className="text-[11px] font-black text-violet-700 dark:text-violet-300 uppercase truncate max-w-[150px]">{dbProducts.find(p => p.id === pId)?.name}</span>
                <span className="text-[11px] font-bold text-violet-500">x{item.quantity} ({item.unitPrice} DT)</span>
                <button onClick={() => { const next = { ...usedProducts }; delete next[pId]; setUsedProducts(next); }} className="text-violet-400 hover:text-red-500" title="Supprimer ce produit"><X size={14} strokeWidth={3} /></button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setServiceModalOpen(true)}
              className="px-6 py-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:border-blue-500/20 active:scale-95 transition-all shadow-sm"
            >
              <Plus size={16} strokeWidth={3} /> Ajouter Prestation
            </button>
            <button
              onClick={() => setProductModalOpen(true)}
              className="px-6 py-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:border-blue-500/20 active:scale-95 transition-all shadow-sm"
            >
              <Plus size={16} strokeWidth={3} /> Ajouter Produit
            </button>
          </div>
        </div>

        {/* SECTION 4: PHOTOS & NOTES */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Preuves & Observations</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
          </div>

          <div className="grid grid-cols-2 gap-4 h-48">
            <PhotoUpload
              label="Avant"
              currentUrl={formData.photo_before_url}
              onUploadComplete={(url) => setFormData({ ...formData, photo_before_url: url })}
            />
            <PhotoUpload
              label="Après"
              currentUrl={formData.photo_after_url}
              onUploadComplete={(url) => setFormData({ ...formData, photo_after_url: url })}
            />
          </div>

          <textarea
            placeholder="Notes techniques, observations particulières..."
            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 font-medium text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* SECTION 5: PAIEMENT & RÉSUMÉ (SI DIRECT) */}
        {interventionType === "direct" && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Total Intervention</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter">{totalAmount.toFixed(0)}</span>
                    <span className="text-xl font-bold opacity-60">DT</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-white/10 p-2 pr-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <button type="button"
                      onClick={() => setFormData(prev => ({ ...prev, record_payment: !prev.record_payment }))}
                      className={`w-12 h-6 rounded-full relative transition-all ${formData.record_payment ? "bg-white" : "bg-white/20"}`}
                      aria-label="Enregistrer le paiement"
                      title="Enregistrer le paiement"
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${formData.record_payment ? "left-7 bg-blue-600" : "left-1 bg-white"}`} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest">Reçu ?</span>
                  </div>

                  {formData.record_payment && (
                    <div className="animate-in slide-in-from-left-4 duration-300">
                      <input
                        type="number"
                        placeholder="Montant"
                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-4 font-black text-xl placeholder:text-white/40 focus:bg-white/20 outline-none transition-all"
                        value={formData.payment_amount}
                        onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {formData.record_payment && (
                  <div className="flex flex-col gap-2 pt-1 animate-in slide-in-from-right-4 duration-300">
                    <select
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-3 font-bold text-[10px] uppercase tracking-widest outline-none focus:bg-white/20 appearance-none cursor-pointer"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                      title="Mode de paiement"
                    >
                      <option value="espèces" className="text-slate-900">💵 Espèces</option>
                      <option value="chèque" className="text-slate-900">✍️ Chèque</option>
                      <option value="virement" className="text-slate-900">📱 Virement</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isClientModalOpen && (
        <ClientSelectionModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSelect={(c) => {
            setSelectedClientId(c.id);
            setIsClientModalOpen(false);
          }}
          selectedClientId={selectedClientId}
        />
      )}
      {isTechModalOpen && (
        <TechnicianSelectionModal
          isOpen={isTechModalOpen}
          onClose={() => setIsTechModalOpen(false)}
          onSelect={(id) => {
            setFormData({ ...formData, technician_id: id });
            setIsTechModalOpen(false);
          }}
          selectedTechId={formData.technician_id}
        />
      )}
      {serviceModalOpen && (
        <AddServiceModal
          availableServices={dbServices.filter((s) => selectedServices[s.id] === undefined)}
          referencePrices={referencePrices}
          onClose={() => setServiceModalOpen(false)}
          onAdd={(sId, price) => {
            setSelectedServices((prev) => ({ ...prev, [sId]: price }));
            setServiceModalOpen(false);
          }}
        />
      )}
      {productModalOpen && (
        <AddProductModal availableProducts={dbProducts.filter((p) => usedProducts[p.id] === undefined)} onClose={() => setProductModalOpen(false)}
          onAdd={(pId, quantity, unitPrice) => { setUsedProducts((prev) => ({ ...prev, [pId]: { quantity, unitPrice } })); setProductModalOpen(false); }} />
      )}
      {isPoolModalOpen && (
        <AddPoolModal clientId={selectedClientId} onClose={() => setIsPoolModalOpen(false)} onSuccess={() => { fetchPools(); setIsPoolModalOpen(false); }} />
      )}
    </ModalLayout>
  );
};

export default NewIntervention;
