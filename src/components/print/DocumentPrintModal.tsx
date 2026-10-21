import React, { useEffect, useState } from 'react';
import ModalLayout from '../ModalLayout';
import PrintDocumentTemplate from './PrintDocumentTemplate';
import type { PrintDocumentData, PrintCompanyInfo } from './types';
import { Printer, Share2, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';




interface DocumentPrintModalProps {
  data: PrintDocumentData;
  onClose: () => void;
  onWhatsAppShare?: () => void;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  data,
  onClose,
  onWhatsAppShare,
}) => {
  const [companyInfo, setCompanyInfo] = useState<PrintCompanyInfo>({
    company_name: 'BLU POOL MANAGEMENT',
    phone: '+216 98 123 456',
    email: 'contact@blu-pool.tn',
    address: 'Tunis, Tunisie',
    tax_id: 'MF: 1548962/A/M/000',
    bank_rib: 'BIAT - RIB : 08 012 0001234567890 12',
    website: 'www.blu-pool.tn',
    rne: '1548962M',
  });


  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const { data: record, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'company_info')
          .maybeSingle();

        if (error) {
          console.error('Erreur chargement réglages entreprise:', error);
          return;
        }

        if (record?.value) {
          setCompanyInfo((prev) => ({
            ...prev,
            ...record.value,
          }));
        }
      } catch (err) {
        console.error('Erreur chargement informations société:', err);
      }
    };

    fetchCompanySettings();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalLayout
      title={`Aperçu ${data.type === 'facture' ? 'Facture' : 'Devis'} ${data.documentNumber}`}
      onClose={onClose}
      className="print-clean-modal max-w-4xl !p-0 overflow-hidden"
      bodyClassName="!p-0"
    >
      <div className="flex flex-col">
        {/* BARRE D'ACTIONS DU DOCUMENT (Masquée à l'impression) */}
        <div className="print-hidden-element p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Format A4 Standard • Haute Résolution
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.open('/settings/company', '_blank')}
              className="min-h-[44px] px-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Configurer les coordonnées, MF, banque et logo de la société"
            >
              <Building2 size={16} />
              <span className="hidden md:inline">Coordonnées Société</span>
            </button>

            {onWhatsAppShare && (
              <button
                type="button"
                onClick={onWhatsAppShare}
                className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-sm active:scale-95"
                title="Partager par WhatsApp"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-md active:scale-95"
              title="Lancer l'impression ou enregistrer en PDF"
            >
              <Printer size={18} />
              <span>Imprimer / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Fermer"
            >
              <span>Fermer</span>
            </button>
          </div>
        </div>


        {/* CONTENEUR DE LA FEUILLE A4 (Scrollable sur petits écrans, immaculé à l'impression) */}
        <div className="p-2 sm:p-6 bg-slate-200/60 dark:bg-slate-950/80 overflow-x-auto print:p-0 print:bg-white print:overflow-visible">
          <div className="flex justify-center print:block print:w-full">
            <PrintDocumentTemplate data={data} companyInfo={companyInfo} />
          </div>
        </div>
      </div>
    </ModalLayout>
  );
};

export default DocumentPrintModal;
