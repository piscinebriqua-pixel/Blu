import type { PrintDocumentData } from './types';
import type { InvoiceWithItems } from '../../services/invoiceService';

import type { ShareableDevisItem } from '../../helpers/devisShareHelper';

/**
 * Prépare les données de facture pour le modèle d'impression officiel A4
 */
export function getInvoicePrintData(invoice: InvoiceWithItems): PrintDocumentData {
  const stampDuty = 1.0; // Timbre fiscal réglementaire 1.000 DT
  const subtotalHT = Number(invoice.subtotal_ht) || 0;
  const taxRate = Number(invoice.tax_rate) || 0;
  const taxAmount = Number(invoice.tax_amount) || 0;
  const totalTTC = subtotalHT + taxAmount + stampDuty;
  const paidAmount = Number(invoice.paid_amount) || 0;
  const balanceDue = Math.max(0, totalTTC - paidAmount);

  // Détection éventuelle d'une référence devis dans les articles
  const devisItem = (invoice.items || []).find((it) => it.origin_type === 'devis' && it.origin_id);
  const quoteReference = devisItem?.origin_id ? `DEV-${devisItem.origin_id.slice(0, 8).toUpperCase()}` : undefined;

  const clientFullName = `${invoice.client?.first_name || ''} ${invoice.client?.last_name || ''}`.trim() || 'Client';

  return {
    type: 'facture',
    title: 'FACTURE',
    documentNumber: invoice.number,
    date: invoice.invoice_date,
    dueDate: invoice.due_date || undefined,
    quoteReference,
    status:
      invoice.status === 'paid'
        ? 'Payée'
        : invoice.status === 'cancelled'
        ? 'Annulée'
        : 'En attente',
    client: {
      name: clientFullName,
      companyName: invoice.client?.matricule_fiscal ? clientFullName : undefined,
      phone: invoice.client?.phone,
      address: invoice.client?.address,
      city: invoice.client?.city,
      matricule_fiscal: invoice.client?.matricule_fiscal,
    },
    items: (invoice.items || []).map((it, idx) => ({
      id: it.id,
      position: it.position || idx + 1,
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unit_price) || 0,
      totalPrice: Number(it.total_price) || 0,
      unit: 'u',
    })),
    subtotalHT,
    taxRate,
    taxAmount,
    stampDuty,
    totalTTC,
    paidAmount,
    balanceDue,
    paymentTerms: invoice.payment_terms || 'Règlement sous 30 jours à réception de facture.',
    notes: invoice.notes || undefined,
  };
}


/**
 * Prépare les données de devis pour le modèle d'impression officiel A4
 */
export function getDevisPrintData(devis: any, items: ShareableDevisItem[]): PrintDocumentData {
  const subtotalHT = Number(devis.total_amount) || 0;

  return {
    type: 'devis',
    title: 'DEVIS',
    documentNumber: devis.number || `DEV-${devis.id?.slice(0, 8)}`,
    date: devis.created_at,
    validityDays: 30,
    status:
      devis.status === 'closed'
        ? 'Accepté / Validé'
        : devis.status === 'cancelled'
        ? 'Sans suite'
        : 'En négociation',
    client: {
      name:
        `${devis.client?.first_name || ''} ${devis.client?.last_name || ''}`.trim() ||
        'Client',
      phone: devis.client?.phone,
      address: devis.client?.address,
      city: devis.client?.city,
      matricule_fiscal: devis.client?.matricule_fiscal,
    },
    poolInfo: devis.pool_details
      ? {
          name: devis.pool_details,
          location: devis.client?.city || undefined,
        }
      : null,
    items: items.map((it, idx) => ({
      id: it.id,
      position: idx + 1,
      description: it.designation,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unit_price) || 0,
      totalPrice: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
      unit: it.unit || 'u',
      isHeader: it.is_header,
    })),
    subtotalHT,
    taxRate: 0,
    stampDuty: 0,
    totalTTC: subtotalHT,
    paymentTerms: devis.payment_terms || undefined,
    notes: devis.notes || undefined,
    headerContent: devis.header_content || undefined,
    footerContent: devis.footer_content || undefined,
  };
}
