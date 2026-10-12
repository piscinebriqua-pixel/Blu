import { supabase, type InvoiceRow, type InvoiceItemRow } from '../lib/supabase';
import { toast } from 'react-hot-toast';

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
}

export interface InvoiceWithItems extends InvoiceRow {
  items?: InvoiceItemRow[];
  client?: {
    first_name: string;
    last_name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
  };
}

export interface CreateInvoicePayload {
  clientId: string;
  invoiceDate?: string;
  dueDate?: string;
  type: 'interventions' | 'devis' | 'manual';
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
          total_amount,
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
        const calculatedTotal = (calcServices + calcProducts) > 0 ? (calcServices + calcProducts) : (inter.total_amount || 0);

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
      console.error('Erreur fetchUnbilledInterventions:', err);
      toast.error('Impossible de charger les passages non facturés');
      return [];
    }
  },

  /**
   * Récupère les devis du client non encore facturés (invoice_id IS NULL).
   */
  async fetchUnbilledDevis(clientId: string): Promise<UnbilledDevis[]> {
    try {
      const { data, error } = await supabase
        .from('devis')
        .select('id, number, title, total_amount, status, created_at')
        .eq('client_id', clientId)
        .is('invoice_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        number: d.number,
        title: d.title,
        total_amount: d.total_amount || 0,
        status: d.status,
        created_at: d.created_at,
      }));
    } catch (err: any) {
      console.error('Erreur fetchUnbilledDevis:', err);
      toast.error('Impossible de charger les devis non facturés');
      return [];
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
