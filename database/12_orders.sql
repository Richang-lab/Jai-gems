-- =============================================
-- Jai Gems — Database Migration 12: Orders
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. App Settings table (for casting_rate etc)
-- =============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default casting rate (per gram)
INSERT INTO public.app_settings (key, value) VALUES ('casting_rate', '500')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 2. Orders header
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         TEXT UNIQUE NOT NULL,     -- FGO-250309-0001 or CSO-250309-0001
  order_type       TEXT NOT NULL CHECK (order_type IN ('finished_good', 'casting')),
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status           TEXT DEFAULT 'Open',
  notes            TEXT,
  estimated_value  NUMERIC(12, 2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       UUID REFERENCES public.users(id)
);

-- =============================================
-- 3. Order Line Items
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_code  TEXT NOT NULL,
  image_url     TEXT,
  qty           NUMERIC(10, 3) NOT NULL DEFAULT 1,  -- can be pairs or grams
  qty_type      TEXT DEFAULT 'pairs' CHECK (qty_type IN ('pairs', 'weight')),
  unit_price    NUMERIC(10, 2) DEFAULT 0,            -- FG: from price field; Casting: calc'd
  status        TEXT DEFAULT 'Open'
    CHECK (status IN (
      'Open', 'Wax Inprogress', 'Wax Complete', 'Wax Tree Inprogress',
      'Wax Tree Complete', 'Casting', 'Jhalai', 'Plating', 'Stone',
      'Packed', 'Billed', 'Canceled', 'In Stock'
    )),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. RLS: allow authenticated reads/writes
-- =============================================
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "auth read orders"       ON public.orders       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth read order_items"  ON public.order_items  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth read app_settings" ON public.app_settings FOR SELECT USING (auth.role() = 'authenticated');

-- All writes via service_role (backend uses supabaseAdmin which bypasses RLS)
