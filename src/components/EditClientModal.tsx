import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, Mail, Globe, FileText } from 'lucide-react';
import ModalLayout from './ModalLayout';
import { toast } from 'react-hot-toast';
import Input from './ui/Input';
import Button from './ui/Button';
import Combobox from './ui/Combobox';
import MapPicker from './MapPicker';
import { TUNISIAN_CITIES } from '../lib/constants';

interface EditClientModalProps {
    client: any;
    onClose: () => void;
    onSuccess: () => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ client, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(true);
    const [formData, setFormData] = useState({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        phone: client.phone || '',
        phone2: client.phone2 || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        gps_lat: client.gps_lat?.toString() || '',
        gps_lng: client.gps_lng?.toString() || '',
        notes: client.notes || '',
        status: client.status || 'active'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    phone2: formData.phone2,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
                    gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
                    notes: formData.notes,
                    status: formData.status
                })
                .eq('id', client.id);

            if (error) throw error;

            toast.success('Client mis à jour avec succès');
            onSuccess();
            onClose();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
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
                form="edit-client-form"
                className="flex-[2]"
                loading={loading}
            >
                VALIDER
            </Button>
        </div>
    );

    return (
        <ModalLayout
            title="MODIFIER LE CLIENT"
            onClose={onClose}
            actions={actions}
        >
            <form id="edit-client-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">

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
                        <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Phone size={12} className="text-slate-500" /> Téléphones
                        </label>
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsWhatsAppEnabled(!isWhatsAppEnabled)}>
                            <span className="text-base text-slate-500">WhatsApp enabled</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${isWhatsAppEnabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${isWhatsAppEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Téléphone 1"
                        icon={Phone}
                        placeholder="20 123 456"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Input
                        label="Téléphone 2 (Optionnel)"
                        icon={Phone}
                        placeholder="50 987 654"
                        value={formData.phone2}
                        onChange={e => setFormData({ ...formData, phone2: e.target.value })}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Combobox
                        label="Ville"
                        icon={Globe}
                        options={TUNISIAN_CITIES}
                        value={formData.city}
                        onChange={value => setFormData({ ...formData, city: value })}
                    />
                    <Input
                        label="Adresse"
                        icon={MapPin}
                        placeholder="Ex: Avenue Habib Bourguiba"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <Globe size={12} className="text-slate-500" /> Géolocalisation
                    </label>
                    <MapPicker
                        lat={formData.gps_lat ? parseFloat(formData.gps_lat) : null}
                        lng={formData.gps_lng ? parseFloat(formData.gps_lng) : null}
                        onPositionChange={(lat, lng) => setFormData({
                            ...formData,
                            gps_lat: lat.toString(),
                            gps_lng: lng.toString()
                        })}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <FileText size={12} className="text-slate-500 dark:text-slate-500" /> Notes Internes
                    </label>
                    <textarea
                        className="w-full min-h-[100px] p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium text-slate-700 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-y"
                        placeholder="Notes concernant le client..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 cursor-pointer" onClick={() => setFormData({ ...formData, status: formData.status === 'active' ? 'inactive' : 'active' })}>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${formData.status === 'active' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${formData.status === 'active' ? 'left-[22px]' : 'left-1'}`} />
                    </div>
                    <div>
                        <p className="text-base font-bold text-slate-700 dark:text-white">Compte Actif</p>
                        <p className="text-base text-slate-500">Le client peut être sélectionné pour des interventions</p>
                    </div>
                </div>
            </form>
        </ModalLayout>
    );
};

export default EditClientModal;
