-- ÉTAPE 1 : Ajouter la valeur 'pending' au type Enum
-- Exécutez ce script SEUL d'abord.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pending';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
