-- 1. Table principale des modèles
CREATE TABLE IF NOT EXISTS public.intervention_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    task_balai BOOLEAN DEFAULT false,
    task_lavage BOOLEAN DEFAULT false,
    task_rincage BOOLEAN DEFAULT false,
    task_test_chlore BOOLEAN DEFAULT false,
    task_test_ph BOOLEAN DEFAULT false,
    task_remplissage BOOLEAN DEFAULT false,
    task_panier_prefiltre BOOLEAN DEFAULT false,
    task_traitement BOOLEAN DEFAULT false,
    task_verif_vanne BOOLEAN DEFAULT false,
    task_temps_fonctionnement BOOLEAN DEFAULT false
);

-- 2. Liaison avec les services
CREATE TABLE IF NOT EXISTS public.template_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    template_id UUID REFERENCES public.intervention_templates(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL
);

-- 3. Liaison avec les produits
CREATE TABLE IF NOT EXISTS public.template_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    template_id UUID REFERENCES public.intervention_templates(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.inventory_products(id) ON DELETE CASCADE NOT NULL,
    quantity NUMERIC DEFAULT 0 NOT NULL
);

-- Active RLS
ALTER TABLE public.intervention_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_products ENABLE ROW LEVEL SECURITY;

-- Basal Policies (Allow authenticated users)
-- Note: You might want to restrict this to 'admin' roles if you have a role system
CREATE POLICY "Allow all for authenticated users on intervention_templates" ON public.intervention_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users on template_services" ON public.template_services FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users on template_products" ON public.template_products FOR ALL TO authenticated USING (true);
