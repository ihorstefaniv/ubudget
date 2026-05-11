"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryDef } from "@/lib/category-registry";

// ─── Types ────────────────────────────────────────────────────

interface Tx {
  type: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  transaction_date: string;
  category_key: string | null;
}

interface MonthData {
  label: string;
  key: string; // "YYYY-MM"
  income: number;
  expense: number;
  savings: number;
}

// ─── Helpers ──────────────────────────────────────────────────

const MONTHS_UA = ["Січ","Лют","Бер","Кві","Тра","Чер","Лип","Сер","Вер","Жов","Лис","Гру"];
const MONTHS_FULL = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "М";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "к";
  return n.toFixed(0);
}
function fmtFull(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн";
}

function toUAH(tx: Tx) {
  return tx.currency === "UAH" ? tx.amount : tx.amount * (tx.exchange_rate || 1);
}

function monthKey(date: string) { return date.slice(0, 7); }

function buildMonths(txs: Tx[], months: number): MonthData[] {
  const result: MonthData[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTHS_UA[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ""}`.trim();
    const mTxs = txs.filter(t => monthKey(t.transaction_date) === key);
    const income  = mTxs.filter(t => t.type === "income").reduce((s, t) => s + toUAH(t), 0);
    const expense = mTxs.filter(t => t.type === "expense").reduce((s, t) => s + toUAH(t), 0);
    result.push({ label, key, income, expense, savings: income - expense });
  }
  return result;
}

// ─── Sub-components ───────────────────────────────────────────

function BarChart({ months, selected, onSelect }: {
  months: MonthData[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);

  return (
    <div className="flex items-end gap-1 sm:gap-2 h-40 w-full">
      {months.map(m => (
        <button key={m.key} onClick={() => onSelect(m.key)}
          className={`flex-1 flex flex-col items-center gap-0.5 group transition-opacity ${selected !== m.key ? "opacity-60 hover:opacity-90" : ""}`}>
          <div className="w-full flex items-end gap-0.5 h-28">
            {/* Income bar */}
            <div className="flex-1 rounded-t-sm bg-green-400 transition-all duration-300"
              style={{ height: `${(m.income / maxVal) * 100}%`, minHeight: m.income > 0 ? 3 : 0 }} />
            {/* Expense bar */}
            <div className="flex-1 rounded-t-sm bg-red-400 transition-all duration-300"
              style={{ height: `${(m.expense / maxVal) * 100}%`, minHeight: m.expense > 0 ? 3 : 0 }} />
          </div>
          <span className={`text-[10px] font-medium truncate w-full text-center ${selected === m.key ? "text-orange-500" : "text-neutral-400"}`}>
            {m.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function CategoryBreakdown({ txs, type }: { txs: Tx[]; type: "expense" | "income" }) {
  const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const filtered = txs.filter(t => t.type === type);
  const total = filtered.reduce((s, t) => s + toUAH(t), 0);

  const rows = cats.map(c => {
    const amount = filtered.filter(t => t.category_key === c.id).reduce((s, t) => s + toUAH(t), 0);
    return { ...c, amount };
  }).filter(r => r.amount > 0).sort((a, b) => b.amount - a.amount);

  if (rows.length === 0) return <p className="text-sm text-neutral-400 py-4 text-center">Немає даних</p>;

  return (
    <div className="space-y-2">
      {rows.map(r => {
        const pct = total > 0 ? (r.amount / total) * 100 : 0;
        return (
          <div key={r.id} className="flex items-center gap-3">
            <span className="text-base w-6 text-center shrink-0">{r.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{r.label}</span>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums ml-2 shrink-0">{fmtFull(r.amount)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className={`h-full rounded-full transition-all duration-500 ${type === "expense" ? "bg-red-400" : "bg-green-400"}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 w-7 text-right shrink-0">{Math.round(pct)}%</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-neutral-900" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
      <p className="text-xs text-neutral-400 mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function ReportsPage() {
  const supabase = createClient();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<6 | 12>(12);
  const [catTab, setCatTab] = useState<"expense" | "income">("expense");

  const now = new Date();
  const [selected, setSelected] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 10);
    const { data } = await supabase
      .from("transactions")
      .select("type, amount, currency, exchange_rate, transaction_date, category_key")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("transaction_date", from)
      .in("type", ["income", "expense"])
      .order("transaction_date", { ascending: true });
    setTxs(data ?? []);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const months = buildMonths(txs, period);
  const selMonth = months.find(m => m.key === selected) ?? months[months.length - 1];
  const selTxs = txs.filter(t => monthKey(t.transaction_date) === selected);

  // ── Year stats ─────────────────────────────────────────────
  const totalIncome  = months.reduce((s, m) => s + m.income, 0);
  const totalExpense = months.reduce((s, m) => s + m.expense, 0);
  const totalSavings = totalIncome - totalExpense;
  const avgMonthly   = totalExpense / (period);
  const bestMonth    = [...months].sort((a, b) => b.savings - a.savings)[0];

  const [selMonthLabel, selYearStr] = (() => {
    const [y, m] = selected.split("-");
    return [MONTHS_FULL[Number(m) - 1], y];
  })();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl pb-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Звіти</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Аналіз доходів та витрат по місяцях</p>
        </div>
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
          {([6, 12] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500"}`}>
              {p} місяців
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Доходи за період" value={fmtFull(totalIncome)} color="text-green-500" />
        <StatCard label="Витрати за період" value={fmtFull(totalExpense)} color="text-red-500" />
        <StatCard label="Заощаджено" value={fmtFull(Math.abs(totalSavings))}
          sub={totalSavings >= 0 ? "профіцит" : "дефіцит"}
          color={totalSavings >= 0 ? "text-orange-500" : "text-red-500"} />
        <StatCard label="Сер. витрати/міс" value={fmtFull(avgMonthly)} color="text-neutral-700 dark:text-neutral-300" />
      </div>

      {/* Bar chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Доходи & Витрати по місяцях</h2>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" />Доходи</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Витрати</span>
          </div>
        </div>
        <BarChart months={months} selected={selected} onSelect={setSelected} />
        {bestMonth && totalSavings > 0 && (
          <p className="text-[10px] text-neutral-400 mt-2">
            Найкращий місяць: <span className="text-green-500 font-medium">{bestMonth.label}</span> (+{fmtFull(bestMonth.savings)})
          </p>
        )}
      </div>

      {/* Selected month detail */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {selMonthLabel} {selYearStr}
          </h2>
          <div className="flex gap-3 text-xs">
            <span className="text-green-500 font-semibold">+{fmtFull(selMonth?.income ?? 0)}</span>
            <span className="text-red-500 font-semibold">−{fmtFull(selMonth?.expense ?? 0)}</span>
            <span className={`font-bold ${(selMonth?.savings ?? 0) >= 0 ? "text-orange-500" : "text-red-500"}`}>
              {(selMonth?.savings ?? 0) >= 0 ? "+" : "−"}{fmtFull(Math.abs(selMonth?.savings ?? 0))}
            </span>
          </div>
        </div>

        {/* Category tab */}
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit mb-4">
          {(["expense", "income"] as const).map(t => (
            <button key={t} onClick={() => setCatTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${catTab === t ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500"}`}>
              {t === "expense" ? "Витрати" : "Доходи"}
            </button>
          ))}
        </div>

        <CategoryBreakdown txs={selTxs} type={catTab} />
      </div>

      {/* Savings trend */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Заощадження по місяцях</h2>
        <div className="flex items-end gap-1 sm:gap-2 h-24">
          {months.map(m => {
            const abs = Math.abs(m.savings);
            const maxAbs = Math.max(...months.map(x => Math.abs(x.savings)), 1);
            const h = Math.round((abs / maxAbs) * 72);
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className={`text-[9px] font-semibold leading-none ${m.savings >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {m.savings !== 0 ? (m.savings >= 0 ? "+" : "−") + fmt(abs) : ""}
                </span>
                <div className={`w-4/5 rounded-sm ${m.savings >= 0 ? "bg-green-300 dark:bg-green-700" : "bg-red-300 dark:bg-red-700"}`}
                  style={{ height: Math.max(h, 4) }} />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 sm:gap-2 mt-1.5">
          {months.map(m => (
            <span key={m.key} className={`flex-1 text-[9px] truncate text-center ${m.key === selected ? "text-orange-500 font-semibold" : "text-neutral-400"}`}>
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
