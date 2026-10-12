import React, { useState, useEffect } from 'react';
import ModalLayout from '../ModalLayout';
import ConfirmModal from '../ConfirmModal';
import { invoiceService, type InvoiceWithItems } from '../../services/invoiceService';
import { 
  Receipt, 
  Printer, 
  Share2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Building2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InvoiceDetailsModalProps {
  invoice: InvoiceWithItems;
  onClose: () => void;
  onRefresh: () => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoice,
  onClose,
  onRefresh,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleWhatsAppShare = () => {
    if (!invoice.client?.phone) {
      toast.error('Aucun numéro de téléphone client disponible');
      return;
    }

    const dateStr = new Date(invoice.invoice_date).toLocaleDateString('fr-FR');
    let msg = `*FACTURE BCCP BLU N° ${invoice.number}*\n`;
    msg += `📅 Date : ${dateStr}\n`;
    msg += `👤 Client : ${invoice.client.first_name} ${invoice.client.last_name}\n\n`;
    msg += `*Détails des prestations :*\n`;

    (invoice.items || []).forEach((it) => {
      msg += `• ${it.description} : ${Number(it.total_price).toFixed(3)} DT\n`;
    });

    msg += `\n*TOTAL NET À PAYER : ${Number(invoice.total_ttc).toFixed(3)} DT*\n`;
    msg += `_Statut : ${invoice.status === 'paid' ? 'Payée' : 'En attente de règlement'}_\n\n`;
    msg += `Merci de votre confiance !`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = invoice.client.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: 'issued' | 'paid' | 'cancelled') => {
    const ok = await invoiceService.updateInvoiceStatus(invoice.id, newStatus);
    if (ok) {
      onRefresh();
      onClose();
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const ok = await invoiceService.deleteInvoice(invoice.id);
      if (ok) {
        onRefresh();
        onClose();
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <ModalLayout
        title={`Facture ${invoice.number}`}
        subtitle={`Émise le ${new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}`}
        icon={<Receipt className="text-primary" size={24} />}
        onClose={onClose}
        className="max-w-2xl !min-h-0 print:m-0 print:p-0 print:max-w-none print:shadow-none"
      >
        <div className="space-y-6 pb-2 print:space-y-4">
          {/* En-tête Statut & Actions Rapides */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Statut :</span>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : invoice.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                }`}
              >
                {invoice.status === 'paid' ? 'Payée' : invoice.status === 'cancelled' ? 'Annulée' : 'En attente'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {invoice.status !== 'paid' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('paid')}
                  className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 size={16} /> Marquer Payée
                </button>
              )}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-11 h-11 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                title="Partager par WhatsApp"
              >
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="w-11 h-11 flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white rounded-xl transition-all"
                title="Imprimer / Exporter PDF"
              >
                <Printer size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-11 h-11 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                title="Supprimer la facture"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* TABLEAU DES LIGNES DE FACTURE */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Prestations et Articles
            </h3>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-xs font-black uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Désignation</th>
                    <th className="py-3 px-3 text-center">Qté</th>
                    <th className="py-3 px-3 text-right">P.U (DT)</th>
                    <th className="py-3 px-4 text-right">Total (DT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(invoice.items || []).map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {it.description}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                        {it.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 font-medium">
                        {Number(it.unit_price).toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        {Number(it.total_price).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RÉCAPITULATIF FINANCIER */}
          <div className="flex justify-end">
            <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Sous-total HT :</span>
                <span>{Number(invoice.subtotal_ht).toFixed(3)} DT</span>
              </div>
              {Number(invoice.tax_rate) > 0 && (
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>TVA ({invoice.tax_rate}%) :</span>
                  <span>{Number(invoice.tax_amount).toFixed(3)} DT</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline font-black">
                <span className="text-sm uppercase text-slate-800 dark:text-white">Total TTC :</span>
                <span className="text-xl text-primary dark:text-blue-400">
                  {Number(invoice.total_ttc).toFixed(3)} DT
                </span>
              </div>
            </div>
          </div>

          {/* Note / Conditions de règlement */}
          {invoice.payment_terms && (
            <p className="text-xs font-semibold text-slate-500 italic">
              Conditions de règlement : {invoice.payment_terms}
            </p>
          )}
        </div>
      </ModalLayout>

      {/* Confirmation de suppression (Règle ConfirmModal avec Portal) */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer la Facture ?"
        message={`La facture ${invoice.number} sera définitivement effacée. Toutes les interventions et devis associés seront immédiatement libérés et pourront être refacturés.`}
        confirmText="Supprimer et Déverrouiller"
        cancelText="Conserver"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
export default InvoiceDetailsModal;
