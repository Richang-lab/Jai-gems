-- =============================================
-- Jai Gems — Migration: Optional Product Code for Casting
-- =============================================

-- Make product_code optional in casting_inventory
ALTER TABLE public.casting_inventory ALTER COLUMN product_code DROP NOT NULL;

-- Ensure casting_product_code is NOT NULL for casting_inventory since it's the new primary identifier
ALTER TABLE public.casting_inventory ALTER COLUMN casting_product_code SET NOT NULL;
