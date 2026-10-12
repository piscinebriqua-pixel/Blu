import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement Supabase sont manquantes.');
}

// Untyped generic client allows smooth operation with existing legacy untyped queries,
// while exporting Database and Table Row types for progressive strict typing.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { Database };

// --- Exported Table Row Aliases for Type-Safe Usage in Components and Hooks ---
export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type PoolRow = Database['public']['Tables']['pools']['Row'];
export type PoolInsert = Database['public']['Tables']['pools']['Insert'];
export type PoolUpdate = Database['public']['Tables']['pools']['Update'];

export type TechnicianRow = Database['public']['Tables']['technicians']['Row'];
export type TechnicianInsert = Database['public']['Tables']['technicians']['Insert'];
export type TechnicianUpdate = Database['public']['Tables']['technicians']['Update'];

export type InterventionRow = Database['public']['Tables']['interventions']['Row'];
export type InterventionInsert = Database['public']['Tables']['interventions']['Insert'];
export type InterventionUpdate = Database['public']['Tables']['interventions']['Update'];

export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export type ProductRow = Database['public']['Tables']['inventory_products']['Row'];
export type ProductInsert = Database['public']['Tables']['inventory_products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['inventory_products']['Update'];

export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type PartnerRow = Database['public']['Tables']['partners']['Row'];
export type PartnerInsert = Database['public']['Tables']['partners']['Insert'];
export type PartnerUpdate = Database['public']['Tables']['partners']['Update'];
