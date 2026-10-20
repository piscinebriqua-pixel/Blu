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
    <div className="bg-white text-slate-900 font-sans p-4 sm:p-6 max-w-[210mm] mx-auto flex flex-col justify-between print:block print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white print:text-black">
      {/* 1. EN-TÊTE ÉMETTEUR & DESTINATAIRE */}
      <PrintHeader data={data} companyInfo={companyInfo} />

      {/* 2. TABLEAU DÉTAILLÉ DES PRESTATIONS */}
      <PrintItemsTable items={data.items} />

      {/* 3. RÉCAPITULATIF FINANCIER, CONDITIONS & SIGNATURE */}
      <PrintFinancialSummary data={data} companyInfo={companyInfo} />

      {/* 4. GRAND BANDEAU DE PIED DE PAGE CORPORATE */}
      <PrintFooter companyInfo={companyInfo} />
    </div>
  );
};

export default PrintDocumentTemplate;
