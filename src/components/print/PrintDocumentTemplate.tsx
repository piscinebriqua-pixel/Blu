import React from 'react';
import BccpLogo from '../BccpLogo';
import { amountInWordsDT } from '../../helpers/numberToWords';
import type { PrintDocumentData, PrintCompanyInfo } from './types';
import { Hash, Phone, Mail, MapPin, Landmark } from 'lucide-react';

interface PrintDocumentTemplateProps {
  data: PrintDocumentData;
  companyInfo: PrintCompanyInfo;
}

export const PrintDocumentTemplate: React.FC<PrintDocumentTemplateProps> = ({
  data,
  companyInfo,
}) => {
  const isInvoice = data.type === 'facture';
  const companyName = companyInfo.company_name || 'BLU POOL MANAGEMENT';
  const companyTaxId = companyInfo.tax_id || 'MF: 1548962/A/M/000';
  const companyPhone = companyInfo.phone || '+216 98 123 456';
  const companyEmail = companyInfo.email || 'contact@blu-pool.tn';
  const companyAddress = companyInfo.address || 'Tunis, Tunisie';
  const bankRib = companyInfo.bank_rib || 'BIAT - RIB : 08 012 0001234567890 12';

  // Formatage date
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
  const amountWords = amountInWordsDT(data.totalTTC);

  return (
    <div className="bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between print:block print:p-0 print:m-0 print:max-w-none print:min-h-0 print:w-full print:bg-white print:text-black">
      {/* CORPS HAUT DU DOCUMENT */}
      <div className="space-y-6 print:space-y-3">
        {/* 1. EN-TÊTE ÉMETTEUR ET TITRE */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900/90 print:pb-3 print:gap-4 break-inside-avoid">
          {/* Émetteur / Société */}
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-3">
              <BccpLogo width={120} height="auto" />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                {companyName}
              </h1>
              <p className="text-xs font-black text-blue-700 uppercase tracking-widest">
                Services & Maintenance de Piscines
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600 space-y-0.5 pt-1">
              <p className="flex items-center gap-1.5 font-bold text-slate-800">
                <Hash size={13} className="text-blue-600 print:text-black" />
                <span>M.F. : {companyTaxId}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-500 print:text-black" />
                <span>{companyAddress}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={13} className="text-slate-500 print:text-black" />
                <span>{companyPhone}</span>
                <span className="text-slate-300">|</span>
                <Mail size={13} className="text-slate-500 print:text-black" />
                <span>{companyEmail}</span>
              </p>
            </div>
          </div>

          {/* Type document, Référence & Métadonnées */}
          <div className="sm:text-right space-y-2 w-full sm:w-auto">
            <div className="inline-block px-4 py-1.5 rounded-xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest print:bg-black">
              {isInvoice ? 'FACTURE OFFICIELLE' : 'DEVIS / OFFRE COMMERCIALE'}
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              N° {data.documentNumber}
            </h2>
            <div className="text-xs font-semibold text-slate-600 space-y-1">
              <p>
                <span className="text-slate-500">Date d'émission :</span>{' '}
                <strong className="text-slate-900 font-black">{formattedDate}</strong>
              </p>
              {isInvoice && formattedDueDate && (
                <p>
                  <span className="text-slate-500">Date d'échéance :</span>{' '}
                  <strong className="text-slate-900 font-black">{formattedDueDate}</strong>
                </p>
              )}
              {!isInvoice && (
                <p>
                  <span className="text-slate-500">Validité :</span>{' '}
                  <strong className="text-slate-900 font-black">
                    {data.validityDays ? `${data.validityDays} jours` : '30 jours'}
                  </strong>
                </p>
              )}
              {data.status && (
                <p className="pt-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 print:border-black">
                    Statut : {data.status}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. SECTION CLIENT ET SITE D'INTERVENTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bloc Destinataire (Client) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5 print:bg-white print:border-slate-300">
            <span className="text-xs font-black uppercase tracking-widest text-blue-700 print:text-black">
              Facturé à (Client)
            </span>
            <h3 className="text-base font-black uppercase text-slate-900">
              {data.client.name}
            </h3>
            {data.client.matricule_fiscal && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 text-xs font-black uppercase print:bg-slate-100 print:text-black">
                <Hash size={13} />
                <span>M.F. Client : {data.client.matricule_fiscal}</span>
              </div>
            )}
            <div className="text-xs font-semibold text-slate-600 space-y-0.5 pt-0.5">
              {data.client.phone && <p>Tél : {data.client.phone}</p>}
              {(data.client.address || data.client.city) && (
                <p>{[data.client.address, data.client.city].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>

          {/* Bloc Lieu d'intervention / Bassin ou Conditions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5 print:bg-white print:border-slate-300">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {data.poolInfo?.name ? 'Lieu & Bassin Concerné' : 'Modalités & Conditions'}
            </span>
            {data.poolInfo?.name ? (
              <>
                <h4 className="text-base font-black uppercase text-slate-900">
                  {data.poolInfo.name}
                </h4>
                {data.poolInfo.location && (
                  <p className="text-xs font-medium text-slate-600">
                    {data.poolInfo.location}
                  </p>
                )}
              </>
            ) : (
              <div className="text-xs font-semibold text-slate-600 space-y-1">
                <p className="text-slate-800 font-bold">
                  {data.paymentTerms || 'Paiement à réception par virement ou chèque.'}
                </p>
                <p className="text-slate-500 italic">
                  Maintenance conforme aux standards de sécurité sanitaire Blu.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Message d'introduction si présent */}
        {data.headerContent && (
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs font-semibold text-slate-700 italic print:bg-white print:border-slate-300">
            {data.headerContent}
          </div>
        )}

        {/* 3. TABLEAU DÉTAILLÉ DES PRESTATIONS */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden print:border-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase text-xs font-black tracking-wider print:bg-slate-900 print:text-white print:table-header-group">
              <tr className="break-inside-avoid">
                <th className="py-3 px-3 print:py-2 print:px-2 w-10 text-center">#</th>
                <th className="py-3 px-4 print:py-2 print:px-2">Désignation & Prestation</th>
                <th className="py-3 px-3 print:py-2 print:px-2 text-center w-16">Qté</th>
                <th className="py-3 px-3 print:py-2 print:px-2 text-center w-20">Unité</th>
                <th className="py-3 px-3 print:py-2 print:px-2 text-right w-28">P.U. HT (DT)</th>
                <th className="py-3 px-4 print:py-2 print:px-2 text-right w-28">Total HT (DT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {data.items.map((item, idx) => {
                if (item.isHeader) {
                  return (
                    <tr key={item.id || idx} className="bg-slate-100 print:bg-slate-200 break-inside-avoid">
                      <td
                        colSpan={6}
                        className="py-2.5 px-4 print:py-1.5 print:px-2 font-black uppercase text-xs tracking-wider text-slate-900"
                      >
                        {item.description}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/80 print:hover:bg-transparent break-inside-avoid"
                  >
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center font-bold text-slate-500">
                      {item.position || idx + 1}
                    </td>
                    <td className="py-2.5 px-4 print:py-1.5 print:px-2 font-bold text-slate-800">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center font-semibold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-center text-slate-500 font-medium">
                      {item.unit || 'u'}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-right font-medium text-slate-700">
                      {Number(item.unitPrice).toFixed(3)}
                    </td>
                    <td className="py-2.5 px-4 print:py-1.5 print:px-2 text-right font-black text-slate-900">
                      {Number(item.totalPrice).toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. BLOC FINANCIER & RÈGLEMENT */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start break-inside-avoid pt-2">
          {/* Coordonnées de règlement & Bon pour accord (Colonnes gauche) */}
          <div className="sm:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 print:bg-white print:border-slate-300">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-800">
                <Landmark size={15} className="text-blue-600 print:text-black" />
                <span>Modalités de Paiement / Virement</span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-800">
                {bankRib}
              </p>
              <p className="text-xs font-medium text-slate-500 italic">
                {data.paymentTerms || 'Règlement à réception. Merci de préciser la référence du document.'}
              </p>
            </div>

            {/* Cadre signature client pour DEVIS */}
            {!isInvoice && (
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 space-y-8 min-h-[95px] print:border-slate-400">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-700">
                  <span>Bon pour accord et exécution des travaux</span>
                  <span className="text-slate-500">Date & Signature :</span>
                </div>
              </div>
            )}
          </div>

          {/* Récapitulatif Chiffré (Colonnes droite) */}
          <div className="sm:col-span-5 rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs font-bold text-slate-700 print:bg-white print:border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Hors Taxes (HT) :</span>
              <span className="text-slate-900 font-extrabold">
                {Number(data.subtotalHT).toFixed(3)} DT
              </span>
            </div>

            {Number(data.taxRate) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">TVA ({data.taxRate}%) :</span>
                <span className="text-slate-900 font-extrabold">
                  {Number(data.taxAmount || 0).toFixed(3)} DT
                </span>
              </div>
            )}

            {Number(data.stampDuty) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Droit de Timbre Fiscal :</span>
                <span className="text-slate-900 font-extrabold">
                  {Number(data.stampDuty).toFixed(3)} DT
                </span>
              </div>
            )}

            {/* Total Net TTC */}
            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline font-black text-slate-900">
              <span className="text-xs uppercase tracking-wider">Total Net TTC :</span>
              <span className="text-base text-blue-700 print:text-black">
                {Number(data.totalTTC).toFixed(3)} DT
              </span>
            </div>

            {/* Acompte et reste à payer si facture */}
            {isInvoice && Number(data.paidAmount) > 0 && (
              <div className="pt-1.5 border-t border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-emerald-700">
                  <span>Acompte réglé :</span>
                  <span>- {Number(data.paidAmount).toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-sm">
                  <span>Reste à payer :</span>
                  <span>{Number(data.balanceDue || 0).toFixed(3)} DT</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. SOMME EN TOUTES LETTRES */}
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 break-inside-avoid print:bg-white print:border-slate-300">
          <p>
            <span className="uppercase text-slate-500 font-black">
              Arrêtée la présente {isInvoice ? 'facture' : 'offre'} à la somme de :
            </span>{' '}
            <strong className="text-slate-900 font-black">{amountWords}</strong>
          </p>
        </div>
      </div>

      {/* 6. PIED DE PAGE LÉGAL FIXE */}
      <div className="pt-6 mt-8 border-t border-slate-200 text-center text-xs font-semibold text-slate-500 space-y-1 break-inside-avoid print:border-slate-300">
        <p className="font-bold text-slate-700">
          {companyName} • M.F. : {companyTaxId} • Tél : {companyPhone} • Email : {companyEmail}
        </p>
        <p className="text-slate-500">
          {companyAddress} • Page 1 / 1
        </p>
      </div>
    </div>
  );
};

export default PrintDocumentTemplate;
