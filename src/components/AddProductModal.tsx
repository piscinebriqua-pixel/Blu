import React, { useState, useEffect } from 'react';
import ModalLayout from './ModalLayout';
import Combobox from './ui/Combobox';
import Button from './ui/Button';
import Input from './ui/Input';
import { Plus } from 'lucide-react';
import CreateProductModal from './CreateProductModal';

interface Product { id: string; name: string; unit: string; price_per_unit: number; }

interface AddProductModalProps {
    availableProducts: Product[];
    onClose: () => void;
    onAdd: (productId: string, quantity: number, unitPrice: number) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ availableProducts, onClose, onAdd }) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unitPrice, setUnitPrice] = useState('');

    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (selectedProductId) {
            const pdt = availableProducts.find(p => p.id === selectedProductId);
            if (pdt) {
                setUnitPrice(pdt.price_per_unit.toString());
            }
        } else {
            setUnitPrice('');
            setQuantity('1');
        }
    }, [selectedProductId, availableProducts]);

    const handleAdd = () => {
        if (selectedProductId && quantity && unitPrice) {
            onAdd(selectedProductId, parseFloat(quantity), parseFloat(unitPrice));
        }
    };

    const actions = (
        <div className="flex gap-2 w-full">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!selectedProductId || !quantity || !unitPrice || parseFloat(quantity) <= 0} className="flex-[2]">
                Valider
            </Button>
        </div>
    );

    const selectedProduct = availableProducts.find(p => p.id === selectedProductId);

    return (
        <ModalLayout title="Ajouter un produit" onClose={onClose} actions={actions}>
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Combobox
                                label="Sélectionner un produit"
                                options={availableProducts.map(p => `${p.name} (${p.price_per_unit} DT / ${p.unit})`)}
                                value={selectedProductId && selectedProduct ? `${selectedProduct.name} (${selectedProduct.price_per_unit} DT / ${selectedProduct.unit})` : ''}
                                onChange={(val) => {
                                    const pdt = availableProducts.find(p => `${p.name} (${p.price_per_unit} DT / ${p.unit})` === val);
                                    if (pdt) {
                                        setSelectedProductId(pdt.id);
                                    } else {
                                        setSelectedProductId('');
                                    }
                                }}
                                placeholder="Rechercher un produit..."
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="w-[54px] h-[54px] mt-7 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shrink-0"
                            title="Nouveau Produit"
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {showCreateModal && (
                        <CreateProductModal
                            onClose={() => setShowCreateModal(false)}
                            onSuccess={(newPdt) => {
                                onAdd(newPdt.id, 1, newPdt.price_per_unit);
                            }}
                        />
                    )}
                </div>

                {selectedProductId && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <Input
                            label={`Quantité (${selectedProduct?.unit || 'unité'})`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Ex: 5"
                        />
                        <Input
                            label="Prix Unitaire (DT)"
                            type="number"
                            step="0.1"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value)}
                            placeholder="Ex: 12.5"
                        />
                    </div>
                )}
            </div>
        </ModalLayout>
    );
};

export default AddProductModal;
