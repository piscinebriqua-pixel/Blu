-- ==============================================================================
-- Migration : Module Réclamations Clients (SAV & Traitement Admin)
-- Date : 2026-04-20
-- Description :
--   1. Création de la table 'reclamations'
--   2. Statuts : 'en_cours' | 'cloturee'
--   3. Suivi admin, date de clôture et note de résolution
--   4. RLS pour accès sécurisé Admin (auth) et Espace Client (anon)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reclamations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    pool_id UUID REFERENCES public.pools(id) ON DELETE SET NULL,
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
    
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'autre', -- 'eau', 'materiel', 'passage', 'facturation', 'autre'
    description TEXT NOT NULL,
    
    status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'cloturee')),
    
    -- Suivi & Clôture Admin
    admin_response TEXT,
    is_read_by_admin BOOLEAN NOT NULL DEFAULT false,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_reclamations_client_id ON public.reclamations(client_id);
CREATE INDEX IF NOT EXISTS idx_reclamations_status ON public.reclamations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reclamations_created_at ON public.reclamations(created_at DESC);

-- Sécurité RLS
ALTER TABLE public.reclamations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Allow admin full access on reclamations" ON public.reclamations;
CREATE POLICY "Allow admin full access on reclamations"
    ON public.reclamations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read reclamations" ON public.reclamations;
CREATE POLICY "Allow anon read reclamations"
    ON public.reclamations
    FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert reclamations" ON public.reclamations;
CREATE POLICY "Allow anon insert reclamations"
    ON public.reclamations
    FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update reclamations" ON public.reclamations;
CREATE POLICY "Allow anon update reclamations"
    ON public.reclamations
    FOR UPDATE
    TO anon
    USING (true);
