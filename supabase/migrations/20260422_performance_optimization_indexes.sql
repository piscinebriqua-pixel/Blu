-- ==============================================================================
-- Migration : Optimisation Majeure des Performances & Indexation PostgreSQL
-- Date : 2026-04-22
-- Projet : Blu (Pool Management System)
-- Objectif : Élimination des Seq Scans, accélération des jointures, tris et filtres
-- ==============================================================================

-- 1. TABLE INTERVENTIONS (Cœur opérationnel)
-- Accélération des filtres par bassin et date (Fiche client / Historique bassin)
CREATE INDEX IF NOT EXISTS idx_interventions_pool_date 
    ON public.interventions(pool_id, scheduled_date DESC);

-- Accélération du planning technicien (Filtre par technicien + tri date)
CREATE INDEX IF NOT EXISTS idx_interventions_tech_date 
    ON public.interventions(technician_id, scheduled_date DESC);

-- Accélération des filtres de statut (interventions planifiées / en cours / terminées)
CREATE INDEX IF NOT EXISTS idx_interventions_status_date 
    ON public.interventions(status, scheduled_date DESC);

-- 2. TABLE POOLS (Bassins)
-- Jointure ultra-rapide client -> piscines
CREATE INDEX IF NOT EXISTS idx_pools_client_id 
    ON public.pools(client_id);

-- Accélération de la génération en lot des récurrences (contrats actifs)
CREATE INDEX IF NOT EXISTS idx_pools_contracted 
    ON public.pools(is_contracted) 
    WHERE is_contracted = true;

-- 3. TABLE PAYMENTS (Finances & Recouvrement)
-- Accélération des encaissements par client
CREATE INDEX IF NOT EXISTS idx_payments_client_date 
    ON public.payments(client_id, payment_date DESC);

-- Accélération du suivi financier par technicien
CREATE INDEX IF NOT EXISTS idx_payments_tech_date 
    ON public.payments(technician_id, payment_date DESC);

-- Accélération des calculs de chiffre d'affaires (Dashboard & Revenus)
CREATE INDEX IF NOT EXISTS idx_payments_date_method 
    ON public.payments(payment_date DESC) 
    INCLUDE (amount, method);

-- 4. TABLE DEVIS (Propositions Commerciales)
CREATE INDEX IF NOT EXISTS idx_devis_client_date 
    ON public.devis(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_devis_status 
    ON public.devis(status);

-- 5. TABLES FINANCES & DÉPENSES TECHNICIENS
CREATE INDEX IF NOT EXISTS idx_expenses_tech_date 
    ON public.expenses(technician_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_status 
    ON public.expenses(status);

CREATE INDEX IF NOT EXISTS idx_advances_tech_date 
    ON public.advances(technician_id, advance_date DESC);

CREATE INDEX IF NOT EXISTS idx_remittances_tech_date 
    ON public.remittances(technician_id, remittance_date DESC);

-- 6. TABLE RECURRENCE_RULES
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_pool 
    ON public.recurrence_rules(pool_id) 
    WHERE active = true;

-- 7. OPTIMISATION ESPACE CLIENT & LIAISONS EMBARQUÉES
-- Accélération de l'authentification client par téléphone
CREATE INDEX IF NOT EXISTS idx_clients_phone 
    ON public.clients(phone);

-- Accélération du chargement des photos de bassins (Espace client & Fiche client)
CREATE INDEX IF NOT EXISTS idx_pool_photos_pool_id 
    ON public.pool_photos(pool_id);

-- Accélération des sous-jointures de consommables et services par intervention
CREATE INDEX IF NOT EXISTS idx_intervention_products_inter_id 
    ON public.intervention_products(intervention_id);

CREATE INDEX IF NOT EXISTS idx_intervention_services_inter_id 
    ON public.intervention_services(intervention_id);

-- 8. OPTIMISATION RLS SUR PROFILES
-- Index pour éviter les sous-requêtes RLS lentes sur auth.uid() = profiles.id
CREATE INDEX IF NOT EXISTS idx_profiles_role_tech 
    ON public.profiles(id, role, technician_id);
