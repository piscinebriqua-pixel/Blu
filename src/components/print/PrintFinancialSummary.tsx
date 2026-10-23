import React from 'react';
import { amountInWordsDT } from '../../helpers/numberToWords';
import type { PrintDocumentData, PrintCompanyInfo } from './types';

interface PrintFinancialSummaryProps {
  data: PrintDocumentData;
  companyInfo: PrintCompanyInfo;
}

export const PrintFinancialSummary: React.FC<PrintFinancialSummaryProps> = ({
  data,
  companyInfo,
}) => {
  const isInvoice = data.type === 'facture';
  const displayBankName = companyInfo.bank_name || '';
  const displayBankRib = companyInfo.bank_rib || 'RIB disponible sur demande';
  const displayBankIban = companyInfo.bank_iban || '';
  const amountWords = amountInWordsDT(data.totalTTC);

  return (
    <div className="space-y-2 break-inside-avoid">
      {/* GRILLE 2 COLONNES PRINCIPALES : 2 CARDS HORIZONTALES À GAUCHE (6/12) / TOTAUX & SIGNATURE À DROITE (6/12) */}
      <div className="grid grid-cols-12 gap-4 items-start pt-1">
        {/* COLONNE GAUCHE (6/12) : 2 CARDS HORIZONTALES */}
        <div className="col-span-6 space-y-2 text-sm">
          {/* GRILLE DES 2 CARDS HORIZONTALES */}
          <div className="grid grid-cols-2 gap-2">
            {/* CARD 1 : MODALITÉS DE RÈGLEMENT */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-start shadow-2xs">
              <p className="font-black uppercase tracking-wider text-slate-900 text-xs">
                Conditions & Modalités
              </p>
              <p className="font-semibold text-slate-800 text-sm mt-1 leading-snug">
                {data.paymentTerms ||
                  (isInvoice
                    ? 'Paiement à réception de facture.'
                    : 'Validité de l’offre 30 jours.')}
              </p>
            </div>

            {/* CARD 2 : COORDONNÉES DE VIREMENT */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-start shadow-2xs">
              <p className="font-black uppercase tracking-wider text-slate-900 text-xs">
                Coordonnées Virement
              </p>
              <p className="font-mono font-bold text-slate-900 text-xs sm:text-sm mt-1 leading-snug break-all">
                {displayBankName ? `${displayBankName} • ` : ''}RIB : {displayBankRib}
              </p>
              {displayBankIban && (
                <p className="font-mono text-xs text-slate-600 font-semibold mt-0.5 break-all">
                  IBAN : {displayBankIban}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (6/12) : DÉCOMPTE CHIFFRÉ & CARTOUCHE TOTAL TTC AÉRÉ */}
        <div className="col-span-6 space-y-1.5 text-sm">
          {/* Sous-total HT */}
          <div className="flex justify-between items-center text-slate-700 font-semibold text-sm">
            <span>Sous-total HT :</span>
            <span className="font-black text-slate-950 font-mono text-base">
              {Number(data.subtotalHT).toFixed(3)} DT
            </span>
          </div>

          {/* Remise éventuelle */}
          {Number(data.discountAmount) > 0 && (
            <div className="flex justify-between items-center text-emerald-700 font-semibold text-sm">
              <span>Remise commerciale :</span>
              <span className="font-black font-mono text-base">
                - {Number(data.discountAmount).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* TVA */}
          {Number(data.taxRate) > 0 && (
            <div className="flex justify-between items-center text-slate-700 font-semibold text-sm">
              <span>TVA ({data.taxRate}%) :</span>
              <span className="font-black text-slate-950 font-mono text-base">
                {Number(data.taxAmount || 0).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* Timbre fiscal (uniquement sur facture) */}
          {isInvoice && Number(data.stampDuty) > 0 && (
            <div className="flex justify-between items-center text-slate-700 font-semibold text-sm">
              <span>Timbre Fiscal :</span>
              <span className="font-black text-slate-950 font-mono text-base">
                {Number(data.stampDuty).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* BANDEAU PLEIN BLEU NUIT POUR LE TOTAL NET TTC AVEC ESPACEMENT GARANTI */}
          <div className="bg-[#0b192c] text-white py-2.5 px-4 rounded-xl flex justify-between items-center gap-4 shadow-sm">
            <span className="font-black uppercase tracking-wider text-xs sm:text-sm text-slate-200 whitespace-nowrap">
              {isInvoice ? 'TOTAL NET TTC' : 'TOTAL ESTIMÉ TTC'}
            </span>
            <span className="font-black text-xl sm:text-2xl font-mono tracking-tight text-white whitespace-nowrap">
              {Number(data.totalTTC).toFixed(3)} DT
            </span>
          </div>

          {/* Acompte et reste dû si facture */}
          {isInvoice && Number(data.paidAmount) > 0 && (
            <div className="pt-0.5 border-t border-slate-200 space-y-0.5 font-semibold text-sm">
              <div className="flex justify-between text-emerald-700">
                <span>Acompte déjà versé :</span>
                <span className="font-mono font-bold">
                  - {Number(data.paidAmount).toFixed(3)} DT
                </span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm pt-0.5">
                <span>Net restant dû :</span>
                <span className="font-mono text-blue-700">
                  {Number(data.balanceDue || 0).toFixed(3)} DT
                </span>
              </div>
            </div>
          )}

          {/* ZONE DE SIGNATURE AUTORISÉE (Ligne fine & Titre) */}
          <div className="pt-2 space-y-0.5">
            <div className="border-b-2 border-slate-300 w-full h-5" />
            <p className="text-right text-xs font-black uppercase tracking-wider text-slate-700">
              {isInvoice
                ? 'Cachet & Signature Autorisée'
                : 'Bon pour accord - Date & Signature'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. BANDEAU PLEINE LARGEUR (100%) : MONTANT EN TOUTES LETTRES SUR UNE SEULE LIGNE (ZÉRO CÉSURE) */}
      <div className="w-full p-2 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm overflow-hidden">
        <p className="font-bold text-slate-800 text-sm leading-none whitespace-nowrap">
          <span className="text-slate-600 font-black uppercase text-xs">
            Arrêtée la présente {isInvoice ? 'facture' : 'offre'} à la somme de :
          </span>{' '}
          <span className="text-slate-950 font-black text-sm">{amountWords}</span>
        </p>
      </div>
    </div>
  );
};

export default PrintFinancialSummary;
