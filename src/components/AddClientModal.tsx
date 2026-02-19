import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Phone, MapPin, User, Mail, Globe, FileText } from 'lucide-react';
import ModalLayout from './ModalLayout';
import Input from './ui/Input';
import Button from './ui/Button';

interface AddClientModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(true);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error: clientError } = await supabase
                .from('clients')
                .insert([{
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    email: formData.email,
                    city: formData.city,
                    address: formData.address,
                    notes: formData.notes,
                    balance: 0
                }]);

            if (clientError) throw clientError;

            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const actions = (
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
                form="add-client-form"
                className="flex-[2]"
                loading={loading}
            >
                ENREGISTRER LE CLIENT
            </Button>
        </div>
    );

    return (
        <ModalLayout
            title="NOUVEAU CLIENT"
            onClose={onClose}
            actions={actions}
        >
            <form id="add-client-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Prénom"
                        icon={User}
                        required
                        placeholder="Jean"
                        value={formData.first_name}
                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    />
                    <Input
                        label="Nom"
                        icon={User}
                        required
                        placeholder="Dupont"
                        value={formData.last_name}
                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center w-full">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" /> Téléphone
                        </label>
                        {/* Custom switch can remain or be standardized later */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsWhatsAppEnabled(!isWhatsAppEnabled)}>
                            <span className="text-[10px] text-slate-400">WhatsApp enabled</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${isWhatsAppEnabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${isWhatsAppEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                            </div>
                        </div>
                    </div>
                    <Input
                        type="tel"
                        required
                        placeholder="+33 6 12 34 56 78"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <Input
                    label="Email"
                    icon={Mail}
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />

                <Input
                    label="Ville"
                    icon={Globe}
                    placeholder="Paris"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                />

                <Input
                    label="Adresse"
                    icon={MapPin}
                    required
                    placeholder="123 Rue de la Piscine, 75001"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                />

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <FileText size={12} className="text-slate-400" /> Notes Internes
                    </label>
                    <textarea
                        className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-y"
                        placeholder="Client intéressé par la rénovation du bassin..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>
            </form>
        </ModalLayout>
    );
};

export default AddClientModal;
