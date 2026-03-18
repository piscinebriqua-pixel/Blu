-- =====================================================
-- Migration : Gestion des Véhicules
-- Date : 2026-03-18
-- =====================================================

-- Table des véhicules
CREATE TABLE IF NOT EXISTS vehicles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    plate       TEXT,
    type        TEXT DEFAULT 'van',  -- 'van', 'car', 'truck', 'moto'
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Ajouter la colonne vehicle_id dans expenses (pour les dépenses carburant)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS kilometers NUMERIC(10,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS liters NUMERIC(10,2);

-- Ajouter un flag "requires_vehicle" dans expense_categories
ALTER TABLE expense_categories ADD COLUMN IF NOT EXISTS requires_vehicle BOOLEAN DEFAULT false;

-- Indicateurs : marquer "Carburant" comme nécessitant un véhicule
-- (sera fait manuellement depuis l'UI ou en mettant à jour via le dashboard Supabase)

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read vehicles" ON vehicles
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage vehicles" ON vehicles
    FOR ALL TO authenticated USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id);
