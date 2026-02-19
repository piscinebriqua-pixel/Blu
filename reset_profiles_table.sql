-- ATTENTION : Ce script remet à zéro la table profiles pour corriger les erreurs de schéma.

-- 1. Supprimer la table existante (et ses dépendances/politiques)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Recréer la table proprement (avec TEXT pour le rôle pour éviter les soucis d'ENUM)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'pending', -- On utilise TEXT simple au lieu de l'Enum pour être sûr
  is_approved BOOLEAN DEFAULT false,
  technician_id UUID REFERENCES public.technicians(id),
  client_id UUID REFERENCES public.clients(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Désactiver RLS pour le moment (pour éviter les blocages immédiats)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. Réimporter tous les utilisateurs existants
INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name',
    'admin', -- On met tout le monde Admin temporairement pour débloquer
    true      -- On valide tout le monde temporairement
FROM auth.users;

-- 5. Recréer le trigger pour les futurs inscrits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'pending', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
