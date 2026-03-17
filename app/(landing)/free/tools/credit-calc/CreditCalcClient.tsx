// ФАЙЛ: app/(landing)/tools/credit-calc/CreditCalcClient.tsx
"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────

type PaymentType = "annuity" | "differential";

interface CalcParams {
  amount: number;
  rate: number;
  months: number;
  paymentType: PaymentType;
  oneTimeFee: number;
  monthlyFee: number;
}

interface MonthRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface CalcResult {
  monthlyPayment: number;
  monthlyPaymentLast: number;
  totalPayments: number;
  totalInterest: number;
  totalFees: number;
  totalCost: number;
  overpayment: number;
  overpaymentPct: number;
  effectiveRate: number;
  breakdown: MonthRow[];
}

// ─── Engine ───────────────────────────────────────────────────

function calculate(p: CalcParams): CalcResult {
  const { amount, rate, months, paymentType, oneTimeFee, monthlyFee } = p;
  const monthlyRate = rate / 100 / 12;
  const oneTimeFeeAmount = amount * (oneTimeFee / 100);

  const annuityPayment = monthlyRate > 0
    ? amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : amount / months;

  const rows: MonthRow[] = [];
  let balance = amount;
  let cumInterest = 0;
  let totalFees = oneTimeFeeAmount;
  let totalPayments = 0;

  for (let m = 1; m <= months && balance > 0.01; m++) {
    const interest = balance * monthlyRate;
    let principal: number, payment: number;

    if (paymentType === "annuity") {
      payment = Math.min(annuityPayment, balance + interest);
      principal = payment - interest;
    } else {
      principal = amount / months;
      if (principal > balance) principal = balance;
      payment = principal + interest;
    }

    if (principal > balance) { principal = balance; payment = principal + interest; }
    balance -= principal;
    cumInterest += interest;
    totalFees += monthlyFee;
    totalPayments += payment + monthlyFee;

    rows.push({ month: m, payment, principal, interest, balance: Math.max(0, balance) });
  }

  const totalCost = totalPayments + oneTimeFeeAmount;
  const overpayment = totalCost - amount;
  const effectiveRate = amount > 0 && rows.length > 0
    ? (cumInterest + totalFees) / amount / (rows.length / 12) * 100 : 0;

  return {
    monthlyPayment: rows[0]?.payment ?? 0,
    monthlyPaymentLast: rows[rows.length - 1]?.payment ?? 0,
    totalPayments,
    totalInterest: cumInterest,
    totalFees,
    totalCost,
    overpayment,
    overpaymentPct: amount > 0 ? (overpayment / amount) * 100 : 0,
    effectiveRate,
    breakdown: rows,
  };
}

// ─── Helpers ──────────────────────────────────────────────────

function fmtN(n: number) { return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtI(n: number) { return Math.abs(n).toLocaleString("uk-UA", { maximumFractionDigits: 0 }); }

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all tabular-nums";

// ─── Component ────────────────────────────────────────────────

export default function CreditCalcClient() {
  const [amount, setAmount] = useState(200000);
  const [rate, setRate] = useState(24);
  const [months, setMonths] = useState(24);
  const [paymentType, setPaymentType] = useState<PaymentType>("annuity");
  const [oneTimeFee, setOneTimeFee] = useState(0);
  const [monthlyFee, setMonthlyFee] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const result = useMemo(() => calculate({ amount, rate, months, paymentType, oneTimeFee, monthlyFee }), [amount, rate, months, paymentType, oneTimeFee, monthlyFee]);

  const presets = [6, 12, 24, 36, 60];

  // Порівняння ануїтет vs диференційований
  const diffResult = useMemo(() => {
    if (paymentType !== "annuity") return null;
    return calculate({ amount, rate, months, paymentType: "differential", oneTimeFee, monthlyFee });
  }, [amount, rate, months, paymentType, oneTimeFee, monthlyFee]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

      {/* ── Результати ── */}
      <div className="space-y-5">

        {/* Картки */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { emoji: "💰", label: "Щомісячний платіж", value: `₴${fmtI(result.monthlyPayment)}`, sub: paymentType === "differential" ? `останній: ₴${fmtI(result.monthlyPaymentLast)}` : undefined, color: "text-orange-500" },
            { emoji: "💸", label: "Переплата", value: `₴${fmtI(result.overpayment)}`, sub: `${result.overpaymentPct.toFixed(1)}% від суми`, color: "text-red-500" },
            { emoji: "🏦", label: "Загальна вартість", value: `₴${fmtI(result.totalCost)}`, sub: `Тіло: ₴${fmtI(amount)}`, color: "text-neutral-900 dark:text-neutral-100" },
            { emoji: "📈", label: "Відсотки", value: `₴${fmtI(result.totalInterest)}`, sub: `Ефект. ставка: ${result.effectiveRate.toFixed(1)}%`, color: "text-red-400" },
            { emoji: "📅", label: "Строк", value: `${months} міс.`, sub: `${(months / 12).toFixed(1)} років`, color: "text-neutral-900 dark:text-neutral-100" },
            ...(result.totalFees > 0 ? [{ emoji: "💳", label: "Комісії", value: `₴${fmtI(result.totalFees)}`, sub: undefined as string | undefined, color: "text-amber-500" }] : []),
          ].map(c => (
            <div key={c.label} className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{c.emoji}</span>
                <p className="text-xs text-neutral-400">{c.label}</p>
              </div>
              <p className={`text-lg font-bold tabular-nums ${c.color}`}>{c.value}</p>
              {c.sub && <p className="text-xs text-neutral-400 mt-0.5">{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* Структура витрат */}
        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🧩</span>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Структура витрат</h3>
          </div>
          {(() => {
            const parts = [
              { label: "Тіло кредиту", amount: amount, color: "bg-blue-400" },
              { label: "Відсотки", amount: result.totalInterest, color: "bg-red-400" },
              ...(result.totalFees > 0 ? [{ label: "Комісії", amount: result.totalFees, color: "bg-amber-400" }] : []),
            ];
            const total = parts.reduce((s, p) => s + p.amount, 0);
            return (
              <>
                <div className="flex h-6 rounded-full overflow-hidden gap-0.5 mb-4">
                  {parts.map(p => (
                    <div key={p.label} className={`${p.color}`} style={{ width: `${(p.amount / total) * 100}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {parts.map(p => (
                    <div key={p.label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${p.color} shrink-0`} />
                      <div>
                        <p className="text-xs text-neutral-500">{p.label}</p>
                        <p className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">₴{fmtI(p.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* Графіки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Структура платежів */}
          <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📊</span>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Тіло vs Відсотки</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4">По місяцях</p>
            {(() => {
              const step = Math.max(1, Math.floor(result.breakdown.length / 24));
              const sampled = result.breakdown.filter((_, i) => i % step === 0 || i === result.breakdown.length - 1);
              const maxP = Math.max(...sampled.map(r => r.payment), 1);
              return (
                <div className="flex items-end gap-[2px]" style={{ height: 100 }}>
                  {sampled.map((r, i) => {
                    const totalH = (r.payment / maxP) * 100;
                    const intH = (r.interest / r.payment) * totalH;
                    const prinH = totalH - intH;
                    return (
                      <div key={r.month} className="flex-1 group relative flex flex-col items-stretch justify-end" style={{ height: 100 }}>
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-neutral-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                            <p className="font-semibold">Міс. {r.month}</p>
                            <p>Тіло: ₴{fmtI(r.principal)} · %: ₴{fmtI(r.interest)}</p>
                          </div>
                        </div>
                        <div className="w-full rounded-t-sm bg-blue-400 hover:opacity-80" style={{ height: Math.max(prinH, 1) }} />
                        <div className="w-full bg-red-300 hover:opacity-80" style={{ height: Math.max(intH, 1) }} />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Залишок боргу */}
          <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📉</span>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Залишок боргу</h3>
            </div>
            {(() => {
              const step = Math.max(1, Math.floor(result.breakdown.length / 24));
              const sampled = result.breakdown.filter((_, i) => i % step === 0 || i === result.breakdown.length - 1);
              const maxB = amount;
              return (
                <div className="flex items-end gap-[2px]" style={{ height: 100 }}>
                  {sampled.map((r) => {
                    const barH = Math.max((r.balance / maxB) * 100, 1);
                    return (
                      <div key={r.month} className="flex-1 group relative flex items-end" style={{ height: 100 }}>
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-neutral-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                            Міс. {r.month}: ₴{fmtI(r.balance)}
                          </div>
                        </div>
                        <div className="w-full rounded-t-sm bg-orange-300 dark:bg-orange-600 hover:bg-orange-500" style={{ height: barH }} />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Порівняння */}
        {diffResult && (
          <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚖️</span>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Ануїтетний vs Диференційований</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                <p className="text-xs text-neutral-500 mb-1">Ануїтетний (обрано)</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">₴{fmtI(result.monthlyPayment)}/міс</p>
                <p className="text-xs text-red-400">Переплата: ₴{fmtI(result.totalInterest)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <p className="text-xs text-neutral-500 mb-1">Диференційований</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">₴{fmtI(diffResult.monthlyPayment)} → ₴{fmtI(diffResult.monthlyPaymentLast)}/міс</p>
                <p className="text-xs text-green-500">Економія: ₴{fmtI(result.totalInterest - diffResult.totalInterest)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Графік платежів */}
        <div>
          <button onClick={() => setShowBreakdown(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-500 transition-colors mb-3">
            {showBreakdown ? "▲ Сховати графік платежів" : "▼ Показати графік платежів"}
          </button>
          {showBreakdown && (
            <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      {["#", "Платіж", "Тіло", "Відсотки", "Залишок"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-neutral-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                    {result.breakdown.slice(0, showBreakdown ? undefined : 6).map(r => (
                      <tr key={r.month} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                        <td className="px-4 py-2 text-neutral-500 tabular-nums">{r.month}</td>
                        <td className="px-4 py-2 tabular-nums font-medium text-neutral-900 dark:text-neutral-100">₴{fmtN(r.payment)}</td>
                        <td className="px-4 py-2 tabular-nums text-blue-500">₴{fmtN(r.principal)}</td>
                        <td className="px-4 py-2 tabular-nums text-red-400">₴{fmtN(r.interest)}</td>
                        <td className="px-4 py-2 tabular-nums text-neutral-700 dark:text-neutral-300">₴{fmtN(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Параметри ── */}
      <div className="space-y-4">
        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Параметри кредиту</p>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Сума кредиту (грн)</label>
            <input type="number" value={amount || ""} onChange={e => setAmount(+e.target.value)} placeholder="200 000" className={inp} />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Ставка % річних</label>
            <input type="number" value={rate || ""} onChange={e => setRate(+e.target.value)} placeholder="24" step="0.1" className={inp} />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Строк (місяці)</label>
            <input type="number" value={months || ""} onChange={e => setMonths(+e.target.value)} placeholder="24" className={inp} />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {presets.map(p => (
                <button key={p} onClick={() => setMonths(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    months === p
                      ? "bg-orange-100 dark:bg-orange-950/30 text-orange-500"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-orange-400"
                  }`}>{p} міс</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Тип платежу</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: "annuity" as PaymentType, l: "Ануїтетний" },
                { v: "differential" as PaymentType, l: "Диференційований" },
              ]).map(opt => (
                <button key={opt.v} onClick={() => setPaymentType(opt.v)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                    paymentType === opt.v
                      ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
                  }`}>{opt.l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Комісії */}
        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-3">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Комісії (опційно)</p>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Одноразова комісія %</label>
            <input type="number" value={oneTimeFee || ""} onChange={e => setOneTimeFee(+e.target.value)} placeholder="0" step="0.1" className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Щомісячна комісія (грн)</label>
            <input type="number" value={monthlyFee || ""} onChange={e => setMonthlyFee(+e.target.value)} placeholder="0" className={inp} />
          </div>
        </div>
      </div>
    </div>
  );
}