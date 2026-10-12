export interface Pool {
  id: string;
  name: string;
  volume_m3: number;
  treatment_method: string;
  lining_type: string;
  filter_type: string;
  is_contracted: boolean;
  maintenance_frequency: string;
  preferred_day: number;
  photos?: { url: string; is_main: boolean }[];
}

export interface Intervention {
  id: string;
  completed_date: string | null;
  scheduled_date: string;
  created_at: string;
  notes: string;
  ph_level: number;
  chlorine_level: number;
  status: string;
  pool_name?: string;
  technician?: { full_name: string } | null;
  services?: {
    price_at_time: number;
    service: { name: string };
  }[];
  products?: {
    quantity: number;
    total_price: number;
    product: { name: string; unit: string };
  }[];
  paid_amount?: number;
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
}

export interface Devis {
  id: string;
  number: string;
  title: string;
  total_amount: number;
  status: "pending" | "closed" | "cancelled";
  created_at: string;
  pdf_url?: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  phone2?: string;
  email: string;
  address: string;
  city: string;
  balance: number;
  notes: string;
  gps_lat: number | null;
  gps_lng: number | null;
  architect_id?: string;
  entrepreneur_id?: string;
  plumber_id?: string;
  electrician_id?: string;
  pool_builder_id?: string;
  site_manager_id?: string;
  billing_partner_id?: string;
}

export interface ClientPartner {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  specialty?: string;
  phone?: string;
  email?: string;
}

export type ActiveCategory = "pools" | "interventions" | "payments" | "balance" | "gps" | "devis" | null;
