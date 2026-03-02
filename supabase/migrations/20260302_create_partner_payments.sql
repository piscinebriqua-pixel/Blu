
-- Table pour les paiements globaux des partenaires (Tiers-Payant)
CREATE TABLE IF NOT EXISTS partner_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('espèces', 'chèque', 'virement', 'autre')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by UUID REFERENCES profiles(id), -- Admin ou Tech qui a reçu l'argent
    reference TEXT, -- N° de chèque, transaction, etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS partner_payments_partner_id_idx ON partner_payments(partner_id);
CREATE INDEX IF NOT EXISTS partner_payments_received_by_idx ON partner_payments(received_by);

-- Enable RLS
ALTER TABLE partner_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tout le monde peut voir les paiements (authentifiés)"
    ON partner_payments FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Les admins et techniciens peuvent insérer des paiements"
    ON partner_payments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
