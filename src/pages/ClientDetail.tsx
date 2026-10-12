import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Edit2,
  Wallet,
  MessageCircle,
  Navigation,
  Trash2,
  AlertCircle,
  ExternalLink,
  QrCode,
  Plus,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import PageLayout from "../components/PageLayout";
import NewIntervention from "../components/NewIntervention";
import MapPicker from "../components/MapPicker";
import AddPoolModal from "../components/AddPoolModal";
import EditClientModal from "../components/EditClientModal";
import RecordPaymentModal from "../components/RecordPaymentModal";
import EditPoolModal from "../components/EditPoolModal";
import InterventionDetailsModal from "../components/InterventionDetailsModal";
import ModalLayout from "../components/ModalLayout";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/ConfirmModal";
import AddDevisModal from "../components/AddDevisModal";
import DevisDetailsModal from "../components/DevisDetailsModal";
import AssignPartnerModal from "../components/AssignPartnerModal";

import { useClientDetailState } from "../components/client/useClientDetailState";
import { ClientBentoTiles } from "../components/client/ClientBentoTiles";
import { ClientPoolsList } from "../components/client/ClientPoolsList";
import { ClientInterventionsList } from "../components/client/ClientInterventionsList";
import { ClientPaymentsList } from "../components/client/ClientPaymentsList";
import { ClientDevisList } from "../components/client/ClientDevisList";
import { ClientBalanceView } from "../components/client/ClientBalanceView";
import { ClientInvoicesList } from "../components/client/ClientInvoicesList";

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const state = useClientDetailState(id);

  const {
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
  } = state;

  if (!client && !loading) {
    return (
      <PageLayout title="Client introuvable" showBackButton={true}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-white">Ce client n'existe plus</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
            Le dossier a peut-être été supprimé ou l'identifiant est incorrect.
          </p>
          <Button variant="primary" onClick={() => navigate("/clients", { replace: true })} className="mt-6">
            RETOUR À LA LISTE
          </Button>
        </div>
      </PageLayout>
    );
  }

  const toolbar = (
    <div className="flex items-center justify-between w-full gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={sendLoginViaWhatsApp}
          className="w-11 h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-95 transition-all"
          title="Envoyer l'accès via WhatsApp"
        >
          <MessageCircle size={18} />
        </button>
        <button
          type="button"
          onClick={() => setIsQrModalOpen(true)}
          className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
          title="Afficher le QR Code d'accès"
        >
          <QrCode size={18} />
        </button>
        <button
          type="button"
          onClick={openGPS}
          className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
          title="Navigation GPS"
        >
          <Navigation size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = `${window.location.origin}/mon-espace/login?phone=${client?.phone}`;
            const text = `Bonjour ${client?.first_name},\nVoici le lien pour accéder à votre espace client BCCP : ${url}`;
            navigator.clipboard.writeText(text);
            toast.success("Lien copié dans le presse-papier !");
          }}
          className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          title="Copier le lien d'accès"
        >
          <ExternalLink size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && totalPaymentsAmount - totalIntersAmount < -0.1 && (
          <button
            type="button"
            onClick={() => setIsSolderModalOpen(true)}
            className="min-h-[44px] flex items-center justify-center gap-2 px-3.5 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all"
            title="Solder (Remise)"
          >
            <Wallet size={16} className="animate-pulse" />
            <span className="text-xs font-black uppercase">Solder</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsEditClientModalOpen(true)}
          className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          title="Modifier Profil"
        >
          <Edit2 size={18} />
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-11 h-11 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 active:scale-95 transition-all"
            title="Supprimer Client"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <PageLayout
      title={client?.first_name || ""}
      subtitle={client?.last_name || ""}
      showBackButton={true}
      toolbar={toolbar}
      loading={loading}
    >
      {/* 1. Dashboard Bento Grid & Colonnes */}
      <ClientBentoTiles
        client={client}
        pools={pools}
        interventions={interventions}
        payments={payments}
        devis={devis}
        clientPartners={clientPartners}
        totalIntersAmount={totalIntersAmount}
        totalPaymentsAmount={totalPaymentsAmount}
        onSelectCategory={setActiveCategory}
        onOpenWhatsApp={openWhatsApp}
        onOpenInterventionModal={() => setIsInterventionModalOpen(true)}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onOpenDevisModal={() => setIsDevisModalOpen(true)}
        onOpenPoolModal={() => setIsPoolModalOpen(true)}
        onOpenEditClientModal={() => setIsEditClientModalOpen(true)}
        onOpenAssignPartner={() => setIsAssignPartnerOpen(true)}
        onSelectPartnerToUnassign={setPartnerToUnassign}
        onSelectInterventionForView={setSelectedInterventionForView}
        onSelectDevisForView={setSelectedDevisForView}
      />

      {/* 1.5. Module de Facturation Client */}
      {client && (
        <div className="mt-8 mb-6 card-bento p-5 border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm">
          <ClientInvoicesList
            clientId={client.id}
            clientName={`${client.first_name} ${client.last_name}`}
          />
        </div>
      )}

      {/* 2. Modale Catégorie Active */}
      {activeCategory && (
        <ModalLayout
          title={
            activeCategory === "pools"
              ? "Parc Aquatique"
              : activeCategory === "interventions"
              ? "Historique des Entretiens"
              : activeCategory === "payments"
              ? "Historique des Paiements"
              : activeCategory === "devis"
              ? "Chantiers & Devis"
              : activeCategory === "balance"
              ? "Détails du Solde"
              : activeCategory === "invoices"
              ? "Factures Client"
              : "Localisation GPS"
          }
          onClose={() => setActiveCategory(null)}
          className="max-w-4xl"
          actions={
            <div className="flex gap-3 w-full justify-end">
              {activeCategory === "pools" && (
                <Button onClick={() => setIsPoolModalOpen(true)} className="btn-primary">
                  <Plus size={18} className="mr-2" /> AJOUTER UN BASSIN
                </Button>
              )}
              {activeCategory === "interventions" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (pools.length === 1) setSelectedPoolId(pools[0].id);
                      else setSelectedPoolId(null);
                      setInterventionTypeForModal("direct");
                      setIsInterventionModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus size={18} className="mr-2" /> PASSAGE DIRECT
                  </Button>
                  <Button
                    onClick={() => {
                      if (pools.length === 1) setSelectedPoolId(pools[0].id);
                      else setSelectedPoolId(null);
                      setInterventionTypeForModal("scheduled");
                      setIsInterventionModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Navigation size={18} className="mr-2" /> PLANIFIER
                  </Button>
                </div>
              )}
              {(activeCategory === "payments" || activeCategory === "balance") && (
                <Button onClick={() => setIsPaymentModalOpen(true)} className="btn-primary">
                  <Wallet size={18} className="mr-2" /> ENCAISSER
                </Button>
              )}
              {activeCategory === "devis" && (
                <Button onClick={() => setIsDevisModalOpen(true)} className="btn-primary">
                  <Plus size={18} className="mr-2" /> CRÉER UN DEVIS
                </Button>
              )}
              <Button onClick={() => setActiveCategory(null)} variant="secondary">
                FERMER
              </Button>
            </div>
          }
        >
          <div className="p-2">
            {activeCategory === "balance" && (
              <ClientBalanceView
                client={client}
                totalIntersAmount={totalIntersAmount}
                totalPaymentsAmount={totalPaymentsAmount}
              />
            )}
            {activeCategory === "pools" && (
              <ClientPoolsList
                pools={pools}
                isAdmin={isAdmin}
                onOpenAddPool={() => setIsPoolModalOpen(true)}
                onSelectPoolForDirectReport={(poolId) => {
                  setSelectedPoolId(poolId);
                  setInterventionTypeForModal("direct");
                  setIsInterventionModalOpen(true);
                }}
                onEditPool={(pool) => {
                  setSelectedPool(pool);
                  setIsEditPoolModalOpen(true);
                }}
                onDeletePool={setPoolToDelete}
              />
            )}
            {activeCategory === "interventions" && (
              <ClientInterventionsList
                interventions={filteredInterventions}
                totalIntersAmount={totalIntersAmount}
                filter={interventionFilter}
                setFilter={setInterventionFilter}
                onSelectIntervention={setSelectedInterventionForView}
              />
            )}
            {activeCategory === "payments" && (
              <ClientPaymentsList
                payments={payments}
                isAdmin={isAdmin}
                onEditPayment={(pay) => {
                  setPaymentToEdit(pay);
                  setActiveCategory(null);
                }}
                onDeletePayment={setPaymentToDelete}
              />
            )}
            {activeCategory === "devis" && (
              <ClientDevisList
                devis={devis}
                onSelectDevis={setSelectedDevisForView}
                onEditDevis={(dId) => setEditingDevisId(dId)}
                onDuplicateDevis={handleDuplicateDevis}
                onDeleteDevis={setDevisToDelete}
              />
            )}
            {activeCategory === "gps" && client?.gps_lat && client?.gps_lng && (
              <div className="rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 h-[500px] border border-slate-200 dark:border-slate-700 p-1">
                <MapPicker lat={client.gps_lat} lng={client.gps_lng} readonly={true} />
              </div>
            )}
            {activeCategory === "invoices" && client && (
              <ClientInvoicesList
                clientId={client.id}
                clientName={`${client.first_name} ${client.last_name}`}
              />
            )}
          </div>
        </ModalLayout>
      )}

      {/* 3. Boîtes Modales Secondaires */}
      {(isDevisModalOpen || editingDevisId) && (
        <AddDevisModal
          clientId={client?.id}
          devisId={editingDevisId || undefined}
          onClose={() => {
            setIsDevisModalOpen(false);
            setEditingDevisId(null);
          }}
          onSuccess={fetchClientData}
        />
      )}
      {(isInterventionModalOpen || editingInterventionId) && (
        <NewIntervention
          poolId={selectedPoolId || undefined}
          clientId={id!}
          interventionId={editingInterventionId || undefined}
          type={interventionTypeForModal}
          onClose={() => {
            setIsInterventionModalOpen(false);
            setEditingInterventionId(null);
          }}
          onSuccess={() => {
            setIsInterventionModalOpen(false);
            setEditingInterventionId(null);
            fetchClientData();
          }}
        />
      )}
      {isPoolModalOpen && (
        <AddPoolModal clientId={id!} onClose={() => setIsPoolModalOpen(false)} onSuccess={fetchClientData} />
      )}
      {isEditClientModalOpen && (
        <EditClientModal client={client} onClose={() => setIsEditClientModalOpen(false)} onSuccess={fetchClientData} />
      )}
      {isPaymentModalOpen && (
        <RecordPaymentModal
          clientId={id!}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            fetchClientData();
          }}
        />
      )}
      {isEditPoolModalOpen && selectedPool && (
        <EditPoolModal
          pool={selectedPool}
          onClose={() => {
            setIsEditPoolModalOpen(false);
            setSelectedPool(null);
          }}
          onSuccess={fetchClientData}
        />
      )}
      {paymentToEdit && (
        <RecordPaymentModal
          clientId={id!}
          payment={paymentToEdit}
          onClose={() => setPaymentToEdit(null)}
          onSuccess={() => {
            setPaymentToEdit(null);
            fetchClientData();
          }}
        />
      )}
      {selectedInterventionForView && (
        <InterventionDetailsModal
          intervention={selectedInterventionForView}
          onClose={() => setSelectedInterventionForView(null)}
          onEdit={(inter) => {
            setEditingInterventionId(inter.id);
            setInterventionTypeForModal(inter.status === "completed" ? "direct" : "scheduled");
            setSelectedInterventionForView(null);
          }}
          onDelete={(inter) => {
            setInterventionToDelete(inter.id);
            setSelectedInterventionForView(null);
          }}
          onStart={(inter) => {
            setEditingInterventionId(inter.id);
            setInterventionTypeForModal("direct");
            setSelectedInterventionForView(null);
          }}
          onStatusChange={fetchClientData}
        />
      )}
      {selectedDevisForView && (
        <DevisDetailsModal
          devis={{ ...selectedDevisForView, client }}
          onClose={() => setSelectedDevisForView(null)}
          onEdit={(dId) => {
            setSelectedDevisForView(null);
            setEditingDevisId(dId);
          }}
          onDelete={(d) => {
            setSelectedDevisForView(null);
            setDevisToDelete(d);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
      {isAssignPartnerOpen && (
        <AssignPartnerModal
          clientId={id!}
          onClose={() => setIsAssignPartnerOpen(false)}
          onSuccess={() => {
            setIsAssignPartnerOpen(false);
            fetchClientData();
          }}
        />
      )}

      {/* 4. Dialogues de Confirmation */}
      <ConfirmModal
        isOpen={!!paymentToDelete}
        title="Supprimer Paiement"
        message="Voulez-vous vraiment supprimer ce paiement ? Le solde du client sera automatiquement ajusté."
        confirmLabel="SUPPRIMER"
        onConfirm={handleDeletePayment}
        onClose={() => setPaymentToDelete(null)}
        loading={isDeleting}
      />
      <ConfirmModal
        isOpen={!!poolToDelete}
        title="Supprimer la piscine"
        message={`Voulez-vous vraiment supprimer la piscine "${poolToDelete?.name}" ? Toutes les interventions associées seront perdues.`}
        confirmLabel="SUPPRIMER"
        onConfirm={handleDeletePool}
        onClose={() => setPoolToDelete(null)}
        loading={isDeletingPool}
      />
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer le Client"
        message={`Êtes-vous sûr de vouloir supprimer ${client?.first_name} ${client?.last_name} ? Cette action supprimera également tous ses bassins, interventions et paiements associés. Cette action est irréversible.`}
        confirmLabel="SUPPRIMER DÉFINITIVEMENT"
        onConfirm={handleDeleteClient}
        onClose={() => setShowDeleteConfirm(false)}
        loading={isDeletingClient}
        variant="danger"
      />
      <ConfirmModal
        isOpen={!!interventionToDelete}
        title="Supprimer Intervention"
        message="Voulez-vous vraiment supprimer ce rapport d'intervention ? Cette action est irréversible et le solde du client sera ajusté."
        confirmLabel="SUPPRIMER"
        onConfirm={handleDeleteIntervention}
        onClose={() => setInterventionToDelete(null)}
        loading={isDeleting}
        variant="danger"
      />
      <ConfirmModal
        isOpen={!!devisToDelete}
        title="Supprimer le Devis"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le devis ${devisToDelete?.number} ? Cette action est irréversible.`}
        confirmLabel="SUPPRIMER"
        onConfirm={handleDeleteDevis}
        onClose={() => setDevisToDelete(null)}
        loading={isDeletingDevis}
        variant="danger"
      />
      <ConfirmModal
        isOpen={!!partnerToUnassign}
        title="Retirer le partenaire"
        message={`Voulez-vous vraiment retirer ${partnerToUnassign?.first_name} ${partnerToUnassign?.last_name} du projet de ce client ?`}
        confirmLabel="RETIRER"
        onConfirm={handleUnassignPartner}
        onClose={() => setPartnerToUnassign(null)}
        loading={isUnassigningPartner}
        variant="danger"
      />
      <ConfirmModal
        isOpen={isSolderModalOpen}
        title="Solder le compte"
        message="Créer une remise (perte) du montant exact manquant pour solder ce compte à 0 DT ?"
        confirmLabel="SOLDER"
        onConfirm={confirmSolder}
        onClose={() => setIsSolderModalOpen(false)}
        loading={isSoldering}
        variant="primary"
      />
      <ConfirmModal
        isOpen={isQrModalOpen}
        title="Accès Client (QR Code)"
        message={
          <div className="flex flex-col items-center justify-center py-6 gap-6">
            <div className="p-6 bg-white rounded-3xl shadow-inner ring-1 ring-slate-100 flex items-center justify-center">
              <QRCodeSVG
                value={`${window.location.origin}/mon-espace/login?phone=${client?.phone}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Accès pour {client?.first_name} {client?.last_name}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-relaxed px-6">
                Montrez ce code au client pour qu'il puisse scanner et accéder à son espace instantanément.
              </p>
            </div>
          </div>
        }
        confirmLabel="FERMER"
        onConfirm={() => setIsQrModalOpen(false)}
        onClose={() => setIsQrModalOpen(false)}
        variant="primary"
        showIrreversibleWarning={false}
      />
    </PageLayout>
  );
};

export default ClientDetail;
