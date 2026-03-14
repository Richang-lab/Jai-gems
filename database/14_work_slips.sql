-- =============================================
-- Jai Gems — Database Migration 14: Work Slips
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. Printable Work Slips Table
-- Represents a single physical 10x15 PDF printed.
-- =============================================
CREATE TABLE IF NOT EXISTS public.work_slips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_number      TEXT UNIQUE NOT NULL,     -- e.g., WAX-250311-001
  slip_type        TEXT NOT NULL CHECK (slip_type IN ('Wax', 'Tree', 'Casting', 'Jhalai', 'Filing', 'Polishing', 'Plating', 'Stone')),
  order_type       TEXT NOT NULL CHECK (order_type IN ('finished_good', 'casting')),
  issued_at        TIMESTAMPTZ DEFAULT NOW(),
  created_by       UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- =============================================
-- 2. Work Slip Items (Products assigned to a slip)
-- =============================================
CREATE TABLE IF NOT EXISTS public.work_slip_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_id          UUID NOT NULL REFERENCES public.work_slips(id) ON DELETE CASCADE,
  order_item_id    UUID NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
  
  -- Cached snapshot fields at exact time of printing to prevent history mutations
  client_nickname  TEXT NOT NULL,
  priority         TEXT DEFAULT 'Normal',
  assigned_qty     NUMERIC(10, 3) NOT NULL, -- The original qty + minimum 10 buffer math rule
  
  -- Tracking Progress
  status           TEXT DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed')),
  completed_qty    NUMERIC(10, 3) DEFAULT 0,
  loss_qty         NUMERIC(10, 3) DEFAULT 0,
  
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. Update Order Items to support Urgent flag
-- (Added per user request for future module, adding column now so DB is ready)
-- =============================================
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- =============================================
-- 4. Enable Row Level Security
-- =============================================
ALTER TABLE public.work_slips       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_slip_items  ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read slips
CREATE POLICY "auth read work_slips"       ON public.work_slips       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth read work_slip_items"  ON public.work_slip_items  FOR SELECT USING (auth.role() = 'authenticated');

-- Writes managed by backend service role.
