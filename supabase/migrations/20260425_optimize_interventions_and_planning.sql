-- ==============================================================================
-- Migration : Optimisation Haute Performance Planning & Interventions
-- Date : 2026-04-25
-- Projet : Blu (Pool Management System)
-- Objectif : Indexation stratégique pour accélérer le chargement du planning 
--            et de la liste des entretiens avec filtrage par statut et dates.
-- ==============================================================================

-- 1. Index composite pour le Planning (navigation temporelle par date programmée + statut + technicien)
CREATE INDEX IF NOT EXISTS idx_interventions_planning 
    ON public.interventions (scheduled_date, status, technician_id)
    WHERE scheduled_date IS NOT NULL;

-- 2. Index composite pour les entretiens terminés (tri par date de réalisation)
CREATE INDEX IF NOT EXISTS idx_interventions_completed_date 
    ON public.interventions (completed_date DESC)
    WHERE status = 'completed';

-- 3. Index composite pour les entretiens à faire / en cours
CREATE INDEX IF NOT EXISTS idx_interventions_pending_scheduled 
    ON public.interventions (status, scheduled_date ASC)
    WHERE status IN ('pending', 'scheduled', 'in_progress');

-- 4. Index sur les clés étrangères d'interventions pour accélérer les jointures
CREATE INDEX IF NOT EXISTS idx_interventions_pool_id 
    ON public.interventions (pool_id);

CREATE INDEX IF NOT EXISTS idx_interventions_technician_id 
    ON public.interventions (technician_id);

-- 5. Index sur les lignes de services et produits d'interventions
CREATE INDEX IF NOT EXISTS idx_intervention_services_intervention_id 
    ON public.intervention_services (intervention_id);

CREATE INDEX IF NOT EXISTS idx_intervention_products_intervention_id 
    ON public.intervention_products (intervention_id);
