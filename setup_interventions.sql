-- Création du module Interventions / Rapports d'entretien

-- 1. Table principale des interventions
CREATE TABLE IF NOT EXISTS interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES profiles(id),
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Mesures techniques
    ph_level DECIMAL(3,1),
    chlorine_level DECIMAL(3,1),
    alkalinity INTEGER,
    water_temp DECIMAL(4,1),
    salt_level DECIMAL(4,1),
    -- État et notes
    water_level_adjusted BOOLEAN DEFAULT false,
    notes TEXT,
    photo_urls TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'completed', -- 'draft', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table de liaison pour les services effectués lors de l'intervention
CREATE TABLE IF NOT EXISTS intervention_services (
    intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (intervention_id, service_id)
);

-- Activation RLS
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_services ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
DROP POLICY IF EXISTS "Interventions consultables par l'équipe" ON interventions;
CREATE POLICY "Interventions consultables par l'équipe" ON interventions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Techniciens peuvent insérer des interventions" ON interventions;
CREATE POLICY "Techniciens peuvent insérer des interventions" ON interventions
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Liaison services consultable" ON intervention_services;
CREATE POLICY "Liaison services consultable" ON intervention_services
    FOR ALL TO authenticated USING (true);
