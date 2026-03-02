-- 1. Table des partenaires / intervenants externes
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    role TEXT NOT NULL, -- ex: 'architecte', 'entrepreneur', 'plombier', 'electricien', 'pilote', 'pisciniste'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activer RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 3. Politiques (Tout le monde authentifié peut lire, insérer, modifier, supprimer)
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les partenaires" ON public.partners
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs authentifiés peuvent insérer des partenaires" ON public.partners
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les partenaires" ON public.partners
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs authentifiés peuvent supprimer les partenaires" ON public.partners
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Ajouter les colonnes de liaison à la table clients existante
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS architect_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS entrepreneur_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS plumber_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS electrician_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pool_builder_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS site_manager_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS billing_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL; -- Fournisseur Tiers-Payant

-- 5. Option sur la table partenaires
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS is_billing_partner BOOLEAN DEFAULT false;
