import { openWhatsAppChat } from '../lib/phoneUtils';
import { toast } from 'react-hot-toast';

export interface ShareableDevisItem {
  id: string;
  designation: string;
  quantity: number;
  unit_price: number;
  unit: string;
  is_header: boolean;
}

export function shareDevisViaWhatsApp(devis: any, items: ShareableDevisItem[]) {
  if (!devis.client?.phone) {
    toast.error('Aucun numéro de téléphone pour ce client');
    return;
  }

  const date = new Date(devis.created_at).toLocaleDateString('fr-FR');
  let message = `*DEVIS ${devis.number}*\n`;
  message += `Titre: ${devis.title}\n`;
  message += `📅 Date: ${date}\n\n`;

  if (items.length > 0) {
    message += `*Détails des prestations :*\n`;
    items.forEach((item) => {
      if (item.is_header) {
        message += `\n_${item.designation.toUpperCase()}_\n`;
      } else {
        const lineTotal = item.quantity * item.unit_price;
        message += `- ${item.designation} (${item.quantity} ${item.unit || 'u'}) : ${lineTotal.toFixed(0)} DT\n`;
      }
    });
    message += `\n`;
  }

  message += `*Total Devis : ${(devis.total_amount || 0).toFixed(0)} DT*\n\n`;

  if (devis.status === 'closed') {
    message += `✅ Ce devis a été accepté/clôturé.\n\n`;
  } else if (devis.status === 'cancelled') {
    message += `❌ Ce devis est annulé.\n\n`;
  }

  message += `Merci de votre confiance ! 🙏`;
  openWhatsAppChat(devis.client.phone, message);
}
