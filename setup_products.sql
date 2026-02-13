-- Création du module Produits Chimiques

-- 1. Table des produits
CREATE TABLE IF NOT EXISTS inventory_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg', -- 'kg', 'L', 'unit', 'galet'
    price_per_unit DECIMAL(10,3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table de liaison pour les produits utilisés lors de l'intervention
CREATE TABLE IF NOT EXISTS intervention_products (
    intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES inventory_products(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,3) NOT NULL, -- Prix au moment de l'intervention
    PRIMARY KEY (intervention_id, product_id)
);

-- Désactivation RLS pour test
ALTER TABLE inventory_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_products DISABLE ROW LEVEL SECURITY;

-- Insertion d'une liste de base de produits piscine
INSERT INTO inventory_products (name, unit, price_per_unit) VALUES
('Chlore Galet 250g', 'unité', 2.500),
('Chlore Choc Granulés', 'kg', 18.000),
('pH Moins Liquide', 'L', 4.500),
('pH Plus Poudre', 'kg', 6.000),
('Anti-Algues Multi', 'L', 12.000),
('Floculant Chaussette', 'unité', 3.000),
('Sel Piscine', 'kg', 0.800),
('Brome Galet', 'kg', 25.000),
('Nettoyant Ligne d''eau', 'L', 15.000),
('Hivernage liquide', 'L', 9.000)
ON CONFLICT (name) DO NOTHING;
