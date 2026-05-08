-- П7/П29: Виправлення старих переказів де to_amount IS NULL
-- Для переказів між рахунками ОДНІЄЇ валюти — to_amount = amount (коректно)
-- Для переказів між різними валютами — не можемо відновити курс, залишаємо NULL
-- але тригер тепер не буде падати (guard нижче в balance_trigger.sql)

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
