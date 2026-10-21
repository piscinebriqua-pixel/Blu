import React from 'react';
import { Landmark, CreditCard } from 'lucide-react';
import { TUNISIAN_BANKS } from '../../helpers/taxIdHelper';

interface CompanyBankCardProps {
  bankName: string;
  bankRib: string;
  bankIban: string;
  onChange: (field: string, value: string) => void;
}

export const CompanyBankCard: React.FC<CompanyBankCardProps> = ({
  bankName,
  bankRib,
  bankIban,
  onChange,
}) => {
  return (
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
        {/* Établissement Bancaire */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
            Établissement Bancaire
          </label>
          <div className="relative">
            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              list="tunisian-banks-list"
              value={bankName}
              onChange={(e) => onChange('bank_name', e.target.value)}
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

        {/* Code RIB (20 chiffres) */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
            Code RIB (20 Chiffres)
          </label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={bankRib}
              onChange={(e) => onChange('bank_rib', e.target.value)}
              className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all"
              placeholder="Ex: 08 012 0001234567890 12"
            />
          </div>
        </div>

        {/* IBAN / SWIFT International */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
            IBAN / SWIFT International (Optionnel)
          </label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={bankIban}
              onChange={(e) => onChange('bank_iban', e.target.value.toUpperCase())}
              className="w-full min-h-[48px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all uppercase"
              placeholder="Ex: TN59 0801 2000 1234 5678 9012"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
