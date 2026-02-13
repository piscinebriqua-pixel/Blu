-- On ajoute les colonnes manquantes à la table clients pour l'Option B
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- On permet à profile_id d'être NULL (pour les clients sans compte utilisateur)
ALTER TABLE clients 
ALTER COLUMN profile_id DROP NOT EXISTS;
