# UBudget Project

## Мова
Завжди відповідай українською мовою.

## Стек
- Next.js 15, TypeScript, Tailwind v4, Supabase
- UI компоненти: components/ui/
- Auth: @supabase/ssr, lib/supabase/client.ts
- Курси валют: lib/nbu-rates.ts (NBU API, fetchNbuRates, rateFor)

## Структура
- app/(app)/ — авторизована зона
- app/(app)/dashboard — головна
- app/(app)/accounts — рахунки
- app/(app)/transactions — транзакції
- app/(app)/credits — кредити і депозити (tabs)
- app/(app)/budget — бюджет
- app/(app)/envelopes — метод конвертів
- app/(app)/investments — інвестиції
- app/(app)/tools/ — інструменти (health, history, fuel-prices тощо)
- app/(landing)/ — публічна частина
- app/(landing)/free/tools/ — публічні калькулятори

## Правила
- Не дублюй код — імпортуй компоненти
- Використовуй raw <select> замість UI Select
- Next.js 15: params і searchParams — async
- Курси валют: завжди використовувати fetchNbuRates() + rateFor(), НЕ хардкодити
- Баланс рахунків: оновлюється DB-тригером sync_account_balance, НЕ client-side

## БД (Supabase) — ключові таблиці

### Фінансові сутності
| Таблиця | Призначення | Ключові поля |
|---------|-------------|--------------|
| `accounts` | Рахунки | type, balance, currency, credit_limit, is_archived |
| `transactions` | Операції | type(income/expense/transfer), amount, currency, exchange_rate, account_id, to_account_id, to_amount, category_key, deleted_at |
| `credits` | Кредити | type, total_amount, remaining_amount, monthly_payment, payment_day, is_archived |
| `deposits` | Депозити | amount, interest_rate, capitalization, coupon_period, is_archived |
| `budgets` | Плани витрат | category_key, month, year, plan_amount |
| `envelope_settings` | Конверти | is_active, weeks_count, mandatory(jsonb), month, year |
| `envelope_weeks` | Тижні конвертів | budget, spent, carry, transactions(jsonb) |
| `envelope_income_sources` | Доходи для конвертів | label, amount, expected_day, received |

### Інвестиції
| Таблиця | Ключові поля |
|---------|--------------|
| `stocks` | ticker, quantity, buy_price, current_price, currency |
| `bonds` | type(ovdp/corporate), amount, interest_rate, maturity_date |
| `real_estate` | buy_price, current_price, rental_income |
| `businesses` + `business_items` + `business_employees` | share, section(income/expense/asset) |
| `collections` | category, buy_price, expected_price, status(owned/sold) |

### Категорії
| Таблиця | Призначення |
|---------|-------------|
| `categories` | Кастомні категорії (budget page) |
| `subcategories` | Підкатегорії (є в БД, UI не реалізовано) |
| `merchants` | Магазини з бонусами |

### Системні
| Таблиця | Призначення |
|---------|-------------|
| `profiles` | Профіль: modules(jsonb), notifications(jsonb), base_currency |
| `exchange_rates` | Кеш курсів НБУ (є в БД, поки не використовується) |
| `recurring_transactions` | Регулярні транзакції (є в БД, UI не реалізовано) |
| `shocks` | Фінансові потрясіння (є в БД, UI не відомий) |
| `fuel_prices_history` | Ціни на пальне |

### Важливі поля accounts (для кредитної картки як рахунку)
accounts вже має: `credit_limit`, `interest_rate`, `payment_day`, `end_date` — UI не використовує!

### Важливі особливості
- `transactions.category_key` — рядковий ключ (хардкод в lib/category-registry.ts), НЕ FK
- `transactions.category_id` — FK до `categories` (не використовується в поточному UI)
- `profiles.modules` — jsonb, джерело правди для активних модулів (НЕ user_modules таблиця)
- `accounts.balance` — оновлюється тригером `sync_account_balance` при INSERT/UPDATE на transactions
- `transactions.to_amount` — сума яку отримує to_account при переказі між різновалютними рахунками
- `deposits` — не має FK на accounts (немає прямого зв'язку)
- `credits` — не має FK на accounts (платіж через UI → expense транзакція)

## Повна схема БД
Файл: supabase/schema.csv (актуальна на 2026-05-08)

## Детальний аналіз сутностей
Файл: ENTITIES.md
