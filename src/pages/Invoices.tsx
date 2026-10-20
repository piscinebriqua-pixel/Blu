import React, { useEffect, useState, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { invoiceService, type InvoiceWithItems } from '../services/invoiceService';
import CreateInvoiceModal from '../components/invoice/CreateInvoiceModal';
import InvoiceDetailsModal from '../components/invoice/InvoiceDetailsModal';
import InvoiceSettingsModal from '../components/invoice/InvoiceSettingsModal';
import DocumentPrintModal from '../components/print/DocumentPrintModal';
import { getInvoicePrintData } from '../components/print/helpers';
import ConfirmModal from '../components/ConfirmModal';
import InvoiceKpiRibbon from '../components/invoice/InvoiceKpiRibbon';
import InvoiceListItemCard from '../components/invoice/InvoiceListItemCard';
import InvoiceDetailPanel from '../components/invoice/InvoiceDetailPanel';
import SortSelector, { type SortOption } from '../components/ui/SortSelector';
import { Plus, Settings, Search, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';

export type InvoiceSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'number-desc'
  | 'client-asc';

const INVOICE_SORT_OPTIONS: SortOption<InvoiceSortOption>[] = [
  { value: 'date-desc', label: 'Date (Plus récentes)' },
  { value: 'date-asc', label: 'Date (Plus anciennes)' },
  { value: 'amount-desc', label: 'Montant (Décroissant)' },
  { value: 'amount-asc', label: 'Montant (Croissant)' },
  { value: 'number-desc', label: 'N° Facture (Récent)' },
  { value: 'client-asc', label: 'Client (A → Z)' },
];

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'paid' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<InvoiceSortOption>('date-desc');

  // État de sélection pour Master-Detail (Desktop) & Modale (Mobile)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithItems | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Modales d'actions
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.fetchAllInvoices();
      setInvoices(data);
      if (data.length > 0 && !selectedInvoice) {
        setSelectedInvoice(data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrage, recherche et tri
  const filteredInvoices = useMemo(() => {
    const list = invoices.filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const clientName = `${inv.client?.first_name || ''} ${inv.client?.last_name || ''}`.toLowerCase();
      const phone = inv.client?.phone || '';
      const number = (inv.number || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchSearch = !q || clientName.includes(q) || number.includes(q) || phone.includes(q);
      return matchStatus && matchSearch;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime();
        case 'amount-desc':
          return (Number(b.total_ttc) || 0) - (Number(a.total_ttc) || 0);
        case 'amount-asc':
          return (Number(a.total_ttc) || 0) - (Number(b.total_ttc) || 0);
        case 'number-desc':
          return (b.number || '').localeCompare(a.number || '', undefined, { numeric: true });
        case 'client-asc': {
          const nameA = `${a.client?.first_name || ''} ${a.client?.last_name || ''}`.trim();
          const nameB = `${b.client?.first_name || ''} ${b.client?.last_name || ''}`.trim();
          return nameA.localeCompare(nameB);
        }
        case 'date-desc':
        default:
          return new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime();
      }
    });
  }, [invoices, statusFilter, searchTerm, sortBy]);

  // Statistiques financières
  const stats = useMemo(() => {
    const totalTtc = invoices.reduce((acc, i) => acc + (Number(i.total_ttc) || 0), 0);
    const paidTtc = invoices
      .filter((i) => i.status === 'paid')
      .reduce((acc, i) => acc + (Number(i.total_ttc) || 0), 0);
    const pendingTtc = totalTtc - paidTtc;
    return { totalTtc, paidTtc, pendingTtc, count: invoices.length };
  }, [invoices]);

  const handleCardClick = (inv: InvoiceWithItems) => {
    setSelectedInvoice(inv);
    // Sur smartphone ou tablette (< 1024px), ouvrir la modal de détail
    if (window.innerWidth < 1024) {
      setIsMobileModalOpen(true);
    }
  };

  const handleStatusChange = async (newStatus: 'issued' | 'paid' | 'cancelled') => {
    if (!selectedInvoice) return;
    const ok = await invoiceService.updateInvoiceStatus(selectedInvoice.id, newStatus);
    if (ok) {
      loadInvoices();
      setSelectedInvoice((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleWhatsAppShare = () => {
    if (!selectedInvoice?.client?.phone) {
      toast.error('Aucun numéro de téléphone client disponible');
      return;
    }
    const dateStr = new Date(selectedInvoice.invoice_date).toLocaleDateString('fr-FR');
    let msg = `*FACTURE BCCP BLU N° ${selectedInvoice.number}*\n`;
    msg += `📅 Date : ${dateStr}\n`;
    msg += `👤 Client : ${selectedInvoice.client.first_name} ${selectedInvoice.client.last_name}\n`;
    if (selectedInvoice.client.matricule_fiscal) {
      msg += `🏢 M.F. Client : ${selectedInvoice.client.matricule_fiscal}\n`;
    }
    msg += `\n*TOTAL NET À PAYER : ${Number(selectedInvoice.total_ttc).toFixed(3)} DT*\n`;
    msg += `_Statut : ${selectedInvoice.status === 'paid' ? 'Payée' : 'En attente'}_`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = selectedInvoice.client.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    try {
      setDeleting(true);
      const ok = await invoiceService.deleteInvoice(selectedInvoice.id);
      if (ok) {
        setSelectedInvoice(null);
        setIsMobileModalOpen(false);
        loadInvoices();
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setIsSettingsModalOpen(true)}
        className="min-h-[44px] min-w-[44px] px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
        title="Paramètres de numérotation"
      >
        <Settings size={18} />
      </button>
      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="min-h-[44px] px-4 rounded-2xl bg-primary text-white flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
      >
        <Plus size={18} />
        <span>Nouvelle Facture</span>
      </button>
    </div>
  );

  return (
    <PageLayout
      title="Facturation"
      subtitle="Gestion globale des factures émises"
      showBackButton={true}
      toolbar={toolbar}
      loading={loading}
    >
      <div className="space-y-4">
        {/* 1. RUBAN FINANCIER RESPONSIVE (48px sur smartphone, 3 cartes sur tablette/desktop) */}
        <InvoiceKpiRibbon stats={stats} />

        {/* 2. BARRE DE RECHERCHE, FILTRES & TRI */}
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher numéro, client, tél..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <SortSelector<InvoiceSortOption>
              value={sortBy}
              onChange={setSortBy}
              options={INVOICE_SORT_OPTIONS}
              className="shrink-0"
            />
          </div>

          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto shrink-0">
            {(
              [
                { key: 'all', label: 'Toutes' },
                { key: 'issued', label: 'Émises' },
                { key: 'paid', label: 'Payées' },
                { key: 'cancelled', label: 'Annulées' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === f.key
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. DISPOSITION MAÎTRE-DÉTAIL (DESKTOP) OU GRILLE/LISTE (MOBILE/TABLETTE) */}
        {filteredInvoices.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full min-h-[52px] p-4 rounded-2xl border-2 border-dashed border-slate-200/90 dark:border-slate-800 hover:border-blue-500/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 group transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center">
                <Receipt size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-slate-800 dark:text-white">
                  Aucune facture trouvée
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Cliquez ici pour créer votre première facture
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <Plus size={16} />
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* PANNEAU GAUCHE : LISTE (12 cols sur mobile/tablette, 5 cols sur grand écran) */}
            <div className="lg:col-span-5 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {filteredInvoices.map((inv) => (
                  <InvoiceListItemCard
                    key={inv.id}
                    invoice={inv}
                    isSelected={selectedInvoice?.id === inv.id}
                    onClick={() => handleCardClick(inv)}
                  />
                ))}
              </div>
            </div>

            {/* PANNEAU DROIT : DÉTAIL EN TEMPS RÉEL (Caché sur mobile/tablette, 7 cols sur Desktop) */}
            <div className="hidden lg:block lg:col-span-7 sticky top-20">
              <InvoiceDetailPanel
                invoice={selectedInvoice}
                onStatusChange={handleStatusChange}
                onWhatsAppShare={handleWhatsAppShare}
                onPrint={() => setShowPrintModal(true)}
                onDelete={() => setShowDeleteConfirm(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* MODALE DÉTAILS SMARTPHONE & TABLETTE (< 1024px) */}
      {isMobileModalOpen && selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setIsMobileModalOpen(false)}
          onRefresh={() => {
            loadInvoices();
            setIsMobileModalOpen(false);
          }}
        />
      )}

      {/* MODALE DE CRÉATION */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => loadInvoices()}
        />
      )}

      {/* MODALE DE CONFIGURATION */}
      {isSettingsModalOpen && (
        <InvoiceSettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          onSaved={() => loadInvoices()}
        />
      )}

      {/* MODALE D'IMPRESSION A4 OFFICIELLE */}
      {showPrintModal && selectedInvoice && (
        <DocumentPrintModal
          data={getInvoicePrintData(selectedInvoice)}
          onClose={() => setShowPrintModal(false)}
          onWhatsAppShare={handleWhatsAppShare}
        />
      )}

      {/* CONFIRMATION DE SUPPRESSION */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer la Facture ?"
        message={`La facture ${selectedInvoice?.number || ''} sera définitivement effacée et ses éléments libérés.`}
        confirmLabel="SUPPRIMER"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </PageLayout>
  );
};

export default Invoices;
