-- Add image_url, category_id, and attribute_ids to wax_inventory

ALTER TABLE public.wax_inventory ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.wax_inventory 
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

ALTER TABLE public.wax_inventory 
    ADD COLUMN IF NOT EXISTS attribute_ids UUID[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_wax_inventory_attrs ON public.wax_inventory USING GIN(attribute_ids);
