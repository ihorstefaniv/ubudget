"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Period = "month" | "quarter" | "year";

interface Account { id: string; name: string; type: string; balance: number; currency: string; icon?: string; }
interface Transaction { id: string; type: string; amount: number; note: string | null; transaction_date: string; category_key: string | null; }
interface Credit { id: string; remaining_amount: number; monthly_payment: number; payment_day: number | null; }
interface Deposit { id: string; amount: number; currency: string; }

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number, cur = "UAH") {
  const v = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (cur === "USD") return `$${v}`;
  if (cur === "EUR") return `€${v}`;
  return (n < 0 ? "−" : "") + v + " грн";
}
function todayStr() {
  return new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function startOf(period: Period): string {
  const d = new Date();
  if (period === "month")   return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  if (period === "quarter") return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).toISOString().slice(0, 10);
  return new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
}
function prevMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 10);
}
function prevMonthEnd(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 0).toISOString().slice(0, 10);
}

const CAT_ICONS: Record<string, string> = {
  food: "🛒", cafe: "☕", transport: "🚗", fuel: "⛽", health: "💊",
  housing: "🏠", clothes: "👗", entertainment: "🎮", education: "📚",
  sport: "🏃", beauty: "💄", pets: "🐾", gifts: "🎁", other: "📦",
  salary: "💼", freelance: "💻", business: "🏪", invest: "📈",
  gift: "🎀", refund: "↩️", other_in: "💰",
};
const CAT_NAMES: Record<string, string> = {
  food: "Продукти", cafe: "Кафе", transport: "Транспорт", fuel: "Пальне",
  health: "Здоров'я", housing: "Комунальні", clothes: "Одяг", entertainment: "Розваги",
  education: "Освіта", sport: "Спорт", beauty: "Краса", pets: "Тварини",
  gifts: "Подарунки", other: "Інше", salary: "Зарплата", freelance: "Фріланс",
  business: "Бізнес", invest: "Інвестиції", gift: "Подарунок", refund: "Повернення", other_in: "Інше",
};
const ACC_ICONS: Record<string, string> = {
  cash: "👛", banking: "💳", deposit: "🏦", credit: "💳",
  installment: "🛍", mortgage: "🏠", property: "🏘", crypto: "₿", collections: "🎯",
};

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  loader:  "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
  clock:   "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  chart:   "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  bag:     "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  trend:   "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
};

// ─── Health Score Ring ────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const r = 28, circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Відмінно" : score >= 60 ? "Стабільно" : "Зона ризику";
  return (
    <div className="flex items-center gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72" className="text-neutral-900 dark:text-neutral-100">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="7" strokeOpacity="0.08" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
        <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">{score}</text>
      </svg>
      <div>
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Health Score</p>
      </div>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  return (
    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
      <div className="h-2 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: value > max ? "#ef4444" : "#fb923c" }} />
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const supabase = createClient();
  const [userName, setUserName] = useState("...");
  const [period, setPeriod]     = useState<Period>("month");
  const [loading, setLoading]   = useState(true);

  const [accounts, setAccounts]     = useState<Account[]>([]);
  const [txs, setTxs]               = useState<Transaction[]>([]);
  const [credits, setCredits]       = useState<Credit[]>([]);
  const [deposits, setDeposits]     = useState<Deposit[]>([]);
  const [budgetPlan, setBudgetPlan] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Користувач";
    setUserName(name.split(" ")[0]);

    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    const [{ data: accs }, { data: txData }, { data: cr }, { data: dep }, { data: budgets }] = await Promise.all([
      supabase.from("accounts").select("id,name,type,balance,currency,icon").eq("user_id", user.id).eq("is_archived", false).order("balance", { ascending: false }),
      supabase.from("transactions").select("id,type,amount,note,transaction_date,category_key")
        .eq("user_id", user.id).is("deleted_at", null)
        .order("transaction_date", { ascending: false }).order("created_at", { ascending: false }).limit(200),
      supabase.from("credits").select("id,remaining_amount,monthly_payment,payment_day").eq("user_id", user.id).eq("is_archived", false),
      supabase.from("deposits").select("id,amount,currency").eq("user_id", user.id).eq("is_archived", false),
      supabase.from("budgets").select("plan_amount").eq("user_id", user.id).eq("month", m).eq("year", y),
    ]);

    setAccounts(accs ?? []);
    setTxs(txData ?? []);
    setCredits(cr ?? []);
    setDeposits(dep ?? []);
    setBudgetPlan((budgets ?? []).reduce((s, b) => s + Number(b.plan_amount), 0));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived values ────────────────────────────────────────
  const uahAccounts  = accounts.filter(a => a.currency === "UAH");
  const cashAccounts = accounts.filter(a => a.type === "cash");
  const bankAccounts = accounts.filter(a => a.type === "banking" || a.type === "deposit");

  const netWorth     = uahAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalCash    = cashAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalBanking = bankAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalDebt    = credits.reduce((s, c) => s + Number(c.remaining_amount), 0);
  const totalDeposit = deposits.filter(d => d.currency === "UAH").reduce((s, d) => s + Number(d.amount), 0);

  // Period transactions
  const periodStart = startOf(period);
  const periodTxs   = txs.filter(t => t.transaction_date >= periodStart);
  const income      = periodTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses    = periodTxs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  // This month budget fact
  const monthStart  = startOf("month");
  const monthTxs    = txs.filter(t => t.transaction_date >= monthStart && t.type === "expense");
  const budgetFact  = monthTxs.reduce((s, t) => s + Number(t.amount), 0);

  // Top expense category this month
  const catTotals: Record<string, number> = {};
  monthTxs.forEach(t => { const k = t.category_key ?? "other"; catTotals[k] = (catTotals[k] ?? 0) + Number(t.amount); });
  const topCatEntry = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  const topCat = topCatEntry ? { key: topCatEntry[0], amount: topCatEntry[1], pct: budgetFact > 0 ? Math.round(topCatEntry[1] / budgetFact * 100) : 0 } : null;

  // Days without income
  const lastIncomeTx   = txs.find(t => t.type === "income");
  const daysNoIncome   = lastIncomeTx ? Math.floor((Date.now() - new Date(lastIncomeTx.transaction_date).getTime()) / 86400000) : null;
  const lastIncomeDate = lastIncomeTx ? new Date(lastIncomeTx.transaction_date).toLocaleDateString("uk-UA", { day: "numeric", month: "long" }) : null;

  // Health score
  const healthScore = (() => {
    let s = 60;
    if (income > 0 && expenses < income) s += 15;
    if (totalDebt === 0) s += 10;
    else if (totalDebt < income * 3) s += 5;
    if (totalDeposit > 0) s += 5;
    if (daysNoIncome !== null && daysNoIncome > 60) s -= 15;
    if (expenses > income && income > 0) s -= 20;
    if (budgetPlan > 0 && budgetFact <= budgetPlan) s += 5;
    return Math.max(10, Math.min(100, s));
  })();

  // Upcoming credit payments (next 7 days)
  const today = new Date().getDate();
  const upcoming = credits.filter(c => {
    if (!c.payment_day) return false;
    const diff = c.payment_day - today;
    return diff >= 0 && diff <= 7;
  });

  // Recent 5 transactions
  const recentTxs = txs.slice(0, 5);

  const periodLabel: Record<Period, string> = { month: "місяць", quarter: "квартал", year: "рік" };

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <Icon d={ic.loader} className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">

      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Привіт, {userName} 👋</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 capitalize">{todayStr()}</p>
        </div>
        <HealthRing score={healthScore} />
      </div>

      {/* 2. NET WORTH */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Загальний баланс (UAH)</p>
        <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">{fmt(netWorth)}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Готівка",  value: totalCash,    color: "text-green-500"  },
            { label: "Рахунки",  value: totalBanking, color: "text-blue-500"   },
            { label: "Депозити", value: totalDeposit, color: "text-purple-500" },
            { label: "Борги",    value: -totalDebt,   color: "text-red-500"    },
          ].map(({ label, value, color }) => (
            <div key={label}>
              {/* fmt() сам додає "−" для від'ємних чисел */}
              <p className={`text-sm font-semibold ${color}`}>
                {value >= 0 ? "+" : ""}{fmt(value)}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Днів без доходу */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
            daysNoIncome === null ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
            : daysNoIncome > 60 ? "bg-red-50 dark:bg-red-950/30 text-red-500"
            : daysNoIncome > 30 ? "bg-amber-50 dark:bg-amber-950/30 text-amber-500"
            : "bg-green-50 dark:bg-green-950/30 text-green-500"
          }`}>
            <Icon d={ic.clock} className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {daysNoIncome !== null ? `${daysNoIncome} днів` : "—"}
          </p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">Без доходу</p>
          <p className="text-xs text-neutral-400 mt-1">
            {lastIncomeDate ? `Останній: ${lastIncomeDate}` : "Доходів не знайдено"}
          </p>
        </div>

        {/* Бюджет план/факт */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-orange-50 dark:bg-orange-950/30 text-orange-500">
            <Icon d={ic.chart} className="w-4 h-4" />
          </div>
          {budgetPlan > 0 ? (
            <>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{fmt(budgetFact)}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">з {fmt(budgetPlan)}</p>
                </div>
                <span className={`text-xs font-semibold ${budgetFact > budgetPlan ? "text-red-500" : "text-orange-400"}`}>
                  {Math.round(budgetFact / budgetPlan * 100)}%
                </span>
              </div>
              <ProgressBar value={budgetFact} max={budgetPlan} />
              <p className="text-xs text-neutral-400 mt-1.5">
                {budgetFact > budgetPlan ? "Перевищено на " + fmt(budgetFact - budgetPlan) : "Залишок: " + fmt(budgetPlan - budgetFact)}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{fmt(budgetFact)}</p>
              <p className="text-xs text-neutral-500 mt-0.5">витрачено цього місяця</p>
              <Link href="/budget" className="text-xs text-orange-400 hover:text-orange-500 mt-1.5 block transition-colors">
                Встановити план →
              </Link>
            </>
          )}
        </div>

        {/* Топ категорія */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-orange-50 dark:bg-orange-950/30 text-orange-500">
            <Icon d={ic.bag} className="w-4 h-4" />
          </div>
          {topCat ? (
            <>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {CAT_ICONS[topCat.key] ?? "📦"} {CAT_NAMES[topCat.key] ?? topCat.key}
              </p>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">Топ категорія</p>
              <p className="text-xs text-neutral-400 mt-1">{fmt(topCat.amount)} · {topCat.pct}% витрат</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-neutral-400">—</p>
              <p className="text-xs text-neutral-400 mt-0.5">Немає витрат цього місяця</p>
            </>
          )}
        </div>
      </div>

      {/* Upcoming credit payments alert */}
      {upcoming.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <span className="text-xl shrink-0">⏰</span>
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Найближчі платежі по кредитах</p>
            <div className="mt-1 space-y-0.5">
              {upcoming.map(c => (
                <p key={c.id} className="text-xs text-amber-600 dark:text-amber-400">
                  {c.payment_day} числа · {fmt(c.monthly_payment)}
                </p>
              ))}
            </div>
          </div>
          <Link href="/credits" className="ml-auto text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0 transition-colors">Деталі →</Link>
        </div>
      )}

      {/* 4. ДОХОДИ & ВИТРАТИ */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Доходи & Витрати</h2>
          <div className="flex rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden text-xs">
            {(["month", "quarter", "year"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 font-medium transition-colors ${period === p ? "bg-orange-400 text-white" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}>
                {p === "month" ? "Місяць" : p === "quarter" ? "Квартал" : "Рік"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-950/20">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Доходи</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{fmt(income)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/20">
            <p className="text-xs text-red-500 dark:text-red-400 font-medium mb-1">Витрати</p>
            <p className="text-xl font-bold text-red-500 dark:text-red-400">{fmt(expenses)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
            <p className="text-xs text-neutral-500 font-medium mb-1">Різниця</p>
            <p className={`text-xl font-bold ${income - expenses >= 0 ? "text-green-500" : "text-red-500"}`}>
              {income - expenses >= 0 ? "+" : ""}{fmt(income - expenses)}
            </p>
          </div>
        </div>

        {/* Bar chart */}
        {income > 0 && (
          <div className="flex gap-3 items-end h-16">
            {[
              { label: "Дох", val: income, max: Math.max(income, expenses), color: "bg-green-400" },
              { label: "Вит", val: expenses, max: Math.max(income, expenses), color: "bg-red-400" },
            ].map(({ label, val, max, color }) => (
              <div key={label} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                  <div className={`w-full rounded-t-lg ${color} opacity-80`}
                    style={{ height: `${Math.min((val / (max || 1)) * 100, 100)}%` }} />
                </div>
                <span className="text-[10px] text-neutral-400">{label}</span>
              </div>
            ))}
            <p className="text-xs text-neutral-400 self-center flex-1 text-center">за {periodLabel[period]}</p>
          </div>
        )}
      </div>

      {/* 5. РАХУНКИ & ТРАНЗАКЦІЇ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Стан рахунків */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Стан рахунків</h2>
            <Link href="/accounts" className="text-xs text-orange-400 hover:text-orange-500 font-medium transition-colors">Всі →</Link>
          </div>
          {accounts.length === 0 ? (
            <div className="text-center py-6 text-neutral-400">
              <p className="text-2xl mb-1">🏦</p>
              <p className="text-xs">Немає рахунків</p>
              <Link href="/accounts" className="text-xs text-orange-400 hover:text-orange-500 mt-2 block">Додати →</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {accounts.slice(0, 5).map(acc => (
                <div key={acc.id} className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm">
                      {acc.icon || ACC_ICONS[acc.type] || "💳"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{acc.name}</p>
                      <p className="text-xs text-neutral-400">{acc.type}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {fmt(Number(acc.balance), acc.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Останні транзакції */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Останні транзакції</h2>
            <Link href="/transactions" className="text-xs text-orange-400 hover:text-orange-500 font-medium transition-colors">Всі →</Link>
          </div>
          {recentTxs.length === 0 ? (
            <div className="text-center py-6 text-neutral-400">
              <p className="text-2xl mb-1">📋</p>
              <p className="text-xs">Немає транзакцій</p>
              <Link href="/transactions" className="text-xs text-orange-400 hover:text-orange-500 mt-2 block">Додати →</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTxs.map(tx => {
                const cat = tx.category_key ?? (tx.type === "income" ? "salary" : "other");
                const dateLabel = (() => {
                  const d = new Date(tx.transaction_date);
                  const t = new Date(); t.setHours(0, 0, 0, 0);
                  const diff = Math.floor((t.getTime() - d.getTime()) / 86400000);
                  if (diff === 0) return "Сьогодні";
                  if (diff === 1) return "Вчора";
                  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
                })();
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm">
                        {CAT_ICONS[cat] ?? "📦"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[140px]">
                          {tx.note || CAT_NAMES[cat] || cat}
                        </p>
                        <p className="text-xs text-neutral-400">{CAT_NAMES[cat] ?? cat} · {dateLabel}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${tx.type === "income" ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"}`}>
                      {tx.type === "income" ? "+" : "−"}{fmt(Number(tx.amount))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. QUICK TOOLS */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Інструменти</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/credits",           label: "Кредити",     emoji: "💳", desc: `${credits.length} активних` },
            { href: "/credits?tab=deposits", label: "Депозити",    emoji: "🏦", desc: deposits.length > 0 ? fmt(totalDeposit) : "Немає" },
            { href: "/investments",  label: "Інвестиції",  emoji: "📈", desc: "Портфель" },
            { href: "/envelopes",    label: "Конверти",    emoji: "✉️", desc: "Метод конвертів" },
          ].map(({ href, label, emoji, desc }) => (
            <Link key={href} href={href}
              className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-md transition-all group">
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