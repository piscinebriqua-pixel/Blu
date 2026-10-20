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
  const companyTaxId = companyInfo.tax_id || 'MF: 1548962/A/M/000';
  const companyPhone = companyInfo.phone || '+216 98 123 456';
  const companyEmail = companyInfo.email || 'contact@blu-pool.tn';
  const companyAddress = companyInfo.address || 'Tunis, Tunisie';

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
      {/* 1. ORNEMENTS GÉOMÉTRIQUES SUPÉRIEURS & LOGO ÉMETTEUR */}
      <div className="flex items-start justify-between relative">
        {/* Grille de points décorative (Dot Grid) en haut à gauche */}
        <div className="w-16 h-8 flex flex-col justify-between opacity-75">
          <svg width="60" height="28" viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dot-pattern" x="0" y="0" width="10" height="9" patternUnits="userSpaceOnUse">
                <circle cx="2.5" cy="2.5" r="1.5" fill="#f59e0b" />
              </pattern>
            </defs>
            <rect width="60" height="28" fill="url(#dot-pattern)" />
          </svg>
        </div>

        {/* Chevrons géométriques modernes au centre supérieur */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none flex flex-col items-center">
          <svg width="50" height="22" viewBox="0 0 50 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 2L25 18L43 2" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 2L25 10L34 2" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Logo Blu et Raison Sociale en haut à droite (fond blanc -> logo foncé contrasté) */}
        <div className="text-right flex flex-col items-end max-w-xs">
          <div className="flex items-center justify-end mb-1">
            <BccpLogo width={110} height="auto" fillColor="dark" />
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
            {companyName}
          </p>
          <p className="text-[10px] font-bold tracking-wider uppercase text-blue-700">
            Ingénierie & Services Aquatiques
          </p>
          <div className="text-[10px] font-semibold text-slate-500 space-y-0.5 pt-0.5 leading-tight">
            <p className="font-bold text-slate-700">M.F. : {companyTaxId}</p>
            <p>{companyAddress}</p>
            <p>{companyPhone} • {companyEmail}</p>
          </div>
        </div>
      </div>

      {/* 2. TITRE PRINCIPAL DU DOCUMENT & CARTES D'INFORMATIONS */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase mb-2">
          {isInvoice ? 'FACTURE' : 'DEVIS'}
        </h1>

        <div className="grid grid-cols-2 gap-6 items-start">
          {/* Bloc Destinataire (Client) à gauche */}
          <div className="space-y-1 text-xs">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              {isInvoice ? 'Facturé à :' : 'Destinataire :'}
            </p>
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {data.client.companyName || data.client.name}
            </p>

            {/* Matricule Fiscal Client */}
            {data.client.matricule_fiscal ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-900 font-bold border border-slate-300 text-[11px]">
                <span className="text-slate-500 font-black">M.F. :</span>
                <span>{data.client.matricule_fiscal}</span>
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-slate-500 italic">
                Client Particulier
              </p>
            )}

            {/* Adresse et Ville */}
            {(data.client.address || data.client.city) && (
              <p className="font-semibold text-slate-700 leading-snug">
                {[data.client.address, data.client.city].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Téléphone / Email */}
            <div className="text-slate-600 font-medium space-y-0.5 text-[11px]">
              {data.client.phone && <p>Tél : {data.client.phone}</p>}
              {data.client.email && <p>Email : {data.client.email}</p>}
            </div>
          </div>

          {/* Bloc Métadonnées Document à droite */}
          <div className="space-y-1 text-xs text-right">
            <div className="flex justify-between items-baseline border-b border-slate-100 pb-0.5">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                {isInvoice ? 'Facture N° :' : 'Devis N° :'}
              </span>
              <span className="text-xs font-black text-slate-900 font-mono">
                {data.documentNumber}
              </span>
            </div>

            <div className="flex justify-between items-baseline border-b border-slate-100 pb-0.5">
              <span className="text-slate-500 font-bold text-[11px]">Date :</span>
              <span className="font-black text-slate-900">{formattedDate}</span>
            </div>

            {isInvoice && formattedDueDate && (
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-0.5">
                <span className="text-slate-500 font-bold text-[11px]">Échéance :</span>
                <span className="font-black text-slate-900">{formattedDueDate}</span>
              </div>
            )}

            {!isInvoice && (
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-0.5">
                <span className="text-slate-500 font-bold text-[11px]">Validité :</span>
                <span className="font-black text-slate-900">
                  {data.validityDays ? `${data.validityDays} jours` : '30 jours'}
                </span>
              </div>
            )}

            {data.quoteReference && (
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-0.5">
                <span className="text-slate-500 font-bold text-[11px]">Réf. Devis :</span>
                <span className="font-bold text-slate-700">{data.quoteReference}</span>
              </div>
            )}

            {data.poolInfo?.name && (
              <div className="flex justify-between items-baseline pt-0.5">
                <span className="text-slate-500 font-bold text-[11px]">Site / Bassin :</span>
                <span className="font-black text-slate-900 uppercase">
                  {data.poolInfo.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
