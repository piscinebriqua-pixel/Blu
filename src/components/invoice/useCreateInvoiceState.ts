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
  id?: string;
  originType: 'intervention' | 'devis' | 'manual';
  originId?: string;
  description: string;
  quantity: number;
  unit?: string;
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
  onSuccess?: () => void,
  initialDevisId?: string
) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Gestion du client
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Numérotation
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Sources non facturées disponibles pour ce client
  const [unbilledInterventions, setUnbilledInterventions] = useState<UnbilledIntervention[]>([]);
  const [unbilledDevis, setUnbilledDevis] = useState<UnbilledDevis[]>([]);
  const [allUnbilledDevis, setAllUnbilledDevis] = useState<UnbilledDevis[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // Table des articles de la facture (libre et sans limite)
  const [items, setItems] = useState<InvoiceDraftItem[]>([]);

  // IDs liés pour verrouillage anti-doublon
  const [linkedDevisIds, setLinkedDevisIds] = useState<string[]>([]);
  const [linkedInterventionIds, setLinkedInterventionIds] = useState<string[]>([]);

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

  const [loadingClients, setLoadingClients] = useState(false);

  // Initialisation au montage
  useEffect(() => {
    init();
  }, [initialClientId, initialDevisId]);

  const init = async () => {
    try {
      setLoading(true);
      setLoadingSources(true);

      // Exécutions concurrentes indépendantes : aucune tâche ne bloque les autres
      const [, , devisRes, interRes] = await Promise.allSettled([
        (async () => {
          try {
            const nextNum = await invoiceService.getNextInvoiceNumber();
            setInvoiceNumber(nextNum);
          } catch (e) {
            console.error('Erreur génération numéro facture:', e);
            const yr = new Date().getFullYear();
            setInvoiceNumber(`FAC-${yr}-0001`);
          }
        })(),
        fetchClients(),
        invoiceService.fetchUnbilledDevis(), // Charge TOUS les devis disponibles
        initialClientId ? invoiceService.fetchUnbilledInterventions(initialClientId) : Promise.resolve([]),
      ]);

      if (devisRes.status === 'fulfilled') {
        const allDevis = devisRes.value || [];
        setAllUnbilledDevis(allDevis);
        if (initialClientId) {
          setUnbilledDevis(allDevis.filter((d) => d.client_id === initialClientId));
        } else {
          setUnbilledDevis(allDevis);
        }
      }

      if (interRes.status === 'fulfilled') {
        setUnbilledInterventions((interRes.value as UnbilledIntervention[]) || []);
      }

      if (initialDevisId) {
        await autoImportInitialDevis(initialDevisId);
      }
    } finally {
      setLoadingSources(false);
      setLoading(false);
    }
  };

  /**
   * Chargement infaillible de la liste des clients
   */
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, phone')
        .order('last_name', { ascending: true });

      if (error) {
        console.warn('Erreur chargement clients avec tri, tentative fallback:', error);
        const fallback = await supabase
          .from('clients')
          .select('id, first_name, last_name, phone');
        if (fallback.data) {
          const sorted = [...fallback.data].sort((a, b) => 
            (a.last_name || a.first_name || '').localeCompare(b.last_name || b.first_name || '')
          );
          setAvailableClients(sorted);
          return;
        }
        toast.error('Impossible de charger la liste des clients');
      } else if (data) {
        setAvailableClients(data);
      }
    } catch (err) {
      console.error('Exception chargement clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  /**
   * Charge les interventions et devis disponibles pour le client sélectionné
   */
  const loadUnbilledSources = async (targetClientId?: string) => {
    try {
      setLoadingSources(true);
      const [interventions, devisList] = await Promise.all([
        targetClientId ? invoiceService.fetchUnbilledInterventions(targetClientId) : Promise.resolve([]),
        invoiceService.fetchUnbilledDevis(),
      ]);
      setAllUnbilledDevis(devisList);
      if (targetClientId) {
        setUnbilledInterventions(interventions);
        setUnbilledDevis(devisList.filter((d) => d.client_id === targetClientId));
      } else {
        setUnbilledInterventions([]);
        setUnbilledDevis(devisList);
      }
    } catch (err) {
      console.error('Erreur loadUnbilledSources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  /**
   * Import automatique si ouvert depuis le bouton "Facturer" d'un devis
   */
  const autoImportInitialDevis = async (devisId: string) => {
    try {
      const devisItems = await invoiceService.fetchDevisItems(devisId);
      if (devisItems && devisItems.length > 0) {
        const lines: InvoiceDraftItem[] = devisItems
          .filter((it: any) => !it.is_header)
          .map((it: any) => ({
            originType: 'devis',
            originId: devisId,
            description: it.designation,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'u',
            unitPrice: Number(it.unit_price) || 0,
            totalPrice: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
          }));
        if (lines.length > 0) {
          setItems(lines);
        }
      }
      setLinkedDevisIds((prev) => (prev.includes(devisId) ? prev : [...prev, devisId]));
    } catch (err) {
      console.error('Erreur autoImportInitialDevis:', err);
    }
  };

  /**
   * Changement du client dans le menu déroulant
   */
  const handleClientChange = async (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId) {
      // Filtrage instantané des devis déjà en mémoire
      const clientDevis = allUnbilledDevis.filter((d) => d.client_id === clientId);
      setUnbilledDevis(clientDevis);

      // Chargement en arrière-plan des interventions non facturées de ce client
      try {
        setLoadingSources(true);
        const interventions = await invoiceService.fetchUnbilledInterventions(clientId);
        setUnbilledInterventions(interventions);
      } catch (err) {
        console.error('Erreur chargement interventions client:', err);
      } finally {
        setLoadingSources(false);
      }
    } else {
      setUnbilledInterventions([]);
      setUnbilledDevis(allUnbilledDevis);
    }
  };

  // --- GESTION DES ARTICLES LIBRES & SANS LIMITE ---

  const addItem = (partial?: Partial<InvoiceDraftItem>) => {
    setItems((prev) => [
      ...prev,
      {
        originType: 'manual',
        description: '',
        quantity: 1,
        unit: 'u',
        unitPrice: 0,
        totalPrice: 0,
        ...partial,
      },
    ]);
  };

  const updateItem = (index: number, field: keyof InvoiceDraftItem, value: any) => {
    setItems((prev) => {
      const clone = [...prev];
      const target = { ...clone[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = Number(target.quantity) || 0;
        const p = Number(target.unitPrice) || 0;
        target.totalPrice = q * p;
      }
      clone[index] = target;
      return clone;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  /**
   * Importation de l'intégralité des articles d'un devis
   */
  const importDevis = async (devis: UnbilledDevis) => {
    try {
      const devisItems = await invoiceService.fetchDevisItems(devis.id);
      const validItems = (devisItems || []).filter((it: any) => !it.is_header);

      if (validItems.length > 0) {
        const lines: InvoiceDraftItem[] = validItems.map((it: any) => ({
          originType: 'devis',
          originId: devis.id,
          description: it.designation,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'u',
          unitPrice: Number(it.unit_price) || 0,
          totalPrice: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
        }));
        setItems((prev) => [...prev, ...lines]);
      } else {
        // Fallback si le devis n'a pas de lignes d'articles détaillées
        setItems((prev) => [
          ...prev,
          {
            originType: 'devis',
            originId: devis.id,
            description: `Devis n° ${devis.number} : ${devis.title}`,
            quantity: 1,
            unit: 'forfait',
            unitPrice: Number(devis.total_amount) || 0,
            totalPrice: Number(devis.total_amount) || 0,
          },
        ]);
      }

      setLinkedDevisIds((prev) => (prev.includes(devis.id) ? prev : [...prev, devis.id]));

      // Si le devis a un client_id et qu'il n'est pas encore le client sélectionné, l'associer
      if (devis.client_id && selectedClientId !== devis.client_id) {
        setSelectedClientId(devis.client_id);
        const clientDevis = allUnbilledDevis.filter((d) => d.client_id === devis.client_id);
        setUnbilledDevis(clientDevis);

        invoiceService.fetchUnbilledInterventions(devis.client_id).then((inters) => {
          setUnbilledInterventions(inters);
        });
      }

      toast.success(`Articles du devis ${devis.number} importés`);
    } catch (err) {
      console.error('Erreur importDevis:', err);
      toast.error('Impossible d’importer les articles de ce devis');
    }
  };

  /**
   * Importation de passages d'entretien terminés
   */
  const importInterventions = (selectedList: UnbilledIntervention[]) => {
    const lines: InvoiceDraftItem[] = selectedList.map((inter) => {
      const dateStr = inter.completed_date
        ? new Date(inter.completed_date).toLocaleDateString('fr-FR')
        : new Date(inter.scheduled_date).toLocaleDateString('fr-FR');
      return {
        originType: 'intervention',
        originId: inter.id,
        description: `Passage d'entretien (${inter.pool_name}) - ${dateStr} : ${inter.details || 'Prestation régulière'}`,
        quantity: 1,
        unit: 'passage',
        unitPrice: Number(inter.total_amount) || 0,
        totalPrice: Number(inter.total_amount) || 0,
      };
    });

    setItems((prev) => [...prev, ...lines]);
    setLinkedInterventionIds((prev) => [...prev, ...selectedList.map((i) => i.id)]);
    toast.success(`${selectedList.length} passage(s) importé(s)`);
  };

  /**
   * Ajout direct d'une prestation ou d'un produit du catalogue
   */
  const addCatalogueItem = (name: string, price: number, unit?: string) => {
    addItem({
      description: name,
      quantity: 1,
      unit: unit || 'u',
      unitPrice: price,
      totalPrice: price,
      originType: 'manual',
    });
    toast.success(`"${name}" ajouté à la facture`);
  };

  // --- TOTAUX CALCULÉS EN TEMPS RÉEL ---

  const subtotalHt = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotalHt * (taxRate || 0)) / 100;
  }, [subtotalHt, taxRate]);

  const totalTtc = useMemo(() => {
    return subtotalHt + taxAmount;
  }, [subtotalHt, taxAmount]);

  // --- ENREGISTREMENT ---

  const handleSubmit = async () => {
    const finalClientId = initialClientId || selectedClientId;
    if (!finalClientId) {
      toast.error('Veuillez sélectionner un client pour cette facture');
      return;
    }

    if (items.length === 0) {
      toast.error('La facture doit contenir au moins un article ou une prestation');
      return;
    }

    try {
      setSaving(true);

      // Déduction du type principal de la facture
      const hasDevis = items.some((i) => i.originType === 'devis');
      const hasInter = items.some((i) => i.originType === 'intervention');
      let type: 'interventions' | 'devis' | 'mixed' | 'manual' = 'manual';
      if (hasDevis && hasInter) type = 'mixed';
      else if (hasDevis) type = 'devis';
      else if (hasInter) type = 'interventions';

      const payload: CreateInvoicePayload = {
        clientId: finalClientId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceDate,
        dueDate,
        type,
        items,
        taxRate,
        notes: notes.trim() || undefined,
        paymentTerms,
        linkedInterventionIds: linkedInterventionIds.length > 0 ? linkedInterventionIds : undefined,
        linkedDevisIds: linkedDevisIds.length > 0 ? linkedDevisIds : undefined,
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
    loadingClients,
    fetchClients,
    clientSearchTerm,
    setClientSearchTerm,
    invoiceNumber,
    setInvoiceNumber,
    unbilledInterventions,
    unbilledDevis,
    allUnbilledDevis,
    loadingSources,
    loadUnbilledSources,
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
    items,
    addItem,
    updateItem,
    removeItem,
    importDevis,
    importInterventions,
    addCatalogueItem,
    subtotalHt,
    taxAmount,
    totalTtc,
    handleSubmit,
  };
}
