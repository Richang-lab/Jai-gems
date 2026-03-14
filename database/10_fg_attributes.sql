-- Migration 10: Add attribute_ids to Finished Goods
-- Finished Goods now shares the same attributes pool as Casting Inventory.

ALTER TABLE finished_goods ADD COLUMN IF NOT EXISTS attribute_ids UUID[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_finished_goods_attrs ON finished_goods USING GIN(attribute_ids);
