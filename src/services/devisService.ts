import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface DevisClient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  matricule_fiscal?: string | null;
}

export interface DevisItem {
  id?: string;
  devis_id?: string;
  designation: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  is_header?: boolean;
  position?: number;
}

export interface DevisRecord {
  id: string;
  number: string;
  title: string;
  total_amount: number;
  status: 'pending' | 'closed' | 'cancelled';
  created_at: string;
  client_id?: string | null;
  invoice_id?: string | null;
  is_template?: boolean;
  notes?: string | null;
  payment_terms?: string | null;
  pool_details?: string | null;
  pdf_url?: string | null;
  client?: DevisClient | null;
}

export interface DevisStats {
  totalCount: number;
  pendingCount: number;
  pendingTotalAmount: number;
  closedCount: number;
  closedTotalAmount: number;
  cancelledCount: number;
}

class DevisService {
  /**
   * Récupère la liste de tous les devis commerciaux (hors templates),
   * triés par date décroissante avec les détails du client lié.
   */
  async fetchAllDevis(): Promise<DevisRecord[]> {
    try {
      const { data, error } = await supabase
        .from('devis')
        .select(`
          id,
          number,
          title,
          total_amount,
          status,
          created_at,
          client_id,
          invoice_id,
          is_template,
          notes,
          payment_terms,
          pool_details,
          pdf_url,
          client:clients (id, first_name, last_name, phone, email, address, city, matricule_fiscal)
        `)
        .or('is_template.is.null,is_template.eq.false')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur fetchAllDevis:', error);
        toast.error('Impossible de charger les devis');
        return [];
      }

      // Supabase peut retourner client comme tableau ou objet selon le lien
      return (data || []).map((row: any) => ({
        ...row,
        client: Array.isArray(row.client) ? row.client[0] || null : row.client,
        status: (row.status || 'pending') as 'pending' | 'closed' | 'cancelled',
      }));
    } catch (err) {
      console.error('Erreur inattendue fetchAllDevis:', err);
      toast.error('Erreur réseau lors du chargement des devis');
      return [];
    }
  }

  /**
   * Récupère les articles liés à un devis spécifique, triés par position.
   */
  async fetchDevisItems(devisId: string): Promise<DevisItem[]> {
    try {
      const { data, error } = await supabase
        .from('devis_items')
        .select('*')
        .eq('devis_id', devisId)
        .order('position', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.error('Erreur fetchDevisItems:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Erreur inattendue fetchDevisItems:', err);
      return [];
    }
  }

  /**
   * Met à jour le statut d'un devis (pending, closed, cancelled).
   */
  async updateStatus(devisId: string, status: 'pending' | 'closed' | 'cancelled'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('devis')
        .update({ status })
        .eq('id', devisId);

      if (error) {
        console.error('Erreur updateStatus:', error);
        toast.error('Échec de mise à jour du statut');
        return false;
      }

      toast.success(
        status === 'closed'
          ? 'Devis marqué comme Accepté / Clôturé'
          : status === 'cancelled'
          ? 'Devis marqué comme Refusé / Annulé'
          : 'Devis replacé en attente'
      );
      return true;
    } catch (err) {
      console.error('Erreur updateStatus:', err);
      toast.error('Erreur lors du changement de statut');
      return false;
    }
  }

  /**
   * Supprime un devis et ses lignes d'articles associées.
   */
  async deleteDevis(devisId: string, devisNumber?: string): Promise<boolean> {
    try {
      // 1. Suppression des articles
      const { error: itemsErr } = await supabase
        .from('devis_items')
        .delete()
        .eq('devis_id', devisId);

      if (itemsErr) {
        console.error('Erreur suppression devis_items:', itemsErr);
      }

      // 2. Suppression du devis
      const { error: devisErr } = await supabase
        .from('devis')
        .delete()
        .eq('id', devisId);

      if (devisErr) {
        console.error('Erreur suppression devis:', devisErr);
        toast.error('Impossible de supprimer le devis');
        return false;
      }

      toast.success(`Devis ${devisNumber || ''} supprimé avec succès`);
      return true;
    } catch (err) {
      console.error('Erreur inattendue deleteDevis:', err);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }

  /**
   * Duplique un devis existant avec ses articles et génère une nouvelle référence.
   */
  async duplicateDevis(original: DevisRecord): Promise<DevisRecord | null> {
    try {
      // Récupérer les articles du devis original
      const { data: items, error: itemsErr } = await supabase
        .from('devis_items')
        .select('*')
        .eq('devis_id', original.id);

      if (itemsErr) {
        console.warn('Avertissement lecture devis_items pour duplication:', itemsErr);
      }

      // Calcul du nouveau numéro unique infaillible
      const baseNumber = (original.number || 'DEV').replace(/-COPY(-\d+)?$/, '');
      const { data: existingCopies } = await supabase
        .from('devis')
        .select('number')
        .like('number', `${baseNumber}-COPY%`);

      let maxCopy = 0;
      let hasSimpleCopy = false;
      existingCopies?.forEach((c) => {
        if (c.number === `${baseNumber}-COPY`) {
          hasSimpleCopy = true;
        }
        const match = c.number?.match(/-COPY-(\d+)$/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > maxCopy) maxCopy = val;
        }
      });

      let newDevisNumber = !hasSimpleCopy ? `${baseNumber}-COPY` : `${baseNumber}-COPY-${Math.max(maxCopy + 1, 2)}`;
      let copySuffix = Math.max(maxCopy + 1, 2);
      let attempts = 0;
      while (attempts < 10) {
        const { data: exists } = await supabase
          .from('devis')
          .select('id')
          .eq('number', newDevisNumber)
          .maybeSingle();
        if (!exists) break;
        newDevisNumber = `${baseNumber}-COPY-${copySuffix++}`;
        attempts++;
      }

      // Insertion du nouveau devis
      const { data: newDevis, error: dError } = await supabase
        .from('devis')
        .insert({
          number: newDevisNumber,
          title: `${original.title} (Copie)`,
          total_amount: original.total_amount,
          client_id: original.client_id,
          status: 'pending',
          is_template: false,
          notes: original.notes,
          payment_terms: original.payment_terms,
          pool_details: original.pool_details,
        })
        .select(`
          *,
          client:clients (
            id,
            first_name,
            last_name,
            phone,
            email,
            address,
            city
          )
        `)
        .single();

      if (dError || !newDevis) {
        console.error('Erreur duplication devis:', dError);
        toast.error('Échec de la duplication du devis');
        return null;
      }

      // Duplication des articles
      if (items && items.length > 0) {
        const itemsToInsert = items.map((it: any) => ({
          devis_id: newDevis.id,
          designation: it.designation,
          quantity: it.quantity,
          unit_price: it.unit_price,
          unit: it.unit,
          is_header: it.is_header,
          position: it.position,
        }));

        const { error: insertItemsErr } = await supabase
          .from('devis_items')
          .insert(itemsToInsert);

        if (insertItemsErr) {
          console.error('Erreur duplication articles:', insertItemsErr);
        }
      }

      toast.success(`Devis dupliqué sous le numéro ${newDevis.number}`);
      return {
        ...newDevis,
        client: Array.isArray(newDevis.client) ? newDevis.client[0] || null : newDevis.client,
        status: (newDevis.status || 'pending') as 'pending' | 'closed' | 'cancelled',
      };
    } catch (err) {
      console.error('Erreur inattendue duplicateDevis:', err);
      toast.error('Erreur lors de la duplication du devis');
      return null;
    }
  }

  /**
   * Calcule les statistiques d'un ensemble de devis.
   */
  calculateStats(devisList: DevisRecord[]): DevisStats {
    let pendingCount = 0;
    let pendingTotalAmount = 0;
    let closedCount = 0;
    let closedTotalAmount = 0;
    let cancelledCount = 0;

    for (const d of devisList) {
      const amount = Number(d.total_amount) || 0;
      if (d.status === 'closed') {
        closedCount += 1;
        closedTotalAmount += amount;
      } else if (d.status === 'cancelled') {
        cancelledCount += 1;
      } else {
        pendingCount += 1;
        pendingTotalAmount += amount;
      }
    }

    return {
      totalCount: devisList.length,
      pendingCount,
      pendingTotalAmount,
      closedCount,
      closedTotalAmount,
      cancelledCount,
    };
  }
}

export const devisService = new DevisService();
