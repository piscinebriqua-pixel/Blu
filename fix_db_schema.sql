-- 1. Unification du nom de la colonne de date de fin d'intervention
DO $$ 
BEGIN
    -- Si visit_date existe, on la renomme en completed_date pour correspondre aux types et au code récent
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interventions' AND column_name = 'visit_date') THEN
        ALTER TABLE interventions RENAME COLUMN visit_date TO completed_date;
    END IF;
    
    -- Si aucune des deux n'existe (cas rare), on la crée
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interventions' AND column_name = 'completed_date') THEN
        ALTER TABLE interventions ADD COLUMN completed_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Création de la table de récurrence manquante
CREATE TABLE IF NOT EXISTS public.recurrence_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.intervention_templates(id) ON DELETE CASCADE NOT NULL,
    technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
    frequency TEXT NOT NULL, -- 'weekly', 'biweekly', 'monthly'
    day_of_week INTEGER, -- 0-6 (Dimanche=0)
    active BOOLEAN DEFAULT true NOT NULL,
    last_generated_date DATE
);

-- Activation RLS
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité (Accès total pour les authentifiés pour le moment)
DROP POLICY IF EXISTS "Allow all for authenticated users on recurrence_rules" ON public.recurrence_rules;
CREATE POLICY "Allow all for authenticated users on recurrence_rules" 
    ON public.recurrence_rules 
    FOR ALL TO authenticated 
    USING (true) 
    WITH CHECK (true);
