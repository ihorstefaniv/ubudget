// ФАЙЛ: app/(landing)/tools/inflation-calc/InflationCalcClient.tsx
"use client";

import { useState, useMemo } from "react";

function fmtI(n: number) { return Math.abs(n).toLocaleString("uk-UA", { maximumFractionDigits: 0 }); }

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all tabular-nums";

export default function InflationCalcClient() {
  const [amount, setAmount] = useState(100000);
  const [inflation, setInflation] = useState(10);
  const [years, setYears] = useState(10);
  const [depositRate, setDepositRate] = useState(16);
  const [ovdpRate, setOvdpRate] = useState(19);

  const data = useMemo(() => {
    const rows: { year: number; mattress: number; deposit: number; ovdp: number; prices: number }[] = [];
    const TAX = 0.195;

    let mattress = amount;
    let deposit = amount;
    let ovdp = amount;

    for (let y = 1; y <= years; y++) {
      const inflMult = 1 + inflation / 100;

      // Під подушкою — не росте, але інфляція з'їдає
      const mattressReal = amount / Math.pow(inflMult, y);

      // Депозит — з капіталізацією після податків
      deposit = deposit * (1 + (depositRate / 100) * (1 - TAX));
      const depositReal = deposit / Math.pow(inflMult, y);

      // ОВДП — простий відсоток після податків
      ovdp = amount + amount * (ovdpRate / 100) * (1 - TAX) * y;
      const ovdpReal = ovdp / Math.pow(inflMult, y);

      // Ціни — скільки потрібно щоб купити те ж саме
      const pricesMult = Math.pow(inflMult, y);

      rows.push({
        year: y,
        mattress: mattressReal,
        deposit: depositReal,
        ovdp: ovdpReal,
        prices: amount * pricesMult,
      });
    }

    return rows;
  }, [amount, inflation, years, depositRate, ovdpRate]);

  const last = data[data.length - 1];
  const mattressLoss = amount - (last?.mattress ?? 0);
  const mattressLossPct = amount > 0 ? (mattressLoss / amount) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

      {/* Результати */}
      <div className="space-y-5">

        {/* Картки */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">🛏️</span>
              <p className="text-xs text-neutral-400">Під подушкою</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-red-500">₴{fmtI(last?.mattress ?? 0)}</p>
            <p className="text-xs text-red-400">−{mattressLossPct.toFixed(0)}% купівельна сила</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">🏦</span>
              <p className="text-xs text-neutral-400">На депозиті</p>
            </div>
            <p className={`text-lg font-bold tabular-nums ${(last?.deposit ?? 0) >= amount ? "text-green-500" : "text-amber-500"}`}>
              ₴{fmtI(last?.deposit ?? 0)}
            </p>
            <p className="text-xs text-neutral-400">реальна вартість</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">🇺🇦</span>
              <p className="text-xs text-neutral-400">ОВДП</p>
            </div>
            <p className={`text-lg font-bold tabular-nums ${(last?.ovdp ?? 0) >= amount ? "text-green-500" : "text-amber-500"}`}>
              ₴{fmtI(last?.ovdp ?? 0)}
            </p>
            <p className="text-xs text-neutral-400">реальна вартість</p>
          </div>
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">🔥</span>
              <p className="text-xs text-red-400">Інфляція з'їсть</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-red-500">₴{fmtI(mattressLoss)}</p>
            <p className="text-xs text-red-400">якщо просто тримати готівкою</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">📈</span>
              <p className="text-xs text-neutral-400">Ціни виростуть до</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">₴{fmtI(last?.prices ?? 0)}</p>
            <p className="text-xs text-neutral-400">щоб купити те ж саме</p>
          </div>
        </div>

        {/* Графік */}
        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📉</span>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Реальна вартість ₴{fmtI(amount)} з часом</h3>
          </div>

          <div className="relative" style={{ height: 180 }}>
            <svg viewBox={`0 0 100 180`} preserveAspectRatio="none" className="w-full h-full">
              {/* Лінія вихідної суми */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeDasharray="2,2" className="text-neutral-200 dark:text-neutral-700" strokeWidth="0.3" />

              {/* Матрац */}
              <polyline points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 20 + (1 - d.mattress / amount) * 140;
                return `${x},${y}`;
              }).join(" ")} fill="none" stroke="#ef4444" strokeWidth="1" />

              {/* Депозит */}
              <polyline points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const maxVal = Math.max(amount * 1.5, ...data.map(r => Math.max(r.deposit, r.ovdp)));
                const y = 20 + (1 - d.deposit / maxVal) * 140;
                return `${x},${Math.max(5, Math.min(175, y))}`;
              }).join(" ")} fill="none" stroke="#22c55e" strokeWidth="1" />

              {/* ОВДП */}
              <polyline points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const maxVal = Math.max(amount * 1.5, ...data.map(r => Math.max(r.deposit, r.ovdp)));
                const y = 20 + (1 - d.ovdp / maxVal) * 140;
                return `${x},${Math.max(5, Math.min(175, y))}`;
              }).join(" ")} fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,2" />
            </svg>
          </div>

          <div className="flex justify-between mt-2 text-xs text-neutral-400">
            <span>Рік 1</span>
            <span>Рік {years}</span>
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-red-400 rounded" />
              <span className="text-xs text-neutral-400">Готівка</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-green-500 rounded" />
              <span className="text-xs text-neutral-400">Депозит</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-500 rounded" />
              <span className="text-xs text-neutral-400">ОВДП</span>
            </div>
          </div>
        </div>

        {/* Таблиця */}
        <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  {["Рік", "🛏️ Готівка", "🏦 Депозит", "🇺🇦 ОВДП", "📈 Ціни"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-neutral-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                {data.filter((_, i) => i === 0 || (i + 1) % (years <= 10 ? 1 : years <= 20 ? 2 : 5) === 0 || i === data.length - 1).map(d => (
                  <tr key={d.year} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                    <td className="px-4 py-2 text-neutral-500">{d.year}</td>
                    <td className="px-4 py-2 tabular-nums text-red-400">₴{fmtI(d.mattress)}</td>
                    <td className={`px-4 py-2 tabular-nums ${d.deposit >= amount ? "text-green-500" : "text-amber-500"}`}>₴{fmtI(d.deposit)}</td>
                    <td className={`px-4 py-2 tabular-nums ${d.ovdp >= amount ? "text-green-500" : "text-amber-500"}`}>₴{fmtI(d.ovdp)}</td>
                    <td className="px-4 py-2 tabular-nums text-neutral-700 dark:text-neutral-300">₴{fmtI(d.prices)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Параметри */}
      <div className="space-y-4">
        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Параметри</p>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Сума (грн)</label>
            <input type="number" value={amount || ""} onChange={e => setAmount(+e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Інфляція % на рік</label>
            <input type="number" value={inflation || ""} onChange={e => setInflation(+e.target.value)} step="0.5" className={inp} />
            <div className="flex gap-1.5 mt-2">
              {[5, 8, 10, 15, 20].map(p => (
                <button key={p} onClick={() => setInflation(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${inflation === p ? "bg-orange-100 text-orange-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>{p}%</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Горизонт (років)</label>
            <input type="number" value={years || ""} onChange={e => setYears(Math.min(30, +e.target.value))} className={inp} />
            <div className="flex gap-1.5 mt-2">
              {[3, 5, 10, 15, 20, 30].map(p => (
                <button key={p} onClick={() => setYears(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${years === p ? "bg-orange-100 text-orange-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>{p}р</button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Порівняння</p>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Ставка депозиту %</label>
            <input type="number" value={depositRate || ""} onChange={e => setDepositRate(+e.target.value)} step="0.5" className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Ставка ОВДП %</label>
            <input type="number" value={ovdpRate || ""} onChange={e => setOvdpRate(+e.target.value)} step="0.5" className={inp} />
          </div>
          <p className="text-xs text-neutral-400">Після ПДФО 18% + ВЗ 1.5%</p>
        </div>
      </div>
    </div>
  );
}