-- 1. Create Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default categories
INSERT INTO public.expense_categories (name, icon) VALUES 
('Carburant', 'Fuel'),
('Petit Outillage', 'Wrench'),
('Fournitures', 'Package'),
('Repas', 'Coffee'),
('Parking/Péage', 'Truck'),
('Autre', 'MoreHorizontal')
ON CONFLICT (name) DO NOTHING;

-- 2. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES public.technicians(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.expense_categories(id),
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    description TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Advances Table
CREATE TABLE IF NOT EXISTS public.advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES public.technicians(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    description TEXT,
    advance_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Remittances Table (Versements)
CREATE TABLE IF NOT EXISTS public.remittances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES public.technicians(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    remittance_date DATE DEFAULT CURRENT_DATE,
    method TEXT DEFAULT 'cash' CHECK (method IN ('cash', 'check', 'transfer')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated')),
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remittances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Categories
CREATE POLICY "Enable read access for all users" ON public.expense_categories FOR SELECT USING (true);

-- RLS Policies for Expenses
CREATE POLICY "Technicians can insert their own expenses" ON public.expenses 
FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE technician_id = expenses.technician_id)
);

CREATE POLICY "Technicians can view their own expenses" ON public.expenses 
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE technician_id = expenses.technician_id) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Admins can update expenses" ON public.expenses 
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- RLS Policies for Advances
CREATE POLICY "Technicians can insert their own advance requests" ON public.advances 
FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE technician_id = advances.technician_id)
);

CREATE POLICY "Technicians can view their own advances" ON public.advances 
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE technician_id = advances.technician_id) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Admins can update advances" ON public.advances 
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- RLS Policies for Remittances
CREATE POLICY "Technicians can insert their own remittances" ON public.remittances 
FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE technician_id = remittances.technician_id)
);

CREATE POLICY "Technicians can view their own remittances" ON public.remittances 
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE technician_id = remittances.technician_id) OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Admins can update remittances" ON public.remittances 
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
