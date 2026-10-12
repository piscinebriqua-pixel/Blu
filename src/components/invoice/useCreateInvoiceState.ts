import { useState, useEffect, useMemo } from 'react';
import { 
  invoiceService, 
  type UnbilledIntervention, 
  type UnbilledDevis,
  type CreateInvoicePayload 
} from '../../services/invoiceService';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export interface InvoiceDraftItem {
  originType: 'intervention' | 'devis' | 'manual';
  originId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ClientOption {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

export function useCreateInvoiceState(
  initialClientId?: string,
  _initialClientName?: string,
  onSuccess?: () => void
) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Gestion du client
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Numérotation
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Type et éléments
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

  // Lignes manuelles d'ajustement
  const [customItems, setCustomItems] = useState<InvoiceDraftItem[]>([]);

  // Chargement initial du prochain numéro de facture et des clients si besoin
  useEffect(() => {
    initModal();
  }, [initialClientId]);

  const initModal = async () => {
    try {
      setLoading(true);
      // Récupérer le prochain numéro suggéré
      const nextNum = await invoiceService.getNextInvoiceNumber();
      setInvoiceNumber(nextNum);

      // Si pas de clientId initial, charger la liste des clients
      if (!initialClientId) {
        const { data: clientsData, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, phone')
          .order('first_name');

        if (!error && clientsData) {
          setAvailableClients(clientsData);
        }
      } else {
        await loadUnbilledSources(initialClientId);
      }
    } finally {
      setLoading(false);
    }
  };

  // Recharger dès que le client sélectionné change
  const handleClientChange = async (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedInterventionIds([]);
    setSelectedDevisId(null);
    if (clientId) {
      setLoading(true);
      await loadUnbilledSources(clientId);
      setLoading(false);
    } else {
      setUnbilledInterventions([]);
      setUnbilledDevis([]);
    }
  };

  const loadUnbilledSources = async (targetClientId: string) => {
    try {
      const [interventions, devisList] = await Promise.all([
        invoiceService.fetchUnbilledInterventions(targetClientId),
        invoiceService.fetchUnbilledDevis(targetClientId),
      ]);
      setUnbilledInterventions(interventions);
      setUnbilledDevis(devisList);

      // Par défaut, si des interventions sont disponibles, on coche tout
      if (interventions.length > 0) {
        setInvoiceType('interventions');
        setSelectedInterventionIds(interventions.map((i) => i.id));
      } else if (devisList.length > 0) {
        setInvoiceType('devis');
        setSelectedDevisId(devisList[0].id);
      } else {
        setInvoiceType('manual');
      }
    } catch (err) {
      console.error('Erreur loadUnbilledSources:', err);
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
    const finalClientId = initialClientId || selectedClientId;
    if (!finalClientId) {
      toast.error('Veuillez sélectionner un client pour cette facture');
      return;
    }

    if (invoiceItems.length === 0) {
      toast.error('La facture doit contenir au moins une prestation');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateInvoicePayload = {
        clientId: finalClientId,
        invoiceNumber: invoiceNumber.trim() || undefined,
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
        onSuccess?.();
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    selectedClientId,
    handleClientChange,
    availableClients,
    clientSearchTerm,
    setClientSearchTerm,
    invoiceNumber,
    setInvoiceNumber,
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
