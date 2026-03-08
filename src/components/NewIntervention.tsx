import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Wallet,
  FileText,
} from "lucide-react";
import ModalLayout from "./ModalLayout";
import TechnicianSelectionModal from "./TechnicianSelectionModal";
import PhotoUpload from "./ui/PhotoUpload";
import AddServiceModal from "./AddServiceModal";
import AddProductModal from "./AddProductModal";
import AddPoolModal from "./AddPoolModal";
import ClientSelectionModal from "./ClientSelectionModal";
import { toast } from "react-hot-toast";
import { recalculateVentilation } from "../lib/paymentService";
import { handlePoolRecurrence } from "../lib/recurrenceService";

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

interface Devis {
  id: string;
  number: string;
  title: string;
  total_amount: number;
  status: 'pending' | 'closed';
}

interface DevisItemConsumption {
  id: string;
  designation: string;
  unit_price: number;
  total_quantity: number;
  consumed: number;
  to_consume: number;
  is_header: boolean;
  unit: string;
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
  const amountInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const [loading, setLoading] = useState(false);
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
    payment_technician_id: "",
    payment_date: new Date().toISOString().split("T")[0],
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
    devis_id: "",
    is_final_devis_billing: false,
  });

  const [interventionType, setInterventionType] = useState<"direct" | "scheduled">(type);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [existingPayment, setExistingPayment] = useState<any>(null);
  const [oldTotalAmount, setOldTotalAmount] = useState(0);
  const [dbClients, setDbClients] = useState<{ id: string; first_name: string; last_name: string; city: string }[]>([]);
  const [dbPools, setDbPools] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || "");
  const [selectedPoolId, setSelectedPoolId] = useState(initialPoolId || "");

  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [dbTechnicians, setDbTechnicians] = useState<Technician[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [referencePrices] = useState<Record<string, number>>({});
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [usedProducts, setUsedProducts] = useState<{ [key: string]: { quantity: number; unitPrice: number } }>({});
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [availableDevis, setAvailableDevis] = useState<Devis[]>([]);
  const [devisConsumption, setDevisConsumption] = useState<DevisItemConsumption[]>([]);

  // Focus amount input when payment is enabled
  const [prevRecordPayment, setPrevRecordPayment] = useState(false);
  useEffect(() => {
    if (formData.record_payment && !prevRecordPayment) {
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 100);
    }
    setPrevRecordPayment(formData.record_payment);
  }, [formData.record_payment, prevRecordPayment]);

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

    if (session.data?.session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.data.session.user.id)
        .single();
      setIsAdmin(profile?.role === "admin");
      console.log(`[BCCP] Rôle détecté: ${profile?.role}, isAdmin: ${profile?.role === "admin"}`);

      if (session.data.session.user.email) {
        const tech = tc.data?.find((t) => t.email === session.data?.session?.user?.email);
        if (tech) {
          setFormData((prev) => ({
            ...prev,
            technician_id: tech.id,
            payment_technician_id: tech.id
          }));
        }
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
          devis_id: data.devis_id || "",
          is_final_devis_billing: false,
        }));

        if (data.status === 'scheduled' || data.status === 'pending') {
          setInterventionType('scheduled');
        } else {
          setInterventionType('direct');
        }

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

        // Calculate old total
        const servicesTotal = data.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
        const productsTotal = data.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
        setOldTotalAmount(servicesTotal + productsTotal);

        // Fetch existing payment
        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("intervention_id", interventionId)
          .maybeSingle();

        if (paymentData) {
          setExistingPayment(paymentData);
          setFormData(prev => ({
            ...prev,
            record_payment: true,
            payment_amount: paymentData.amount.toString(),
            payment_method: paymentData.method,
            payment_technician_id: paymentData.technician_id,
            payment_date: paymentData.payment_date?.split('T')[0] || prev.payment_date,
          }));
        }
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
    if (selectedClientId) {
      fetchPools();
      fetchAvailableDevis();
    }
  }, [selectedClientId, fetchPools]);

  const fetchAvailableDevis = async () => {
    if (!selectedClientId) return;
    const { data } = await supabase
      .from('devis')
      .select('*')
      .eq('client_id', selectedClientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setAvailableDevis(data);
  };

  useEffect(() => {
    const fetchDevisConsumptionData = async () => {
      if (!formData.devis_id) {
        setDevisConsumption([]);
        return;
      }
      try {
        const { data: items } = await supabase.from('devis_items').select('*').eq('devis_id', formData.devis_id).order('id');
        if (!items || items.length === 0) {
          setDevisConsumption([]);
          return;
        }

        const itemIds = items.map(i => i.id);
        const { data: consumptions } = await supabase
          .from('intervention_devis_items')
          .select('devis_item_id, quantity_consumed, intervention_id')
          .in('devis_item_id', itemIds);

        const merged = items.map(item => {
          const priorConsumptions = consumptions?.filter(c => c.devis_item_id === item.id && c.intervention_id !== interventionId) || [];
          const totalPriorConsumed = priorConsumptions.reduce((acc, current) => acc + Number(current.quantity_consumed), 0);

          const currentConsumption = consumptions?.find(c => c.devis_item_id === item.id && c.intervention_id === interventionId);
          const currentlyConsumed = currentConsumption ? Number(currentConsumption.quantity_consumed) : 0;

          return {
            id: item.id,
            designation: item.designation,
            unit_price: Number(item.unit_price) || 0,
            total_quantity: Number(item.quantity) || 0,
            consumed: totalPriorConsumed,
            to_consume: currentlyConsumed,
            is_header: item.is_header,
            unit: item.unit || ''
          };
        });
        setDevisConsumption(merged);
      } catch (err) {
        console.error("Error fetching devis consumption", err);
      }
    };
    fetchDevisConsumptionData();
  }, [formData.devis_id, interventionId]);

  const calculateTotal = () => {
    if (formData.devis_id && !formData.is_final_devis_billing) return 0; // The prompt requires me to update calculateTotal but wait! If is_final_devis_billing is true, we invoice the whole thing. If false, we invoice the parts!

    // Changing the logic:
    if (formData.devis_id && formData.is_final_devis_billing) {
      const selectedDevis = availableDevis.find(d => d.id === formData.devis_id);
      return selectedDevis?.total_amount || 0;
    }

    let devisTotal = 0;
    if (formData.devis_id && !formData.is_final_devis_billing) {
      devisTotal = devisConsumption.reduce((acc, item) => acc + (item.to_consume * item.unit_price), 0);
    }

    const servicesTotal = Object.values(selectedServices).reduce((acc, price) => acc + price, 0);
    const productsTotal = Object.values(usedProducts).reduce((acc, item) => {
      return acc + (item.unitPrice || 0) * item.quantity;
    }, 0);
    return servicesTotal + productsTotal + devisTotal;
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
    let devisTotal = 0;
    if (snapshotFormData.devis_id && !snapshotFormData.is_final_devis_billing) {
      devisTotal = devisConsumption.reduce((acc, item) => acc + (item.to_consume * item.unit_price), 0);
    }
    const localTotalAmount = servicesTotal + productsTotal + devisTotal;

    // We will save devisConsumption state to a snapshot so we can insert them later
    const snapshotDevisConsumption = devisConsumption.map(dc => ({ ...dc }));

    try {
      let tempId = "";
      if (interventionId) {
        const { error } = await supabase.from("interventions").update({
          pool_id: snapshotPoolId || null,
          technician_id: snapshotFormData.technician_id,
          ...(interventionType === "direct" && snapshotFormData.scheduled_date ? { visit_date: snapshotFormData.scheduled_date } : {}),
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
          devis_id: snapshotFormData.devis_id || null,
        }).eq("id", interventionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("interventions").insert([{
          pool_id: snapshotPoolId || null,
          technician_id: snapshotFormData.technician_id,
          ...(interventionType === "direct" && snapshotFormData.scheduled_date ? { visit_date: snapshotFormData.scheduled_date } : {}),
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
          devis_id: snapshotFormData.devis_id || null,
        }]).select().single();
        if (error) throw error;
        tempId = data.id;
      }

      const activeInterId = interventionId || tempId;
      if (!activeInterId) throw new Error("ID d'intervention manquant");

      if (interventionId) {
        await Promise.all([
          supabase.from("intervention_services").delete().eq("intervention_id", interventionId),
          supabase.from("intervention_products").delete().eq("intervention_id", interventionId),
          supabase.from("intervention_devis_items").delete().eq("intervention_id", interventionId)
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

      if (snapshotFormData.devis_id && !snapshotFormData.is_final_devis_billing && snapshotDevisConsumption.length > 0) {
        const itemsToInsert = snapshotDevisConsumption
          .filter(item => item.to_consume > 0 && !item.is_header)
          .map(item => ({
            intervention_id: activeInterId,
            devis_item_id: item.id,
            quantity_consumed: item.to_consume
          }));

        if (itemsToInsert.length > 0) {
          const { error: devisItemsError } = await supabase.from("intervention_devis_items").insert(itemsToInsert);
          if (devisItemsError) throw devisItemsError;
        }
      }

      if (interventionType === "direct") {
        const newPaymentAmount = (snapshotFormData.record_payment && snapshotFormData.payment_amount) ? parseFloat(snapshotFormData.payment_amount) : 0;
        const oldPaymentAmount = existingPayment ? existingPayment.amount : 0;

        if (snapshotFormData.record_payment && snapshotFormData.payment_amount) {
          const paymentPayload = {
            client_id: snapshotClientId,
            intervention_id: activeInterId,
            technician_id: isAdmin ? (snapshotFormData.payment_technician_id || snapshotFormData.technician_id) : snapshotFormData.technician_id,
            amount: newPaymentAmount,
            method: snapshotFormData.payment_method,
            payment_date: isAdmin ? snapshotFormData.payment_date : (existingPayment?.payment_date || new Date().toISOString()),
            notes: `Paiement lors de l'intervention ${activeInterId}`,
          };

          if (existingPayment) {
            await supabase.from("payments").update(paymentPayload).eq("id", existingPayment.id);
          } else {
            await supabase.from("payments").insert([paymentPayload]);
          }
        } else if (existingPayment) {
          // User unchecked "Encaisser", delete the existing payment
          await supabase.from("payments").delete().eq("id", existingPayment.id);
        }

        const { data: clientData } = await supabase.from("clients").select("balance").eq("id", snapshotClientId).single();
        const currentBalance = clientData?.balance || 0;

        // Correct balance calculation for updates:
        // Adjust by (NewPayment - OldPayment) - (NewTotal - OldTotal)
        const balanceAdjustment = (newPaymentAmount - oldPaymentAmount) - (localTotalAmount - oldTotalAmount);
        const newBalance = currentBalance + balanceAdjustment;

        await supabase.from("clients").update({ balance: newBalance }).eq("id", snapshotClientId);

        // --- RECALCULER LA VENTILATION FIFO ---
        await recalculateVentilation(snapshotClientId);
        // --------------------------------------

        // Clôture du devis si facturation finale
        if (snapshotFormData.devis_id && snapshotFormData.is_final_devis_billing) {
          await supabase
            .from('devis')
            .update({ status: 'closed', closed_at: new Date().toISOString() })
            .eq('id', snapshotFormData.devis_id);
        }

        // --- GESTION DE LA RÉCURRENCE ---
        if (snapshotPoolId) {
          await handlePoolRecurrence(snapshotPoolId, snapshotFormData.scheduled_date);
        }
      }

      if (!mountedRef.current) return;
      toast.success(interventionType === 'scheduled' ? 'Intervention planifiée' : 'Rapport enregistré');
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
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
          disabled={loading}
        >
          ANNULER
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-[2] px-8 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:grayscale"
          disabled={loading || !formData.technician_id || !selectedClientId}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Save size={18} />
              {interventionType === 'scheduled' ? "PLANIFIER" : "ENREGISTRER LE RAPPORT"}
            </>
          )}
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
        {/* TYPE TOGGLE */}
        {!interventionId && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mt-2 mx-1">
            <button
              onClick={() => setInterventionType("scheduled")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${interventionType === "scheduled"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              Planifier
            </button>
            <button
              onClick={() => setInterventionType("direct")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${interventionType === "direct"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              Rapport (Direct)
            </button>
          </div>
        )}

        {interventionId && interventionType === 'scheduled' && (
          <div className="mx-1">
            <button
              onClick={() => setInterventionType("direct")}
              className="w-full py-4 bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-2"
            >
              <CheckSquare size={18} />
              Démarrer & Clôturer cette intervention
            </button>
          </div>
        )}

        {/* SECTION 1: CONFIGURATION */}
        <div className="flex flex-col gap-4 p-1">
          {/* Date Selection */}
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

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Client</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase truncate max-w-[200px]">
                  {dbClients.find((c) => c.id === selectedClientId)
                    ? `${dbClients.find((c) => c.id === selectedClientId)?.first_name} ${dbClients.find((c) => c.id === selectedClientId)?.last_name}`
                    : "Choisir un client"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsTechModalOpen(true)}
              className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500/30 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Technicien</span>
                <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase truncate max-w-[200px]">
                  {dbTechnicians.find((t) => t.id === formData.technician_id)?.full_name || "Choisir un technicien"}
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
        </div>

        {/* SECTION 2: ANALYSE EAU (SI DIRECT) */}
        {interventionType === "direct" && (
          <div className="flex flex-col gap-6">
            {/* DEVIS SELECTION */}
            {availableDevis.length > 0 && (
              <div className="mt-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-500/20 rounded-[2rem] animate-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={20} className="text-blue-500" />
                  <h4 className="text-[11px] font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest">Lier à un Chantier / Devis</h4>
                </div>

                <div className="relative mb-4">
                  <select
                    title="Sélectionner un devis (Chantier)"
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all appearance-none"
                    value={formData.devis_id}
                    onChange={(e) => setFormData({ ...formData, devis_id: e.target.value })}
                  >
                    <option value="">-- Visite Classique (Hors Chantier) --</option>
                    {availableDevis.map(d => (
                      <option key={d.id} value={d.id}>{d.number} - {d.title}</option>
                    ))}
                  </select>
                  {formData.devis_id && (
                    <button
                      title="Effacer la sélection"
                      onClick={() => setFormData({ ...formData, devis_id: '', is_final_devis_billing: false })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  )}
                </div>

                {formData.devis_id && (
                  <div className="flex items-center gap-3 p-1">
                    <button
                      title="Activer la facturation finale du devis"
                      onClick={() => setFormData({ ...formData, is_final_devis_billing: !formData.is_final_devis_billing })}
                      className={`w-10 h-6 rounded-full transition-all relative ${formData.is_final_devis_billing ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_final_devis_billing ? 'left-5' : 'left-1'}`} />
                    </button>
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">Facturation Finale du Chantier</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
              <div className="flex items-center gap-2 text-blue-500">
                <FlaskConical size={18} strokeWidth={2.5} />
                <span className="text-[13px] font-black uppercase tracking-[0.3em]">Analyse de l'eau</span>
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
                <span className="text-[14px] font-black uppercase tracking-widest">Niveau d'eau ajusté</span>
              </div>
              {formData.water_level_adjusted ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={2.5} />}
            </button>

            {/* NEW TASKS CHECKLIST (From image) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare size={16} className="text-blue-500" />
                <span className="text-[12px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Tâches d'entretien effectuées</span>
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
                    className={`flex items-center justify-between px-6 py-4 rounded-xl border transition-all text-left ${formData[task.id as keyof typeof formData] ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/10" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-blue-500/20"}`}
                  >
                    <span className="text-[14px] font-black uppercase tracking-tight">{task.label}</span>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${formData[task.id as keyof typeof formData] ? "bg-blue-500 text-white" : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"}`}>
                      {formData[task.id as keyof typeof formData] && <CheckSquare size={16} strokeWidth={3} />}
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
              <span className="text-[13px] font-black uppercase tracking-[0.3em]">Intervention & Coûts</span>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
          </div>

          {/* DEVIS CONSUMPTION SECTION */}
          {formData.devis_id && !formData.is_final_devis_billing && (
            <div className={`p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <FileText size={20} />
                </div>
                <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Articles du Devis Sélectionné</h4>
              </div>

              <div className="space-y-3">
                {devisConsumption.length === 0 ? (
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center py-4">Recherche des articles...</p>
                ) : (
                  devisConsumption.map((item, index) => {
                    if (item.is_header) {
                      return (
                        <div key={item.id} className="pt-4 pb-2">
                          <h5 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.2em]">{item.designation}</h5>
                        </div>
                      );
                    }

                    const remaining = Math.max(0, item.total_quantity - item.consumed);
                    const isFullyConsumed = remaining <= 0;

                    return (
                      <div key={item.id} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${isFullyConsumed ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-60' : item.to_consume > 0 ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-800 dark:text-white truncate">{item.designation}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            PU: <span className="text-blue-500">{item.unit_price} DT</span> <span className="mx-2 opacity-50">|</span> <span className={`${remaining > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>Reste: {remaining} {item.unit}</span>
                          </p>
                        </div>

                        {!isFullyConsumed ? (
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => {
                                const newConsumptions = [...devisConsumption];
                                newConsumptions[index].to_consume = Math.max(0, item.to_consume - 1);
                                setDevisConsumption(newConsumptions);
                              }}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm flex items-center justify-center font-black active:scale-95 transition-all"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-800 dark:text-white">{item.to_consume}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newConsumptions = [...devisConsumption];
                                newConsumptions[index].to_consume = Math.min(remaining, item.to_consume + 1);
                                setDevisConsumption(newConsumptions);
                              }}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-500 shadow-sm flex items-center justify-center font-black active:scale-95 transition-all"
                            >
                              +
                            </button>
                            {Number(remaining) > 0 && Number(remaining) !== Number(item.to_consume) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newConsumptions = [...devisConsumption];
                                  newConsumptions[index].to_consume = remaining;
                                  setDevisConsumption(newConsumptions);
                                }}
                                className="px-2 ml-1 h-8 rounded-lg bg-blue-500/10 text-blue-500 text-[9px] flex items-center justify-center font-black active:scale-95 transition-all hover:bg-blue-500 hover:text-white uppercase tracking-widest shadow-sm border border-blue-500/20 hover:border-blue-500"
                                title="Consommer tout le reste"
                              >
                                Max
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                            <span className="font-black text-[10px] uppercase tracking-widest">Achevé</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SERVICES SECTION */}
          <div className={`p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative transition-all ${formData.devis_id && !formData.is_final_devis_billing ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-glow flex items-center justify-center text-primary">
                  <Waves size={20} />
                </div>
                <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Services Effectués (Hors-Devis)</h4>
              </div>
              {!formData.devis_id && (
                <button
                  title="Ajouter un service"
                  onClick={() => setServiceModalOpen(true)} className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                  <Plus size={18} />
                </button>
              )}
            </div>

            {formData.devis_id && !formData.is_final_devis_billing ? (
              <div className="py-4 text-center">
                <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">🔒 Sélectionnez les articles du devis ci-dessus</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                {Object.entries(selectedServices).map(([sId, price]) => (
                  <div key={sId} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full animate-in zoom-in duration-200">
                    <span className="text-[13px] font-black text-blue-700 dark:text-blue-300 uppercase truncate max-w-[150px]">{dbServices.find(s => s.id === sId)?.name}</span>
                    <span className="text-[11px] font-bold text-blue-500">{price} DT</span>
                    <button onClick={() => { const next = { ...selectedServices }; delete next[sId]; setSelectedServices(next); }} className="text-blue-400 hover:text-red-500" title="Supprimer ce service"><X size={14} strokeWidth={3} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            {Object.entries(usedProducts).map(([pId, item]) => (
              <div key={pId} className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-full animate-in zoom-in duration-200">
                <span className="text-[13px] font-black text-violet-700 dark:text-violet-300 uppercase truncate max-w-[150px]">{dbProducts.find(p => p.id === pId)?.name}</span>
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
            <span className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-400">Preuves & Observations</span>
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

        {/* SECTION 5: RÉSUMÉ & PAIEMENT */}
        {interventionType === "direct" && (
          <div className="space-y-6">
            {/* Subtle technical gradients */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none" />

            {/* Block 1: Total Intervention Display (Indigo Theme) */}
            <div className="bg-indigo-50/50 dark:bg-indigo-500/10 rounded-[2rem] p-6 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 dark:text-indigo-500/60 mb-1">Total de l'intervention</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-indigo-950 dark:text-indigo-50 leading-none">
                    {totalAmount.toFixed(0)}
                  </span>
                  <span className="text-xl font-black text-indigo-200 dark:text-indigo-500/40">DT</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-white dark:bg-indigo-950 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/30 shadow-sm group-hover:scale-110 transition-transform">
                <Calculator size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            {/* Block 2: Payment Details - Vertical Alignment */}
            <div className="bg-white dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/10 p-6 md:p-10 space-y-8 shadow-sm">
              <div className="max-w-xl mx-auto space-y-8">
                {/* 0. Toggle Enable Payment */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Statut Règlement</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, record_payment: !prev.record_payment }))}
                    className={`flex items-center justify-between w-full p-4 rounded-2xl border transition-all duration-300 ${formData.record_payment
                      ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                      : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 hover:border-slate-300"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${formData.record_payment ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                        <Wallet size={16} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">Encaisser le paiement</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${formData.record_payment ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${formData.record_payment ? 'right-1' : 'left-1'}`} />
                    </div>
                  </button>
                </div>

                {formData.record_payment && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* 1. Date (Defaults to intervention date) */}
                    {isAdmin && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Date d'encaissement</label>
                        <div className="relative group">
                          <input
                            type="date"
                            title="Date d'encaissement"
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 font-black text-[13px] uppercase tracking-widest text-slate-700 dark:text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            value={formData.payment_date || formData.scheduled_date}
                            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* 2. Technician (Defaults to intervention technician) */}
                    {isAdmin && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Technicien Récepteur</label>
                        <select
                          title="Technicien Récepteur"
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 font-black text-[13px] uppercase tracking-widest text-slate-700 dark:text-white outline-none focus:border-blue-500 appearance-none cursor-pointer transition-all"
                          value={formData.payment_technician_id || formData.technician_id}
                          onChange={(e) => setFormData({ ...formData, payment_technician_id: e.target.value })}
                        >
                          <option value="">Sélectionner</option>
                          {dbTechnicians.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* 3. Amount Received (Style matching the capture) */}
                    <div className="space-y-3">
                      <div className="bg-violet-50/50 dark:bg-violet-500/10 rounded-[2rem] p-6 border border-violet-100 dark:border-violet-500/20 flex items-center justify-between group hover:border-violet-500/30 transition-all shadow-sm relative overflow-hidden">
                        <div className="flex flex-col flex-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400 dark:text-violet-500/60 mb-2">Montant Reçu / Encaissé</span>
                          <div className="flex items-baseline gap-3 relative">
                            <input
                              ref={amountInputRef}
                              type="number"
                              title="Montant encaissé"
                              placeholder="0"
                              className="bg-transparent border-none outline-none font-black tracking-tighter text-violet-950 dark:text-white p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none massive-amount-input w-[150px]"
                              value={formData.payment_amount}
                              onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                              onFocus={(e) => e.target.select()}
                            />
                            <span className="text-xl font-black text-violet-200 dark:text-violet-500/40 select-none">DT</span>
                          </div>
                        </div>
                        <div className="w-16 h-16 bg-white dark:bg-violet-950 rounded-2xl flex items-center justify-center border border-violet-100 dark:border-violet-500/30 shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                          <Wallet size={28} className="text-violet-500" />
                        </div>
                      </div>
                    </div>

                    {/* 4. Payment Method */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Mode de règlement</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['espèces', 'chèque', 'virement'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_method: method as any })}
                            className={`py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] border-2 transition-all ${formData.payment_method === method
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl scale-105"
                              : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300"}`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
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
