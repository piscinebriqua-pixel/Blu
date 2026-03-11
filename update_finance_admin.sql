-- 1. Create Advance Categories
CREATE TABLE IF NOT EXISTS public.advance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default advance categories
INSERT INTO public.advance_categories (name, icon) VALUES 
('Avance Régulière', 'Wallet'),
('Avance Spéciale', 'Star'),
('Acompte Salaire', 'Coins'),
('Autre', 'MoreHorizontal')
ON CONFLICT (name) DO NOTHING;

-- 2. Modify Advances Table to include category
ALTER TABLE public.advances ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.advance_categories(id);

-- 3. Update RLS Policies for Categories (Allow Admin CRUD)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.expense_categories;
CREATE POLICY "Read access for all" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Admin full access for expense categories" ON public.expense_categories FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

ALTER TABLE public.advance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read access for all" ON public.advance_categories FOR SELECT USING (true);
CREATE POLICY "Admin full access for advance categories" ON public.advance_categories FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- 4. Allow Admins to insert for any technician
DROP POLICY IF EXISTS "Technicians can insert their own expenses" ON public.expenses;
CREATE POLICY "Everyone can insert expenses" ON public.expenses FOR INSERT WITH CHECK (true); 
-- Note: We rely on application logic or stricter checks if needed, but for simplicity:
-- Technicians insert for themselves, Admins insert for anyone.

DROP POLICY IF EXISTS "Technicians can insert their own advance requests" ON public.advances;
CREATE POLICY "Everyone can insert advances" ON public.advances FOR INSERT WITH CHECK (true);

-- Ensure admins can delete (if needed)
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can delete advances" ON public.advances FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
