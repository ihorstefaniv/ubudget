-- Run in Supabase SQL Editor

ALTER TABLE erp_products
  ADD COLUMN IF NOT EXISTS category    text,
  ADD COLUMN IF NOT EXISTS min_stock   numeric(14,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE erp_stock_movements
  ADD COLUMN IF NOT EXISTS reason text;

CREATE TABLE IF NOT EXISTS erp_inventories (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  warehouse_id uuid        NOT NULL REFERENCES erp_warehouses(id),
  date         date        NOT NULL DEFAULT CURRENT_DATE,
  status       text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_inventory_items (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid          NOT NULL REFERENCES erp_inventories(id) ON DELETE CASCADE,
  product_id   uuid          NOT NULL REFERENCES erp_products(id),
  expected_qty numeric(14,4) NOT NULL DEFAULT 0,
  actual_qty   numeric(14,4)
);

ALTER TABLE erp_inventories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventories_all" ON erp_inventories FOR ALL
  USING (erp_is_member(company_id)) WITH CHECK (erp_is_member(company_id));

CREATE POLICY "inventory_items_all" ON erp_inventory_items FOR ALL
  USING  (EXISTS (SELECT 1 FROM erp_inventories i WHERE i.id = inventory_id AND erp_is_member(i.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM erp_inventories i WHERE i.id = inventory_id AND erp_is_member(i.company_id)));
