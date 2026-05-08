-- ================================================================
-- UBudget: Balance Trigger Migration
-- Запустити в Supabase SQL Editor (або через Supabase CLI)
-- ================================================================

-- 1. Додаємо колонку to_amount до транзакцій (сума яку отримує to_account при переказі)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS to_amount numeric;

-- ================================================================
-- 2. Функція тригера — синхронізує баланс рахунку при зміні транзакцій
-- ================================================================

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

-- ================================================================
-- 3. Тригер на таблиці transactions
-- ================================================================

DROP TRIGGER IF EXISTS trg_sync_account_balance ON transactions;

CREATE TRIGGER trg_sync_account_balance
  AFTER INSERT OR UPDATE
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_account_balance();

-- ================================================================
-- 4. (ОПЦІЙНО) Перерахунок балансів з нуля на основі всіх транзакцій
--    УВАГА: скидає поточні баланси! Запускати тільки якщо впевнені.
--    Розкоментувати і виконати окремо:
-- ================================================================

/*
UPDATE accounts a
SET balance = COALESCE((
  SELECT
    SUM(CASE WHEN t.type = 'income'   THEN  t.amount
             WHEN t.type = 'expense'  THEN -t.amount
             WHEN t.type = 'transfer' AND t.account_id = a.id    THEN -t.amount
             WHEN t.type = 'transfer' AND t.to_account_id = a.id THEN  COALESCE(t.to_amount, t.amount)
             ELSE 0 END)
  FROM transactions t
  WHERE (t.account_id = a.id OR t.to_account_id = a.id)
    AND t.deleted_at IS NULL
    AND t.user_id = a.user_id
), 0);
*/
