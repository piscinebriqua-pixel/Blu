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
  const companyPhone = companyInfo.phone || '+216 58 790 185';
  const companyEmail = companyInfo.email || 'contact@cleanandcleanpool.com';
  const amountWords = amountInWordsDT(data.totalTTC);

  return (
    <div className="space-y-3 break-inside-avoid">
      {/* GRILLE 2 COLONNES : CONDITIONS & BANQUE À GAUCHE / TOTAUX & SIGNATURE À DROITE */}
      <div className="grid grid-cols-12 gap-6 items-start pt-1">
        {/* COLONNE GAUCHE (7/12) : CONDITIONS, QUESTIONS & INFOS DE PAIEMENT */}
        <div className="col-span-7 space-y-2 text-xs">
          {/* Conditions & Modalités */}
          <div className="space-y-0.5">
            <p className="font-black uppercase tracking-wider text-slate-800 text-[11px]">
              Conditions & Modalités
            </p>
            <p className="font-medium text-slate-600 leading-relaxed text-[11px]">
              {data.paymentTerms ||
                (isInvoice
                  ? 'Règlement sous 30 jours à réception de facture par virement bancaire ou chèque.'
                  : 'Validité de l’offre 30 jours. Travaux garantis selon les préconisations du constructeur.')}
            </p>
          </div>

          {/* Contact direct / Questions */}
          <div className="space-y-0.5 pt-0.5">
            <p className="font-black uppercase tracking-wider text-slate-800 text-[11px]">
              Questions & Contact :
            </p>
            <p className="text-slate-600 font-medium text-[11px]">
              <span className="text-slate-500">Email :</span> {companyEmail} •{' '}
              <span className="text-slate-500">Tél :</span> {companyPhone}
            </p>
          </div>

          {/* Coordonnées bancaires (Payment Info) */}
          <div className="space-y-0.5 pt-0.5">
            <p className="font-black uppercase tracking-wider text-slate-800 text-[11px]">
              Coordonnées de Virement :
            </p>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <p className="font-mono font-bold text-slate-900 text-[11px]">
                {displayBankName ? `${displayBankName} • ` : ''}RIB : {displayBankRib}
              </p>
              {displayBankIban && (
                <p className="font-mono text-[10px] text-slate-600 font-bold">
                  IBAN : {displayBankIban}
                </p>
              )}
              <p className="text-[10px] font-medium text-slate-500 italic pt-0.5">
                Merci de mentionner la référence {data.documentNumber} lors du virement.
              </p>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (5/12) : DÉCOMPTE CHIFFRÉ & CARTOUCHE TOTAL TTC */}
        <div className="col-span-5 space-y-1.5 text-xs">
          {/* Sous-total HT */}
          <div className="flex justify-between items-center text-slate-600 font-semibold text-[11px]">
            <span>Sous-total HT :</span>
            <span className="font-black text-slate-900 font-mono text-xs">
              {Number(data.subtotalHT).toFixed(3)} DT
            </span>
          </div>

          {/* Remise éventuelle */}
          {Number(data.discountAmount) > 0 && (
            <div className="flex justify-between items-center text-emerald-700 font-semibold text-[11px]">
              <span>Remise commerciale :</span>
              <span className="font-black font-mono">
                - {Number(data.discountAmount).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* TVA */}
          {Number(data.taxRate) > 0 && (
            <div className="flex justify-between items-center text-slate-600 font-semibold text-[11px]">
              <span>TVA ({data.taxRate}%) :</span>
              <span className="font-black text-slate-900 font-mono">
                {Number(data.taxAmount || 0).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* Timbre fiscal (uniquement sur facture) */}
          {isInvoice && Number(data.stampDuty) > 0 && (
            <div className="flex justify-between items-center text-slate-600 font-semibold text-[11px]">
              <span>Timbre Fiscal :</span>
              <span className="font-black text-slate-900 font-mono">
                {Number(data.stampDuty).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* BANDEAU PLEIN BLEU NUIT POUR LE TOTAL NET TTC */}
          <div className="bg-[#0b192c] text-white py-2 px-3 rounded flex justify-between items-center shadow-sm my-1">
            <span className="font-black uppercase tracking-wider text-[11px]">
              {isInvoice ? 'TOTAL NET TTC' : 'TOTAL ESTIMÉ TTC'}
            </span>
            <span className="font-black text-sm font-mono tracking-tight text-white">
              {Number(data.totalTTC).toFixed(3)} DT
            </span>
          </div>

          {/* Acompte et reste dû si facture */}
          {isInvoice && Number(data.paidAmount) > 0 && (
            <div className="pt-0.5 border-t border-slate-200 space-y-0.5 font-semibold text-[11px]">
              <div className="flex justify-between text-emerald-700">
                <span>Acompte déjà versé :</span>
                <span className="font-mono font-bold">
                  - {Number(data.paidAmount).toFixed(3)} DT
                </span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-xs pt-0.5">
                <span>Net restant dû :</span>
                <span className="font-mono text-blue-700">
                  {Number(data.balanceDue || 0).toFixed(3)} DT
                </span>
              </div>
            </div>
          )}

          {/* ZONE DE SIGNATURE AUTORISÉE (Ligne fine & Titre) */}
          <div className="pt-3 space-y-1">
            <div className="border-b border-slate-300 w-full h-6" />
            <p className="text-right text-[10px] font-black uppercase tracking-wider text-slate-600">
              {isInvoice
                ? 'Cachet & Signature Autorisée'
                : 'Bon pour accord - Date & Signature'}
            </p>
          </div>
        </div>
      </div>

      {/* SOMME EN TOUTES LETTRES */}
      <div className="p-2 rounded bg-slate-50 border border-slate-200 text-xs">
        <p className="font-bold text-slate-800 text-[11px]">
          <span className="text-slate-500 font-black uppercase">
            Arrêtée la présente {isInvoice ? 'facture' : 'offre'} à la somme de :
          </span>{' '}
          <span className="text-slate-900 font-black">{amountWords}</span>
        </p>
      </div>
    </div>
  );
};

export default PrintFinancialSummary;
