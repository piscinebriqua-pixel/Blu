import React, { useState, useEffect } from 'react';
import ModalLayout from './ModalLayout';
import Combobox from './ui/Combobox';
import Button from './ui/Button';
import Input from './ui/Input';

interface Service { id: string; name: string; price: number; }

interface AddServiceModalProps {
    availableServices: Service[];
    referencePrices: Record<string, number>;
    onClose: () => void;
    onAdd: (serviceId: string, price: number) => void;
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({ availableServices, referencePrices, onClose, onAdd }) => {
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        if (selectedServiceId) {
            const srv = availableServices.find(s => s.id === selectedServiceId);
            if (srv) {
                setPrice((referencePrices[srv.id] ?? srv.price).toString());
            }
        } else {
            setPrice('');
        }
    }, [selectedServiceId, availableServices, referencePrices]);

    const handleAdd = () => {
        if (selectedServiceId && price) {
            onAdd(selectedServiceId, parseFloat(price));
        }
    };

    const actions = (
        <div className="flex gap-2 w-full">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!selectedServiceId || !price} className="flex-[2]">
                Valider
            </Button>
        </div>
    );

    return (
        <ModalLayout title="Ajouter un service" onClose={onClose} actions={actions}>
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-2">
                    <Combobox
                        label="Sélectionner un service"
                        options={availableServices.map(s => `${s.name} (${s.price} DT)`)}
                        value={selectedServiceId ? `${availableServices.find(s => s.id === selectedServiceId)?.name} (${availableServices.find(s => s.id === selectedServiceId)?.price} DT)` : ''}
                        onChange={(val) => {
                            const srv = availableServices.find(s => `${s.name} (${s.price} DT)` === val);
                            if (srv) {
                                setSelectedServiceId(srv.id);
                            } else {
                                setSelectedServiceId('');
                            }
                        }}
                        placeholder="Rechercher un service..."
                    />
                </div>

                {selectedServiceId && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                        <Input
                            label="Prix (DT)"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Prix du service"
                        />
                    </div>
                )}
            </div>
        </ModalLayout>
    );
};

export default AddServiceModal;
