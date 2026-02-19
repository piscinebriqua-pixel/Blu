import React, { useState, useEffect } from 'react';
import ModalLayout from './ModalLayout';
import { User, Phone, Mail } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';

interface Technician {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    active: boolean;
}

interface TechnicianModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent, data: any) => Promise<void>;
    technician: Technician | null;
    loading: boolean;
}

const TechnicianModal: React.FC<TechnicianModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    technician,
    loading
}) => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        active: true
    });

    useEffect(() => {
        if (technician) {
            setFormData({
                full_name: technician.full_name,
                phone: technician.phone || '',
                email: technician.email || '',
                active: technician.active
            });
        } else {
            setFormData({
                full_name: '',
                phone: '',
                email: '',
                active: true
            });
        }
    }, [technician, isOpen]);

    if (!isOpen) return null;

    return (
        <ModalLayout
            title={technician ? 'Modifier le Technicien' : 'Nouveau Technicien'}
            onClose={onClose}
            actions={
                <div className="flex gap-2 w-full">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        ANNULER
                    </Button>
                    <Button
                        type="submit"
                        form="tech-form"
                        className="flex-[2]"
                        size="lg"
                        loading={loading}
                    >
                        {technician ? 'ENREGISTRER' : 'CRÉER'}
                    </Button>
                </div>
            }
        >
            <form id="tech-form" onSubmit={(e) => onSubmit(e, formData)} className="flex flex-col gap-6 p-4">
                <Input
                    label="Identité"
                    icon={User}
                    required
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nom complet"
                />
                <Input
                    label="Téléphone"
                    icon={Phone}
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+216 00 000 000"
                />
                <Input
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="adresse@email.com"
                />
            </form>
        </ModalLayout>
    );
};

export default TechnicianModal;
