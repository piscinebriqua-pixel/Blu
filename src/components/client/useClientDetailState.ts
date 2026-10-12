import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { openWhatsAppChat } from "../../lib/phoneUtils";
import type { Client, Pool, Intervention, Devis, ClientPartner, ActiveCategory } from "./types";

export function useClientDetailState(id: string | undefined) {
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [clientPartners, setClientPartners] = useState<ClientPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Catégorie modale
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>(null);

  // Filtre interventions
  const [interventionFilter, setInterventionFilter] = useState<"all" | "paid" | "unpaid">("all");

  // Modales d'actions
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditPoolModalOpen, setIsEditPoolModalOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<any | null>(null);
  const [isDevisModalOpen, setIsDevisModalOpen] = useState(false);
  const [editingDevisId, setEditingDevisId] = useState<string | null>(null);
  const [editingInterventionId, setEditingInterventionId] = useState<string | null>(null);
  const [interventionTypeForModal, setInterventionTypeForModal] = useState<"direct" | "scheduled">("direct");
  const [selectedInterventionForView, setSelectedInterventionForView] = useState<any>(null);
  const [selectedDevisForView, setSelectedDevisForView] = useState<any>(null);
  const [isAssignPartnerOpen, setIsAssignPartnerOpen] = useState(false);
  const [isSolderModalOpen, setIsSolderModalOpen] = useState(false);
  const [isSoldering, setIsSoldering] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Confirmations de suppression
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [poolToDelete, setPoolToDelete] = useState<Pool | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [interventionToDelete, setInterventionToDelete] = useState<string | null>(null);
  const [partnerToUnassign, setPartnerToUnassign] = useState<any | null>(null);
  const [devisToDelete, setDevisToDelete] = useState<Devis | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingPool, setIsDeletingPool] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [isDeletingDevis, setIsDeletingDevis] = useState(false);
  const [isUnassigningPartner, setIsUnassigningPartner] = useState(false);

  // Totaux calculés
  const totalIntersAmount = useMemo(() => {
    return interventions.reduce((acc, inter) => {
      if (inter.status !== "completed") return acc;
      const sTotal = inter.services?.reduce((sAcc, s) => sAcc + (s.price_at_time || 0), 0) || 0;
      const pTotal = inter.products?.reduce((pAcc, p) => pAcc + (p.total_price || 0), 0) || 0;
      return acc + sTotal + pTotal;
    }, 0);
  }, [interventions]);

  const totalPaymentsAmount = useMemo(() => {
    return payments.reduce((acc, pay) => acc + (pay.amount || 0), 0);
  }, [payments]);

  const filteredInterventions = useMemo(() => {
    return interventions.filter((inter) => {
      const sTotal = inter.services?.reduce((sAcc, s) => sAcc + (s.price_at_time || 0), 0) || 0;
      const pTotal = inter.products?.reduce((pAcc, p) => pAcc + (p.total_price || 0), 0) || 0;
      const totalBilledInter = sTotal + pTotal;
      const remaining = totalBilledInter - (inter.paid_amount || 0);

      if (interventionFilter === "paid") return remaining <= 0.5;
      if (interventionFilter === "unpaid") return remaining > 0.5;
      return true;
    });
  }, [interventions, interventionFilter]);

  // Chargement principal des données
  const fetchClientData = useCallback(async () => {
    if (!id) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profiles } = await supabase.from("profiles").select("role").eq("id", session.user.id);
        setIsAdmin(profiles?.[0]?.role === "admin");
      }

      const { data: clients, error: clientError } = await supabase.from("clients").select("*").eq("id", id);
      if (clientError) throw clientError;

      const clientData = clients?.[0];
      if (!clientData) {
        toast.error("Client introuvable");
        navigate("/clients");
        return;
      }
      setClient(clientData);

      try {
        const partnerIds = [
          clientData.architect_id,
          clientData.entrepreneur_id,
          clientData.plumber_id,
          clientData.electrician_id,
          clientData.pool_builder_id,
          clientData.site_manager_id,
          clientData.billing_partner_id,
        ].filter(Boolean);

        if (partnerIds.length > 0) {
          const { data: partnersData } = await supabase.from("partners").select("*").in("id", partnerIds);
          if (partnersData) setClientPartners(partnersData);
        } else {
          setClientPartners([]);
        }
      } catch (e) {
        // Table partners optionnelle
      }

      const { data: poolData } = await supabase
        .from("pools")
        .select("*, photos:pool_photos(url, is_main)")
        .eq("client_id", id);
      setPools(poolData || []);

      const { data: interData } = await supabase
        .from("interventions")
        .select(`
          *,
          technician:technicians!technician_id(full_name),
          pool:pools!pool_id(
            name, 
            client:clients!client_id(id, first_name, last_name, balance, phone)
          ), 
          services:intervention_services(
            price_at_time,
            service:services(name)
          ),
          products:intervention_products(
            quantity,
            total_price,
            product:inventory_products(name, unit)
          )
        `)
        .in("pool_id", poolData?.map((p: any) => p.id) || [])
        .order("created_at", { ascending: false });

      const { data: distributions } = await supabase
        .from("intervention_payments")
        .select("intervention_id, amount_applied")
        .in("intervention_id", interData?.map((i: any) => i.id) || []);

      const formattedInters =
        interData?.map((i: any) => {
          const appliedPayments = distributions?.filter((d: any) => d.intervention_id === i.id) || [];
          const totalPaid = appliedPayments.reduce((acc: number, d: any) => acc + Number(d.amount_applied), 0);

          return {
            ...i,
            pool_name: i.pool?.name,
            paid_amount: totalPaid,
          };
        }) || [];
      setInterventions(formattedInters);

      const { data: payData } = await supabase
        .from("payments")
        .select("*, technician:technicians(full_name)")
        .eq("client_id", id)
        .order("payment_date", { ascending: false });
      setPayments(payData || []);

      const { data: devisData } = await supabase
        .from("devis")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      setDevis(devisData || []);
    } catch (error) {
      console.error("Erreur:", error);
      navigate("/clients");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id, fetchClientData]);

  // Synchronisation automatique du solde
  useEffect(() => {
    const syncBalance = async () => {
      if (!client || loading) return;
      const calculatedBalance = totalPaymentsAmount - totalIntersAmount;
      if (Math.abs(client.balance - calculatedBalance) > 0.1) {
        const { error } = await supabase.from("clients").update({ balance: calculatedBalance }).eq("id", client.id);
        if (!error) {
          setClient((prev) => (prev ? { ...prev, balance: calculatedBalance } : null));
        }
      }
    };
    syncBalance();
  }, [client, totalPaymentsAmount, totalIntersAmount, loading]);

  // Suppressions
  const handleDeletePool = async () => {
    if (!poolToDelete) return;
    setIsDeletingPool(true);
    try {
      const { error } = await supabase.from("pools").delete().eq("id", poolToDelete.id);
      if (error) throw error;
      toast.success(`Piscine "${poolToDelete.name}" supprimée`);
      setPoolToDelete(null);
      fetchClientData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeletingPool(false);
    }
  };

  const handleDeleteDevis = async () => {
    if (!devisToDelete) return;
    setIsDeletingDevis(true);
    try {
      await supabase.from("devis_items").delete().eq("devis_id", devisToDelete.id);
      const { error } = await supabase.from("devis").delete().eq("id", devisToDelete.id);
      if (error) throw error;
      toast.success(`Devis ${devisToDelete.number} supprimé`);
      setDevisToDelete(null);
      fetchClientData();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression : " + error.message);
    } finally {
      setIsDeletingDevis(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!isAdmin || !paymentToDelete) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase.from("payments").delete().eq("id", paymentToDelete);
      if (error) throw error;
      toast.success("Paiement supprimé");
      setPaymentToDelete(null);
      fetchClientData();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression : " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!isAdmin || !client) return;
    if (interventions.length > 0 || payments.length > 0 || pools.length > 0) {
      toast.error("Impossible de supprimer ce client : il possède un historique (piscines, interventions ou paiements).");
      setShowDeleteConfirm(false);
      return;
    }
    try {
      setIsDeletingClient(true);
      const { error } = await supabase.from("clients").delete().eq("id", client.id);
      if (error) throw error;
      toast.success("Client supprimé avec succès");
      navigate("/clients", { replace: true });
    } catch (error: any) {
      toast.error("Erreur lors de la suppression : " + error.message);
    } finally {
      setIsDeletingClient(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteIntervention = async () => {
    if (!interventionToDelete) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase.from("interventions").delete().eq("id", interventionToDelete);
      if (error) throw error;
      toast.success("Intervention supprimée");
      setInterventionToDelete(null);
      fetchClientData();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression : " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Duplication devis
  const handleDuplicateDevis = async (originalDevis: Devis) => {
    try {
      setLoading(true);
      const { data: items } = await supabase.from("devis_items").select("*").eq("devis_id", originalDevis.id);
      const baseNumber = originalDevis.number.replace(/-COPY(-\d+)?$/, "");
      const { data: existingCopies } = await supabase.from("devis").select("number").like("number", `${baseNumber}-COPY%`);

      let newDevisNumber = `${baseNumber}-COPY`;
      if (existingCopies && existingCopies.length > 0) {
        newDevisNumber = `${baseNumber}-COPY-${existingCopies.length + 1}`;
      }

      const { data: newDevis, error: dError } = await supabase
        .from("devis")
        .insert([
          {
            client_id: id,
            number: newDevisNumber,
            title: `${originalDevis.title} (Copie)`,
            total_amount: originalDevis.total_amount,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (dError) throw dError;

      if (items && items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          devis_id: newDevis.id,
          designation: item.designation,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));
        await supabase.from("devis_items").insert(itemsToInsert);
      }

      toast.success("Devis dupliqué avec succès");
      fetchClientData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Statut Devis
  const handleStatusChange = async (devisId: string, status: "pending" | "closed" | "cancelled") => {
    try {
      const { error } = await supabase.from("devis").update({ status }).eq("id", devisId);
      if (error) throw error;
      if (selectedDevisForView?.id === devisId) {
        setSelectedDevisForView({ ...selectedDevisForView, status });
      }
      fetchClientData();
      toast.success("Statut mis à jour");
    } catch (error) {
      console.error("Erreur status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  // Retrait partenaire
  const handleUnassignPartner = async () => {
    if (!client || !partnerToUnassign) return;
    try {
      setIsUnassigningPartner(true);
      const partnerId = partnerToUnassign.id;
      const updateData: any = {};
      if (client.architect_id === partnerId) updateData.architect_id = null;
      if (client.entrepreneur_id === partnerId) updateData.entrepreneur_id = null;
      if (client.plumber_id === partnerId) updateData.plumber_id = null;
      if (client.electrician_id === partnerId) updateData.electrician_id = null;
      if (client.pool_builder_id === partnerId) updateData.pool_builder_id = null;
      if (client.site_manager_id === partnerId) updateData.site_manager_id = null;
      if (client.billing_partner_id === partnerId) updateData.billing_partner_id = null;

      const { error } = await supabase.from("clients").update(updateData).eq("id", client.id);
      if (error) throw error;
      toast.success("Partenaire retiré avec succès");
      setPartnerToUnassign(null);
      fetchClientData();
    } catch (error: any) {
      toast.error("Erreur lors du retrait : " + error.message);
    } finally {
      setIsUnassigningPartner(false);
    }
  };

  // Solder compte
  const confirmSolder = async () => {
    if (!client) return;
    setIsSoldering(true);
    const missingAmount = Math.abs(totalPaymentsAmount - totalIntersAmount);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase.from("profiles").select("technician_id").eq("id", session.user.id).single();

      const { error } = await supabase.from("payments").insert([
        {
          client_id: client.id,
          technician_id: profile?.technician_id || null,
          amount: missingAmount,
          method: "remise",
          notes: "Solde de compte automatique (Remise/Perte)",
          payment_date: new Date().toISOString().split("T")[0],
        },
      ]);
      if (error) throw error;

      const { error: balanceUpdateError } = await supabase.from("clients").update({ balance: 0 }).eq("id", client.id);
      if (balanceUpdateError) throw balanceUpdateError;

      toast.success("Compte soldé avec succès");
      setIsSolderModalOpen(false);
      fetchClientData();
    } catch (e: any) {
      toast.error("Erreur lors du solde: " + e.message);
    } finally {
      setIsSoldering(false);
    }
  };

  // WhatsApp
  const openWhatsApp = () => {
    if (!client?.phone) {
      toast.error("Aucun numéro de téléphone renseigné pour ce client");
      return;
    }

    const balance = totalPaymentsAmount - totalIntersAmount;
    let message = `Bonjour ${client.first_name},\n\n`;

    if (balance < -0.5) {
      message += `Voici le point sur votre compte. Votre solde (Credit) est de *${Math.abs(balance).toFixed(0)} DT*.\n\n`;
    } else {
      message += `Nous vous contactons pour vous informer que votre compte est actuellement à jour (Solde : 0 DT). Merci de votre confiance !\n`;
      openWhatsAppChat(client.phone, message);
      return;
    }

    const unpaidInters = interventions.filter((inter) => {
      const sTotal = inter.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0;
      const pTotal = inter.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0;
      const totalBilled = sTotal + pTotal;
      return totalBilled - (inter.paid_amount || 0) > 0.5;
    });

    if (unpaidInters.length > 0) {
      message += `*Détails des interventions en attente :*\n`;
      unpaidInters.forEach((inter) => {
        const sTotal = inter.services?.reduce((acc, s) => acc + (s.price_at_time || 0), 0) || 0;
        const pTotal = inter.products?.reduce((acc, p) => acc + (p.total_price || 0), 0) || 0;
        const totalBilled = sTotal + pTotal;
        const remaining = totalBilled - (inter.paid_amount || 0);
        const date = new Date(inter.completed_date || inter.scheduled_date || inter.created_at).toLocaleDateString("fr-FR");
        const paidAmount = inter.paid_amount || 0;
        if (paidAmount > 0) {
          message += `• ${date} (${inter.pool_name}) :\n  Total: ${totalBilled.toFixed(0)} DT | Payé: ${paidAmount.toFixed(0)} DT | Reste: *${remaining.toFixed(0)} DT*`;
        } else {
          message += `• ${date} (${inter.pool_name}) : *${remaining.toFixed(0)} DT*`;
        }
        message += "\n";
      });
    }

    openWhatsAppChat(client.phone, message);
  };

  const sendLoginViaWhatsApp = () => {
    if (!client?.phone) {
      toast.error("Aucun numéro de téléphone renseigné pour ce client");
      return;
    }
    const url = `${window.location.origin}/mon-espace/login?phone=${client.phone}`;
    const message = `Bonjour ${client.first_name},\n\nVoici votre lien d'accès sécurisé à votre espace client BCCP : \n${url}\n\nUne fois sur la page, votre numéro sera déjà pré-rempli.`;
    openWhatsAppChat(client.phone, message);
  };

  const openGPS = () => {
    if (client?.gps_lat && client?.gps_lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${client.gps_lat},${client.gps_lng}`, "_blank");
    } else if (client?.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address + " " + (client.city || ""))}`,
        "_blank"
      );
    }
  };

  return {
    client,
    pools,
    interventions,
    payments,
    devis,
    clientPartners,
    loading,
    isAdmin,
    activeCategory,
    setActiveCategory,
    interventionFilter,
    setInterventionFilter,
    isInterventionModalOpen,
    setIsInterventionModalOpen,
    isPoolModalOpen,
    setIsPoolModalOpen,
    isEditClientModalOpen,
    setIsEditClientModalOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isEditPoolModalOpen,
    setIsEditPoolModalOpen,
    selectedPoolId,
    setSelectedPoolId,
    selectedPool,
    setSelectedPool,
    paymentToEdit,
    setPaymentToEdit,
    isDevisModalOpen,
    setIsDevisModalOpen,
    editingDevisId,
    setEditingDevisId,
    editingInterventionId,
    setEditingInterventionId,
    interventionTypeForModal,
    setInterventionTypeForModal,
    selectedInterventionForView,
    setSelectedInterventionForView,
    selectedDevisForView,
    setSelectedDevisForView,
    isAssignPartnerOpen,
    setIsAssignPartnerOpen,
    isSolderModalOpen,
    setIsSolderModalOpen,
    isSoldering,
    isQrModalOpen,
    setIsQrModalOpen,
    paymentToDelete,
    setPaymentToDelete,
    poolToDelete,
    setPoolToDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
    interventionToDelete,
    setInterventionToDelete,
    partnerToUnassign,
    setPartnerToUnassign,
    devisToDelete,
    setDevisToDelete,
    isDeleting,
    isDeletingPool,
    isDeletingClient,
    isDeletingDevis,
    isUnassigningPartner,
    totalIntersAmount,
    totalPaymentsAmount,
    filteredInterventions,
    fetchClientData,
    handleDeletePool,
    handleDeleteDevis,
    handleDeletePayment,
    handleDeleteClient,
    handleDeleteIntervention,
    handleDuplicateDevis,
    handleStatusChange,
    handleUnassignPartner,
    confirmSolder,
    openWhatsApp,
    sendLoginViaWhatsApp,
    openGPS,
  };
}
