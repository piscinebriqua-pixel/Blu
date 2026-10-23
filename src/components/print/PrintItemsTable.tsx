import React from 'react';
import type { PrintDocumentItem } from './types';

interface PrintItemsTableProps {
  items: PrintDocumentItem[];
}

export const PrintItemsTable: React.FC<PrintItemsTableProps> = ({ items }) => {
  return (
    <div className="w-full my-2">
      <table className="w-full text-left border-collapse">
        {/* EN-TÊTE SUR UNE SEULE LIGNE (Bleu Nuit Executive) */}
        <thead>
          <tr className="bg-[#0b192c] text-white uppercase text-sm font-black tracking-wider break-inside-avoid">
            <th className="py-2 px-2.5 w-12 text-center whitespace-nowrap rounded-l-md">No.</th>
            <th className="py-2 px-3 whitespace-nowrap">Désignation & Prestation</th>
            <th className="py-2 px-3 text-right whitespace-nowrap w-32">P.U. HT (DT)</th>
            <th className="py-2 px-2.5 text-center whitespace-nowrap w-14">Qté</th>
            <th className="py-2 px-2.5 text-center whitespace-nowrap w-16">Unité</th>
            <th className="py-2 px-3 text-right whitespace-nowrap w-36 rounded-r-md">Total HT (DT)</th>
          </tr>
        </thead>

        {/* LIGNES D'ARTICLES HAUTE DENSITÉ & LISIBILITÉ STANDARD UNIVERSELLE */}
        <tbody className="divide-y divide-slate-200 text-sm">
          {items.map((item, idx) => {
            // Ligne de chapitre / section
            if (item.isHeader) {
              return (
                <tr key={item.id || idx} className="bg-slate-100 break-inside-avoid">
                  <td
                    colSpan={6}
                    className="py-1.5 px-3 font-black uppercase text-sm tracking-wider text-slate-950"
                  >
                    {item.description}
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={item.id || idx}
                className="hover:bg-slate-50/50 break-inside-avoid transition-colors"
              >
                {/* Colonne Numéro */}
                <td className="py-1.5 px-2.5 text-center font-bold text-slate-500 whitespace-nowrap">
                  {item.position || idx + 1}
                </td>

                {/* Colonne Désignation */}
                <td className="py-1.5 px-3 font-bold text-slate-900 leading-snug">
                  {item.description}
                </td>

                {/* Colonne Prix Unitaire HT */}
                <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono text-base whitespace-nowrap">
                  {Number(item.unitPrice).toFixed(3)}
                </td>

                {/* Colonne Quantité */}
                <td className="py-2 px-2.5 text-center font-black text-slate-900 text-base whitespace-nowrap">
                  {item.quantity}
                </td>

                {/* Colonne Unité */}
                <td className="py-2 px-2.5 text-center text-slate-600 font-semibold text-sm whitespace-nowrap">
                  {item.unit || 'u'}
                </td>

                {/* Colonne Total HT */}
                <td className="py-2 px-3 text-right font-black text-slate-950 font-mono text-base sm:text-lg whitespace-nowrap">
                  {Number(item.totalPrice).toFixed(3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrintItemsTable;
