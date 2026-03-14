-- =============================================
-- Jai Gems — Consolidated Casting Inventory Fix
-- Run this in your Supabase SQL Editor to resolve the "product_code" null error.
-- =============================================

-- 1. Make product_code optional (nullable)
ALTER TABLE public.casting_inventory ALTER COLUMN product_code DROP NOT NULL;

-- 2. Ensure casting_product_code is mandatory (NOT NULL)
-- If you have existing nulls here, you must give them a value first!
ALTER TABLE public.casting_inventory ALTER COLUMN casting_product_code SET NOT NULL;

-- 3. Add image support if not already there
ALTER TABLE public.casting_inventory ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Final check: Ensure constraints are consistent
-- (This just verifies the unique constraint we added earlier is active)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'casting_inventory_casting_product_code_key') THEN
        ALTER TABLE public.casting_inventory ADD CONSTRAINT casting_inventory_casting_product_code_key UNIQUE (casting_product_code);
    END IF;
END $$;
