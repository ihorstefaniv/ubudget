-- П28: Видалення тимчасового бекапу RLS-політик
DROP TABLE IF EXISTS policy_backup_20260401;

-- П21: Видалення застарілої таблиці user_modules (замінена profiles.modules jsonb)
DROP TABLE IF EXISTS user_modules;

-- П1: Видалення дубльованого поля is_active з accounts (використовується is_archived)
-- Перед запуском переконатись що код більше не посилається на accounts.is_active
ALTER TABLE accounts DROP COLUMN IF EXISTS is_active;

-- П4: Видалення невикористаного category_id з transactions (код використовує category_key)
ALTER TABLE transactions DROP COLUMN IF EXISTS category_id;

-- П19: Видалення застарілого envelope_mode з profiles (замінено modules.envelopes jsonb)
ALTER TABLE profiles DROP COLUMN IF EXISTS envelope_mode;

-- П20: Видалення дубльованого currency з profiles (використовується base_currency)
ALTER TABLE profiles DROP COLUMN IF EXISTS currency;

-- П17: Видалення невикористаної таблиці envelope_weeks (UI читає з transactions наживо)
DROP TABLE IF EXISTS envelope_weeks;

-- П18: Видалення envelope_income_sources (UI конвертів не читає цю таблицю)
DROP TABLE IF EXISTS envelope_income_sources;

-- П3: Видалення accounts.bank (банк вже входить у назву рахунку при створенні)
ALTER TABLE accounts DROP COLUMN IF EXISTS bank;

-- П10: Видалення budgets.category_id (код використовує category_key, не FK)
ALTER TABLE budgets DROP COLUMN IF EXISTS category_id;

-- merchants.user_id: заповнити NULL-значення через JOIN з categories
-- (preset-заклади вставлялись без user_id — тепер успадковують від categories.user_id)
UPDATE merchants m
SET user_id = c.user_id
FROM categories c
WHERE m.category_id = c.id
  AND m.user_id IS NULL;
