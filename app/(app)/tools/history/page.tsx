// ФАЙЛ: app/(app)/tools/history/page.tsx
// URL: /tools/history — Фінансова історія за місяцями
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Card } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────

interface MonthData {
  key: string;        // "2026-03"
  label: string;      // "Березень 2026"
  shortLabel: string; // "Бер"
  income: number;
  expenses: number;
  savings: number;     // income - expenses
  savingsRate: number; // %
  topCategory: { key: string; amount: number } | null;
  txCount: number;
}

interface YearSummary {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  avgSavingsRate: number;
  bestMonth: MonthData | null;
  worstMonth: MonthData | null;
  months: MonthData[];
}

type ViewMode = "table" | "chart";

// ─── Helpers ──────────────────────────────────────────────────

function fmt(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн";
}

const MONTHS_UA = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
const MONTHS_SHORT = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];

const CAT_NAMES: Record<string, string> = {
  food: "Продукти", cafe: "Кафе", transport: "Транспорт", fuel: "Пальне",
  health: "Здоров'я", housing: "Комунальні", clothes: "Одяг", entertainment: "Розваги",
  education: "Освіта", sport: "Спорт", beauty: "Краса", pets: "Тварини",
  gifts: "Подарунки", other: "Інше",
};
const CAT_EMOJI: Record<string, string> = {
  food: "🛒", cafe: "☕", transport: "🚗", fuel: "⛽", health: "💊",
  housing: "🏠", clothes: "👗", entertainment: "🎮", education: "📚",
  sport: "🏃", beauty: "💄", pets: "🐾", gifts: "🎁", other: "📦",
};

// ─── Mini Bar Chart ───────────────────────────────────────────

function MiniChart({ months, metric }: { months: MonthData[]; metric: "income" | "expenses" | "savings" }) {
  const values = months.map(m => m[metric]);
  const max = Math.max(...values.map(Math.abs), 1);

  const colors = {
    income: { bar: "bg-green-400", barNeg: "bg-red-400" },
    expenses: { bar: "bg-red-400", barNeg: "bg-red-400" },
    savings: { bar: "bg-green-400", barNeg: "bg-red-400" },
  };

  return (
    <div className="flex items-end gap-1 h-24">
      {months.map((m, i) => {
        const val = values[i];
        const h = Math.max((Math.abs(val) / max) * 100, 4);
        const isNeg = val < 0;
        const isLast = i === months.length - 1;

        return (
          <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                <p className="font-semibold">{m.label}</p>
                <p>{isNeg ? "−" : "+"}{fmt(Math.abs(val))}</p>
              </div>
            </div>

            <div className="w-full flex items-end justify-center" style={{ height: 80 }}>
              <div
                className={`w-full max-w-5 rounded-t-sm transition-all duration-300 ${
                  isNeg ? colors[metric].barNeg : colors[metric].bar
                } ${isLast ? "opacity-100" : "opacity-60"}`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-400 leading-none">{m.shortLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Trend Arrow ──────────────────────────────────────────────

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <span className="text-xs text-neutral-300">—</span>;
  const pct = Math.round(((current - previous) / Math.abs(previous)) * 100);
  const isUp = pct > 0;
  const isZero = pct === 0;

  if (isZero) return <span className="text-xs text-neutral-400">0%</span>;

  return (
    <span className={`text-xs font-semibold flex items-center gap-0.5 ${isUp ? "text-green-500" : "text-red-500"}`}>
      <Icon
        d={isUp ? icons.trendUp : icons.trendDown}
        className="w-3 h-3"
      />
      {isUp ? "+" : ""}{pct}%
    </span>
  );
}

// ─── Month Row ────────────────────────────────────────────────

function MonthRow({ month, prev, isCurrentMonth }: { month: MonthData; prev: MonthData | null; isCurrentMonth: boolean }) {
  const savingsColor = month.savings >= 0 ? "text-green-500" : "text-red-500";
  const rateColor = month.savingsRate >= 20 ? "text-green-500" : month.savingsRate >= 0 ? "text-amber-500" : "text-red-500";

  return (
    <div className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
      isCurrentMonth ? "bg-orange-50/50 dark:bg-orange-950/10 border-l-2 border-orange-400" : ""
    }`}>
      {/* Місяць */}
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {month.label}
        </p>
        {isCurrentMonth && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/30 text-orange-500 font-semibold">
            зараз
          </span>
        )}
      </div>

      {/* Дохід */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-500 font-medium tabular-nums">+{fmt(month.income)}</span>
        {prev && <Trend current={month.income} previous={prev.income} />}
      </div>

      {/* Витрати */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-500 font-medium tabular-nums">−{fmt(month.expenses)}</span>
        {prev && <Trend current={month.expenses} previous={prev.expenses} />}
      </div>

      {/* Різниця */}
      <div>
        <span className={`text-sm font-bold tabular-nums ${savingsColor}`}>
          {month.savings >= 0 ? "+" : "−"}{fmt(Math.abs(month.savings))}
        </span>
      </div>

      {/* Норма заощаджень */}
      <div>
        <span className={`text-sm font-medium tabular-nums ${rateColor}`}>
          {month.income > 0 ? `${month.savingsRate}%` : "—"}
        </span>
      </div>

      {/* Топ категорія */}
      <div>
        {month.topCategory ? (
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <span>{CAT_EMOJI[month.topCategory.key] ?? "📦"}</span>
            {CAT_NAMES[month.topCategory.key] ?? month.topCategory.key}
            <span className="text-neutral-300 dark:text-neutral-600 ml-0.5">{fmt(month.topCategory.amount)}</span>
          </span>
        ) : (
          <span className="text-xs text-neutral-300">—</span>
        )}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function FinancialHistoryPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [yearData, setYearData] = useState<YearSummary | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [view, setView] = useState<ViewMode>("table");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Запитуємо всі транзакції за рік
    const startDate = `${year}-01-01`;
    const endDate = `${year + 1}-01-01`;

    const { data: txs } = await supabase
      .from("transactions")
      .select("type, amount, transaction_date, category_key")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate)
      .order("transaction_date", { ascending: true });

    // Групуємо по місяцях
    const monthsMap: Record<string, { income: number; expenses: number; categories: Record<string, number>; txCount: number }> = {};

    // Ініціалізуємо всі 12 місяців
    const now = new Date();
    const currentMonth = now.getFullYear() === year ? now.getMonth() : 11;

    for (let i = 0; i <= currentMonth; i++) {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      monthsMap[key] = { income: 0, expenses: 0, categories: {}, txCount: 0 };
    }

    // Наповнюємо даними
    (txs ?? []).forEach((tx: { type: string; amount: number; transaction_date: string; category_key: string | null }) => {
      const monthKey = tx.transaction_date.slice(0, 7);
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { income: 0, expenses: 0, categories: {}, txCount: 0 };
      }
      const m = monthsMap[monthKey];
      m.txCount++;

      if (tx.type === "income") {
        m.income += Number(tx.amount);
      } else if (tx.type === "expense") {
        m.expenses += Number(tx.amount);
        const cat = tx.category_key ?? "other";
        m.categories[cat] = (m.categories[cat] ?? 0) + Number(tx.amount);
      }
    });

    // Конвертуємо в масив MonthData
    const months: MonthData[] = Object.entries(monthsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [, mStr] = key.split("-");
        const mIdx = parseInt(mStr) - 1;
        const savings = val.income - val.expenses;
        const savingsRate = val.income > 0 ? Math.round((savings / val.income) * 100) : 0;

        // Топ категорія
        const topEntry = Object.entries(val.categories).sort((a, b) => b[1] - a[1])[0];

        return {
          key,
          label: `${MONTHS_UA[mIdx]} ${year}`,
          shortLabel: MONTHS_SHORT[mIdx],
          income: val.income,
          expenses: val.expenses,
          savings,
          savingsRate,
          topCategory: topEntry ? { key: topEntry[0], amount: topEntry[1] } : null,
          txCount: val.txCount,
        };
      });

    // Агрегати по року
    const totalIncome = months.reduce((s, m) => s + m.income, 0);
    const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);
    const totalSavings = totalIncome - totalExpenses;
    const monthsWithIncome = months.filter(m => m.income > 0);
    const avgSavingsRate = monthsWithIncome.length > 0
      ? Math.round(monthsWithIncome.reduce((s, m) => s + m.savingsRate, 0) / monthsWithIncome.length)
      : 0;

    const bestMonth = [...months].filter(m => m.income > 0).sort((a, b) => b.savingsRate - a.savingsRate)[0] ?? null;
    const worstMonth = [...months].filter(m => m.income > 0 || m.expenses > 0).sort((a, b) => a.savings - b.savings)[0] ?? null;

    setYearData({
      year,
      totalIncome,
      totalExpenses,
      totalSavings,
      avgSavingsRate,
      bestMonth,
      worstMonth,
      months,
    });

    setLoading(false);
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!yearData) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3">📭</p>
        <p className="text-sm text-neutral-400">Не вдалося завантажити дані.</p>
      </div>
    );
  }

  const months = yearData.months;
  const hasData = months.some(m => m.income > 0 || m.expenses > 0);

  return (
    <div className="space-y-6 pb-8 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            📜 Фінансова історія
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Доходи, витрати та заощадження по місяцях
          </p>
        </div>

        {/* Рік + вигляд */}
        <div className="flex items-center gap-2">
          {/* Рік */}
          <Card className="flex items-center gap-1 !p-0 !px-3 !py-2" noPadding>
            <button
              onClick={() => setYear(y => y - 1)}
              className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 transition-colors"
            >
              <Icon d={icons.chevLeft} className="w-4 h-4" />
            </button>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 px-2 min-w-[60px] text-center tabular-nums">
              {year}
            </p>
            <button
              onClick={() => setYear(y => Math.min(y + 1, new Date().getFullYear()))}
              disabled={year >= new Date().getFullYear()}
              className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 transition-colors disabled:opacity-30"
            >
              <Icon d={icons.chevRight} className="w-4 h-4" />
            </button>
          </Card>

          {/* Вигляд */}
          <div className="flex gap-0.5 bg-neutral-100 dark:bg-neutral-800/50 p-0.5 rounded-xl">
            {([
              { id: "table" as ViewMode, icon: icons.doc, label: "Таблиця" },
              { id: "chart" as ViewMode, icon: icons.chart, label: "Графік" },
            ]).map(({ id, icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`p-2 rounded-lg transition-all ${
                  view === id
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <Icon d={icon} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Річний summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Дохід за рік", value: fmt(yearData.totalIncome), emoji: "💰", color: "text-green-500" },
          { label: "Витрати за рік", value: fmt(yearData.totalExpenses), emoji: "💸", color: "text-red-500" },
          {
            label: "Заощаджено",
            value: `${yearData.totalSavings >= 0 ? "+" : "−"}${fmt(Math.abs(yearData.totalSavings))}`,
            emoji: "🏦",
            color: yearData.totalSavings >= 0 ? "text-green-500" : "text-red-500",
          },
          {
            label: "Сер. заощадження",
            value: `${yearData.avgSavingsRate}%`,
            emoji: "📈",
            color: yearData.avgSavingsRate >= 20 ? "text-green-500" : yearData.avgSavingsRate >= 0 ? "text-amber-500" : "text-red-500",
          },
        ].map(({ label, value, emoji, color }) => (
          <Card key={label} className="!p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{emoji}</span>
              <p className="text-xs text-neutral-400">{label}</p>
            </div>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* ── Кращий / Гірший місяць ── */}
      {(yearData.bestMonth || yearData.worstMonth) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {yearData.bestMonth && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-xl shrink-0">🏆</div>
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Кращий місяць</p>
                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                  {yearData.bestMonth.label}
                </p>
                <p className="text-xs text-green-500">
                  +{fmt(yearData.bestMonth.savings)} зекономлено · {yearData.bestMonth.savingsRate}%
                </p>
              </div>
            </div>
          )}

          {yearData.worstMonth && yearData.worstMonth.key !== yearData.bestMonth?.key && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-xl shrink-0">📉</div>
              <div>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Складний місяць</p>
                <p className="text-sm font-bold text-red-700 dark:text-red-300">
                  {yearData.worstMonth.label}
                </p>
                <p className="text-xs text-red-500">
                  {yearData.worstMonth.savings >= 0 ? "+" : "−"}{fmt(Math.abs(yearData.worstMonth.savings))}
                  {yearData.worstMonth.savings < 0 ? " перевитрата" : " зекономлено"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Графічний вигляд ── */}
      {view === "chart" && hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { label: "Доходи", metric: "income" as const, emoji: "💰" },
            { label: "Витрати", metric: "expenses" as const, emoji: "💸" },
            { label: "Різниця", metric: "savings" as const, emoji: "📊" },
          ]).map(({ label, metric, emoji }) => (
            <Card key={metric}>
              <div className="flex items-center gap-2 mb-3">
                <span>{emoji}</span>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
              </div>
              <MiniChart months={months} metric={metric} />
            </Card>
          ))}
        </div>
      )}

      {/* ── Табличний вигляд ── */}
      {view === "table" && (
        <Card noPadding>
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40">
            {["Місяць", "Дохід", "Витрати", "Різниця", "Заощ. %", "Топ категорія"].map(h => (
              <div key={h} className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</div>
            ))}
          </div>

          {/* Rows */}
          {hasData ? (
            <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
              {[...months].reverse().map((m, i, arr) => {
                const prev = arr[i + 1] ?? null; // попередній (хронологічно)
                return (
                  <MonthRow
                    key={m.key}
                    month={m}
                    prev={prev}
                    isCurrentMonth={m.key === currentMonthKey}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-neutral-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Немає транзакцій за {year} рік</p>
              <a href="/transactions" className="text-xs text-orange-400 hover:text-orange-500 mt-2 inline-block">
                Додати транзакції →
              </a>
            </div>
          )}

          {/* Total row */}
          {hasData && (
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3.5 bg-neutral-50 dark:bg-neutral-800/40 border-t-2 border-neutral-200 dark:border-neutral-700">
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Всього за {year}</div>
              <div className="text-sm font-bold text-green-500 tabular-nums">+{fmt(yearData.totalIncome)}</div>
              <div className="text-sm font-bold text-red-500 tabular-nums">−{fmt(yearData.totalExpenses)}</div>
              <div className={`text-sm font-bold tabular-nums ${yearData.totalSavings >= 0 ? "text-green-500" : "text-red-500"}`}>
                {yearData.totalSavings >= 0 ? "+" : "−"}{fmt(Math.abs(yearData.totalSavings))}
              </div>
              <div className={`text-sm font-bold tabular-nums ${yearData.avgSavingsRate >= 20 ? "text-green-500" : yearData.avgSavingsRate >= 0 ? "text-amber-500" : "text-red-500"}`}>
                {yearData.avgSavingsRate}%
              </div>
              <div className="text-xs text-neutral-400">
                {months.reduce((s, m) => s + m.txCount, 0)} транзакцій
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Інфо ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💡</span>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Як читати</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          {[
            { emoji: "📈", title: "Норма заощаджень", desc: "Відсоток доходу, що залишився після витрат. Ідеал — 20%+" },
            { emoji: "🏆", title: "Кращий місяць", desc: "Місяць з найвищою нормою заощаджень серед тих, де був дохід" },
            { emoji: "📊", title: "Топ категорія", desc: "Категорія з найбільшими витратами за місяць" },
            { emoji: "↗️", title: "Тренд (стрілки)", desc: "Порівняння з попереднім місяцем. Зелена вгору = ріст, червона вниз = падіння" },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <span className="text-base shrink-0">{emoji}</span>
              <div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{title}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}