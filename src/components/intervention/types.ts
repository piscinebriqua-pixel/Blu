export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Technician {
  id: string;
  full_name: string;
  email?: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price_per_unit: number;
}

export interface Devis {
  id: string;
  number: string;
  title: string;
  total_amount: number;
  status: 'pending' | 'closed';
}

export interface DevisItemConsumption {
  id: string;
  designation: string;
  unit_price: number;
  total_quantity: number;
  consumed: number;
  to_consume: number;
  is_header: boolean;
  unit: string;
}

export interface NewInterventionFormData {
  technician_id: string;
  ph_level: string;
  chlorine_level: string;
  water_temp: string;
  notes: string;
  water_level_adjusted: boolean;
  scheduled_date: string;
  payment_amount: string;
  payment_method: "espèces" | "chèque" | "virement" | "autre";
  payment_technician_id: string;
  payment_date: string;
  record_payment: boolean;
  photo_before_url: string;
  photo_after_url: string;
  // Maintenance Tasks
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
  devis_id: string;
  is_final_devis_billing: boolean;
  completed_date: string;
}

export interface NewInterventionProps {
  poolId?: string;
  clientId?: string;
  interventionId?: string;
  scheduledDate?: string;
  type?: "direct" | "scheduled";
  onClose: () => void;
  onSuccess: () => void;
}
