-- Run in Supabase SQL Editor

-- Link BOM (специфікація) to a technological process
ALTER TABLE erp_bom
  ADD COLUMN IF NOT EXISTS process_id uuid REFERENCES erp_processes(id) ON DELETE SET NULL;

-- Trace stock movements back to the production order that generated them
ALTER TABLE erp_stock_movements
  ADD COLUMN IF NOT EXISTS production_order_id uuid REFERENCES erp_production_orders(id) ON DELETE SET NULL;
