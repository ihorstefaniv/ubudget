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
  desc: string; intro: string[]; goal: string;
  keyPoints?: string[];
  tabs?: DocTab[]; els?: El[];
  tables?: string[]; logic?: string[];
  mockupId?: string;
}

// ─── DB Usage map ─────────────────────────────────────────────────────────────

const DB_USAGE: Record<string, { page: string; url?: string; role: string }[]> = {
  accounts: [
    { page: "Дашборд", url: "/dashboard", role: "Загальний баланс усіх активних рахунків (SUM balance)" },
    { page: "Транзакції", url: "/transactions", role: "Прив'язка операції до рахунку (account_id). Валюта рахунку → валюта транзакції" },
    { page: "Транзакції (переказ)", url: "/transactions", role: "Рахунок-отримувач (to_account_id) при переказах між рахунками" },
    { page: "Кредити", url: "/credits", role: "Рахунок списання при оплаті кредиту через pay_credit RPC" },
    { page: "Конверти", url: "/envelopes", role: "Витрати тижня розраховуються з транзакцій по конкретному рахунку" },
    { page: "Тригер sync_account_balance", role: "Баланс оновлюється після кожного INSERT/UPDATE у transactions" },
  ],
  transactions: [
    { page: "Дашборд", url: "/dashboard", role: "Доходи та витрати місяця, список останніх операцій" },
    { page: "Транзакції", url: "/transactions", role: "Основний CRUD: перегляд, додавання, редагування, soft-delete" },
    { page: "Бюджет", url: "/budget", role: "Фактичні витрати по категоріях (SUM amount WHERE category_key)" },
    { page: "Конверти", url: "/envelopes", role: "Витрати по тижнях (SUM WHERE type=expense AND date IN week)" },
    { page: "Звіти", url: "/reports", role: "Аналіз доходів/витрат по місяцях, розбивка по категоріях" },
    { page: "Кредити", url: "/credits", role: "Платіж по кредиту → INSERT expense transaction через pay_credit RPC" },
    { page: "Інвестиції", url: "/investments", role: "Купівля акцій/облігацій → INSERT expense. Купон ОВДП → INSERT income" },
    { page: "Регулярні транзакції", url: "/tools/recurring", role: "Виконання шаблону → INSERT у transactions" },
  ],
  credits: [
    { page: "Дашборд", url: "/dashboard", role: "Виджет загального боргового навантаження (SUM remaining_amount)" },
    { page: "Кредити", url: "/credits", role: "Основний CRUD, прогрес погашення, платіжний календар" },
    { page: "Фінансове здоров'я", url: "/tools/health", role: "Розрахунок debt-to-income ratio та скорингу" },
  ],
  budgets: [
    { page: "Бюджет", url: "/budget", role: "Планові суми по категоріях (plan_amount). UPSERT при редагуванні" },
  ],
  categories: [
    { page: "Бюджет", url: "/budget", role: "Кастомні категорії користувача — CRUD, іконка, підкатегорії, заклади" },
    { page: "Транзакції", url: "/transactions", role: "Батьківська категорія для subcategory_id" },
  ],
  subcategories: [
    { page: "Бюджет", url: "/budget", role: "CRUD підкатегорій всередині кастомної категорії" },
    { page: "Транзакції", url: "/transactions", role: "Опційна деталізація транзакції (subcategory_id)" },
  ],
  merchants: [
    { page: "Бюджет", url: "/budget", role: "Список закладів по кожній категорії з cashback %, фільтрація server-side" },
  ],
  profiles: [
    { page: "Налаштування", url: "/settings", role: "base_currency, modules (jsonb), notifications, full_name" },
    { page: "Дашборд", url: "/dashboard", role: "base_currency для конвертації валют при показі балансу" },
    { page: "Адмін: Користувачі", url: "/admin/users", role: "Список усіх профілів, ролі (role), пошук по email" },
    { page: "Адмін: Дашборд", url: "/admin/dashboard", role: "COUNT реєстрацій за тиждень" },
    { page: "Авторизація middleware", role: "Перевірка role IN (admin, superadmin) для доступу до /admin/*" },
  ],
  exchange_rates: [
    { page: "Дашборд", url: "/dashboard", role: "Конвертація балансів non-UAH рахунків у base_currency" },
    { page: "Транзакції", url: "/transactions", role: "Поточний курс при додаванні транзакції в іноземній валюті" },
    { page: "Інвестиції", url: "/investments", role: "Конвертація вартості портфелю в гривню (Підсумок)" },
    { page: "Звіти", url: "/reports", role: "Конвертація для зведеної статистики доходів/витрат" },
    { page: "Cron /api/cron/nbu-rates", role: "Щодня 10:00 UTC оновлює курси USD/EUR/GBP/CHF з НБУ" },
  ],
  stocks: [
    { page: "Інвестиції", url: "/investments", role: "Акції: CRUD, P&L, buy_price vs current_price" },
    { page: "Cron /api/cron/stock-prices", role: "Оновлення current_price через Yahoo Finance API пн-пт 15:00 UTC" },
    { page: "Дашборд", url: "/dashboard", role: "Портфель інвестицій у виджеті" },
  ],
  bonds: [
    { page: "Інвестиції", url: "/investments", role: "ОВДП та корпоративні облігації — купонний дохід, дата погашення" },
    { page: "Дашборд", url: "/dashboard", role: "Ринкова вартість облігацій у портфелі" },
  ],
  real_estate: [
    { page: "Інвестиції", url: "/investments", role: "Нерухомість: ціна купівлі, поточна вартість, оренда" },
  ],
  deposits: [
    { page: "Кредити / Депозити", url: "/credits", role: "Вклади: ставка, капіталізація, бейдж відсоткового дня" },
  ],
  recurring_transactions: [
    { page: "Регулярні транзакції", url: "/tools/recurring", role: "Шаблони з next_run, frequency, is_active" },
    { page: "Cron /api/cron/recurring", role: "Щодня 06:00 UTC виконує прострочені шаблони" },
  ],
  tasks: [
    { page: "Адмін: Завдання", url: "/admin/tasks", role: "Kanban-дошка розробника — backlog → done" },
  ],
  fuel_prices_history: [
    { page: "Ціни на пальне", url: "/tools/fuel-prices", role: "Лінійний графік динаміки цін А95/ДП/газ" },
  ],
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const DOCS: Doc[] = [
  {
    id: "dashboard", group: "Основні сторінки", title: "Дашборд",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    url: "/dashboard",
    desc: "Головний екран — зведений фінансовий стан одним поглядом.",
    intro: [
      "Дашборд — перше що бачить користувач після входу. Його завдання: дати повну картину фінансового стану за кілька секунд, без потреби переходити між розділами. Чотири виджети верхнього ряду відповідають на ключові питання: скільки є, скільки витрачено, скільки заборговано і скільки інвестовано.",
      "Баланс рахунків — сума всіх активних рахунків у базовій валюті (UAH за замовчуванням). Non-UAH рахунки конвертуються через актуальний курс НБУ, завантажений при відкритті сторінки. Це дає реальне відчуття того, «скільки грошей є прямо зараз».",
      "Блоки доходів та витрат показують результат поточного місяця. Поряд з абсолютними сумами відображається тренд відносно попереднього місяця — ↑ або ↓ з відсотком зміни. Якщо витрати виростають — помітно одразу.",
    ],
    goal: "Миттєве розуміння фінансового стану без переходу між розділами.",
    keyPoints: [
      "Баланс рахунків конвертується в base_currency через rateFor() при кожному завантаженні",
      "Тренд доходів/витрат порівнює поточний місяць з попереднім",
      "Виджет інвестицій агрегує 5 таблиць: stocks, bonds, real_estate, businesses, collections",
      "Останні 10 транзакцій — тільки перегляд, без можливості редагування",
    ],
    mockupId: "dashboard",
    els: [
      { name: "Виджет «Баланс рахунків»", type: "card", action: "SUM(balance) де is_archived=false, конвертація в base_currency. Клік → /accounts", db: "accounts, exchange_rates" },
      { name: "Виджет «Доходи / Витрати»", type: "card", action: "SUM(amount) WHERE type IN (income/expense) за поточний місяць + тренд vs попередній місяць. Клік → /transactions", db: "transactions" },
      { name: "Виджет «Кредити»", type: "card", action: "SUM(remaining_amount) де is_archived=false. Клік → /credits", db: "credits" },
      { name: "Виджет «Інвестиції»", type: "card", action: "qty×current_price (акції) + amount (облігації/деп) + current_price (нерухомість). Клік → /investments", db: "stocks, bonds, real_estate, businesses, collections" },
      { name: "Список останніх транзакцій", type: "table", action: "Останні 10 транзакцій: дата, категорія, рахунок, сума. Тільки перегляд.", db: "transactions (LIMIT 10 ORDER BY date DESC)" },
    ],
    tables: ["accounts", "transactions", "credits", "stocks", "bonds", "real_estate", "exchange_rates"],
    logic: [
      "Баланс = SUM(accounts.balance) WHERE is_archived=false. Non-UAH рахунки: balance × rateFor(currency).",
      "Тренд: порівнює SUM витрат/доходів поточного місяця з попереднім. Показується тільки при фільтрі «місяць».",
      "Інвестиції конвертуються через fetchNbuRates() при завантаженні. Sold-колекції виключаються по статусу.",
    ],
  },
  {
    id: "transactions", group: "Основні сторінки", title: "Транзакції",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    url: "/transactions",
    desc: "Повний журнал фінансових операцій з місячною навігацією.",
    intro: [
      "Транзакції — серце UBudget. Кожна операція, яку вводить користувач, впливає одразу на кілька місць: баланс рахунку (через DB-тригер), статистику бюджету, аналітику звітів, картку конвертів. Тому архітектура цього розділу критично важлива для узгодженості всіх даних.",
      "Навігація по місяцях дозволяє переглядати будь-який період без завантаження всієї бази. Запит серверно фільтрується по transaction_date ≥ start AND ≤ end — тільки поточний місяць. Це вирішило проблему 500-транзакційного ліміту, який був раніше.",
      "Модальне вікно додавання підтримує три типи операцій: Витрата, Дохід і Переказ між рахунками. Для non-UAH рахунків валюта блокується автоматично — щоб не допустити введення доларової транзакції на гривневий рахунок. При переказі між різновалютними рахунками система показує скільки прийде на рахунок-отримувач за поточним курсом НБУ.",
    ],
    goal: "Основний журнал обліку — всі інші розділи базуються на даних транзакцій.",
    keyPoints: [
      "Баланс рахунку ЗАВЖДИ оновлюється тригером sync_account_balance, не клієнтом",
      "Soft-delete: deleted_at = now(). Тригер автоматично відкочує баланс",
      "Переказ: amount − з account_id, to_amount + на to_account_id",
      "Курс НБУ завантажується через /api/nbu-rates і кешується в exchange_rates на 24 год",
      "Підкатегорії: опційне поле subcategory_id після вибору категорії",
    ],
    mockupId: "transactions",
    els: [
      { name: "Навігація місяць ← →", type: "button", action: "Змінює viewMonth state → перезавантажує список з новим date-фільтром.", db: "transactions (gte/lte date)" },
      { name: "Кнопка «+ Транзакція»", type: "button", action: "Відкриває AddModal у режимі створення.", db: "transactions (INSERT)" },
      { name: "Фільтр типу", type: "filter", action: "Всі / Витрати / Доходи / Перекази. Скидає filterCategory при зміні.", db: "transactions.type" },
      { name: "Рядок транзакції", type: "table", action: "Категорія + підкатегорія (якщо є), рахунок, сума. Підсумок дня (≈ для FX). Клік → EditModal.", db: "transactions" },
      { name: "Soft-delete кошик", type: "button", action: "UPDATE deleted_at = now(). Тригер відкочує баланс.", db: "transactions.deleted_at → sync_account_balance" },
      { name: "Modal — Тип операції", type: "modal", action: "Витрата / Дохід / Переказ. Визначає набір видимих полів.", db: "transactions.type" },
      { name: "Modal — Сума і валюта", type: "form", action: "Для non-UAH: курс НБУ + UAH-еквівалент = amount × rate. Валюта блокується якщо рахунок non-UAH.", db: "transactions.amount, .currency, .exchange_rate" },
      { name: "Modal — Категорія", type: "form", action: "Сітка 4×N з TX_CATEGORIES (lib/category-registry.ts). Тільки Дохід/Витрата.", db: "transactions.category_key" },
      { name: "Modal — Підкатегорія", type: "form", action: "Dropdown з subcategories користувача. З'являється якщо є хоч одна підкатегорія.", db: "transactions.subcategory_id → subcategories" },
      { name: "Modal — Рахунок-отримувач", type: "form", action: "Тільки для Переказу. При різних валютах показує to_amount (розраховано з курсу НБУ).", db: "transactions.to_account_id, .to_amount" },
      { name: "Modal — Повторювана", type: "form", action: "Toggle + вибір щомісяця/щотижня → is_recurring=true, recurring_interval.", db: "transactions.is_recurring, .recurring_interval" },
    ],
    tables: ["transactions", "accounts", "subcategories"],
    logic: [
      "Баланс рахунку оновлює DB-тригер, а не клієнт. Після INSERT/UPDATE accounts.balance змінюється автоматично.",
      "Soft-delete: транзакція залишається в БД (аудит), тригер відкочує її вплив на баланс.",
      "Переказ: amount списується з account_id, to_amount зараховується на to_account_id. Якщо валюти однакові — to_amount = amount.",
      "Денний підсумок: sum(income) − sum(expense) за день. Якщо є FX-транзакції — додається префікс ≈.",
    ],
  },
  {
    id: "accounts", group: "Основні сторінки", title: "Рахунки",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    url: "/accounts",
    desc: "Управління фінансовими рахунками: картки, готівка, крипто, накопичувальні.",
    intro: [
      "Рахунки — фундамент усієї системи. Кожна транзакція прив'язана до рахунку, і саме рахунки є «джерелом правди» для поточного балансу. Підтримуються типи: готівка, картка, кредитна картка, накопичувальний, крипто, інвестиційний.",
      "Ключова особливість: balance у таблиці accounts НІКОЛИ не оновлюється клієнтським кодом напряму. Весь перерахунок — виключно через DB-тригер sync_account_balance, який спрацьовує на INSERT, UPDATE (включаючи soft-delete) транзакцій. Це гарантує узгодженість даних навіть якщо декілька вкладок відкриті одночасно.",
      "Архівовані рахунки не видаляються — вони приховуються з UI та виключаються з підрахунку загального балансу на дашборді. Це зберігає цілісність історичних транзакцій, прив'язаних до рахунку.",
    ],
    goal: "Зберігати актуальний стан усіх рахунків як основу для транзакцій і балансу дашборду.",
    keyPoints: [
      "accounts.balance → тільки через DB-тригер sync_account_balance",
      "Валюта рахунку визначає валюту транзакцій (блокується у TransactionModal)",
      "is_archived=true → рахунок прихований з UI, баланс не включається в Net Worth",
      "Non-UAH рахунки конвертуються через rateFor(nbuRates, currency) на дашборді",
    ],
    mockupId: "accounts",
    els: [
      { name: "Картка рахунку", type: "card", action: "Іконка, назва, тип, валюта, баланс. Редагування / архівування.", db: "accounts" },
      { name: "Кнопка «+ Рахунок»", type: "button", action: "AccountModal: тип, назва, валюта, початковий баланс, іконка.", db: "accounts (INSERT)" },
      { name: "Modal — Тип рахунку", type: "modal", action: "cash / card / credit_card / saving / crypto / investment / other.", db: "accounts.type" },
      { name: "Modal — Валюта", type: "form", action: "UAH / USD / EUR / GBP / CHF / BTC / ETH. Впливає на TransactionModal.", db: "accounts.currency" },
      { name: "Modal — Початковий баланс", type: "form", action: "Встановлюється тільки при створенні. Далі — тільки через транзакції.", db: "accounts.balance" },
      { name: "Кнопка «Архівувати»", type: "button", action: "is_archived=true. Рахунок зникає з форм, не враховується в загальному балансі.", db: "accounts.is_archived" },
    ],
    tables: ["accounts"],
    logic: [
      "accounts.balance керується виключно тригером. Прямий UPDATE SET balance — небезпечний, може розсинхронізувати дані.",
      "Архів: is_archived=true → рахунок не показується в селектах транзакцій, не включається в Net Worth.",
      "credit_limit, interest_rate, payment_day, end_date — поля є в БД але UI не використовує (можливий майбутній функціонал кредитних карток).",
    ],
  },
  {
    id: "budget", group: "Основні сторінки", title: "Бюджет",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z",
    url: "/budget",
    desc: "Місячне бюджетування по категоріях: план vs факт.",
    intro: [
      "Бюджет — розділ планування. Для кожної категорії витрат можна задати планову суму на місяць. Система автоматично зіставляє її з фактичними витратами з журналу транзакцій і показує прогрес: скільки з бюджету вже витрачено.",
      "Категорії двох типів: системні (з lib/category-registry.ts — «Їжа», «Транспорт» тощо) і кастомні (з таблиці categories, які користувач створює сам). Кастомні можна деталізувати підкатегоріями і прив'язати заклади (merchants) з cashback-відсотком.",
      "Якщо бюджет на поточний місяць не налаштовано — з'являється банер з пропозицією скопіювати план з попереднього місяця. Це один з найпопулярніших сценаріїв: більшість витрат повторюється щомісяця.",
    ],
    goal: "Контроль витрат: скільки заплановано і скільки вже витрачено по кожній категорії.",
    keyPoints: [
      "Факт = SUM(transactions) WHERE category_key=X AND month/year = поточний",
      "Кастомні категорії (categories) окремо від системних (category-registry.ts)",
      "Merchants фільтруються server-side: тільки category_id IN (user categories)",
      "UPSERT budgets по (user_id, category_key, month, year) — безпечно при повторному збереженні",
      "Банер «Скопіювати з минулого місяця» якщо plan_amount = 0 для всіх категорій",
    ],
    mockupId: "budget",
    els: [
      { name: "Навігація місяць", type: "button", action: "Перемикає місяць бюджету.", db: "budgets (month/year filter)" },
      { name: "Рядок категорії", type: "table", action: "Емоджі + назва + план + факт + прогрес-бар + % виконання.", db: "budgets, transactions, categories" },
      { name: "Inline редагування плану", type: "form", action: "Клік на суму → input → blur → UPSERT budgets.", db: "budgets (UPSERT)" },
      { name: "Банер «Скопіювати»", type: "card", action: "Видно якщо planMap порожній. Клік → копіює plan_amount з попереднього місяця.", db: "budgets (INSERT batch)" },
      { name: "Таба «Категорії»", type: "modal", action: "CRUD кастомних категорій: іконка, назва, підкатегорії, заклади.", db: "categories, subcategories, merchants" },
      { name: "Кнопка «+ Категорія»", type: "button", action: "INSERT categories + автоматичне додавання preset merchants.", db: "categories (INSERT), merchants (INSERT)" },
      { name: "Підкатегорії", type: "form", action: "CRUD всередині категорії: назва, іконка, порядок.", db: "subcategories" },
      { name: "Заклади (merchants)", type: "table", action: "Назва, cashback %, нотатка. Фільтруються по category_id.", db: "merchants" },
    ],
    tables: ["budgets", "categories", "subcategories", "merchants", "transactions"],
    logic: [
      "Факт = SUM(amount) WHERE type='expense' AND category_key=X AND month/year = target AND deleted_at IS NULL.",
      "Системні категорії мають category_key з реєстру. Кастомні зберігаються в categories з UUID, але транзакції прив'язуються через category_key.",
      "Merchants RLS: USING (user_id = auth.uid()) — кожен бачить тільки свої заклади.",
    ],
  },
  {
    id: "reports", group: "Основні сторінки", title: "Звіти",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    url: "/reports",
    desc: "Аналіз доходів та витрат по місяцях, розбивка по категоріях.",
    intro: [
      "Звіти — аналітичний розріз даних. Якщо журнал транзакцій відповідає на питання «що було», то звіти відповідають на «скільки і куди». Барчарт дозволяє вибрати будь-який місяць і одразу побачити розбивку по категоріях.",
      "Сторінка завантажує транзакції за останні 6 або 12 місяців (один запит), а вся подальша агрегація відбувається на клієнті. Це дозволяє миттєво перемикатися між місяцями без додаткових запитів до БД.",
      "Блок «Заощадження по місяцях» показує різницю доходи − витрати у вигляді окремого графіка з позитивними/негативними барами. Це допомагає побачити структурні тенденції — чи є місяці систематичного перевитрачання.",
    ],
    goal: "Розуміти фінансові тренди і структуру витрат у часі.",
    keyPoints: [
      "Один запит на весь період (6 або 12 міс), агрегація на клієнті",
      "Барчарт — CSS-only, без зовнішніх бібліотек",
      "Вибраний місяць → розбивка по категоріях з прогрес-барами",
      "Конвертація через exchange_rate збережений у транзакції (не поточний курс)",
    ],
    mockupId: "reports",
    els: [
      { name: "Перемикач «6/12 місяців»", type: "filter", action: "Змінює period state → buildMonths() перераховує масив місяців.", db: "transactions (gte date filter)" },
      { name: "Барчарт місяців", type: "chart", action: "Клік на місяць → selected = month key. Зелений бар = доходи, червоний = витрати.", db: "transactions (client aggregation)" },
      { name: "Зведені картки", type: "card", action: "Доходи за період, Витрати, Заощаджено, Середні витрати/міс.", db: "transactions (SUM)" },
      { name: "Розбивка по категоріях", type: "table", action: "Для вибраного місяця: категорія + сума + прогрес-бар + %. Таби: Витрати / Доходи.", db: "transactions (filter by selected month)" },
      { name: "Графік заощаджень", type: "chart", action: "Bar chart: income − expense по кожному місяцю. Зелений/червоний залежно від знаку.", db: "transactions (client aggregation)" },
    ],
    tables: ["transactions", "exchange_rates"],
    logic: [
      "toUAH(tx): якщо currency=UAH → amount, інакше → amount × exchange_rate (збережений при транзакції).",
      "buildMonths(): ітерує N місяців від today backwards, фільтрує транзакції по monthKey(date).",
      "bestMonth: місяць з максимальними заощадженнями (income − expense). Показується тільки якщо totalSavings > 0.",
    ],
  },
  {
    id: "credits", group: "Основні сторінки", title: "Кредити та Депозити",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    url: "/credits",
    desc: "Дві таби: Кредити (облік боргів) і Депозити (облік вкладів).",
    intro: [
      "Кредити та депозити — дві сторони боргового і накопичувального обліку. Кредити показують скільки залишилось погасити, депозити — скільки накопичено і коли отримувати відсотки.",
      "Платіж по кредиту виконується через SQL RPC pay_credit — це атомарна операція: INSERT expense транзакції І UPDATE remaining_amount в одному DB-запиті. Якщо одна частина падає — вся операція відкочується. Це критично для узгодженості даних.",
      "Депозити мають бейдж «% сьогодні» — він з'являється в день виплати купону (розраховується з дати відкриття і купонного periodMonths). Те саме для ОВДП у розділі інвестицій.",
    ],
    goal: "Контроль боргового навантаження і стан накопичень.",
    keyPoints: [
      "pay_credit RPC — атомарна операція, не два окремих запити",
      "Прогрес погашення = (total_amount − remaining_amount) / total_amount",
      "Бейдж «Платіж сьогодні» = today.getDate() === credit.payment_day",
      "Відкриття депозиту → expense transaction (зменшує баланс рахунку)",
    ],
    mockupId: "credits",
    tabs: [
      {
        id: "credits-tab", name: "Кредити",
        desc: "Список активних кредитів з прогресом погашення і датою наступного платежу.",
        els: [
          { name: "Картка кредиту", type: "card", action: "Назва, тип, залишок, ставка %, місячний платіж, прогрес-бар.", db: "credits" },
          { name: "Кнопка «+ Кредит»", type: "button", action: "Modal: назва, тип (bank/auto/mortgage/other), сума, ставка, платіж, день, рахунок.", db: "credits (INSERT)" },
          { name: "Бейдж «Платіж сьогодні»", type: "badge", action: "Показується якщо today.getDate() === credit.payment_day.", db: "credits.payment_day" },
          { name: "Кнопка «Платіж»", type: "button", action: "PaymentModal → RPC pay_credit(credit_id, account_id, amount, date, note, user_id).", db: "credits + transactions (via RPC)" },
          { name: "Кнопка «Архів»", type: "button", action: "is_archived=true після повного погашення.", db: "credits.is_archived" },
        ],
        tables: ["credits", "transactions", "accounts"],
        logic: ["pay_credit RPC: BEGIN → INSERT expense → UPDATE remaining_amount → COMMIT. Якщо помилка — ROLLBACK."],
      },
      {
        id: "deposits-tab", name: "Депозити",
        desc: "Вклади з капіталізацією або купонними виплатами.",
        els: [
          { name: "Картка депозиту", type: "card", action: "Сума, ставка, дата початку, термін, тип (капіталізація/купон).", db: "deposits" },
          { name: "Кнопка «+ Депозит»", type: "button", action: "Modal: сума, ставка, початок, термін, тип капіталізації, рахунок. INSERT deposits + expense tx.", db: "deposits, transactions" },
          { name: "Бейдж «% сьогодні»", type: "badge", action: "isInterestDue: today.day === start.day AND monthsSince % coupon_period === 0.", db: "deposits.start_date, .coupon_period" },
          { name: "Кнопка «Закрити»", type: "button", action: "is_archived=true + INSERT income tx (повернення тіла вкладу).", db: "deposits, transactions" },
        ],
        tables: ["deposits", "transactions", "accounts"],
        logic: ["Відкриття депозиту → expense (гроші пішли з рахунку). Закриття → income (гроші повернулись)."],
      },
    ],
  },
  {
    id: "investments", group: "Основні сторінки", title: "Інвестиції",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    url: "/investments",
    desc: "Портфель інвестицій: Акції, ОВДП, Нерухомість, Бізнеси, Колекції.",
    intro: [
      "Інвестиції — найширший розділ: шість різних типів активів в одному місці. Акції і облігації — фінансові інструменти з ринковою оцінкою. Нерухомість і бізнеси — реальні активи з ручною оцінкою. Колекції — предмети колекціонування зі статусом owned/sold.",
      "Купівля будь-якого активу автоматично створює expense транзакцію — кошти списуються з вибраного рахунку. Для ОВДП передбачена операція «Купон» — при виплаті відсотків система дає вибрати рахунок і додає income транзакцію.",
      "Ціни акцій оновлюються автоматично через cron-задачу. Щоп'ятниці о 15:00 UTC (відкриті ринки) надсилається запит до Yahoo Finance API для кожного тікера з таблиці stocks. Це дозволяє бачити актуальний P&L без ручних оновлень.",
    ],
    goal: "Відстеження всіх інвестиційних активів, їх ринкова вартість і прибутковість.",
    keyPoints: [
      "Купівля активу → автоматична expense транзакція (зменшує баланс рахунку)",
      "P&L акцій = (current_price − buy_price) × quantity",
      "current_price оновлюється cron (Yahoo Finance) пн-пт 15:00 UTC",
      "Підсумок конвертує всі активи в base_currency через rateFor(nbuRates, currency)",
    ],
    mockupId: "investments",
    tabs: [
      {
        id: "stocks", name: "Акції",
        els: [
          { name: "Картка акції", type: "card", action: "Тікер, кількість, buy/current ціна, P&L у валюті та %.", db: "stocks" },
          { name: "Кнопка «+ Акція»", type: "button", action: "StockModal: тікер, кількість, ціна, валюта, рахунок. INSERT stocks + expense tx.", db: "stocks, transactions" },
        ],
        tables: ["stocks", "transactions"],
        logic: ["P&L = (current_price − buy_price) × quantity. current_price → Yahoo Finance API через cron."],
      },
      {
        id: "bonds", name: "Облігації (ОВДП)",
        els: [
          { name: "Картка облігації", type: "card", action: "Назва, сума, ставка %, дата погашення, розрахований купон.", db: "bonds" },
          { name: "Бейдж «Купон сьогодні»", type: "badge", action: "isCouponDue: day === buyDate.day AND monthsSince % periodMonths === 0.", db: "bonds.buy_date, .coupon_period" },
          { name: "Кнопка «Купон»", type: "button", action: "BondCouponModal: вибір рахунку, sum = amount×rate/12×period. INSERT income tx.", db: "transactions (INSERT income)" },
        ],
        tables: ["bonds", "transactions"],
        logic: ["Купон/виплата = (amount × rate/100) / (12 / periodMonths)."],
      },
      {
        id: "realestate", name: "Нерухомість",
        els: [
          { name: "Картка об'єкту", type: "card", action: "Адреса, ціна купівлі, поточна вартість, P&L, місячна оренда.", db: "real_estate" },
          { name: "Кнопка «+ Нерухомість»", type: "button", action: "Modal: адреса, buy_price, current_price, rental_income.", db: "real_estate (INSERT)" },
        ],
        tables: ["real_estate"],
      },
      {
        id: "business", name: "Бізнеси",
        els: [
          { name: "Картка бізнесу", type: "card", action: "Назва, частка %, статті доходів/витрат/активів.", db: "businesses, business_items" },
          { name: "Кнопка «+ Стаття»", type: "button", action: "BusinessItemModal: section (income/expense/asset), назва, сума.", db: "business_items (INSERT)" },
        ],
        tables: ["businesses", "business_items", "business_employees"],
      },
      {
        id: "collections", name: "Колекції",
        els: [
          { name: "Картка предмету", type: "card", action: "Категорія, buy_price, expected_price, статус (owned/sold).", db: "collections" },
        ],
        tables: ["collections"],
        logic: ["Статус sold: предмет не включається в загальний підсумок активів."],
      },
      {
        id: "summary", name: "Підсумок",
        els: [{ name: "Зведена таблиця", type: "table", action: "Ринкова вартість усіх активів у base_currency. Рядки по типах + загальна сума.", db: "всі інвестиційні таблиці + exchange_rates" }],
        tables: ["stocks", "bonds", "real_estate", "businesses", "collections", "exchange_rates"],
        logic: ["Конвертація через rateFor(nbuRates, currency) на поточний курс НБУ."],
      },
    ],
  },
  {
    id: "envelopes", group: "Основні сторінки", title: "Конверти",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    url: "/envelopes",
    desc: "Метод конвертів — тижневий ліміт витрат з місячного доходу.",
    intro: [
      "Метод конвертів — класична техніка особистих фінансів. Ідея проста: беремо місячний дохід, вираховуємо обов'язкові витрати (оренда, кредити), ділимо залишок на кількість тижнів. Це і є тижневий «конверт» — щотижневий бюджет на довільні витрати.",
      "В UBudget конверти налаштовуються один раз на місяць. Витрати тижня читаються напряму з таблиці транзакцій (WHERE type=expense AND date IN [week_start, week_end]) — без окремого кешування. Це означає що додавши нову транзакцію на сторінці Транзакцій — конверти одразу відображають реальний стан.",
    ],
    goal: "Просте щотижневе обмеження витрат в рамках місячного бюджету.",
    keyPoints: [
      "Витрати тижня = SUM(transactions) WHERE type=expense AND date IN [week_start, week_end]",
      "Обов'язкові витрати (mandatory jsonb) — вираховуються з доходу перед розподілом",
      "envelope_weeks і envelope_income_sources видалені (П17, П18) — все читається live",
    ],
    els: [
      { name: "Форма налаштування", type: "form", action: "Місяць, тижні, обов'язкові витрати (jsonb), загальний дохід. UPSERT envelope_settings.", db: "envelope_settings (UPSERT)" },
      { name: "Картка тижня", type: "card", action: "Тижневий бюджет, витрачено, залишок, прогрес-бар.", db: "envelope_settings, transactions (date range)" },
    ],
    tables: ["envelope_settings", "transactions"],
    logic: [
      "weekly_budget = (income − SUM(mandatory)) / weeks_count.",
      "spent = SUM(transactions.amount) WHERE type='expense' AND date BETWEEN week_start AND week_end.",
    ],
  },
  {
    id: "recurring", group: "Інструменти", title: "Регулярні транзакції",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    url: "/tools/recurring",
    desc: "Шаблони для автоматичного створення транзакцій: підписки, оренда, зарплата.",
    intro: [
      "Регулярні транзакції позбавляють від рутини. Щомісячна оренда, підписки, кредитний платіж — все це можна описати шаблоном один раз. Далі або cron-задача виконує їх автоматично, або кнопка «Виконати зараз» для ручного запуску.",
      "Cron /api/cron/recurring запускається щодня о 06:00 UTC. Перевіряє recurring_transactions WHERE next_run <= now() AND is_active=true. Після виконання next_run оновлюється: наступна дата = now() + interval.",
    ],
    goal: "Автоматизувати рутинні записи — не вводити вручну щомісяця.",
    keyPoints: [
      "Cron: щодня 06:00 UTC. Авторизація: CRON_SECRET header.",
      "next_run += interval після виконання (daily/weekly/monthly/yearly)",
      "Виконання шаблону = INSERT у transactions → тригер → оновлення балансу",
    ],
    els: [
      { name: "Список шаблонів", type: "table", action: "Тип, категорія, рахунок, сума, частота, next_run дата.", db: "recurring_transactions" },
      { name: "Кнопка «+ Шаблон»", type: "button", action: "Modal: тип, сума, рахунок, категорія, частота, next_run.", db: "recurring_transactions (INSERT)" },
      { name: "Кнопка «Виконати зараз»", type: "button", action: "INSERT транзакцію + UPDATE next_run.", db: "transactions (INSERT), recurring_transactions.next_run" },
      { name: "Toggle активності", type: "badge", action: "is_active=true/false. Вимкнений шаблон пропускається cron-ом.", db: "recurring_transactions.is_active" },
    ],
    tables: ["recurring_transactions", "transactions"],
    logic: [
      "Cron авторизується через Authorization: Bearer {CRON_SECRET} (Vercel env var).",
      "Після виконання: якщо frequency='monthly' → next_run = next_run + 30 days.",
    ],
  },
  {
    id: "health", group: "Інструменти", title: "Фінансове здоров'я",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    url: "/tools/health",
    desc: "Скоринг фінансового здоров'я по 6 індикаторах.",
    intro: [
      "Фінансове здоров'я — якісна оцінка стану, а не просто баланс. Шість показників від 0 до 100: подушка безпеки (скільки місяців може прожити без доходу), борговий тягар (debt/income), норма заощаджень, диверсифікація активів тощо.",
      "Кожен показник формулюється як запитання: «Чи є подушка на 3+ місяці?», «Чи борги < 30% від доходу?». Підсумковий скор і персоналізовані рекомендації допомагають зрозуміти що покращити першочергово.",
    ],
    goal: "Якісна оцінка фінансового стану з персональними рекомендаціями.",
    els: [
      { name: "Скоркарта", type: "chart", action: "6 індикаторів 0–100. Читає accounts, transactions, credits, investments. Рахує бали по формулах.", db: "accounts, transactions, credits, stocks, bonds" },
    ],
    tables: ["accounts", "transactions", "credits", "stocks", "bonds"],
  },
  {
    id: "fuel", group: "Інструменти", title: "Ціни на пальне",
    icon: "M3 12h18M3 6h18M3 18h18",
    url: "/tools/fuel-prices",
    desc: "Графік динаміки цін А95, ДП, газ.",
    intro: [
      "Публічний інструмент для відстеження цін на паливо. Дані зберігаються в fuel_prices_history і відображаються як лінійний графік по датах. Корисно при плануванні витрат на авто або порівнянні з особистими транзакціями на паливо.",
    ],
    goal: "Планування витрат на авто і відстеження динаміки цін.",
    els: [
      { name: "Графік цін", type: "chart", action: "Лінійний графік по датах. А95, ДП, газ — окремі лінії.", db: "fuel_prices_history" },
    ],
    tables: ["fuel_prices_history"],
  },
  {
    id: "settings", group: "Налаштування", title: "Налаштування",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    url: "/settings",
    desc: "Профіль, базова валюта, активні модулі, сповіщення.",
    intro: [
      "Налаштування персоналізують застосунок під конкретного користувача. Найважливіше — вибір активних модулів. Якщо кредити не потрібні — вимикаємо модуль і пункт меню зникає. Це зменшує когнітивне навантаження.",
      "profiles.modules — jsonb-об'єкт типу {\"credits\": true, \"investments\": false, ...}. Це єдине джерело правди для видимості розділів. Таблиця user_modules видалена як зайва (П21).",
    ],
    goal: "Персоналізація застосунку: валюта, активні модулі, сповіщення.",
    keyPoints: [
      "profiles.modules (jsonb) — єдине джерело правди для видимості розділів у меню",
      "base_currency впливає на конвертацію балансу на дашборді та в інвестиціях",
      "profiles створюється автоматично тригером handle_new_user() при реєстрації",
    ],
    els: [
      { name: "Базова валюта", type: "form", action: "UAH / USD / EUR. UPDATE profiles.base_currency. Впливає на конвертацію.", db: "profiles.base_currency" },
      { name: "Модулі", type: "form", action: "Toggle для кожного модуля → UPDATE profiles.modules (jsonb). Вимкнений зникає з меню.", db: "profiles.modules" },
      { name: "Сповіщення", type: "form", action: "Email/push toggle → UPDATE profiles.notifications (jsonb).", db: "profiles.notifications" },
    ],
    tables: ["profiles"],
    logic: [
      "profiles.modules: якщо ключ відсутній або false → модуль вимкнено. Layout читає modules при кожному рендері меню.",
      "handle_new_user() тригер: AFTER INSERT ON auth.users → INSERT profiles з дефолтами.",
    ],
  },
  {
    id: "arch-db", group: "Архітектура", title: "База даних",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4-8 4s8 1.79 8 4",
    desc: "PostgreSQL через Supabase. Повна схема в supabase/schema.csv.",
    intro: [
      "UBudget використовує Supabase (PostgreSQL) з Row Level Security на кожній таблиці. Фундаментальне правило: USING (user_id = auth.uid()). Жоден запит не може отримати чужі дані — навіть якщо клієнтський код помиляється.",
      "Ключовий патерн: баланс рахунку НІКОЛИ не пишеться клієнтом напряму. Тригер sync_account_balance перехоплює кожен INSERT/UPDATE на transactions і атомарно оновлює accounts.balance. Це елімінує цілий клас race condition помилок.",
      "Soft-delete замість DELETE: transactions.deleted_at = now() зберігає запис у БД для аудиту, але тригер відкочує його вплив на баланс. Це дозволяє відновити «видалену» транзакцію якщо потрібно.",
    ],
    goal: "Ізольоване multi-tenant зберігання з атомарними операціями.",
    mockupId: "arch-db",
    keyPoints: [
      "RLS на всіх таблицях: USING (user_id = auth.uid())",
      "sync_account_balance тригер — єдиний хто пише в accounts.balance",
      "Soft-delete: deleted_at != NULL → тригер відкочує вплив на баланс",
      "exchange_rates — кеш НБУ на 24 год, ключ: (date, currency)",
      "pay_credit RPC — атомарна транзакція (INSERT + UPDATE в одному BEGIN/COMMIT)",
    ],
    els: [
      { name: "sync_account_balance", type: "card", action: "AFTER INSERT/UPDATE ON transactions → UPDATE accounts.balance. Враховує type, amount, to_amount, deleted_at.", db: "accounts, transactions" },
      { name: "pay_credit RPC", type: "card", action: "BEGIN → INSERT expense tx → UPDATE credits.remaining_amount → COMMIT. SECURITY DEFINER.", db: "credits, transactions" },
      { name: "handle_new_user()", type: "card", action: "AFTER INSERT ON auth.users → INSERT profiles з дефолтами (base_currency=UAH).", db: "profiles" },
      { name: "RLS-політики", type: "card", action: "USING (user_id = auth.uid()) на фінансових таблицях. Адмін: USING (role IN admin/superadmin).", db: "всі таблиці" },
    ],
    tables: ["profiles", "accounts", "transactions", "categories", "budgets", "exchange_rates"],
    logic: [
      "schema.csv — актуальна схема БД (оновлювати вручну при міграціях).",
      "Міграції: supabase/migrations/*.sql. combined_run_in_supabase.sql — єдиний файл для запуску всіх міграцій.",
      "exchange_rates: SELECT currency, rate WHERE date = today. Якщо немає — fallback на hardcoded FALLBACK_RATES.",
    ],
  },
  {
    id: "arch-cron", group: "Архітектура", title: "Cron-задачі",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    desc: "Vercel Cron Jobs для автоматизації фонових задач.",
    intro: [
      "Три cron-задачі підтримують актуальність даних без ручних дій. Розклад визначається у vercel.json → crons[]. Авторизація — Bearer token (CRON_SECRET env var). Всі ендпоінти доступні і через прямий GET для ручного тестування.",
      "Курси НБУ: щодня о 10:00 UTC, поки ринок ще закритий для більшості операцій. Ціни акцій: пн-пт о 15:00 UTC — закриття торгів по Варшаві/Лондону. Регулярні транзакції: 06:00 UTC — до початку робочого дня.",
    ],
    goal: "Актуальні дані без ручних дій: курси, ціни акцій, регулярні транзакції.",
    keyPoints: [
      "Авторизація: Authorization: Bearer {CRON_SECRET} (Vercel env var, trim() обов'язковий)",
      "Всі cron-ендпоінти можна запустити вручну через GET",
      "Yahoo Finance: /v8/finance/chart/{ticker}?interval=1d&range=1d → meta.regularMarketPrice",
    ],
    els: [
      { name: "/api/cron/nbu-rates", type: "card", action: "Щодня 10:00 UTC. Отримує курси з api.nbu.org.ua. UPSERT exchange_rates для USD/EUR/GBP/CHF.", db: "exchange_rates" },
      { name: "/api/cron/stock-prices", type: "card", action: "Пн-Пт 15:00 UTC. GET Yahoo Finance для кожного stocks.ticker. UPDATE stocks.current_price.", db: "stocks" },
      { name: "/api/cron/recurring", type: "card", action: "Щодня 06:00 UTC. WHERE next_run <= now() AND is_active=true. INSERT tx + UPDATE next_run.", db: "recurring_transactions, transactions" },
    ],
    tables: ["exchange_rates", "stocks", "recurring_transactions"],
    logic: [
      "CRON_SECRET: обов'язково .trim() при читанні — whitespace в .env ламає авторизацію (виправлено).",
      "Якщо Yahoo Finance не повертає ціну (market closed) — UPDATE не виконується, поле зберігає попереднє значення.",
    ],
  },
  {
    id: "arch-auth", group: "Архітектура", title: "Автентифікація",
    icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    desc: "Supabase Auth — email/password і Magic Link. Сесія через @supabase/ssr.",
    intro: [
      "Автентифікація побудована на Supabase Auth з SSR-інтеграцією через @supabase/ssr. Сесія зберігається в cookies (не localStorage) — це дозволяє серверним компонентам Next.js 15 читати стан авторизації.",
      "middleware.ts перехоплює кожен запит до /app/(app)/*. Якщо сесії немає — redirect на /login. Для /admin/* додаткова перевірка: profiles.role IN ('admin','superadmin').",
    ],
    goal: "Безпечна автентифікація та захист маршрутів.",
    keyPoints: [
      "SSR: @supabase/ssr зберігає сесію в httpOnly cookies",
      "middleware.ts: перевіряє auth на кожному запиті до (app)/*",
      "Admin: profiles.role IN (admin, superadmin) — без цього redirect на /admin-login",
      "handle_new_user(): auto-INSERT profiles при реєстрації",
    ],
    els: [
      { name: "middleware.ts", type: "card", action: "Edge Function. supabase.auth.getUser() → якщо null → redirect /login.", db: "auth.users (Supabase Auth)" },
      { name: "lib/supabase/client.ts", type: "card", action: "createBrowserClient() — для Client Components. Читає/записує cookies.", db: "Supabase Auth" },
      { name: "lib/supabase/server.ts", type: "card", action: "createServerClient() — для Server Components і Route Handlers.", db: "Supabase Auth" },
    ],
    tables: ["profiles"],
    logic: [
      "При реєстрації: Supabase Auth INSERT auth.users → handle_new_user() тригер → INSERT profiles.",
      "Admin перевірка: SELECT role FROM profiles WHERE id = auth.uid(). Якщо role NOT IN (admin, superadmin) → redirect.",
    ],
  },
  {
    id: "admin-dashboard", group: "Адмін-панель", title: "Адмін: Дашборд",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    url: "/admin/dashboard",
    desc: "Метрики застосунку: користувачі, активність, тикети.",
    intro: [
      "Адмін-дашборд дає операційний огляд: скільки є користувачів, яка активність, чи є нові звернення. Використовує service_role ключ Supabase для доступу до агрегованих даних поверх RLS.",
    ],
    goal: "Оперативний моніторинг стану застосунку.",
    els: [
      { name: "Виджет «Користувачі»", type: "card", action: "COUNT(profiles) total + COUNT WHERE created_at > week ago.", db: "profiles" },
      { name: "Виджет «Тикети»", type: "card", action: "COUNT tickets WHERE status='new'.", db: "tickets" },
      { name: "Виджет «Транзакції»", type: "card", action: "COUNT(transactions) за сьогодні.", db: "transactions" },
    ],
    tables: ["profiles", "tickets"],
  },
  {
    id: "admin-users", group: "Адмін-панель", title: "Адмін: Користувачі",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    url: "/admin/users",
    desc: "Список всіх користувачів: email, ім'я, роль, дата реєстрації.",
    intro: [
      "Сторінка управління акаунтами. Пошук по email, зміна ролей (тільки superadmin). Ролі: user (за замовчуванням), admin, superadmin. Тільки superadmin може призначити admin іншому користувачу.",
    ],
    goal: "Управління акаунтами, підтримка, призначення адмінів.",
    els: [
      { name: "Таблиця користувачів", type: "table", action: "Email, full_name, role, created_at. Пошук client-side по email.", db: "profiles" },
      { name: "Зміна ролі", type: "button", action: "SELECT role → UPDATE profiles.role. Доступно тільки superadmin.", db: "profiles.role" },
    ],
    tables: ["profiles"],
  },
  {
    id: "admin-tasks", group: "Адмін-панель", title: "Адмін: Завдання",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    url: "/admin/tasks",
    desc: "Kanban-дошка для відстеження завдань розробника.",
    intro: [
      "Персональний трекер розробника, вбудований прямо в застосунок. Дошка: backlog → todo → in_progress → review → done. Типи: bug, feature, task, chore, idea. Пріоритети: low, medium, high, critical.",
      "Таблиця tasks захищена RLS: тільки admin/superadmin мають доступ. Поле updated_at автоматично оновлюється тригером set_updated_at() при кожному UPDATE.",
    ],
    goal: "Персональний трекер — аналог Jira всередині застосунку.",
    els: [
      { name: "Kanban-колонки", type: "card", action: "backlog / todo / in_progress / review / done. Перетягування → UPDATE tasks.status.", db: "tasks.status" },
      { name: "Кнопка «+ Завдання»", type: "button", action: "Modal: тип, пріоритет, назва, опис, assignee, due_date.", db: "tasks (INSERT)" },
      { name: "Фільтр тип/пріоритет", type: "filter", action: "Client-side фільтрація по type і priority.", db: "tasks (local)" },
    ],
    tables: ["tasks"],
    logic: ["set_updated_at() тригер: BEFORE UPDATE ON tasks → NEW.updated_at = now()."],
  },
  {
    id: "admin-tickets", group: "Адмін-панель", title: "Адмін: Тикети",
    icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
    url: "/admin/tickets",
    desc: "Helpdesk: звернення користувачів, відповіді адміна.",
    intro: ["Підтримка користувачів безпосередньо в адмін-панелі. Фільтр по статусах: new / open / resolved. Відповідь адміна → UPDATE tickets.admin_reply + status='resolved'."],
    goal: "Підтримка користувачів без виходу з адмін-панелі.",
    els: [
      { name: "Список тикетів", type: "table", action: "Фільтр: new / open / resolved. Клік → деталі + форма відповіді.", db: "tickets" },
      { name: "Форма відповіді", type: "form", action: "admin_reply → UPDATE tickets + status='resolved'.", db: "tickets" },
    ],
    tables: ["tickets"],
  },
  {
    id: "admin-blog", group: "Адмін-панель", title: "Адмін: Блог",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    url: "/admin/blog",
    desc: "Markdown-редактор для публікації статей.",
    intro: ["SEO-контент і корисні матеріали. Статті з title, slug, content (Markdown), meta_title, meta_desc. Статус: draft / published."],
    goal: "Публікація корисного контенту для залучення та утримання користувачів.",
    els: [
      { name: "Редактор статті", type: "form", action: "title, slug, content (MD), excerpt. UPSERT posts.", db: "posts" },
      { name: "Кнопка «Опублікувати»", type: "button", action: "UPDATE posts.status='published', published_at=now().", db: "posts.status" },
    ],
    tables: ["posts"],
  },
];

const GROUP_ORDER = ["Основні сторінки", "Інструменти", "Налаштування", "Архітектура", "Адмін-панель"];

// ─── UI Mockups ───────────────────────────────────────────────────────────────

function MockupDashboard() {
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 select-none">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Дашборд</p>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { l: "Баланс", v: "124 350 ₴", c: "text-neutral-900", sub: "3 рахунки" },
          { l: "Доходи", v: "+45 000 ₴", c: "text-green-500", sub: "↑12% vs минулий" },
          { l: "Витрати", v: "−23 400 ₴", c: "text-red-500", sub: "↓3% vs минулий" },
          { l: "Інвестиції", v: "89 500 ₴", c: "text-orange-500", sub: "акції+облігації" },
        ].map(w => (
          <div key={w.l} className="bg-white rounded-xl border border-neutral-100 p-2.5">
            <p className="text-[9px] text-neutral-400 mb-0.5">{w.l}</p>
            <p className={`text-xs font-bold ${w.c}`}>{w.v}</p>
            <p className="text-[8px] text-neutral-300 mt-0.5">{w.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <p className="text-[9px] font-semibold text-neutral-400 px-3 py-1.5 border-b border-neutral-50">Останні транзакції</p>
        {[
          { e: "🛒", n: "Продукти", a: "Ощадбанк", v: "−450 ₴", c: "text-red-400" },
          { e: "💰", n: "Зарплата", a: "Монобанк", v: "+25 000 ₴", c: "text-green-400" },
          { e: "⛽", n: "Пальне", a: "Готівка", v: "−800 ₴", c: "text-red-400" },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-50 last:border-0">
            <span className="text-sm">{t.e}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-medium text-neutral-700 truncate">{t.n}</p>
              <p className="text-[8px] text-neutral-400">{t.a}</p>
            </div>
            <p className={`text-[9px] font-bold ${t.c}`}>{t.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupTransactions() {
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 select-none">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Транзакції</p>
        <div className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg">+ Додати</div>
      </div>
      <div className="flex items-center justify-between bg-white rounded-xl border border-neutral-100 px-3 py-2 mb-2">
        <div className="text-[9px] text-neutral-400">◂</div>
        <p className="text-[9px] font-semibold text-neutral-700">Травень 2026 · поточний місяць</p>
        <div className="text-[9px] text-neutral-400">▸</div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="bg-white rounded-lg border border-neutral-100 p-2 text-center">
          <p className="text-[9px] font-bold text-green-500">+45 000 ₴</p>
          <p className="text-[8px] text-neutral-400">Доходи</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-100 p-2 text-center">
          <p className="text-[9px] font-bold text-red-500">−23 400 ₴</p>
          <p className="text-[8px] text-neutral-400">Витрати</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-100 p-2 text-center">
          <p className="text-[9px] font-bold text-orange-500">+21 600 ₴</p>
          <p className="text-[8px] text-neutral-400">Різниця</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 border-b border-neutral-50">
          <p className="text-[9px] font-semibold text-neutral-500">10 травня</p>
          <p className="text-[9px] font-bold text-red-400">−1 250 ₴</p>
        </div>
        {[
          { e: "🛒", n: "АТБ", s: "Продукти › 🧴 побутова хімія", v: "−450", c: "text-red-400" },
          { e: "⛽", n: "ОККО", s: "Транспорт", v: "−800", c: "text-red-400" },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-neutral-50 last:border-0">
            <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-sm shrink-0">{t.e}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-medium text-neutral-700">{t.n}</p>
              <p className="text-[8px] text-neutral-400 truncate">{t.s}</p>
            </div>
            <p className={`text-[9px] font-bold ${t.c}`}>{t.v} ₴</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupAccounts() {
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 select-none">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Рахунки</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { e: "💳", n: "Монобанк", t: "card · UAH", b: "54 320 ₴", c: "from-blue-500 to-blue-600" },
          { e: "🏦", n: "Ощадбанк", t: "card · UAH", b: "12 040 ₴", c: "from-green-500 to-green-600" },
          { e: "💵", n: "Готівка USD", t: "cash · USD", b: "$1 200", c: "from-amber-500 to-orange-500" },
          { e: "₿", n: "Binance", t: "crypto · USDT", b: "3 890 $", c: "from-purple-500 to-purple-600" },
        ].map(a => (
          <div key={a.n} className={`bg-gradient-to-br ${a.c} rounded-xl p-3 text-white`}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-lg">{a.e}</span>
              <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full">{a.t}</span>
            </div>
            <p className="text-[9px] opacity-80">{a.n}</p>
            <p className="text-xs font-bold mt-0.5">{a.b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupBudget() {
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 select-none">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Бюджет · Травень 2026</p>
      <div className="space-y-2">
        {[
          { e: "🛒", n: "Їжа", plan: 8000, fact: 6240 },
          { e: "🚗", n: "Транспорт", plan: 3000, fact: 2950 },
          { e: "💡", n: "Комунальні", plan: 2500, fact: 2500 },
          { e: "🎮", n: "Розваги", plan: 1500, fact: 380 },
        ].map(r => {
          const pct = Math.min(Math.round(r.fact / r.plan * 100), 100);
          const barColor = pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-green-400";
          return (
            <div key={r.n} className="bg-white rounded-lg border border-neutral-100 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{r.e}</span>
                  <span className="text-[9px] font-medium text-neutral-700">{r.n}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-neutral-500">{r.fact.toLocaleString("uk")} / {r.plan.toLocaleString("uk")} ₴</span>
                  <span className={`text-[8px] font-bold ${pct >= 100 ? "text-red-500" : pct >= 80 ? "text-amber-500" : "text-green-500"}`}>{pct}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-neutral-100">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MockupCredits() {
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 select-none">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Кредити</p>
      <div className="space-y-2">
        {[
          { n: "Іпотека", rem: 2_400_000, total: 3_000_000, pay: 18_500, day: 10, rate: 12.5 },
          { n: "Авто Renault", rem: 87_000, total: 180_000, pay: 4_200, day: 15, rate: 18 },
        ].map(c => {
          const pct = Math.round((c.total - c.rem) / c.total * 100);
          return (
            <div key={c.n} className="bg-white rounded-xl border border-neutral-100 p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[9px] font-bold text-neutral-800">{c.n}</p>
                  <p className="text-[8px] text-neutral-400">{c.rate}% · {c.day}-го числа</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-neutral-900">{c.rem.toLocaleString("uk")} ₴</p>
                  <p className="text-[8px] text-neutral-400">платіж: {c.pay.toLocaleString("uk")} ₴</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 mb-2">
                <div className="h-full rounded-full bg-orange-400" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-neutral-400">Погашено {pct}%</span>
                <button className="text-[8px] bg-orange-500 text-white px-2 py-0.5 rounded-lg font-medium">Платіж</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MockupReports() {
  const bars = [
    { l: "Лют", inc: 35000, exp: 22000 },
    { l: "Бер", inc: 38000, exp: 28000 },
    { l: "Кві", inc: 42000, exp: 31000 },
    { l: "Тра", inc: 45000, exp: 23400 },
  ];
  const maxV = Math.max(...bars.map(b => Math.max(b.inc, b.exp)));
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 select-none">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Звіти · 6 місяців</p>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { l: "Доходи", v: "165 000 ₴", c: "text-green-500" },
          { l: "Витрати", v: "104 400 ₴", c: "text-red-500" },
          { l: "Заощаджено", v: "60 600 ₴", c: "text-orange-500" },
          { l: "Серед/міс", v: "17 400 ₴", c: "text-neutral-700" },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-lg border border-neutral-100 p-2 text-center">
            <p className={`text-[9px] font-bold ${s.c}`}>{s.v}</p>
            <p className="text-[7px] text-neutral-400 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-neutral-100 p-3">
        <div className="flex items-end gap-2 h-16">
          {bars.map(b => (
            <div key={b.l} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex items-end gap-0.5 h-12">
                <div className="flex-1 rounded-t-sm bg-green-300" style={{ height: `${b.inc / maxV * 100}%` }} />
                <div className="flex-1 rounded-t-sm bg-red-300" style={{ height: `${b.exp / maxV * 100}%` }} />
              </div>
              <p className="text-[7px] text-neutral-400">{b.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupInvestments() {
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 select-none">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Інвестиції · Підсумок</p>
      <div className="space-y-1.5">
        {[
          { t: "📈 Акції", v: "45 200 ₴", pl: "+8.4%", plc: "text-green-500" },
          { t: "🏛 ОВДП", v: "30 000 ₴", pl: "+15.5%", plc: "text-green-500" },
          { t: "🏠 Нерухомість", v: "2 800 000 ₴", pl: "+12.0%", plc: "text-green-500" },
          { t: "💼 Бізнеси", v: "120 000 ₴", pl: "±0%", plc: "text-neutral-400" },
        ].map(r => (
          <div key={r.t} className="flex items-center justify-between bg-white rounded-lg border border-neutral-100 px-3 py-2">
            <p className="text-[9px] font-medium text-neutral-700">{r.t}</p>
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-bold text-neutral-900">{r.v}</p>
              <p className={`text-[8px] font-semibold ${r.plc}`}>{r.pl}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between bg-orange-50 rounded-lg border border-orange-100 px-3 py-2">
          <p className="text-[9px] font-bold text-orange-700">Всього</p>
          <p className="text-[9px] font-bold text-orange-700">2 995 200 ₴</p>
        </div>
      </div>
    </div>
  );
}

function MockupArchDb() {
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 select-none font-mono">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Архітектура · Тригер</p>
      <div className="bg-neutral-900 rounded-xl p-3 text-[9px] leading-relaxed overflow-hidden">
        <p className="text-purple-400">CREATE OR REPLACE FUNCTION</p>
        <p className="text-green-400 ml-2">sync_account_balance()</p>
        <p className="text-blue-300 ml-2">RETURNS TRIGGER AS $$</p>
        <p className="text-neutral-400 ml-2">BEGIN</p>
        <p className="text-yellow-300 ml-4">IF TG_OP = <span className="text-orange-300">&apos;INSERT&apos;</span> THEN</p>
        <p className="text-neutral-300 ml-6">UPDATE accounts SET</p>
        <p className="text-green-300 ml-8">balance = balance + NEW.amount</p>
        <p className="text-neutral-400 ml-6">WHERE id = NEW.account_id;</p>
        <p className="text-yellow-300 ml-4">END IF;</p>
        <p className="text-neutral-400 ml-2">RETURN NEW;</p>
        <p className="text-neutral-400 ml-2">END; $$ LANGUAGE plpgsql;</p>
      </div>
      <div className="mt-2 flex gap-1.5">
        {["accounts", "transactions", "credits"].map(t => (
          <span key={t} className="text-[8px] bg-neutral-900 text-green-400 px-2 py-0.5 rounded font-mono">{t}</span>
        ))}
      </div>
    </div>
  );
}

const MOCKUPS: Record<string, React.ReactNode> = {
  dashboard: <MockupDashboard />,
  transactions: <MockupTransactions />,
  accounts: <MockupAccounts />,
  budget: <MockupBudget />,
  credits: <MockupCredits />,
  reports: <MockupReports />,
  investments: <MockupInvestments />,
  "arch-db": <MockupArchDb />,
};

// ─── DB Usage Modal ───────────────────────────────────────────────────────────

function DbUsageModal({ table, onClose, onNav }: {
  table: string; onClose: () => void; onNav: (docId: string) => void;
}) {
  const usages = DB_USAGE[table] ?? [];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <code className="text-sm font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">{table}</code>
            <p className="text-xs text-neutral-400 mt-1">Де використовується в застосунку</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <Ico d="M6 18L18 6M6 6l12 12" />
          </button>
        </div>
        <div className="p-4">
          {usages.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">Немає зареєстрованих посилань</p>
          ) : (
            <div className="space-y-2">
              {usages.map((u, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-neutral-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-neutral-800">{u.page}</p>
                      {u.url && (
                        <code className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">{u.url}</code>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">{u.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

function DbChips({ tables, onTableClick }: { tables: string[]; onTableClick: (t: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tables.map(t => (
        <button key={t} onClick={() => onTableClick(t)}
          className="text-xs bg-neutral-900 text-green-400 px-2.5 py-1 rounded-lg font-mono hover:bg-neutral-700 hover:text-green-300 transition-colors group relative">
          {t}
          {DB_USAGE[t] && (
            <span className="ml-1 text-[9px] text-green-600 group-hover:text-green-400">
              ×{DB_USAGE[t].length}
            </span>
          )}
        </button>
      ))}
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

function TabView({ tabs, onTableClick }: { tabs: DocTab[]; onTableClick: (t: string) => void }) {
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
          {tab.desc && <p className="text-sm text-neutral-600 leading-relaxed">{tab.desc}</p>}
          {tab.els && tab.els.length > 0 && (
            <><p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">UI-елементи</p><ElsTable els={tab.els} /></>
          )}
          {tab.logic && tab.logic.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Логіка</p>
              <LogicList items={tab.logic} />
            </div>
          )}
          {tab.tables && tab.tables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Таблиці БД <span className="text-neutral-300 font-normal normal-case">(клікни — де ще використовується)</span></p>
              <DbChips tables={tab.tables} onTableClick={onTableClick} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Content({ doc, onTableClick }: { doc: Doc; onTableClick: (t: string) => void }) {
  const mockup = doc.mockupId ? MOCKUPS[doc.mockupId] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
          <span>{doc.group}</span>
          {doc.url && (
            <><span>/</span><code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600 font-mono">{doc.url}</code></>
          )}
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">{doc.title}</h1>
        <p className="text-sm text-neutral-500 mt-1">{doc.desc}</p>
      </div>

      {/* Article intro + optional mockup side by side */}
      <div className={`${mockup ? "lg:grid lg:grid-cols-5 lg:gap-6" : ""}`}>
        <div className={`${mockup ? "lg:col-span-3" : ""} space-y-3`}>
          {doc.intro.map((p, i) => (
            <p key={i} className="text-sm text-neutral-600 leading-relaxed">{p}</p>
          ))}
        </div>
        {mockup && (
          <div className="lg:col-span-2 mt-4 lg:mt-0">
            {mockup}
          </div>
        )}
      </div>

      {/* Goal */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Бізнес-ціль</p>
        <p className="text-sm text-orange-900 font-medium">{doc.goal}</p>
      </div>

      {/* Key points */}
      {doc.keyPoints && doc.keyPoints.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Ключові факти</p>
          <ul className="space-y-1.5">
            {doc.keyPoints.map((k, i) => (
              <li key={i} className="flex gap-2 text-xs text-blue-800">
                <span className="text-blue-400 shrink-0 font-bold">→</span>
                {k}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs or flat content */}
      {doc.tabs ? <TabView tabs={doc.tabs} onTableClick={onTableClick} /> : (
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
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                Таблиці БД <span className="text-neutral-300 font-normal normal-case">(клікни — де ще використовується)</span>
              </p>
              <DbChips tables={doc.tables} onTableClick={onTableClick} />
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
  const [dbModal, setDbModal] = useState<string | null>(null);

  const active = DOCS.find(d => d.id === activeId) ?? DOCS[0];

  function handleNav(docId: string) {
    setDbModal(null);
    setActiveId(docId);
  }

  return (
    <div className="-m-4 lg:-m-6 flex" style={{ height: "calc(100vh - 48px)" }}>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 w-64 z-50 border-r border-neutral-200 transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ top: 48 }}>
        <Sidebar docs={DOCS} activeId={activeId} search={search} onSearch={setSearch}
          onSelect={id => { setActiveId(id); setMobileOpen(false); }} />
      </div>

      <div className="hidden lg:flex w-60 shrink-0 flex-col border-r border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 shrink-0">
          <p className="text-sm font-bold text-neutral-900">Документація</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">UBudget — технічний довідник</p>
        </div>
        <Sidebar docs={DOCS} activeId={activeId} search={search} onSearch={setSearch} onSelect={setActiveId} />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white sticky top-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="text-neutral-500 hover:text-neutral-900">
            <Ico d="M4 6h16M4 12h16M4 18h16" cls="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-neutral-700">{active.title}</p>
        </div>
        <div className="max-w-4xl mx-auto p-5 lg:p-8">
          <Content key={active.id} doc={active} onTableClick={setDbModal} />
        </div>
      </div>

      {dbModal && (
        <DbUsageModal
          table={dbModal}
          onClose={() => setDbModal(null)}
          onNav={handleNav}
        />
      )}
    </div>
  );
}
