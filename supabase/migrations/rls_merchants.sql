-- RLS на таблицю merchants
-- Зараз фільтрація відбувається client-side по category_id.
-- Цей скрипт додає RLS policy для серверного захисту.

-- Увімкнути RLS (якщо ще не увімкнено)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Видалити стару policy якщо є
DROP POLICY IF EXISTS "merchants_user" ON merchants;

-- Користувач бачить тільки свої merchants (user_id = auth.uid())
CREATE POLICY "merchants_user" ON merchants
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
