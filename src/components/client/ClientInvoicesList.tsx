import React, { useState, useEffect } from 'react';
import { invoiceService, type InvoiceWithItems } from '../../services/invoiceService';
import CreateInvoiceModal from '../invoice/CreateInvoiceModal';
import InvoiceDetailsModal from '../invoice/InvoiceDetailsModal';
import { Receipt, Plus, FileText, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface ClientInvoicesListProps {
  clientId: string;
  clientName: string;
}

export const ClientInvoicesList: React.FC<ClientInvoicesListProps> = ({
  clientId,
  clientName,
}) => {
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithItems | null>(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.fetchInvoicesByClient(clientId);
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [clientId]);

  return (
    <div className="space-y-4">
      {/* En-tête de section avec bouton Émettre */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Receipt size={18} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
            Factures ({invoices.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="min-h-[44px] px-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
        >
          <Plus size={16} /> Émettre
        </button>
      </div>

      {/* État vide : Pattern Compact CTA Haute Densité (Solution A obligatoire) */}
      {!loading && invoices.length === 0 && (
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="w-full min-h-[52px] p-3 rounded-2xl border-2 border-dashed border-slate-200/90 dark:border-slate-800 hover:border-primary/80 flex items-center justify-between transition-all active:scale-[0.99] bg-white dark:bg-slate-900 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Aucune facture enregistrée
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Facturer des passages ou un devis
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
            <Plus size={16} />
          </div>
        </button>
      )}

      {/* Liste des factures */}
      {invoices.length > 0 && (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const dateStr = new Date(inv.invoice_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="min-h-[56px] p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {inv.number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : inv.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                        }`}
                      >
                        {inv.status === 'paid' ? 'Payée' : inv.status === 'cancelled' ? 'Annulée' : 'Émise'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      {dateStr} • {inv.type === 'interventions' ? 'Passages' : inv.type === 'devis' ? 'Devis' : 'Prestations'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {Number(inv.total_ttc).toFixed(3)} DT
                  </span>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'émission de facture */}
      {isCreateOpen && (
        <CreateInvoiceModal
          clientId={clientId}
          clientName={clientName}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={loadInvoices}
        />
      )}

      {/* Modale de visualisation & impression */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={{
            ...selectedInvoice,
            client: {
              first_name: clientName.split(' ')[0] || '',
              last_name: clientName.split(' ').slice(1).join(' ') || '',
              phone: null,
              address: null,
              city: null,
            },
          }}
          onClose={() => setSelectedInvoice(null)}
          onRefresh={loadInvoices}
        />
      )}
    </div>
  );
};
export default ClientInvoicesList;
