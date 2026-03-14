-- =============================================
-- Jai Gems — Casting Inventory Categories & Attributes
-- =============================================

-- 1. Add category_id to casting_inventory
ALTER TABLE public.casting_inventory 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id);

-- 2. Create casting_attributes table
CREATE TABLE IF NOT EXISTS public.casting_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add attribute_ids column to casting_inventory
ALTER TABLE public.casting_inventory
ADD COLUMN IF NOT EXISTS attribute_ids UUID[] DEFAULT '{}';

-- 4. Enable RLS for new table
ALTER TABLE public.casting_attributes ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read attributes' AND tablename = 'casting_attributes') THEN
        CREATE POLICY "Public read attributes" ON public.casting_attributes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin write attributes' AND tablename = 'casting_attributes') THEN
        CREATE POLICY "Admin write attributes" ON public.casting_attributes FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;
END $$;
