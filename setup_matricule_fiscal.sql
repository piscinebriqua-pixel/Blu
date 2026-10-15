-- ==============================================================================
-- Migration : Ajout du Matricule Fiscal aux Clients (Norme Tunisienne)
-- Date : 2026-04-21
-- Description : Permet aux clients (sociétés, patentés, professionnels)
-- d'avoir un matricule fiscal au format tunisien (ex: 1234567/A/M/000)
-- affiché conditionnellement sur leurs devis et factures.
-- ==============================================================================

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS matricule_fiscal TEXT;

COMMENT ON COLUMN public.clients.matricule_fiscal IS 'Matricule fiscal du client selon la norme tunisienne (ex: 1234567/A/M/000)';

-- Recharger le cache du schéma PostgREST
NOTIFY pgrst, 'reload schema';
