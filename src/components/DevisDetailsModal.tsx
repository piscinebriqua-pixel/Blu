import React, { useEffect, useState } from 'react';
import ModalLayout from './ModalLayout';
import { 
  MessageCircle, 
  Edit2, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Receipt 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { shareDevisViaWhatsApp, type ShareableDevisItem } from '../helpers/devisShareHelper';
import { DevisItemsList } from './devis/DevisItemsList';
import { DevisAdditionalInfo } from './devis/DevisAdditionalInfo';
import { CreateInvoiceModal } from './invoice/CreateInvoiceModal';

interface DevisDetailsModalProps {
  devis: any;
  onClose: () => void;
  onEdit?: (devisId: string) => void;
  onDelete?: (devis: any) => void;
  onStatusChange?: (devisId: string, status: 'pending' | 'closed' | 'cancelled') => void;
  onConvertToInvoice?: (devis: any) => void;
}

const DevisDetailsModal: React.FC<DevisDetailsModalProps> = ({ 
  devis, 
  onClose, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onConvertToInvoice,
}) => {
  const [items, setItems] = useState<ShareableDevisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('devis_items')
          .select('*')
          .eq('devis_id', devis.id)
          .order('position', { ascending: true })
          .order('id', { ascending: true });

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error('Erreur chargement articles devis:', err);
        toast.error('Impossible de charger le détail du devis');
      } finally {
        setLoading(false);
      }
    };

    if (devis?.id) {
      fetchItems();
    }
  }, [devis?.id]);

  const handleConvert = () => {
    if (onConvertToInvoice) {
      onConvertToInvoice(devis);
    } else {
      setIsInvoiceModalOpen(true);
    }
  };

  return (
    <ModalLayout onClose={onClose} title="Détails du Devis" className="max-w-4xl">
      <div className="flex flex-col gap-6 print:gap-4 pb-4 print:pb-0">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-2 print:gap-1 print:mt-4">
          <div className="flex flex-col items-center">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-500/60 mb-1 print:mb-0">
              Proposition Commerciale
            </span>
            <h2 className="text-2xl print:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center">
              {devis.title || 'Devis'}
            </h2>
            <h3 className="text-base print:text-sm font-bold text-slate-500 dark:text-slate-400 capitalize mt-1 print:mt-0">
              {devis.client?.first_name} {devis.client?.last_name}
            </h3>
            {devis.client?.matricule_fiscal && (
              <span className="mt-1 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40 text-xs font-black uppercase tracking-wider print:hidden">
                MF Client : {devis.client.matricule_fiscal}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-4xl print:text-2xl font-black text-slate-900 dark:text-white tracking-tighter mt-4 print:mt-2">
            {(devis.total_amount || 0).toFixed(0)}
            <span className="text-xl print:text-sm font-bold text-primary dark:text-blue-400">DT</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center mt-2 print:mt-1">
            <div className={`px-4 py-1.5 print:py-1 rounded-xl uppercase tracking-widest text-xs print:text-[9px] font-black ${
              devis.status === 'closed'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : devis.status === 'cancelled'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
            }`}>
              {devis.status === 'closed' ? 'Validé' : devis.status === 'cancelled' ? 'Sans suite' : 'En négociation'}
            </div>

            {devis.invoice_id ? (
              <div className="px-3.5 py-1.5 rounded-xl uppercase tracking-widest text-xs font-black bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center gap-1.5">
                <Receipt size={14} /> Facturé
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConvert}
                className="px-3.5 py-1.5 rounded-xl uppercase tracking-widest text-xs font-black bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all print:hidden"
                title="Convertir ce devis en facture"
              >
                <Receipt size={14} /> Facturer ce devis
              </button>
            )}
          </div>
        </div>

        {/* Company & Header Content */}
        {(devis.header_content || devis.company_phone) && (
          <div className="flex flex-col gap-4 print:gap-2">
            {(devis.company_phone || devis.company_address) && (
              <div className="hidden print:flex flex-col border-b border-slate-100 pb-4 mb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black uppercase text-slate-900 leading-none">Votre Prestataire</div>
                    <div className="text-xs font-bold text-slate-600">Tel: {devis.company_phone}</div>
                    <div className="text-xs font-bold text-slate-600">Email: {devis.company_email}</div>
                    <div className="text-xs font-bold text-slate-600">{devis.company_address}</div>
                    {devis.company_tax_id && (
                      <div className="text-xs font-black uppercase text-slate-700">MF: {devis.company_tax_id}</div>
                    )}
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-xs font-black uppercase text-slate-900 leading-none">Client</div>
                    <div className="text-xs font-bold text-slate-800">{devis.client?.first_name} {devis.client?.last_name}</div>
                    {devis.client?.matricule_fiscal && (
                      <div className="text-xs font-black text-slate-900 uppercase">MF Client : {devis.client.matricule_fiscal}</div>
                    )}
                    {devis.client?.address && <div className="text-xs font-medium text-slate-600">{devis.client.address}</div>}
                    {devis.client?.city && <div className="text-xs font-medium text-slate-600">{devis.client.city}</div>}
                  </div>
                </div>
              </div>
            )}

            {devis.header_content && (
              <div className="p-6 print:p-2 bg-blue-50/30 dark:bg-white/5 rounded-[2rem] print:rounded-none border border-blue-50 dark:border-white/5">
                <p className="text-sm print:text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed italic">
                  {devis.header_content}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-2 print:gap-1">
          <div className="p-4 print:p-2 bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg border border-slate-100 dark:border-white/5 flex flex-col">
            <span className="text-xs print:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 print:mb-0">Numéro</span>
            <span className="text-xs print:text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
              {devis.number}
            </span>
          </div>
          <div className="p-4 print:p-2 bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg border border-slate-100 dark:border-white/5 flex flex-col">
            <span className="text-xs print:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 print:mb-0">Date Devis</span>
            <span className="text-xs print:text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase">
              {new Date(devis.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="p-4 print:p-2 bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg border border-slate-100 dark:border-white/5 flex flex-col">
            <span className="text-xs print:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 print:mb-0">Articles</span>
            <span className="text-xs print:text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
              {items.length} lignes
            </span>
          </div>
          <div className="p-4 print:p-2 bg-slate-50 dark:bg-white/5 rounded-3xl print:rounded-lg border border-slate-100 dark:border-white/5 flex flex-col">
            <span className="text-xs print:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 print:mb-0">
              {devis.client?.matricule_fiscal ? 'MF Client' : 'Ville'}
            </span>
            <span className="text-xs print:text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
              {devis.client?.matricule_fiscal ? devis.client.matricule_fiscal : (devis.client?.city || 'N/A')}
            </span>
          </div>
        </div>

        {/* Détail des Prestations */}
        <DevisItemsList loading={loading} items={items} />

        {/* Informations Complémentaires & Mentions */}
        <DevisAdditionalInfo
          poolDetails={devis.pool_details}
          paymentTerms={devis.payment_terms}
          notes={devis.notes}
          footerContent={devis.footer_content}
        />

        {/* Actions Toolbar at Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 p-4 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10 print:hidden">
          <div className="flex gap-2">
            {onStatusChange && devis.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => onStatusChange(devis.id, 'closed')}
                  className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                  title="Valider le devis (Signé)"
                >
                  <CheckCircle2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(devis.id, 'cancelled')}
                  className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                  title="Sans suite (Annuler)"
                >
                  <XCircle size={18} />
                </button>
              </>
            )}
            {onStatusChange && devis.status !== 'pending' && (
              <button
                type="button"
                onClick={() => onStatusChange(devis.id, 'pending')}
                className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Remettre en négociation"
              >
                <Clock size={18} />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => { onClose(); onEdit(devis.id); }}
                className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Modifier le devis"
              >
                <Edit2 size={18} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => { onClose(); onDelete(devis); }}
                className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Supprimer le devis"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap flex-1 justify-end gap-2.5 min-w-[200px]">
            {/* BOUTON FACTURER / CONVERTIR EN FACTURE */}
            {!devis.invoice_id ? (
              <button
                type="button"
                onClick={handleConvert}
                title="Convertir ce devis en facture officielle"
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Receipt size={16} strokeWidth={2.5} />
                <span>Convertir en Facture</span>
              </button>
            ) : (
              <div className="flex-1 sm:flex-none min-h-[44px] px-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider">
                <Receipt size={15} />
                <span>Facturé</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              title="Télécharger en PDF"
              className="min-h-[44px] px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Download size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {devis.client?.phone && (
              <button
                type="button"
                className="min-h-[44px] px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                onClick={() => shareDevisViaWhatsApp(devis, items)}
                title="Partager sur WhatsApp"
              >
                <MessageCircle size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'émission de facture pré-remplie depuis ce devis */}
      {isInvoiceModalOpen && (
        <CreateInvoiceModal
          clientId={devis.client_id || devis.client?.id}
          clientName={
            devis.client
              ? `${devis.client.first_name || ''} ${devis.client.last_name || ''}`.trim()
              : undefined
          }
          initialDevisId={devis.id}
          onClose={() => setIsInvoiceModalOpen(false)}
          onSuccess={() => {
            setIsInvoiceModalOpen(false);
            onClose();
            if (onStatusChange) {
              onStatusChange(devis.id, 'closed');
            }
          }}
        />
      )}
    </ModalLayout>
  );
};

export default DevisDetailsModal;
