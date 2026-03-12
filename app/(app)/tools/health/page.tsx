// ФАЙЛ: app/(app)/tools/health/page.tsx
// URL: /tools/health — Детальний Health Score з розбивкою по факторах
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Card } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────

interface HealthData {
  score: number;
  grade: string;
  gradeColor: string;
  factors: Factor[];
  metrics: Metric[];
  recommendations: Recommendation[];
}

interface Factor {
  id: string;
  label: string;
  emoji: string;
  points: number;
  maxPoints: number;
  status: "good" | "warn" | "bad";
  detail: string;
}

interface Metric {
  label: string;
  value: string;
  sub?: string;
  emoji: string;
  color: string;
}

interface Recommendation {
  id: string;
  priority: "high" | "medium" | "low";
  emoji: string;
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
}

// ─── Score Ring ───────────────────────────────────────────────

function ScoreRing({ score, size = 200 }: { score: number; size?: number }) {
  const r = (size - 24) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const bgColor =
    score >= 80
      ? "bg-green-50 dark:bg-green-950/20"
      : score >= 60
      ? "bg-amber-50 dark:bg-amber-950/20"
      : score >= 40
      ? "bg-orange-50 dark:bg-orange-950/20"
      : "bg-red-50 dark:bg-red-950/20";
  const grade =
    score >= 80 ? "Відмінно" : score >= 60 ? "Стабільно" : score >= 40 ? "Потребує уваги" : "Зона ризику";

  return (
    <div className={`inline-flex flex-col items-center gap-3 p-8 rounded-3xl ${bgColor}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
        {/* Фонове кільце */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeOpacity="0.08"
          className="text-neutral-900 dark:text-neutral-100"
        />
        {/* Прогрес кільце */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-1000 ease-out"
        />
        {/* Число */}
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          fontSize="48"
          fontWeight="800"
          fill="currentColor"
          className="text-neutral-900 dark:text-neutral-100"
        >
          {score}
        </text>
        {/* Підпис */}
        <text
          x={size / 2}
          y={size / 2 + 20}
          textAnchor="middle"
          fontSize="13"
          fontWeight="600"
          fill={color}
        >
          {grade}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 38}
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
          fillOpacity="0.4"
          className="text-neutral-900 dark:text-neutral-100"
        >
          з 100
        </text>
      </svg>
    </div>
  );
}

// ─── Factor Row ───────────────────────────────────────────────

function FactorRow({ factor }: { factor: Factor }) {
  const statusColors = {
    good: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400",
    warn: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    bad: "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400",
  };
  const statusLabels = { good: "Добре", warn: "Увага", bad: "Проблема" };
  const pointsColor =
    factor.points > 0
      ? "text-green-500"
      : factor.points < 0
      ? "text-red-500"
      : "text-neutral-400";
  const barPct = factor.maxPoints > 0
    ? Math.max(0, Math.min(100, ((factor.points + Math.abs(factor.maxPoints)) / (Math.abs(factor.maxPoints) * 2)) * 100))
    : 50;
  const barColor =
    factor.status === "good"
      ? "bg-green-400"
      : factor.status === "warn"
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shrink-0">
          {factor.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {factor.label}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-sm font-bold tabular-nums ${pointsColor}`}>
                {factor.points > 0 ? "+" : ""}
                {factor.points}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[factor.status]}`}
              >
                {statusLabels[factor.status]}
              </span>
            </div>
          </div>

          {/* Detail */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{factor.detail}</p>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const priorityStyles = {
    high: "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10",
    medium: "border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10",
    low: "border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/10",
  };
  const priorityLabels = { high: "Важливо", medium: "Рекомендація", low: "Порада" };
  const priorityColors = {
    high: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30",
    medium: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30",
    low: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/30",
  };

  return (
    <div className={`p-4 rounded-xl border ${priorityStyles[rec.priority]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{rec.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {rec.title}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priorityColors[rec.priority]}`}
            >
              {priorityLabels[rec.priority]}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {rec.description}
          </p>
          {rec.action && rec.actionHref && (
            <a
              href={rec.actionHref}
              className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-orange-400 hover:text-orange-500 transition-colors"
            >
              {rec.action}
              <Icon d={icons.chevRight} className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────

function ScoreBadge({ label, value, emoji, color }: Metric) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{emoji}</span>
        <p className="text-xs text-neutral-400">{label}</p>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function fmt(n: number, currency = "UAH") {
  const v = Math.abs(n).toLocaleString("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (currency === "USD") return `$${v}`;
  if (currency === "EUR") return `€${v}`;
  return `${v} грн`;
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function HealthScorePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HealthData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const monthStart = startOfMonth();

    // ── Паралельно завантажуємо все необхідне ──
    const [
      { data: accounts },
      { data: txs },
      { data: credits },
      { data: deposits },
      { data: budgets },
      { data: envelopeSettings },
    ] = await Promise.all([
      supabase
        .from("accounts")
        .select("balance, currency, type")
        .eq("user_id", user.id)
        .eq("is_archived", false),
      supabase
        .from("transactions")
        .select("type, amount, transaction_date")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false })
        .limit(500),
      supabase
        .from("credits")
        .select("remaining_amount, monthly_payment, payment_day, interest_rate, end_date")
        .eq("user_id", user.id)
        .eq("is_archived", false),
      supabase
        .from("deposits")
        .select("amount, currency, interest_rate, end_date")
        .eq("user_id", user.id)
        .eq("is_archived", false),
      supabase
        .from("budgets")
        .select("plan_amount")
        .eq("user_id", user.id)
        .eq("month", m)
        .eq("year", y),
      supabase
        .from("envelope_settings")
        .select("is_active")
        .eq("user_id", user.id)
        .eq("month", m)
        .eq("year", y)
        .maybeSingle(),
    ]);

    // ── Обчислення метрик ──
    const uahAccounts = (accounts ?? []).filter(
      (a: { currency: string }) => a.currency === "UAH"
    );
    const totalBalance = uahAccounts.reduce(
      (s: number, a: { balance: number }) => s + Number(a.balance),
      0
    );
    const totalDebt = (credits ?? []).reduce(
      (s: number, c: { remaining_amount: number }) => s + Number(c.remaining_amount),
      0
    );
    const totalDeposit = (deposits ?? [])
      .filter((d: { currency: string }) => d.currency === "UAH")
      .reduce((s: number, d: { amount: number }) => s + Number(d.amount), 0);
    const monthlyPayments = (credits ?? []).reduce(
      (s: number, c: { monthly_payment: number }) => s + Number(c.monthly_payment),
      0
    );

    // Транзакції цього місяця
    const monthTxs = (txs ?? []).filter(
      (t: { transaction_date: string }) => t.transaction_date >= monthStart
    );
    const income = monthTxs
      .filter((t: { type: string }) => t.type === "income")
      .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
    const expenses = monthTxs
      .filter((t: { type: string }) => t.type === "expense")
      .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);

    // Останній дохід
    const lastIncomeTx = (txs ?? []).find((t: { type: string }) => t.type === "income");
    const daysNoIncome = lastIncomeTx
      ? Math.floor(
          (Date.now() - new Date(lastIncomeTx.transaction_date).getTime()) / 86400000
        )
      : null;

    // Бюджет
    const budgetPlan = (budgets ?? []).reduce(
      (s: number, b: { plan_amount: number }) => s + Number(b.plan_amount),
      0
    );

    // Конверти
    const envelopesActive = envelopeSettings?.is_active ?? false;

    // Середня ставка депозитів
    const avgDepRate =
      (deposits ?? []).length > 0
        ? (deposits ?? []).reduce(
            (s: number, d: { interest_rate: number }) => s + Number(d.interest_rate),
            0
          ) / (deposits ?? []).length
        : 0;

    // ── Розрахунок факторів ──
    const factors: Factor[] = [];
    let totalScore = 60; // Базовий скор

    // 1. Баланс доходів/витрат
    const incomeExpenseOk = income > 0 && expenses < income;
    const incomeExpensePts = incomeExpenseOk ? 15 : income > 0 && expenses >= income ? -20 : 0;
    totalScore += incomeExpensePts;
    factors.push({
      id: "income_expense",
      label: "Баланс доходів і витрат",
      emoji: "⚖️",
      points: incomeExpensePts,
      maxPoints: 15,
      status: incomeExpensePts > 0 ? "good" : incomeExpensePts < 0 ? "bad" : "warn",
      detail:
        income > 0
          ? incomeExpenseOk
            ? `Витрати (${fmt(expenses)}) менші за доходи (${fmt(income)}). Економія ${fmt(income - expenses)} цього місяця.`
            : `Витрати (${fmt(expenses)}) перевищують доходи (${fmt(income)}). Перевитрата ${fmt(expenses - income)}.`
          : "Немає доходів цього місяця. Додайте транзакції з типом «Дохід».",
    });

    // 2. Борги
    const debtPts = totalDebt === 0 ? 10 : totalDebt < income * 3 ? 5 : 0;
    totalScore += debtPts;
    factors.push({
      id: "debt",
      label: "Кредитне навантаження",
      emoji: "💳",
      points: debtPts,
      maxPoints: 10,
      status: debtPts >= 10 ? "good" : debtPts > 0 ? "warn" : "bad",
      detail:
        totalDebt === 0
          ? "Немає активних кредитів — чудово!"
          : totalDebt < income * 3
          ? `Загальний борг ${fmt(totalDebt)} — менше 3× місячного доходу. Контрольоване навантаження.`
          : `Загальний борг ${fmt(totalDebt)} — перевищує 3× місячного доходу. Високе навантаження.`,
    });

    // 3. Наявність заощаджень
    const savingsPts = totalDeposit > 0 ? 5 : 0;
    totalScore += savingsPts;
    factors.push({
      id: "savings",
      label: "Заощадження та депозити",
      emoji: "🏦",
      points: savingsPts,
      maxPoints: 5,
      status: savingsPts > 0 ? "good" : "bad",
      detail:
        totalDeposit > 0
          ? `Є депозити на суму ${fmt(totalDeposit)}${avgDepRate > 0 ? ` під ~${avgDepRate.toFixed(1)}% річних` : ""}. Фінансова подушка присутня.`
          : "Немає депозитів. Рекомендуємо відкрити хоча б невеликий депозит як фінансову подушку.",
    });

    // 4. Регулярність доходу
    const incomePts =
      daysNoIncome !== null && daysNoIncome > 60 ? -15 : daysNoIncome !== null && daysNoIncome > 30 ? -5 : 0;
    totalScore += incomePts;
    factors.push({
      id: "income_regularity",
      label: "Регулярність доходу",
      emoji: "📅",
      points: incomePts,
      maxPoints: 0,
      status: incomePts === 0 ? "good" : incomePts === -5 ? "warn" : "bad",
      detail:
        daysNoIncome === null
          ? "Доходів ще не внесено. Додайте транзакції з типом «Дохід»."
          : daysNoIncome <= 30
          ? `Останній дохід ${daysNoIncome} днів тому. Доходи надходять регулярно.`
          : daysNoIncome <= 60
          ? `Останній дохід ${daysNoIncome} днів тому. Тривала пауза без доходу.`
          : `Останній дохід ${daysNoIncome} днів тому. Критично довга пауза без доходу!`,
    });

    // 5. Дотримання бюджету
    const budgetOk = budgetPlan > 0 && expenses <= budgetPlan;
    const budgetPts = budgetOk ? 5 : 0;
    totalScore += budgetPts;
    factors.push({
      id: "budget",
      label: "Дотримання бюджету",
      emoji: "📊",
      points: budgetPts,
      maxPoints: 5,
      status: budgetPlan === 0 ? "warn" : budgetOk ? "good" : "bad",
      detail:
        budgetPlan === 0
          ? "Бюджет на місяць не встановлено. Плануйте витрати для кращого контролю."
          : budgetOk
          ? `Витрати (${fmt(expenses)}) в межах бюджету (${fmt(budgetPlan)}). Залишок: ${fmt(budgetPlan - expenses)}.`
          : `Витрати (${fmt(expenses)}) перевищують бюджет (${fmt(budgetPlan)}) на ${fmt(expenses - budgetPlan)}.`,
    });

    // 6. Метод конвертів
    const envelopePts = envelopesActive ? 3 : 0;
    totalScore += envelopePts;
    factors.push({
      id: "envelopes",
      label: "Метод конвертів",
      emoji: "✉️",
      points: envelopePts,
      maxPoints: 3,
      status: envelopesActive ? "good" : "warn",
      detail: envelopesActive
        ? "Метод конвертів активний — ви розділяєте бюджет по тижнях для кращого контролю."
        : "Метод конвертів не активний. Спробуйте розділити місячний бюджет на тижневі конверти.",
    });

    // 7. Диверсифікація рахунків
    const accountTypes = new Set((accounts ?? []).map((a: { type: string }) => a.type));
    const diversPts = accountTypes.size >= 3 ? 2 : accountTypes.size >= 2 ? 1 : 0;
    totalScore += diversPts;
    factors.push({
      id: "diversification",
      label: "Диверсифікація активів",
      emoji: "🎯",
      points: diversPts,
      maxPoints: 2,
      status: diversPts >= 2 ? "good" : diversPts > 0 ? "warn" : "bad",
      detail:
        accountTypes.size >= 3
          ? `${accountTypes.size} типів рахунків — хороша диверсифікація.`
          : accountTypes.size >= 2
          ? `${accountTypes.size} типи рахунків. Розгляньте додавання інших типів активів.`
          : "Лише один тип рахунку. Диверсифікуйте для зменшення ризиків.",
    });

    // Обмежуємо
    totalScore = Math.max(10, Math.min(100, totalScore));

    // ── Метрики ──
    const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
    const debtToIncome = income > 0 ? (monthlyPayments / income) * 100 : 0;
    const emergencyMonths = expenses > 0 ? totalDeposit / expenses : 0;

    const metrics: Metric[] = [
      {
        label: "Загальний баланс",
        value: fmt(totalBalance),
        emoji: "💰",
        color: totalBalance >= 0 ? "text-green-500" : "text-red-500",
      },
      {
        label: "Норма заощаджень",
        value: income > 0 ? `${savingsRate}%` : "—",
        emoji: "📈",
        color: savingsRate >= 20 ? "text-green-500" : savingsRate >= 10 ? "text-amber-500" : "text-red-500",
      },
      {
        label: "Борг / Дохід",
        value: income > 0 ? `${debtToIncome.toFixed(0)}%` : totalDebt > 0 ? "∞" : "0%",
        emoji: "⚖️",
        color: debtToIncome <= 30 ? "text-green-500" : debtToIncome <= 50 ? "text-amber-500" : "text-red-500",
      },
      {
        label: "Фін. подушка",
        value: expenses > 0 ? `${emergencyMonths.toFixed(1)} міс.` : "—",
        emoji: "🛡️",
        color: emergencyMonths >= 3 ? "text-green-500" : emergencyMonths >= 1 ? "text-amber-500" : "text-red-500",
      },
      {
        label: "Активних кредитів",
        value: String((credits ?? []).length),
        emoji: "💳",
        color: (credits ?? []).length === 0 ? "text-green-500" : "text-neutral-900 dark:text-neutral-100",
      },
      {
        label: "Депозити",
        value: fmt(totalDeposit),
        emoji: "🏦",
        color: totalDeposit > 0 ? "text-green-500" : "text-neutral-400",
      },
    ];

    // ── Рекомендації ──
    const recommendations: Recommendation[] = [];

    if (expenses > income && income > 0) {
      recommendations.push({
        id: "overspend",
        priority: "high",
        emoji: "🚨",
        title: "Витрати перевищують доходи",
        description: `Цього місяця ви витратили на ${fmt(expenses - income)} більше ніж заробили. Перегляньте бюджет і зменшіть необов'язкові витрати.`,
        action: "Переглянути бюджет →",
        actionHref: "/budget",
      });
    }

    if (daysNoIncome !== null && daysNoIncome > 30) {
      recommendations.push({
        id: "no_income",
        priority: "high",
        emoji: "⏰",
        title: `${daysNoIncome} днів без доходу`,
        description: "Тривала пауза без надходжень. Переконайтесь що всі доходи внесені, або заплануйте джерела доходу.",
        action: "Додати транзакцію →",
        actionHref: "/transactions",
      });
    }

    if (totalDebt > 0 && debtToIncome > 50) {
      recommendations.push({
        id: "high_debt",
        priority: "high",
        emoji: "📋",
        title: "Високе кредитне навантаження",
        description: `Щомісячні платежі (${fmt(monthlyPayments)}) складають ${debtToIncome.toFixed(0)}% доходу. Намагайтесь тримати цей показник нижче 30%.`,
        action: "Переглянути кредити →",
        actionHref: "/credits",
      });
    }

    if (totalDeposit === 0) {
      recommendations.push({
        id: "no_savings",
        priority: "medium",
        emoji: "🏦",
        title: "Створіть фінансову подушку",
        description: "Рекомендується мати заощадження на 3-6 місяців витрат. Почніть з невеликого депозиту.",
        action: "Додати депозит →",
        actionHref: "/credits?tab=deposits",
      });
    }

    if (emergencyMonths > 0 && emergencyMonths < 3) {
      recommendations.push({
        id: "low_emergency",
        priority: "medium",
        emoji: "🛡️",
        title: "Збільшіть фінансову подушку",
        description: `Ваша подушка покриває лише ${emergencyMonths.toFixed(1)} місяці витрат. Рекомендований мінімум — 3 місяці.`,
      });
    }

    if (budgetPlan === 0) {
      recommendations.push({
        id: "no_budget",
        priority: "medium",
        emoji: "📊",
        title: "Встановіть бюджет",
        description: "Планування витрат по категоріях допомагає контролювати фінанси та уникати перевитрат.",
        action: "Налаштувати бюджет →",
        actionHref: "/budget",
      });
    }

    if (!envelopesActive) {
      recommendations.push({
        id: "try_envelopes",
        priority: "low",
        emoji: "✉️",
        title: "Спробуйте метод конвертів",
        description: "Розділіть місячний бюджет на тижневі конверти. Зекономлене переходить на наступний тиждень як бонус.",
        action: "Активувати конверти →",
        actionHref: "/envelopes",
      });
    }

    if (savingsRate > 0 && savingsRate < 20 && income > 0) {
      recommendations.push({
        id: "save_more",
        priority: "low",
        emoji: "💡",
        title: "Збільшіть норму заощаджень",
        description: `Ваша норма заощаджень ${savingsRate}%. Фінансові експерти рекомендують відкладати 20% і більше.`,
      });
    }

    // Сортуємо рекомендації по пріоритету
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const grade =
      totalScore >= 80
        ? "Відмінно"
        : totalScore >= 60
        ? "Стабільно"
        : totalScore >= 40
        ? "Потребує уваги"
        : "Зона ризику";
    const gradeColor =
      totalScore >= 80
        ? "text-green-500"
        : totalScore >= 60
        ? "text-amber-500"
        : totalScore >= 40
        ? "text-orange-500"
        : "text-red-500";

    setData({
      score: totalScore,
      grade,
      gradeColor,
      factors,
      metrics,
      recommendations,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3">💔</p>
        <p className="text-sm text-neutral-400">
          Не вдалося завантажити дані. Увійдіть в акаунт.
        </p>
      </div>
    );
  }

  const goodFactors = data.factors.filter((f) => f.status === "good");
  const problemFactors = data.factors.filter((f) => f.status !== "good");

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Health Score
          </h1>
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500 font-semibold">
            Детальний аналіз
          </span>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Комплексна оцінка фінансового здоров'я на основі ваших даних
        </p>
      </div>

      {/* ── Score + Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Скор кільце */}
        <Card className="flex items-center justify-center !p-0" noPadding>
          <ScoreRing score={data.score} />
        </Card>

        {/* Метрики */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.metrics.map((m) => (
              <ScoreBadge key={m.label} {...m} />
            ))}
          </div>

          {/* Quick summary */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
            <div className="flex-1">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                <span className={`font-bold ${data.gradeColor}`}>{data.score}/100</span>
                {" · "}
                <span className={`font-semibold ${data.gradeColor}`}>{data.grade}</span>
                {" · "}
                {goodFactors.length} з {data.factors.length} факторів у нормі
              </p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-orange-400 transition-colors"
            >
              <Icon d={icons.refresh} className="w-3.5 h-3.5" />
              Оновити
            </button>
          </div>
        </div>
      </div>

      {/* ── Фактори ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Розбивка по факторах
          </h2>
          <span className="text-xs text-neutral-400">
            {data.factors.length} факторів · базовий бал 60
          </span>
        </div>

        {/* Проблемні спочатку */}
        {problemFactors.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider px-1">
              Потребують уваги ({problemFactors.length})
            </p>
            {problemFactors.map((f) => (
              <FactorRow key={f.id} factor={f} />
            ))}
          </div>
        )}

        {goodFactors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-wider px-1">
              В нормі ({goodFactors.length})
            </p>
            {goodFactors.map((f) => (
              <FactorRow key={f.id} factor={f} />
            ))}
          </div>
        )}
      </div>

      {/* ── Рекомендації ── */}
      {data.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Рекомендації
            </h2>
            <span className="text-xs text-neutral-400">
              {data.recommendations.length} порад для покращення
            </span>
          </div>
          <div className="space-y-3">
            {data.recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* ── Якщо все ідеально ── */}
      {data.recommendations.length === 0 && (
        <Card className="text-center py-10">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Чудовий фінансовий стан!
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Немає рекомендацій — ви робите все правильно. Продовжуйте!
          </p>
        </Card>
      )}

      {/* ── Як рахується скор ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🧮</span>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Як розраховується Health Score?
          </h2>
        </div>
        <div className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <p>
            Health Score — це комплексна оцінка вашого фінансового здоров'я від <strong className="text-neutral-700 dark:text-neutral-300">10 до 100</strong> балів.
            Базовий бал — 60. Кожен фактор додає або віднімає бали.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { range: "80–100", label: "Відмінно", color: "text-green-500", desc: "Фінанси під повним контролем" },
              { range: "60–79", label: "Стабільно", color: "text-amber-500", desc: "Є простір для покращення" },
              { range: "40–59", label: "Потребує уваги", color: "text-orange-500", desc: "Є серйозні проблеми" },
              { range: "10–39", label: "Зона ризику", color: "text-red-500", desc: "Потрібні негайні дії" },
            ].map(({ range, label, color, desc }) => (
              <div
                key={range}
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50"
              >
                <span className={`text-sm font-bold tabular-nums ${color} w-14`}>{range}</span>
                <div>
                  <p className={`text-xs font-semibold ${color}`}>{label}</p>
                  <p className="text-xs text-neutral-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p>
            Оцінка оновлюється при кожному відвідуванні сторінки на основі актуальних даних з ваших
            рахунків, транзакцій, кредитів та депозитів.
          </p>
        </div>
      </Card>
    </div>
  );
}