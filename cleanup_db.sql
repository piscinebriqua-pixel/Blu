
-- =========================================================================
-- SCRIPT DE NETTOYAGE MASSIF (CLIENTS, INTERVENTIONS, PAIEMENTS)
-- =========================================================================
-- CE SCRIPT SUPPRIME TOUT LE CONTENU DES TABLES INDIQUÉES.
-- ACTION IRRÉVERSIBLE. UTILISEZ AVEC PRUDENCE.

-- 1. [FACULTATIF] COMPTAGE DES DONNÉES AVANT SUPPRESSION
SELECT 'Clients' as "Table", count(*) FROM public.clients
UNION ALL SELECT 'Bassins (Pools)', count(*) FROM public.pools
UNION ALL SELECT 'Interventions', count(*) FROM public.interventions
UNION ALL SELECT 'Paiements', count(*) FROM public.payments
UNION ALL SELECT 'Liaison Services', count(*) FROM public.intervention_services
UNION ALL SELECT 'Liaison Produits', count(*) FROM public.intervention_products;

-- 2. SUPPRESSION DANS L'ORDRE DES CONTRAINTES
BEGIN;
  -- Suppression des données d'interventions (Services et Produits liés)
  -- Note: Les DELETE CASCADE s'en occupent généralement, mais on le fait explicitement par sécurité.
  DELETE FROM public.intervention_services;
  DELETE FROM public.intervention_products;
  DELETE FROM public.interventions;

  -- Suppression de tous les paiements / encaissements
  DELETE FROM public.payments;

  -- Suppression de tous les bassins
  DELETE FROM public.pools;

  -- Détachement des profils (si des comptes auth.users sont liés à des clients)
  UPDATE public.profiles SET client_id = NULL;

  -- Suppression finale de tous les clients
  DELETE FROM public.clients;

  -- Facultatif : Réinitialiser les balances si le script est utilisé pour un "Reset"
  -- UPDATE public.clients SET balance = 0; -- (Inutile si on supprime les clients)
COMMIT;

-- 3. [FACULTATIF] VÉRIFICATION APRÈS SUPPRESSION
SELECT 'Clients' as "Table", count(*) FROM public.clients
UNION ALL SELECT 'Bassins (Pools)', count(*) FROM public.pools
UNION ALL SELECT 'Interventions', count(*) FROM public.interventions
UNION ALL SELECT 'Paiements', count(*) FROM public.payments;
