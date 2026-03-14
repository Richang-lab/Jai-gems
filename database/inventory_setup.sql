-- =============================================
-- Jai Gems — Database Setup for Module 3: Inventory
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. Configuration Tables
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stone_shapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL -- e.g., Square 4x4 MM, Pan 4x6 MM
);

CREATE TABLE IF NOT EXISTS public.stone_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL -- e.g., Glass, Zircon, AD
);

-- Basic data seeding for configuration
INSERT INTO public.product_categories (name) VALUES 
('Earring'), ('Jhumki'), ('Stud'), ('Hairstick'), ('Rings'), ('Toe Ring'), ('Anklet'), ('Nose Pin'), ('Necklace')
ON CONFLICT DO NOTHING;

INSERT INTO public.stone_materials (name) VALUES 
('Glass'), ('Zircon'), ('AD')
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. Finished Goods Inventory
-- =============================================
CREATE TABLE IF NOT EXISTS public.finished_goods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  casting_product_code TEXT UNIQUE,
  image_url TEXT,
  qty INTEGER DEFAULT 0,
  reserved_qty INTEGER DEFAULT 0,
  price NUMERIC(10, 2) DEFAULT 0,
  weight NUMERIC(10, 3) DEFAULT 0,
  category_id UUID REFERENCES public.product_categories(id),
  
  -- Up to 5 stone slots
  stone_1_type_id UUID REFERENCES public.stone_shapes(id),
  stone_1_material_id UUID REFERENCES public.stone_materials(id),
  stone_1_qty INTEGER,
  
  stone_2_type_id UUID REFERENCES public.stone_shapes(id),
  stone_2_material_id UUID REFERENCES public.stone_materials(id),
  stone_2_qty INTEGER,
  
  stone_3_type_id UUID REFERENCES public.stone_shapes(id),
  stone_3_material_id UUID REFERENCES public.stone_materials(id),
  stone_3_qty INTEGER,
  
  stone_4_type_id UUID REFERENCES public.stone_shapes(id),
  stone_4_material_id UUID REFERENCES public.stone_materials(id),
  stone_4_qty INTEGER,
  
  stone_5_type_id UUID REFERENCES public.stone_shapes(id),
  stone_5_material_id UUID REFERENCES public.stone_materials(id),
  stone_5_qty INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- =============================================
-- 3. Raw Materials & Work in Progress Inventory
-- =============================================
CREATE TABLE IF NOT EXISTS public.wax_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  casting_product_code TEXT UNIQUE,
  qty INTEGER DEFAULT 0 CHECK (qty >= 0),
  std_weight NUMERIC(10, 3) NOT NULL,
  total_weight NUMERIC(10, 3) NOT NULL,
  reserved_qty INTEGER DEFAULT 0,
  reserved_weight NUMERIC(10, 3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.casting_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  casting_product_code TEXT UNIQUE,
  qty INTEGER DEFAULT 0 CHECK (qty >= 0),
  std_weight NUMERIC(10, 3) NOT NULL,
  total_weight NUMERIC(10, 3) NOT NULL,
  reserved_qty INTEGER DEFAULT 0,
  reserved_weight NUMERIC(10, 3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Optional RLS logic (Bypassed natively by our Service Role Key, but good practice)
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stone_shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stone_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finished_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wax_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_inventory ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read config tables
CREATE POLICY "Public read config" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Public read config" ON public.stone_shapes FOR SELECT USING (true);
CREATE POLICY "Public read config" ON public.stone_materials FOR SELECT USING (true);
CREATE POLICY "Public read finished_goods" ON public.finished_goods FOR SELECT USING (true);
CREATE POLICY "Public read wax" ON public.wax_inventory FOR SELECT USING (true);
CREATE POLICY "Public read casting" ON public.casting_inventory FOR SELECT USING (true);

-- Admins full access
CREATE POLICY "Admin write category" ON public.product_categories FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write shapes" ON public.stone_shapes FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write materials" ON public.stone_materials FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write finished_goods" ON public.finished_goods FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write wax" ON public.wax_inventory FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin write casting" ON public.casting_inventory FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Set up storage bucket for product images
-- NOTE: In Supabase, you must run this or create the bucket manually in the UI
insert into storage.buckets (id, name, public) 
values ('product_images', 'product_images', true)
on conflict do nothing;

create policy "Images are publicly accessible." 
  on storage.objects for select 
  using ( bucket_id = 'product_images' );

create policy "Anyone can upload images." 
  on storage.objects for insert 
  with check ( bucket_id = 'product_images' );
