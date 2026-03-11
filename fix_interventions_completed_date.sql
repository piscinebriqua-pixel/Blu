-- Remove NOT NULL constraint from completed_date in interventions table
ALTER TABLE public.interventions 
ALTER COLUMN completed_date DROP NOT NULL;
