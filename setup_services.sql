-- Création de la table des services
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de la sécurité RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs connectés
DROP POLICY IF EXISTS "Services sont consultables par tous" ON services;
CREATE POLICY "Services sont consultables par tous" ON services
    FOR SELECT TO authenticated USING (true);

-- Insertion des services fournis par l'utilisateur
INSERT INTO services (name) VALUES
('NETTOYAGE PISCINE'),
('Changement filtre'),
('Balai'),
('Reparation'),
('Installation'),
('Changement Silex'),
('Pose ou dépose pompe'),
('Réseau encastré'),
('Verification'),
('Installation projecteur'),
('Visite'),
('Mise en marche'),
('Pose cascade'),
('Pose escalier'),
('Mise sous pression'),
('Pose electrliseur'),
('Vidange'),
('Salination'),
('Pose pièce à sellé'),
('Changement lampe'),
('Livraison produits'),
('Changement vannes'),
('Installer les bouches de piscine'),
('Coffret électrique'),
('Boîte de connexion'),
('Extracteur'),
('Pompe de relevage'),
('Nettoyage Bach à eaux'),
('Changement minuterie'),
('Flotteur'),
('Nettoyage électrolyse'),
('Installation commande'),
('Pose Bach piscine'),
('Pose skimmer'),
('Installation cascades'),
('Installation jacuzzi'),
('Nage contre courant'),
('Bouchage de réseau'),
('Pose échangeur'),
('Installation chaudière'),
('Pompe doseuse'),
('Branchement modulateur'),
('Fermeture de la piscine'),
('Câble de projecteur'),
('Mise en marche échangeur'),
('Pose grille de fond'),
('Pose clapet'),
('Changement transformateur')
ON CONFLICT (name) DO NOTHING;
