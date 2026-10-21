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
    <div className="space-y-1.5 break-inside-avoid">
      {/* GRILLE 2 COLONNES PRINCIPALES : 2 CARDS HORIZONTALES À GAUCHE / TOTAUX & SIGNATURE À DROITE */}
      <div className="grid grid-cols-12 gap-3 items-start pt-0.5">
        {/* COLONNE GAUCHE (7/12) : 2 CARDS CÔTE À CÔTE + SOMME EN TOUTES LETTRES */}
        <div className="col-span-7 space-y-1.5 text-xs">
          {/* GRILLE DES 2 CARDS HORIZONTALES */}
          <div className="grid grid-cols-2 gap-2">
            {/* CARD 1 : MODALITÉS DE RÈGLEMENT */}
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
              <div>
                <p className="font-black uppercase tracking-wider text-slate-800 text-xs">
                  Conditions & Modalités
                </p>
                <p className="font-semibold text-slate-700 text-xs mt-1 leading-snug">
                  {data.paymentTerms ||
                    (isInvoice
                      ? 'Paiement à réception de facture.'
                      : 'Validité de l’offre 30 jours.')}
                </p>
              </div>
              {isInvoice && data.dueDate && (
                <div className="pt-1 mt-1 border-t border-slate-200 text-xs flex justify-between items-baseline">
                  <span className="text-slate-500 font-bold">Échéance :</span>
                  <span className="font-black text-slate-900 font-mono">
                    {new Date(data.dueDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>

            {/* CARD 2 : COORDONNÉES DE VIREMENT */}
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
              <div>
                <p className="font-black uppercase tracking-wider text-slate-800 text-xs">
                  Coordonnées Virement
                </p>
                <p className="font-mono font-bold text-slate-900 text-xs mt-1 leading-snug">
                  {displayBankName ? `${displayBankName} • ` : ''}RIB : {displayBankRib}
                </p>
                {displayBankIban && (
                  <p className="font-mono text-xs text-slate-600 font-semibold mt-0.5">
                    IBAN : {displayBankIban}
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-500 italic mt-1 pt-1 border-t border-slate-200">
                Réf. : <span className="font-mono font-bold text-slate-700">{data.documentNumber}</span>
              </p>
            </div>
          </div>

          {/* BANDEAU SOMME EN TOUTES LETTRES LOGÉ SOUS LES DEUX CARTES */}
          <div className="p-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200/90 text-xs">
            <p className="font-bold text-slate-800 text-xs leading-tight">
              <span className="text-slate-500 font-black uppercase text-xs">
                Arrêtée à la somme de :
              </span>{' '}
              <span className="text-slate-900 font-black">{amountWords}</span>
            </p>
          </div>
        </div>

        {/* COLONNE DROITE (5/12) : DÉCOMPTE CHIFFRÉ & CARTOUCHE TOTAL TTC */}
        <div className="col-span-5 space-y-1 text-xs">
          {/* Sous-total HT */}
          <div className="flex justify-between items-center text-slate-600 font-semibold text-xs">
            <span>Sous-total HT :</span>
            <span className="font-black text-slate-900 font-mono text-xs">
              {Number(data.subtotalHT).toFixed(3)} DT
            </span>
          </div>

          {/* Remise éventuelle */}
          {Number(data.discountAmount) > 0 && (
            <div className="flex justify-between items-center text-emerald-700 font-semibold text-xs">
              <span>Remise commerciale :</span>
              <span className="font-black font-mono">
                - {Number(data.discountAmount).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* TVA */}
          {Number(data.taxRate) > 0 && (
            <div className="flex justify-between items-center text-slate-600 font-semibold text-xs">
              <span>TVA ({data.taxRate}%) :</span>
              <span className="font-black text-slate-900 font-mono">
                {Number(data.taxAmount || 0).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* Timbre fiscal (uniquement sur facture) */}
          {isInvoice && Number(data.stampDuty) > 0 && (
            <div className="flex justify-between items-center text-slate-600 font-semibold text-xs">
              <span>Timbre Fiscal :</span>
              <span className="font-black text-slate-900 font-mono">
                {Number(data.stampDuty).toFixed(3)} DT
              </span>
            </div>
          )}

          {/* BANDEAU PLEIN BLEU NUIT POUR LE TOTAL NET TTC */}
          <div className="bg-[#0b192c] text-white py-1.5 px-3 rounded-lg flex justify-between items-center shadow-sm">
            <span className="font-black uppercase tracking-wider text-xs">
              {isInvoice ? 'TOTAL NET TTC' : 'TOTAL ESTIMÉ TTC'}
            </span>
            <span className="font-black text-sm font-mono tracking-tight text-white">
              {Number(data.totalTTC).toFixed(3)} DT
            </span>
          </div>

          {/* Acompte et reste dû si facture */}
          {isInvoice && Number(data.paidAmount) > 0 && (
            <div className="pt-0.5 border-t border-slate-200 space-y-0.5 font-semibold text-xs">
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
          <div className="pt-1.5 space-y-0.5">
            <div className="border-b border-slate-300 w-full h-4" />
            <p className="text-right text-xs font-black uppercase tracking-wider text-slate-600">
              {isInvoice
                ? 'Cachet & Signature Autorisée'
                : 'Bon pour accord - Date & Signature'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintFinancialSummary;
