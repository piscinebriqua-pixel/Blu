import React from 'react';
import BccpLogo from '../BccpLogo';
import type { PrintDocumentData, PrintCompanyInfo } from './types';

interface PrintHeaderProps {
  data: PrintDocumentData;
  companyInfo: PrintCompanyInfo;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ data, companyInfo }) => {
  const isInvoice = data.type === 'facture';
  const companyName = companyInfo.company_name || 'BLU POOL MANAGEMENT';
  const companyActivity = companyInfo.activity_title || 'Ingénierie & Services Aquatiques';
  const companyTaxId = companyInfo.tax_id || '';
  const companyPhone = companyInfo.phone || '+216 58 790 185';
  const companyEmail = companyInfo.email || 'cleanandcleanpool@gmail.com';
  const companyAddress = companyInfo.address || '02 Omar ben Kalthoum Nabeul 8000';

  // Formatage des dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(data.date);
  const formattedDueDate = formatDate(data.dueDate);

  return (
    <div className="space-y-3 break-inside-avoid">
      {/* 1. EN-TÊTE SUPÉRIEUR : TITRE & MÉTADONNÉES À GAUCHE / LOGO & COORDONNÉES ÉMETTEUR À DROITE */}
      <div className="flex items-start justify-between gap-6 pb-3 border-b border-slate-200/80">
        {/* Côté Gauche : Grand Titre Document + Cartouche Métadonnées */}
        <div className="space-y-2 max-w-xs sm:max-w-sm flex-1">
          {/* Titre Document */}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-none">
              {isInvoice ? 'FACTURE' : 'DEVIS'}
            </h1>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Document Officiel • Format A4
            </p>
          </div>

          {/* Cartouche Métadonnées Document (Remonté selon flèches de l'utilisateur) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-1 text-xs">
            <div className="flex justify-between items-baseline gap-4">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                {isInvoice ? 'Facture N° :' : 'Devis N° :'}
              </span>
              <span className="text-xs font-black text-slate-900 font-mono">
                {data.documentNumber}
              </span>
            </div>

            <div className="flex justify-between items-baseline gap-4 border-t border-slate-200/60 pt-1">
              <span className="text-slate-500 font-bold text-[11px]">Date :</span>
              <span className="font-black text-slate-900 text-xs">{formattedDate}</span>
            </div>

            {isInvoice && formattedDueDate && (
              <div className="flex justify-between items-baseline gap-4 border-t border-slate-200/60 pt-1">
                <span className="text-slate-500 font-bold text-[11px]">Échéance :</span>
                <span className="font-black text-slate-900 text-xs">{formattedDueDate}</span>
              </div>
            )}

            {!isInvoice && (
              <div className="flex justify-between items-baseline gap-4 border-t border-slate-200/60 pt-1">
                <span className="text-slate-500 font-bold text-[11px]">Validité :</span>
                <span className="font-black text-slate-900 text-xs">
                  {data.validityDays ? `${data.validityDays} jours` : '30 jours'}
                </span>
              </div>
            )}

            {data.quoteReference && (
              <div className="flex justify-between items-baseline gap-4 border-t border-slate-200/60 pt-1">
                <span className="text-slate-500 font-bold text-[11px]">Réf. Devis :</span>
                <span className="font-mono font-bold text-slate-700 text-xs">{data.quoteReference}</span>
              </div>
            )}

            {data.poolInfo?.name && (
              <div className="flex justify-between items-baseline gap-4 border-t border-slate-200/60 pt-1">
                <span className="text-slate-500 font-bold text-[11px]">Site / Bassin :</span>
                <span className="font-black text-slate-900 uppercase text-xs">
                  {data.poolInfo.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Côté Droit : Logo Blu/BCCP et Raison Sociale Émettrice */}
        <div className="text-right flex flex-col items-end max-w-xs space-y-1">
          <div className="flex items-center justify-end mb-0.5">
            <BccpLogo width={115} height="auto" fillColor="dark" />
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
            {companyName}
          </p>
          <p className="text-[10px] font-bold tracking-wider uppercase text-blue-700">
            {companyActivity}
          </p>
          <div className="text-[10px] font-semibold text-slate-600 space-y-0.5 pt-0.5 leading-tight">
            {companyTaxId && (
              <p className="font-bold text-slate-800">M.F. : {companyTaxId}</p>
            )}
            {companyInfo.rne && (
              <p className="font-bold text-slate-700">RNE : {companyInfo.rne}</p>
            )}
            <p>{companyAddress}</p>
            <p>{companyPhone} • {companyEmail}</p>
            {companyInfo.website && <p className="text-blue-600">{companyInfo.website}</p>}
          </div>
        </div>
      </div>

      {/* 2. BLOC DESTINATAIRE (CLIENT) */}
      <div className="pt-0.5">
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1 text-xs">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            {isInvoice ? 'Facturé à :' : 'Destinataire :'}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {data.client.companyName || data.client.name}
            </p>

            {/* Matricule Fiscal Client */}
            {data.client.matricule_fiscal ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white text-slate-900 font-bold border border-slate-300 text-[11px] shadow-2xs">
                <span className="text-slate-500 font-black">M.F. :</span>
                <span className="font-mono">{data.client.matricule_fiscal}</span>
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-slate-500 italic">
                Client Particulier
              </p>
            )}
          </div>

          {/* Coordonnées Client */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 pt-1 text-[11px] text-slate-600 font-medium">
            {(data.client.address || data.client.city) && (
              <p className="font-semibold text-slate-700">
                📍 {[data.client.address, data.client.city].filter(Boolean).join(', ')}
              </p>
            )}
            {data.client.phone && <p>📞 {data.client.phone}</p>}
            {data.client.email && <p>✉️ {data.client.email}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
