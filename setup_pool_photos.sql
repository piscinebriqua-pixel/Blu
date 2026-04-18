-- 1. Création de la table pool_photos
CREATE TABLE IF NOT EXISTS public.pool_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Activation de RLS sur la table
ALTER TABLE public.pool_photos ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS pour pool_photos
CREATE POLICY "Lecture publique pour les photos" ON public.pool_photos
    FOR SELECT USING (true);

CREATE POLICY "Insertion authentifiée pour les photos" ON public.pool_photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Modification authentifiée pour les photos" ON public.pool_photos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Suppression authentifiée pour les photos" ON public.pool_photos
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Création du bucket de stockage 'pools' (via table storage.buckets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pools', 'pools', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Politiques Storage pour le bucket 'pools'
CREATE POLICY "Accès public pour le bucket pools" ON storage.objects
    FOR SELECT USING (bucket_id = 'pools');

CREATE POLICY "Upload authentifié pour le bucket pools" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'pools' AND auth.role() = 'authenticated');

CREATE POLICY "MàJ authentifiée pour le bucket pools" ON storage.objects
    FOR UPDATE USING (bucket_id = 'pools' AND auth.role() = 'authenticated');

CREATE POLICY "Suppression authentifiée pour le bucket pools" ON storage.objects
    FOR DELETE USING (bucket_id = 'pools' AND auth.role() = 'authenticated');
