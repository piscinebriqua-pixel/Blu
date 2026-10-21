import React from 'react';
import { Building2, Briefcase, Hash, FileText, CheckCircle2, HelpCircle } from 'lucide-react';
import { formatTunisianTaxId, isTunisianTaxId, TUNISIAN_TAX_ID_EXAMPLE } from '../../helpers/taxIdHelper';

interface CompanyIdentityCardProps {
  companyName: string;
  activityTitle: string;
  taxId: string;
  rne: string;
  onChange: (field: string, value: string) => void;
}

export const CompanyIdentityCard: React.FC<CompanyIdentityCardProps> = ({
  companyName,
  activityTitle,
  taxId,
  rne,
  onChange,
}) => {
  const isValidTaxId = isTunisianTaxId(taxId);

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatTunisianTaxId(raw);
    onChange('tax_id', formatted);
  };

  return (
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
        {/* Raison Sociale */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
            Raison Sociale / Nom Commercial <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => onChange('company_name', e.target.value)}
              className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
              placeholder="Ex: BLU POOL MANAGEMENT ou BCCP"
            />
          </div>
        </div>

        {/* Spécialité / Activité */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
            Sous-titre / Spécialité d'activité
          </label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={activityTitle}
              onChange={(e) => onChange('activity_title', e.target.value)}
              className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
              placeholder="Ex: Ingénierie & Services Aquatiques"
            />
          </div>
        </div>

        {/* Matricule Fiscal Société (Norme Tunisienne) */}
        <div className="space-y-1.5 sm:col-span-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
              Matricule Fiscal (Norme Tunisienne) <span className="text-rose-500">*</span>
            </label>
            {taxId && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md ${
                  isValidTaxId
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                {isValidTaxId ? <CheckCircle2 size={12} /> : <HelpCircle size={12} />}
                {isValidTaxId ? 'Norme valide' : 'Format partiel'}
              </span>
            )}
          </div>

          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              required
              value={taxId}
              onChange={handleTaxIdChange}
              className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all uppercase"
              placeholder={`Ex: ${TUNISIAN_TAX_ID_EXAMPLE}`}
            />
          </div>

          {/* Guide visuel de décomposition de la norme tunisienne */}
          <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex items-center justify-between text-blue-900 dark:text-blue-300 font-black">
              <span>FORME LÉGALE TUNISIENNE :</span>
              <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                1234567/A/M/000
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              <strong>7 chiffres</strong> (Identifiant) / <strong>Lettre</strong> (Clé) / <strong>M</strong> (Société) ou <strong>P</strong> (Personne) / <strong>000</strong> (Siège).
            </p>
          </div>
        </div>

        {/* Registre de Commerce (RNE) */}
        <div className="space-y-1.5 sm:col-span-1">
          <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
            Registre de Commerce (RNE / R.C.)
          </label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={rne}
              onChange={(e) => onChange('rne', e.target.value.toUpperCase())}
              className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all uppercase"
              placeholder="Ex: 000 CN1299406 ou 1548962M"
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 ml-1 leading-tight">
            Numéro d'immatriculation au Registre National des Entreprises ou code RC.
          </p>
        </div>
      </div>
    </div>
  );
};
