import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { recalculateVentilation } from "../../lib/paymentService";
import { handlePoolRecurrence } from "../../lib/recurrenceService";
import type {
  Service,
  Technician,
  Product,
  Devis,
  DevisItemConsumption,
  NewInterventionFormData,
  NewInterventionProps,
} from "./types";

export function useNewInterventionState({
  poolId: initialPoolId,
  clientId: initialClientId,
  interventionId,
  scheduledDate: initialScheduledDate,
  type = "direct",
  onClose,
  onSuccess,
}: NewInterventionProps) {
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NewInterventionFormData>({
    technician_id: "",
    ph_level: "",
    chlorine_level: "",
    water_temp: "",
    notes: "",
    water_level_adjusted: false,
    scheduled_date: (initialScheduledDate || new Date().toISOString()).split("T")[0],
    payment_amount: "",
    payment_method: "espèces",
    payment_technician_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    record_payment: false,
    photo_before_url: "",
    photo_after_url: "",
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
    completed_date: "",
  });

  const [interventionType, setInterventionType] = useState<"direct" | "scheduled">(type);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

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
  const [usedProducts, setUsedProducts] = useState<{ [key: string]: { quantity: number; unitPrice: number } }>({});
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

  // Initial data loading
  const fetchInitialData = useCallback(async () => {
    const [sv, tc, pr, cl, session] = await Promise.all([
      supabase.from("services").select("*").order("name"),
      supabase.from("technicians").select("id, full_name, email").eq("active", true).order("full_name"),
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

      if (session.data.session.user.email) {
        const tech = tc.data?.find((t: Technician) => t.email === session.data?.session?.user?.email);
        if (tech) {
          setFormData((prev) => ({
            ...prev,
            technician_id: tech.id,
            payment_technician_id: tech.id,
          }));
        }
      }
    }
  }, []);

  // Existing intervention fetching
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
        setFormData((prev) => ({
          ...prev,
          technician_id: data.technician_id || "",
          ph_level: data.ph_level?.toString() || "",
          chlorine_level: data.chlorine_level?.toString() || "",
          water_temp: data.water_temp?.toString() || "",
          notes: data.notes || "",
          water_level_adjusted: data.water_level_adjusted || false,
          scheduled_date: data.scheduled_date ? data.scheduled_date.split("T")[0] : prev.scheduled_date,
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
          completed_date: data.completed_date ? data.completed_date.split("T")[0] : "",
        }));

        if (type === "direct" || (data.status !== "scheduled" && data.status !== "pending")) {
          setInterventionType("direct");
        } else {
          setInterventionType("scheduled");
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
            unitPrice: p.quantity > 0 ? p.total_price / p.quantity : 0,
          };
        });
        setUsedProducts(prdObj);

        const servicesTotal = data.services?.reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0) || 0;
        const productsTotal = data.products?.reduce((acc: number, p: any) => acc + (p.total_price || 0), 0) || 0;
        setOldTotalAmount(servicesTotal + productsTotal);

        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("intervention_id", interventionId)
          .maybeSingle();

        if (paymentData) {
          setExistingPayment(paymentData);
          setFormData((prev) => ({
            ...prev,
            record_payment: true,
            payment_amount: paymentData.amount.toString(),
            payment_method: paymentData.method,
            payment_technician_id: paymentData.technician_id,
            payment_date: paymentData.payment_date?.split("T")[0] || prev.payment_date,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching intervention:", error);
    }
  }, [interventionId, type]);

  useEffect(() => {
    fetchInitialData();
    if (interventionId) {
      fetchExistingIntervention();
    }
  }, [fetchInitialData, fetchExistingIntervention, interventionId]);

  // Pools fetching
  const fetchPools = useCallback(async () => {
    if (!selectedClientId) {
      setDbPools([]);
      return;
    }
    const { data } = await supabase.from("pools").select("id, name").eq("client_id", selectedClientId);
    if (data) {
      setDbPools(data);
      if (data.length > 0) {
        if (!selectedPoolId || !data.find((p) => p.id === selectedPoolId)) {
          setSelectedPoolId(data[0].id);
        }
      } else {
        setSelectedPoolId("");
      }
    }
  }, [selectedClientId, selectedPoolId]);

  // Devis fetching
  const fetchAvailableDevis = useCallback(async () => {
    if (!selectedClientId) return;
    const { data } = await supabase
      .from("devis")
      .select("*")
      .eq("client_id", selectedClientId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data) setAvailableDevis(data);
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchPools();
      fetchAvailableDevis();
    }
  }, [selectedClientId, fetchPools, fetchAvailableDevis]);

  // Devis items consumption fetching
  useEffect(() => {
    const fetchDevisConsumptionData = async () => {
      if (!formData.devis_id) {
        setDevisConsumption([]);
        return;
      }
      try {
        const { data: items } = await supabase
          .from("devis_items")
          .select("*")
          .eq("devis_id", formData.devis_id)
          .order("id");
        if (!items || items.length === 0) {
          setDevisConsumption([]);
          return;
        }

        const itemIds = items.map((i) => i.id);
        const { data: consumptions } = await supabase
          .from("intervention_devis_items")
          .select("devis_item_id, quantity_consumed, intervention_id")
          .in("devis_item_id", itemIds);

        const merged: DevisItemConsumption[] = items.map((item) => {
          const priorConsumptions =
            consumptions?.filter((c) => c.devis_item_id === item.id && c.intervention_id !== interventionId) || [];
          const totalPriorConsumed = priorConsumptions.reduce((acc, current) => acc + Number(current.quantity_consumed), 0);

          const currentConsumption = consumptions?.find(
            (c) => c.devis_item_id === item.id && c.intervention_id === interventionId
          );
          const currentlyConsumed = currentConsumption ? Number(currentConsumption.quantity_consumed) : 0;

          return {
            id: item.id,
            designation: item.designation,
            unit_price: Number(item.unit_price) || 0,
            total_quantity: Number(item.quantity) || 0,
            consumed: totalPriorConsumed,
            to_consume: currentlyConsumed,
            is_header: item.is_header,
            unit: item.unit || "",
          };
        });
        setDevisConsumption(merged);
      } catch (err) {
        console.error("Error fetching devis consumption", err);
      }
    };
    fetchDevisConsumptionData();
  }, [formData.devis_id, interventionId]);

  // Total calculation
  const calculateTotal = useCallback(() => {
    if (formData.devis_id && formData.is_final_devis_billing) {
      const selectedDevis = availableDevis.find((d) => d.id === formData.devis_id);
      return selectedDevis?.total_amount || 0;
    }

    let devisTotal = 0;
    if (formData.devis_id && !formData.is_final_devis_billing) {
      devisTotal = devisConsumption.reduce((acc, item) => acc + item.to_consume * item.unit_price, 0);
    }

    const servicesTotal = Object.values(selectedServices).reduce((acc, price) => acc + price, 0);
    const productsTotal = Object.values(usedProducts).reduce((acc, item) => {
      return acc + (item.unitPrice || 0) * item.quantity;
    }, 0);
    return servicesTotal + productsTotal + devisTotal;
  }, [formData.devis_id, formData.is_final_devis_billing, availableDevis, devisConsumption, selectedServices, usedProducts]);

  const totalAmount = calculateTotal();

  // Handle Submit
  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!selectedPoolId) {
      toast.error("Veuillez sélectionner ou créer un bassin pour ce client");
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
    const productsTotal = Object.values(snapshotProducts).reduce((a, item) => a + (item.unitPrice || 0) * item.quantity, 0);
    let devisTotal = 0;
    if (snapshotFormData.devis_id && !snapshotFormData.is_final_devis_billing) {
      devisTotal = devisConsumption.reduce((acc, item) => acc + item.to_consume * item.unit_price, 0);
    }
    const localTotalAmount = servicesTotal + productsTotal + devisTotal;
    const snapshotDevisConsumption = devisConsumption.map((dc) => ({ ...dc }));

    try {
      let tempId = "";
      const interventionPayload = {
        pool_id: snapshotPoolId || null,
        technician_id: snapshotFormData.technician_id,
        ph_level: interventionType === "direct" && snapshotFormData.ph_level ? parseFloat(snapshotFormData.ph_level) : null,
        chlorine_level:
          interventionType === "direct" && snapshotFormData.chlorine_level ? parseFloat(snapshotFormData.chlorine_level) : null,
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
        completed_date: interventionType === "direct" ? snapshotFormData.scheduled_date || new Date().toISOString() : null,
      };

      if (interventionId) {
        const { error } = await supabase.from("interventions").update(interventionPayload).eq("id", interventionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("interventions").insert([interventionPayload]).select().single();
        if (error) throw error;
        tempId = data.id;
      }

      const activeInterId = interventionId || tempId;
      if (!activeInterId) throw new Error("ID d'intervention manquant");

      if (interventionId) {
        await Promise.all([
          supabase.from("intervention_services").delete().eq("intervention_id", interventionId),
          supabase.from("intervention_products").delete().eq("intervention_id", interventionId),
          supabase.from("intervention_devis_items").delete().eq("intervention_id", interventionId),
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
          Object.entries(snapshotProducts).map(([pId, item]) => ({
            intervention_id: activeInterId,
            product_id: pId,
            quantity: item.quantity,
            total_price: item.unitPrice * item.quantity,
          }))
        );
        if (prodError) throw prodError;
      }

      if (snapshotFormData.devis_id && !snapshotFormData.is_final_devis_billing && snapshotDevisConsumption.length > 0) {
        const itemsToInsert = snapshotDevisConsumption
          .filter((item) => item.to_consume > 0 && !item.is_header)
          .map((item) => ({
            intervention_id: activeInterId,
            devis_item_id: item.id,
            quantity_consumed: item.to_consume,
          }));

        if (itemsToInsert.length > 0) {
          const { error: devisItemsError } = await supabase.from("intervention_devis_items").insert(itemsToInsert);
          if (devisItemsError) throw devisItemsError;
        }
      }

      if (interventionType === "direct") {
        const newPaymentAmount =
          snapshotFormData.record_payment && snapshotFormData.payment_amount ? parseFloat(snapshotFormData.payment_amount) : 0;
        const oldPaymentAmount = existingPayment ? existingPayment.amount : 0;

        if (snapshotFormData.record_payment && snapshotFormData.payment_amount) {
          const paymentPayload = {
            client_id: snapshotClientId,
            intervention_id: activeInterId,
            technician_id: isAdmin
              ? snapshotFormData.payment_technician_id || snapshotFormData.technician_id
              : snapshotFormData.technician_id,
            amount: newPaymentAmount,
            method: snapshotFormData.payment_method,
            payment_date: isAdmin
              ? snapshotFormData.payment_date
              : existingPayment?.payment_date || new Date().toISOString(),
            notes: `Paiement lors de l'intervention ${activeInterId}`,
          };

          if (existingPayment) {
            await supabase.from("payments").update(paymentPayload).eq("id", existingPayment.id);
          } else {
            await supabase.from("payments").insert([paymentPayload]);
          }
        } else if (existingPayment) {
          await supabase.from("payments").delete().eq("id", existingPayment.id);
        }

        const { data: clientData } = await supabase.from("clients").select("balance").eq("id", snapshotClientId).single();
        const currentBalance = clientData?.balance || 0;
        const balanceAdjustment = newPaymentAmount - oldPaymentAmount - (localTotalAmount - oldTotalAmount);
        const newBalance = currentBalance + balanceAdjustment;

        await supabase.from("clients").update({ balance: newBalance }).eq("id", snapshotClientId);

        await recalculateVentilation(snapshotClientId);

        if (snapshotFormData.devis_id && snapshotFormData.is_final_devis_billing) {
          await supabase
            .from("devis")
            .update({ status: "closed", closed_at: new Date().toISOString() })
            .eq("id", snapshotFormData.devis_id);
        }

        if (snapshotPoolId) {
          await handlePoolRecurrence(snapshotPoolId, snapshotFormData.scheduled_date);
        }
      }

      if (!mountedRef.current) return;
      toast.success(interventionType === "scheduled" ? "Intervention planifiée" : "Rapport enregistré");
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

  return {
    loading,
    formData,
    setFormData,
    interventionType,
    setInterventionType,
    selectedClientId,
    setSelectedClientId,
    selectedPoolId,
    setSelectedPoolId,
    dbClients,
    dbPools,
    dbServices,
    dbTechnicians,
    dbProducts,
    availableDevis,
    devisConsumption,
    setDevisConsumption,
    selectedServices,
    setSelectedServices,
    referencePrices,
    usedProducts,
    setUsedProducts,
    isAdmin,
    totalAmount,
    amountInputRef,
    isClientModalOpen,
    setIsClientModalOpen,
    isTechModalOpen,
    setIsTechModalOpen,
    isPoolModalOpen,
    setIsPoolModalOpen,
    serviceModalOpen,
    setServiceModalOpen,
    productModalOpen,
    setProductModalOpen,
    fetchPools,
    handleSubmit,
  };
}
