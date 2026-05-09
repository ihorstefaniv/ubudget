# UBudget — Сутності, зв'язки, проблеми, ідеї

> Живий документ. Схема БД актуальна на 2026-05-08 (`supabase/schema.csv`).
> Детальна схема: `CLAUDE.md`

---

## 🗺️ Всі таблиці БД

| Таблиця | Призначення | UI |
|---------|-------------|-----|
| `accounts` | Рахунки | ✅ /accounts, /transactions, /dashboard |
| `transactions` | Всі операції | ✅ /transactions, /dashboard, /budget |
| `credits` | Кредити | ✅ /credits |
| `deposits` | Депозити | ✅ /credits?tab=deposits |
| `budgets` | Місячні плани | ✅ /budget |
| `categories` | Кастомні категорії | ✅ /budget |
| `subcategories` | Підкатегорії | ⚠️ БД є, UI немає |
| `merchants` | Магазини з бонусами | ✅ /budget |
| `envelope_settings` | Налаштування конвертів | ✅ /envelopes |
| `envelope_weeks` | Тижні конвертів | ❌ таблицю дропнуто (П17) |
| `envelope_income_sources` | Джерела доходу | ❌ таблицю дропнуто (П18) |
| `stocks` | Акції | ✅ /investments |
| `bonds` | Облігації (ОВДП) | ✅ /investments |
| `real_estate` | Нерухомість | ✅ /investments |
| `businesses` | Бізнеси | ✅ /investments |
| `business_items` | Статті бізнесу | ✅ /investments |
| `business_employees` | Працівники бізнесу | ✅ /investments |
| `collections` | Колекції | ✅ /investments |
| `exchange_rates` | Кеш курсів валют | ✅ /api/nbu-rates, кешується в БД |
| `recurring_transactions` | Регулярні транзакції | ✅ /tools/recurring + cron |
| `shocks` | Фінансові потрясіння | ✅ /tools/shock |
| `profiles` | Профіль, налаштування | ✅ /settings |
| `user_modules` | Модулі (застарілий) | ❌ таблицю дропнуто (П21) |
| `fuel_prices_history` | Ціни на пальне | ✅ /tools/fuel-prices |
| `posts` / `post_comments` | Блог | ✅ адмін |
| `tickets` | Підтримка | ✅ /support |
| `activity_logs` / `admin_logs` / `error_logs` | Логи | ✅ адмін |
| `site_settings` | Налаштування сайту | ✅ адмін |
| `policy_backup_20260401` | Бекап RLS | ❌ таблицю дропнуто (П28) |

---

## ✅ ЩО ВИПРАВЛЕНО (всі 30 проблем)

| # | Проблема | Статус |
|---|----------|--------|
| П1 | `accounts.is_active` — дублює `is_archived` | ✅ DROP COLUMN (cleanup.sql) |
| П2 | Поля `credit_limit/interest_rate/payment_day` не використовувались в UI | ✅ Кредитна картка як тип рахунку |
| П3 | `accounts.bank` — невикористане поле | ✅ DROP COLUMN (cleanup.sql) |
| П4 | `transactions.category_id` — завжди NULL, код юзає `category_key` | ✅ DROP COLUMN (cleanup.sql) |
| П5 | Дві системи регулярних транзакцій | ✅ Закрито: різні призначення |
| П6 | `receipt_url` — upload не реалізовано | ✅ Закрито: вже є FileReader upload |
| П7 | Старі перекази з `to_amount = NULL` — тригер дасть неправильний баланс | ✅ `fix_null_to_amount.sql` |
| П8 | `exchange_rates` порожня, кожна сторінка робить 5 HTTP до НБУ | ✅ `/api/nbu-rates` кешує в БД |
| П9 | `lib/nbu-rates.ts` підтримував лише 3 валюти | ✅ Розширено до 5 (GBP, CHF додано) |
| П10 | `budgets.category_id` — дублює `category_key` | ✅ DROP COLUMN (cleanup.sql) |
| П11 | Дві паралельні системи категорій (key vs table) | ℹ️ Архітектурна особливість, закрито |
| П12 | `subcategories` — є в БД, UI не реалізовано | ✅ Закрито: UI є у /budget |
| П13 | Відкриття депозиту не зменшує баланс рахунку | ✅ DepositModal → expense транзакція |
| П14 | Відсотки по депозиту — лише вручну | ✅ Бейдж "% сьогодні" на депозитах |
| П15 | `credits` без `account_id` | ✅ Закрито: вибір рахунку при платежі |
| П16 | Платіж по кредиту — не атомарний | ✅ `pay_credit_rpc.sql` (RPC функція) |
| П17 | `envelope_weeks.transactions` — денормалізація | ✅ DROP TABLE (cleanup.sql) |
| П18 | `envelope_income_sources` — UI не використовує | ✅ DROP TABLE (cleanup.sql) |
| П19 | `profiles.envelope_mode` і `modules.envelopes` — дублювання | ✅ DROP COLUMN (cleanup.sql) |
| П20 | `profiles.currency` і `base_currency` — дублювання | ✅ DROP COLUMN (cleanup.sql) |
| П21 | `user_modules` — застаріла таблиця | ✅ DROP TABLE (cleanup.sql) |
| П22 | Купівля акцій/облігацій не створює транзакцію | ✅ StockModal/BondModal → expense tx |
| П23 | `stocks.current_price` — тільки вручну | ✅ `/api/cron/stock-prices` (Yahoo Finance) |
| П24 | Купони ОВДП не стають транзакціями | ✅ BondCouponModal + кнопка "Купон" |
| П25 | `collections` — два різних поняття (рахунок vs інвестиції) | ℹ️ Косметика, закрито |
| П26 | `shocks` UI невідомий | ✅ Закрито: є /tools/shock |
| П27 | `recurring_transactions` — немає UI і cron | ✅ /tools/recurring + /api/cron/recurring |
| П28 | `policy_backup_20260401` — тимчасова таблиця | ✅ DROP TABLE (cleanup.sql) |
| П29 | Старі NULL `to_amount` → некоректний відкат тригером | ✅ `fix_null_to_amount.sql` |
| П30 | Атомарність кредитного платежу | ✅ `pay_credit_rpc.sql` |

---

## 🔧 Міграції для Supabase (запустити вручну)

| Файл | Статус |
|------|--------|
| `supabase/migrations/cleanup.sql` | ▶️ запустити |
| `supabase/migrations/fix_null_to_amount.sql` | ▶️ запустити |
| `supabase/migrations/pay_credit_rpc.sql` | ▶️ запустити |
| `supabase/migrations/recurring_setup.sql` | ▶️ запустити |
| `supabase/migrations/balance_trigger.sql` | ▶️ запустити |
| `supabase/migrations/api_keys.sql` | ▶️ запустити |
| `supabase/migrations/tasks.sql` | ▶️ запустити |

---

## 💡 НОВИЙ БЕКЛОГ (після закриття всіх 30 проблем)

### 🟡 Функціональні покращення
- **Дашборд**: тренди витрат, прогноз до кінця місяця
- **Транзакції**: фільтр за категорією + пошук по нотатці
- **Конверти**: відображення підсумку тижня в дашборді
- **Бюджет**: автоматичне копіювання плану з минулого місяця при старті місяця
- **Звіти**: сторінка /reports з графіками по місяцях

### 🟢 Технічний борг
- **RLS на `merchants`**: зараз query фільтрується client-side по catIds; додати RLS policy `USING (user_id = auth.uid())` в Supabase
- **`subcategories` UI**: є таблиця і CRUD в /budget, але не відображається в транзакціях
- **PWA**: Service Worker для офлайн-доступу
