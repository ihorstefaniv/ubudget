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
