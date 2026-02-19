-- Désactiver RLS temporairement pour arrêter les erreurs
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques (nettoyage)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Read access for all" ON public.profiles;
DROP POLICY IF EXISTS "Update self" ON public.profiles;
DROP POLICY IF EXISTS "Update all for admins" ON public.profiles;


-- Fonction sécurisée pour vérifier si admin (évite la boucle infinie de RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Cette requête contourne RLS grâce à SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Lecture pour tous (pour l'affichage du statut, etc.)
CREATE POLICY "Read all" ON public.profiles FOR SELECT USING (true);

-- 2. Modification : Soi-même
CREATE POLICY "Update self" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Modification : Les Admins peuvent tout modifier
CREATE POLICY "Update admins" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Permissions de base
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
