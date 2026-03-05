import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import NewIntervention from "../components/NewIntervention";
import InterventionDetailsModal from "../components/InterventionDetailsModal";
import { supabase } from "../lib/supabase";
import {
  Search,
  ChevronRight,
  FileText,
  Clock,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";

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
  devis_id?: string | null;
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
  const [activeTab, setActiveTab] = useState<"planifie" | "termine" | "annule">(
    "planifie",
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
  const [selectedTech, setSelectedTech] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "classique" | "chantier">("all");

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

  const handleDeleteIntervention = async (intervention: Intervention) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet entretien ?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', intervention.id);

      if (error) throw error;

      toast.success("Entretien supprimé");
      setSelectedIntervention(null);
      fetchInterventions();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (inter: Intervention) => {
    const sTotal =
      inter.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0;
    const pTotal =
      inter.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0;
    return sTotal + pTotal;
  };

  const filteredInterventions = interventions
    .filter((i) => {
      const clientName =
        `${i.pool?.client?.first_name} ${i.pool?.client?.last_name}`.toLowerCase();
      const techName = i.technician?.full_name?.toLowerCase() || "";

      let isCorrectTab = false;
      if (activeTab === "planifie") {
        isCorrectTab = ["pending", "scheduled", "in_progress"].includes(i.status);
      } else if (activeTab === "termine") {
        isCorrectTab = i.status === "completed";
      } else if (activeTab === "annule") {
        isCorrectTab = i.status === "cancelled";
      }

      if (!isCorrectTab) return false;

      // Filter by Search
      const matchesSearch =
        clientName.includes(searchTerm.toLowerCase()) ||
        techName.includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filter by Technician
      if (selectedTech !== "all" && i.technician?.full_name !== selectedTech) {
        return false;
      }

      // Filter by Type
      if (selectedType === "classique" && i.devis_id) return false;
      if (selectedType === "chantier" && !i.devis_id) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by date explicitly
      const dateA = new Date(activeTab === 'planifie' ? (a.scheduled_date || a.created_at) : (a.visit_date || a.scheduled_date || a.created_at)).getTime();
      const dateB = new Date(activeTab === 'planifie' ? (b.scheduled_date || b.created_at) : (b.visit_date || b.scheduled_date || b.created_at)).getTime();
      return dateB - dateA;
    });

  const uniqueTechnicians = Array.from(new Set(interventions.map(i => i.technician?.full_name).filter(Boolean))) as string[];


  const toolbar = (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Rechercher un client ou un technicien..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <select
          aria-label="Filtrer par type d'intervention"
          title="Type d'intervention"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-primary/50 appearance-none cursor-pointer"
        >
          <option value="all">Tous les types</option>
          <option value="classique">Visite Classique</option>
          <option value="chantier">Chantier / Devis</option>
        </select>

        <select
          aria-label="Filtrer par technicien"
          title="Technicien assigné"
          value={selectedTech}
          onChange={(e) => setSelectedTech(e.target.value)}
          className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-primary/50 appearance-none cursor-pointer"
        >
          <option value="all">Tous les techniciens</option>
          {uniqueTechnicians.map(tech => (
            <option key={tech} value={tech}>{tech}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex-wrap">
        <button
          onClick={() => setActiveTab("planifie")}
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "planifie" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
        >
          Planifié
        </button>
        <button
          onClick={() => setActiveTab("termine")}
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "termine" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
        >
          Terminé
        </button>
        <button
          onClick={() => setActiveTab("annule")}
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "annule" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
        >
          Annulé
        </button>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="ENTRETIENS"
      subtitle={`${interventions.length} TOTAL`}
      loading={loading && interventions.length === 0}
      showBackButton={true}
      toolbar={toolbar}
    >


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
            className="card-white !flex-col !items-stretch !p-3.5 mb-1 text-left hover:scale-[1.01] transition-all cursor-pointer relative"
            onClick={() => setSelectedIntervention(inter)}
          >
            {/* Top Row: Icon + Title | Price */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary-glow flex items-center justify-center text-primary shrink-0 transition-transform">
                  <FileText size={18} />
                </div>
                <h4 className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate leading-none">
                  {inter.pool?.client?.first_name}{" "}
                  {inter.pool?.client?.last_name}
                </h4>
              </div>
              <span className="text-[15px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg shrink-0">
                {(calculateTotal(inter) || 0).toFixed(0)} DT
              </span>
            </div>

            {/* Middle Row: Tech | Date + Action */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${inter.status === "completed" ? "bg-emerald-500" : "bg-blue-400"}`}
                  />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate">
                    {inter.technician?.full_name || "Non assigné"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Clock size={13} className="text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
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

              {inter.status === "scheduled" ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelPoolId(inter.pool_id);
                    setSelClient(inter.pool?.client || null);
                    setEditingId(inter.id);
                    setIsNewInterventionModalOpen(true);
                  }}
                  className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase rounded-lg hover:bg-primary-dark transition-all shadow-md active:scale-95"
                >
                  DÉMARRER
                </button>
              ) : (
                <ChevronRight size={16} className="text-slate-300" />
              )}
            </div>
          </div>
        ))}

        {filteredInterventions.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-4 bg-white/30 dark:bg-slate-800/20 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm animate-in zoom-in-95 duration-500">
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

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAddModal}
        className="fab-adaptive w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all"
        aria-label="Nouvelle intervention"
      >
        <Plus size={28} />
      </button>

      {/* Modals */}
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
          onDelete={handleDeleteIntervention as any}
        />
      )}
    </PageLayout>
  );
};

export default Interventions;
