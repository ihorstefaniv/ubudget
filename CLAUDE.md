# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Мова
Завжди відповідай українською мовою.

## Команди

```bash
npm run dev      # запустити dev-сервер
npm run build    # production build
npm run lint     # ESLint перевірка
```

Тестів немає. Перевірка — через `npm run build` і `npm run lint`.

## Стек
- Next.js 15 (App Router), TypeScript, Tailwind v4, Supabase
- Деплой: Vercel (vercel.json містить cron-задачі)

## Архітектура

### Route groups
- `app/(app)/` — авторизована зона. Layout `"use client"` — перевіряє auth через `supabase.auth.getUser()`, редіректить на `/login`. Навігація залежить від `profiles.modules`.
- `app/(app)/admin/` — адмін-панель зі своїм layout (окремо від основного); доступ за `profiles.role`.
- `app/(auth)/` — login/register (публічні).
- `app/(landing)/` — публічна частина, включно з `free/tools/` — калькулятори без авторизації.
- `app/api/` — API routes: `/api/nbu-rates`, `/api/fuel-prices`, `/api/geocode`, `/api/pwa-manifest`, `/api/sw`, cron-задачі в `/api/cron/`.

### Supabase clients
Два варіанти — **ніколи не плутати**:
- `lib/supabase/client.ts` → `createClient()` — браузер (`createBrowserClient`)
- `lib/supabase/server.ts` → `createClient()` — server components / API routes (`createServerClient` + `cookies()`)

Auth-дії (signUp, signIn, signOut, getProfile) — в `lib/auth.ts`, використовують browser client.

### Система модулів і фіч — два окремі механізми

**1. Модулі** (`profiles.modules` jsonb) — керують **видимістю пунктів навігації**:
- Ключі: `budget`, `credits`, `investments`, `envelopes`, `household`
- Читаються в `app/(app)/layout.tsx` при завантаженні; `moduleKey: null` → пункт завжди видимий
- Вмикаються/вимикаються в налаштуваннях юзера

**2. Фіча-флаги** (`site_settings` таблиця) — керують **доступом до розділів** через `<FeatureGate>`:
- Ключі: `feature_blog`, `feature_investments`, `feature_envelopes`, `feature_household`, `feature_collections`, `feature_tools`
- Завантажуються через `FeaturesProvider` (в `lib/features-context.tsx`)
- Адміни завжди бачать усі фічі незалежно від флагів
- Обгорни сторінку: `<FeatureGate featureKey="feature_investments" label="Інвестиції">{children}</FeatureGate>`

### Система ролей (`lib/permissions.ts`)
Ролі: `user` → `admin` → `superadmin`. Зберігається в `profiles.role`.
- `can(role, permission)` — статична перевірка (безпечно в middleware)
- `canFrom(matrix, role)` — з DB-overrides (для UI компонентів)
- Матриця дефолтних прав в `DEFAULT_PERMISSIONS` — перевизначається через `site_settings` key `"permissions_matrix"`

### Cron-задачі (vercel.json)
| Route | Розклад |
|-------|---------|
| `/api/cron/nbu-rates` | щодня 06:00 |
| `/api/cron/fuel-prices` | щодня 01:00 |
| `/api/cron/recurring` | щодня 06:00 |
| `/api/cron/stock-prices` | будні 15:00 |

## UI-бібліотека — `components/ui/`

Єдина точка входу:
```ts
import { Button, Input, Select, Textarea, Modal, Card, CardHeader, StatCard, InfoBox,
         Toggle, ToggleRow, Badge, ProgressBar, Spinner, PageLoader,
         Checkbox, CheckboxRow, Tabs, EmptyState,
         Icon, icons } from "@/components/ui";
```

### Компоненти

| Компонент | Файл | Варіанти / пропси |
|-----------|------|-------------------|
| `Button` | Button.tsx | variant: primary/secondary/danger/ghost; size: sm/md/lg; loading, icon, fullWidth |
| `Input` | Input.tsx | label, error, hint, suffix |
| `Select` | Input.tsx | label, error, hint, options[], placeholder |
| `Textarea` | Input.tsx | label, error, hint |
| `Modal` | Modal.tsx | title, onClose, size: sm/md/lg, disableOverlayClose |
| `Card` | Card.tsx | noPadding, className |
| `CardHeader` | Card.tsx | title, action, icon |
| `StatCard` | Card.tsx | label, value, sub, color: green/red/orange/blue/purple/neutral, icon, emoji |
| `InfoBox` | Card.tsx | variant: orange/blue/green/red/amber |
| `Toggle` | Toggle.tsx | checked, onChange, disabled, size: sm/md |
| `ToggleRow` | Toggle.tsx | label, desc, checked, onChange, disabled, size |
| `Badge` | Badge.tsx | color: green/red/orange/blue/purple/amber/neutral, pulse |
| `ProgressBar` | Badge.tsx | value, max, color, height: sm/md |
| `Spinner` | Badge.tsx | size: sm/md/lg |
| `PageLoader` | Badge.tsx | — |
| `Checkbox` | Checkbox.tsx | checked, onChange, disabled, size: sm/md |
| `CheckboxRow` | Checkbox.tsx | label, desc, checked, onChange, disabled, size |
| `Tabs` | Tabs.tsx | tabs: \{id, label, icon?, count?\}[], active, onChange, variant: pills/underline |
| `EmptyState` | EmptyState.tsx | emoji, title, desc, action, compact |
| `Icon` | Icon.tsx | d (SVG path), className |

### Іконки — `icons.{назва}`

Всі SVG-іконки в `Icon.tsx`. Нові — **тільки туди**.

Доступні: `plus, close, edit, trash, save, copy, search, filter, drag, download, refresh, chevLeft, chevRight, chevDown, chevUp, externalLink, check, warn, info, loader, arrowRight, wallet, bank, trendUp, trendDown, coin, creditCard, envelope, lock, spark, carry, bell, settings, clock, calendar, sun, moon, user, logout, menu, home, chart, bag, doc`

### Форматування — `lib/format.ts`

```ts
import { fmt, pct, dateLabel, startOfPeriod, uid, monthsLeft } from "@/lib/format";
fmt(1234.5)              // "1 234,50 грн"  (decimals=2 за замовчуванням)
fmt(5000, "USD", 0)      // "$5 000"
pct(12.5)                // "+12.5%"
dateLabel("2026-05-15")  // "Сьогодні"
```

**ВАЖЛИВО**: `fmt()` має `decimals=2` за замовчуванням. Для цілих сум — `fmt(n, cur, 0)`.

## Правила
- **Ніколи** не оголошуй локально: `Icon`, `icons`, `inp`, `btnPrimary`, `StatCard`, `ModalWrap`, `Toggle`, `fmt` — тільки імпорт з `@/components/ui` або `@/lib/format`
- **Ніколи** не додавай іконки локально — тільки в `Icon.tsx`
- Кожен UI-патерн що повторюється 2+ рази → компонент у `components/ui/`
- Next.js 15: `params` і `searchParams` — **async** в server components
- Курси валют: завжди `fetchNbuRates()` + `rateFor()` з `lib/nbu-rates.ts`, не хардкодити
- Баланс рахунків: оновлюється DB-тригером `sync_account_balance`, **не** client-side
- Категорії транзакцій: змінювати тільки в `lib/category-registry.ts`

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
| `profiles` | Профіль: modules(jsonb), notifications(jsonb), base_currency, role |
| `site_settings` | Фіча-флаги та permissions_matrix (key/value) |
| `exchange_rates` | Кеш курсів НБУ (є в БД, поки не використовується) |
| `recurring_transactions` | Регулярні транзакції (є в БД, UI не реалізовано) |
| `shocks` | Фінансові потрясіння |
| `fuel_prices_history` | Ціни на пальне |

### Важливі особливості
- `transactions.category_key` — рядковий ключ (хардкод в `lib/category-registry.ts`), НЕ FK
- `transactions.category_id` — FK до `categories` (не використовується в поточному UI)
- `profiles.modules` — jsonb, керує навігацією (НЕ user_modules таблиця)
- `profiles.role` — `user` | `admin` | `superadmin`, керує доступом до адмінки
- `accounts.balance` — оновлюється тригером `sync_account_balance` при INSERT/UPDATE на transactions
- `transactions.to_amount` — сума яку отримує to_account при переказі між різновалютними рахунками
- `accounts` вже має `credit_limit`, `interest_rate`, `payment_day`, `end_date` — UI не використовує
- `deposits` і `credits` — не мають FK на accounts

## Повна схема БД
Файл: `supabase/schema.csv` (актуальна на 2026-05-08)

## Детальний аналіз сутностей
Файл: `ENTITIES.md`
