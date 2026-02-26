
-- Migration: Add maintenance tasks to interventions
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS task_balai BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_lavage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_rincage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_test_chlore BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_test_ph BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_remplissage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_panier_prefiltre BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_traitement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_verif_vanne BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_temps_fonctionnement BOOLEAN DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.interventions.task_balai IS 'Task: Balai performed';
COMMENT ON COLUMN public.interventions.task_lavage IS 'Task: Lavage performed';
COMMENT ON COLUMN public.interventions.task_rincage IS 'Task: Rinçage performed';
COMMENT ON COLUMN public.interventions.task_test_chlore IS 'Task: Teste Chlore performed';
COMMENT ON COLUMN public.interventions.task_test_ph IS 'Task: Teste PH performed';
COMMENT ON COLUMN public.interventions.task_remplissage IS 'Task: Remplissage performed';
COMMENT ON COLUMN public.interventions.task_panier_prefiltre IS 'Task: Panier pré-filtre cleaned';
COMMENT ON COLUMN public.interventions.task_traitement IS 'Task: Traitement completed';
COMMENT ON COLUMN public.interventions.task_verif_vanne IS 'Task: Vérification de Vanne done';
COMMENT ON COLUMN public.interventions.task_temps_fonctionnement IS 'Task: Temps de fonctionnement checked';
