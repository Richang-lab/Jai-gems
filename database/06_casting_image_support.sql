-- =============================================
-- Jai Gems — Migration: Add Image Support to Casting
-- =============================================

ALTER TABLE public.casting_inventory ADD COLUMN IF NOT EXISTS image_url TEXT;
