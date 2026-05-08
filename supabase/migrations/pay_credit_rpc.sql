-- П16/П30: Атомарний платіж по кредиту через RPC (BEGIN/COMMIT)
-- Замінює два окремих запити з клієнта (INSERT + UPDATE без транзакції)

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
  -- Перевірка що кредит належить юзеру
  SELECT currency INTO v_currency
  FROM credits
  WHERE id = p_credit_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit not found or access denied';
  END IF;

  -- Перевірка що рахунок належить юзеру
  IF NOT EXISTS (
    SELECT 1 FROM accounts WHERE id = p_account_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Account not found or access denied';
  END IF;

  -- Вставка транзакції витрати (тригер оновить баланс рахунку)
  INSERT INTO transactions (
    user_id, type, category_key, account_id,
    amount, currency, exchange_rate, transaction_date, note
  ) VALUES (
    p_user_id, 'expense', 'debt', p_account_id,
    p_amount, v_currency, 1, p_date, p_note
  );

  -- Зменшення залишку боргу (атомарно з попередньою операцією)
  UPDATE credits
  SET remaining_amount = GREATEST(0, remaining_amount - p_amount),
      updated_at = now()
  WHERE id = p_credit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION pay_credit TO authenticated;
