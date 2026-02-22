import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import NewIntervention from "../components/NewIntervention";
import InterventionDetailsModal from "../components/InterventionDetailsModal";
import { supabase } from "../lib/supabase";
import {
  Search,
  Calendar,
  ChevronRight,
  FileText,
  Clock,
  CreditCard,
  Plus,
} from "lucide-react";

interface Intervention {
  id: string;
  pool_id: string;
  visit_date: string;
  created_at: string;
  ph_level: number;
  chlorine_level: number;
  water_temp: number;
  notes: string;
  status: "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string;
  technician: { full_name: string };
  pool?: {
    name: string;
    client?: {
      id: string;
      first_name: string;
      last_name: string;
      balance: number;
    };
  };
  services: { price_at_time: number; service: { name: string } }[];
  products: {
    total_price: number;
    quantity: number;
    product: { name: string; unit: string };
  }[];
  photo_before_url?: string;
  photo_after_url?: string;
}

const Interventions: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"planning" | "history">(
    "planning",
  );
  const [selectedIntervention, setSelectedIntervention] =
    useState<Intervention | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [isNewInterventionModalOpen, setIsNewInterventionModalOpen] =
    useState(false);
  const [selClient, setSelClient] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    balance: number;
  } | null>(null);
  const [selPoolId, setSelPoolId] = useState<string | null>(null);

  useEffect(() => {
    fetchInterventions();
  }, []);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("interventions")
        .select(
          `
                    *,
                    technician:technicians!technician_id(full_name),
                    pool:pools(
                        name,
                        client:clients(id, first_name, last_name, balance, phone)
                    ),
                    services:intervention_services(price_at_time, service:services(name)),
                    products:intervention_products(quantity, total_price, product:inventory_products(name, unit))
                `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInterventions(data || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(undefined);
    setIsNewInterventionModalOpen(true);
  };

  const calculateTotal = (inter: Intervention) => {
    const sTotal =
      inter.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0;
    const pTotal =
      inter.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0;
    return sTotal + pTotal;
  };

  const filteredInterventions = interventions.filter((i) => {
    const clientName =
      `${i.pool?.client?.first_name} ${i.pool?.client?.last_name}`.toLowerCase();
    const techName = i.technician?.full_name?.toLowerCase() || "";

    const isCorrectTab =
      activeTab === "planning"
        ? ["pending", "scheduled", "in_progress"].includes(i.status)
        : ["completed", "cancelled"].includes(i.status);

    if (!isCorrectTab) return false;

    return (
      clientName.includes(searchTerm.toLowerCase()) ||
      techName.includes(searchTerm.toLowerCase())
    );
  });

  const toolbar = (
    <button
      className="btn-primary w-10 h-10 md:w-auto md:h-[44px] !p-0 md:!px-4 flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all"
      onClick={handleOpenAddModal}
    >
      <Plus size={20} />
      <span className="hidden md:inline font-black uppercase text-xs tracking-widest">
        Nouveau
      </span>
    </button>
  );

  const searchBar = (
    <div className="relative mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        size={18}
      />
      <input
        type="text"
        placeholder="Rechercher un client ou un technicien..."
        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none text-slate-800 dark:text-white font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );

  const todayInterventions = interventions.filter((i) => {
    const today = new Date().toISOString().split("T")[0];
    const interDate = (i.visit_date || i.created_at).split("T")[0];
    return interDate === today;
  });

  const totalRevenue = interventions.reduce(
    (acc, i) => acc + calculateTotal(i),
    0,
  );

  return (
    <PageLayout
      title="ENTRETIENS"
      subtitle={`${interventions.length} TOTAL`}
      toolbar={toolbar}
      loading={loading && interventions.length === 0}
      showBackButton={true}
    >
      {searchBar}

      {/* Custom Tabs */}
      <div className="flex gap-1 p-1.5 bg-slate-100/80 dark:bg-slate-800/50 rounded-[20px] mb-8 border border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={() => setActiveTab("planning")}
          className={`flex-1 py-3.5 rounded-[14px] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === "planning" ? "bg-primary text-white shadow-xl shadow-blue-500/30 scale-[1.02]" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
        >
          Plannification
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3.5 rounded-[14px] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === "history" ? "bg-primary text-white shadow-xl shadow-blue-500/30 scale-[1.02]" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
        >
          Historique
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-premium vibrant grad-blue p-6 flex flex-col gap-4 shadow-lg border-white/10">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
                Aujourd'hui
              </span>
              <span className="text-4xl font-black text-white leading-none">
                {todayInterventions.length}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
              <Calendar size={20} className="text-white" />
            </div>
          </div>
        </div>
        <div className="card-premium vibrant grad-violet p-6 flex flex-col gap-4 shadow-lg border-white/10">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
                Valeur
              </span>
              <span className="text-4xl font-black text-white leading-none">
                {totalRevenue.toFixed(0)}{" "}
                <span className="text-sm font-bold text-white/80 ml-0.5">DT</span>
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
              <CreditCard size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-premium-label">
            Rapports d'interventions
          </h3>
          <div className="h-px flex-1 bg-slate-200/50 dark:bg-slate-800 mx-6" />
        </div>

        {filteredInterventions.map((inter) => (
          <div
            key={inter.id}
            className="card-white !flex-row !items-center !gap-4 !p-5 text-left hover:scale-[1.01] transition-all cursor-pointer"
            onClick={() => setSelectedIntervention(inter)}
          >
            <div className="w-12 h-12 rounded-2xl bg-primary-glow flex items-center justify-center text-primary shrink-0 transition-transform">
              <FileText size={22} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                  {inter.pool?.client?.first_name}{" "}
                  {inter.pool?.client?.last_name}
                </h4>
                <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                  {calculateTotal(inter).toFixed(0)} DT
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-500">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${inter.status === "completed" ? "bg-emerald-500" : "bg-blue-400"}`}
                  />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate">
                    {inter.technician?.full_name || "Non assigné"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {inter.status === "scheduled" || inter.status === "pending"
                      ? inter.scheduled_date
                        ? new Date(inter.scheduled_date).toLocaleDateString(
                          "fr-FR",
                          { day: "2-digit", month: "2-digit" },
                        )
                        : "À planifier"
                      : new Date(inter.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                  </span>
                </div>
              </div>

              {inter.status !== "completed" && inter.status !== "cancelled" && (
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${inter.status === "scheduled"
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600"
                      : inter.status === "in_progress"
                        ? "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800 text-orange-600"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-500"
                      }`}
                  >
                    {inter.status === "scheduled"
                      ? "Planifié"
                      : inter.status === "in_progress"
                        ? "En Cours"
                        : "En Attente"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              <ChevronRight size={18} className="text-slate-300" />
              {inter.status === "scheduled" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelPoolId(inter.pool_id);
                    setSelClient(inter.pool?.client || null);
                    setEditingId(inter.id);
                    setIsNewInterventionModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-primary text-white text-[11px] font-black uppercase rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-blue-500/20"
                >
                  DÉMARRER
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredInterventions.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4 bg-white/30 dark:bg-slate-800/20 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-2">
              <FileText size={40} className="opacity-10" />
            </div>
            <p className="text-premium-label">
              Aucun rapport trouvé
            </p>
          </div>
        )}
      </div>

      {/* Selection Modal for adding */}

      {/* New Intervention Form */}
      {isNewInterventionModalOpen && (
        <NewIntervention
          clientId={selClient?.id}
          poolId={selPoolId || undefined}
          interventionId={editingId}
          onClose={() => {
            setIsNewInterventionModalOpen(false);
            setSelClient(null);
            setSelPoolId(null);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            setIsNewInterventionModalOpen(false);
            setSelClient(null);
            setSelPoolId(null);
            setEditingId(undefined);
            fetchInterventions();
          }}
        />
      )}

      {/* Details Modal */}
      {selectedIntervention && (
        <InterventionDetailsModal
          intervention={selectedIntervention as any}
          onClose={() => setSelectedIntervention(null)}
          onEdit={(inter) => {
            setSelectedIntervention(null);
            setSelPoolId(inter.pool_id!);
            setSelClient(inter.pool?.client as any);
            setEditingId(inter.id);
            setIsNewInterventionModalOpen(true);
          }}
        />
      )}
    </PageLayout>
  );
};

export default Interventions;
