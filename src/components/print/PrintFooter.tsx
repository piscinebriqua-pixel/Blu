import React from 'react';
import type { PrintCompanyInfo } from './types';
import { Phone, Mail, Globe } from 'lucide-react';

interface PrintFooterProps {
  companyInfo: PrintCompanyInfo;
}

export const PrintFooter: React.FC<PrintFooterProps> = ({ companyInfo }) => {
  const companyName = companyInfo.company_name || 'BLU POOL MANAGEMENT';
  const companyTaxId = companyInfo.tax_id || '';
  const companyPhone = companyInfo.phone || '+216 58 790 185';
  const companyEmail = companyInfo.email || 'cleanandcleanpool@gmail.com';
  const companyAddress = companyInfo.address || '02 Omar ben Kalthoum Nabeul 8000';
  const website = companyInfo.website || '';
  const rne = companyInfo.rne || '';

  return (
    <div className="w-full mt-3 break-inside-avoid">
      {/* GRAND BANDEAU PLEIN BLEU NUIT COMPACT */}
      <div className="bg-[#0b192c] text-white py-2.5 px-4 rounded-lg space-y-2 shadow-sm">
        {/* CAPSULES DE CONTACT HORIZONTALES */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold">
          {/* Capsule Téléphone */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
            <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Phone size={14} strokeWidth={2.5} />
            </div>
            <span>{companyPhone}</span>
          </div>

          {/* Capsule Email */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
            <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Mail size={14} strokeWidth={2.5} />
            </div>
            <span>{companyEmail}</span>
          </div>

          {/* Capsule Site Web */}
          {website && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60">
              <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                <Globe size={14} strokeWidth={2.5} />
              </div>
              <span>{website}</span>
            </div>
          )}
        </div>

        {/* LIGNE DE MENTIONS LÉGALES & IDENTIFICATION FISCALE */}
        <div className="text-center text-xs font-medium text-slate-400 border-t border-slate-800/80 pt-1.5 space-y-0.5">
          <p>
            <strong className="text-slate-200">{companyName}</strong>
            {companyTaxId && <> • Matricule Fiscal : <strong className="text-slate-200">{companyTaxId}</strong></>}
            {rne && <> • RNE : <strong className="text-slate-200">{rne}</strong></>}
          </p>
          <p>
            Siège social : {companyAddress} • Document officiel émis par {companyName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintFooter;
