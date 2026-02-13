-- Script d'insertion des techniciens
-- Note : Comme les techniciens n'ont pas encore de compte Auth, 
-- on va utiliser une table 'technicians' dédiée pour faciliter la gestion.

CREATE TABLE IF NOT EXISTS technicians (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Désactivation RLS pour test
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;

-- Insertion des techniciens fournis
INSERT INTO technicians (full_name, phone, photo_url) VALUES
('Lotfi', '22626507', NULL),
('Walid', '55609115', 'Technicien_Images/2531edac.photo.191019.jpg'),
('Boumnijel', '29063400', 'Technicien_Images/4e2a3ff7.photo.221032.jpg'),
('Med barkaoui', '58790185', 'Technicien_Images/817315f7.photo.155549.jpg'),
('Isam', '54629311', 'Technicien_Images/dccae6ba.photo.155615.jpg'),
('Marouane', '52398241', NULL),
('Ahmed bougzala', '24100814', NULL),
('Majdi mestiri', NULL, NULL),
('Adem', NULL, NULL),
('Sauber kanch', NULL, NULL),
('Ahmed hajji', NULL, NULL),
('Gaddour', NULL, NULL);

-- Mise à jour de la table interventions pour pointer vers nos techniciens
ALTER TABLE interventions DROP COLUMN IF EXISTS technician_id;
ALTER TABLE interventions ADD COLUMN technician_id UUID REFERENCES technicians(id);
