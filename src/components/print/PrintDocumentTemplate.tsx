import React from 'react';
import type { PrintDocumentData, PrintCompanyInfo } from './types';
import PrintHeader from './PrintHeader';
import PrintItemsTable from './PrintItemsTable';
import PrintFinancialSummary from './PrintFinancialSummary';
import PrintFooter from './PrintFooter';

interface PrintDocumentTemplateProps {
  data: PrintDocumentData;
  companyInfo: PrintCompanyInfo;
}

/**
 * Modèle de Facture & Devis Moderne au format papier standard A4.
 * Conçu pour tenir strictement et impeccablement sur UNE SEULE PAGE A4 (1 feuille de papier).
 */
export const PrintDocumentTemplate: React.FC<PrintDocumentTemplateProps> = ({
  data,
  companyInfo,
}) => {
  return (
    <div className="bg-white text-slate-900 font-sans p-4 sm:p-5 max-w-[210mm] mx-auto a4-print-canvas shadow-xl print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white print:text-black">
      {/* 1. CORPS DU DOCUMENT (EN-TÊTE + TABLEAU + RÉCAPITULATIF FINANCIER) */}
      <div className="flex-1 flex flex-col justify-start">
        {/* En-tête émetteur & client */}
        <PrintHeader data={data} companyInfo={companyInfo} />

        {/* Tableau détaillé des prestations */}
        <PrintItemsTable items={data.items} />

        {/* Récapitulatif financier & 2 Cards horizontales (Règlement & Virement) */}
        <PrintFinancialSummary data={data} companyInfo={companyInfo} />
      </div>

      {/* 2. PIED DE PAGE CORPORATE — TOUJOURS POSITIONNÉ TOUT EN BAS DE LA FEUILLE A4 */}
      <div className="mt-auto pt-3 break-inside-avoid print:pt-1">
        <PrintFooter companyInfo={companyInfo} />
      </div>
    </div>
  );
};

export default PrintDocumentTemplate;
