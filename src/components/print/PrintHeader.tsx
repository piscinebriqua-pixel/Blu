import React from 'react';
import BccpLogo from '../BccpLogo';
import type { PrintDocumentData, PrintCompanyInfo } from './types';

interface PrintHeaderProps {
  data: PrintDocumentData;
  companyInfo: PrintCompanyInfo;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ data, companyInfo }) => {
  const isInvoice = data.type === 'facture';
  const companyName = companyInfo.company_name || 'STE BCCP';
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

  // Adresse client complète
  const clientAddress = [data.client.address, data.client.city].filter(Boolean).join(', ');

  return (
    <div className="pb-4 mb-3 border-b-2 border-slate-200/90 break-inside-avoid">
      {/* GRILLE 2 COLONNES : ÉMETTEUR (GAUCHE) & DOCUMENT + CLIENT (DROITE) */}
      <div className="flex items-start justify-between gap-8">
        {/* 1. COLONNE GAUCHE : ÉMETTEUR (Logo, Société, Adresse, Téléphone, Email, MF) */}
        <div className="space-y-1.5 max-w-sm flex-1">
          <div className="flex items-center mb-2">
            <BccpLogo width={95} height="auto" fillColor="blue" />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 leading-tight">
              {companyName}
            </h2>
            {companyActivity && (
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wide mt-0.5">
                {companyActivity}
              </p>
            )}
          </div>

          <div className="text-sm font-medium text-slate-700 space-y-1 leading-snug pt-1">
            {companyAddress && <p>{companyAddress}</p>}
            {companyPhone && (
              <p>
                <span className="font-bold text-slate-900">Téléphone :</span> {companyPhone}
              </p>
            )}
            {companyEmail && (
              <p>
                <span className="font-bold text-slate-900">Email :</span> {companyEmail}
              </p>
            )}
            {companyTaxId && (
              <p className="pt-0.5">
                <span className="font-bold text-slate-900">Matricule fiscal :</span>{' '}
                <span className="font-mono font-bold text-slate-950">{companyTaxId}</span>
              </p>
            )}
            {companyInfo.rne && (
              <p className="text-slate-700">
                <span className="font-bold text-slate-900">RNE :</span> {companyInfo.rne}
              </p>
            )}
          </div>
        </div>

        {/* 2. COLONNE DROITE : MÉTADONNÉES DOCUMENT & CLIENT */}
        <div className="space-y-2.5 max-w-sm flex-1 text-right">
          {/* Grand Titre Document (FACTURE / DEVIS) & Numéro */}
          <div className="space-y-1 pb-2 border-b-2 border-slate-200/90">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-blue-600 uppercase leading-none">
              {isInvoice ? 'FACTURE' : 'DEVIS'}
            </h1>
            <p className="text-xl font-black text-slate-950 font-mono tracking-tight mt-1">
              {data.documentNumber}
            </p>
            <div className="pt-1 text-sm font-semibold text-slate-700 space-y-0.5">
              <p>
                <span className="font-bold text-slate-900">Date :</span> {formattedDate}
              </p>
              {isInvoice && formattedDueDate && (
                <p>
                  <span className="font-bold text-slate-900">Échéance :</span> {formattedDueDate}
                </p>
              )}
              {!isInvoice && data.validityDays && (
                <p>
                  <span className="font-bold text-slate-900">Validité :</span> {data.validityDays} jours
                </p>
              )}
            </div>
          </div>

          {/* Coordonnées Client */}
          <div className="text-sm font-medium text-slate-700 space-y-1 leading-snug">
            <p className="text-base font-black text-slate-950 uppercase">
              <span className="font-bold normal-case text-slate-700">Client :</span>{' '}
              {data.client.companyName || data.client.name}
            </p>

            {clientAddress && (
              <p>
                <span className="font-bold text-slate-900">Adresse :</span> {clientAddress}
              </p>
            )}

            {data.client.phone && (
              <p>
                <span className="font-bold text-slate-900">Téléphone :</span> {data.client.phone}
              </p>
            )}

            {data.client.email && (
              <p>
                <span className="font-bold text-slate-900">Email :</span> {data.client.email}
              </p>
            )}

            {data.client.matricule_fiscal && (
              <p className="pt-0.5">
                <span className="font-bold text-slate-900">Matricule fiscal :</span>{' '}
                <span className="font-mono font-bold text-slate-950">{data.client.matricule_fiscal}</span>
              </p>
            )}

            {data.quoteReference && (
              <p className="text-sm pt-0.5">
                <span className="font-bold text-slate-800">Réf. Devis :</span>{' '}
                <span className="font-mono font-bold text-slate-700">{data.quoteReference}</span>
              </p>
            )}

            {data.poolInfo?.name && (
              <p className="text-sm pt-0.5">
                <span className="font-bold text-slate-800">Site / Bassin :</span>{' '}
                <span className="font-black text-slate-950 uppercase">{data.poolInfo.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
