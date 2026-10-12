-- ==============================================================================
-- Script SQL d'Exécution Rapide : Module de Facturation Blu
-- À coller directement dans le "SQL Editor" de votre tableau de bord Supabase
-- ==============================================================================

-- 1. Séquence de numérotation des factures
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

-- 2. Fonction de génération du numéro de facture (FAC-YYYY-0001)
CREATE OR REPLACE FUNCTION generate_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_yr TEXT := to_char(CURRENT_DATE, 'YYYY');
    seq_val BIGINT := nextval('invoice_number_seq');
    formatted_no TEXT;
BEGIN
    formatted_no := 'FAC-' || current_yr || '-' || LPAD(seq_val::TEXT, 4, '0');
    RETURN formatted_no;
END;
$$ LANGUAGE plpgsql;

-- 3. Table des Factures (En-tête)
CREATE TABLE IF NOT EXISTS invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number          TEXT NOT NULL UNIQUE DEFAULT generate_next_invoice_number(),
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    status          TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'cancelled')),
    type            TEXT NOT NULL DEFAULT 'interventions' CHECK (type IN ('interventions', 'devis', 'mixed', 'manual')),
    
    -- Montants financiers (DT à 3 décimales)
    subtotal_ht     NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    tax_rate        NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount      NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    total_ttc       NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    paid_amount     NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    
    notes           TEXT,
    payment_terms   TEXT DEFAULT 'Paiement à réception',
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table des Lignes de Facture (Items figés / Snapshot immuable)
CREATE TABLE IF NOT EXISTS invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    origin_type     TEXT NOT NULL DEFAULT 'manual' CHECK (origin_type IN ('intervention', 'devis', 'manual')),
    origin_id       UUID, -- ID de l'intervention ou du devis source
    position        INT NOT NULL DEFAULT 0,
    description     TEXT NOT NULL,
    quantity        NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price      NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    total_price     NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Clés de verrouillage sur les tables sources (Interventions & Devis)
-- Un élément ayant invoice_id NOT NULL est verrouillé et ne peut plus être refacturé
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- 6. Index d'optimisation
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_interventions_invoice_id ON interventions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_devis_invoice_id ON devis(invoice_id);

-- 7. Trigger de mise à jour updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoices_updated_at();

-- 8. Sécurité RLS (Row Level Security)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to invoices" ON invoices;
CREATE POLICY "Admins have full access to invoices" ON invoices
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Clients can read own invoices" ON invoices;
CREATE POLICY "Clients can read own invoices" ON invoices
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.client_id = invoices.client_id
        )
    );

DROP POLICY IF EXISTS "Admins have full access to invoice_items" ON invoice_items;
CREATE POLICY "Admins have full access to invoice_items" ON invoice_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Clients can read own invoice items" ON invoice_items;
CREATE POLICY "Clients can read own invoice items" ON invoice_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM invoices
            JOIN profiles ON profiles.client_id = invoices.client_id
            WHERE invoices.id = invoice_items.invoice_id
            AND profiles.id = auth.uid()
        )
    );
