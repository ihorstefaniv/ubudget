"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FALLBACK_RATES } from "@/lib/nbu-rates";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateRow {
  currency: string;
  rate: number;
  date: string;
}

interface DayRates {
  date: string;
  [currency: string]: number | string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "EUR", "PLN", "GBP", "CHF"];

const CURRENCY_META: Record<string, { flag: string; name: string }> = {
  USD: { flag: "🇺🇸", name: "Долар США" },
  EUR: { flag: "🇪🇺", name: "Євро" },
  PLN: { flag: "🇵🇱", name: "Польський злотий" },
  GBP: { flag: "🇬🇧", name: "Фунт стерлінгів" },
  CHF: { flag: "🇨🇭", name: "Швейцарський франк" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

function fmtRate(val: number | string | undefined): string {
  if (val === undefined || val === null || val === "") return "—";
  return Number(val).toFixed(2);
}

function pivot(rows: RateRow[]): DayRates[] {
  const map = new Map<string, DayRates>();
  rows.forEach((r) => {
    if (!map.has(r.date)) map.set(r.date, { date: r.date });
    map.get(r.date)![r.currency] = r.rate;
  });
  return Array.from(map.values()).sort((a, b) =>
    (b.date as string).localeCompare(a.date as string)
  );
}

function changePct(current: number | string | undefined, prev: number | string | undefined): number | null {
  if (!current || !prev) return null;
  return ((Number(current) - Number(prev)) / Number(prev)) * 100;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExchangeRatesPage() {
  const [rows, setRows]       = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource]   = useState<"cache" | "live" | null>(null);
  const [lastDate, setLastDate] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Поточний курс через API (кеш або live)
      try {
        const res = await fetch("/api/nbu-rates");
        if (res.ok) {
          const data = await res.json();
          setSource(data.source);
          setLastDate(data.date);
        }
      } catch { /* ігноруємо */ }

      // Історія за 30 днів з БД
      const supabase = createClient();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      const fromStr = from.toISOString().split("T")[0];

      const { data } = await supabase
        .from("exchange_rates")
        .select("currency, rate, date")
        .gte("date", fromStr)
        .order("date", { ascending: false });

      setRows(data ?? []);
      setLoading(false);
    }

    load();
  }, []);

  const history = pivot(rows);
  const today   = history[0];
  const prev    = history[1];

  // Поточні курси: беремо з БД або fallback
  const currentRates: Record<string, number> = { ...FALLBACK_RATES };
  if (today) {
    CURRENCIES.forEach((c) => {
      if (typeof today[c] === "number") currentRates[c] = today[c] as number;
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Курси валют НБУ</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Оновлюється щодня о 9:00 (Київ) · офіційний курс НБУ
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {source && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              source === "cache"
                ? "bg-green-50 text-green-600"
                : "bg-blue-50 text-blue-600"
            }`}>
              {source === "cache" ? "з кешу" : "live НБУ"}
            </span>
          )}
          {lastDate && (
            <span className="text-xs text-neutral-400">
              актуально на {fmtDate(lastDate)}.{lastDate.split("-")[0]}
            </span>
          )}
        </div>
      </div>

      {/* Current rate cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CURRENCIES.map((cur) => {
          const rate    = currentRates[cur];
          const meta    = CURRENCY_META[cur];
          const pct     = changePct(today?.[cur], prev?.[cur]);
          const up      = pct !== null && pct > 0;
          const down    = pct !== null && pct < 0;

          return (
            <div key={cur} className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{meta?.flag}</span>
                <span className="text-sm font-semibold text-neutral-700">{cur}</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {rate ? rate.toFixed(2) : "—"}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">₴ за 1 {cur}</p>
              {pct !== null && (
                <p className={`text-xs mt-2 font-medium ${
                  up ? "text-red-500" : down ? "text-green-500" : "text-neutral-400"
                }`}>
                  {up ? "▲" : down ? "▼" : "—"} {Math.abs(pct).toFixed(2)}%
                </p>
              )}
              {pct === null && <p className="text-xs mt-2 text-neutral-300">зміна н/д</p>}
            </div>
          );
        })}
      </div>

      {/* History table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900 text-sm">Динаміка за 30 днів</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            Дані ще не збираються — cron запуститься сьогодні о 9:00
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 w-24">Дата</th>
                  {CURRENCIES.map((c) => (
                    <th key={c} className="text-right px-4 py-3 text-xs font-semibold text-neutral-500">
                      {CURRENCY_META[c]?.flag} {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((day, idx) => {
                  const nextDay = history[idx + 1];
                  return (
                    <tr
                      key={day.date as string}
                      className={`border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${
                        idx === 0 ? "font-medium" : ""
                      }`}
                    >
                      <td className="px-5 py-3 text-neutral-600">
                        {fmtDate(day.date as string)}
                        {idx === 0 && (
                          <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">
                            сьогодні
                          </span>
                        )}
                      </td>
                      {CURRENCIES.map((c) => {
                        const val  = day[c];
                        const prev = nextDay?.[c];
                        const pct  = changePct(val, prev);
                        const up   = pct !== null && pct > 0.01;
                        const down = pct !== null && pct < -0.01;
                        return (
                          <td key={c} className="px-4 py-3 text-right tabular-nums">
                            <span className={
                              idx === 0
                                ? "text-neutral-900 font-semibold"
                                : "text-neutral-600"
                            }>
                              {fmtRate(val)}
                            </span>
                            {pct !== null && idx !== 0 && (
                              <span className={`ml-1.5 text-[10px] ${
                                up ? "text-red-400" : down ? "text-green-400" : "text-neutral-300"
                              }`}>
                                {up ? "▲" : down ? "▼" : ""}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
