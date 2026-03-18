import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Save, Phone, Mail, MapPin, Hash, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';

const CompanySettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        phone: '',
        email: '',
        address: '',
        tax_id: '',
        default_footer: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('key', 'company_info')
                .maybeSingle();

            if (error) throw error;

            if (data?.value) {
                setSettings(data.value);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('settings')
                .upsert({
                    key: 'company_info',
                    value: settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            toast.success('Réglages enregistrés avec succès');
        } catch (err: any) {
            console.error('Error saving settings:', err);
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title="Coordonnées Société" showBackButton={true}>
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Coordonnées Société"
            subtitle="Informations affichées sur vos devis"
            showBackButton={true}
        >
            <div className="max-w-2xl mx-auto space-y-6 pb-20">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Numéro de Téléphone</label>
                            <div className="relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={settings.phone}
                                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                    className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 font-bold outline-none focus:border-primary transition-all"
                                    placeholder="+216 -- --- ---"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Email de contact</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                    className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 font-bold outline-none focus:border-primary transition-all"
                                    placeholder="contact@societe.com"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Adresse de la société</label>
                            <div className="relative">
                                <MapPin className="absolute left-5 top-5 text-slate-400" size={18} />
                                <textarea
                                    value={settings.address}
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                    className="w-full h-32 pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 font-bold outline-none focus:border-primary transition-all resize-none"
                                    placeholder="Adresse complète..."
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Matricule Fiscal</label>
                            <div className="relative">
                                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={settings.tax_id}
                                    onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
                                    className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 font-bold outline-none focus:border-primary transition-all"
                                    placeholder="MF: 0000000/A/B/C/000"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Pied de page par défaut</label>
                            <div className="relative">
                                <textarea
                                    value={settings.default_footer}
                                    onChange={(e) => setSettings({ ...settings, default_footer: e.target.value })}
                                    className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 font-bold outline-none focus:border-primary transition-all resize-none"
                                    placeholder="Conditions de paiement, RIB, validité de l'offre..."
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        loading={saving}
                        className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Save size={20} className="mr-2" />
                        Enregistrer les informations
                    </Button>
                </div>
            </div>
        </PageLayout>
    );
};

export default CompanySettings;
