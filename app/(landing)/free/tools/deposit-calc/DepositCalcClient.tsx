// ФАЙЛ: app/(landing)/tools/deposit-calc/DepositCalcClient.tsx
"use client";

import { useState, useMemo } from "react";

// ─── Types & Helpers ──────────────────────────────────────────

type Frequency = "monthly" | "quarterly" | "annual" | "end";

interface CalcParams {
  amount: number;
  rate: number;
  months: number;
  frequency: Frequency;
  capitalization: boolean;
  withTax: boolean;
  monthlyTopUp: number;
}

function fmtI(n: number) { return Math.abs(n).toLocaleString("uk-UA", { maximumFractionDigits: 0 }); }

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all tabular-nums";

// ─── Engine ───────────────────────────────────────────────────

function calculate(p: CalcParams) {
  const { amount, rate, months, frequency, capitalization, withTax, monthlyTopUp } = p;
  const TAX = withTax ? 0.195 : 0; // ПДФО 18% + ВЗ 1.5%
  const monthlyRate = rate / 100 / 12;

  let balance = amount;
  let totalInterest = 0;
  let totalTax = 0;

  const freqMonths = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : frequency === "annual" ? 12 : months;
  let accruedInterest = 0;

  const rows: { month: number; balance: number; interest: number; }[] = [];

  for (let m = 1; m <= months; m++) {
    balance += monthlyTopUp;
    const interest = balance * monthlyRate;
    accruedInterest += interest;
    totalInterest += interest;

    // Капіталізація / виплата
    if (m % freqMonths === 0 || m === months) {
      const tax = accruedInterest * TAX;
      totalTax += tax;
      if (capitalization) {
        balance += accruedInterest - tax;
      }
      accruedInterest = 0;
    }

    rows.push({ month: m, balance, interest });
  }

  const netInterest = totalInterest - totalTax;
  const totalTopUps = monthlyTopUp * months;

  return {
    finalBalance: balance,
    totalInterest,
    netInterest,
    totalTax,
    totalTopUps,
    effectiveRate: amount > 0 ? (netInterest / amount) / (months / 12) * 100 : 0,
    rows,
  };
}

// ─── Component ────────────────────────────────────────────────

export default function DepositCalcClient() {
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(16);
  const [months, setMonths] = useState(12);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [capitalization, setCapitalization] = useState(true);
  const [withTax, setWithTax] = useState(true);
  const [monthlyTopUp, setMonthlyTopUp] = useState(0);

  const result = useMemo(() => calculate({ amount, rate, months, frequency, capitalization, withTax, monthlyTopUp }),
    [amount, rate, months, frequency, capitalization, withTax, monthlyTopUp]);

  const presets = [3, 6, 12, 18, 24];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

      {/* Результати */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { emoji: "💰", label: "Сума наприкінці", value: `₴${fmtI(result.finalBalance)}`, color: "text-green-500" },
            { emoji: "📈", label: "Чистий дохід", value: `₴${fmtI(result.netInterest)}`, sub: `після податків`, color: "text-green-500" },
            { emoji: "💸", label: "Нараховано %", value: `₴${fmtI(result.totalInterest)}`, sub: `до податків`, color: "text-orange-500" },
            { emoji: "🏛️", label: "Податки", value: `₴${fmtI(result.totalTax)}`, sub: "ПДФО 18% + ВЗ 1.5%", color: "text-red-400" },
            { emoji: "📊", label: "Ефект. ставка", value: `${result.effectiveRate.toFixed(1)}%`, sub: "чиста після податків", color: "text-neutral-900 dark:text-neutral-100" },
            ...(result.totalTopUps > 0 ? [{ emoji: "➕", label: "Довнесення", value: `₴${fmtI(result.totalTopUps)}`, sub: undefined as string | undefined, color: "text-blue-500" }] : []),
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

        {/* Графік росту */}
        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Ріст депозиту</h3>
          </div>
          {(() => {
            const step = Math.max(1, Math.floor(result.rows.length / 24));
            const sampled = result.rows.filter((_, i) => i % step === 0 || i === result.rows.length - 1);
            const minVal = Math.min(...sampled.map(r => r.balance));
            const maxVal = Math.max(...sampled.map(r => r.balance));
            const range = maxVal - minVal || 1;

            return (
              <div className="flex items-end gap-[2px]" style={{ height: 128 }}>
                {sampled.map((r, i) => {
                  const h = Math.max(((r.balance - minVal) / range) * 100, 4);
                  const barH = Math.max((h / 100) * 128, 4);
                  const isLast = i === sampled.length - 1;
                  return (
                    <div key={r.month} className="flex-1 group relative flex items-end justify-center" style={{ height: 128 }}>
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-neutral-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                          Міс. {r.month}: ₴{fmtI(r.balance)}
                        </div>
                      </div>
                      <div className={`w-full rounded-t-sm transition-all ${isLast ? "bg-orange-400" : "bg-orange-300 dark:bg-orange-600"} hover:bg-orange-500`}
                        style={{ height: barH }} />
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Параметри */}
      <div className="space-y-4">
        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Параметри депозиту</p>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Сума (грн)</label>
            <input type="number" value={amount || ""} onChange={e => setAmount(+e.target.value)} placeholder="100 000" className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Ставка % річних</label>
            <input type="number" value={rate || ""} onChange={e => setRate(+e.target.value)} placeholder="16" step="0.1" className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Строк (місяці)</label>
            <input type="number" value={months || ""} onChange={e => setMonths(+e.target.value)} placeholder="12" className={inp} />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {presets.map(p => (
                <button key={p} onClick={() => setMonths(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${months === p ? "bg-orange-100 dark:bg-orange-950/30 text-orange-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>{p} міс</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Виплата %</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: "monthly" as Frequency, l: "Щомісяця" },
                { v: "quarterly" as Frequency, l: "Щоквартал" },
                { v: "annual" as Frequency, l: "Щороку" },
                { v: "end" as Frequency, l: "В кінці" },
              ]).map(opt => (
                <button key={opt.v} onClick={() => setFrequency(opt.v)}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all ${frequency === opt.v ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{opt.l}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Довнесення/міс (грн)</label>
            <input type="number" value={monthlyTopUp || ""} onChange={e => setMonthlyTopUp(+e.target.value)} placeholder="0" className={inp} />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-3">
          {[
            { on: capitalization, set: setCapitalization, label: "Капіталізація", desc: "Відсотки додаються до тіла" },
            { on: withTax, set: setWithTax, label: "Податки", desc: "ПДФО 18% + ВЗ 1.5%" },
          ].map(t => (
            <div key={t.label} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t.label}</p>
                <p className="text-xs text-neutral-400">{t.desc}</p>
              </div>
              <button onClick={() => t.set(!t.on)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${t.on ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${t.on ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}