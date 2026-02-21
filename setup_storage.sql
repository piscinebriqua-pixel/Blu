-- 1. Création du bucket 'interventions' si il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('interventions', 'interventions', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configuration des politiques de sécurité (RLS) pour le storage
-- Accès public pour la lecture de toutes les photos
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'interventions');

-- Autoriser les uploads pour les utilisateurs authentifiés
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'interventions' AND 
    auth.role() = 'authenticated'
);

-- Autoriser la suppression/mise à jour par les utilisateurs authentifiés (Optionnel mais recommandé)
CREATE POLICY "Authenticated Update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'interventions' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'interventions' AND 
    auth.role() = 'authenticated'
);
