-- =============================================
-- Jai Gems — Data Cleanup & Uniqueness Fix
-- Run this in Supabase SQL Editor to find and resolve duplicates
-- =============================================

-- 1. Find duplicate Casting Codes in Finished Goods
SELECT casting_product_code, COUNT(*) 
FROM public.finished_goods 
WHERE casting_product_code IS NOT NULL
GROUP BY casting_product_code 
HAVING COUNT(*) > 1;

-- 2. IMPORTANT: You must manually fix the duplicates in the Supabase Table Editor 
-- before the next step will work. Change the Casting Codes for the duplicates.

-- 3. Once fixed, run this to enforce the rule strictly:
-- ALTER TABLE public.finished_goods ADD CONSTRAINT fg_casting_product_code_key UNIQUE (casting_product_code);
-- ALTER TABLE public.wax_inventory ADD CONSTRAINT wax_inventory_product_code_key UNIQUE (product_code);
-- ALTER TABLE public.casting_inventory ADD CONSTRAINT casting_inventory_product_code_key UNIQUE (product_code);
