import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { devisService, type DevisRecord } from '../services/devisService';
import { DevisStatsGrid } from '../components/devis/DevisStatsGrid';
import { DevisCard } from '../components/devis/DevisCard';
import AddDevisModal from '../components/AddDevisModal';
import DevisDetailsModal from '../components/DevisDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import CreateInvoiceModal from '../components/invoice/CreateInvoiceModal';
import { openWhatsAppChat } from '../lib/phoneUtils';
import { 
  FileText, 
  Plus, 
  FileSignature, 
  Search 
} from 'lucide-react';

export const Devis: React.FC = () => {
  const navigate = useNavigate();
  const [devisList, setDevisList] = useState<DevisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'closed' | 'cancelled'>('all');

  // États des modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDevisId, setEditingDevisId] = useState<string | null>(null);
  const [selectedDevisForView, setSelectedDevisForView] = useState<DevisRecord | null>(null);
  const [devisToDelete, setDevisToDelete] = useState<DevisRecord | null>(null);
  const [devisToInvoice, setDevisToInvoice] = useState<DevisRecord | null>(null);

  useEffect(() => {
    loadDevis();
  }, []);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const data = await devisService.fetchAllDevis();
      setDevisList(data);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage et recherche
  const filteredDevis = useMemo(() => {
    return devisList.filter((d) => {
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
  }, [devisList, statusFilter, searchTerm]);

  // Statistiques
  const stats = useMemo(() => {
    return devisService.calculateStats(devisList);
  }, [devisList]);

  // Actions
  const handleStatusChange = async (id: string, status: 'pending' | 'closed' | 'cancelled') => {
    const ok = await devisService.updateStatus(id, status);
    if (ok) {
      setDevisList((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
      if (selectedDevisForView?.id === id) {
        setSelectedDevisForView({ ...selectedDevisForView, status });
      }
    }
  };

  const handleDuplicate = async (devis: DevisRecord) => {
    const duplicated = await devisService.duplicateDevis(devis);
    if (duplicated) {
      setDevisList((prev) => [duplicated, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!devisToDelete) return;
    const ok = await devisService.deleteDevis(devisToDelete.id, devisToDelete.number);
    if (ok) {
      setDevisList((prev) => prev.filter((d) => d.id !== devisToDelete.id));
      setDevisToDelete(null);
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
        className="min-h-[44px] min-w-[44px] px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 active:scale-95 transition-all text-xs font-black uppercase tracking-wider"
        title="Modèles de devis réutilisables"
      >
        <FileSignature size={18} />
        <span className="hidden sm:inline">Modèles</span>
      </button>

      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="min-h-[44px] px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
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
      <div className="space-y-6">
        {/* KPI CARDS (Bento Grid) */}
        <DevisStatsGrid stats={stats} onNewDevis={() => setIsCreateModalOpen(true)} />

        {/* BARRE DE RECHERCHE & FILTRES */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par client, titre, numéro ou tél..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto">
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
                className={`min-h-[44px] px-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === f.key
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTE DES DEVIS */}
        {filteredDevis.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full min-h-[52px] p-4 rounded-2xl border-2 border-dashed border-slate-200/90 dark:border-slate-800 hover:border-amber-500/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 group transition-all active:scale-[0.99]"
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
          <div className="space-y-2.5">
            {filteredDevis.map((d) => (
              <DevisCard
                key={d.id}
                devis={d}
                onSelect={(selected) => setSelectedDevisForView(selected)}
                onEdit={(id) => setEditingDevisId(id)}
                onDuplicate={handleDuplicate}
                onDelete={(target) => setDevisToDelete(target)}
                onStatusChange={handleStatusChange}
                onConvertToInvoice={(target) => setDevisToInvoice(target)}
                onWhatsApp={handleWhatsApp}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODALES */}
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

      {selectedDevisForView && (
        <DevisDetailsModal
          devis={selectedDevisForView}
          onClose={() => setSelectedDevisForView(null)}
          onEdit={(id) => {
            setSelectedDevisForView(null);
            setEditingDevisId(id);
          }}
          onDelete={(devis) => {
            setSelectedDevisForView(null);
            setDevisToDelete(devis);
          }}
          onStatusChange={handleStatusChange}
          onConvertToInvoice={(devisItem) => {
            setSelectedDevisForView(null);
            setDevisToInvoice(devisItem);
          }}
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
