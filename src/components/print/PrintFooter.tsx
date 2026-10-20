import React from 'react';
import type { PrintCompanyInfo } from './types';
import { Phone, Mail, Globe } from 'lucide-react';

interface PrintFooterProps {
  companyInfo: PrintCompanyInfo;
}

export const PrintFooter: React.FC<PrintFooterProps> = ({ companyInfo }) => {
  const companyName = companyInfo.company_name || 'BLU POOL MANAGEMENT';
  const companyTaxId = companyInfo.tax_id || 'MF: 1548962/A/M/000';
  const companyPhone = companyInfo.phone || '+216 98 123 456';
  const companyEmail = companyInfo.email || 'contact@blu-pool.tn';
  const companyAddress = companyInfo.address || 'Tunis, Tunisie';
  const website = companyInfo.website || 'www.blu-pool.tn';
  const rne = companyInfo.rne || '1548962M';

  return (
    <div className="w-full mt-3 break-inside-avoid">
      {/* GRAND BANDEAU PLEIN BLEU NUIT COMPACT */}
      <div className="bg-[#0b192c] text-white py-2.5 px-4 rounded-lg space-y-2 shadow-sm">
        {/* CAPSULES DE CONTACT HORIZONTALES */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] font-bold">
          {/* Capsule Téléphone */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60">
            <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Phone size={9} strokeWidth={2.5} />
            </div>
            <span>{companyPhone}</span>
          </div>

          {/* Capsule Email */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60">
            <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Mail size={9} strokeWidth={2.5} />
            </div>
            <span>{companyEmail}</span>
          </div>

          {/* Capsule Site Web */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60">
            <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Globe size={9} strokeWidth={2.5} />
            </div>
            <span>{website}</span>
          </div>
        </div>

        {/* LIGNE DE MENTIONS LÉGALES & IDENTIFICATION FISCALE */}
        <div className="text-center text-[10px] font-medium text-slate-400 border-t border-slate-800/80 pt-1.5 space-y-0.5">
          <p>
            <strong className="text-slate-200">{companyName}</strong> • Matricule Fiscal :{' '}
            <strong className="text-slate-200">{companyTaxId}</strong> • RNE : {rne}
          </p>
          <p>
            Siège social : {companyAddress} • Document officiel émis par Blu Pool Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintFooter;
