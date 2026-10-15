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

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// --- Types Facturation ---
export interface InvoiceRow {
  id: string;
  number: string;
  client_id: string;
  invoice_date: string;
  due_date: string | null;
  status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'cancelled';
  type: 'interventions' | 'devis' | 'mixed' | 'manual';
  subtotal_ht: number;
  tax_rate: number;
  tax_amount: number;
  total_ttc: number;
  paid_amount: number;
  notes: string | null;
  payment_terms: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  origin_type: 'intervention' | 'devis' | 'manual';
  origin_id: string | null;
  position: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// --- Types Réclamations ---
export interface ReclamationRow {
  id: string;
  client_id: string;
  pool_id: string | null;
  intervention_id: string | null;
  subject: string;
  category: 'eau' | 'materiel' | 'passage' | 'facturation' | 'autre';
  description: string;
  status: 'en_cours' | 'cloturee';
  admin_response: string | null;
  is_read_by_admin: boolean;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    city: string;
  };
  pool?: {
    id: string;
    name: string;
  };
}

