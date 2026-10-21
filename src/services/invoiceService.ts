import { supabase, type InvoiceRow, type InvoiceItemRow } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { referenceCache } from '../lib/referenceCache';

export interface UnbilledIntervention {
  id: string;
  scheduled_date: string;
  completed_date: string | null;
  status: string;
  total_amount: number;
  pool_id: string;
  pool_name: string;
  details: string;
}

export interface UnbilledDevis {
  id: string;
  number: string;
  title: string;
  total_amount: number;
  status: string;
  created_at: string;
  client_id?: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
  } | null;
}

export interface InvoiceWithItems extends InvoiceRow {
  items?: InvoiceItemRow[];
  client?: {
    first_name: string;
    last_name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    matricule_fiscal?: string | null;
  };
}

export interface InvoiceSettings {
  prefix: string;
  next_number: number;
}

export interface CreateInvoicePayload {
  clientId: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  type: 'interventions' | 'devis' | 'mixed' | 'manual';
  items: Array<{
    originType: 'intervention' | 'devis' | 'manual';
    originId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  taxRate?: number;
  notes?: string;
  paymentTerms?: string;
  linkedInterventionIds?: string[];
  linkedDevisIds?: string[];
}

export const invoiceService = {
  /**
   * Récupère tous les passages terminés d'un client qui ne sont PAS encore facturés (invoice_id IS NULL).
   */
  async fetchUnbilledInterventions(clientId: string): Promise<UnbilledIntervention[]> {
    try {
      const { data: pools, error: poolsError } = await supabase
        .from('pools')
        .select('id, name')
        .eq('client_id', clientId);

      if (poolsError) throw poolsError;
      const poolIds = pools?.map((p) => p.id) || [];
      if (poolIds.length === 0) return [];

      const { data, error } = await supabase
        .from('interventions')
        .select(`
          id,
          scheduled_date,
          completed_date,
          status,
          pool_id,
          pool:pools(name),
          services:intervention_services(
            price_at_time,
            service:services(name)
          ),
          products:intervention_products(
            quantity,
            total_price,
            product:inventory_products(name, unit)
          )
        `)
        .in('pool_id', poolIds)
        .is('invoice_id', null)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((inter: any) => {
        const poolName = inter.pool?.name || 'Bassin';
        const serviceNames = (inter.services || []).map((s: any) => s.service?.name).filter(Boolean);
        const productNames = (inter.products || []).map((p: any) => `${p.product?.name} (${p.quantity})`).filter(Boolean);
        const summary = [...serviceNames, ...productNames].join(', ') || 'Entretien piscine';

        const calcServices = (inter.services || []).reduce((acc: number, s: any) => acc + (s.price_at_time || 0), 0);
        const calcProducts = (inter.products || []).reduce((acc: number, p: any) => acc + (p.total_price || 0), 0);
        const calculatedTotal = (calcServices + calcProducts) > 0 ? (calcServices + calcProducts) : 0;

        return {
          id: inter.id,
          scheduled_date: inter.scheduled_date,
          completed_date: inter.completed_date,
          status: inter.status,
          total_amount: calculatedTotal,
          pool_id: inter.pool_id,
          pool_name: poolName,
          details: summary,
        };
      });
    } catch (err: any) {
      console.warn('Erreur fetchUnbilledInterventions:', err?.message || err);
      return [];
    }
  },

  /**
   * Récupère les devis non encore facturés (tolérant si invoice_id n'existe pas en base).
   * Si clientId est fourni, filtre par client ; sinon récupère tous les devis disponibles avec infos client.
   */
  async fetchUnbilledDevis(clientId?: string): Promise<UnbilledDevis[]> {
    try {
      let query = supabase
        .from('devis')
        .select(`
          id,
          number,
          title,
          total_amount,
          status,
          created_at,
          client_id,
          client:clients(id, first_name, last_name, phone)
        `)
        .neq('status', 'cancelled')
        .or('is_template.is.null,is_template.eq.false')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      // Tentative avec filtre invoice_id is null
      const { data, error } = await query.is('invoice_id', null);

      if (error) {
        // Fallback sans filtre invoice_id si la colonne n'existe pas encore en base
        console.warn('Fallback fetchUnbilledDevis sans invoice_id:', error.message);
        let fallbackQuery = supabase
          .from('devis')
          .select(`
            id,
            number,
            title,
            total_amount,
            status,
            created_at,
            client_id,
            client:clients(id, first_name, last_name, phone)
          `)
          .neq('status', 'cancelled')
          .or('is_template.is.null,is_template.eq.false')
          .order('created_at', { ascending: false });

        if (clientId) {
          fallbackQuery = fallbackQuery.eq('client_id', clientId);
        }

        const { data: fallbackData, error: fallbackErr } = await fallbackQuery;
        if (fallbackErr) throw fallbackErr;

        return (fallbackData || []).map((d: any) => ({
          id: d.id,
          number: d.number,
          title: d.title,
          total_amount: Number(d.total_amount) || 0,
          status: d.status,
          created_at: d.created_at,
          client_id: d.client_id,
          client: Array.isArray(d.client) ? d.client[0] || null : d.client,
        }));
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        number: d.number,
        title: d.title,
        total_amount: Number(d.total_amount) || 0,
        status: d.status,
        created_at: d.created_at,
        client_id: d.client_id,
        client: Array.isArray(d.client) ? d.client[0] || null : d.client,
      }));
    } catch (err: any) {
      console.error('Erreur fetchUnbilledDevis:', err);
      return [];
    }
  },

  /**
   * Récupère les articles détaillés d'un devis pour les importer dans une facture.
   */
  async fetchDevisItems(devisId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('devis_items')
        .select('*')
        .eq('devis_id', devisId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Erreur fetchDevisItems:', err);
      return [];
    }
  },

  /**
   * Récupère le catalogue des prestations et produits de l'entreprise.
   */
  async fetchCatalogue(): Promise<{ services: any[]; products: any[] }> {
    try {
      const [services, products] = await Promise.all([
        referenceCache.getServices(),
        referenceCache.getProducts(),
      ]);
      return {
        services: services || [],
        products: products || [],
      };
    } catch (err: any) {
      console.error('Erreur fetchCatalogue:', err);
      return { services: [], products: [] };
    }
  },

  /**
   * Récupère la liste de TOUTES les factures émises dans l'application avec les infos client.
   */
  async fetchAllInvoices(): Promise<InvoiceWithItems[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, first_name, last_name, phone, address, city, matricule_fiscal),
          items:invoice_items(*)
        `)
        .order('invoice_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as InvoiceWithItems[]) || [];
    } catch (err: any) {
      console.error('Erreur fetchAllInvoices:', err);
      toast.error('Impossible de charger les factures');
      return [];
    }
  },

  /**
   * Récupère les paramètres de numérotation des factures.
   */
  async getInvoiceSettings(): Promise<InvoiceSettings> {
    const currentYear = new Date().getFullYear();
    const defaultPrefix = `FAC-${currentYear}-`;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'invoice_settings')
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        return {
          prefix: data.value.prefix || defaultPrefix,
          next_number: Number(data.value.next_number) || 1,
        };
      }
      return { prefix: defaultPrefix, next_number: 1 };
    } catch (e) {
      console.warn('Lecture invoice_settings échouée, valeurs par défaut:', e);
      return { prefix: defaultPrefix, next_number: 1 };
    }
  },

  /**
   * Met à jour les paramètres de numérotation des factures.
   */
  async updateInvoiceSettings(settings: InvoiceSettings): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'invoice_settings',
            value: settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
      toast.success('Compteur de facturation mis à jour');
      return true;
    } catch (err: any) {
      console.error('Erreur updateInvoiceSettings:', err);
      toast.error('Erreur lors de la sauvegarde du compteur');
      return false;
    }
  },

  /**
   * Calcule le prochain numéro de facture suggéré.
   */
  async getNextInvoiceNumber(): Promise<string> {
    try {
      const settings = await this.getInvoiceSettings();
      // On recherche les factures les plus récentes pour incrémenter correctement
      const { data: latestInvoices } = await supabase
        .from('invoices')
        .select('number')
        .order('created_at', { ascending: false })
        .limit(20);

      let maxNum = settings.next_number;
      if (latestInvoices && latestInvoices.length > 0) {
        for (const inv of latestInvoices) {
          if (inv.number && inv.number.startsWith(settings.prefix)) {
            const numPart = inv.number.slice(settings.prefix.length);
            const parsed = parseInt(numPart, 10);
            if (!isNaN(parsed) && parsed >= maxNum) {
              maxNum = parsed + 1;
            }
          }
        }
      }

      const padded = String(maxNum).padStart(4, '0');
      return `${settings.prefix}${padded}`;
    } catch (e) {
      const currentYear = new Date().getFullYear();
      return `FAC-${currentYear}-0001`;
    }
  },

  /**
   * Récupère la liste des factures d'un client donné.
   */
  async fetchInvoicesByClient(clientId: string): Promise<InvoiceWithItems[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*),
          items:invoice_items(*)
        `)
        .eq('client_id', clientId)
        .order('invoice_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as InvoiceWithItems[]) || [];
    } catch (err: any) {
      console.error('Erreur fetchInvoicesByClient:', err);
      toast.error('Impossible de charger les factures du client');
      return [];
    }
  },

  /**
   * Crée une facture, insère ses lignes, et verrouille les interventions/devis associés.
   */
  async createInvoice(payload: CreateInvoicePayload): Promise<InvoiceRow | null> {
    try {
      const subtotalHt = payload.items.reduce((acc, item) => acc + item.totalPrice, 0);
      const taxRate = payload.taxRate || 0;
      const taxAmount = (subtotalHt * taxRate) / 100;
      const totalTtc = subtotalHt + taxAmount;

      // 1. Insertion dans invoices
      const invoiceInsertData: any = {
        client_id: payload.clientId,
        invoice_date: payload.invoiceDate || new Date().toISOString().split('T')[0],
        due_date: payload.dueDate || null,
        status: 'issued',
        type: payload.type,
        subtotal_ht: subtotalHt,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_ttc: totalTtc,
        paid_amount: 0,
        notes: payload.notes || null,
        payment_terms: payload.paymentTerms || 'Paiement à réception',
      };

      // Si un numéro personnalisé est fourni
      if (payload.invoiceNumber && payload.invoiceNumber.trim()) {
        invoiceInsertData.number = payload.invoiceNumber.trim();
      }

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceInsertData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      if (!newInvoice) throw new Error('Échec de la création de facture');

      const invoiceId = newInvoice.id;

      // 2. Insertion des lignes d'articles
      if (payload.items.length > 0) {
        const itemsToInsert = payload.items.map((it, idx) => ({
          invoice_id: invoiceId,
          origin_type: it.originType,
          origin_id: it.originId || null,
          position: idx,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          total_price: it.totalPrice,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Erreur items facture, tentative de rollback:', itemsError);
          await supabase.from('invoices').delete().eq('id', invoiceId);
          throw itemsError;
        }
      }

      // 3. Verrouillage Anti-Doublon des Interventions
      if (payload.linkedInterventionIds && payload.linkedInterventionIds.length > 0) {
        const { error: lockInterError } = await supabase
          .from('interventions')
          .update({ invoice_id: invoiceId })
          .in('id', payload.linkedInterventionIds);

        if (lockInterError) {
          console.error('Erreur verrouillage interventions:', lockInterError);
        }
      }

      // 4. Verrouillage Anti-Doublon des Devis
      if (payload.linkedDevisIds && payload.linkedDevisIds.length > 0) {
        const { error: lockDevisError } = await supabase
          .from('devis')
          .update({ invoice_id: invoiceId })
          .in('id', payload.linkedDevisIds);

        if (lockDevisError) {
          console.error('Erreur verrouillage devis:', lockDevisError);
        }
      }

      toast.success(`Facture ${newInvoice.number} créée avec succès`);
      return newInvoice as InvoiceRow;
    } catch (err: any) {
      console.error('Erreur createInvoice:', err);
      toast.error(err.message || 'Erreur lors de la création de la facture');
      return null;
    }
  },

  /**
   * Supprime une facture et déverrouille automatiquement toutes ses sources.
   */
  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      // 1. Déverrouillage des interventions associées
      await supabase
        .from('interventions')
        .update({ invoice_id: null })
        .eq('invoice_id', invoiceId);

      // 2. Déverrouillage des devis associés
      await supabase
        .from('devis')
        .update({ invoice_id: null })
        .eq('invoice_id', invoiceId);

      // 3. Suppression de la facture (cascade sur invoice_items)
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast.success('Facture supprimée. Les prestations ont été libérées.');
      return true;
    } catch (err: any) {
      console.error('Erreur deleteInvoice:', err);
      toast.error('Impossible de supprimer la facture');
      return false;
    }
  },

  /**
   * Met à jour le statut de règlement d'une facture.
   */
  async updateInvoiceStatus(invoiceId: string, status: InvoiceRow['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId);

      if (error) throw error;
      toast.success('Statut de facture mis à jour');
      return true;
    } catch (err: any) {
      console.error('Erreur updateInvoiceStatus:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  },
};
