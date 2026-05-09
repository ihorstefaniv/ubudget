"use client";

import { useState, useMemo } from "react";

const Ico = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type EType = "button" | "modal" | "form" | "table" | "filter" | "badge" | "chart" | "card";

interface El { name: string; type: EType; action: string; db?: string }
interface DocTab { id: string; name: string; desc?: string; els?: El[]; tables?: string[]; logic?: string[] }
interface Doc {
  id: string; group: string; title: string; icon: string; url?: string;
  desc: string; goal: string; tabs?: DocTab[]; els?: El[];
  tables?: string[]; logic?: string[]; shots?: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DOCS: Doc[] = [
  {
    id: "dashboard", group: "Основні сторінки", title: "Дашборд",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    url: "/dashboard",
    desc: "Головний екран — зведений фінансовий стан: баланс рахунків, доходи/витрати місяця, кредити, інвестиції, останні транзакції.",
    goal: "Миттєве розуміння фінансового стану без переходу між розділами.",
    els: [
      { name: "Виджет «Баланс рахунків»", type: "card", action: "SUM(balance) WHERE is_archived=false, конвертація по курсу НБУ. Клік → /accounts", db: "accounts, exchange_rates" },
      { name: "Виджет «Доходи / Витрати»", type: "card", action: "SUM(amount) WHERE type IN (income/expense) AND date в поточному місяці. Клік → /transactions", db: "transactions" },
      { name: "Виджет «Кредити»", type: "card", action: "SUM(remaining_amount) WHERE is_archived=false. Клік → /credits", db: "credits" },
      { name: "Виджет «Інвестиції»", type: "card", action: "Сума ринкових вартостей: акції (qty × current_price), облігації (amount), нерухомість (current_price). Клік → /investments", db: "stocks, bonds, real_estate, businesses, collections" },
      { name: "Список останніх транзакцій", type: "table", action: "Останні 10 транзакцій: дата, категорія, сума. Тільки перегляд.", db: "transactions (LIMIT 10 ORDER BY date DESC)" },
    ],
    tables: ["accounts", "transactions", "credits", "stocks", "bonds", "real_estate", "exchange_rates"],
    logic: [
      "Баланс рахунків = SUM(balance) з активних (is_archived=false) рахунків; non-UAH конвертуються через rateFor().",
      "Інвестиції конвертуються в base_currency через fetchNbuRates() при завантаженні сторінки.",
    ],
    shots: ["Загальний вид дашборду з 4 виджетами", "Список останніх транзакцій"],
  },
  {
    id: "transactions", group: "Основні сторінки", title: "Транзакції",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    url: "/transactions",
    desc: "Повний список фінансових операцій з навігацією по місяцях, фільтром типу. Додавання, редагування, soft-delete.",
    goal: "Основний журнал обліку — всі інші розділи базуються на даних транзакцій.",
    els: [
      { name: "Кнопка «+ Транзакція»", type: "button", action: "Відкриває TransactionModal (режим створення).", db: "transactions (INSERT)" },
      { name: "Навігація місяць ← →", type: "button", action: "Змінює фільтр місяця, перезавантажує список.", db: "transactions (date filter)" },
      { name: "Фільтр типу", type: "filter", action: "Всі / Доходи / Витрати / Перекази → фільтр по transactions.type.", db: "transactions.type" },
      { name: "Рядок транзакції", type: "table", action: "Клік → TransactionModal (редагування). Групування по дням. Підсумок дня (≈ для FX).", db: "transactions" },
      { name: "Кошик (soft-delete)", type: "button", action: "transactions.deleted_at = now(). Тригер відкочує баланс рахунку автоматично.", db: "transactions.deleted_at → sync_account_balance" },
      { name: "Modal — Тип операції", type: "modal", action: "Дохід / Витрата / Переказ. Визначає набір полів форми.", db: "transactions.type" },
      { name: "Modal — Рахунок", type: "form", action: "Список активних рахунків. Для non-UAH рахунку валюта блокується автоматично.", db: "transactions.account_id, accounts.currency" },
      { name: "Modal — Сума і валюта", type: "form", action: "При валюті ≠ UAH з'являється поле «Курс НБУ» (exchange_rate). UAH-еквівалент = amount × rate.", db: "transactions.amount, .currency, .exchange_rate" },
      { name: "Modal — Категорія", type: "form", action: "Вибір category_key з реєстру (lib/category-registry.ts). Тільки для Доходу/Витрати.", db: "transactions.category_key" },
      { name: "Modal — Рахунок-отримувач", type: "form", action: "Для Переказу: to_account_id. Якщо валюти різні — поле to_amount (що надходить).", db: "transactions.to_account_id, .to_amount" },
      { name: "Modal — Фото чека", type: "form", action: "FileReader → base64/URL → transactions.receipt_url.", db: "transactions.receipt_url" },
    ],
    tables: ["transactions", "accounts"],
    logic: [
      "Баланс рахунку ЗАВЖДИ оновлюється тригером sync_account_balance — клієнт не пише в accounts.balance напряму.",
      "Soft-delete: deleted_at != NULL → не відображається в UI, але зберігається в БД для аудиту.",
      "Переказ: amount іде з account_id (−), to_amount надходить на to_account_id (+). Якщо валюти однакові — to_amount = amount.",
      "Курс НБУ завантажується через /api/nbu-rates (кешується в exchange_rates на 24 год).",
      "Обмеження: до 500 транзакцій на запит (пагінація в беклозі).",
    ],
    shots: ["Список транзакцій згрупованих по дням", "TransactionModal — витрата з курсом", "TransactionModal — переказ між рахунками"],
  },
  {
    id: "accounts", group: "Основні сторінки", title: "Рахунки",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    url: "/accounts",
    desc: "Управління фінансовими рахунками: картки, готівка, крипто, накопичувальні. Кожен рахунок має валюту і поточний баланс.",
    goal: "Зберігати актуальний стан всіх рахунків як основу для транзакцій і балансу дашборду.",
    els: [
      { name: "Кнопка «+ Рахунок»", type: "button", action: "Відкриває AccountModal для створення.", db: "accounts (INSERT)" },
      { name: "Картка рахунку", type: "card", action: "Назва, тип, валюта, баланс. Клік «редагувати» → AccountModal.", db: "accounts" },
      { name: "Modal — Тип рахунку", type: "modal", action: "cash / card / credit_card / saving / crypto / investment / other.", db: "accounts.type" },
      { name: "Modal — Валюта", type: "form", action: "UAH / USD / EUR / GBP / CHF / BTC / ETH. Фіксується після збереження.", db: "accounts.currency" },
      { name: "Modal — Початковий баланс", type: "form", action: "Задається при створенні. Далі тригер управляє балансом автоматично.", db: "accounts.balance" },
      { name: "Кнопка «Архівувати»", type: "button", action: "accounts.is_archived = true. Рахунок зникає з UI але залишається в БД.", db: "accounts.is_archived" },
    ],
    tables: ["accounts"],
    logic: [
      "accounts.balance керується виключно тригером sync_account_balance. Прямий UPDATE SET balance не рекомендується.",
      "Архівовані рахунки не враховуються в загальному балансі дашборду.",
      "Валюта рахунку визначає валюту транзакцій — в TransactionModal вибір валюти блокується для non-UAH рахунків.",
    ],
    shots: ["Список рахунків по типах з балансами", "AccountModal — форма нового рахунку"],
  },
  {
    id: "budget", group: "Основні сторінки", title: "Бюджет",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z",
    url: "/budget",
    desc: "Місячне бюджетування по категоріях. Планові суми vs факт з транзакцій. Кастомні категорії і заклади (merchants).",
    goal: "Контроль витрат: скільки заплановано і скільки вже витрачено по кожній категорії.",
    els: [
      { name: "Навігація місяць", type: "button", action: "Перемикає місяць бюджету. WHERE month/year = вибраний.", db: "budgets" },
      { name: "Рядок категорії", type: "table", action: "Категорія + plan_amount + факт (з транзакцій) + прогрес-бар.", db: "budgets, transactions, categories" },
      { name: "Inline редагування плану", type: "form", action: "Клік на суму → input. UPSERT в budgets по (user_id, category_key, month, year).", db: "budgets (UPSERT)" },
      { name: "Кнопка «+ Категорія»", type: "button", action: "CategoryModal: назва, іконка. INSERT categories + автосідання preset merchants.", db: "categories (INSERT), merchants (INSERT batch)" },
      { name: "Список закладів (merchants)", type: "table", action: "Заклади по категорії з cashback %. Фільтруються server-side по category_id IN (user's cats).", db: "merchants" },
      { name: "Кнопка «+ Заклад»", type: "button", action: "MerchantModal: назва, %, нотатка. INSERT з user_id.", db: "merchants (INSERT)" },
    ],
    tables: ["budgets", "categories", "subcategories", "merchants", "transactions"],
    logic: [
      "Факт = SUM(transactions.amount) WHERE category_key=X AND month/year = поточний AND deleted_at IS NULL.",
      "Системні категорії (food, transport…) — в lib/category-registry.ts, не в БД.",
      "Merchants фільтруються server-side: category_id IN (user's category IDs) — чужі не відображаються.",
      "При створенні категорії пресетні merchants вставляються з user_id поточного користувача.",
    ],
    shots: ["Таблиця бюджету з прогрес-барами", "Список закладів по категорії"],
  },
  {
    id: "credits", group: "Основні сторінки", title: "Кредити та Депозити",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    url: "/credits",
    desc: "Дві таби: Кредити (облік боргів) і Депозити (облік вкладів).",
    goal: "Контроль боргового навантаження і стан накопичень.",
    tabs: [
      {
        id: "credits-tab", name: "Кредити",
        desc: "Список активних кредитів: банківські, авто, іпотека. Прогрес погашення, дата платежу.",
        els: [
          { name: "Кнопка «+ Кредит»", type: "button", action: "CreditModal: назва, тип, сума, ставка, платіж/місяць, день платежу.", db: "credits (INSERT)" },
          { name: "Картка кредиту", type: "card", action: "Назва, залишок, ставка, платіж, дата, прогрес погашення ((total−remaining)/total).", db: "credits" },
          { name: "Кнопка «Платіж»", type: "button", action: "PaymentModal → RPC pay_credit: атомарно INSERT expense tx + UPDATE remaining_amount.", db: "credits (pay_credit RPC), transactions" },
          { name: "Бейдж «Платіж сьогодні»", type: "badge", action: "today.getDate() === credit.payment_day.", db: "credits.payment_day" },
          { name: "Кнопка «Архів»", type: "button", action: "credits.is_archived = true після повного погашення.", db: "credits.is_archived" },
        ],
        tables: ["credits", "transactions"],
        logic: ["Атомарний платіж через SQL RPC pay_credit(credit_id, amount, account_id): INSERT + UPDATE в одній транзакції."],
      },
      {
        id: "deposits-tab", name: "Депозити",
        desc: "Список активних вкладів з відсотками, датами, типом капіталізації.",
        els: [
          { name: "Кнопка «+ Депозит»", type: "button", action: "DepositModal: сума, ставка, дата початку, термін, капіталізація. INSERT deposits + INSERT expense tx (зменшує баланс рахунку).", db: "deposits (INSERT), transactions (INSERT)" },
          { name: "Картка депозиту", type: "card", action: "Сума, ставка, початок, термін, тип (капіталізація/купон), статус.", db: "deposits" },
          { name: "Бейдж «% сьогодні»", type: "badge", action: "isInterestDue: day === start.day AND monthsSince % periodMonths === 0.", db: "deposits.start_date, .coupon_period" },
          { name: "Кнопка «Закрити»", type: "button", action: "deposits.is_archived = true + INSERT income tx (повернення тіла).", db: "deposits, transactions" },
        ],
        tables: ["deposits", "transactions", "accounts"],
        logic: ["Відкриття депозиту зменшує баланс рахунку через expense transaction (виправлено в П13)."],
      },
    ],
    shots: ["Таба Кредити — прогрес погашення", "Таба Депозити — бейдж відсотків"],
  },
  {
    id: "investments", group: "Основні сторінки", title: "Інвестиції",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    url: "/investments",
    desc: "Портфель інвестицій: Акції, Облігації, Нерухомість, Бізнеси, Колекції, Підсумок.",
    goal: "Відстеження всіх інвестиційних активів, їх ринкова вартість і прибутковість.",
    tabs: [
      {
        id: "stocks", name: "Акції",
        els: [
          { name: "Кнопка «+ Акція»", type: "button", action: "StockModal: тікер, кількість, ціна, валюта, рахунок. INSERT stocks + INSERT expense tx.", db: "stocks, transactions" },
          { name: "Картка акції", type: "card", action: "Тікер, кількість, ціна купівлі, поточна ціна, P&L (% і валюта).", db: "stocks" },
        ],
        tables: ["stocks", "transactions"],
        logic: [
          "P&L = (current_price − buy_price) × quantity у валюті акції.",
          "current_price оновлюється cron /api/cron/stock-prices (пн-пт 15:00 UTC) через Yahoo Finance API.",
        ],
      },
      {
        id: "bonds", name: "Облігації (ОВДП)",
        els: [
          { name: "Кнопка «+ Облігація»", type: "button", action: "BondModal: назва, тип, сума, ставка, дата купівлі/погашення, купонний період. INSERT bonds + expense tx.", db: "bonds, transactions" },
          { name: "Картка облігації", type: "card", action: "Назва, сума, ставка, дата погашення, купонний дохід до погашення.", db: "bonds" },
          { name: "Бейдж «Купон сьогодні»", type: "badge", action: "isCouponDue: day === buyDate.day AND monthsSince % periodMonths === 0.", db: "bonds.buy_date, .coupon_period" },
          { name: "Кнопка «Купон»", type: "button", action: "BondCouponModal: вибір рахунку, розрахована сума купону. INSERT income tx (category_key='invest').", db: "transactions (INSERT income)" },
        ],
        tables: ["bonds", "transactions"],
        logic: ["Купон = (amount × rate/100) / (12 / periodMonths)."],
      },
      {
        id: "realestate", name: "Нерухомість",
        els: [
          { name: "Кнопка «+ Нерухомість»", type: "button", action: "RealEstateModal: адреса, ціна купівлі/поточна, оренда.", db: "real_estate (INSERT)" },
          { name: "Картка об'єкту", type: "card", action: "Адреса, купівля, поточна ціна, P&L, дохід від оренди.", db: "real_estate" },
        ],
        tables: ["real_estate"],
      },
      {
        id: "business", name: "Бізнеси",
        els: [
          { name: "Кнопка «+ Бізнес»", type: "button", action: "BusinessModal: назва, частка %.", db: "businesses (INSERT)" },
          { name: "Кнопка «+ Стаття»", type: "button", action: "BusinessItemModal: section (income/expense/asset), сума.", db: "business_items (INSERT)" },
        ],
        tables: ["businesses", "business_items", "business_employees"],
      },
      {
        id: "collections", name: "Колекції",
        els: [
          { name: "Кнопка «+ Предмет»", type: "button", action: "CollectionModal: категорія, ціна купівлі, очікувана ціна, статус (owned/sold).", db: "collections (INSERT)" },
        ],
        tables: ["collections"],
        logic: ["Відомий баг: sold-предмети включаються в підсумок (беклог)."],
      },
      {
        id: "summary", name: "Підсумок",
        els: [{ name: "Зведена таблиця", type: "table", action: "Ринкова вартість всіх активів у base_currency. Рядки по типах + всього.", db: "всі інвестиційні таблиці + exchange_rates" }],
        tables: ["stocks", "bonds", "real_estate", "businesses", "collections", "exchange_rates"],
        logic: ["Конвертація через rateFor() на поточний курс НБУ."],
      },
    ],
    shots: ["Таба Акції з P&L", "BondCouponModal", "Таба Підсумок — зведені активи"],
  },
  {
    id: "envelopes", group: "Основні сторінки", title: "Конверти",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    url: "/envelopes",
    desc: "Метод конвертів: тижневий ліміт витрат на основі місячного доходу мінус обов'язкові платежі.",
    goal: "Просте щотижневе обмеження витрат щоб не виходити за межі місячного бюджету.",
    els: [
      { name: "Налаштування конверту", type: "form", action: "Місяць, кількість тижнів, обов'язкові витрати (mandatory jsonb), загальний дохід. UPSERT envelope_settings.", db: "envelope_settings (UPSERT)" },
      { name: "Картка тижня", type: "card", action: "Бюджет тижня, витрачено (з транзакцій за ці дні), залишок, перенос.", db: "envelope_settings, transactions (date range)" },
    ],
    tables: ["envelope_settings", "transactions"],
    logic: [
      "Витрати тижня = SUM(transactions.amount) WHERE type='expense' AND date IN [week_start, week_end].",
      "Таблиці envelope_weeks і envelope_income_sources видалено (П17, П18) — дані читаються з transactions наживо.",
      "Обов'язкові витрати (mandatory) — jsonb масив [{label, amount}], вираховується з доходу перед розподілом по тижнях.",
    ],
    shots: ["Налаштування конверту", "Тижневий вид з прогресом"],
  },
  {
    id: "recurring", group: "Інструменти", title: "Регулярні транзакції",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    url: "/tools/recurring",
    desc: "Шаблони для автоматичного створення транзакцій: підписки, оренда, зарплата.",
    goal: "Автоматизувати рутинні записи — не вводити вручну щомісяця.",
    els: [
      { name: "Кнопка «+ Шаблон»", type: "button", action: "Modal: тип, сума, рахунок, категорія, частота (daily/weekly/monthly/yearly), дата наступного запуску.", db: "recurring_transactions (INSERT)" },
      { name: "Список шаблонів", type: "table", action: "Активні шаблони з next_run датою.", db: "recurring_transactions" },
      { name: "Кнопка «Виконати зараз»", type: "button", action: "INSERT транзакцію по шаблону + UPDATE next_run.", db: "transactions (INSERT), recurring_transactions.next_run" },
    ],
    tables: ["recurring_transactions", "transactions"],
    logic: [
      "Cron /api/cron/recurring — щодня о 06:00 UTC (vercel.json). WHERE next_run <= now() AND is_active = true.",
      "Після виконання: next_run += interval відповідно до frequency.",
    ],
    shots: ["Список шаблонів регулярних транзакцій"],
  },
  {
    id: "shock", group: "Інструменти", title: "Фінансові потрясіння",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    url: "/tools/shock",
    desc: "Облік великих незапланованих витрат і їх вплив на бюджет.",
    goal: "Планування великих витрат (ремонт, авто, медицина) — скільки місяців накопичувати.",
    els: [
      { name: "Форма нового потрясіння", type: "form", action: "Назва, сума, дата. INSERT в shocks.", db: "shocks (INSERT)" },
      { name: "Список потрясінь", type: "table", action: "Назва, сума, дата, скільки місяців залишилось.", db: "shocks" },
    ],
    tables: ["shocks"],
    shots: ["Список фінансових потрясінь"],
  },
  {
    id: "health", group: "Інструменти", title: "Фінансове здоров'я",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    url: "/tools/health",
    desc: "Скоринг фінансового здоров'я по 6 показниках: подушка безпеки, борги, заощадження, диверсифікація тощо.",
    goal: "Якісна оцінка фінансового стану і персональні підказки для покращення.",
    els: [
      { name: "Скоркарта", type: "chart", action: "6 індикаторів 0–100. Читає accounts, transactions, credits, investments. Рахує бали по формулах.", db: "accounts, transactions, credits, stocks, bonds" },
    ],
    tables: ["accounts", "transactions", "credits", "stocks", "bonds"],
    shots: ["Скоркарта фінансового здоров'я"],
  },
  {
    id: "fuel", group: "Інструменти", title: "Ціни на пальне",
    icon: "M3 12h18M3 6h18M3 18h18",
    url: "/tools/fuel-prices",
    desc: "Графік динаміки цін на А95, ДП, газ. Дані в fuel_prices_history.",
    goal: "Планування витрат на авто і відстеження динаміки цін.",
    els: [
      { name: "Графік цін", type: "chart", action: "Лінійний графік по датах з fuel_prices_history.", db: "fuel_prices_history" },
    ],
    tables: ["fuel_prices_history"],
    shots: ["Графік цін на пальне"],
  },
  {
    id: "settings", group: "Налаштування", title: "Налаштування",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    url: "/settings",
    desc: "Профіль, базова валюта, активні модулі, сповіщення.",
    goal: "Персоналізація застосунку під конкретного користувача.",
    els: [
      { name: "Базова валюта", type: "form", action: "UAH / USD / EUR. UPDATE profiles.base_currency. Впливає на конвертацію балансу.", db: "profiles.base_currency" },
      { name: "Модулі (перемикачі)", type: "form", action: "Кредити / Інвестиції / Конверти / Інструменти. UPDATE profiles.modules (jsonb). Вимкнений модуль зникає з меню.", db: "profiles.modules" },
      { name: "Ім'я та email", type: "form", action: "UPDATE profiles.full_name.", db: "profiles.full_name" },
      { name: "Сповіщення", type: "form", action: "Email/push. UPDATE profiles.notifications (jsonb).", db: "profiles.notifications" },
    ],
    tables: ["profiles"],
    logic: [
      "profiles.modules — jsonb масив: ['credits','investments','envelopes','tools']. Відсутній ключ = модуль вимкнено.",
      "Рядок profiles створюється автоматично DB-тригером handle_new_user() при реєстрації.",
    ],
    shots: ["Сторінка налаштувань — модулі і базова валюта"],
  },
  {
    id: "arch-db", group: "Архітектура", title: "База даних (Supabase)",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4-8 4s8 1.79 8 4",
    desc: "PostgreSQL через Supabase. Повна схема в supabase/schema.csv. Всі таблиці мають RLS.",
    goal: "Ізольоване multi-tenant зберігання — кожен user бачить тільки свої дані.",
    els: [
      { name: "Тригер sync_account_balance", type: "card", action: "AFTER INSERT/UPDATE/DELETE ON transactions → оновлює accounts.balance. Враховує type, amount, to_amount, deleted_at.", db: "accounts, transactions" },
      { name: "RPC pay_credit", type: "card", action: "Атомарна функція: INSERT expense tx + UPDATE credits.remaining_amount в одній DB транзакції.", db: "credits, transactions" },
      { name: "RLS-політики", type: "card", action: "USING (user_id = auth.uid()) на всіх фінансових таблицях. Адмін-таблиці — USING (auth.uid() IS NOT NULL).", db: "всі таблиці" },
      { name: "Тригер handle_new_user", type: "card", action: "AFTER INSERT ON auth.users → INSERT profiles з дефолтами (base_currency='UAH', modules=[]).", db: "profiles" },
    ],
    tables: ["profiles", "accounts", "transactions", "categories", "budgets", "exchange_rates"],
    logic: [
      "exchange_rates — кеш курсів НБУ. Ключ: (date, currency). Запис дійсний 24 год. Читається через /api/nbu-rates.",
      "Soft-delete: transactions.deleted_at IS NOT NULL — тригер не враховує такі записи при перерахунку балансу.",
      "Детальна схема: supabase/schema.csv. Міграції: supabase/migrations/.",
    ],
    shots: ["ER-діаграма основних таблиць"],
  },
  {
    id: "arch-cron", group: "Архітектура", title: "Cron-задачі",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    desc: "Vercel Cron Jobs для автоматизації фонових задач.",
    goal: "Актуальні дані без ручних дій: курси валют, ціни акцій, регулярні транзакції.",
    els: [
      { name: "/api/cron/nbu-rates", type: "card", action: "Щодня 10:00 UTC. Оновлює exchange_rates для USD/EUR/GBP/CHF.", db: "exchange_rates" },
      { name: "/api/cron/stock-prices", type: "card", action: "Пн-Пт 15:00 UTC. Оновлює stocks.current_price через Yahoo Finance API.", db: "stocks" },
      { name: "/api/cron/recurring", type: "card", action: "Щодня 06:00 UTC. Виконує шаблони де next_run <= now().", db: "recurring_transactions, transactions" },
    ],
    tables: ["exchange_rates", "stocks", "recurring_transactions"],
    logic: [
      "Авторизація: Authorization: Bearer {CRON_SECRET}. Задається в Vercel → Environment Variables.",
      "Розклад у vercel.json → crons[]. Yahoo Finance: /v8/finance/chart/{ticker}?interval=1d&range=1d → meta.regularMarketPrice.",
      "Всі cron-ендпоінти доступні і через прямий GET (для ручного тесту).",
    ],
    shots: [],
  },
  {
    id: "arch-auth", group: "Архітектура", title: "Автентифікація",
    icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    desc: "Supabase Auth — email/password і Magic Link. Сесія в cookies через @supabase/ssr.",
    goal: "Безпечна автентифікація та захист маршрутів авторизованої зони.",
    els: [
      { name: "middleware.ts", type: "card", action: "Перевіряє сесію на кожному запиті до app/(app)/. Редіректить неавтентифікованих на /login.", db: "auth.users" },
      { name: "lib/auth.ts (createClient)", type: "card", action: "Клієнтський Supabase клієнт для browser-компонентів.", db: "Supabase Auth" },
      { name: "lib/supabase/client.ts", type: "card", action: "SSR-клієнт з куками для Server Components і Route Handlers.", db: "Supabase Auth" },
    ],
    tables: ["profiles"],
    logic: [
      "При реєстрації handle_new_user() INSERT profiles з дефолтами.",
      "Адмін-зона /admin/*: додаткова перевірка profiles.role IN ('admin','superadmin') — без неї redirect на /admin-login.",
    ],
    shots: [],
  },
  {
    id: "admin-dashboard", group: "Адмін-панель", title: "Адмін: Дашборд",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    url: "/admin/dashboard",
    desc: "Огляд метрик: кількість користувачів, нові реєстрації, нові тикети, загальна активність.",
    goal: "Оперативний моніторинг стану застосунку.",
    els: [
      { name: "Виджет «Користувачі»", type: "card", action: "COUNT(profiles) total + COUNT за тиждень.", db: "profiles" },
      { name: "Виджет «Тикети»", type: "card", action: "COUNT(tickets WHERE status='new'). Клік → /admin/tickets.", db: "tickets" },
      { name: "Виджет «Транзакції»", type: "card", action: "COUNT(transactions) за сьогодні (service_role key).", db: "transactions" },
    ],
    tables: ["profiles", "tickets", "activity_logs"],
    shots: ["Адмін дашборд з виджетами метрик"],
  },
  {
    id: "admin-users", group: "Адмін-панель", title: "Адмін: Користувачі",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    url: "/admin/users",
    desc: "Список всіх користувачів: email, ім'я, роль, дата реєстрації. Пошук і зміна ролей.",
    goal: "Управління акаунтами, підтримка, призначення адмінів.",
    els: [
      { name: "Таблиця користувачів", type: "table", action: "Email, ім'я, роль, дата. Пошук по email.", db: "profiles" },
      { name: "Кнопка «Роль»", type: "button", action: "UPDATE profiles.role. Тільки для superadmin.", db: "profiles.role" },
    ],
    tables: ["profiles"],
    shots: ["Таблиця користувачів з пошуком"],
  },
  {
    id: "admin-tasks", group: "Адмін-панель", title: "Адмін: Завдання",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    url: "/admin/tasks",
    desc: "Kanban-дошка для відстеження завдань: backlog / todo / in_progress / review / done.",
    goal: "Персональний трекер розробника — аналог Jira всередині застосунку.",
    els: [
      { name: "Кнопка «+ Завдання»", type: "button", action: "Modal: тип (bug/feature/task/chore/idea), пріоритет, опис.", db: "tasks (INSERT)" },
      { name: "Kanban-картки", type: "card", action: "Переміщення між колонками → UPDATE tasks.status.", db: "tasks.status" },
      { name: "Фільтр тип/пріоритет", type: "filter", action: "Client-side фільтрація.", db: "tasks (local)" },
    ],
    tables: ["tasks"],
    shots: ["Kanban-дошка завдань"],
  },
  {
    id: "admin-blog", group: "Адмін-панель", title: "Адмін: Блог",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    url: "/admin/blog",
    desc: "Markdown-редактор для публікації статей на публічному блозі /blog.",
    goal: "SEO-контент і корисні матеріали для залучення користувачів.",
    els: [
      { name: "Редактор статті", type: "form", action: "title, slug, content (MD), excerpt, meta_title, meta_desc. UPSERT posts.", db: "posts" },
      { name: "Кнопка «Опублікувати»", type: "button", action: "UPDATE posts.status='published', published_at=now().", db: "posts.status, .published_at" },
    ],
    tables: ["posts", "post_comments"],
    shots: ["Редактор поста"],
  },
  {
    id: "admin-tickets", group: "Адмін-панель", title: "Адмін: Тикети",
    icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
    url: "/admin/tickets",
    desc: "Helpdesk: звернення користувачів, відповіді адміна, статуси.",
    goal: "Підтримка користувачів безпосередньо в адмін-панелі.",
    els: [
      { name: "Список тикетів", type: "table", action: "Фільтр: new / open / resolved. Клік → деталі.", db: "tickets" },
      { name: "Форма відповіді", type: "form", action: "admin_reply + «Відповісти» → UPDATE tickets.admin_reply + status='resolved'.", db: "tickets" },
    ],
    tables: ["tickets"],
    shots: ["Список тикетів", "Деталі тикету з відповіддю"],
  },
];

const GROUP_ORDER = ["Основні сторінки", "Інструменти", "Налаштування", "Архітектура", "Адмін-панель"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<EType, string> = {
  button:  "bg-blue-50 text-blue-700 border-blue-200",
  modal:   "bg-purple-50 text-purple-700 border-purple-200",
  form:    "bg-green-50 text-green-700 border-green-200",
  table:   "bg-orange-50 text-orange-700 border-orange-200",
  filter:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  badge:   "bg-pink-50 text-pink-700 border-pink-200",
  chart:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  card:    "bg-neutral-100 text-neutral-700 border-neutral-300",
};
const TYPE_UA: Record<EType, string> = {
  button: "Кнопка", modal: "Модалка", form: "Поле", table: "Таблиця",
  filter: "Фільтр", badge: "Бейдж", chart: "Графік", card: "Картка",
};

function Shot({ label }: { label: string }) {
  return (
    <div className="w-full h-44 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-2 text-neutral-400">
      <Ico d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" cls="w-7 h-7" />
      <p className="text-xs">{label}</p>
    </div>
  );
}

function ElsTable({ els }: { els: El[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 my-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wide w-1/4">Елемент</th>
            <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wide w-16">Тип</th>
            <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wide">Дія / Логіка</th>
            <th className="text-left px-4 py-2 font-semibold text-neutral-500 uppercase tracking-wide w-1/5">БД</th>
          </tr>
        </thead>
        <tbody>
          {els.map((el, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60">
              <td className="px-4 py-3 font-medium text-neutral-900">{el.name}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${TYPE_STYLE[el.type]}`}>{TYPE_UA[el.type]}</span>
              </td>
              <td className="px-4 py-3 text-neutral-600 leading-relaxed">{el.action}</td>
              <td className="px-4 py-3">
                {el.db && <code className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono break-all">{el.db}</code>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DbChips({ tables }: { tables: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tables.map(t => <code key={t} className="text-xs bg-neutral-900 text-green-400 px-2.5 py-1 rounded-lg font-mono">{t}</code>)}
    </div>
  );
}

function LogicList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-xs text-neutral-600 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function TabView({ tabs }: { tabs: DocTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const tab = tabs.find(t => t.id === active);
  return (
    <div>
      <div className="flex gap-0 border-b border-neutral-200 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}>{t.name}</button>
        ))}
      </div>
      {tab && (
        <div className="space-y-4">
          {tab.desc && <p className="text-sm text-neutral-500">{tab.desc}</p>}
          {tab.els && tab.els.length > 0 && <><p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">UI-елементи</p><ElsTable els={tab.els} /></>}
          {tab.logic && tab.logic.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Логіка</p>
              <LogicList items={tab.logic} />
            </div>
          )}
          {tab.tables && tab.tables.length > 0 && <><p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Таблиці</p><DbChips tables={tab.tables} /></>}
        </div>
      )}
    </div>
  );
}

function Content({ doc }: { doc: Doc }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
          <span>{doc.group}</span>
          {doc.url && <><span>/</span><code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">{doc.url}</code></>}
        </div>
        <h1 className="text-xl font-bold text-neutral-900">{doc.title}</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-2xl">{doc.desc}</p>
      </div>

      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Бізнес-ціль</p>
        <p className="text-sm text-orange-900">{doc.goal}</p>
      </div>

      {doc.shots && doc.shots.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Скріншоти</p>
          <div className={`grid gap-3 ${doc.shots.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {doc.shots.map(l => <Shot key={l} label={l} />)}
          </div>
        </div>
      )}

      {doc.tabs ? <TabView tabs={doc.tabs} /> : (
        <>
          {doc.els && doc.els.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">UI-елементи</p>
              <ElsTable els={doc.els} />
            </div>
          )}
          {doc.logic && doc.logic.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Логіка і залежності</p>
              <LogicList items={doc.logic} />
            </div>
          )}
          {doc.tables && doc.tables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Таблиці БД</p>
              <DbChips tables={doc.tables} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Sidebar({ docs, activeId, onSelect, search, onSearch }: {
  docs: Doc[]; activeId: string; onSelect: (id: string) => void;
  search: string; onSearch: (v: string) => void;
}) {
  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q ? docs.filter(d => d.title.toLowerCase().includes(q) || d.group.toLowerCase().includes(q)) : docs;
    const map = new Map<string, Doc[]>();
    GROUP_ORDER.forEach(g => map.set(g, []));
    filtered.forEach(d => { if (!map.has(d.group)) map.set(d.group, []); map.get(d.group)!.push(d); });
    return map;
  }, [docs, search]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b border-neutral-100 shrink-0">
        <div className="relative">
          <Ico d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" cls="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Пошук..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-orange-300 focus:border-orange-300" />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-1">
        {GROUP_ORDER.map(group => {
          const items = grouped.get(group) ?? [];
          if (!items.length) return null;
          return (
            <div key={group} className="mb-1">
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">{group}</p>
              {items.map(d => (
                <button key={d.id} onClick={() => { onSelect(d.id); onSearch(""); }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2 text-xs transition-all ${
                    activeId === d.id
                      ? "bg-orange-50 text-orange-700 font-semibold border-r-2 border-orange-500"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}>
                  <Ico d={d.icon} cls="w-3.5 h-3.5 shrink-0 opacity-60" />
                  {d.title}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDocsPage() {
  const [activeId, setActiveId] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = DOCS.find(d => d.id === activeId) ?? DOCS[0];

  return (
    <div className="-m-4 lg:-m-6 flex" style={{ height: "calc(100vh - 48px)" }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`fixed inset-y-0 left-0 w-64 z-50 border-r border-neutral-200 transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ top: 48 }}>
        <Sidebar docs={DOCS} activeId={activeId} search={search} onSearch={setSearch}
          onSelect={id => { setActiveId(id); setMobileOpen(false); }} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 shrink-0 flex-col border-r border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 shrink-0">
          <p className="text-sm font-bold text-neutral-900">Документація</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">UBudget — технічний довідник</p>
        </div>
        <Sidebar docs={DOCS} activeId={activeId} search={search} onSearch={setSearch} onSelect={setActiveId} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white sticky top-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="text-neutral-500 hover:text-neutral-900">
            <Ico d="M4 6h16M4 12h16M4 18h16" cls="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-neutral-700">{active.title}</p>
        </div>
        <div className="max-w-4xl mx-auto p-5 lg:p-8">
          <Content doc={active} />
        </div>
      </div>
    </div>
  );
}
