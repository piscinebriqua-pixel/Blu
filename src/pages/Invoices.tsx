import React, { useEffect, useState, useMemo } from 'react';
import PageLayout from '../components/PageLayout';
import { 
  invoiceService, 
  type InvoiceWithItems 
} from '../services/invoiceService';
import CreateInvoiceModal from '../components/invoice/CreateInvoiceModal';
import InvoiceDetailsModal from '../components/invoice/InvoiceDetailsModal';
import InvoiceSettingsModal from '../components/invoice/InvoiceSettingsModal';
import { 
  Receipt, 
  Plus, 
  Settings, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronRight,
} from 'lucide-react';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'paid' | 'cancelled'>('all');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithItems | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.fetchAllInvoices();
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage et recherche
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const clientName = `${inv.client?.first_name || ''} ${inv.client?.last_name || ''}`.toLowerCase();
      const phone = inv.client?.phone || '';
      const number = (inv.number || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchSearch = !q || clientName.includes(q) || number.includes(q) || phone.includes(q);
      return matchStatus && matchSearch;
    });
  }, [invoices, statusFilter, searchTerm]);

  // Statistiques financières
  const stats = useMemo(() => {
    const totalTtc = invoices.reduce((acc, i) => acc + (Number(i.total_ttc) || 0), 0);
    const paidTtc = invoices
      .filter((i) => i.status === 'paid')
      .reduce((acc, i) => acc + (Number(i.total_ttc) || 0), 0);
    const pendingTtc = totalTtc - paidTtc;
    return { totalTtc, paidTtc, pendingTtc, count: invoices.length };
  }, [invoices]);

  const toolbar = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setIsSettingsModalOpen(true)}
        className="min-h-[44px] min-w-[44px] px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
        title="Paramètres du compteur"
      >
        <Settings size={18} />
      </button>
      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="min-h-[44px] px-4 rounded-2xl bg-primary text-white flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
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
      <div className="space-y-6">
        {/* KPI CARDS (Bento Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Volume Facturé</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalTtc.toFixed(2)} <span className="text-xs text-slate-500 font-bold">DT</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-1 block">{stats.count} facture(s) au total</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Encaissé</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.paidTtc.toFixed(2)} <span className="text-xs text-slate-500 font-bold">DT</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-1 block">Règlements reçus</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-amber-500">En Attente</span>
            <p className="text-2xl font-black text-amber-500 mt-1">
              {stats.pendingTtc.toFixed(2)} <span className="text-xs text-slate-500 font-bold">DT</span>
            </p>
            <span className="text-xs font-bold text-slate-500 mt-1 block">À recouvrer</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Actions Rapides</span>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 min-h-[44px] bg-blue-50 dark:bg-blue-950/40 text-primary rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-blue-200/50 dark:border-blue-900/40"
              >
                <Plus size={16} /> Émettre
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-11 min-h-[44px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center"
                title="Régler le compteur"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* BARRE DE RECHERCHE & FILTRES */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par numéro, client ou téléphone..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto">
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
                className={`min-h-[44px] px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === f.key
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTE DES FACTURES */}
        {filteredInvoices.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full min-h-[52px] p-4 rounded-2xl border-2 border-dashed border-slate-200/90 dark:border-slate-800 hover:border-blue-500/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 group transition-all active:scale-[0.99]"
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
          <div className="space-y-2.5">
            {filteredInvoices.map((inv) => {
              const dateStr = new Date(inv.invoice_date).toLocaleDateString('fr-FR');
              const clientFullName = inv.client
                ? `${inv.client.first_name} ${inv.client.last_name}`
                : 'Client Inconnu';

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="card-bento p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/50 transition-all border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Receipt size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {inv.number}
                        </span>
                        {inv.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={12} /> Payée
                          </span>
                        ) : inv.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                            <XCircle size={12} /> Annulée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                            <Clock size={12} /> Émise
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                        {clientFullName} • {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900 dark:text-white">
                        {Number(inv.total_ttc).toFixed(3)} <span className="text-xs text-slate-500">DT</span>
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        HT: {Number(inv.subtotal_ht).toFixed(3)} DT
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-slate-500 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALE D'ÉMISSION DE FACTURE (MODE GLOBAL) */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            loadInvoices();
          }}
        />
      )}

      {/* MODALE DE CONFIGURATION DU COMPTEUR */}
      {isSettingsModalOpen && (
        <InvoiceSettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          onSaved={() => {
            loadInvoices();
          }}
        />
      )}

      {/* MODALE DÉTAILS / ACTIONS SUR LA FACTURE */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRefresh={() => {
            loadInvoices();
            setSelectedInvoice(null);
          }}
        />
      )}
    </PageLayout>
  );
};
export default Invoices;
