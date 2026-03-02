-- Migration to create the intervention_payments table for FIFO distribution

CREATE TABLE IF NOT EXISTS intervention_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
    amount_applied DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_intervention_payments_payment_id ON intervention_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_intervention_payments_intervention_id ON intervention_payments(intervention_id);

-- Enable RLS
ALTER TABLE intervention_payments ENABLE ROW LEVEL SECURITY;

-- Simple policy for authenticated users (matching project style)
CREATE POLICY "Enable all for authenticated users" ON intervention_payments
    FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE intervention_payments IS 'Stores the distribution of payments across interventions for FIFO tracking.';
