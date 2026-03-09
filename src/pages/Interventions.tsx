import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import NewIntervention from "../components/NewIntervention";
import InterventionDetailsModal from "../components/InterventionDetailsModal";
import ConfirmModal from "../components/ConfirmModal";
import { supabase } from "../lib/supabase";
import {
  Search,
  ChevronRight,
  FileText,
  Clock,
  Plus,
  Calendar,
  User
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
      phone?: string;
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
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"planifie" | "termine" | "annule">(
    "planifie",
  );
  const [selectedIntervention, setSelectedIntervention] =
    useState<Intervention | null>(null);
  const [interventionToDelete, setInterventionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [startMode, setStartMode] = useState(false);

  useEffect(() => {
    fetchInterventions();
  }, []);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, technician_id')
        .eq('id', session.user.id)
        .single();

      let query = supabase
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
        );

      if (profile?.role !== 'admin' && profile?.technician_id) {
        query = query.eq('technician_id', profile.technician_id);
      } else if (profile?.role !== 'admin' && !profile?.technician_id) {
        setInterventions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInterventions(data || []);
    } catch (error: any) {
      console.error("Erreur Supabase:", error);
      toast.error("Impossible de récupérer les entretiens");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntervention = async () => {
    if (!interventionToDelete) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase.from('interventions').delete().eq('id', interventionToDelete);
      if (error) throw error;
      toast.success("Entretien supprimé");
      setInterventionToDelete(null);
      fetchInterventions();
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de la suppression: " + (error.message || ''));
    } finally {
      setIsDeleting(false);
    }
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
      const dateA = new Date(activeTab === 'planifie' ? (a.scheduled_date || a.created_at) : (a.visit_date || a.scheduled_date || a.created_at)).getTime();
      const dateB = new Date(activeTab === 'planifie' ? (b.scheduled_date || b.created_at) : (b.visit_date || b.scheduled_date || b.created_at)).getTime();
      return dateB - dateA;
    });

  const uniqueTechnicians = Array.from(new Set(interventions.map(i => i.technician?.full_name).filter(Boolean))) as string[];

  const toolbar = (
    <div className="flex flex-col gap-4">
      {/* Search & View Switcher */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher client, tech..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/planning')}
          className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl text-slate-500 border border-slate-100 dark:border-white/5 shadow-sm active:scale-90 transition-all"
          title="Vue Calendrier"
        >
          <Calendar size={22} />
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            aria-label="Type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full p-3 pl-4 pr-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-white dark:border-white/5 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 appearance-none outline-none focus:border-primary/50"
          >
            <option value="all">Tous Types</option>
            <option value="classique">Visite</option>
            <option value="chantier">Chantier</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <Clock size={14} />
          </div>
        </div>

        <div className="relative flex-1">
          <select
            aria-label="Technicien"
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="w-full p-3 pl-4 pr-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-white dark:border-white/5 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 appearance-none outline-none focus:border-primary/50"
          >
            <option value="all">Tous Techs</option>
            {uniqueTechnicians.map(tech => (
              <option key={tech} value={tech}>{tech}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <User size={14} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-white/5">
        {(['planifie', 'termine', 'annule'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab
                ? "bg-white dark:bg-slate-700 text-primary shadow-lg ring-1 ring-black/5"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
          >
            {tab === 'planifie' ? 'À faire' : tab === 'termine' ? 'Terminé' : 'Annulé'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <PageLayout
      title="ENTRETIENS"
      subtitle={`${filteredInterventions.length} TROUVÉS`}
      toolbar={toolbar}
      loading={loading && interventions.length === 0}
      showBackButton={true}
      className="bg-slate-50 dark:bg-[#0f141e]"
    >
      <div className="flex flex-col gap-3 pb-32 px-4">
        {filteredInterventions.length > 0 ? (
          filteredInterventions.map((i) => (
            <div
              key={i.id}
              onClick={() => setSelectedIntervention(i)}
              className={`group p-4 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all flex items-center gap-4 ${i.status === 'cancelled' ? 'opacity-60' : ''
                }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${i.status === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                  : i.status === 'cancelled'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white'
                }`}>
                {i.status === 'completed' ? <FileText size={24} /> : <Clock size={24} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className={`text-base font-black uppercase tracking-tight truncate ${i.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
                    }`}>
                    {i.pool?.client?.first_name} {i.pool?.client?.last_name}
                  </h3>
                  <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${i.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      i.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                        'bg-primary/10 text-primary'
                    }`}>
                    {activeTab === 'termine'
                      ? new Date(i.visit_date || i.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                      : new Date(i.scheduled_date || i.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                    }
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${i.status === 'cancelled' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {i.pool?.name || 'Piscine'}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                  <span className={`text-[11px] font-black uppercase ${i.status === 'cancelled' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {i.technician?.full_name}
                  </span>
                </div>
              </div>

              <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center opacity-40">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Clock size={32} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest">Aucun résultat</h3>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsNewInterventionModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 ring-4 ring-white dark:ring-slate-900 group"
        title="Nouveau"
      >
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {selectedIntervention && (
        <InterventionDetailsModal
          intervention={selectedIntervention}
          onClose={() => setSelectedIntervention(null)}
          onEdit={(i) => {
            setEditingId(i.id);
            setStartMode(false);
            setSelectedIntervention(null);
          }}
          onStart={(i) => {
            setEditingId(i.id);
            setStartMode(true);
            setSelectedIntervention(null);
          }}
          onDelete={(inter) => {
            setInterventionToDelete(inter.id);
            setSelectedIntervention(null);
          }}
          onStatusChange={fetchInterventions}
        />
      )}

      <ConfirmModal
        isOpen={!!interventionToDelete}
        title="Supprimer Intervention"
        message="Voulez-vous vraiment supprimer cet entretien ? Cette action est irréversible."
        confirmLabel="SUPPRIMER"
        onConfirm={handleDeleteIntervention}
        onClose={() => setInterventionToDelete(null)}
        loading={isDeleting}
        variant="danger"
      />

      {isNewInterventionModalOpen && (
        <NewIntervention
          clientId={selClient?.id}
          poolId={selPoolId || undefined}
          type="scheduled"
          onClose={() => {
            setIsNewInterventionModalOpen(false);
            setSelClient(null);
            setSelPoolId(null);
          }}
          onSuccess={() => {
            setIsNewInterventionModalOpen(false);
            setSelClient(null);
            setSelPoolId(null);
            fetchInterventions();
          }}
        />
      )}

      {editingId && (
        <NewIntervention
          interventionId={editingId}
          type={startMode ? 'direct' : 'scheduled'}
          onClose={() => {
            setEditingId(undefined);
            setStartMode(false);
          }}
          onSuccess={() => {
            setEditingId(undefined);
            setStartMode(false);
            fetchInterventions();
          }}
        />
      )}
    </PageLayout>
  );
};

export default Interventions;
