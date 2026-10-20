import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { devisService, type DevisRecord, type DevisItem } from '../services/devisService';
import DevisKpiRibbon from '../components/devis/DevisKpiRibbon';
import DevisListItemCard from '../components/devis/DevisListItemCard';
import DevisDetailPanel from '../components/devis/DevisDetailPanel';
import SortSelector, { type SortOption } from '../components/ui/SortSelector';
import AddDevisModal from '../components/AddDevisModal';
import DevisDetailsModal from '../components/DevisDetailsModal';
import DocumentPrintModal from '../components/print/DocumentPrintModal';
import { getDevisPrintData } from '../components/print/helpers';
import ConfirmModal from '../components/ConfirmModal';
import CreateInvoiceModal from '../components/invoice/CreateInvoiceModal';
import { openWhatsAppChat } from '../lib/phoneUtils';
import { FileText, Plus, FileSignature, Search } from 'lucide-react';

export type DevisSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'number-desc'
  | 'client-asc';

const DEVIS_SORT_OPTIONS: SortOption<DevisSortOption>[] = [
  { value: 'date-desc', label: 'Date (Plus récents)' },
  { value: 'date-asc', label: 'Date (Plus anciens)' },
  { value: 'amount-desc', label: 'Montant (Décroissant)' },
  { value: 'amount-asc', label: 'Montant (Croissant)' },
  { value: 'number-desc', label: 'N° Devis (Récent)' },
  { value: 'client-asc', label: 'Client (A → Z)' },
];

export const Devis: React.FC = () => {
  const navigate = useNavigate();
  const [devisList, setDevisList] = useState<DevisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'closed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<DevisSortOption>('date-desc');

  // Sélection pour Master-Detail (Desktop) & Modale (Mobile)
  const [selectedDevis, setSelectedDevis] = useState<DevisRecord | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Modales d'actions
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDevisId, setEditingDevisId] = useState<string | null>(null);
  const [devisToDelete, setDevisToDelete] = useState<DevisRecord | null>(null);
  const [devisToInvoice, setDevisToInvoice] = useState<DevisRecord | null>(null);
  const [printModalData, setPrintModalData] = useState<{ devis: DevisRecord; items: DevisItem[] } | null>(null);

  useEffect(() => {
    loadDevis();
  }, []);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const data = await devisService.fetchAllDevis();
      setDevisList(data);
      if (data.length > 0 && !selectedDevis) {
        setSelectedDevis(data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrage, recherche et tri
  const filteredDevis = useMemo(() => {
    const list = devisList.filter((d) => {
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const clientName = `${d.client?.first_name || ''} ${d.client?.last_name || ''}`.toLowerCase();
      const phone = d.client?.phone || '';
      const number = (d.number || '').toLowerCase();
      const title = (d.title || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchSearch =
        !q ||
        clientName.includes(q) ||
        number.includes(q) ||
        title.includes(q) ||
        phone.includes(q);

      return matchStatus && matchSearch;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount-desc':
          return (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0);
        case 'amount-asc':
          return (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
        case 'number-desc':
          return (b.number || '').localeCompare(a.number || '', undefined, { numeric: true });
        case 'client-asc': {
          const nameA = `${a.client?.first_name || ''} ${a.client?.last_name || ''}`.trim();
          const nameB = `${b.client?.first_name || ''} ${b.client?.last_name || ''}`.trim();
          return nameA.localeCompare(nameB);
        }
        case 'date-desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [devisList, statusFilter, searchTerm, sortBy]);

  // Statistiques
  const stats = useMemo(() => {
    return devisService.calculateStats(devisList);
  }, [devisList]);

  // Actions
  const handleCardClick = (devis: DevisRecord) => {
    setSelectedDevis(devis);
    if (window.innerWidth < 1024) {
      setIsMobileModalOpen(true);
    }
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'closed' | 'cancelled') => {
    const ok = await devisService.updateStatus(id, status);
    if (ok) {
      setDevisList((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
      if (selectedDevis?.id === id) {
        setSelectedDevis({ ...selectedDevis, status });
      }
    }
  };

  const handleDuplicate = async (devis: DevisRecord) => {
    const duplicated = await devisService.duplicateDevis(devis);
    if (duplicated) {
      setDevisList((prev) => [duplicated, ...prev]);
      setSelectedDevis(duplicated);
    }
  };

  const handleDelete = async () => {
    if (!devisToDelete) return;
    const ok = await devisService.deleteDevis(devisToDelete.id, devisToDelete.number);
    if (ok) {
      setDevisList((prev) => prev.filter((d) => d.id !== devisToDelete.id));
      if (selectedDevis?.id === devisToDelete.id) {
        setSelectedDevis(null);
      }
      setDevisToDelete(null);
      setIsMobileModalOpen(false);
    }
  };

  const handleWhatsApp = (devis: DevisRecord) => {
    if (!devis.client?.phone) return;
    const message = `Bonjour ${devis.client.first_name || ''}, voici votre devis ${devis.number} (${devis.title}) d'un montant de ${Number(devis.total_amount).toFixed(0)} DT. Restant à votre écoute pour toute question.`;
    openWhatsAppChat(devis.client.phone, message);
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigate('/settings/devis-templates')}
        className="min-h-[44px] min-w-[44px] px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 active:scale-95 transition-all text-xs font-black uppercase tracking-wider cursor-pointer"
        title="Modèles de devis réutilisables"
      >
        <FileSignature size={18} />
        <span className="hidden sm:inline">Modèles</span>
      </button>

      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="min-h-[44px] px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
      >
        <Plus size={18} />
        <span>Nouveau Devis</span>
      </button>
    </div>
  );

  return (
    <PageLayout
      title="Devis Commerciaux"
      subtitle="Gestion et suivi des offres et propositions"
      showBackButton={true}
      toolbar={toolbar}
      loading={loading}
    >
      <div className="space-y-4">
        {/* 1. RUBAN KPI RESPONSIVE (Mini-ruban sur mobile, 3 Bento sur tablette/desktop) */}
        <DevisKpiRibbon stats={stats} />

        {/* 2. BARRE DE RECHERCHE, FILTRES ET TRI */}
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par client, titre, numéro ou tél..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <SortSelector<DevisSortOption>
              value={sortBy}
              onChange={setSortBy}
              options={DEVIS_SORT_OPTIONS}
              className="shrink-0"
            />
          </div>

          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto shrink-0">
            {(
              [
                { key: 'all', label: 'Tous' },
                { key: 'pending', label: 'En négociation' },
                { key: 'closed', label: 'Validés' },
                { key: 'cancelled', label: 'Sans suite' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === f.key
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. DISPOSITION MAÎTRE-DÉTAIL (DESKTOP) OU GRILLE/LISTE (MOBILE/TABLETTE) */}
        {filteredDevis.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full min-h-[52px] p-4 rounded-2xl border-2 border-dashed border-slate-200/90 dark:border-slate-800 hover:border-amber-500/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 group transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase text-slate-800 dark:text-white">
                  Aucun devis trouvé
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Cliquez ici pour créer votre première proposition commerciale
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Plus size={16} />
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* PANNEAU GAUCHE : LISTE (12 cols mobile/tablette, 5 cols desktop) */}
            <div className="lg:col-span-5 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {filteredDevis.map((d) => (
                  <DevisListItemCard
                    key={d.id}
                    devis={d}
                    isSelected={selectedDevis?.id === d.id}
                    onClick={() => handleCardClick(d)}
                  />
                ))}
              </div>
            </div>

            {/* PANNEAU DROIT : DÉTAIL EN TEMPS RÉEL (Caché sur mobile/tablette, 7 cols sur Desktop) */}
            <div className="hidden lg:block lg:col-span-7 sticky top-20">
              <DevisDetailPanel
                devis={selectedDevis}
                onStatusChange={handleStatusChange}
                onWhatsAppShare={handleWhatsApp}
                onPrint={(targetDevis, targetItems) => {
                  setPrintModalData({ devis: targetDevis, items: targetItems });
                }}
                onEdit={(id) => setEditingDevisId(id)}
                onDelete={(target) => setDevisToDelete(target)}
                onConvertToInvoice={(target) => setDevisToInvoice(target)}
                onDuplicate={handleDuplicate}
              />
            </div>
          </div>
        )}
      </div>

      {/* MODALES D'ACTIONS */}
      {isCreateModalOpen && (
        <AddDevisModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            loadDevis();
          }}
        />
      )}

      {editingDevisId && (
        <AddDevisModal
          devisId={editingDevisId}
          onClose={() => setEditingDevisId(null)}
          onSuccess={() => {
            setEditingDevisId(null);
            loadDevis();
          }}
        />
      )}

      {/* Modale plein écran sur smartphone / tablette lors d'un tap */}
      {isMobileModalOpen && selectedDevis && (
        <DevisDetailsModal
          devis={selectedDevis}
          onClose={() => setIsMobileModalOpen(false)}
          onEdit={(id) => {
            setIsMobileModalOpen(false);
            setEditingDevisId(id);
          }}
          onDelete={(devis) => {
            setIsMobileModalOpen(false);
            setDevisToDelete(devis);
          }}
          onStatusChange={handleStatusChange}
          onConvertToInvoice={(devisItem) => {
            setIsMobileModalOpen(false);
            setDevisToInvoice(devisItem);
          }}
        />
      )}

      {/* Modale d'impression officielle A4 directe depuis le panneau desktop */}
      {printModalData && (
        <DocumentPrintModal
          data={getDevisPrintData(printModalData.devis, printModalData.items)}
          onClose={() => setPrintModalData(null)}
          onWhatsAppShare={
            printModalData.devis.client?.phone
              ? () => handleWhatsApp(printModalData.devis)
              : undefined
          }
        />
      )}

      {devisToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer ce devis"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le devis ${devisToDelete.number} ? Cette action est irréversible.`}
          confirmLabel="SUPPRIMER"
          variant="danger"
          onConfirm={handleDelete}
          onClose={() => setDevisToDelete(null)}
        />
      )}

      {devisToInvoice && (
        <CreateInvoiceModal
          clientId={devisToInvoice.client_id || undefined}
          clientName={
            devisToInvoice.client
              ? `${devisToInvoice.client.first_name} ${devisToInvoice.client.last_name}`
              : undefined
          }
          initialDevisId={devisToInvoice.id}
          onClose={() => setDevisToInvoice(null)}
          onSuccess={() => {
            setDevisToInvoice(null);
            loadDevis();
          }}
        />
      )}
    </PageLayout>
  );
};

export default Devis;
