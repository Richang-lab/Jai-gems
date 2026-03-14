-- Migration 09: Add Categories and Attributes to Wax Inventory
-- This ensures consistency between Wax and Casting inventory schemas.

ALTER TABLE wax_inventory ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);
ALTER TABLE wax_inventory ADD COLUMN IF NOT EXISTS attribute_ids UUID[] DEFAULT '{}';
ALTER TABLE wax_inventory ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for faster filtering by category
CREATE INDEX IF NOT EXISTS idx_wax_inventory_category ON wax_inventory(category_id);
