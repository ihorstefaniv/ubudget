"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────
type Period = "month" | "quarter" | "year";

// ─── Helpers ──────────────────────────────────────────────────
function formatMoney(n: number) {
  const formatted = Math.abs(n).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (n < 0 ? "-" : "") + formatted + " грн";
}

function today() {
  return new Date().toLocaleDateString("uk-UA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// ─── Health Score Ring ────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Відмінно" : score >= 60 ? "Стабільно" : "Зона ризику";

  return (
    <div className="flex items-center gap-3">
      <div className="text-neutral-900 dark:text-neutral-100 relative">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="7" strokeOpacity="0.08" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
          <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">{score}</text>
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Health Score</p>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "neutral", icon }: {
  label: string; value: string; sub?: string; color?: "green" | "red" | "orange" | "neutral"; icon: string;
}) {
  const colors = {
    green: "text-green-500 bg-green-50 dark:bg-green-950/30",
    red: "text-red-500 bg-red-50 dark:bg-red-950/30",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
    neutral: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800",
  };
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon d={icon} className="w-4.5 h-4.5" />
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ value, max, color = "#fb923c" }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const over = value > max;
  return (
    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: over ? "#ef4444" : color }}
      />
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────
function GoalCard({ goal, onEdit }: { goal: { name: string; current: number; target: number; emoji: string }; onEdit: () => void }) {
  const pct = Math.round((goal.current / goal.target) * 100);
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-900 transition-colors group">
      <span className="text-2xl shrink-0">{goal.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{goal.name}</p>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0 ml-2">{pct}%</span>
        </div>
        <ProgressBar value={goal.current} max={goal.target} color="#fb923c" />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-neutral-400">{formatMoney(goal.current)}</span>
          <span className="text-xs text-neutral-400">{formatMoney(goal.target)}</span>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="shrink-0 text-neutral-300 dark:text-neutral-700 group-hover:text-orange-400 transition-colors"
        title="Редагувати"
      >
        <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────
export default function DashboardPage() {
  const [userName, setUserName] = useState("Користувач");
  const [period, setPeriod] = useState<Period>("month");
  const [editGoalId, setEditGoalId] = useState<number | null>(null);

  // Mock data — замінити на реальні після підключення БД
  const healthScore = 74;
  const netWorth = 124500;
  const breakdown = { cash: 8200, accounts: 67300, assets: 61000, debts: 12000 };
  const daysWithoutIncome = 47;
  const lastIncomeDate = "14 лютого";
  const budgetPlan = 25000;
  const budgetFact = 18400;
  const topCategory = { name: "Продукти", amount: 6200, pct: 34 };

  const periodData: Record<Period, { income: number; expenses: number }> = {
    month: { income: 42000, expenses: 18400 },
    quarter: { income: 118000, expenses: 67200 },
    year: { income: 487000, expenses: 312000 },
  };

  const accounts = [
    { name: "Monobank", type: "Дебетова", balance: 14200, currency: "UAH" },
    { name: "ПриватБанк", type: "Дебетова", balance: 8700, currency: "UAH" },
    { name: "Готівка", type: "Гаманець", balance: 3100, currency: "UAH" },
    { name: "USD Готівка", type: "Гаманець", balance: 1200, currency: "USD" },
  ];

  const transactions = [
    { category: "Продукти", name: "Сільпо", amount: -840, date: "Сьогодні", icon: "🛒" },
    { category: "Транспорт", name: "Uber", amount: -95, date: "Сьогодні", icon: "🚗" },
    { category: "Дохід", name: "Зарплата", amount: 42000, date: "14 лют", icon: "💼" },
    { category: "Кафе", name: "Starbuks", amount: -185, date: "13 лют", icon: "☕" },
    { category: "Комунальні", name: "Київенерго", amount: -1240, date: "12 лют", icon: "⚡" },
  ];

  const goals = [
    { name: "Подорож до Туреччини", current: 18000, target: 30000, emoji: "✈️" },
    { name: "Новий ноутбук", current: 8500, target: 25000, emoji: "💻" },
    { name: "Резервний фонд", current: 42000, target: 90000, emoji: "🛡️" },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Користувач";
        setUserName(name.split(" ")[0]); // тільки ім'я
      }
    });
  }, []);

  const { income, expenses } = periodData[period];
  const periodLabel = { month: "місяць", quarter: "квартал", year: "рік" }[period];

  return (
    <div className="space-y-6 pb-8">

      {/* ── 1. HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Привіт, {userName} 👋
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 capitalize">{today()}</p>
        </div>
        <HealthRing score={healthScore} />
      </div>

      {/* ── 2. NET WORTH ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Загальний баланс</p>
        <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">{formatMoney(netWorth)}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Готівка", value: breakdown.cash, color: "text-green-500" },
            { label: "Рахунки", value: breakdown.accounts, color: "text-blue-500" },
            { label: "Активи", value: breakdown.assets, color: "text-purple-500" },
            { label: "Борги", value: -breakdown.debts, color: "text-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className={`text-sm font-semibold ${color}`}>
                {value < 0 ? "−" : "+"}{formatMoney(Math.abs(value))}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Днів без доходу */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
            daysWithoutIncome < 60 ? "bg-red-50 dark:bg-red-950/30 text-red-500" :
            daysWithoutIncome < 180 ? "bg-amber-50 dark:bg-amber-950/30 text-amber-500" :
            "bg-green-50 dark:bg-green-950/30 text-green-500"
          }`}>
            <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{daysWithoutIncome} днів</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">Без доходу</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-neutral-400">Останній: {lastIncomeDate}</p>
            <button className="text-xs text-orange-400 hover:text-orange-500 font-medium transition-colors">
              + Внести
            </button>
          </div>
        </div>

        {/* Бюджет план/факт */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-orange-50 dark:bg-orange-950/30 text-orange-500">
            <Icon d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" className="w-4.5 h-4.5" />
          </div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{formatMoney(budgetFact)}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">з {formatMoney(budgetPlan)}</p>
            </div>
            <span className="text-xs font-semibold text-orange-400">{Math.round((budgetFact/budgetPlan)*100)}%</span>
          </div>
          <ProgressBar value={budgetFact} max={budgetPlan} />
          <p className="text-xs text-neutral-400 mt-1.5">Залишок: {formatMoney(budgetPlan - budgetFact)}</p>
        </div>

        {/* Топ категорія */}
        <StatCard
          label="Топ категорія"
          value={topCategory.name}
          sub={`${formatMoney(topCategory.amount)} · ${topCategory.pct}% витрат`}
          color="orange"
          icon="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </div>

      {/* ── 4. ДОХОДИ & ВИТРАТИ ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Доходи & Витрати</h2>
          <div className="flex rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden text-xs">
            {(["month", "quarter", "year"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  period === p
                    ? "bg-orange-400 text-white"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                {p === "month" ? "Місяць" : p === "quarter" ? "Квартал" : "Рік"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-950/20">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Доходи</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatMoney(income)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/20">
            <p className="text-xs text-red-500 dark:text-red-400 font-medium mb-1">Витрати</p>
            <p className="text-xl font-bold text-red-500 dark:text-red-400">{formatMoney(expenses)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">Різниця</p>
            <p className={`text-xl font-bold ${income - expenses > 0 ? "text-green-500" : "text-red-500"}`}>
              {income - expenses > 0 ? "+" : ""}{formatMoney(income - expenses)}
            </p>
          </div>
        </div>

        {/* Simple bar visual */}
        <div className="mt-4 flex gap-3 items-end h-16">
          {[
            { label: "Дох", val: income, max: income, color: "bg-green-400" },
            { label: "Вит", val: expenses, max: income, color: "bg-red-400" },
          ].map(({ label, val, max, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                <div
                  className={`w-full rounded-t-lg ${color} opacity-80`}
                  style={{ height: `${Math.min((val / max) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400">{label}</span>
            </div>
          ))}
          <p className="text-xs text-neutral-400 self-center flex-1 text-center">за {periodLabel}</p>
        </div>
      </div>

      {/* ── 5. РАХУНКИ & ТРАНЗАКЦІЇ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Стан рахунків */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Стан рахунків</h2>
            <Link href="/accounts" className="text-xs text-orange-400 hover:text-orange-500 font-medium transition-colors">
              Всі →
            </Link>
          </div>
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.name} className="flex items-center justify-between py-2 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm">
                    {acc.type === "Гаманець" ? "👛" : "💳"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{acc.name}</p>
                    <p className="text-xs text-neutral-400">{acc.type}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {acc.currency === "USD"
                    ? "$ " + acc.balance.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : acc.balance.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " грн"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Останні транзакції */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Останні транзакції</h2>
            <Link href="/transactions" className="text-xs text-orange-400 hover:text-orange-500 font-medium transition-colors">
              Всі →
            </Link>
          </div>
          <div className="space-y-3">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm">
                    {tx.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{tx.name}</p>
                    <p className="text-xs text-neutral-400">{tx.category} · {tx.date}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"}`}>
                  {tx.amount > 0 ? "+" : ""}{formatMoney(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. ЦІЛІ ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Фінансові цілі</h2>
          <button className="text-xs text-orange-400 hover:text-orange-500 font-medium transition-colors">
            + Нова ціль
          </button>
        </div>
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <GoalCard
              key={i}
              goal={goal}
              onEdit={() => setEditGoalId(editGoalId === i ? null : i)}
            />
          ))}
        </div>

        {/* Quick edit panel */}
        {editGoalId !== null && (
          <div className="mt-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
              Редагувати: {goals[editGoalId].name}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                defaultValue={goals[editGoalId].current}
                placeholder="Поточна сума"
                className="flex-1 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-400"
              />
              <button
                onClick={() => setEditGoalId(null)}
                className="px-4 py-1.5 rounded-lg bg-orange-400 text-white text-sm font-medium hover:bg-orange-500 transition-colors"
              >
                Зберегти
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 7. QUICK TOOLS ── */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Інструменти</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/tools/scenarios", label: "Сценарії", emoji: "🔮", desc: "Що якщо..." },
            { href: "/tools/crisis", label: "Режим КРИЗА", emoji: "🚨", desc: "Антикризовий план" },
            { href: "/tools/deposit-calc", label: "Депозит", emoji: "🏦", desc: "Калькулятор" },
            { href: "/tools/health", label: "Health Score", emoji: "💚", desc: "Деталі" },
          ].map(({ href, label, emoji, desc }) => (
            <Link
              key={href}
              href={href}
              className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-md transition-all group"
            >
              <span className="text-2xl">{emoji}</span>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-2">{label}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}