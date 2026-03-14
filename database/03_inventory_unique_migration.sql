-- Add unique constraints to product codes in inventory tables to ensure no duplicate entries
ALTER TABLE public.casting_inventory ADD CONSTRAINT casting_inventory_product_code_key UNIQUE (product_code);
ALTER TABLE public.wax_inventory ADD CONSTRAINT wax_inventory_product_code_key UNIQUE (product_code);
ALTER TABLE public.finished_goods ADD CONSTRAINT fg_casting_product_code_key UNIQUE (casting_product_code);
