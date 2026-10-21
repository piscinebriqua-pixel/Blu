import React from 'react';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';

interface CompanyContactCardProps {
  phone: string;
  phone2: string;
  email: string;
  website: string;
  address: string;
  onChange: (field: string, value: string) => void;
}

export const CompanyContactCard: React.FC<CompanyContactCardProps> = ({
  phone,
  phone2,
  email,
  website,
  address,
  onChange,
}) => {
  return (
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
              value={phone}
              onChange={(e) => onChange('phone', e.target.value)}
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
              value={phone2}
              onChange={(e) => onChange('phone2', e.target.value)}
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
              value={email}
              onChange={(e) => onChange('email', e.target.value)}
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
              value={website}
              onChange={(e) => onChange('website', e.target.value)}
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
              value={address}
              onChange={(e) => onChange('address', e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-base outline-none focus:border-blue-500 transition-all resize-none"
              placeholder="02 Omar ben Kalthoum, Nabeul 8000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
