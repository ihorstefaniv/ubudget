-- Run in Supabase SQL Editor

ALTER TABLE erp_counterparties
  ADD COLUMN IF NOT EXISTS bank_name     text,
  ADD COLUMN IF NOT EXISTS bank_iban     text,
  ADD COLUMN IF NOT EXISTS payment_terms text CHECK (payment_terms IN ('prepayment','net7','net14','net30','net60','postpayment'));

CREATE TABLE IF NOT EXISTS erp_counterparty_contacts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  counterparty_id  uuid        NOT NULL REFERENCES erp_counterparties(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  position         text,
  phone            text,
  email            text,
  is_primary       boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_counterparty_contracts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  counterparty_id     uuid        NOT NULL REFERENCES erp_counterparties(id) ON DELETE CASCADE,
  title               text        NOT NULL,
  number              text,
  start_date          date,
  end_date            date,
  notify_days_before  int         NOT NULL DEFAULT 30,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE erp_counterparty_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_counterparty_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "counterparty_contacts_all" ON erp_counterparty_contacts FOR ALL
  USING (erp_is_member(company_id)) WITH CHECK (erp_is_member(company_id));
CREATE POLICY "counterparty_contracts_all" ON erp_counterparty_contracts FOR ALL
  USING (erp_is_member(company_id)) WITH CHECK (erp_is_member(company_id));
