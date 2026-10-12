import { useState, useEffect, useMemo } from 'react';
import { 
  invoiceService, 
  type UnbilledIntervention, 
  type UnbilledDevis,
  type CreateInvoicePayload 
} from '../../services/invoiceService';
import { toast } from 'react-hot-toast';

export interface InvoiceDraftItem {
  originType: 'intervention' | 'devis' | 'manual';
  originId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function useCreateInvoiceState(clientId: string, clientName: string, onSuccess: () => void) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [invoiceType, setInvoiceType] = useState<'interventions' | 'devis' | 'manual'>('interventions');
  const [unbilledInterventions, setUnbilledInterventions] = useState<UnbilledIntervention[]>([]);
  const [unbilledDevis, setUnbilledDevis] = useState<UnbilledDevis[]>([]);

  // Sélections utilisateur
  const [selectedInterventionIds, setSelectedInterventionIds] = useState<string[]>([]);
  const [selectedDevisId, setSelectedDevisId] = useState<string | null>(null);

  // Configuration de la facture
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Paiement à réception');

  // Lignes personnalisées manuelles supplémentaires
  const [customItems, setCustomItems] = useState<InvoiceDraftItem[]>([]);

  // Chargement initial des éléments non facturés
  useEffect(() => {
    loadUnbilledSources();
  }, [clientId]);

  const loadUnbilledSources = async () => {
    try {
      setLoading(true);
      const [interventions, devisList] = await Promise.all([
        invoiceService.fetchUnbilledInterventions(clientId),
        invoiceService.fetchUnbilledDevis(clientId),
      ]);
      setUnbilledInterventions(interventions);
      setUnbilledDevis(devisList);

      // Par défaut, si des interventions sont disponibles, on coche toutes les interventions non facturées
      if (interventions.length > 0) {
        setSelectedInterventionIds(interventions.map((i) => i.id));
      } else if (devisList.length > 0) {
        setInvoiceType('devis');
        setSelectedDevisId(devisList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  // Bascule de sélection d'une intervention
  const toggleIntervention = (id: string) => {
    setSelectedInterventionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Sélectionner ou désélectionner tout
  const toggleSelectAllInterventions = () => {
    if (selectedInterventionIds.length === unbilledInterventions.length) {
      setSelectedInterventionIds([]);
    } else {
      setSelectedInterventionIds(unbilledInterventions.map((i) => i.id));
    }
  };

  // Construction automatique des lignes selon le mode choisi
  const invoiceItems = useMemo<InvoiceDraftItem[]>(() => {
    if (invoiceType === 'interventions') {
      const selected = unbilledInterventions.filter((i) => selectedInterventionIds.includes(i.id));
      const generated = selected.map((inter) => {
        const dateStr = inter.completed_date
          ? new Date(inter.completed_date).toLocaleDateString('fr-FR')
          : new Date(inter.scheduled_date).toLocaleDateString('fr-FR');
        return {
          originType: 'intervention' as const,
          originId: inter.id,
          description: `Passage d'entretien (${inter.pool_name}) - ${dateStr} : ${inter.details}`,
          quantity: 1,
          unitPrice: inter.total_amount,
          totalPrice: inter.total_amount,
        };
      });
      return [...generated, ...customItems];
    }

    if (invoiceType === 'devis') {
      const selected = unbilledDevis.find((d) => d.id === selectedDevisId);
      if (!selected) return [...customItems];
      const devisItem: InvoiceDraftItem = {
        originType: 'devis',
        originId: selected.id,
        description: `Facturation selon Devis n° ${selected.number} : ${selected.title}`,
        quantity: 1,
        unitPrice: selected.total_amount,
        totalPrice: selected.total_amount,
      };
      return [devisItem, ...customItems];
    }

    return customItems;
  }, [invoiceType, unbilledInterventions, selectedInterventionIds, unbilledDevis, selectedDevisId, customItems]);

  // Totaux calculés en direct
  const subtotalHt = useMemo(() => {
    return invoiceItems.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0);
  }, [invoiceItems]);

  const taxAmount = useMemo(() => {
    return (subtotalHt * (taxRate || 0)) / 100;
  }, [subtotalHt, taxRate]);

  const totalTtc = useMemo(() => {
    return subtotalHt + taxAmount;
  }, [subtotalHt, taxAmount]);

  // Ajouter une ligne personnalisée
  const addCustomItem = () => {
    setCustomItems((prev) => [
      ...prev,
      {
        originType: 'manual',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  // Mettre à jour une ligne personnalisée
  const updateCustomItem = (index: number, field: keyof InvoiceDraftItem, value: any) => {
    setCustomItems((prev) => {
      const clone = [...prev];
      const target = { ...clone[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        target.totalPrice = (Number(target.quantity) || 0) * (Number(target.unitPrice) || 0);
      }
      clone[index] = target;
      return clone;
    });
  };

  // Supprimer une ligne personnalisée
  const removeCustomItem = (index: number) => {
    setCustomItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Soumission
  const handleSubmit = async () => {
    if (invoiceItems.length === 0) {
      toast.error('La facture doit contenir au moins une prestation');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateInvoicePayload = {
        clientId,
        invoiceDate,
        dueDate,
        type: invoiceType,
        items: invoiceItems,
        taxRate,
        notes: notes.trim() || undefined,
        paymentTerms,
        linkedInterventionIds: invoiceType === 'interventions' ? selectedInterventionIds : undefined,
        linkedDevisIds: invoiceType === 'devis' && selectedDevisId ? [selectedDevisId] : undefined,
      };

      const result = await invoiceService.createInvoice(payload);
      if (result) {
        onSuccess();
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    invoiceType,
    setInvoiceType,
    unbilledInterventions,
    unbilledDevis,
    selectedInterventionIds,
    toggleIntervention,
    toggleSelectAllInterventions,
    selectedDevisId,
    setSelectedDevisId,
    invoiceDate,
    setInvoiceDate,
    dueDate,
    setDueDate,
    taxRate,
    setTaxRate,
    notes,
    setNotes,
    paymentTerms,
    setPaymentTerms,
    invoiceItems,
    customItems,
    addCustomItem,
    updateCustomItem,
    removeCustomItem,
    subtotalHt,
    taxAmount,
    totalTtc,
    handleSubmit,
  };
}
