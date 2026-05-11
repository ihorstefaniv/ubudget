-- ================================================================
-- UBudget: Комбінований скрипт для запуску в Supabase SQL Editor
-- Всі команди ідемпотентні (IF NOT EXISTS / OR REPLACE / IF EXISTS)
-- Порядок: нові колонки → тригер → дані-фікси → RPC → прибирання → нові таблиці → RLS
-- ================================================================


-- ================================================================
-- 1. НОВІ КОЛОНКИ у transactions
-- ================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS subcategory_id uuid
  REFERENCES subcategories(id) ON DELETE SET NULL;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS merchant_name text;

-- Скинути пресетні (не кастомні) мерчанти — юзер обирає сам
UPDATE merchants SET is_selected = false WHERE is_custom = false;


-- ================================================================
-- 2. BALANCE TRIGGER
--    Додає to_amount (якщо нема), функцію тригера, тригер
-- ================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS to_amount numeric;

CREATE OR REPLACE FUNCTION sync_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

  -- ── INSERT нової активної транзакції ──────────────────────────
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN

    IF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;

    ELSIF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;

    ELSIF NEW.type = 'transfer' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      IF NEW.to_account_id IS NOT NULL THEN
        UPDATE accounts
          SET balance = balance + COALESCE(NEW.to_amount, NEW.amount)
          WHERE id = NEW.to_account_id;
      END IF;
    END IF;

  -- ── UPDATE транзакції ─────────────────────────────────────────
  ELSIF TG_OP = 'UPDATE' THEN

    -- М'яке видалення: deleted_at щойно виставили → відкотити ефект
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN

      IF OLD.type = 'income' THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;

      ELSIF OLD.type = 'expense' THEN
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;

      ELSIF OLD.type = 'transfer' THEN
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        IF OLD.to_account_id IS NOT NULL THEN
          UPDATE accounts
            SET balance = balance - COALESCE(OLD.to_amount, OLD.amount)
            WHERE id = OLD.to_account_id;
        END IF;
      END IF;

    -- Редагування активної транзакції: відкотити старе, застосувати нове
    ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL THEN

      -- Відкат старого
      IF OLD.type = 'income' THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'transfer' THEN
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        IF OLD.to_account_id IS NOT NULL THEN
          UPDATE accounts
            SET balance = balance - COALESCE(OLD.to_amount, OLD.amount)
            WHERE id = OLD.to_account_id;
        END IF;
      END IF;

      -- Застосування нового
      IF NEW.type = 'income' THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transfer' THEN
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        IF NEW.to_account_id IS NOT NULL THEN
          UPDATE accounts
            SET balance = balance + COALESCE(NEW.to_amount, NEW.amount)
            WHERE id = NEW.to_account_id;
        END IF;
      END IF;

    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_account_balance ON transactions;
CREATE TRIGGER trg_sync_account_balance
  AFTER INSERT OR UPDATE
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_account_balance();


-- ================================================================
-- 3. ФІКС ДАНИХ: заповнити to_amount для старих переказів однієї валюти
-- ================================================================

UPDATE transactions t
SET to_amount = t.amount
WHERE t.type = 'transfer'
  AND t.to_amount IS NULL
  AND t.to_account_id IS NOT NULL
  AND t.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM accounts a1
    JOIN accounts a2 ON a2.id = t.to_account_id
    WHERE a1.id = t.account_id
      AND a1.currency = a2.currency
  );


-- ================================================================
-- 4. RPC: атомарний платіж по кредиту
-- ================================================================

CREATE OR REPLACE FUNCTION pay_credit(
  p_credit_id   uuid,
  p_account_id  uuid,
  p_amount      numeric,
  p_date        date,
  p_note        text,
  p_user_id     uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_currency text;
BEGIN
  SELECT currency INTO v_currency
  FROM credits
  WHERE id = p_credit_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit not found or access denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM accounts WHERE id = p_account_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Account not found or access denied';
  END IF;

  INSERT INTO transactions (
    user_id, type, category_key, account_id,
    amount, currency, exchange_rate, transaction_date, note
  ) VALUES (
    p_user_id, 'expense', 'debt', p_account_id,
    p_amount, v_currency, 1, p_date, p_note
  );

  UPDATE credits
  SET remaining_amount = GREATEST(0, remaining_amount - p_amount),
      updated_at = now()
  WHERE id = p_credit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION pay_credit TO authenticated;


-- ================================================================
-- 5. RECURRING TRANSACTIONS: додати category_key + RLS
-- ================================================================

ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS category_key text;

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recurring_transactions'
      AND policyname = 'Users manage own recurring'
  ) THEN
    CREATE POLICY "Users manage own recurring"
      ON recurring_transactions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- ================================================================
-- 6. ПРИБИРАННЯ: видалення застарілих колонок і таблиць
-- ================================================================

-- Таблиці (безпечно — IF EXISTS)
DROP TABLE IF EXISTS policy_backup_20260401;
DROP TABLE IF EXISTS user_modules;
DROP TABLE IF EXISTS envelope_weeks;
DROP TABLE IF EXISTS envelope_income_sources;

-- Колонки accounts
ALTER TABLE accounts DROP COLUMN IF EXISTS is_active;
ALTER TABLE accounts DROP COLUMN IF EXISTS bank;

-- Колонки transactions
ALTER TABLE transactions DROP COLUMN IF EXISTS category_id;

-- Колонки profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS envelope_mode;
ALTER TABLE profiles DROP COLUMN IF EXISTS currency;

-- Колонки budgets
ALTER TABLE budgets DROP COLUMN IF EXISTS category_id;

-- Заповнити merchants.user_id де NULL
UPDATE merchants m
SET user_id = c.user_id
FROM categories c
WHERE m.category_id = c.id
  AND m.user_id IS NULL;


-- ================================================================
-- 7. НОВІ ТАБЛИЦІ: api_keys, tasks
-- ================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  key           text        NOT NULL UNIQUE,
  name          text        NOT NULL,
  plan          text        DEFAULT 'free' CHECK (plan IN ('free','pro','business')),
  is_active     boolean     DEFAULT true,
  requests_total bigint     DEFAULT 0,
  created_by    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  last_used_at  timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'admins_all'
  ) THEN
    CREATE POLICY "admins_all" ON api_keys
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('admin','superadmin')
        )
      );
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text        NOT NULL,
  description   text,
  type          text        DEFAULT 'task'    CHECK (type    IN ('bug','feature','task','chore','idea')),
  status        text        DEFAULT 'backlog' CHECK (status  IN ('backlog','todo','in_progress','review','done')),
  priority      text        DEFAULT 'medium'  CHECK (priority IN ('low','medium','high','critical')),
  assignee      text,
  due_date      date,
  estimated_hrs numeric,
  logged_hrs    numeric     DEFAULT 0,
  created_by    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'admins_all'
  ) THEN
    CREATE POLICY "admins_all" ON tasks
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
            AND role IN ('admin','superadmin')
        )
      );
  END IF;
END $$;


-- ================================================================
-- 8. RLS: merchants
-- ================================================================

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchants_user" ON merchants;

CREATE POLICY "merchants_user" ON merchants
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ================================================================
-- ГОТОВО
-- ================================================================
