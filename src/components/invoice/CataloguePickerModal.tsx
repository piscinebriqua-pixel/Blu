import React, { useState, useEffect } from 'react';
import ModalLayout from '../ModalLayout';
import { invoiceService } from '../../services/invoiceService';
import { Search, Tag, Package, Plus, Check } from 'lucide-react';

interface CataloguePickerModalProps {
  onClose: () => void;
  onAddItem: (name: string, price: number, unit?: string) => void;
}

export const CataloguePickerModal: React.FC<CataloguePickerModalProps> = ({
  onClose,
  onAddItem,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  useEffect(() => {
    loadCatalogue();
  }, []);

  const loadCatalogue = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.fetchCatalogue();
      setServices(data.services);
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (id: string, name: string, price: number, unit?: string) => {
    onAddItem(name, price, unit);
    setAddedIds((prev) => [...prev, id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((i) => i !== id));
    }, 1200);
  };

  const filteredServices = services.filter((s) =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const filteredProducts = products.filter((p) =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <ModalLayout
      title="Catalogue Entreprise (Services & Produits)"
      onClose={onClose}
      className="max-w-xl"
    >
      <div className="space-y-4">
        {/* Onglets Services vs Produits */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'services'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Tag size={16} /> Prestations ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'products'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Package size={16} /> Produits & Matériel ({products.length})
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une prestation ou un produit..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-semibold"
          />
        </div>

        {/* Liste */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase">
              Chargement du catalogue...
            </div>
          ) : activeTab === 'services' ? (
            filteredServices.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase">
                Aucune prestation trouvée
              </div>
            ) : (
              filteredServices.map((s) => {
                const isJustAdded = addedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {s.name}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {Number(s.price || 0).toFixed(2)} DT
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdd(s.id, s.name, Number(s.price) || 0, 'forfait')}
                      className={`min-h-[44px] px-3.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-primary text-white hover:bg-blue-600 active:scale-95 shadow-sm'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check size={16} /> Ajouté
                        </>
                      ) : (
                        <>
                          <Plus size={16} /> Ajouter
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )
          ) : filteredProducts.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase">
              Aucun produit trouvé
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isJustAdded = addedIds.includes(p.id);
              const price = Number(p.price_per_unit || 0);
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {p.name}
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      {price.toFixed(2)} DT {p.unit ? `/ ${p.unit}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(p.id, p.name, price, p.unit || 'u')}
                    className={`min-h-[44px] px-3.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all ${
                      isJustAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary text-white hover:bg-blue-600 active:scale-95 shadow-sm'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check size={16} /> Ajouté
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Ajouter
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black uppercase text-slate-700 dark:text-slate-300"
          >
            Fermer le Catalogue
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};
