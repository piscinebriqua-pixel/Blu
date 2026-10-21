import React, { useEffect, useState, useCallback } from "react";
import PageLayout from "../components/PageLayout";
import NewIntervention from "../components/NewIntervention";
import InterventionDetailsModal from "../components/InterventionDetailsModal";
import ConfirmModal from "../components/ConfirmModal";
import { InterventionsToolbar, type InterventionTab, type InterventionFilterType } from "../components/intervention/InterventionsToolbar";
import { InterventionListItem, type InterventionItemData } from "../components/intervention/InterventionListItem";
import { supabase } from "../lib/supabase";
import { Clock, Plus, ArrowDown } from "lucide-react";
import { toast } from "react-hot-toast";

import { referenceCache } from "../lib/referenceCache";

const PAGE_SIZE = 50;

const Interventions: React.FC = () => {
  const [interventions, setInterventions] = useState<InterventionItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<InterventionTab>("planifie");
  const [selectedTech, setSelectedTech] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<InterventionFilterType>("all");
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);

  // Modals state
  const [selectedIntervention, setSelectedIntervention] = useState<any | null>(null);
  const [interventionToDelete, setInterventionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [isNewInterventionModalOpen, setIsNewInterventionModalOpen] = useState(false);
  const [startMode, setStartMode] = useState(false);

  // Charger la liste des techniciens depuis le cache mémoire (instantané)
  useEffect(() => {
    const fetchTechs = async () => {
      try {
        const data = await referenceCache.getTechnicians();
        if (data) {
          setTechnicians(data.map((t: any) => t.full_name).filter(Boolean));
        }
      } catch (e) {
        console.warn("Erreur chargement techniciens:", e);
      }
    };
    fetchTechs();
  }, []);

  // Réinitialiser la pagination lors d'un changement d'onglet ou de filtre type
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [activeTab, selectedType]);

  const fetchInterventions = useCallback(async (currentLimit = limit) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, technician_id")
        .eq("id", session.user.id)
        .single();

      let query = supabase.from("interventions").select(`
        *,
        technician:technicians!technician_id(full_name),
        pool:pools!pool_id(
          name,
          client:clients(id, first_name, last_name, balance, phone)
        ),
        services:intervention_services(price_at_time, service:services(name)),
        products:intervention_products(quantity, total_price, product:inventory_products(name, unit))
      `);

      if (profile?.role !== "admin" && profile?.technician_id) {
        query = query.eq("technician_id", profile.technician_id);
      } else if (profile?.role !== "admin" && !profile?.technician_id) {
        setInterventions([]);
        setLoading(false);
        return;
      }

      // Filtrage direct au niveau SQL selon l'onglet actif (évite le scan de toute la table)
      if (activeTab === "planifie") {
        query = query
          .in("status", ["pending", "scheduled", "in_progress"])
          .order("scheduled_date", { ascending: true });
      } else if (activeTab === "termine") {
        query = query
          .eq("status", "completed")
          .order("completed_date", { ascending: false });
      } else if (activeTab === "annule") {
        query = query
          .eq("status", "cancelled")
          .order("created_at", { ascending: false });
      }

      // Filtrage par type
      if (selectedType === "classique") {
        query = query.is("devis_id", null);
      } else if (selectedType === "chantier") {
        query = query.not("devis_id", "is", null);
      }

      // Limiter la volumétrie demandée
      query = query.limit(currentLimit);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as InterventionItemData[];
      setInterventions(rows);
      setHasMore(rows.length === currentLimit);
    } catch (error: any) {
      console.error("Erreur Supabase:", error);
      toast.error("Impossible de récupérer les entretiens");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, selectedType, limit]);

  useEffect(() => {
    fetchInterventions(limit);
  }, [fetchInterventions, limit]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setLimit((prev) => prev + PAGE_SIZE);
  };

  const handleDeleteIntervention = async () => {
    if (!interventionToDelete) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase.from("interventions").delete().eq("id", interventionToDelete);
      if (error) throw error;
      toast.success("Entretien supprimé");
      setInterventionToDelete(null);
      fetchInterventions();
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de la suppression: " + (error.message || ""));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage local immédiat (recherche texte & technicien) sur les données chargées
  const filteredInterventions = interventions.filter((i) => {
    const clientName = `${i.pool?.client?.first_name || ""} ${i.pool?.client?.last_name || ""}`.toLowerCase();
    const techName = i.technician?.full_name?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch = clientName.includes(search) || techName.includes(search);
    if (!matchesSearch) return false;

    if (selectedTech !== "all" && i.technician?.full_name !== selectedTech) {
      return false;
    }

    return true;
  });

  const toolbar = (
    <InterventionsToolbar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedType={selectedType}
      onTypeChange={setSelectedType}
      selectedTech={selectedTech}
      onTechChange={setSelectedTech}
      technicians={technicians}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
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
          <>
            {filteredInterventions.map((i) => (
              <InterventionListItem
                key={i.id}
                intervention={i}
                activeTab={activeTab}
                onClick={() => setSelectedIntervention(i)}
              />
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="mt-3 flex items-center justify-center gap-2 w-full min-h-[48px] py-3 px-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/50 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider rounded-2xl shadow-sm active:scale-[0.99] transition-all"
              >
                <ArrowDown size={16} className={loadingMore ? "animate-bounce" : ""} />
                {loadingMore ? "Chargement..." : "Afficher 50 entretiens supplémentaires"}
              </button>
            )}
          </>
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
          onStatusChange={() => fetchInterventions(limit)}
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
          type="scheduled"
          onClose={() => setIsNewInterventionModalOpen(false)}
          onSuccess={() => {
            setIsNewInterventionModalOpen(false);
            fetchInterventions(limit);
          }}
        />
      )}

      {editingId && (
        <NewIntervention
          interventionId={editingId}
          type={startMode ? "direct" : "scheduled"}
          onClose={() => {
            setEditingId(undefined);
            setStartMode(false);
          }}
          onSuccess={() => {
            setEditingId(undefined);
            setStartMode(false);
            fetchInterventions(limit);
          }}
        />
      )}
    </PageLayout>
  );
};

export default Interventions;
