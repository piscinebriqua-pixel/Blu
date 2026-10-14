import React from 'react';

interface DevisAdditionalInfoProps {
  poolDetails?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  footerContent?: string | null;
}

export const DevisAdditionalInfo: React.FC<DevisAdditionalInfoProps> = ({
  poolDetails,
  paymentTerms,
  notes,
  footerContent,
}) => {
  return (
    <>
      {(poolDetails || notes || paymentTerms) && (
        <div className="space-y-4 print:space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
            <h5 className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] print:text-[10px]">
              Informations Complémentaires
            </h5>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-3 gap-4 print:gap-2">
            {poolDetails && (
              <div className="bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg p-5 print:p-3 border border-slate-100 dark:border-white/5">
                <h6 className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 print:mb-1">
                  Caractéristiques Bassin
                </h6>
                <p className="text-xs print:text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {poolDetails}
                </p>
              </div>
            )}
            {paymentTerms && (
              <div className="bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg p-5 print:p-3 border border-slate-100 dark:border-white/5">
                <h6 className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 print:mb-1">
                  Modalités de Paiement
                </h6>
                <p className="text-xs print:text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {paymentTerms}
                </p>
              </div>
            )}
            {notes && (
              <div
                className={`bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg p-5 print:p-3 border border-slate-100 dark:border-white/5 ${
                  !poolDetails || !paymentTerms ? 'md:col-span-2 print:col-span-1' : ''
                }`}
              >
                <h6 className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 print:mb-1">
                  Notes
                </h6>
                <p className="text-xs print:text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed italic">
                  {notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {footerContent && (
        <div className="mt-8 print:mt-4 p-8 print:p-4 bg-slate-900 text-white rounded-[2.5rem] print:rounded-xl border border-slate-800 shadow-xl shadow-slate-900/10">
          <h6 className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 print:mb-2">
            Mentions & Engagement
          </h6>
          <p className="text-xs print:text-[10px] font-bold text-slate-300 whitespace-pre-line leading-relaxed">
            {footerContent}
          </p>
          <div className="hidden print:grid grid-cols-2 gap-8 mt-12">
            <div className="border-t border-slate-700 pt-4 flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                Signature Cachet Client
              </span>
              <div className="h-48" />
              <span className="text-[9px] font-bold">Lu et Approuvé le : ____/____/20____</span>
            </div>
            <div className="border-t border-slate-700 pt-4 flex flex-col gap-1 text-right">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                Signature Entreprise
              </span>
              <div className="h-48" />
              <span className="text-[9px] font-bold italic underline">Bon pour accord</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
