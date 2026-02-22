import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Check,
  Droplets,
  Save,
  Loader2,
  CheckSquare,
  Square,
  Plus,
  Minus,
  Wallet,
  Calculator,
  ThermometerSun,
  FlaskConical,
  ArrowRight,
  User,
} from "lucide-react";
import ModalLayout from "./ModalLayout";
import TechnicianSelectionModal from "./TechnicianSelectionModal";
import PhotoUpload from "./ui/PhotoUpload";
import Combobox from "./ui/Combobox";
import AddServiceModal from "./AddServiceModal";
import AddProductModal from "./AddProductModal";
import { Globe } from "lucide-react";

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
  onClose: () => void;
  onSuccess: () => void;
}

const NewIntervention: React.FC<NewInterventionProps> = ({
  poolId: initialPoolId,
  clientId: initialClientId,
  interventionId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [interventionType, setInterventionType] = useState<
    "direct" | "scheduled"
  >("direct");
  const [tab, setTab] = useState<
    "client" | "tech" | "photos" | "services" | "products" | "summary"
  >(initialClientId ? "tech" : "client");

  const [dbClients, setDbClients] = useState<
    { id: string; first_name: string; last_name: string; city: string }[]
  >([]);
  const [dbPools, setDbPools] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(
    initialClientId || "",
  );
  const [selectedPoolId, setSelectedPoolId] = useState(initialPoolId || "");

  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [dbTechnicians, setDbTechnicians] = useState<Technician[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  // Auth & Permissions

  const [isTechnician, setIsTechnician] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);

  const [selectedServices, setSelectedServices] = useState<
    Record<string, number>
  >({});
  const [referencePrices, setReferencePrices] = useState<
    Record<string, number>
  >({});
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [usedProducts, setUsedProducts] = useState<{ [key: string]: number }>(
    {},
  );
  const [formData, setFormData] = useState({
    technician_id: "",
    ph_level: "",
    chlorine_level: "",
    water_temp: "",
    notes: "",
    water_level_adjusted: false,
    scheduled_date: new Date().toISOString().split("T")[0],
    payment_amount: "",
    payment_method: "espèces" as "espèces" | "chèque" | "virement" | "autre",
    record_payment: false,
    photo_before_url: "",
    photo_after_url: "",
  });

  const fetchInitialData = useCallback(async () => {
    const [sv, tc, pr, cl, session] = await Promise.all([
      supabase.from("services").select("*").order("name"),
      supabase
        .from("technicians")
        .select("id, full_name, email")
        .order("full_name"),
      supabase.from("inventory_products").select("*").order("name"),
      supabase
        .from("clients")
        .select("id, first_name, last_name, city")
        .order("last_name"),
      supabase.auth.getSession(),
    ]);

    if (sv.data) setDbServices(sv.data);

    const techList = tc.data || [];
    if (tc.data) setDbTechnicians(techList);
    if (pr.data) setDbProducts(pr.data);
    if (cl.data) setDbClients(cl.data);

    const userEmail = session.data.session?.user?.email;
    // Auto-assign if user is a technician
    if (userEmail && techList.length > 0) {
      const matchedTech = techList.find((t) => t.email === userEmail);
      if (matchedTech) {
        setFormData((prev) => ({ ...prev, technician_id: matchedTech.id }));
        setIsTechnician(true);
      }
    }
  }, []);

  const fetchExistingIntervention = useCallback(async () => {
    if (!interventionId) return;
    const { data, error } = await supabase
      .from("interventions")
      .select(
        `
            *,
            intervention_services(service_id, price_at_time),
            intervention_products(product_id, quantity)
        `,
      )
      .eq("id", interventionId)
      .single();

    if (data && !error) {
      setFormData((prev) => ({
        ...prev,
        technician_id: data.technician_id || "",
        ph_level: data.ph_level?.toString() || "",
        chlorine_level: data.chlorine_level?.toString() || "",
        water_temp: data.water_temp?.toString() || "",
        notes: data.notes || "",
        water_level_adjusted: data.water_level_adjusted,
        scheduled_date: data.scheduled_date
          ? data.scheduled_date.split("T")[0]
          : prev.scheduled_date,
        photo_before_url: data.photo_before_url || "",
        photo_after_url: data.photo_after_url || "",
      }));

      if (data.intervention_services) {
        const svcs: Record<string, number> = {};
        (
          data.intervention_services as {
            service_id: string;
            price_at_time: number;
          }[]
        ).forEach((s) => {
          svcs[s.service_id] = s.price_at_time;
        });
        setSelectedServices(svcs);
      }

      if (data.intervention_products) {
        const prods: Record<string, number> = {};
        (
          data.intervention_products as {
            product_id: string;
            quantity: number;
          }[]
        ).forEach((p) => {
          prods[p.product_id] = p.quantity;
        });
        setUsedProducts(prods);
      }

      // If it's a scheduled intervention being started, default to direct rapport mode
      if (data.status === "scheduled") setInterventionType("direct");
    }
  }, [interventionId]);

  useEffect(() => {
    fetchInitialData();
    if (interventionId) fetchExistingIntervention();
  }, [interventionId, fetchExistingIntervention, fetchInitialData]);

  const fetchClientHistory = useCallback(async () => {
    // Fetch last 50 intervention services for this client to find last paid prices
    const { data } = await supabase
      .from("interventions")
      .select("id, intervention_services(service_id, price_at_time)")
      .eq("pool_id", selectedPoolId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      const history: Record<string, number> = {};
      // Iterate in reverse to let newer overwrite older (though we fetched desc, we want the *first* occurrence found)
      // Actually, we want the MOST RECENT usage. data is desc.
      data.forEach((intervention) => {
        if (intervention.intervention_services) {
          (
            intervention.intervention_services as {
              service_id: string;
              price_at_time: number;
            }[]
          ).forEach((is) => {
            // If we haven't seen this service yet, it's the most recent one
            if (history[is.service_id] === undefined) {
              history[is.service_id] = is.price_at_time;
            }
          });
        }
      });
      setReferencePrices(history);
    }
  }, [selectedPoolId]);

  useEffect(() => {
    if (selectedClientId) {
      supabase
        .from("pools")
        .select("id, name")
        .eq("client_id", selectedClientId)
        .then(({ data }) => {
          const pools = data || [];
          setDbPools(pools);
          if (pools.length > 0 && !selectedPoolId) {
            setSelectedPoolId(pools[0].id);
          }
        });
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedClientId) fetchClientHistory();
  }, [selectedClientId, fetchClientHistory]);

  const handleProductQty = (pId: string, delta: number) => {
    setUsedProducts((prev) => {
      const current = prev[pId] || 0;
      const newVal = Math.max(0, current + delta);
      if (newVal === 0) {
        const rest = { ...prev };
        delete rest[pId];
        return rest;
      }
      return { ...prev, [pId]: newVal };
    });
  };

  const calculateTotal = () => {
    const servicesTotal = Object.values(selectedServices).reduce(
      (acc, price) => acc + price,
      0,
    );

    const productsTotal = Object.entries(usedProducts).reduce(
      (acc, [pId, qty]) => {
        const product = dbProducts.find((p) => p.id === pId);
        return acc + (product?.price_per_unit || 0) * qty;
      },
      0,
    );

    return servicesTotal + productsTotal;
  };

  const handleSubmit = async () => {
    if (!formData.technician_id) {
      alert("Veuillez sélectionner un technicien");
      setTab("tech");
      return;
    }
    setLoading(true);

    try {
      let tempId = "";

      if (interventionId) {
        // Update existing
        const { error: interError } = await supabase
          .from("interventions")
          .update({
            technician_id: formData.technician_id,
            ph_level:
              interventionType === "direct" && formData.ph_level
                ? parseFloat(formData.ph_level)
                : null,
            chlorine_level:
              interventionType === "direct" && formData.chlorine_level
                ? parseFloat(formData.chlorine_level)
                : null,
            water_temp:
              interventionType === "direct" && formData.water_temp
                ? parseFloat(formData.water_temp)
                : null,
            water_level_adjusted:
              interventionType === "direct"
                ? formData.water_level_adjusted
                : false,
            notes: formData.notes,
            status: interventionType === "direct" ? "completed" : "scheduled",
            scheduled_date:
              interventionType === "scheduled" ? formData.scheduled_date : null,
            photo_before_url: formData.photo_before_url,
            photo_after_url: formData.photo_after_url,
          })
          .eq("id", interventionId);

        if (interError) throw interError;
        // For simplicity, we assume if we are editing we might want to refresh services/products
        // But in 'Starting' flow, people usually add them now.
      } else {
        // Insert new
        const { data: interData, error: interError } = await supabase
          .from("interventions")
          .insert([
            {
              pool_id: selectedPoolId,
              technician_id: formData.technician_id,
              ph_level:
                interventionType === "direct" && formData.ph_level
                  ? parseFloat(formData.ph_level)
                  : null,
              chlorine_level:
                interventionType === "direct" && formData.chlorine_level
                  ? parseFloat(formData.chlorine_level)
                  : null,
              water_temp:
                interventionType === "direct" && formData.water_temp
                  ? parseFloat(formData.water_temp)
                  : null,
              water_level_adjusted:
                interventionType === "direct"
                  ? formData.water_level_adjusted
                  : false,
              notes: formData.notes,
              status: interventionType === "direct" ? "completed" : "scheduled",
              scheduled_date:
                interventionType === "scheduled"
                  ? formData.scheduled_date
                  : null,
              photo_before_url: formData.photo_before_url,
              photo_after_url: formData.photo_after_url,
            },
          ])
          .select()
          .single();

        if (interError) throw interError;
        tempId = interData.id;
      }

      const activeInterId = interventionId || tempId;

      if (interventionId) {
        await supabase
          .from("intervention_services")
          .delete()
          .eq("intervention_id", interventionId);

        await supabase
          .from("intervention_products")
          .delete()
          .eq("intervention_id", interventionId);
      }

      if (Object.keys(selectedServices).length > 0) {
        await supabase.from("intervention_services").insert(
          Object.entries(selectedServices).map(([sId, price]) => ({
            intervention_id: activeInterId,
            service_id: sId,
            price_at_time: price,
          })),
        );
      }

      const productEntries = Object.entries(usedProducts);
      if (productEntries.length > 0) {
        await supabase.from("intervention_products").insert(
          productEntries.map(([pId, qty]) => {
            const p = dbProducts.find((prod) => prod.id === pId);
            return {
              intervention_id: activeInterId,
              product_id: pId,
              quantity: qty,
              total_price: (p?.price_per_unit || 0) * qty,
            };
          }),
        );
      }

      if (
        interventionType === "direct" &&
        formData.record_payment &&
        formData.payment_amount
      ) {
        await supabase.from("payments").insert([
          {
            client_id: selectedClientId,
            intervention_id: activeInterId,
            technician_id: formData.technician_id,
            amount: parseFloat(formData.payment_amount),
            method: formData.payment_method,
            notes: `Paiement lors de l'intervention ${activeInterId}`,
          },
        ]);
      }

      // --- MISE À JOUR DU SOLDE CLIENT ---
      if (interventionType === "direct") {
        // 1. Récupérer le solde actuel
        const { data: clientData, error: clientFetchError } = await supabase
          .from("clients")
          .select("balance")
          .eq("id", selectedClientId)
          .single();

        if (clientFetchError) throw clientFetchError;

        const currentBalance = clientData?.balance || 0;
        const paymentReceived = (formData.record_payment && formData.payment_amount)
          ? parseFloat(formData.payment_amount)
          : 0;

        // Calcul du nouveau solde : Ancien + Paiement - Coût
        const newBalance = currentBalance + paymentReceived - totalAmount;

        // 2. Mettre à jour dans la base
        const { error: balanceUpdateError } = await supabase
          .from("clients")
          .update({ balance: newBalance })
          .eq("id", selectedClientId);

        if (balanceUpdateError) throw balanceUpdateError;
      }
      // ------------------------------------

      onSuccess();
      onClose();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  const actions = (
    <div className="flex-column w-full gap-3">
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-black text-muted uppercase tracking-widest">
          Coût estimé
        </span>
        <span className="text-xl font-black text-white">
          {totalAmount.toFixed(0)} DT
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 bg-white/5 text-muted font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors flex-1"
          disabled={loading}
        >
          Fermer
        </button>
        <button
          type="button"
          onClick={() => {
            if (tab === "client") setTab("tech");
            else if (tab === "tech") {
              if (interventionType === "scheduled") setTab("services");
              else setTab("photos");
            } else if (tab === "photos") setTab("services");
            else if (tab === "services") {
              if (interventionType === "scheduled") setTab("summary");
              else setTab("products");
            } else if (tab === "products") setTab("summary");
            else if (tab === "summary") handleSubmit();
          }}
          className={`btn-primary h-[54px] flex-[2] ${tab === "summary" ? "!bg-status-green" : ""} ${!formData.technician_id && tab !== "client" ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={loading || (tab !== "client" && !formData.technician_id)}
          title={
            !formData.technician_id && tab !== "client"
              ? "Veuillez sélectionner un technicien d'abord"
              : tab === "summary"
                ? "Enregistrer l'intervention"
                : "Suivant"
          }
        >
          {loading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : tab === "summary" ? (
            <>
              <Save size={20} /> ENREGISTRER
            </>
          ) : (
            <>
              <ArrowRight size={20} /> SUIVANT
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
          ? "Rapport d'entretien"
          : "Planifier Entretien"
      }
      onClose={onClose}
      actions={actions}
    >
      <div className="flex-column gap-6">
        {/* Intervention Type Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
          <button
            onClick={() => setInterventionType("direct")}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${interventionType === "direct" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            Rapport Direct
          </button>
          <button
            onClick={() => setInterventionType("scheduled")}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${interventionType === "scheduled" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            Planification
          </button>
        </div>

        {/* Custom Tabs Slider */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-x-auto no-scrollbar">
          {(
            [
              "client",
              "tech",
              "photos",
              "services",
              "products",
              "summary",
            ] as const
          )
            .filter((t) => {
              if (
                interventionType === "scheduled" &&
                (t === "products" || t === "photos")
              )
                return false;
              return true;
            })
            .map((t) => (
              <button
                key={t}
                onClick={() => {
                  if (t !== "client" && t !== "tech" && !formData.technician_id)
                    return;
                  setTab(t);
                }}
                className={`flex-1 min-w-[80px] py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${tab === t ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"} ${t !== "client" && t !== "tech" && !formData.technician_id ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={
                  t !== "client" && t !== "tech" && !formData.technician_id
                }
              >
                {t === "client"
                  ? "Client"
                  : t === "tech"
                    ? "Technicien"
                    : t === "photos"
                      ? "Photos"
                      : t === "services"
                        ? "Services"
                        : t === "products"
                          ? "Produits"
                          : "Résumé"}
              </button>
            ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-column gap-5 pr-2">
          {tab === "client" && (
            <div className="flex-column gap-5">
              <div className="flex-column gap-2">
                <Combobox
                  label="Rechercher un Client"
                  icon={Globe}
                  options={dbClients.map(
                    (c) => `${c.first_name} ${c.last_name} (${c.city})`,
                  )}
                  value={
                    dbClients.find((c) => c.id === selectedClientId)
                      ? `${dbClients.find((c) => c.id === selectedClientId)?.first_name} ${dbClients.find((c) => c.id === selectedClientId)?.last_name} (${dbClients.find((c) => c.id === selectedClientId)?.city})`
                      : ""
                  }
                  onChange={(val) => {
                    const client = dbClients.find(
                      (c) =>
                        `${c.first_name} ${c.last_name} (${c.city})` === val,
                    );
                    if (client) {
                      setSelectedClientId(client.id);
                      setSelectedPoolId(""); // Reset pool on client change
                    }
                  }}
                  placeholder="Nom du client ou ville..."
                />
              </div>

              {selectedClientId && (
                <div className="flex-column gap-2 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Choisir un Bassin
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {dbPools.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPoolId(p.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedPoolId === p.id ? "bg-blue-50 border-primary text-primary dark:bg-primary/20 dark:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"}`}
                      >
                        <span className="text-xs font-black uppercase">
                          {p.name}
                        </span>
                        {selectedPoolId === p.id && (
                          <Check size={16} className="text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "tech" && (
            <div className="flex-column gap-5">
              <div className="flex-column gap-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Technicien
                </label>
                <div
                  onClick={() => !isTechnician && setIsTechModalOpen(true)}
                  className={`relative w-full p-3 bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 rounded-xl flex items-center gap-3 transition-all ${!isTechnician ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-primary/50" : "opacity-70 cursor-not-allowed"}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-primary/20 flex items-center justify-center text-primary">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Technicien assigné
                    </p>
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      {dbTechnicians.find(
                        (t) => t.id === formData.technician_id,
                      )?.full_name || "Sélectionner un technicien..."}
                    </p>
                  </div>
                  {!isTechnician && (
                    <Plus size={18} className="text-slate-400" />
                  )}

                  {isTechnician && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                        AUTO
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {interventionType === "scheduled" && (
                <div className="flex-column gap-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Date d'intervention
                  </label>
                  <input
                    type="date"
                    className="search-input"
                    value={formData.scheduled_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduled_date: e.target.value,
                      })
                    }
                    title="Date planifiée"
                  />
                </div>
              )}

              <TechnicianSelectionModal
                isOpen={isTechModalOpen}
                onClose={() => setIsTechModalOpen(false)}
                onSelect={(id) => {
                  setFormData({ ...formData, technician_id: id });
                  setIsTechModalOpen(false);
                }}
                selectedTechId={formData.technician_id}
              />

              {interventionType === "direct" && (
                <>
                  <div className="data-grid grid-2 !gap-4">
                    <div className="flex-column gap-2">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        pH
                      </label>
                      <div className="relative">
                        <FlaskConical
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          type="number"
                          step="0.1"
                          className="search-input !pl-10"
                          placeholder="7.2"
                          value={formData.ph_level}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ph_level: e.target.value,
                            })
                          }
                          title="Niveau de pH"
                        />
                      </div>
                    </div>
                    <div className="flex-column gap-2">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Chlore
                      </label>
                      <div className="relative">
                        <Droplets
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          type="number"
                          step="0.1"
                          className="search-input !pl-10"
                          placeholder="1.5"
                          value={formData.chlorine_level}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              chlorine_level: e.target.value,
                            })
                          }
                          title="Taux de chlore"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="data-grid grid-2 !gap-4">
                    <div className="flex-column gap-2">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                        Temp. Eau
                      </label>
                      <div className="relative">
                        <ThermometerSun
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={16}
                        />
                        <input
                          type="number"
                          className="search-input !pl-10"
                          placeholder="28°"
                          value={formData.water_temp}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              water_temp: e.target.value,
                            })
                          }
                          title="Température de l'eau"
                        />
                      </div>
                    </div>
                    <div className="flex items-end pb-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            water_level_adjusted:
                              !formData.water_level_adjusted,
                          })
                        }
                        className={`flex items-center gap-2 w-full h-[40px] px-4 rounded-xl border transition-all ${formData.water_level_adjusted ? "bg-blue-50 border-primary text-primary dark:bg-primary/20 dark:text-white" : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"}`}
                        title="Ajustement du niveau d'eau"
                      >
                        {formData.water_level_adjusted ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                        <span className="text-[10px] font-black uppercase">
                          Niveau OK
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex-column gap-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Observations
                </label>
                <textarea
                  className="search-input !h-auto !py-3"
                  rows={3}
                  placeholder="Notes techniques..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  title="Notes et observations"
                />
              </div>
            </div>
          )}

          {tab === "photos" && (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-300">
              <PhotoUpload
                label="Photo Avant Intervention"
                currentUrl={formData.photo_before_url}
                onUploadComplete={(url) =>
                  setFormData((f) => ({ ...f, photo_before_url: url }))
                }
              />
              <PhotoUpload
                label="Photo Après Intervention"
                currentUrl={formData.photo_after_url}
                onUploadComplete={(url) =>
                  setFormData((f) => ({ ...f, photo_after_url: url }))
                }
              />
            </div>
          )}
          {tab === "services" && (
            <div className="flex-column gap-4">
              {/* Add Service Section */}
              <button
                type="button"
                onClick={() => setServiceModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition-all font-black uppercase text-xs tracking-widest bg-slate-50/50 dark:bg-slate-800/50"
              >
                <Plus size={18} strokeWidth={3} />
                Ajouter un service
              </button>

              {/* Selected Services List */}
              <div className="flex-column gap-2">
                {Object.entries(selectedServices).length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      Aucun service sélectionné
                    </p>
                  </div>
                ) : (
                  Object.entries(selectedServices).map(([sId, price]) => {
                    const s = dbServices.find((srv) => srv.id === sId);
                    if (!s) return null;
                    const isModified = price !== s.price;

                    return (
                      <div
                        key={sId}
                        className="flex flex-col p-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4 flex-1 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              <Check size={16} strokeWidth={3} />
                            </div>
                            <div className="flex-column overflow-hidden flex-1">
                              <span
                                className="text-xs font-black uppercase text-slate-800 dark:text-white truncate"
                                title={s.name}
                              >
                                {s.name}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                Service technique
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-right text-xs font-black text-slate-800 dark:text-white focus:border-blue-500 outline-none"
                              value={price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  setSelectedServices((prev) => ({
                                    ...prev,
                                    [sId]: val,
                                  }));
                                }
                              }}
                              title={`Prix pour ${s.name}`}
                            />
                            <span className="text-[10px] font-bold text-slate-500">
                              DT
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                const rest = { ...selectedServices };
                                delete rest[sId];
                                setSelectedServices(rest);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ml-2"
                              title="Retirer ce service"
                            >
                              <Minus size={16} strokeWidth={3} />
                            </button>
                          </div>
                        </div>

                        {(isModified ||
                          (referencePrices[sId] !== undefined &&
                            referencePrices[sId] !== s.price)) && (
                            <div className="mt-2 pl-12 flex gap-2">
                              {isModified && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                  Prix modifié (Base: {s.price} DT)
                                </span>
                              )}
                              {!isModified &&
                                referencePrices[sId] !== undefined &&
                                referencePrices[sId] !== s.price && (
                                  <span className="text-[9px] font-bold text-blue-300">
                                    Prix habituel client: {referencePrices[sId]}{" "}
                                    DT
                                  </span>
                                )}
                            </div>
                          )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {tab === "products" && (
            <div className="flex-column gap-4">
              <button
                type="button"
                onClick={() => setProductModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition-all font-black uppercase text-xs tracking-widest bg-slate-50/50 dark:bg-slate-800/50"
              >
                <Plus size={18} strokeWidth={3} />
                Ajouter un produit
              </button>

              <div className="flex-column gap-2">
                {Object.entries(usedProducts).length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      Aucun produit sélectionné
                    </p>
                  </div>
                ) : (
                  Object.entries(usedProducts).map(([pId, qty]) => {
                    const p = dbProducts.find((prod) => prod.id === pId);
                    if (!p) return null;

                    return (
                      <div
                        key={pId}
                        className="flex flex-col p-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4 flex-1 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              <Check size={16} strokeWidth={3} />
                            </div>
                            <div className="flex-column overflow-hidden flex-1">
                              <span
                                className="text-xs font-black uppercase text-slate-800 dark:text-white truncate"
                                title={p.name}
                              >
                                {p.name}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                {p.price_per_unit.toFixed(2)} DT / {p.unit}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => handleProductQty(pId, -1)}
                                className="p-1 hover:text-red-500 transition-colors text-slate-400"
                                title="Diminuer quantité"
                              >
                                <Minus size={16} strokeWidth={3} />
                              </button>
                              <span className="font-black min-w-[20px] text-center text-sm text-slate-800 dark:text-white">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleProductQty(pId, 1)}
                                className="p-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-400"
                                title="Augmenter quantité"
                              >
                                <Plus size={16} strokeWidth={3} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const rest = { ...usedProducts };
                                delete rest[pId];
                                setUsedProducts(rest);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ml-2"
                              title="Retirer ce produit"
                            >
                              <Minus size={16} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {tab === "summary" && (
            <div className="flex-column gap-6">
              <div className="card-premium grad-violet vibrant items-center py-8">
                <Calculator
                  className="text-white/30 absolute left-4 top-4"
                  size={40}
                />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  Coût d'intervention
                </p>
                <p className="text-5xl font-black text-white mt-2">
                  {totalAmount.toFixed(0)} <span className="text-xl">DT</span>
                </p>
              </div>

              <div className="flex-column gap-3">
                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">
                  Résumé des coûts
                </h4>
                {Object.entries(selectedServices).map(([sId, price]) => {
                  const s = dbServices.find((srv) => srv.id === sId);
                  return (
                    <div
                      key={sId}
                      className="flex justify-between items-center text-[10px]"
                    >
                      <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">
                        {s?.name}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        {price.toFixed(0)} DT
                      </span>
                    </div>
                  );
                })}
                {Object.entries(usedProducts).map(([pId, qty]) => {
                  const p = dbProducts.find((prod) => prod.id === pId);
                  return (
                    <div
                      key={pId}
                      className="flex justify-between items-center text-[10px]"
                    >
                      <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">
                        {p?.name} (x{qty})
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        {((p?.price_per_unit || 0) * qty).toFixed(0)} DT
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet size={18} className="text-primary shrink-0" />
                    <p className="text-[10px] font-black font-bold text-primary uppercase">
                      Paiement reçu ?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        record_payment: !prev.record_payment,
                      }))
                    }
                    className={`w-10 h-5 rounded-full relative transition-colors ${formData.record_payment ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"}`}
                    title="Enregistrer un paiement"
                  >
                    <div
                      className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.record_payment ? "left-6" : "left-1"}`}
                    ></div>
                  </button>
                </div>

                {formData.record_payment && (
                  <div className="flex flex-col gap-3 animate-slide-up">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          className="search-input !h-10 text-xs"
                          placeholder="Montant (DT)"
                          value={formData.payment_amount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              payment_amount: e.target.value,
                            })
                          }
                          title="Montant du paiement reçu"
                        />
                      </div>
                      <select
                        className="search-input !h-10 text-xs w-32 cursor-pointer"
                        value={formData.payment_method}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_method: e.target.value as any,
                          })
                        }
                        title="Mode de paiement"
                      >
                        <option value="espèces">Espèces</option>
                        <option value="chèque">Chèque</option>
                        <option value="virement">Virement</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <p className="text-[9px] font-bold text-primary uppercase opacity-60">
                      Le solde du client sera crédité de ce montant.
                    </p>
                  </div>
                )}

                <p className="text-[9px] font-bold text-primary leading-relaxed uppercase pt-2 border-t border-primary/10">
                  {interventionType === "direct" ? (
                    <>
                      L'enregistrement du rapport déduira automatiquement{" "}
                      <strong>{totalAmount.toFixed(0)} DT</strong> du solde
                      client.
                    </>
                  ) : (
                    <>
                      La planification apparaîtra dans l'onglet{" "}
                      <strong>Planning</strong>. Le coût sera déduit lors de la
                      validation finale.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {serviceModalOpen && (
        <AddServiceModal
          availableServices={dbServices.filter(
            (s) => selectedServices[s.id] === undefined,
          )}
          referencePrices={referencePrices}
          onClose={() => setServiceModalOpen(false)}
          onAdd={(sId, price) => {
            setSelectedServices((prev) => ({ ...prev, [sId]: price }));
            setServiceModalOpen(false);
          }}
        />
      )}
      {productModalOpen && (
        <AddProductModal
          availableProducts={dbProducts.filter(
            (p) => usedProducts[p.id] === undefined,
          )}
          onClose={() => setProductModalOpen(false)}
          onAdd={(pId, quantity) => {
            setUsedProducts((prev) => ({
              ...prev,
              [pId]: (prev[pId] || 0) + quantity,
            }));
            setProductModalOpen(false);
          }}
        />
      )}
    </ModalLayout>
  );
};

export default NewIntervention;
