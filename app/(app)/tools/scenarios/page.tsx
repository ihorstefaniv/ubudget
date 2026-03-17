// ФАЙЛ: app/(app)/tools/scenarios/page.tsx
// URL: /tools/scenarios — Фінансові сценарії "Що якщо?"
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Icon, icons, Card, Modal } from "@/components/ui";
import { createBrowserClient } from "@supabase/ssr";

// ─── Types ────────────────────────────────────────────────────

type ScenarioType =
  | "lose_job"
  | "salary_raise"
  | "new_credit"
  | "close_credit"
  | "new_deposit"
  | "big_purchase"
  | "move_city"
  | "child_born"
  | "side_hustle"
  | "custom";

type Severity = "positive" | "neutral" | "negative" | "critical";

interface ScenarioEvent {
  id: string;
  type: ScenarioType;
  label: string;
  month: number; // з якого місяця діє
  // Зміни
  incomeChange: number;       // +/- грн/міс до доходу
  expenseChange: number;      // +/- грн/міс до витрат
  oneTimeExpense: number;     // одноразова витрата
  oneTimeIncome: number;      // одноразовий дохід
  savingsImpact: number;      // зміна заощаджень
}

interface MonthProjection {
  month: number;
  label: string;
  income: number;
  expenses: number;
  balance: number;         // income - expenses
  cumSavings: number;      // накопичені заощадження
  events: string[];        // які події діють
}

interface BaselineData {
  avgIncome: number;
  avgExpenses: number;
  totalSavings: number;     // поточні заощадження на рахунках
  monthlyCredits: number;   // щомісячні платежі по кредитам
}

// ─── Constants ────────────────────────────────────────────────

const SCENARIO_META: Record<ScenarioType, {
  emoji: string; label: string; severity: Severity;
  defaults: Partial<ScenarioEvent>;
  description: string;
}> = {
  lose_job: {
    emoji: "🔴", label: "Втрата роботи", severity: "critical",
    defaults: { incomeChange: -25000, expenseChange: -3000 },
    description: "Втрата основного джерела доходу. Витрати трохи скоротяться.",
  },
  salary_raise: {
    emoji: "🟢", label: "Підвищення зарплати", severity: "positive",
    defaults: { incomeChange: 8000 },
    description: "Збільшення доходу від основної роботи.",
  },
  new_credit: {
    emoji: "🔴", label: "Новий кредит", severity: "negative",
    defaults: { oneTimeIncome: 200000, expenseChange: 9500 },
    description: "Отримання нового кредиту — гроші приходять, але з'являється щомісячний платіж.",
  },
  close_credit: {
    emoji: "🟢", label: "Закриття кредиту", severity: "positive",
    defaults: { expenseChange: -8000 },
    description: "Закриття існуючого кредиту — щомісячний платіж зникає.",
  },
  new_deposit: {
    emoji: "🔵", label: "Новий депозит", severity: "neutral",
    defaults: { oneTimeExpense: 100000, incomeChange: 1500 },
    description: "Розміщення депозиту — разова витрата, але з'являється дохід від відсотків.",
  },
  big_purchase: {
    emoji: "🟠", label: "Велика покупка", severity: "negative",
    defaults: { oneTimeExpense: 50000 },
    description: "Одноразова крупна витрата: техніка, меблі, ремонт тощо.",
  },
  move_city: {
    emoji: "🟠", label: "Переїзд", severity: "negative",
    defaults: { oneTimeExpense: 30000, expenseChange: 5000 },
    description: "Переїзд — разова витрата + зміна щомісячних витрат (оренда, комунальні).",
  },
  child_born: {
    emoji: "👶", label: "Народження дитини", severity: "negative",
    defaults: { expenseChange: 12000, incomeChange: -8000 },
    description: "Нові витрати + можливе зниження доходу (декрет).",
  },
  side_hustle: {
    emoji: "💼", label: "Додаткове джерело", severity: "positive",
    defaults: { incomeChange: 10000, expenseChange: 2000 },
    description: "Фріланс, підробіток — додатковий дохід з невеликими витратами.",
  },
  custom: {
    emoji: "⚙️", label: "Кастомний", severity: "neutral",
    defaults: {},
    description: "Будь-яка фінансова зміна за вашими параметрами.",
  },
};

const HORIZONS = [
  { label: "6 міс", months: 6 },
  { label: "12 міс", months: 12 },
  { label: "18 міс", months: 18 },
  { label: "24 міс", months: 24 },
];

const MONTH_NAMES = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];

// ─── Helpers ──────────────────────────────────────────────────

function fmtI(n: number) { return Math.abs(n).toLocaleString("uk-UA", { maximumFractionDigits: 0 }); }
function uid() { return Math.random().toString(36).slice(2, 9); }

function severityColor(s: Severity) {
  switch (s) {
    case "positive": return "bg-green-100 dark:bg-green-950/30 text-green-600";
    case "neutral": return "bg-blue-100 dark:bg-blue-950/30 text-blue-600";
    case "negative": return "bg-amber-100 dark:bg-amber-950/30 text-amber-600";
    case "critical": return "bg-red-100 dark:bg-red-950/30 text-red-600";
  }
}

function monthLabel(offsetFromNow: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offsetFromNow, 1);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Projection Engine ───────────────────────────────────────

function projectScenario(
  baseline: BaselineData,
  events: ScenarioEvent[],
  horizonMonths: number,
): MonthProjection[] {
  const rows: MonthProjection[] = [];
  let cumSavings = baseline.totalSavings;

  for (let m = 1; m <= horizonMonths; m++) {
    let income = baseline.avgIncome;
    let expenses = baseline.avgExpenses + baseline.monthlyCredits;
    const activeEvents: string[] = [];

    for (const ev of events) {
      if (m >= ev.month) {
        income += ev.incomeChange;
        expenses += ev.expenseChange;
        activeEvents.push(ev.label);
      }
      // Одноразові — тільки у місяць настання
      if (m === ev.month) {
        income += ev.oneTimeIncome;
        expenses += ev.oneTimeExpense;
        cumSavings += ev.savingsImpact;
      }
    }

    const balance = income - expenses;
    cumSavings += balance;

    rows.push({
      month: m,
      label: monthLabel(m),
      income: Math.max(0, income),
      expenses: Math.max(0, expenses),
      balance,
      cumSavings,
      events: activeEvents,
    });
  }

  return rows;
}

// ─── UI Primitives ────────────────────────────────────────────

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all tabular-nums";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────

function SummaryCards({ baseline, projection, events }: {
  baseline: BaselineData; projection: MonthProjection[]; events: ScenarioEvent[];
}) {
  if (projection.length === 0) return null;

  const last = projection[projection.length - 1];
  const first = projection[0];
  const baselineEnd = baseline.totalSavings + (baseline.avgIncome - baseline.avgExpenses - baseline.monthlyCredits) * projection.length;
  const scenarioDiff = last.cumSavings - baselineEnd;
  const worstMonth = projection.reduce((w, p) => p.cumSavings < w.cumSavings ? p : w, projection[0]);
  const bestMonth = projection.reduce((b, p) => p.balance > b.balance ? p : b, projection[0]);

  const cards = [
    {
      emoji: "💰", label: "Заощадження через " + projection.length + " міс.",
      value: `₴${fmtI(last.cumSavings)}`,
      sub: last.cumSavings >= 0 ? "Фінансова подушка" : "Дефіцит!",
      color: last.cumSavings >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      emoji: "📊", label: "Різниця зі сценарієм",
      value: `${scenarioDiff >= 0 ? "+" : "−"}₴${fmtI(scenarioDiff)}`,
      sub: scenarioDiff >= 0 ? "краще без змін" : "гірше без змін",
      color: scenarioDiff >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      emoji: "⚡", label: "Найгірший місяць",
      value: worstMonth.label,
      sub: `Заощадження: ₴${fmtI(worstMonth.cumSavings)}`,
      color: worstMonth.cumSavings < 0 ? "text-red-500" : "text-neutral-900 dark:text-neutral-100",
    },
    {
      emoji: "📈", label: "Найкращий баланс",
      value: bestMonth.label,
      sub: `+₴${fmtI(bestMonth.balance)}/міс`,
      color: "text-green-500",
    },
  ];

  // Скільки місяців до нуля?
  const zeroMonth = projection.find(p => p.cumSavings < 0);
  if (zeroMonth) {
    cards.push({
      emoji: "🚨", label: "Гроші закінчаться",
      value: zeroMonth.label,
      sub: `через ${zeroMonth.month} міс.`,
      color: "text-red-500",
    });
  }

  // Фін. подушка в місяцях
  const avgExp = projection.reduce((s, p) => s + p.expenses, 0) / projection.length;
  const cushionMonths = avgExp > 0 ? baseline.totalSavings / avgExp : 0;
  cards.push({
    emoji: "🛡️", label: "Фін. подушка зараз",
    value: `${cushionMonths.toFixed(1)} міс.`,
    sub: cushionMonths < 3 ? "Мало! Рекомендовано 3-6 міс." : "Добре!",
    color: cushionMonths < 3 ? "text-amber-500" : "text-green-500",
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map(c => (
        <div key={c.label} className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{c.emoji}</span>
            <p className="text-xs text-neutral-400">{c.label}</p>
          </div>
          <p className={`text-lg font-bold tabular-nums ${c.color}`}>{c.value}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Projection Chart ─────────────────────────────────────────

function ProjectionChart({ projection, baseline }: {
  projection: MonthProjection[]; baseline: BaselineData;
}) {
  if (projection.length === 0) return null;

  // Baseline projection (без подій)
  const baselineLine = projection.map((_, i) => {
    const m = i + 1;
    return baseline.totalSavings + (baseline.avgIncome - baseline.avgExpenses - baseline.monthlyCredits) * m;
  });

  const allVals = [...projection.map(p => p.cumSavings), ...baselineLine];
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  const chartH = 160;
  const zeroY = ((maxVal - 0) / range) * chartH;

  function yPos(val: number) {
    return ((maxVal - val) / range) * chartH;
  }

  // SVG polyline points
  const scenarioPoints = projection.map((p, i) => {
    const x = (i / (projection.length - 1)) * 100;
    const y = yPos(p.cumSavings);
    return `${x},${y}`;
  }).join(" ");

  const baselinePoints = baselineLine.map((val, i) => {
    const x = (i / (projection.length - 1)) * 100;
    const y = yPos(val);
    return `${x},${y}`;
  }).join(" ");

  // Знаходимо місяці з подіями для маркерів
  const eventMonths = projection.filter(p => p.events.length > 0).map(p => p.month);
  const firstEventMonths = new Set<number>();
  const seen = new Set<string>();
  projection.forEach(p => {
    p.events.forEach(e => {
      if (!seen.has(e)) {
        seen.add(e);
        firstEventMonths.add(p.month);
      }
    });
  });

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">📈</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Прогноз заощаджень</h3>
      </div>
      <p className="text-xs text-neutral-400 mb-4">Сценарій (оранжевий) vs Без змін (сірий)</p>

      <div className="relative" style={{ height: chartH }}>
        <svg viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none" className="w-full h-full">
          {/* Zero line */}
          {minVal < 0 && (
            <line x1="0" y1={zeroY} x2="100" y2={zeroY}
              stroke="currentColor" strokeDasharray="2,2" className="text-neutral-300 dark:text-neutral-600" strokeWidth="0.3" />
          )}

          {/* Baseline */}
          <polyline points={baselinePoints} fill="none"
            stroke="currentColor" className="text-neutral-300 dark:text-neutral-600" strokeWidth="0.6" strokeLinejoin="round" />

          {/* Scenario */}
          <polyline points={scenarioPoints} fill="none"
            stroke="currentColor" className="text-orange-400" strokeWidth="1" strokeLinejoin="round" />

          {/* Event markers */}
          {projection.map((p, i) => {
            if (!firstEventMonths.has(p.month)) return null;
            const x = (i / (projection.length - 1)) * 100;
            const y = yPos(p.cumSavings);
            return (
              <circle key={p.month} cx={x} cy={y} r="1.5"
                fill="currentColor" className="text-orange-500" />
            );
          })}
        </svg>

        {/* Danger zone overlay */}
        {minVal < 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-50/30 dark:bg-red-950/10 border-t border-dashed border-red-200 dark:border-red-900/30"
            style={{ height: `${(Math.abs(minVal) / range) * 100}%` }}>
            <p className="text-xs text-red-400 px-2 pt-1">Дефіцит</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-neutral-400">{projection[0]?.label}</span>
        <span className="text-xs text-neutral-400">{projection[projection.length - 1]?.label}</span>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-orange-400 rounded" />
          <span className="text-xs text-neutral-400">Зі сценарієм</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-neutral-300 dark:bg-neutral-600 rounded" />
          <span className="text-xs text-neutral-400">Без змін</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-xs text-neutral-400">Подія</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Monthly Balance Bars ─────────────────────────────────────

function BalanceBars({ projection }: { projection: MonthProjection[] }) {
  if (projection.length === 0) return null;

  const maxAbs = Math.max(...projection.map(p => Math.abs(p.balance)), 1);
  const barContainerH = 100;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Баланс по місяцях</h3>
      </div>

      <div className="flex items-end gap-[3px]" style={{ height: barContainerH }}>
        {projection.map((p, i) => {
          const h = (Math.abs(p.balance) / maxAbs) * barContainerH;
          const barH = Math.max(h, 3);
          const isPos = p.balance >= 0;

          return (
            <div key={p.month} className="flex-1 group relative flex items-end justify-center" style={{ height: barContainerH }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  <p className="font-semibold">{p.label}</p>
                  <p>Дохід: ₴{fmtI(p.income)}</p>
                  <p>Витрати: ₴{fmtI(p.expenses)}</p>
                  <p className={isPos ? "text-green-300 dark:text-green-600" : "text-red-300 dark:text-red-600"}>
                    Баланс: {isPos ? "+" : "−"}₴{fmtI(p.balance)}
                  </p>
                  {p.events.length > 0 && (
                    <p className="text-orange-300 dark:text-orange-600 mt-1">⚡ {p.events.join(", ")}</p>
                  )}
                </div>
              </div>

              <div
                className={`w-full rounded-t-sm transition-all hover:opacity-80 ${
                  isPos ? "bg-green-400 dark:bg-green-500" : "bg-red-400 dark:bg-red-500"
                }`}
                style={{ height: barH }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-neutral-400">{projection[0]?.label}</span>
        <span className="text-xs text-neutral-400">{projection[projection.length - 1]?.label}</span>
      </div>
    </Card>
  );
}

// ─── Timeline ─────────────────────────────────────────────────

function Timeline({ events }: { events: ScenarioEvent[] }) {
  if (events.length === 0) return null;

  const sorted = [...events].sort((a, b) => a.month - b.month);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🗓️</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Хронологія подій</h3>
      </div>

      <div className="space-y-0">
        {sorted.map((ev, i) => {
          const meta = SCENARIO_META[ev.type];
          const isLast = i === sorted.length - 1;

          return (
            <div key={ev.id} className="flex gap-3">
              {/* Line */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${severityColor(meta.severity)}`}>
                  {meta.emoji}
                </div>
                {!isLast && <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-700 my-1" />}
              </div>

              {/* Content */}
              <div className={`pb-4 ${isLast ? "" : ""}`}>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{ev.label}</p>
                <p className="text-xs text-neutral-400">{monthLabel(ev.month)} (міс. {ev.month})</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {ev.incomeChange !== 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ev.incomeChange > 0 ? "bg-green-50 dark:bg-green-950/20 text-green-500" : "bg-red-50 dark:bg-red-950/20 text-red-500"}`}>
                      Дохід: {ev.incomeChange > 0 ? "+" : ""}₴{fmtI(ev.incomeChange)}/міс
                    </span>
                  )}
                  {ev.expenseChange !== 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ev.expenseChange < 0 ? "bg-green-50 dark:bg-green-950/20 text-green-500" : "bg-red-50 dark:bg-red-950/20 text-red-500"}`}>
                      Витрати: {ev.expenseChange > 0 ? "+" : ""}₴{fmtI(ev.expenseChange)}/міс
                    </span>
                  )}
                  {ev.oneTimeExpense > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                      Разова витрата: ₴{fmtI(ev.oneTimeExpense)}
                    </span>
                  )}
                  {ev.oneTimeIncome > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-500">
                      Разовий дохід: ₴{fmtI(ev.oneTimeIncome)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Recommendations ──────────────────────────────────────────

function Recommendations({ projection, baseline, events }: {
  projection: MonthProjection[]; baseline: BaselineData; events: ScenarioEvent[];
}) {
  if (projection.length === 0 || events.length === 0) return null;

  const recs: { emoji: string; text: string; priority: "high" | "medium" | "low" }[] = [];

  const last = projection[projection.length - 1];
  const zeroMonth = projection.find(p => p.cumSavings < 0);
  const negativeMonths = projection.filter(p => p.balance < 0);
  const avgBalance = projection.reduce((s, p) => s + p.balance, 0) / projection.length;

  // Гроші закінчаються
  if (zeroMonth) {
    recs.push({
      emoji: "🚨",
      text: `Заощадження закінчаться у ${zeroMonth.label}. Потрібно створити резервний фонд на ${Math.ceil(Math.abs(last.cumSavings) / baseline.avgExpenses)} місяців витрат або скоротити витрати.`,
      priority: "high",
    });
  }

  // Багато місяців в мінусі
  if (negativeMonths.length > projection.length * 0.3) {
    recs.push({
      emoji: "⚠️",
      text: `${negativeMonths.length} з ${projection.length} місяців мають від'ємний баланс. Розгляньте додаткове джерело доходу або скорочення витрат.`,
      priority: "high",
    });
  }

  // Позитивний сценарій
  if (last.cumSavings > baseline.totalSavings * 2 && negativeMonths.length === 0) {
    recs.push({
      emoji: "💡",
      text: `Заощадження подвояться! Рекомендуємо направити надлишок на інвестиції або депозит для максимізації дохідності.`,
      priority: "low",
    });
  }

  // Втрата роботи в сценарії
  if (events.some(e => e.type === "lose_job")) {
    const cushionMonths = baseline.totalSavings / baseline.avgExpenses;
    if (cushionMonths < 3) {
      recs.push({
        emoji: "🛡️",
        text: `Фінансова подушка: лише ${cushionMonths.toFixed(1)} міс. витрат. Для сценарію з втратою роботи потрібно мінімум 6 місяців.`,
        priority: "high",
      });
    }
  }

  // Новий кредит
  if (events.some(e => e.type === "new_credit")) {
    const totalCreditLoad = baseline.monthlyCredits + events.filter(e => e.type === "new_credit").reduce((s, e) => s + e.expenseChange, 0);
    const ratio = baseline.avgIncome > 0 ? totalCreditLoad / baseline.avgIncome : 0;
    if (ratio > 0.4) {
      recs.push({
        emoji: "⚠️",
        text: `Кредитне навантаження складе ${(ratio * 100).toFixed(0)}% від доходу. Рекомендовано не перевищувати 40%.`,
        priority: "high",
      });
    }
  }

  // Середній баланс позитивний
  if (avgBalance > 0 && recs.length === 0) {
    recs.push({
      emoji: "✅",
      text: `Сценарій виглядає стабільно. Середній щомісячний баланс: +₴${fmtI(avgBalance)}.`,
      priority: "low",
    });
  }

  if (recs.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💡</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Рекомендації</h3>
      </div>
      <div className="space-y-3">
        {recs.sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.priority] - order[b.priority];
        }).map((r, i) => (
          <div key={i} className={`flex gap-3 p-3 rounded-xl ${
            r.priority === "high"
              ? "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
              : r.priority === "medium"
              ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30"
              : "bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30"
          }`}>
            <span className="text-base shrink-0">{r.emoji}</span>
            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Projection Table ─────────────────────────────────────────

function ProjectionTable({ projection }: { projection: MonthProjection[] }) {
  const [expanded, setExpanded] = useState(false);
  if (projection.length === 0) return null;

  const visible = expanded ? projection : projection.slice(0, 6);

  return (
    <Card noPadding>
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Помісячний прогноз</h3>
        </div>
        <span className="text-xs text-neutral-400">{projection.length} міс.</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              {["Місяць", "Дохід", "Витрати", "Баланс", "Заощадження", "Події"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {visible.map(row => (
              <tr key={row.month} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">{row.label}</td>
                <td className="px-4 py-2.5 tabular-nums text-green-500">₴{fmtI(row.income)}</td>
                <td className="px-4 py-2.5 tabular-nums text-red-400">₴{fmtI(row.expenses)}</td>
                <td className={`px-4 py-2.5 tabular-nums font-medium ${row.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {row.balance >= 0 ? "+" : "−"}₴{fmtI(row.balance)}
                </td>
                <td className={`px-4 py-2.5 tabular-nums font-medium ${row.cumSavings >= 0 ? "text-neutral-900 dark:text-neutral-100" : "text-red-500"}`}>
                  ₴{fmtI(row.cumSavings)}
                </td>
                <td className="px-4 py-2.5">
                  {row.events.length > 0 && (
                    <span className="text-xs text-orange-400">{row.events.join(", ")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {projection.length > 6 && (
        <button onClick={() => setExpanded(v => !v)}
          className="w-full py-3 text-xs text-orange-400 hover:text-orange-500 font-medium border-t border-neutral-100 dark:border-neutral-800 transition-colors">
          {expanded ? "Згорнути ↑" : `Показати всі ${projection.length} місяців ↓`}
        </button>
      )}
    </Card>
  );
}

// ─── Add Event Modal ──────────────────────────────────────────

function AddEventModal({ open, onClose, onAdd, horizonMonths }: {
  open: boolean;
  onClose: () => void;
  onAdd: (ev: ScenarioEvent) => void;
  horizonMonths: number;
}) {
  const [type, setType] = useState<ScenarioType>("salary_raise");
  const [label, setLabel] = useState("");
  const [month, setMonth] = useState(1);
  const [incomeChange, setIncomeChange] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);
  const [oneTimeExpense, setOneTimeExpense] = useState(0);
  const [oneTimeIncome, setOneTimeIncome] = useState(0);

  useEffect(() => {
    if (open) {
      const meta = SCENARIO_META[type];
      setLabel(meta.label);
      setIncomeChange(meta.defaults.incomeChange ?? 0);
      setExpenseChange(meta.defaults.expenseChange ?? 0);
      setOneTimeExpense(meta.defaults.oneTimeExpense ?? 0);
      setOneTimeIncome(meta.defaults.oneTimeIncome ?? 0);
    }
  }, [type, open]);

  function handleAdd() {
    onAdd({
      id: uid(),
      type,
      label: label || SCENARIO_META[type].label,
      month,
      incomeChange,
      expenseChange,
      oneTimeExpense,
      oneTimeIncome,
      savingsImpact: 0,
    });
    onClose();
  }

  if (!open) return null;

  const meta = SCENARIO_META[type];

  return (
    <Modal onClose={onClose} title="Додати подію">
      <div className="space-y-4">

        {/* Тип */}
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2">Тип події</p>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {(Object.entries(SCENARIO_META) as [ScenarioType, typeof SCENARIO_META[ScenarioType]][]).map(([key, m]) => (
              <button key={key} onClick={() => setType(key)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  type === key
                    ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30"
                    : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                }`}>
                <span className="text-base">{m.emoji}</span>
                <span className={`text-xs ${type === key ? "text-orange-500 font-medium" : "text-neutral-600 dark:text-neutral-400"}`}>{m.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-2">{meta.description}</p>
        </div>

        {/* Назва */}
        <Field label="Назва">
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder={meta.label} className={inp} />
        </Field>

        {/* Місяць */}
        <Field label={`З якого місяця (1–${horizonMonths})`}>
          <input type="number" value={month} onChange={e => setMonth(Math.max(1, Math.min(horizonMonths, +e.target.value)))}
            min={1} max={horizonMonths} className={inp} />
          <p className="text-xs text-neutral-400 mt-1">{monthLabel(month)}</p>
        </Field>

        {/* Фінансові зміни */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Дохід ±/міс">
            <input type="number" value={incomeChange || ""} onChange={e => setIncomeChange(+e.target.value)} placeholder="0" className={inp} />
          </Field>
          <Field label="Витрати ±/міс">
            <input type="number" value={expenseChange || ""} onChange={e => setExpenseChange(+e.target.value)} placeholder="0" className={inp} />
          </Field>
          <Field label="Разова витрата">
            <input type="number" value={oneTimeExpense || ""} onChange={e => setOneTimeExpense(+e.target.value)} placeholder="0" className={inp} />
          </Field>
          <Field label="Разовий дохід">
            <input type="number" value={oneTimeIncome || ""} onChange={e => setOneTimeIncome(+e.target.value)} placeholder="0" className={inp} />
          </Field>
        </div>

        <button onClick={handleAdd}
          className="w-full py-3 rounded-xl bg-orange-400 text-white font-bold text-sm hover:bg-orange-500 transition-colors">
          Додати подію
        </button>
      </div>
    </Modal>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function ScenariosPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [loading, setLoading] = useState(true);
  const [baseline, setBaseline] = useState<BaselineData>({
    avgIncome: 0, avgExpenses: 0, totalSavings: 0, monthlyCredits: 0,
  });

  const [events, setEvents] = useState<ScenarioEvent[]>([]);
  const [horizon, setHorizon] = useState(12);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // ─── Load baseline from Supabase ─────────────────────────

  const loadBaseline = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Середні доходи/витрати за останні 6 місяців
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: txns } = await supabase
        .from("transactions")
        .select("amount, type, date")
        .eq("user_id", user.id)
        .gte("date", sixMonthsAgo.toISOString().split("T")[0]);

      let totalIncome = 0, totalExpenses = 0, monthsWithData = 0;
      const monthSet = new Set<string>();

      (txns || []).forEach(t => {
        const mKey = t.date?.substring(0, 7);
        if (mKey) monthSet.add(mKey);
        if (t.type === "income") totalIncome += Math.abs(t.amount);
        else totalExpenses += Math.abs(t.amount);
      });

      monthsWithData = Math.max(monthSet.size, 1);

      // Загальні заощадження (рахунки)
      const { data: accounts } = await supabase
        .from("accounts")
        .select("balance")
        .eq("user_id", user.id);

      const totalSavings = (accounts || []).reduce((s, a) => s + (a.balance || 0), 0);

      // Кредитні платежі
      const { data: credits } = await supabase
        .from("credits")
        .select("monthly_payment")
        .eq("user_id", user.id)
        .eq("status", "active");

      const monthlyCredits = (credits || []).reduce((s, c) => s + (c.monthly_payment || 0), 0);

      setBaseline({
        avgIncome: totalIncome / monthsWithData,
        avgExpenses: totalExpenses / monthsWithData,
        totalSavings,
        monthlyCredits,
      });
    } catch (err) {
      console.error("Failed to load baseline:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadBaseline(); }, [loadBaseline]);

  // ─── Projection ───────────────────────────────────────────

  const projection = useMemo(
    () => projectScenario(baseline, events, horizon),
    [baseline, events, horizon],
  );

  const removeEvent = (id: string) => setEvents(ev => ev.filter(e => e.id !== id));

  // ─── Quick scenarios ──────────────────────────────────────

  function addQuickScenario(type: ScenarioType, month = 1) {
    const meta = SCENARIO_META[type];
    setEvents(prev => [...prev, {
      id: uid(),
      type,
      label: meta.label,
      month,
      incomeChange: meta.defaults.incomeChange ?? 0,
      expenseChange: meta.defaults.expenseChange ?? 0,
      oneTimeExpense: meta.defaults.oneTimeExpense ?? 0,
      oneTimeIncome: meta.defaults.oneTimeIncome ?? 0,
      savingsImpact: meta.defaults.savingsImpact ?? 0,
    }]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-5xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">🔮 Сценарії &quot;Що якщо?&quot;</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Моделюйте фінансові зміни і перегляньте як вони вплинуть на ваші фінанси
        </p>
      </div>

      {/* ── Baseline info ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Ваша поточна ситуація</h3>
          <span className="text-xs text-neutral-400">(середнє за 6 міс.)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
            <p className="text-xs text-neutral-400">Дохід/міс</p>
            <p className="text-sm font-bold text-green-500 tabular-nums">₴{fmtI(baseline.avgIncome)}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
            <p className="text-xs text-neutral-400">Витрати/міс</p>
            <p className="text-sm font-bold text-red-400 tabular-nums">₴{fmtI(baseline.avgExpenses)}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
            <p className="text-xs text-neutral-400">Заощадження</p>
            <p className="text-sm font-bold text-blue-500 tabular-nums">₴{fmtI(baseline.totalSavings)}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20">
            <p className="text-xs text-neutral-400">Кредити/міс</p>
            <p className="text-sm font-bold text-amber-500 tabular-nums">₴{fmtI(baseline.monthlyCredits)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* ── Ліва: результати ── */}
        <div className="space-y-5">

          {events.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-4xl mb-3">🔮</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Додайте першу подію</p>
                <p className="text-xs text-neutral-400 mb-4">Оберіть швидкий сценарій або створіть свій</p>

                <div className="flex flex-wrap justify-center gap-2">
                  {(["lose_job", "salary_raise", "new_credit", "big_purchase"] as ScenarioType[]).map(type => {
                    const meta = SCENARIO_META[type];
                    return (
                      <button key={type} onClick={() => addQuickScenario(type)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700 text-xs text-neutral-600 dark:text-neutral-400 hover:text-orange-500 transition-all">
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Summary */}
              <SummaryCards baseline={baseline} projection={projection} events={events} />

              {/* Charts */}
              <ProjectionChart projection={projection} baseline={baseline} />
              <BalanceBars projection={projection} />

              {/* Timeline */}
              <Timeline events={events} />

              {/* Recommendations */}
              <Recommendations projection={projection} baseline={baseline} events={events} />

              {/* Table toggle */}
              <div>
                <button onClick={() => setShowTable(v => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-500 transition-colors mb-3">
                  <Icon d={showTable ? icons.chevUp : icons.chevDown} className="w-4 h-4" />
                  {showTable ? "Сховати прогноз" : "Показати помісячний прогноз"}
                </button>
                {showTable && <ProjectionTable projection={projection} />}
              </div>
            </>
          )}
        </div>

        {/* ── Права: панель подій ── */}
        <div className="space-y-4">

          {/* Горизонт */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Горизонт прогнозу</p>
            <div className="flex gap-2">
              {HORIZONS.map(h => (
                <button key={h.months} onClick={() => setHorizon(h.months)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                    horizon === h.months
                      ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
                  }`}>{h.label}</button>
              ))}
            </div>
          </Card>

          {/* Список подій */}
          {events.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ваші події ({events.length})</p>
                <button onClick={() => setEvents([])} className="text-xs text-neutral-400 hover:text-red-400 transition-colors">
                  Очистити
                </button>
              </div>

              <div className="space-y-2">
                {events.map(ev => {
                  const meta = SCENARIO_META[ev.type];
                  return (
                    <div key={ev.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <span className="text-base">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{ev.label}</p>
                        <p className="text-xs text-neutral-400">міс. {ev.month} · {monthLabel(ev.month)}</p>
                      </div>
                      <button onClick={() => removeEvent(ev.id)} className="text-neutral-300 hover:text-red-400 shrink-0 transition-colors">
                        <Icon d={icons.close} className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Швидкі сценарії */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Швидкі сценарії</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(SCENARIO_META) as [ScenarioType, typeof SCENARIO_META[ScenarioType]][])
                .filter(([key]) => key !== "custom")
                .map(([key, meta]) => (
                <button key={key} onClick={() => addQuickScenario(key as ScenarioType)}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700 text-left transition-all">
                  <span className="text-sm">{meta.emoji}</span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{meta.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Додати кастомну подію */}
          <button onClick={() => setShowAddModal(true)}
            className="w-full py-3 rounded-xl bg-orange-400 text-white font-bold text-sm hover:bg-orange-500 transition-colors flex items-center justify-center gap-2">
            <Icon d={icons.plus} className="w-4 h-4" />
            Кастомна подія
          </button>
        </div>
      </div>

      {/* Modal */}
      <AddEventModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={ev => setEvents(prev => [...prev, ev])}
        horizonMonths={horizon}
      />
    </div>
  );
}