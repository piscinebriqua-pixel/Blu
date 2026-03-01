-- Table for tracking consumption of Devis Items during Interventions
CREATE TABLE IF NOT EXISTS public.intervention_devis_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE CASCADE,
    devis_item_id UUID REFERENCES public.devis_items(id) ON DELETE CASCADE,
    quantity_consumed NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.intervention_devis_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.intervention_devis_items AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert access for all users" ON public.intervention_devis_items AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON public.intervention_devis_items AS PERMISSIVE FOR DELETE TO public USING (true);
CREATE POLICY "Enable update access for all users" ON public.intervention_devis_items AS PERMISSIVE FOR UPDATE TO public USING (true);
