# CLAUDE.md — UBudget ERP

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Мова
Завжди відповідай українською мовою.

## Команди

```bash
npm run dev      # dev-сервер на порті 3001
npm run build    # production build
npm run lint     # ESLint
```

Запускати з директорії `erp/`. Це окремий Next.js проект — не плутати з батьківським ubudget у кореневій директорії.

## Зв'язок з ubudget

- Той самий Supabase проект — ті ж змінні середовища (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Той самий акаунт — юзер входить з тими ж кредентіалами що й на ubudget.net
- **НЕ чіпати** файли поза директорією `erp/`

## Стек

Next.js 15, TypeScript, Tailwind v4, Supabase (`@supabase/ssr`)

## Структура

```
erp/
├── app/
│   ├── (auth)/login/    — вхід (ті ж Supabase credentials)
│   └── (erp)/           — авторизована ERP-зона
│       ├── layout.tsx   — сайдбар, auth-перевірка
│       ├── dashboard/
│       ├── warehouse/   — склад, товари, рух, інвентаризація
│       ├── counterparties/ — постачальники і покупці
│       ├── crm/         — клієнти, угоди (kanban), активності
│       ├── production/  — замовлення, BOM, списання
│       ├── finance/     — рахунки, транзакції, звіти
│       ├── processes/   — технологічні процеси
│       └── settings/    — компанія, команда, одиниці, валюти
├── components/ui/       — UI-бібліотека (копія ubudget + ERP-іконки)
└── lib/
    ├── format.ts        — fmt(), pct(), dateLabel()
    ├── auth.ts          — signIn, signOut, getUser
    └── supabase/        — client.ts (browser) / server.ts (SSR)
```

## UI-бібліотека

```ts
import { Button, Input, Select, Textarea, Modal, Card, CardHeader, StatCard, InfoBox,
         Toggle, ToggleRow, Badge, ProgressBar, Spinner, PageLoader,
         Checkbox, CheckboxRow, Tabs, EmptyState,
         Icon, icons } from "@/components/ui";
```

Ідентична до ubudget. Додаткові ERP-іконки в `Icon.tsx`: `users`, `factory`, `truck`, `pipeline`.

## БД — таблиці ERP (prefix `erp_`)

| Таблиця | Призначення |
|---------|-------------|
| `erp_companies` | Компанії юзера (owner_id → auth.users) |
| `erp_company_members` | Команда компанії (role: owner/admin/member) |
| `erp_products` | Товари і послуги |
| `erp_units` | Одиниці виміру |
| `erp_warehouses` | Склади |
| `erp_stock` | Залишки (product_id, warehouse_id, qty) |
| `erp_stock_movements` | Рух товарів (type: in/out, qty, price) |
| `erp_counterparties` | Контрагенти (type: supplier/buyer/both) |
| `erp_invoices` | Накладні (type: purchase/sale) |
| `erp_invoice_items` | Позиції накладних |
| `erp_crm_clients` | Клієнти CRM |
| `erp_crm_deals` | Угоди (stage: lead/contact/proposal/negotiation/won/lost) |
| `erp_crm_activities` | Активності (type: call/meeting/task) |
| `erp_production_orders` | Виробничі замовлення |
| `erp_bom` | Специфікації (product_id → список матеріалів) |
| `erp_bom_items` | Позиції специфікацій |
| `erp_processes` | Технологічні процеси |
| `erp_finance_accounts` | Рахунки компанії |
| `erp_finance_transactions` | Транзакції компанії |

Всі таблиці мають `company_id` FK → `erp_companies`. RLS: юзер бачить тільки свої компанії.

## Правила

- `@/*` → `erp/*` (tsconfig paths)
- Ніколи не додавати іконки локально — тільки в `components/ui/Icon.tsx`
- Supabase browser client → `lib/supabase/client.ts`, server → `lib/supabase/server.ts`
- Next.js 15: `params` і `searchParams` — async
- Акцентний колір: orange-400 (ідентично ubudget)
- Тема: localStorage key `erp-theme` (окремо від ubudget's `theme`)
