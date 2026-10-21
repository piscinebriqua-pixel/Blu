import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Save, Loader2, FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import { CompanyIdentityCard } from '../components/company/CompanyIdentityCard';
import { CompanyContactCard } from '../components/company/CompanyContactCard';
import { CompanyBankCard } from '../components/company/CompanyBankCard';

export const CompanySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: '',
    activity_title: 'Ingénierie & Services Aquatiques',
    phone: '',
    phone2: '',
    email: '',
    address: '',
    tax_id: '',
    rne: '',
    website: '',
    bank_name: 'BIAT',
    bank_rib: '',
    bank_iban: '',
    default_footer: '',
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
        setSettings((prev) => ({
          ...prev,
          ...data.value,
        }));
      }
    } catch (err: unknown) {
      console.error('Error fetching company settings:', err);
      toast.error('Impossible de charger les réglages société');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'company_info',
            value: settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
      toast.success('Données de la société enregistrées avec succès');
    } catch (err: unknown) {
      console.error('Error saving company settings:', err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Paramètres Société" showBackButton={true}>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-sm font-bold text-slate-500">Chargement des paramètres...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Paramètres de la Société"
      subtitle="Identité fiscale (Norme Tunisienne), coordonnées bancaires & contact officiel"
      showBackButton={true}
    >
      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* CARTE 1 : IDENTITÉ FISCALE & RAISON SOCIALE (AVEC FORME TUNISIENNE DÉTAILLÉE) */}
        <CompanyIdentityCard
          companyName={settings.company_name}
          activityTitle={settings.activity_title}
          taxId={settings.tax_id}
          rne={settings.rne}
          onChange={handleChange}
        />

        {/* CARTE 2 : CONTACT & SIÈGE SOCIAL */}
        <CompanyContactCard
          phone={settings.phone}
          phone2={settings.phone2}
          email={settings.email}
          website={settings.website}
          address={settings.address}
          onChange={handleChange}
        />

        {/* CARTE 3 : BANQUE & RIB BANCAIRE */}
        <CompanyBankCard
          bankName={settings.bank_name}
          bankRib={settings.bank_rib}
          bankIban={settings.bank_iban}
          onChange={handleChange}
        />

        {/* CARTE 4 : MENTIONS & PIED DE PAGE PAR DÉFAUT */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                4. Pied de Page & Modalités par Défaut
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Clauses complémentaires appliquées automatiquement aux nouveaux devis
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <textarea
              rows={4}
              value={settings.default_footer}
              onChange={(e) => handleChange('default_footer', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all resize-none"
              placeholder="Ex: Les règlements s'effectuent par chèque ou virement bancaire. Validité du devis 30 jours..."
            />
          </div>
        </div>

        {/* BOUTON ENREGISTRER FIXE / BAS */}
        <div className="sticky bottom-6 z-20">
          <Button
            type="submit"
            loading={saving}
            className="w-full min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            <span>Enregistrer les coordonnées de la société</span>
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default CompanySettings;
