import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Hash, 
  Loader2, 
  Building2, 
  Landmark, 
  Globe, 
  FileText,
  CreditCard,
  Briefcase
} from 'lucide-react';
import Button from '../components/ui/Button';

const TUNISIAN_BANKS = [
  'BIAT',
  'Attijari Bank',
  'Amen Bank',
  'BNA (Banque Nationale Agricole)',
  'STB (Société Tunisienne de Banque)',
  'BH Bank',
  'UIB (Union Internationale de Banques)',
  'UBCI',
  'Banque de Tunisie (BT)',
  'ATB (Arab Tunisian Bank)',
  'Banque Zitouna',
  'Al Baraka Bank',
  'WIFAK Bank',
  'QNB Tunisie',
  'BTK (Banque Tuniso-Koweitienne)',
  'BTL (Banque Tuniso-Libyenne)',
  'TSB (Tunisian Saudi Bank)',
  'Autre / Saisie libre'
];

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
      subtitle="Identité fiscale, coordonnées bancaires & contact affichés sur les devis et factures"
      showBackButton={true}
    >
      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* CARTE 1 : IDENTITÉ FISCALE & RAISON SOCIALE */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                1. Identité Officielle & Fiscale
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Informations légales figurant dans l'en-tête de vos documents
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Raison Sociale / Nom Commercial <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: BLU POOL MANAGEMENT"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Sous-titre / Spécialité d'activité
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={settings.activity_title}
                  onChange={(e) => setSettings({ ...settings, activity_title: e.target.value })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: Ingénierie & Services Aquatiques"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Matricule Fiscal Société (M.F.) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={settings.tax_id}
                  onChange={(e) => setSettings({ ...settings, tax_id: e.target.value.toUpperCase() })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: 000 CN1299406 ou 1548962/A/M/000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Registre de Commerce (RNE)
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={settings.rne}
                  onChange={(e) => setSettings({ ...settings, rne: e.target.value.toUpperCase() })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: 1548962M"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 2 : CONTACT & SIÈGE SOCIAL */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Phone size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                2. Contact & Siège Social
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Coordonnées visibles pour vos clients en en-tête et pied de page
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Téléphone Principal <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  required
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="+216 58 790 185"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Téléphone Secondaire (Optionnel)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  value={settings.phone2 || ''}
                  onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="+216 -- --- ---"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Email Officiel <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="contact@cleanandcleanpool.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Site Web
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="www.cleanandcleanpool.tn"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Adresse Complète du Siège Social <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea
                  rows={2}
                  required
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all resize-none"
                  placeholder="02 Omar ben Kalthoum, Nabeul 8000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 3 : BANQUE & RIB BANCAIRE */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Landmark size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                3. Coordonnées Bancaires (Virements & Règlements)
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Imprimées dans le cartouche financier pour faciliter les virements clients
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Établissement Bancaire
              </label>
              <div className="relative">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  list="tunisian-banks-list"
                  value={settings.bank_name}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: BIAT ou Attijari Bank"
                />
                <datalist id="tunisian-banks-list">
                  {TUNISIAN_BANKS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Code RIB (Relevé d'Identité Bancaire)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={settings.bank_rib}
                  onChange={(e) => setSettings({ ...settings, bank_rib: e.target.value })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: 08 012 0001234567890 12"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                IBAN / SWIFT International (Optionnel)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={settings.bank_iban || ''}
                  onChange={(e) => setSettings({ ...settings, bank_iban: e.target.value.toUpperCase() })}
                  className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
                  placeholder="Ex: TN59 0801 2000 1234 5678 9012"
                />
              </div>
            </div>
          </div>
        </div>

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
              onChange={(e) => setSettings({ ...settings, default_footer: e.target.value })}
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
            <span>Enregistrer toutes les modifications</span>
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default CompanySettings;
