import { supabase } from './supabase';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes de validité mémoire

class ReferenceCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Récupère une valeur depuis le cache ou exécute le fetcher si absente/expirée.
   */
  async get<T>(key: string, fetcher: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
    const entry = this.cache.get(key);
    const now = Date.now();
    if (entry && now - entry.timestamp < ttlMs) {
      return entry.data as T;
    }

    try {
      const fresh = await fetcher();
      this.cache.set(key, { data: fresh, timestamp: now });
      return fresh;
    } catch (error) {
      // Si une erreur survient et qu'une version expirée existe, on la retourne en secours
      if (entry) {
        return entry.data as T;
      }
      throw error;
    }
  }

  /**
   * Invalide une clé spécifique ou vide tout le cache.
   */
  invalidate(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // --- Méthodes Référentielles Dédiées ---

  /**
   * Liste des techniciens actifs (Planning, Formulaires, Filtres)
   */
  async getTechnicians(): Promise<any[]> {
    return this.get('technicians', async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('id, full_name, email, phone, active')
        .eq('active', true)
        .order('full_name');
      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Catalogue des prestations / services
   */
  async getServices(): Promise<any[]> {
    return this.get('services', async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Catalogue des produits d'inventaire
   */
  async getProducts(): Promise<any[]> {
    return this.get('inventory_products', async () => {
      const { data, error } = await supabase
        .from('inventory_products')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Liste allégée des clients (Sélecteurs, Autocomplétion)
   */
  async getClientsLight(): Promise<any[]> {
    return this.get(
      'clients_light',
      async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, city, phone, balance')
          .order('last_name');
        if (error) throw error;
        return data || [];
      },
      2 * 60 * 1000 // 2 minutes pour refléter rapidement les créations de clients
    );
  }
}

export const referenceCache = new ReferenceCache();
