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
  X,
} from "lucide-react";
import ModalLayout from "./ModalLayout";
import TechnicianSelectionModal from "./TechnicianSelectionModal";
import PhotoUpload from "./ui/PhotoUpload";
import AddServiceModal from "./AddServiceModal";
import AddProductModal from "./AddProductModal";
import AddPoolModal from "./AddPoolModal";
import { Globe, Waves } from "lucide-react";
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
  onClose: () => void;
  onSuccess: () => void;
}

const NewIntervention: React.FC<NewInterventionProps> = ({
  poolId: initialPoolId,
  clientId: initialClientId,
  interventionId,
  scheduledDate: initialScheduledDate,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [interventionType, setInterventionType] = useState<
    "direct" | "scheduled"
  >("direct");
  const [tab, setTab] = useState<
    "client" | "tech" | "photos" | "services" | "products" | "summary"
  >(initialClientId && initialPoolId ? "tech" : "client");

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
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    technician_id: "",
    ph_level: "",
    chlorine_level: "",
    water_temp: "",
    notes: "",
    water_level_adjusted: false,
    scheduled_date: initialScheduledDate || new Date().toISOString().split("T")[0],
    payment_amount: "",
    payment_method: "espèces" as "espèces" | "chèque" | "virement" | "autre",
    record_payment: false,
    photo_before_url: "",
    photo_after_url: "",
  });

  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const filteredClients = dbClients.filter((c) => {
    const search = clientSearchTerm.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const city = (c.city || "").toLowerCase();
    return fullName.includes(search) || city.includes(search);
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

  const fetchPools = useCallback(async () => {
    if (!selectedClientId) return;
    const { data } = await supabase
      .from("pools")
      .select("id, name")
      .eq("client_id", selectedClientId);

    const pools = data || [];
    setDbPools(pools);

    // Auto-select if a new pool was just created or if none selected
    if (pools.length > 0 && !selectedPoolId) {
      setSelectedPoolId(pools[0].id);
    }
  }, [selectedClientId, selectedPoolId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchPools();
    }
  }, [selectedClientId, fetchPools]);

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
      toast.error("Veuillez sélectionner un technicien");
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

      toast.success(interventionId ? 'Rapport mis à jour' : 'Rapport enregistré avec succès');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  const actions = (
    <div className="flex flex-col w-full gap-4">
      <div className="flex justify-between items-center px-4 py-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
        <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">
          Coût estimé
        </span>
        <span className="text-2xl font-black text-blue-600 dark:text-blue-300 tabular-nums">
          {totalAmount.toFixed(0)} <span className="text-sm font-bold opacity-80">DT</span>
        </span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 flex-1"
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
          className={`h-[58px] flex-[2] relative overflow-hidden group rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${tab === "summary" ? "bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white" : "bg-blue-600 shadow-lg shadow-blue-600/20 text-white"} ${!formData.technician_id && tab !== "client" ? "opacity-40 cursor-not-allowed grayscale" : "hover:scale-[1.02]"}`}
          disabled={loading || (tab !== "client" && !formData.technician_id)}
          title={
            !formData.technician_id && tab !== "client"
              ? "Veuillez sélectionner un technicien d'abord"
              : tab === "summary"
                ? "Enregistrer l'intervention"
                : "Suivant"
          }
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : tab === "summary" ? (
              <>
                <Save size={20} strokeWidth={2.5} /> VALIDER
              </>
            ) : (
              <>
                SUIVANT <ArrowRight size={20} strokeWidth={2.5} />
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
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
        <div className="flex bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setInterventionType("direct")}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${interventionType === "direct" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xl shadow-blue-500/10 scale-[1.02]" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            Rapport Direct
          </button>
          <button
            onClick={() => setInterventionType("scheduled")}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${interventionType === "scheduled" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xl shadow-blue-500/10 scale-[1.02]" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            Planification
          </button>
        </div>

        {/* Custom Tabs Slider */}
        <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto no-scrollbar shadow-inner">
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
                className={`flex-1 min-w-[90px] py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-500 relative ${tab === t ? "text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"} ${t !== "client" && t !== "tech" && !formData.technician_id ? "opacity-30 cursor-not-allowed" : ""}`}
                disabled={
                  t !== "client" && t !== "tech" && !formData.technician_id
                }
              >
                <span className="relative z-10">
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
                </span>
                {tab === t && (
                  <div className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30 animate-in fade-in zoom-in-95 duration-300"></div>
                )}
              </button>
            ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-column gap-5 pr-2">
          {tab === "client" && (
            <div className="flex-column gap-5">
              <div className="flex-column gap-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                  Rechercher un Client
                </label>
                <div className="relative group">
                  <Globe
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                    size={20}
                  />
                  <input
                    type="text"
                    className="w-full h-14 bg-white/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 font-black transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none shadow-sm"
                    placeholder="Nom du client ou ville..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {!selectedClientId ? (
                <div className="flex-column gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setSelectedPoolId("");
                          setClientSearchTerm(""); // Reset search after selection
                        }}
                        className="flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-500/50 hover:bg-blue-50/10 dark:hover:bg-blue-900/10 transition-all duration-300 group animate-in slide-in-from-left-4"
                        title={`Choisir le client ${c.first_name} ${c.last_name}`}
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <User size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                              {c.first_name} {c.last_name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                              {c.city && c.city !== "null" ? c.city : "Ville non spécifiée"}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                          <Plus size={16} strokeWidth={3} />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic text-sm">
                      Aucun client trouvé pour "{clientSearchTerm}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-column gap-4 animate-in zoom-in-95 duration-500">
                  <div className="p-5 rounded-[22px] bg-blue-600 text-white shadow-xl shadow-blue-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <User size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-100/70 uppercase tracking-widest mb-0.5">
                          Client sélectionné
                        </p>
                        <p className="text-md font-black uppercase">
                          {dbClients.find((c) => c.id === selectedClientId)?.first_name}{" "}
                          {dbClients.find((c) => c.id === selectedClientId)?.last_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedClientId("")}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                      title="Changer de client"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-column gap-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                      Choisir un Bassin
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {dbPools.length > 0 ? (
                        dbPools.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPoolId(p.id)}
                            className={`flex items-center justify-between p-5 rounded-[22px] border-2 transition-all duration-300 animate-in fade-in slide-in-from-left-4 ${selectedPoolId === p.id ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.02]" : "bg-white/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-800"}`}
                            title={`Sélectionner le bassin ${p.name}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedPoolId === p.id ? "bg-white/20" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"}`}>
                                <Droplets size={18} strokeWidth={selectedPoolId === p.id ? 3 : 2} />
                              </div>
                              <span className="text-sm font-black uppercase tracking-tight">
                                {p.name}
                              </span>
                            </div>
                            {selectedPoolId === p.id && (
                              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <Check size={14} className="text-blue-600" strokeWidth={4} />
                              </div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="flex flex-col items-center gap-4 p-8 bg-orange-50/50 dark:bg-orange-900/10 border border-dashed border-orange-200 dark:border-orange-800/30 rounded-[22px] animate-in zoom-in-95 duration-500">
                          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Waves size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-black text-orange-800 dark:text-orange-300 uppercase tracking-tight mb-1">
                              Aucun bassin configuré
                            </p>
                            <p className="text-[10px] font-bold text-orange-600/60 dark:text-orange-400/50 uppercase tracking-widest max-w-[200px] leading-relaxed">
                              Une piscine est nécessaire pour créer un rapport d'entretien.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsPoolModalOpen(true)}
                            className="w-full py-5 bg-blue-600 text-white rounded-[22px] font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs tracking-[0.2em] uppercase mt-4 flex items-center justify-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                              <Plus size={18} strokeWidth={3} />
                            </div>
                            AJOUTER UN BASSIN
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "tech" && (
            <div className="flex-column gap-5">
              <div className="flex-column gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                  Technicien
                </label>
                <div
                  onClick={() => !isTechnician && setIsTechModalOpen(true)}
                  className={`relative w-full p-5 bg-white/50 dark:bg-slate-800/40 border-2 rounded-[22px] flex items-center gap-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 shadow-sm h-[80px] ${!isTechnician ? "cursor-pointer hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-800 border-slate-100 dark:border-slate-700/50" : "bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30 cursor-not-allowed"}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${isTechnician ? "bg-blue-600 text-white" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"}`}>
                    <User size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                      Intervenant assigné
                    </p>
                    <p className={`text-md font-black uppercase tracking-tight ${isTechnician ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-white"}`}>
                      {dbTechnicians.find(
                        (t) => t.id === formData.technician_id,
                      )?.full_name || "Sélectionner..."}
                    </p>
                  </div>
                  {!isTechnician && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                      <Plus size={18} strokeWidth={3} />
                    </div>
                  )}
                  {isTechnician && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                      <span className="text-[9px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/30 uppercase tracking-widest">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex-column gap-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                        pH
                      </label>
                      <div className="group relative">
                        <FlaskConical
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                          size={18}
                        />
                        <input
                          type="number"
                          step="0.1"
                          className="w-full h-[54px] bg-white/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 font-black transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none shadow-sm"
                          placeholder="7.2"
                          value={formData.ph_level}
                          onChange={(e) =>
                            setFormData({ ...formData, ph_level: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex-column gap-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                        Chlore
                      </label>
                      <div className="group relative">
                        <Droplets
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                          size={18}
                        />
                        <input
                          type="number"
                          step="0.1"
                          className="w-full h-[54px] bg-white/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 font-black transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none shadow-sm"
                          placeholder="1.5"
                          value={formData.chlorine_level}
                          onChange={(e) =>
                            setFormData({ ...formData, chlorine_level: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex-column gap-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                        Temp. Eau
                      </label>
                      <div className="group relative">
                        <ThermometerSun
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                          size={18}
                        />
                        <input
                          type="number"
                          className="w-full h-[54px] bg-white/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 font-black transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none shadow-sm"
                          placeholder="28°"
                          value={formData.water_temp}
                          onChange={(e) =>
                            setFormData({ ...formData, water_temp: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-end pb-0">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            water_level_adjusted: !formData.water_level_adjusted,
                          })
                        }
                        className={`group flex items-center gap-3 w-full h-[54px] px-5 rounded-2xl border-2 transition-all duration-300 ${formData.water_level_adjusted ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-500/30"}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.water_level_adjusted ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                          {formData.water_level_adjusted ? (
                            <CheckSquare size={18} strokeWidth={3} />
                          ) : (
                            <Square size={18} strokeWidth={2.5} />
                          )}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Niveau OK
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex-column gap-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                  Observations
                </label>
                <textarea
                  className="w-full bg-white/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-[22px] p-5 font-bold text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none shadow-sm transition-all resize-none"
                  rows={4}
                  placeholder="Notes techniques, état du bassin, produits recommandés..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
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
              <button
                type="button"
                onClick={() => setServiceModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-[22px] shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all font-black uppercase text-xs tracking-[0.2em]"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus size={18} strokeWidth={3} />
                </div>
                Ajouter un service
              </button>

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
                              <span className="text-xs font-black uppercase text-slate-800 dark:text-white truncate" title={s.name}>
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
                                  setSelectedServices((prev) => ({ ...prev, [sId]: val }));
                                }
                              }}
                              title={`Prix pour ${s.name}`}
                            />
                            <span className="text-[10px] font-bold text-slate-500">DT</span>
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
                        {(isModified || (referencePrices[sId] !== undefined && referencePrices[sId] !== s.price)) && (
                          <div className="mt-2 pl-12 flex gap-2">
                            {isModified && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                Prix modifié (Base: {s.price} DT)
                              </span>
                            )}
                            {!isModified && referencePrices[sId] !== undefined && referencePrices[sId] !== s.price && (
                              <span className="text-[9px] font-bold text-blue-300">
                                Prix habituel client: {referencePrices[sId]} DT
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
                className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-[22px] shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all font-black uppercase text-xs tracking-[0.2em]"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus size={18} strokeWidth={3} />
                </div>
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
                              <span className="text-xs font-black uppercase text-slate-800 dark:text-white truncate" title={p.name}>
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
            <div className="flex-column gap-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700 rounded-[32px] p-8 flex flex-col items-center shadow-2xl shadow-blue-500/30 border border-white/20">
                <Calculator
                  className="text-white/20 absolute -right-4 -bottom-4 rotate-12"
                  size={120}
                  strokeWidth={1}
                />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-2">
                  Total Intervention
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white drop-shadow-lg tabular-nums">
                    {totalAmount.toFixed(0)}
                  </span>
                  <span className="text-xl font-black text-white/80 uppercase">DT</span>
                </div>
              </div>

              <div className="flex-column gap-3">
                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2">
                  Résumé des coûts
                </h4>
                {Object.entries(selectedServices).map(([sId, price]) => {
                  const s = dbServices.find((srv) => srv.id === sId);
                  return (
                    <div key={sId} className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">{s?.name}</span>
                      <span className="font-black text-slate-800 dark:text-white">{price.toFixed(0)} DT</span>
                    </div>
                  );
                })}
                {Object.entries(usedProducts).map(([pId, qty]) => {
                  const p = dbProducts.find((prod) => prod.id === pId);
                  return (
                    <div key={pId} className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">{p?.name} (x{qty})</span>
                      <span className="font-black text-slate-800 dark:text-white">{((p?.price_per_unit || 0) * qty).toFixed(0)} DT</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet size={18} className="text-primary shrink-0" />
                    <p className="text-[10px] font-black text-primary uppercase">
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
                    />
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
                            setFormData({ ...formData, payment_amount: e.target.value })
                          }
                          title="Montant du paiement reçu"
                        />
                      </div>
                      <select
                        className="search-input !h-10 text-xs w-32 cursor-pointer"
                        value={formData.payment_method}
                        onChange={(e) =>
                          setFormData({ ...formData, payment_method: e.target.value as any })
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
                      <strong>{totalAmount.toFixed(0)} DT</strong> du solde client.
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
      {isPoolModalOpen && (
        <AddPoolModal
          clientId={selectedClientId}
          onClose={() => setIsPoolModalOpen(false)}
          onSuccess={() => {
            fetchPools();
            setIsPoolModalOpen(false);
          }}
        />
      )}
    </ModalLayout>
  );
};

export default NewIntervention;

