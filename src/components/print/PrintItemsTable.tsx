import React from 'react';
import type { PrintDocumentItem } from './types';

interface PrintItemsTableProps {
  items: PrintDocumentItem[];
}

export const PrintItemsTable: React.FC<PrintItemsTableProps> = ({ items }) => {
  return (
    <div className="w-full my-3">
      <table className="w-full text-left border-collapse">
        {/* EN-TÊTE PLEINE COULEUR BLEU NUIT (Style Modern Executive) */}
        <thead>
          <tr className="bg-[#0b192c] text-white uppercase text-xs font-black tracking-wider break-inside-avoid">
            <th className="py-2.5 px-2.5 w-10 text-center rounded-l-md">No.</th>
            <th className="py-2.5 px-3">Désignation & Prestation</th>
            <th className="py-2.5 px-3 text-right w-24">P.U. HT (DT)</th>
            <th className="py-2.5 px-2 text-center w-14">Qté</th>
            <th className="py-2.5 px-2 text-center w-16">Unité</th>
            <th className="py-2.5 px-3 text-right w-28 rounded-r-md">Total HT (DT)</th>
          </tr>
        </thead>

        {/* LIGNES DES ARTICLES SANS BORDURES VERTICALES */}
        <tbody className="divide-y divide-slate-200 text-xs">
          {items.map((item, idx) => {
            // Ligne de chapitre / section
            if (item.isHeader) {
              return (
                <tr key={item.id || idx} className="bg-slate-100 break-inside-avoid">
                  <td
                    colSpan={6}
                    className="py-2 px-3 font-black uppercase text-xs tracking-wider text-slate-900"
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
                <td className="py-2.5 px-2.5 text-center font-bold text-slate-500">
                  {item.position || idx + 1}
                </td>

                {/* Colonne Désignation */}
                <td className="py-2.5 px-3 font-bold text-slate-800 leading-snug">
                  {item.description}
                </td>

                {/* Colonne Prix Unitaire HT */}
                <td className="py-2.5 px-3 text-right font-semibold text-slate-700 font-mono">
                  {Number(item.unitPrice).toFixed(3)}
                </td>

                {/* Colonne Quantité */}
                <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                  {item.quantity}
                </td>

                {/* Colonne Unité */}
                <td className="py-2.5 px-2 text-center text-slate-500 font-medium">
                  {item.unit || 'u'}
                </td>

                {/* Colonne Total HT */}
                <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono">
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
