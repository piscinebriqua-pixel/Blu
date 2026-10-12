import React from "react";
import {
  Save,
  Loader2,
  Plus,
  User,
  CheckSquare,
} from "lucide-react";
import ModalLayout from "./ModalLayout";
import TechnicianSelectionModal from "./TechnicianSelectionModal";
import PhotoUpload from "./ui/PhotoUpload";
import AddServiceModal from "./AddServiceModal";
import AddProductModal from "./AddProductModal";
import AddPoolModal from "./AddPoolModal";
import ClientSelectionModal from "./ClientSelectionModal";
import { WaterAnalysisSection } from "./intervention/WaterAnalysisSection";
import { ServicesAndProductsSection } from "./intervention/ServicesAndProductsSection";
import { PaymentSection } from "./intervention/PaymentSection";
import { useNewInterventionState } from "./intervention/useNewInterventionState";
import type { NewInterventionProps } from "./intervention/types";

const NewIntervention: React.FC<NewInterventionProps> = (props) => {
  const { onClose, interventionId } = props;
  const state = useNewInterventionState(props);

  const {
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
  } = state;

  const actions = (
    <div className="flex flex-col w-full gap-4">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] flex-1 px-8 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black rounded-2xl uppercase tracking-wider text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95"
          disabled={loading}
        >
          ANNULER
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="min-h-[48px] flex-[2] px-8 py-3.5 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-wider text-xs hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:grayscale"
          disabled={loading || !formData.technician_id || !selectedClientId}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <Save size={18} />
              {interventionType === "scheduled" ? "PLANIFIER" : "ENREGISTRER LE RAPPORT"}
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
        {/* Toggle Type Direct / Planifié */}
        {!interventionId && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mt-2 mx-1">
            <button
              onClick={() => setInterventionType("scheduled")}
              className={`min-h-[44px] flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                interventionType === "scheduled"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Planifier
            </button>
            <button
              onClick={() => setInterventionType("direct")}
              className={`min-h-[44px] flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                interventionType === "direct"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Rapport (Direct)
            </button>
          </div>
        )}

        {/* Bouton clôture rapide si déjà planifié */}
        {interventionId && interventionType === "scheduled" && (
          <div className="mx-1">
            <button
              onClick={() => {
                setInterventionType("direct");
                setFormData((prev) => ({
                  ...prev,
                  scheduled_date: new Date().toISOString().split("T")[0],
                }));
              }}
              className="min-h-[48px] w-full py-4 bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800/50 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-2"
            >
              <CheckSquare size={18} />
              Valider & Clôturer cette intervention
            </button>
          </div>
        )}

        {/* Section 1: Configuration Client, Technicien, Date, Bassin */}
        <div className="flex flex-col gap-4 p-1">
          {/* Date de réalisation / planification */}
          <div className="relative">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-1 block">
              {interventionType === "direct" ? "Date de réalisation" : "Date de planification"}
            </label>
            <input
              type="date"
              className="w-full min-h-[48px] p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-bold text-base text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              aria-label={interventionType === "direct" ? "Date de réalisation" : "Date de planification"}
              title={interventionType === "direct" ? "Date de réalisation" : "Date de planification"}
            />
          </div>

          {/* Choix Client et Technicien */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="min-h-[56px] w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Client</span>
                <span className="text-sm font-black text-slate-800 dark:text-white uppercase truncate max-w-[220px]">
                  {dbClients.find((c) => c.id === selectedClientId)
                    ? `${dbClients.find((c) => c.id === selectedClientId)?.first_name} ${dbClients.find((c) => c.id === selectedClientId)?.last_name}`
                    : "Choisir un client"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => isAdmin && setIsTechModalOpen(true)}
              disabled={!isAdmin}
              className={`min-h-[56px] w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 transition-all group text-left ${
                isAdmin ? "hover:border-blue-500/30" : "opacity-75 cursor-not-allowed"
              }`}
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
                <User size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Technicien</span>
                <span className="text-sm font-black text-slate-800 dark:text-white uppercase truncate max-w-[220px]">
                  {dbTechnicians.find((t) => t.id === formData.technician_id)?.full_name || "Choisir un technicien"}
                </span>
              </div>
            </button>
          </div>

          {/* Choix Bassin */}
          {selectedClientId && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Bassin Concerné
                </label>
                <button
                  type="button"
                  onClick={() => setIsPoolModalOpen(true)}
                  className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-wider hover:bg-blue-500/20 transition-all"
                >
                  <Plus size={14} strokeWidth={3} /> Nouveau
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {dbPools.length > 0 ? (
                  dbPools.map((pool) => (
                    <button
                      key={pool.id}
                      type="button"
                      onClick={() => setSelectedPoolId(pool.id)}
                      className={`min-h-[48px] px-6 py-3 rounded-2xl border-2 font-black uppercase tracking-tight text-xs transition-all whitespace-nowrap ${
                        selectedPoolId === pool.id
                          ? "bg-blue-600 border-blue-600 text-white shadow-md"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-blue-500/30"
                      }`}
                    >
                      {pool.name}
                    </button>
                  ))
                ) : (
                  <p className="text-xs font-bold text-slate-500 italic px-2">Aucun bassin trouvé</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Analyse de l'eau & Tâches (Uniquement si Direct) */}
        {interventionType === "direct" && (
          <WaterAnalysisSection
            formData={formData}
            setFormData={setFormData}
            availableDevis={availableDevis}
          />
        )}

        {/* Section 3: Prestations, Produits & Devis (Uniquement si Direct) */}
        {interventionType === "direct" && (
          <ServicesAndProductsSection
            formData={formData}
            dbServices={dbServices}
            dbProducts={dbProducts}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            usedProducts={usedProducts}
            setUsedProducts={setUsedProducts}
            devisConsumption={devisConsumption}
            setDevisConsumption={setDevisConsumption}
            onOpenServiceModal={() => setServiceModalOpen(true)}
            onOpenProductModal={() => setProductModalOpen(true)}
          />
        )}

        {/* Section 4: Photos & Observations */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Preuves & Observations
            </span>
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
            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 font-medium text-base text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Section 5: Résumé Financier & Paiement (Uniquement si Direct) */}
        {interventionType === "direct" && (
          <PaymentSection
            totalAmount={totalAmount}
            formData={formData}
            setFormData={setFormData}
            isAdmin={isAdmin}
            technicians={dbTechnicians}
            amountInputRef={amountInputRef}
          />
        )}
      </div>

      {/* Boîtes Modales Secondaires */}
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
        <AddProductModal
          availableProducts={dbProducts.filter((p) => usedProducts[p.id] === undefined)}
          onClose={() => setProductModalOpen(false)}
          onAdd={(pId, quantity, unitPrice) => {
            setUsedProducts((prev) => ({ ...prev, [pId]: { quantity, unitPrice } }));
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
