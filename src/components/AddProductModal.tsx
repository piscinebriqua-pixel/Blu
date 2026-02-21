import React, { useState, useEffect } from 'react';
import ModalLayout from './ModalLayout';
import Combobox from './ui/Combobox';
import Button from './ui/Button';
import Input from './ui/Input';

interface Product { id: string; name: string; unit: string; price_per_unit: number; }

interface AddProductModalProps {
    availableProducts: Product[];
    onClose: () => void;
    onAdd: (productId: string, quantity: number) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ availableProducts, onClose, onAdd }) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('1');

    useEffect(() => {
        if (!selectedProductId) {
            setQuantity('1');
        }
    }, [selectedProductId]);

    const handleAdd = () => {
        if (selectedProductId && quantity) {
            onAdd(selectedProductId, parseFloat(quantity));
        }
    };

    const actions = (
        <div className="flex gap-2 w-full">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!selectedProductId || !quantity || parseFloat(quantity) <= 0} className="flex-[2]">
                Ajouter le produit
            </Button>
        </div>
    );

    const selectedProduct = availableProducts.find(p => p.id === selectedProductId);

    return (
        <ModalLayout title="Ajouter un produit" onClose={onClose} actions={actions}>
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
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

                {selectedProductId && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                        <Input
                            label={`Quantité (${selectedProduct?.unit || 'unité'})`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Quantité utilisée"
                        />
                    </div>
                )}
            </div>
        </ModalLayout>
    );
};

export default AddProductModal;
