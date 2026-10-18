-- completed_date ne doit être renseignée que pour les visites terminées.
-- 1) Supprime un éventuel DEFAULT now() hérité du renommage visit_date -> completed_date.
-- 2) Remet à NULL les visites non terminées qui ont reçu une fausse date de réalisation.

ALTER TABLE public.interventions ALTER COLUMN completed_date DROP DEFAULT;

UPDATE public.interventions
SET completed_date = NULL
WHERE status = 'scheduled'
  AND completed_date IS NOT NULL;
