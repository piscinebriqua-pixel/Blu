export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          created_at: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          balance: number;
          partner_id: string | null;
          notes: string | null;
          matricule_fiscal: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          balance?: number;
          partner_id?: string | null;
          notes?: string | null;
          matricule_fiscal?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          balance?: number;
          partner_id?: string | null;
          notes?: string | null;
          matricule_fiscal?: string | null;
        };
      };
      pools: {
        Row: {
          id: string;
          created_at: string;
          client_id: string;
          name: string;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          pool_type: string | null;
          volume: number | null;
          notes: string | null;
          latitude: number | null;
          longitude: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          client_id: string;
          name: string;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          pool_type?: string | null;
          volume?: number | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          client_id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          pool_type?: string | null;
          volume?: number | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
      };
      technicians: {
        Row: {
          id: string;
          created_at: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          specialization: string | null;
          is_active: boolean;
          hourly_rate: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          specialization?: string | null;
          is_active?: boolean;
          hourly_rate?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          specialization?: string | null;
          is_active?: boolean;
          hourly_rate?: number | null;
          notes?: string | null;
        };
      };
      interventions: {
        Row: {
          id: string;
          created_at: string;
          pool_id: string;
          technician_id: string | null;
          scheduled_date: string;
          completed_date: string | null;
          status: string;
          notes: string | null;
          duration_minutes: number | null;
          task_balai: boolean;
          task_lavage: boolean;
          task_rincage: boolean;
          task_test_chlore: boolean;
          task_test_ph: boolean;
          task_remplissage: boolean;
          task_panier_prefiltre: boolean;
          task_traitement: boolean;
          task_verif_vanne: boolean;
          task_temps_fonctionnement: boolean;
          total_amount: number | null;
          is_paid: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          pool_id: string;
          technician_id?: string | null;
          scheduled_date: string;
          completed_date?: string | null;
          status?: string;
          notes?: string | null;
          duration_minutes?: number | null;
          task_balai?: boolean;
          task_lavage?: boolean;
          task_rincage?: boolean;
          task_test_chlore?: boolean;
          task_test_ph?: boolean;
          task_remplissage?: boolean;
          task_panier_prefiltre?: boolean;
          task_traitement?: boolean;
          task_verif_vanne?: boolean;
          task_temps_fonctionnement?: boolean;
          total_amount?: number | null;
          is_paid?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          pool_id?: string;
          technician_id?: string | null;
          scheduled_date?: string;
          completed_date?: string | null;
          status?: string;
          notes?: string | null;
          duration_minutes?: number | null;
          task_balai?: boolean;
          task_lavage?: boolean;
          task_rincage?: boolean;
          task_test_chlore?: boolean;
          task_test_ph?: boolean;
          task_remplissage?: boolean;
          task_panier_prefiltre?: boolean;
          task_traitement?: boolean;
          task_verif_vanne?: boolean;
          task_temps_fonctionnement?: boolean;
          total_amount?: number | null;
          is_paid?: boolean;
        };
      };
      services: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string | null;
          price: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description?: string | null;
          price: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
        };
      };
      intervention_services: {
        Row: {
          id: string;
          created_at: string;
          intervention_id: string;
          service_id: string;
          price_at_time: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          intervention_id: string;
          service_id: string;
          price_at_time: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          intervention_id?: string;
          service_id?: string;
          price_at_time?: number;
        };
      };
      inventory_products: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string | null;
          unit: string | null;
          price_per_unit: number;
          stock_quantity: number;
          min_stock_level: number | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description?: string | null;
          unit?: string | null;
          price_per_unit: number;
          stock_quantity?: number;
          min_stock_level?: number | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string | null;
          unit?: string | null;
          price_per_unit?: number;
          stock_quantity?: number;
          min_stock_level?: number | null;
          is_active?: boolean;
        };
      };
      intervention_products: {
        Row: {
          id: string;
          created_at: string;
          intervention_id: string;
          product_id: string;
          quantity: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          intervention_id: string;
          product_id: string;
          quantity: number;
          total_price: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          intervention_id?: string;
          product_id?: string;
          quantity?: number;
          total_price?: number;
        };
      };
      payments: {
        Row: {
          id: string;
          created_at: string;
          client_id: string;
          amount: number;
          payment_date: string;
          payment_method: string | null;
          notes: string | null;
          intervention_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          client_id: string;
          amount: number;
          payment_date: string;
          payment_method?: string | null;
          notes?: string | null;
          intervention_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          client_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: string | null;
          notes?: string | null;
          intervention_id?: string | null;
        };
      };
      partners: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          commission_rate: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          commission_rate?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          commission_rate?: number | null;
          notes?: string | null;
        };
      };
      partner_payments: {
        Row: {
          id: string;
          created_at: string;
          partner_id: string;
          amount: number;
          payment_date: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          partner_id: string;
          amount: number;
          payment_date: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          partner_id?: string;
          amount?: number;
          payment_date?: string;
          notes?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          role: string;
          email: string | null;
          full_name: string | null;
          is_approved: boolean;
          technician_id: string | null;
          client_id: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          role?: string;
          email?: string | null;
          full_name?: string | null;
          is_approved?: boolean;
          technician_id?: string | null;
          client_id?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          role?: string;
          email?: string | null;
          full_name?: string | null;
          is_approved?: boolean;
          technician_id?: string | null;
          client_id?: string | null;
          avatar_url?: string | null;
        };
      };
      intervention_templates: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string | null;
          task_balai: boolean;
          task_lavage: boolean;
          task_rincage: boolean;
          task_test_chlore: boolean;
          task_test_ph: boolean;
          task_remplissage: boolean;
          task_panier_prefiltre: boolean;
          task_traitement: boolean;
          task_verif_vanne: boolean;
          task_temps_fonctionnement: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description?: string | null;
          task_balai?: boolean;
          task_lavage?: boolean;
          task_rincage?: boolean;
          task_test_chlore?: boolean;
          task_test_ph?: boolean;
          task_remplissage?: boolean;
          task_panier_prefiltre?: boolean;
          task_traitement?: boolean;
          task_verif_vanne?: boolean;
          task_temps_fonctionnement?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string | null;
          task_balai?: boolean;
          task_lavage?: boolean;
          task_rincage?: boolean;
          task_test_chlore?: boolean;
          task_test_ph?: boolean;
          task_remplissage?: boolean;
          task_panier_prefiltre?: boolean;
          task_traitement?: boolean;
          task_verif_vanne?: boolean;
          task_temps_fonctionnement?: boolean;
        };
      };
      template_services: {
        Row: {
          id: string;
          created_at: string;
          template_id: string;
          service_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          template_id: string;
          service_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          template_id?: string;
          service_id?: string;
        };
      };
      template_products: {
        Row: {
          id: string;
          created_at: string;
          template_id: string;
          product_id: string;
          quantity: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          template_id: string;
          product_id: string;
          quantity: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          template_id?: string;
          product_id?: string;
          quantity?: number;
        };
      };
      recurrence_rules: {
        Row: {
          id: string;
          created_at: string;
          pool_id: string;
          template_id: string;
          technician_id: string | null;
          frequency: string;
          day_of_week: number | null;
          active: boolean;
          last_generated_date: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          pool_id: string;
          template_id: string;
          technician_id?: string | null;
          frequency: string;
          day_of_week?: number | null;
          active?: boolean;
          last_generated_date?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          pool_id?: string;
          template_id?: string;
          technician_id?: string | null;
          frequency?: string;
          day_of_week?: number | null;
          active?: boolean;
          last_generated_date?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
