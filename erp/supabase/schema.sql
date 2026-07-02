-- ERP Schema
-- Run in Supabase SQL Editor

-- ─── Core ───────────────────────────────────────────────────────────────────

CREATE TABLE erp_companies (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  owner_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_currency text        NOT NULL DEFAULT 'UAH',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp_company_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('owner','admin','member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- ─── Catalog ─────────────────────────────────────────────────────────────────

CREATE TABLE erp_units (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  short_name text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp_products (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  sku          text,
  type         text        NOT NULL DEFAULT 'product' CHECK (type IN ('product','service','material')),
  unit_id      uuid        REFERENCES erp_units(id),
  price        numeric(14,2),
  cost_price   numeric(14,2),
  currency     text        NOT NULL DEFAULT 'UAH',
  is_archived  boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── Warehouse ───────────────────────────────────────────────────────────────

CREATE TABLE erp_warehouses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  address     text,
  is_archived boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp_stock (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES erp_products(id) ON DELETE CASCADE,
  warehouse_id uuid        NOT NULL REFERENCES erp_warehouses(id) ON DELETE CASCADE,
  qty          numeric(14,4) NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE erp_counterparties (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  type        text        NOT NULL DEFAULT 'both' CHECK (type IN ('supplier','buyer','both')),
  phone       text,
  email       text,
  address     text,
  tax_code    text,
  notes       text,
  is_archived boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp_stock_movements (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  product_id       uuid        NOT NULL REFERENCES erp_products(id),
  warehouse_id     uuid        NOT NULL REFERENCES erp_warehouses(id),
  type             text        NOT NULL CHECK (type IN ('in','out','transfer','adjustment','writeoff')),
  qty              numeric(14,4) NOT NULL,
  price            numeric(14,2),
  currency         text        NOT NULL DEFAULT 'UAH',
  counterparty_id  uuid        REFERENCES erp_counterparties(id),
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── Documents ───────────────────────────────────────────────────────────────

CREATE TABLE erp_invoices (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  number           text        NOT NULL,
  type             text        NOT NULL CHECK (type IN ('purchase','sale')),
  status           text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','cancelled')),
  counterparty_id  uuid        REFERENCES erp_counterparties(id),
  date             date        NOT NULL DEFAULT CURRENT_DATE,
  total_amount     numeric(14,2) NOT NULL DEFAULT 0,
  currency         text        NOT NULL DEFAULT 'UAH',
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp_invoice_items (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid          NOT NULL REFERENCES erp_invoices(id) ON DELETE CASCADE,
  product_id   uuid          NOT NULL REFERENCES erp_products(id),
  warehouse_id uuid          REFERENCES erp_warehouses(id),
  qty          numeric(14,4) NOT NULL,
  price        numeric(14,2) NOT NULL,
  total        numeric(14,4) GENERATED ALWAYS AS (qty * price) STORED
);

-- ─── CRM ─────────────────────────────────────────────────────────────────────

CREATE TABLE erp_crm_clients (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  phone            text,
  email            text,
  address          text,
  notes            text,
  counterparty_id  uuid        REFERENCES erp_counterparties(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp_crm_deals (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  title               text        NOT NULL,
  client_id           uuid        REFERENCES erp_crm_clients(id) ON DELETE SET NULL,
  stage               text        NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','contact','proposal','negotiation','won','lost')),
  amount              numeric(14,2),
  currency            text        NOT NULL DEFAULT 'UAH',
  expected_close_date date,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp_crm_activities (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  deal_id     uuid        REFERENCES erp_crm_deals(id) ON DELETE SET NULL,
  client_id   uuid        REFERENCES erp_crm_clients(id) ON DELETE SET NULL,
  type        text        NOT NULL CHECK (type IN ('call','meeting','task','email','note')),
  title       text        NOT NULL,
  description text,
  due_date    timestamptz,
  is_done     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Production ──────────────────────────────────────────────────────────────

CREATE TABLE erp_bom (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid          NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  product_id   uuid          NOT NULL REFERENCES erp_products(id) ON DELETE CASCADE,
  name         text          NOT NULL,
  qty_output   numeric(14,4) NOT NULL DEFAULT 1,
  created_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE erp_bom_items (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id      uuid          NOT NULL REFERENCES erp_bom(id) ON DELETE CASCADE,
  material_id uuid          NOT NULL REFERENCES erp_products(id),
  qty         numeric(14,4) NOT NULL,
  unit_id     uuid          REFERENCES erp_units(id)
);

CREATE TABLE erp_production_orders (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid          NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  number         text          NOT NULL,
  product_id     uuid          NOT NULL REFERENCES erp_products(id),
  bom_id         uuid          REFERENCES erp_bom(id),
  qty            numeric(14,4) NOT NULL,
  status         text          NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','done','cancelled')),
  warehouse_id   uuid          REFERENCES erp_warehouses(id),
  planned_date   date,
  completed_date date,
  notes          text,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE erp_processes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  steps       jsonb       NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Finance ─────────────────────────────────────────────────────────────────

CREATE TABLE erp_finance_accounts (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid          NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  name        text          NOT NULL,
  type        text          NOT NULL DEFAULT 'bank' CHECK (type IN ('cash','bank','card')),
  currency    text          NOT NULL DEFAULT 'UAH',
  balance     numeric(14,2) NOT NULL DEFAULT 0,
  is_archived boolean       NOT NULL DEFAULT false,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE erp_finance_transactions (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid          NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  account_id       uuid          NOT NULL REFERENCES erp_finance_accounts(id),
  type             text          NOT NULL CHECK (type IN ('income','expense','transfer')),
  amount           numeric(14,2) NOT NULL,
  currency         text          NOT NULL DEFAULT 'UAH',
  category         text,
  counterparty_id  uuid          REFERENCES erp_counterparties(id),
  invoice_id       uuid          REFERENCES erp_invoices(id),
  date             date          NOT NULL DEFAULT CURRENT_DATE,
  notes            text,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- ─── RLS Helper ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION erp_is_member(company uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM erp_company_members
    WHERE company_id = company AND user_id = auth.uid()
  );
$$;

-- ─── Enable RLS ──────────────────────────────────────────────────────────────

ALTER TABLE erp_companies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_company_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_units               ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_warehouses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock               ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock_movements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_counterparties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_invoice_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_crm_clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_crm_deals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_crm_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bom                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bom_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_production_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_processes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_finance_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_finance_transactions ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ────────────────────────────────────────────────────────────

-- erp_companies
CREATE POLICY "companies_select" ON erp_companies FOR SELECT USING (erp_is_member(id));
CREATE POLICY "companies_insert" ON erp_companies FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "companies_update" ON erp_companies FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "companies_delete" ON erp_companies FOR DELETE USING (owner_id = auth.uid());

-- erp_company_members
CREATE POLICY "members_select" ON erp_company_members FOR SELECT USING (erp_is_member(company_id));
CREATE POLICY "members_insert" ON erp_company_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM erp_companies WHERE id = company_id AND owner_id = auth.uid())
);
CREATE POLICY "members_delete" ON erp_company_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM erp_companies WHERE id = company_id AND owner_id = auth.uid())
  OR user_id = auth.uid()
);

-- All tables with company_id: full access for members
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'erp_units','erp_products','erp_warehouses','erp_stock','erp_stock_movements',
    'erp_counterparties','erp_invoices','erp_crm_clients','erp_crm_deals',
    'erp_crm_activities','erp_bom','erp_production_orders','erp_processes',
    'erp_finance_accounts','erp_finance_transactions'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "%s_all" ON %s FOR ALL USING (erp_is_member(company_id)) WITH CHECK (erp_is_member(company_id))',
      t, t
    );
  END LOOP;
END;
$$;

-- invoice_items (no company_id, join via invoice)
CREATE POLICY "invoice_items_all" ON erp_invoice_items FOR ALL
  USING (EXISTS (SELECT 1 FROM erp_invoices i WHERE i.id = invoice_id AND erp_is_member(i.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM erp_invoices i WHERE i.id = invoice_id AND erp_is_member(i.company_id)));

-- bom_items (no company_id, join via bom)
CREATE POLICY "bom_items_all" ON erp_bom_items FOR ALL
  USING (EXISTS (SELECT 1 FROM erp_bom b WHERE b.id = bom_id AND erp_is_member(b.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM erp_bom b WHERE b.id = bom_id AND erp_is_member(b.company_id)));

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- Auto-add owner as member when company is created
CREATE OR REPLACE FUNCTION erp_on_company_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO erp_company_members (company_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER erp_company_created
  AFTER INSERT ON erp_companies
  FOR EACH ROW EXECUTE FUNCTION erp_on_company_created();

-- Sync finance account balance on transaction changes
CREATE OR REPLACE FUNCTION erp_sync_account_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE erp_finance_accounts
    SET balance = balance - (CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END)
    WHERE id = OLD.account_id;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.account_id != NEW.account_id THEN
    UPDATE erp_finance_accounts
    SET balance = balance - (CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END)
    WHERE id = OLD.account_id;
  END IF;
  UPDATE erp_finance_accounts
  SET balance = balance + (CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END)
  WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER erp_account_balance_sync
  AFTER INSERT OR UPDATE OR DELETE ON erp_finance_transactions
  FOR EACH ROW EXECUTE FUNCTION erp_sync_account_balance();

-- Sync stock on movement insert
CREATE OR REPLACE FUNCTION erp_sync_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE delta numeric;
BEGIN
  delta := CASE
    WHEN NEW.type = 'in'  THEN  NEW.qty
    WHEN NEW.type IN ('out','writeoff') THEN -NEW.qty
    ELSE 0
  END;
  IF delta != 0 THEN
    INSERT INTO erp_stock (company_id, product_id, warehouse_id, qty)
    VALUES (NEW.company_id, NEW.product_id, NEW.warehouse_id, delta)
    ON CONFLICT (product_id, warehouse_id)
    DO UPDATE SET qty = erp_stock.qty + delta, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER erp_stock_sync
  AFTER INSERT ON erp_stock_movements
  FOR EACH ROW EXECUTE FUNCTION erp_sync_stock();
