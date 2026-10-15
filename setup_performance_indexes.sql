-- ==============================================================================
-- Script SQL d'Exécution Directe : Optimisation Majeure des Index PostgreSQL
-- Projet : Blu (Pool Management System)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_interventions_pool_date 
    ON public.interventions(pool_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_interventions_tech_date 
    ON public.interventions(technician_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_interventions_status_date 
    ON public.interventions(status, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_pools_client_id 
    ON public.pools(client_id);

CREATE INDEX IF NOT EXISTS idx_pools_contracted 
    ON public.pools(is_contracted) 
    WHERE is_contracted = true;

CREATE INDEX IF NOT EXISTS idx_payments_client_date 
    ON public.payments(client_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_tech_date 
    ON public.payments(technician_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_date_method 
    ON public.payments(payment_date DESC) 
    INCLUDE (amount, method);

CREATE INDEX IF NOT EXISTS idx_devis_client_date 
    ON public.devis(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_devis_status 
    ON public.devis(status);

CREATE INDEX IF NOT EXISTS idx_expenses_tech_date 
    ON public.expenses(technician_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_status 
    ON public.expenses(status);

CREATE INDEX IF NOT EXISTS idx_advances_tech_date 
    ON public.advances(technician_id, advance_date DESC);

CREATE INDEX IF NOT EXISTS idx_remittances_tech_date 
    ON public.remittances(technician_id, remittance_date DESC);

CREATE INDEX IF NOT EXISTS idx_recurrence_rules_pool 
    ON public.recurrence_rules(pool_id) 
    WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_clients_phone 
    ON public.clients(phone);

CREATE INDEX IF NOT EXISTS idx_pool_photos_pool_id 
    ON public.pool_photos(pool_id);

CREATE INDEX IF NOT EXISTS idx_intervention_products_inter_id 
    ON public.intervention_products(intervention_id);

CREATE INDEX IF NOT EXISTS idx_intervention_services_inter_id 
    ON public.intervention_services(intervention_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role_tech 
    ON public.profiles(id, role, technician_id);
