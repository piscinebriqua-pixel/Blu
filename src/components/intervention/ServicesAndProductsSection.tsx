import React from "react";
import { Calculator, Waves, Plus, X, FileText } from "lucide-react";
import type { Service, Product, DevisItemConsumption, NewInterventionFormData } from "./types";

interface ServicesAndProductsSectionProps {
  formData: NewInterventionFormData;
  dbServices: Service[];
  dbProducts: Product[];
  selectedServices: Record<string, number>;
  setSelectedServices: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  usedProducts: { [key: string]: { quantity: number; unitPrice: number } };
  setUsedProducts: React.Dispatch<React.SetStateAction<{ [key: string]: { quantity: number; unitPrice: number } }>>;
  devisConsumption: DevisItemConsumption[];
  setDevisConsumption: React.Dispatch<React.SetStateAction<DevisItemConsumption[]>>;
  onOpenServiceModal: () => void;
  onOpenProductModal: () => void;
}

export const ServicesAndProductsSection: React.FC<ServicesAndProductsSectionProps> = ({
  formData,
  dbServices,
  dbProducts,
  selectedServices,
  setSelectedServices,
  usedProducts,
  setUsedProducts,
  devisConsumption,
  setDevisConsumption,
  onOpenServiceModal,
  onOpenProductModal,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Titre Intervention & Coûts */}
      <div className="flex items-center gap-3">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
        <div className="flex items-center gap-2 text-violet-500">
          <Calculator size={18} strokeWidth={2.5} />
          <span className="text-sm font-black uppercase tracking-[0.25em]">Intervention & Coûts</span>
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
      </div>

      {/* 1. SECTION ARTICLES DU DEVIS (SI DEVIS SÉLECTIONNÉ ET PAS FACTURATION FINALE) */}
      {formData.devis_id && !formData.is_final_devis_billing && (
        <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FileText size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
              Articles du Devis Sélectionné
            </h4>
          </div>

          <div className="space-y-3">
            {devisConsumption.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-4">
                Recherche des articles...
              </p>
            ) : (
              devisConsumption.map((item, index) => {
                if (item.is_header) {
                  return (
                    <div key={item.id} className="pt-4 pb-2">
                      <h5 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">{item.designation}</h5>
                    </div>
                  );
                }

                const remaining = Math.max(0, item.total_quantity - item.consumed);
                const isFullyConsumed = remaining <= 0;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                      isFullyConsumed
                        ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-60'
                        : item.to_consume > 0
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">{item.designation}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                        PU: <span className="text-blue-500 font-black">{item.unit_price} DT</span>{' '}
                        <span className="mx-2 opacity-50">|</span>{' '}
                        <span className={remaining > 0 ? 'text-emerald-500 font-black' : 'text-slate-400'}>
                          Reste: {remaining} {item.unit}
                        </span>
                      </p>
                    </div>

                    {!isFullyConsumed ? (
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            const newConsumptions = [...devisConsumption];
                            newConsumptions[index].to_consume = Math.max(0, item.to_consume - 1);
                            setDevisConsumption(newConsumptions);
                          }}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-red-500 shadow-sm flex items-center justify-center font-black active:scale-95 transition-all text-sm"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-black text-slate-800 dark:text-white">
                          {item.to_consume}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newConsumptions = [...devisConsumption];
                            newConsumptions[index].to_consume = Math.min(remaining, item.to_consume + 1);
                            setDevisConsumption(newConsumptions);
                          }}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-500 shadow-sm flex items-center justify-center font-black active:scale-95 transition-all text-sm"
                        >
                          +
                        </button>
                        {Number(remaining) > 0 && Number(remaining) !== Number(item.to_consume) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newConsumptions = [...devisConsumption];
                              newConsumptions[index].to_consume = remaining;
                              setDevisConsumption(newConsumptions);
                            }}
                            className="px-2.5 h-8 rounded-lg bg-blue-500/10 text-blue-500 text-xs flex items-center justify-center font-black active:scale-95 transition-all hover:bg-blue-500 hover:text-white uppercase tracking-wider border border-blue-500/20"
                            title="Consommer tout le reste"
                          >
                            Max
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                        <span className="font-black text-xs uppercase tracking-widest">Achevé</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. SERVICES HORS-DEVIS */}
      <div
        className={`p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative transition-all ${
          formData.devis_id && !formData.is_final_devis_billing ? 'opacity-30 grayscale pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-primary">
              <Waves size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
              Services Effectués (Hors-Devis)
            </h4>
          </div>
          {!formData.devis_id && (
            <button
              type="button"
              title="Ajouter un service"
              onClick={onOpenServiceModal}
              className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {formData.devis_id && !formData.is_final_devis_billing ? (
          <div className="py-4 text-center">
            <p className="text-xs font-black text-blue-500 uppercase tracking-widest">
              🔒 Sélectionnez les articles du devis ci-dessus
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(selectedServices).map(([sId, price]) => (
              <div
                key={sId}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-blue-500/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Waves size={18} />
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                    {dbServices.find((s) => s.id === sId)?.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:border-blue-500 transition-colors">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSelectedServices({ ...selectedServices, [sId]: val });
                      }}
                      className="w-24 bg-transparent border-none focus:ring-0 text-xl font-black text-blue-600 dark:text-blue-400 text-right p-0"
                      onFocus={(e) => e.target.select()}
                    />
                    <span className="text-xs font-black text-slate-400 uppercase ml-2 tracking-widest">DT</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...selectedServices };
                      delete next[sId];
                      setSelectedServices(next);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    title="Supprimer ce service"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
            {Object.keys(selectedServices).length === 0 && (
              <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  Aucun service sélectionné
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. PRODUITS CONSOMMÉS */}
      <div className="flex flex-col gap-3">
        {Object.entries(usedProducts).map(([pId, item]) => (
          <div
            key={pId}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-violet-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                <span className="font-black text-xs">{dbProducts.find((p) => p.id === pId)?.unit}</span>
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                {dbProducts.find((p) => p.id === pId)?.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:border-violet-500 transition-colors">
                <span className="text-xs font-black text-slate-400 uppercase mr-1.5 opacity-70">Qté</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setUsedProducts({ ...usedProducts, [pId]: { ...item, quantity: val } });
                  }}
                  className="w-12 bg-transparent border-none focus:ring-0 text-base font-black text-violet-600 dark:text-violet-400 text-center p-0"
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:border-violet-500 transition-colors">
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setUsedProducts({ ...usedProducts, [pId]: { ...item, unitPrice: val } });
                  }}
                  className="w-20 bg-transparent border-none focus:ring-0 text-xl font-black text-violet-600 dark:text-violet-400 text-right p-0"
                  onFocus={(e) => e.target.select()}
                />
                <span className="text-xs font-black text-slate-400 uppercase ml-1.5 opacity-70">DT</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = { ...usedProducts };
                  delete next[pId];
                  setUsedProducts(next);
                }}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                title="Supprimer ce produit"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Boutons d'ajout */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenServiceModal}
          className="px-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:border-blue-500/20 active:scale-95 transition-all shadow-sm min-h-[48px]"
        >
          <Plus size={16} strokeWidth={3} /> Ajouter Prestation
        </button>
        <button
          type="button"
          onClick={onOpenProductModal}
          className="px-4 py-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:border-blue-500/20 active:scale-95 transition-all shadow-sm min-h-[48px]"
        >
          <Plus size={16} strokeWidth={3} /> Ajouter Produit
        </button>
      </div>
    </div>
  );
};
