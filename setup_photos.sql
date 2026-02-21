-- Ajout du support des photos pour les rapports d'intervention
ALTER TABLE interventions 
ADD COLUMN IF NOT EXISTS photo_before_url TEXT,
ADD COLUMN IF NOT EXISTS photo_after_url TEXT;

-- Rappel: Créer le bucket 'interventions' dans Supabase Storage avec accès public pour les lectures
