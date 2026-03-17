// ФАЙЛ: app/(app)/tools/credit-calc/page.tsx
// URL: /tools/credit-calc — Просунутий калькулятор кредитів
"use client";

import { useState, useMemo } from "react";
import { Icon, icons, Card } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────

type PaymentType = "annuity" | "differential";
type CreditType = "consumer" | "car" | "mortgage" | "credit_card" | "installment";
type Currency = "UAH" | "USD" | "EUR";

interface EarlyPayment {
  id: string;
  month: number;
  amount: number;
  strategy: "reduce_term" | "reduce_payment";
}

interface CalcParams {
  creditType: CreditType;
  amount: number;
  rate: number;
  months: number;
  paymentType: PaymentType;
  currency: Currency;
  // Комісії
  oneTimeFee: number;         // одноразова комісія при видачі %
  monthlyFee: number;         // щомісячна комісія грн
  insuranceYearly: number;    // страховка річна грн
  // Дострокові
  earlyPayments: EarlyPayment[];
  // Порівняння рефінансування
  compareRefi: boolean;
  refiRate: number;
  refiMonths: number;
  refiFee: number;            // комісія за рефінансування
  // Авто
  carPrice: number;
  downPayment: number;
  // Іпотека
  propertyPrice: number;
  mortgageDown: number;
}

interface MonthRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  fee: number;
  insurance: number;
  balance: number;
  cumInterest: number;
  cumPrincipal: number;
  earlyPayment: number;
}

interface CalcResult {
  monthlyPayment: number;       // перший місяць (для differential — макс.)
  monthlyPaymentLast: number;   // останній місяць
  totalPayments: number;
  totalInterest: number;
  totalFees: number;
  totalInsurance: number;
  totalCost: number;            // все разом
  overpayment: number;          // totalCost - amount
  overpaymentPct: number;
  effectiveRate: number;        // реальна ставка з комісіями
  actualMonths: number;         // з дострок. погашенням
  breakdown: MonthRow[];
  // Рефінансування
  refiSavings?: number;
  refiNewMonthly?: number;
  refiNewTotal?: number;
}

// ─── Constants ────────────────────────────────────────────────

const CREDIT_TYPES: Record<CreditType, { label: string; emoji: string }> = {
  consumer:    { label: "Споживчий",       emoji: "💳" },
  car:         { label: "Автокредит",      emoji: "🚗" },
  mortgage:    { label: "Іпотека",         emoji: "🏠" },
  credit_card: { label: "Кредитна картка", emoji: "💳" },
  installment: { label: "Розстрочка",      emoji: "🛍️" },
};

const DEFAULTS: CalcParams = {
  creditType: "consumer",
  amount: 200000,
  rate: 24,
  months: 24,
  paymentType: "annuity",
  currency: "UAH",
  oneTimeFee: 0,
  monthlyFee: 0,
  insuranceYearly: 0,
  earlyPayments: [],
  compareRefi: false,
  refiRate: 18,
  refiMonths: 24,
  refiFee: 1,
  carPrice: 0,
  downPayment: 0,
  propertyPrice: 0,
  mortgageDown: 0,
};

// ─── Helpers ──────────────────────────────────────────────────

function fmtN(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtI(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function uid() { return Math.random().toString(36).slice(2, 9); }
function sym(c: Currency) { return c === "USD" ? "$" : c === "EUR" ? "€" : "₴"; }

// ─── Calculator Engine ────────────────────────────────────────

function calculate(p: CalcParams): CalcResult {
  const { amount, rate, months, paymentType, oneTimeFee, monthlyFee, insuranceYearly, earlyPayments, compareRefi, refiRate, refiMonths, refiFee } = p;

  const monthlyRate = rate / 100 / 12;
  const monthlyInsurance = insuranceYearly / 12;
  const oneTimeFeeAmount = amount * (oneTimeFee / 100);

  // Ануїтетний платіж
  const annuityPayment = monthlyRate > 0
    ? amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : amount / months;

  const rows: MonthRow[] = [];
  let balance = amount;
  let cumInterest = 0;
  let cumPrincipal = 0;
  let totalFees = oneTimeFeeAmount;
  let totalInsurance = 0;
  let totalPayments = 0;
  let actualMonths = 0;

  // Маппа дострокових платежів
  const earlyMap: Record<number, EarlyPayment[]> = {};
  earlyPayments.forEach(ep => {
    if (!earlyMap[ep.month]) earlyMap[ep.month] = [];
    earlyMap[ep.month].push(ep);
  });

  // Для перерахунку ануїтету після дострокового
  let currentAnnuity = annuityPayment;
  let remainingMonths = months;

  for (let m = 1; m <= months && balance > 0.01; m++) {
    const interest = balance * monthlyRate;
    let principal: number;
    let payment: number;

    if (paymentType === "annuity") {
      payment = Math.min(currentAnnuity, balance + interest);
      principal = payment - interest;
    } else {
      // Диференційований
      principal = amount / months;
      payment = principal + interest;
    }

    // Ensure principal doesn't exceed balance
    if (principal > balance) {
      principal = balance;
      payment = principal + interest;
    }

    balance -= principal;
    cumInterest += interest;
    cumPrincipal += principal;

    const fee = monthlyFee;
    totalFees += fee;

    const ins = monthlyInsurance;
    totalInsurance += ins;

    totalPayments += payment + fee + ins;
    actualMonths = m;

    let earlyPay = 0;

    // Дострокове погашення
    const earlyThisMonth = earlyMap[m];
    if (earlyThisMonth && balance > 0) {
      earlyThisMonth.forEach(ep => {
        const payAmt = Math.min(ep.amount, balance);
        balance -= payAmt;
        earlyPay += payAmt;
        totalPayments += payAmt;
        cumPrincipal += payAmt;

        // Перерахунок ануїтету якщо зменшуємо платіж
        if (ep.strategy === "reduce_payment" && balance > 0 && paymentType === "annuity") {
          const remM = months - m;
          if (remM > 0 && monthlyRate > 0) {
            currentAnnuity = balance * (monthlyRate * Math.pow(1 + monthlyRate, remM)) / (Math.pow(1 + monthlyRate, remM) - 1);
          } else if (remM > 0) {
            currentAnnuity = balance / remM;
          }
        }
        // reduce_term — просто продовжуємо з тим самим платежем, кредит закриється раніше
      });
    }

    rows.push({
      month: m,
      payment,
      principal,
      interest,
      fee,
      insurance: ins,
      balance: Math.max(0, balance),
      cumInterest,
      cumPrincipal,
      earlyPayment: earlyPay,
    });

    if (balance <= 0.01) break;
  }

  const totalCost = totalPayments + oneTimeFeeAmount;
  const overpayment = totalCost - amount;
  const overpaymentPct = amount > 0 ? (overpayment / amount) * 100 : 0;

  // Ефективна ставка (IRR наближення)
  const effectiveRate = amount > 0 && actualMonths > 0
    ? (cumInterest + totalFees + totalInsurance) / amount / (actualMonths / 12) * 100
    : 0;

  const firstPayment = rows[0]?.payment ?? 0;
  const lastPayment = rows[rows.length - 1]?.payment ?? 0;

  // Рефінансування
  let refiSavings: number | undefined;
  let refiNewMonthly: number | undefined;
  let refiNewTotal: number | undefined;

  if (compareRefi) {
    // Скільки залишилось на момент рефі (після 1/3 строку)
    const refiMonth = Math.floor(months / 3);
    const balanceAtRefi = rows[refiMonth - 1]?.balance ?? balance;
    const refiMonthlyRate = refiRate / 100 / 12;
    const refiFeeAmount = balanceAtRefi * (refiFee / 100);

    if (refiMonthlyRate > 0 && refiMonths > 0) {
      refiNewMonthly = balanceAtRefi * (refiMonthlyRate * Math.pow(1 + refiMonthlyRate, refiMonths)) / (Math.pow(1 + refiMonthlyRate, refiMonths) - 1);
      refiNewTotal = refiNewMonthly * refiMonths + refiFeeAmount;

      // Скільки б заплатили по старому кредиту за решту строку
      const oldRemaining = rows.slice(refiMonth).reduce((s, r) => s + r.payment + r.fee + r.insurance, 0);
      refiSavings = oldRemaining - refiNewTotal;
    }
  }

  return {
    monthlyPayment: firstPayment,
    monthlyPaymentLast: lastPayment,
    totalPayments,
    totalInterest: cumInterest,
    totalFees,
    totalInsurance,
    totalCost,
    overpayment,
    overpaymentPct,
    effectiveRate,
    actualMonths,
    breakdown: rows,
    refiSavings,
    refiNewMonthly,
    refiNewTotal,
  };
}

// ─── UI Primitives ────────────────────────────────────────────

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

// ─── Overpayment Structure Chart ──────────────────────────────

function OverpaymentChart({ result, params }: { result: CalcResult; params: CalcParams }) {
  const s = sym(params.currency);
  const parts = [
    { label: "Тіло кредиту", amount: params.amount, color: "bg-blue-400", textColor: "text-blue-500" },
    { label: "Відсотки", amount: result.totalInterest, color: "bg-red-400", textColor: "text-red-500" },
    { label: "Комісії", amount: result.totalFees, color: "bg-amber-400", textColor: "text-amber-500" },
    { label: "Страховка", amount: result.totalInsurance, color: "bg-purple-400", textColor: "text-purple-500" },
  ].filter(p => p.amount > 0);

  const total = parts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧩</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Структура витрат</h3>
      </div>

      {/* Стакований бар */}
      <div className="flex h-6 rounded-full overflow-hidden gap-0.5 mb-4">
        {parts.map(p => (
          <div key={p.label} className={`${p.color} transition-all`} style={{ width: `${(p.amount / total) * 100}%` }} />
        ))}
      </div>

      {/* Легенда */}
      <div className="grid grid-cols-2 gap-3">
        {parts.map(p => (
          <div key={p.label} className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${p.color} shrink-0`} />
            <div>
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{p.label}</p>
              <p className={`text-sm font-bold tabular-nums ${p.textColor}`}>{s}{fmtI(p.amount)}</p>
              <p className="text-xs text-neutral-400">{(p.amount / total * 100).toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Payment Chart (principal vs interest over time) ──────────

function PaymentChart({ rows, currency }: { rows: MonthRow[]; currency: Currency }) {
  if (rows.length === 0) return null;
  const s = sym(currency);
  const maxPayment = Math.max(...rows.map(r => r.payment));

  const step = Math.max(1, Math.floor(rows.length / 30));
  const sampled = rows.filter((_, i) => i % step === 0 || i === rows.length - 1);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">📊</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Структура платежів</h3>
      </div>
      <p className="text-xs text-neutral-400 mb-4">Тіло (синій) vs Відсотки (червоний) кожен місяць</p>

      <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
        {sampled.map((r, i) => {
          const totalH = (r.payment / maxPayment) * 120;
          const interestH = (r.interest / r.payment) * totalH;
          const principalH = totalH - interestH;
          const isLast = i === sampled.length - 1;

          return (
            <div key={r.month} className="flex-1 group relative flex flex-col items-center justify-end" style={{ height: 120 }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  <p className="font-semibold">Міс. {r.month}</p>
                  <p>Платіж: {s}{fmtI(r.payment)}</p>
                  <p className="text-blue-300 dark:text-blue-600">Тіло: {s}{fmtI(r.principal)}</p>
                  <p className="text-red-300 dark:text-red-600">%: {s}{fmtI(r.interest)}</p>
                </div>
              </div>

              <div className="w-full flex flex-col items-stretch">
                {/* Principal (top) */}
                <div
                  className={`w-full rounded-t-sm ${isLast ? "bg-blue-500" : "bg-blue-400 dark:bg-blue-500"} hover:opacity-80`}
                  style={{ height: Math.max(principalH, 1) }}
                />
                {/* Interest (bottom) */}
                <div
                  className={`w-full ${isLast ? "bg-red-500" : "bg-red-300 dark:bg-red-500"} hover:opacity-80`}
                  style={{ height: Math.max(interestH, 1) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-neutral-400">Міс. 1</span>
        <span className="text-xs text-neutral-400">Міс. {rows.length}</span>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <span className="text-xs text-neutral-400">Тіло кредиту</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-400" />
          <span className="text-xs text-neutral-400">Відсотки</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Balance Chart ────────────────────────────────────────────

function BalanceChart({ rows, currency }: { rows: MonthRow[]; currency: Currency }) {
  if (rows.length === 0) return null;
  const s = sym(currency);
  const maxBal = rows[0].balance + rows[0].principal;

  const step = Math.max(1, Math.floor(rows.length / 30));
  const sampled = rows.filter((_, i) => i % step === 0 || i === rows.length - 1);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📉</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Залишок боргу</h3>
      </div>

      <div className="flex items-end gap-[2px]" style={{ height: 100 }}>
        {sampled.map((r, i) => {
          const h = Math.max((r.balance / maxBal) * 100, 1);
          const barH = (h / 100) * 100;
          const isLast = i === sampled.length - 1;
          return (
            <div key={r.month} className="flex-1 group relative flex items-end" style={{ height: 100 }}>
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                  <p className="font-semibold">Міс. {r.month}</p>
                  <p>Залишок: {s}{fmtI(r.balance)}</p>
                </div>
              </div>
              <div
                className={`w-full rounded-t-sm transition-all ${isLast ? "bg-orange-400" : "bg-orange-300 dark:bg-orange-600"} hover:bg-orange-500`}
                style={{ height: barH }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 text-xs text-neutral-400">
        <span>{s}{fmtI(maxBal)}</span>
        <span>{s}0</span>
      </div>
    </Card>
  );
}

// ─── Breakdown Table ──────────────────────────────────────────

function BreakdownTable({ rows, currency }: { rows: MonthRow[]; currency: Currency }) {
  const [expanded, setExpanded] = useState(false);
  const s = sym(currency);
  const visible = expanded ? rows : rows.slice(0, 6);
  const hasMore = rows.length > 6;

  return (
    <Card noPadding>
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Графік платежів</h3>
        </div>
        <span className="text-xs text-neutral-400">{rows.length} міс.</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              {["#", "Платіж", "Тіло", "Відсотки", "Дострок.", "Залишок"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {visible.map(row => (
              <tr key={row.month} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-2.5 text-neutral-500 tabular-nums">{row.month}</td>
                <td className="px-4 py-2.5 tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{s}{fmtN(row.payment)}</td>
                <td className="px-4 py-2.5 tabular-nums text-blue-500">{s}{fmtN(row.principal)}</td>
                <td className="px-4 py-2.5 tabular-nums text-red-400">{s}{fmtN(row.interest)}</td>
                <td className="px-4 py-2.5 tabular-nums">
                  {row.earlyPayment > 0
                    ? <span className="text-green-500 font-medium">{s}{fmtI(row.earlyPayment)}</span>
                    : <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-neutral-700 dark:text-neutral-300">{s}{fmtN(row.balance)}</td>
              </tr>
            ))}
          </tbody>
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

// ─── Refinancing Comparison ───────────────────────────────────

function RefiComparison({ result, params }: { result: CalcResult; params: CalcParams }) {
  if (!params.compareRefi || result.refiNewMonthly === undefined) return null;
  const s = sym(params.currency);
  const saves = (result.refiSavings ?? 0) > 0;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔄</span>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Рефінансування</h3>
        <span className="text-xs text-neutral-400">через {Math.floor(params.months / 3)} міс.</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-4 rounded-xl border-2 ${!saves ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10" : "border-neutral-200 dark:border-neutral-700"}`}>
          <p className="text-xs font-semibold text-neutral-500 mb-1">Поточний кредит</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{s}{fmtI(result.monthlyPayment)}/міс</p>
          <p className="text-xs text-neutral-400">{params.rate}% · {params.months} міс.</p>
        </div>

        <div className={`p-4 rounded-xl border-2 ${saves ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10" : "border-neutral-200 dark:border-neutral-700"}`}>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-neutral-500">Рефінансування</p>
            {saves && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950/30 text-green-600 font-semibold">Вигідніше</span>}
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{s}{fmtI(result.refiNewMonthly!)}/міс</p>
          <p className="text-xs text-neutral-400">{params.refiRate}% · {params.refiMonths} міс. · комісія {params.refiFee}%</p>
        </div>
      </div>

      <div className={`p-3 rounded-xl text-xs font-medium ${
        saves
          ? "bg-green-50 dark:bg-green-950/20 text-green-600"
          : "bg-amber-50 dark:bg-amber-950/20 text-amber-600"
      }`}>
        {saves
          ? `✅ Економія від рефінансування: ${s}${fmtI(result.refiSavings!)} (з урахуванням комісії ${params.refiFee}%)`
          : `⚠️ Рефінансування невигідне — переплата зросте на ${s}${fmtI(Math.abs(result.refiSavings!))}`}
      </div>
    </Card>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function CreditCalcPage() {
  const [params, setParams] = useState<CalcParams>(DEFAULTS);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [newEpMonth, setNewEpMonth] = useState("");
  const [newEpAmount, setNewEpAmount] = useState("");
  const [newEpStrategy, setNewEpStrategy] = useState<"reduce_term" | "reduce_payment">("reduce_term");

  const upd = <K extends keyof CalcParams>(key: K, val: CalcParams[K]) =>
    setParams(p => ({ ...p, [key]: val }));

  // Автоматичний розрахунок суми кредиту для авто/іпотеки
  const effectiveAmount = useMemo(() => {
    if (params.creditType === "car" && params.carPrice > 0) {
      return Math.max(0, params.carPrice - params.downPayment);
    }
    if (params.creditType === "mortgage" && params.propertyPrice > 0) {
      return Math.max(0, params.propertyPrice - params.mortgageDown);
    }
    return params.amount;
  }, [params.creditType, params.amount, params.carPrice, params.downPayment, params.propertyPrice, params.mortgageDown]);

  const calcParams = useMemo(() => ({
    ...params,
    amount: effectiveAmount,
  }), [params, effectiveAmount]);

  const result = useMemo(() => calculate(calcParams), [calcParams]);
  const s = sym(params.currency);

  function addEarlyPayment() {
    if (!newEpMonth || !newEpAmount || +newEpAmount <= 0) return;
    upd("earlyPayments", [...params.earlyPayments, { id: uid(), month: +newEpMonth, amount: +newEpAmount, strategy: newEpStrategy }]);
    setNewEpMonth("");
    setNewEpAmount("");
  }

  const presets = [
    { label: "6 міс", months: 6 },
    { label: "12 міс", months: 12 },
    { label: "24 міс", months: 24 },
    { label: "36 міс", months: 36 },
    { label: "60 міс", months: 60 },
    { label: "120 міс", months: 120 },
    { label: "240 міс", months: 240 },
  ];

  return (
    <div className="space-y-6 pb-8 max-w-5xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">📊 Калькулятор кредитів</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Ануїтет, диференційований, дострокове погашення, реальна вартість кредиту
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* ── Ліва: результати ── */}
        <div className="space-y-5">

          {/* Головні результати */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultCard emoji="💰" label="Щомісячний платіж"
              value={`${s}${fmtI(result.monthlyPayment)}`}
              sub={params.paymentType === "differential" ? `останній: ${s}${fmtI(result.monthlyPaymentLast)}` : undefined}
              color="text-orange-500" />
            <ResultCard emoji="💸" label="Переплата"
              value={`${s}${fmtI(result.overpayment)}`}
              sub={`${result.overpaymentPct.toFixed(1)}% від суми кредиту`}
              color="text-red-500" />
            <ResultCard emoji="🏦" label="Загальна вартість"
              value={`${s}${fmtI(result.totalCost)}`}
              sub={`Тіло: ${s}${fmtI(effectiveAmount)}`}
              color="text-neutral-900 dark:text-neutral-100" />
            <ResultCard emoji="📈" label="Відсотки всього"
              value={`${s}${fmtI(result.totalInterest)}`}
              sub={`Ефективна ставка: ${result.effectiveRate.toFixed(1)}%`}
              color="text-red-400" />
            <ResultCard emoji="📅" label="Фактичний строк"
              value={`${result.actualMonths} міс.`}
              sub={result.actualMonths < params.months ? `Економія ${params.months - result.actualMonths} міс.` : `${(result.actualMonths / 12).toFixed(1)} років`}
              color={result.actualMonths < params.months ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"} />
            {(result.totalFees > 0 || result.totalInsurance > 0) && (
              <ResultCard emoji="💳" label="Комісії + Страховка"
                value={`${s}${fmtI(result.totalFees + result.totalInsurance)}`}
                sub={`Комісії: ${s}${fmtI(result.totalFees)} · Страх.: ${s}${fmtI(result.totalInsurance)}`}
                color="text-amber-500" />
            )}
          </div>

          {/* Структура витрат */}
          <OverpaymentChart result={result} params={calcParams} />

          {/* Графіки */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PaymentChart rows={result.breakdown} currency={params.currency} />
            <BalanceChart rows={result.breakdown} currency={params.currency} />
          </div>

          {/* Рефінансування */}
          <RefiComparison result={result} params={calcParams} />

          {/* Графік платежів */}
          <div>
            <button onClick={() => setShowBreakdown(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-500 transition-colors mb-3">
              <Icon d={showBreakdown ? icons.chevUp : icons.chevDown} className="w-4 h-4" />
              {showBreakdown ? "Сховати графік платежів" : "Показати графік платежів"}
            </button>
            {showBreakdown && <BreakdownTable rows={result.breakdown} currency={params.currency} />}
          </div>

          {/* Порівняння ануїтет vs диференційований */}
          {params.paymentType === "annuity" && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚖️</span>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">А що якщо диференційований?</h3>
              </div>
              {(() => {
                const diffResult = calculate({ ...calcParams, paymentType: "differential" });
                const savings = result.totalInterest - diffResult.totalInterest;
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                      <p className="text-xs text-neutral-500 mb-1">Ануїтетний (поточний)</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{s}{fmtI(result.monthlyPayment)}/міс</p>
                      <p className="text-xs text-red-400">Переплата: {s}{fmtI(result.totalInterest)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <p className="text-xs text-neutral-500 mb-1">Диференційований</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{s}{fmtI(diffResult.monthlyPayment)}/міс → {s}{fmtI(diffResult.monthlyPaymentLast)}</p>
                      <p className="text-xs text-green-500">Економія: {s}{fmtI(savings)}</p>
                    </div>
                  </div>
                );
              })()}
            </Card>
          )}
        </div>

        {/* ── Права: параметри ── */}
        <div className="space-y-4">

          {/* Тип кредиту */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Тип кредиту</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CREDIT_TYPES) as [CreditType, { label: string; emoji: string }][]).map(([key, meta]) => (
                <button key={key} onClick={() => upd("creditType", key)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all ${
                    params.creditType === key
                      ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                  }`}>
                  <span className="text-lg">{meta.emoji}</span>
                  <span className={`text-xs ${params.creditType === key ? "text-orange-500 font-medium" : "text-neutral-500"}`}>{meta.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Авто блок */}
          {params.creditType === "car" && (
            <Card>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">🚗 Деталі авто</p>
              <div className="space-y-3">
                <Field label="Ціна авто">
                  <input type="number" value={params.carPrice || ""} onChange={e => upd("carPrice", +e.target.value)} placeholder="800 000" className={inp} />
                </Field>
                <Field label="Перший внесок">
                  <input type="number" value={params.downPayment || ""} onChange={e => upd("downPayment", +e.target.value)} placeholder="200 000" className={inp} />
                </Field>
                {params.carPrice > 0 && (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                    <p className="text-xs text-orange-500 font-medium">Сума кредиту: {s}{fmtI(effectiveAmount)}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Іпотека блок */}
          {params.creditType === "mortgage" && (
            <Card>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">🏠 Деталі іпотеки</p>
              <div className="space-y-3">
                <Field label="Вартість нерухомості">
                  <input type="number" value={params.propertyPrice || ""} onChange={e => upd("propertyPrice", +e.target.value)} placeholder="2 000 000" className={inp} />
                </Field>
                <Field label="Перший внесок">
                  <input type="number" value={params.mortgageDown || ""} onChange={e => upd("mortgageDown", +e.target.value)} placeholder="400 000" className={inp} />
                </Field>
                {params.propertyPrice > 0 && (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                    <p className="text-xs text-orange-500 font-medium">Сума кредиту: {s}{fmtI(effectiveAmount)}</p>
                    <p className="text-xs text-neutral-400">Внесок: {params.propertyPrice > 0 ? (params.mortgageDown / params.propertyPrice * 100).toFixed(0) : 0}%</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Основні параметри */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Параметри кредиту</p>
            <div className="space-y-4">
              {params.creditType !== "car" && params.creditType !== "mortgage" && (
                <Field label="Сума кредиту">
                  <input type="number" value={params.amount || ""} onChange={e => upd("amount", +e.target.value)} placeholder="200 000" className={inp} />
                </Field>
              )}

              <Field label="Ставка % річних">
                <input type="number" value={params.rate || ""} onChange={e => upd("rate", +e.target.value)} placeholder="24" step="0.1" className={inp} />
              </Field>

              <Field label="Строк (місяці)">
                <input type="number" value={params.months || ""} onChange={e => upd("months", +e.target.value)} placeholder="24" className={inp} />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {presets.filter(p => params.creditType === "mortgage" ? true : p.months <= 60).map(p => (
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

              <Field label="Тип платежу">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "annuity" as PaymentType, label: "Ануїтетний", desc: "Однаковий платіж" },
                    { value: "differential" as PaymentType, label: "Диференційований", desc: "Спадний платіж" },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => upd("paymentType", opt.value)}
                      className={`py-2.5 px-3 rounded-xl border text-left transition-all ${
                        params.paymentType === opt.value
                          ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30"
                          : "border-neutral-200 dark:border-neutral-700"
                      }`}>
                      <p className={`text-xs font-medium ${params.paymentType === opt.value ? "text-orange-500" : "text-neutral-700 dark:text-neutral-300"}`}>{opt.label}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Валюта">
                <div className="flex gap-2">
                  {(["UAH", "USD", "EUR"] as Currency[]).map(c => (
                    <button key={c} onClick={() => upd("currency", c)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        params.currency === c
                          ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                          : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
                      }`}>{c}</button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          {/* Комісії */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">💳 Комісії та страховка</p>
            <div className="space-y-3">
              <Field label="Одноразова комісія %" hint="При видачі кредиту">
                <input type="number" value={params.oneTimeFee || ""} onChange={e => upd("oneTimeFee", +e.target.value)} placeholder="0" step="0.1" className={inp} />
              </Field>
              <Field label="Щомісячна комісія (грн)" hint="Обслуговування рахунку">
                <input type="number" value={params.monthlyFee || ""} onChange={e => upd("monthlyFee", +e.target.value)} placeholder="0" className={inp} />
              </Field>
              <Field label="Страховка (грн / рік)">
                <input type="number" value={params.insuranceYearly || ""} onChange={e => upd("insuranceYearly", +e.target.value)} placeholder="0" className={inp} />
              </Field>
            </div>
          </Card>

          {/* Дострокове погашення */}
          <Card>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">⚡ Дострокове погашення</p>

            {params.earlyPayments.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {params.earlyPayments.map(ep => (
                  <div key={ep.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                    <span className="text-neutral-400">Міс. {ep.month}:</span>
                    <span className="text-green-500 font-medium">{s}{fmtI(ep.amount)}</span>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-400">{ep.strategy === "reduce_term" ? "↓строк" : "↓платіж"}</span>
                    <button onClick={() => upd("earlyPayments", params.earlyPayments.filter(e => e.id !== ep.id))}
                      className="text-neutral-300 hover:text-red-400 ml-auto"><Icon d={icons.close} className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="number" value={newEpMonth} onChange={e => setNewEpMonth(e.target.value)} placeholder="Міс." className={`w-16 ${inp}`} />
                <input type="number" value={newEpAmount} onChange={e => setNewEpAmount(e.target.value)} placeholder="Сума" className={`flex-1 ${inp}`} />
                <button onClick={addEarlyPayment} className="px-3 py-2 rounded-xl bg-orange-400 text-white text-xs font-bold hover:bg-orange-500 transition-colors shrink-0">+</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "reduce_term" as const, label: "Зменшити строк" },
                  { value: "reduce_payment" as const, label: "Зменшити платіж" },
                ]).map(opt => (
                  <button key={opt.value} onClick={() => setNewEpStrategy(opt.value)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      newEpStrategy === opt.value
                        ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
                    }`}>{opt.label}</button>
                ))}
              </div>
            </div>
          </Card>

          {/* Рефінансування */}
          <Card>
            <div className="space-y-4">
              <Toggle on={params.compareRefi} onChange={v => upd("compareRefi", v)}
                label="🔄 Рефінансування" desc="Порівняти з новим кредитом" />
              {params.compareRefi && (
                <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  <Field label="Нова ставка %">
                    <input type="number" value={params.refiRate} onChange={e => upd("refiRate", +e.target.value)} step="0.1" className={inp} />
                  </Field>
                  <Field label="Новий строк (міс.)">
                    <input type="number" value={params.refiMonths} onChange={e => upd("refiMonths", +e.target.value)} className={inp} />
                  </Field>
                  <Field label="Комісія за рефі %">
                    <input type="number" value={params.refiFee} onChange={e => upd("refiFee", +e.target.value)} step="0.1" className={inp} />
                  </Field>
                </div>
              )}
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