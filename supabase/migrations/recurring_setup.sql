-- П27: Додаємо category_key до recurring_transactions (UI використовує text-ключі, не FK)
ALTER TABLE recurring_transactions ADD COLUMN IF NOT EXISTS category_key text;

-- RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage own recurring"
  ON recurring_transactions FOR ALL USING (auth.uid() = user_id);
