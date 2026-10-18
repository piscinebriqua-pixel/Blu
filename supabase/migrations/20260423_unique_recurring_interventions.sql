-- Anti-doublon des visites récurrentes
-- 1) Nettoyage : pour chaque (bassin, date), on garde la visite planifiée la plus ancienne
--    parmi les visites récurrentes (tag [Ancrage:...]) encore au statut 'scheduled'.
-- 2) Index unique partiel : empêche toute future création en double (même en cas de race condition).

-- (Optionnel) Aperçu des doublons avant suppression :
-- SELECT pool_id, scheduled_date, count(*) FROM public.interventions
-- WHERE status = 'scheduled' AND notes LIKE '%[Ancrage:%'
-- GROUP BY pool_id, scheduled_date HAVING count(*) > 1;

DELETE FROM public.interventions i
USING (
  SELECT id,
         row_number() OVER (
           PARTITION BY pool_id, scheduled_date
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.interventions
  WHERE status = 'scheduled'
    AND notes LIKE '%[Ancrage:%'
) d
WHERE i.id = d.id
  AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_interventions_recurring_pool_date
  ON public.interventions (pool_id, scheduled_date)
  WHERE status = 'scheduled' AND notes LIKE '%[Ancrage:%';
