-- ==============================================================================
-- Migration : Gestion Avancée des Dépenses & Notes de Frais
-- Date : 2026-10-30
-- Description : Rendre le technicien optionnel, ajouter les modes de règlement,
--               fournisseurs, justificatifs et bucket storage dédié.
-- ==============================================================================

-- 1. Adapter la table expenses : rendre technician_id optionnel (dépenses générales d'entreprise)
ALTER TABLE public.expenses ALTER COLUMN technician_id DROP NOT NULL;

-- 2. Ajouter les nouvelles colonnes analytiques et comptables
ALTER TABLE public.expenses 
    ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'company_card',
    ADD COLUMN IF NOT EXISTS supplier TEXT,
    ADD COLUMN IF NOT EXISTS receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Contrainte de validation sur payment_method
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expenses_payment_method_check'
    ) THEN
        ALTER TABLE public.expenses 
            ADD CONSTRAINT expenses_payment_method_check 
            CHECK (payment_method IN ('cash_technician', 'company_card', 'company_transfer', 'cash_company', 'check'));
    END IF;
END $$;

-- 3. Enrichir les catégories de dépenses par défaut
INSERT INTO public.expense_categories (name, icon, requires_vehicle) VALUES 
    ('Produits & Traitement', 'Package', false),
    ('Pièces & Pompes', 'Wrench', false),
    ('Outillage & Équipement', 'Wrench', false),
    ('Entretien Véhicule', 'Truck', true),
    ('Frais Généraux / Locaux', 'Building2', false),
    ('Repas & Déplacement', 'Coffee', false)
ON CONFLICT (name) DO UPDATE SET 
    icon = EXCLUDED.icon,
    requires_vehicle = EXCLUDED.requires_vehicle;

-- 4. Index de performance
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON public.expenses(payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON public.expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date_status ON public.expenses(expense_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON public.expenses(supplier);

-- 5. Mettre à jour les Politiques RLS sur expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Nettoyer les anciennes politiques si existantes pour éviter les doublons
DROP POLICY IF EXISTS "Admins have full access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Technicians can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Technicians can insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Technicians can update their own pending expenses" ON public.expenses;

-- Politique Admin : Accès total en lecture / écriture / suppression
CREATE POLICY "Admins have full access to expenses" ON public.expenses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Politique Technicien : Lecture de leurs propres dépenses
CREATE POLICY "Technicians can view their own expenses" ON public.expenses
    FOR SELECT TO authenticated
    USING (
        technician_id IN (
            SELECT technician_id FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Politique Technicien : Insertion de leurs propres dépenses
CREATE POLICY "Technicians can insert their own expenses" ON public.expenses
    FOR INSERT TO authenticated
    WITH CHECK (
        technician_id IN (
            SELECT technician_id FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Politique Technicien : Modification uniquement si en attente (status = 'pending')
CREATE POLICY "Technicians can update their own pending expenses" ON public.expenses
    FOR UPDATE TO authenticated
    USING (
        technician_id IN (
            SELECT technician_id FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
        AND status = 'pending'
    )
    WITH CHECK (
        technician_id IN (
            SELECT technician_id FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
        AND status = 'pending'
    );

-- 6. Création du Bucket de Stockage pour les Justificatifs (expenses-receipts)
INSERT INTO storage.buckets (id, name, public)
VALUES ('expenses-receipts', 'expenses-receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politiques RLS de stockage pour expenses-receipts
DROP POLICY IF EXISTS "Public or Authenticated Read Receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Receipts" ON storage.objects;

CREATE POLICY "Public or Authenticated Read Receipts" ON storage.objects
    FOR SELECT USING (bucket_id = 'expenses-receipts');

CREATE POLICY "Authenticated Upload Receipts" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'expenses-receipts');

CREATE POLICY "Authenticated Delete Receipts" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'expenses-receipts' AND (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        )
    );

