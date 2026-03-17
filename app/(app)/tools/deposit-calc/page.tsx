// ФАЙЛ: app/(app)/tools/deposit-calc/page.tsx
// URL: /tools/deposit-calc — Просунутий калькулятор депозитів
"use client";

import { useState, useMemo } from "react";
import { Icon, icons, Card } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────

type CompoundPeriod = "daily" | "monthly" | "quarterly" | "semiannual" | "annual" | "end";
type Currency = "UAH" | "USD" | "EUR";

interface TopUp {
  id: string;
  month: number;       // на якому місяці
  amount: number;
}

interface CalcParams {
  amount: number;
  rate: number;
  months: number;
  compound: CompoundPeriod;
  capitalization: boolean;
  currency: Currency;
  // Податки
  taxEnabled: boolean;
  taxRate: number;        // 18% ПДФО
  militaryTax: number;    // 1.5% ВЗ
  // Доповнення
  monthlyTopUp: number;
  topUps: TopUp[];
  // Інфляція
  inflationEnabled: boolean;
  inflationRate: number;
  // Комісії
  earlyWithdrawalPenalty: number; // % штраф за дострокове зняття
  bankFee: number;               // фіксована комісія
  // Порівняння
  compareOvdp: boolean;
  ovdpRate: number;
  compareInflation: boolean;
}

interface MonthRow {
  month: number;
  startBalance: number;
  topUp: number;
  interest: number;
  tax: number;
  endBalance: number;
  cumInterest: number;
  cumTax: number;
  realValue: number; // з інфляцією
}

interface CalcResult {
  totalDeposited: number;
  grossInterest: number;
  totalTax: number;
  netInterest: number;
  finalBalance: number;
  effectiveRate: number;
  realReturn: number;        // після інфляції
  realEffectiveRate: number;
  monthlyBreakdown: MonthRow[];
  // ОВДП порівняння
  ovdpGross?: number;
  ovdpNet?: number;
  ovdpAdvantage?: number;
}

// ─── Defaults ─────────────────────────────────────────────────

const DEFAULTS: CalcParams = {
  amount: 100000,
  rate: 15,
  months: 12,
  compound: "monthly",
  capitalization: true,
  currency: "UAH",
  taxEnabled: true,
  taxRate: 18,
  militaryTax: 1.5,
  monthlyTopUp: 0,
  topUps: [],
  inflationEnabled: false,
  inflationRate: 10,
  earlyWithdrawalPenalty: 0,
  bankFee: 0,
  compareOvdp: false,
  ovdpRate: 19.5,
  compareInflation: false,
};

// ─── Helpers ──────────────────────────────────────────────────

function fmt(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtInt(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function uid() { return Math.random().toString(36).slice(2, 9); }

function currencySymbol(c: Currency) {
  return c === "USD" ? "$" : c === "EUR" ? "€" : "₴";
}

function compoundPeriodsPerYear(p: CompoundPeriod): number {
  switch (p) {
    case "daily": return 365;
    case "monthly": return 12;
    case "quarterly": return 4;
    case "semiannual": return 2;
    case "annual": return 1;
    case "end": return 0; // простий %
  }
}

// ─── Core Calculator ──────────────────────────────────────────

function calculate(params: CalcParams): CalcResult {
  const {
    amount, rate, months, compound, capitalization, currency,
    taxEnabled, taxRate, militaryTax, monthlyTopUp, topUps,
    inflationEnabled, inflationRate, earlyWithdrawalPenalty, bankFee,
    compareOvdp, ovdpRate,
  } = params;

  const totalTaxRate = taxEnabled ? (taxRate + militaryTax) / 100 : 0;
  const monthlyRate = rate / 100 / 12;
  const monthlyInflation = inflationRate / 100 / 12;

  const rows: MonthRow[] = [];
  let balance = amount;
  let cumInterest = 0;
  let cumTax = 0;
  let totalDeposited = amount;

  for (let m = 1; m <= months; m++) {
    const startBalance = balance;

    // Доповнення
    let topUp = monthlyTopUp;
    const extraTopUps = topUps.filter(t => t.month === m);
    extraTopUps.forEach(t => { topUp += t.amount; });

    balance += topUp;
    totalDeposited += topUp;

    // Нарахування відсотків
    let interest = 0;

    if (compound === "end") {
      // Простий відсоток — нараховуємо кожен місяць але не додаємо
      interest = balance * monthlyRate;
    } else if (compound === "daily") {
      // Щоденне: (1 + r/365)^30 - 1
      const dailyRate = rate / 100 / 365;
      interest = balance * (Math.pow(1 + dailyRate, 30) - 1);
    } else {
      const periodsPerYear = compoundPeriodsPerYear(compound);
      const monthsPerPeriod = 12 / periodsPerYear;

      if (m % monthsPerPeriod === 0 || compound === "monthly") {
        // Нарахування у цьому місяці
        if (compound === "monthly") {
          interest = balance * monthlyRate;
        } else {
          const periodRate = rate / 100 / periodsPerYear;
          interest = balance * periodRate;
        }
      }
    }

    // Податок
    const tax = interest * totalTaxRate;
    const netInterest = interest - tax;

    cumInterest += interest;
    cumTax += tax;

    // Капіталізація
    if (capitalization && compound !== "end") {
      balance += netInterest;
    }

    // Реальна вартість з інфляцією
    const inflationFactor = inflationEnabled ? Math.pow(1 + monthlyInflation, m) : 1;
    const realValue = balance / inflationFactor;

    rows.push({
      month: m,
      startBalance,
      topUp,
      interest,
      tax,
      endBalance: balance,
      cumInterest,
      cumTax,
      realValue,
    });
  }

  // Якщо "в кінці строку" — додаємо весь відсоток
  if (compound === "end") {
    const grossInterest = cumInterest;
    const totalTax = grossInterest * totalTaxRate;
    balance += grossInterest - totalTax;
  }

  // Комісії
  balance -= bankFee;

  const grossInterest = cumInterest;
  const totalTax = cumTax;
  const netInt = grossInterest - totalTax;
  const finalBalance = compound === "end" ? balance : rows[rows.length - 1]?.endBalance ?? amount;

  const effectiveRate = totalDeposited > 0
    ? ((finalBalance - totalDeposited) / totalDeposited) * (12 / months) * 100
    : 0;

  // Реальна дохідність (після інфляції)
  const inflationFactor = inflationEnabled ? Math.pow(1 + inflationRate / 100, months / 12) : 1;
  const realFinal = finalBalance / inflationFactor;
  const realReturn = realFinal - totalDeposited;
  const realEffectiveRate = totalDeposited > 0
    ? (realReturn / totalDeposited) * (12 / months) * 100
    : 0;

  // ОВДП порівняння
  let ovdpGross: number | undefined;
  let ovdpNet: number | undefined;
  let ovdpAdvantage: number | undefined;

  if (compareOvdp) {
    // ОВДП: простий відсоток, 18% + 1.5% податок
    ovdpGross = amount * (ovdpRate / 100) * (months / 12);
    const ovdpTaxTotal = ovdpGross * totalTaxRate;
    ovdpNet = ovdpGross - ovdpTaxTotal;
    ovdpAdvantage = ovdpNet - netInt;
  }

  return {
    totalDeposited,
    grossInterest: grossInterest,
    totalTax,
    netInterest: netInt,
    finalBalance: compound === "end" ? balance : finalBalance,
    effectiveRate,
    realReturn,
    realEffectiveRate,
    monthlyBreakdown: rows,
    ovdpGross,
    ovdpNet,
    ovdpAdvantage,
  };
}

// ─── UI Components ────────────────────────────────────────────

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all tabular-nums";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function ResultCard({ label, value, sub, color = "text-neutral-900 dark:text-neutral-100", emoji }: {
  label: string; value: string; sub?: string; color?: string; emoji?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-1.5">
        {emoji && <span className="text-base">{emoji}</span>}
        <p className="text-xs text-neutral-400">{label}</p>
      </div>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Breakdown Table ──────────────────────────────────────────

function BreakdownTable({ rows, currency, showReal }: { rows: MonthRow[]; currency: Currency; showReal: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const sym = currencySymbol(currency);
  const visible = expanded ? rows : rows.slice(0, 6);
  const hasMore = rows.length > 6;

  return (
    <Card noPadding>
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Помісячна розбивка</h3>
        </div>
        <span className="text-xs text-neutral-400">{rows.length} місяців</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              {["Міс.", "Баланс", "Довнесення", "Відсотки", "Податок", "Кінцевий", ...(showReal ? ["Реальний*"] : [])].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {visible.map(row => (
              <tr key={row.month} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-2.5 text-neutral-500 tabular-nums">{row.month}</td>
                <td className="px-4 py-2.5 tabular-nums text-neutral-700 dark:text-neutral-300">{sym}{fmtInt(row.startBalance)}</td>
                <td className="px-4 py-2.5 tabular-nums">
                  {row.topUp > 0
                    ? <span className="text-blue-500">+{sym}{fmtInt(row.topUp)}</span>
                    : <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-green-500">+{sym}{fmt(row.interest)}</td>
                <td className="px-4 py-2.5 tabular-nums text-red-400">−{sym}{fmt(row.tax)}</td>
                <td className="px-4 py-2.5 tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{sym}{fmtInt(row.endBalance)}</td>
                {showReal && (
                  <td className="px-4 py-2.5 tabular-nums text-amber-500">{sym}{fmtInt(row.realValue)}</td>
                )}
              </tr>
            ))}
          </tbody>

          {/* Підсумок */}
          <tfoot>
            <tr className="border-t-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30">
              <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">Σ</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 tabular-nums text-blue-500 font-medium">
                +{sym}{fmtInt(rows.reduce((s, r) => s + r.topUp, 0))}
              </td>
              <td className="px-4 py-3 tabular-nums text-green-500 font-bold">
                +{sym}{fmt(rows[rows.length - 1]?.cumInterest ?? 0)}
              </td>
              <td className="px-4 py-3 tabular-nums text-red-400 font-medium">
                −{sym}{fmt(rows[rows.length - 1]?.cumTax ?? 0)}
              </td>
              <td className="px-4 py-3 tabular-nums font-bold text-neutral-900 dark:text-neutral-100">
                {sym}{fmtInt(rows[rows.length - 1]?.endBalance ?? 0)}
              </td>
              {showReal && <td className="px-4 py-3 tabular-nums text-amber-500 font-medium">
                {sym}{fmtInt(rows[rows.length - 1]?.realValue ?? 0)}
              </td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {hasMore && (
        <button onClick={() => setExpanded(v => !v)}
          className="w-full py-3 text-xs text-orange-400 hover:text-orange-500 font-medium border-t border-neutral-100 dark:border-neutral-800 transition-colors">
          {expanded ? "Згорнути ↑" : `Показати всі ${rows.length} місяців ↓`}
        </button>
      )}
    </Card>
  );
}

// ─── Visual Chart ─────────────────────────────────────────────

function GrowthChart({ rows, currency }: { rows: MonthRow[]; currency: Currency }) {
  if (rows.length === 0) return null;
  const maxVal = Math.max(...rows.map(r => r.endBalance));
  const minVal = rows[0].startBalance;
  const range = maxVal - minVal || 1;
  const sym = currencySymbol(currency);

  // Показуємо максимум 24 стовпчики
  const step = Math.max(1, Math.floor(rows.length / 24));
  const sampled = rows.filter((_, i) => i % step === 0 || i === rows.length - 1);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📈</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Ріст депозиту</h3>
      </div>

      <div className="flex items-end gap-[2px]" style={{ height: 128 }}>
        {sampled.map((r, i) => {
          const h = Math.max(((r.endBalance - minVal) / range) * 100, 4);
          const isLast = i === sampled.length - 1;
          const barHeight = Math.max((h / 100) * 128, 4);
          return (
            <div key={r.month} className="flex-1 group relative flex items-end justify-center" style={{ height: 128 }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  <p className="font-semibold">Міс. {r.month}</p>
                  <p>{sym}{fmtInt(r.endBalance)}</p>
                </div>
              </div>
              <div
                className={`w-full rounded-t-sm transition-all ${isLast ? "bg-orange-400" : "bg-orange-300 dark:bg-orange-600"} hover:bg-orange-500`}
                style={{ height: barHeight }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-neutral-400">Міс. 1</span>
        <span className="text-xs text-neutral-400">Міс. {rows.length}</span>
      </div>
    </Card>
  );
}

// ─── OVDP Comparison ──────────────────────────────────────────

function OvdpComparison({ result, params }: { result: CalcResult; params: CalcParams }) {
  if (!params.compareOvdp || result.ovdpNet === undefined) return null;

  const sym = currencySymbol(params.currency);
  const depWins = result.netInterest > result.ovdpNet;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🇺🇦</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Порівняння з ОВДП</h3>
        <span className="text-xs text-neutral-400">{params.ovdpRate}% річних</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Депозит */}
        <div className={`p-4 rounded-xl border-2 ${depWins ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10" : "border-neutral-200 dark:border-neutral-700"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span>🏦</span>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Депозит</p>
            {depWins && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950/30 text-green-600 font-semibold">Вигідніше</span>}
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">+{sym}{fmtInt(result.netInterest)}</p>
          <p className="text-xs text-neutral-400">чистий дохід після податків</p>
          <p className="text-xs text-neutral-400 mt-1">Ставка: {params.rate}% · {params.capitalization ? "з капіталізацією" : "без капіталізації"}</p>
        </div>

        {/* ОВДП */}
        <div className={`p-4 rounded-xl border-2 ${!depWins ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10" : "border-neutral-200 dark:border-neutral-700"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span>🇺🇦</span>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">ОВДП</p>
            {!depWins && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950/30 text-green-600 font-semibold">Вигідніше</span>}
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">+{sym}{fmtInt(result.ovdpNet!)}</p>
          <p className="text-xs text-neutral-400">чистий дохід після податків</p>
          <p className="text-xs text-neutral-400 mt-1">Ставка: {params.ovdpRate}% · простий відсоток</p>
        </div>
      </div>

      <div className={`p-3 rounded-xl text-xs font-medium ${
        Math.abs(result.ovdpAdvantage!) < 100
          ? "bg-neutral-50 dark:bg-neutral-800 text-neutral-500"
          : result.ovdpAdvantage! > 0
          ? "bg-green-50 dark:bg-green-950/20 text-green-600"
          : "bg-amber-50 dark:bg-amber-950/20 text-amber-600"
      }`}>
        {Math.abs(result.ovdpAdvantage!) < 100
          ? "⚖️ Різниця мінімальна — обирайте за зручністю"
          : result.ovdpAdvantage! > 0
          ? `🇺🇦 ОВДП вигідніше на ${sym}${fmtInt(result.ovdpAdvantage!)} за ${params.months} міс.`
          : `🏦 Депозит вигідніше на ${sym}${fmtInt(Math.abs(result.ovdpAdvantage!))} за ${params.months} міс.`}
      </div>
    </Card>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function DepositCalcPage() {
  const [params, setParams] = useState<CalcParams>(DEFAULTS);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [newTopUpMonth, setNewTopUpMonth] = useState("");
  const [newTopUpAmount, setNewTopUpAmount] = useState("");

  const upd = <K extends keyof CalcParams>(key: K, val: CalcParams[K]) =>
    setParams(p => ({ ...p, [key]: val }));

  const result = useMemo(() => calculate(params), [params]);
  const sym = currencySymbol(params.currency);

  function addTopUp() {
    if (!newTopUpMonth || !newTopUpAmount || +newTopUpAmount <= 0) return;
    upd("topUps", [...params.topUps, { id: uid(), month: +newTopUpMonth, amount: +newTopUpAmount }]);
    setNewTopUpMonth("");
    setNewTopUpAmount("");
  }

  function removeTopUp(id: string) {
    upd("topUps", params.topUps.filter(t => t.id !== id));
  }

  const compoundOptions: { value: CompoundPeriod; label: string }[] = [
    { value: "daily", label: "Щоденне" },
    { value: "monthly", label: "Щомісяця" },
    { value: "quarterly", label: "Щоквартально" },
    { value: "semiannual", label: "Кожні пів року" },
    { value: "annual", label: "Раз на рік" },
    { value: "end", label: "В кінці строку" },
  ];

  const presets = [
    { label: "3 міс", months: 3 },
    { label: "6 міс", months: 6 },
    { label: "12 міс", months: 12 },
    { label: "18 міс", months: 18 },
    { label: "24 міс", months: 24 },
    { label: "36 міс", months: 36 },
  ];

  return (
    <div className="space-y-6 pb-8 max-w-5xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          💰 Калькулятор депозитів
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Складні відсотки, податки, довнесення, порівняння з ОВДП
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* ── Ліва колонка: результати ── */}
        <div className="space-y-5">

          {/* Головні результати */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultCard
              emoji="💰" label="Фінальна сума"
              value={`${sym}${fmtInt(result.finalBalance)}`}
              color="text-green-500"
            />
            <ResultCard
              emoji="📈" label="Чистий дохід"
              value={`+${sym}${fmtInt(result.netInterest)}`}
              sub={`Брутто: +${sym}${fmtInt(result.grossInterest)}`}
              color="text-green-500"
            />
            <ResultCard
              emoji="🏦" label="Ефективна ставка"
              value={`${result.effectiveRate.toFixed(2)}%`}
              sub={`Номінальна: ${params.rate}%`}
              color={result.effectiveRate > params.rate ? "text-green-500" : "text-amber-500"}
            />
            <ResultCard
              emoji="💸" label="Податки"
              value={`−${sym}${fmtInt(result.totalTax)}`}
              sub={params.taxEnabled ? `ПДФО ${params.taxRate}% + ВЗ ${params.militaryTax}%` : "Вимкнено"}
              color="text-red-400"
            />
            <ResultCard
              emoji="🏧" label="Всього внесено"
              value={`${sym}${fmtInt(result.totalDeposited)}`}
              sub={params.monthlyTopUp > 0 ? `+${sym}${fmtInt(params.monthlyTopUp)}/міс` : undefined}
            />
            {params.inflationEnabled && (
              <ResultCard
                emoji="📉" label="Реальний дохід"
                value={`${result.realReturn >= 0 ? "+" : "−"}${sym}${fmtInt(Math.abs(result.realReturn))}`}
                sub={`Реальна ставка: ${result.realEffectiveRate.toFixed(1)}%`}
                color={result.realReturn >= 0 ? "text-green-500" : "text-red-500"}
              />
            )}
          </div>

          {/* Графік росту */}
          <GrowthChart rows={result.monthlyBreakdown} currency={params.currency} />

          {/* ОВДП порівняння */}
          <OvdpComparison result={result} params={params} />

          {/* Помісячна таблиця */}
          <div>
            <button onClick={() => setShowBreakdown(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-500 transition-colors mb-3">
              <Icon d={showBreakdown ? icons.chevUp : icons.chevDown} className="w-4 h-4" />
              {showBreakdown ? "Сховати розбивку" : "Показати помісячну розбивку"}
            </button>

            {showBreakdown && (
              <BreakdownTable
                rows={result.monthlyBreakdown}
                currency={params.currency}
                showReal={params.inflationEnabled}
              />
            )}
          </div>

          {/* Формула */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🧮</span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Формула</p>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-2 leading-relaxed">
              {params.capitalization && params.compound !== "end" ? (
                <>
                  <p><strong className="text-neutral-700 dark:text-neutral-300">Складний відсоток з капіталізацією:</strong></p>
                  <p className="font-mono bg-neutral-50 dark:bg-neutral-800 p-2 rounded-lg">
                    S = P × (1 + r/n)^(n×t) − P
                  </p>
                  <p>де P = початкова сума, r = ставка, n = кількість нарахувань/рік, t = років</p>
                </>
              ) : (
                <>
                  <p><strong className="text-neutral-700 dark:text-neutral-300">Простий відсоток:</strong></p>
                  <p className="font-mono bg-neutral-50 dark:bg-neutral-800 p-2 rounded-lg">
                    S = P × r × t
                  </p>
                </>
              )}
              {params.taxEnabled && (
                <p>Після оподаткування: <strong className="text-neutral-700 dark:text-neutral-300">Чистий = Брутто × (1 − {params.taxRate + params.militaryTax}%)</strong></p>
              )}
              {params.inflationEnabled && (
                <p>Реальний дохід: <strong className="text-neutral-700 dark:text-neutral-300">Реальний = Номінальний / (1 + інфляція)^t</strong></p>
              )}
            </div>
          </Card>
        </div>

        {/* ── Права колонка: параметри ── */}
        <div className="space-y-4">

          {/* Основні */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Параметри депозиту</p>

            <div className="space-y-4">
              <Field label="Сума депозиту">
                <input type="number" value={params.amount || ""} onChange={e => upd("amount", +e.target.value)}
                  placeholder="100 000" className={inp} />
              </Field>

              <Field label="Ставка % річних">
                <input type="number" value={params.rate || ""} onChange={e => upd("rate", +e.target.value)}
                  placeholder="15" step="0.1" className={inp} />
              </Field>

              <Field label="Строк (місяці)">
                <input type="number" value={params.months || ""} onChange={e => upd("months", +e.target.value)}
                  placeholder="12" className={inp} />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {presets.map(p => (
                    <button key={p.months} onClick={() => upd("months", p.months)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        params.months === p.months
                          ? "bg-orange-100 dark:bg-orange-950/30 text-orange-500"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-orange-400"
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Нарахування відсотків">
                <select value={params.compound} onChange={e => upd("compound", e.target.value as CompoundPeriod)}
                  className={inp}>
                  {compoundOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              {params.compound !== "end" && (
                <Toggle
                  on={params.capitalization}
                  onChange={v => upd("capitalization", v)}
                  label="Капіталізація"
                  desc="Відсотки додаються до тіла депозиту"
                />
              )}

              <Field label="Валюта">
                <div className="flex gap-2">
                  {(["UAH", "USD", "EUR"] as Currency[]).map(c => (
                    <button key={c} onClick={() => upd("currency", c)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        params.currency === c
                          ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                          : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          {/* Податки */}
          <Card>
            <div className="space-y-4">
              <Toggle
                on={params.taxEnabled}
                onChange={v => upd("taxEnabled", v)}
                label="🏛️ Податки"
                desc="ПДФО + Військовий збір"
              />

              {params.taxEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  <Field label="ПДФО %">
                    <input type="number" value={params.taxRate} onChange={e => upd("taxRate", +e.target.value)}
                      className={inp} />
                  </Field>
                  <Field label="Військ. збір %">
                    <input type="number" value={params.militaryTax} onChange={e => upd("militaryTax", +e.target.value)}
                      className={inp} />
                  </Field>
                </div>
              )}
            </div>
          </Card>

          {/* Довнесення */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">📥 Довнесення</p>
            <div className="space-y-4">
              <Field label="Щомісячне поповнення">
                <input type="number" value={params.monthlyTopUp || ""} onChange={e => upd("monthlyTopUp", +e.target.value)}
                  placeholder="0" className={inp} />
              </Field>

              {/* Одноразові довнесення */}
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Одноразові довнесення</p>
                {params.topUps.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {params.topUps.map(t => (
                      <div key={t.id} className="flex items-center gap-2 text-xs">
                        <span className="text-neutral-400">Міс. {t.month}:</span>
                        <span className="text-blue-500 font-medium">+{sym}{fmtInt(t.amount)}</span>
                        <button onClick={() => removeTopUp(t.id)} className="text-neutral-300 hover:text-red-400 ml-auto">
                          <Icon d={icons.close} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="number" value={newTopUpMonth} onChange={e => setNewTopUpMonth(e.target.value)}
                    placeholder="Міс." className={`w-16 ${inp}`} />
                  <input type="number" value={newTopUpAmount} onChange={e => setNewTopUpAmount(e.target.value)}
                    placeholder="Сума" className={`flex-1 ${inp}`} />
                  <button onClick={addTopUp}
                    className="px-3 py-2 rounded-xl bg-orange-400 text-white text-xs font-bold hover:bg-orange-500 transition-colors shrink-0">
                    +
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Інфляція */}
          <Card>
            <div className="space-y-4">
              <Toggle
                on={params.inflationEnabled}
                onChange={v => upd("inflationEnabled", v)}
                label="📉 Інфляція"
                desc="Реальна дохідність після інфляції"
              />
              {params.inflationEnabled && (
                <Field label="Очікувана інфляція % / рік">
                  <input type="number" value={params.inflationRate} onChange={e => upd("inflationRate", +e.target.value)}
                    step="0.5" className={inp} />
                </Field>
              )}
            </div>
          </Card>

          {/* Порівняння з ОВДП */}
          <Card>
            <div className="space-y-4">
              <Toggle
                on={params.compareOvdp}
                onChange={v => upd("compareOvdp", v)}
                label="🇺🇦 Порівняти з ОВДП"
                desc="Облігації внутрішньої позики"
              />
              {params.compareOvdp && (
                <Field label="Ставка ОВДП % річних">
                  <input type="number" value={params.ovdpRate} onChange={e => upd("ovdpRate", +e.target.value)}
                    step="0.1" className={inp} />
                </Field>
              )}
            </div>
          </Card>

          {/* Комісії */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">💳 Комісії</p>
            <div className="space-y-4">
              <Field label="Штраф за дострокове зняття %" hint="Від нарахованих відсотків">
                <input type="number" value={params.earlyWithdrawalPenalty || ""} onChange={e => upd("earlyWithdrawalPenalty", +e.target.value)}
                  placeholder="0" className={inp} />
              </Field>
              <Field label="Фіксована комісія банку" hint="Одноразова комісія при закритті">
                <input type="number" value={params.bankFee || ""} onChange={e => upd("bankFee", +e.target.value)}
                  placeholder="0" className={inp} />
              </Field>
            </div>
          </Card>

          {/* Скинути */}
          <button onClick={() => setParams(DEFAULTS)}
            className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-700 transition-all">
            ↺ Скинути до стандартних
          </button>
        </div>
      </div>
    </div>
  );
}