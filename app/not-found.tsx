"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MESSAGES = [
  { emoji: "🕵️", title: "Сторінку викрали!", desc: "Схоже хтось витратив її з тижневого конверта..." },
  { emoji: "📊", title: "Бюджет на цю сторінку — 0 грн", desc: "Вона не була запланована. Ні в плані, ні у факті." },
  { emoji: "✉️", title: "Ця сторінка в іншому конверті", desc: "І той конверт вже порожній з вівторка." },
  { emoji: "💸", title: "Сторінка кудись пішла", desc: "Мабуть на каву. Без запису в транзакціях." },
  { emoji: "🏦", title: "Рахунок не знайдено", desc: "Цей актив вже переведено в архів. Або не існував взагалі." },
  { emoji: "📉", title: "P&L цієї сторінки: −100%", desc: "Найгірша інвестиція в портфелі." },
];

export default function NotFound() {
  const [msg, setMsg] = useState(MESSAGES[0]);
  const [coins, setCoins] = useState<{ id: number; x: number; emoji: string; delay: number; duration: number }[]>([]);

  useEffect(() => {
    setMsg(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    setCoins(Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      emoji: ["💸", "🪙", "💰", "📉", "❓"][Math.floor(Math.random() * 5)],
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 3,
    })));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden px-4">

      {/* Falling coins */}
      {coins.map(c => (
        <div key={c.id} className="pointer-events-none absolute top-0 text-2xl opacity-20 animate-bounce"
          style={{
            left: `${c.x}%`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            animation: `fall ${c.duration}s ${c.delay}s infinite linear`,
          }}>
          {c.emoji}
        </div>
      ))}

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-60px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.15; }
          90% { opacity: 0.15; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

      <div className="relative z-10 text-center max-w-md">

        {/* Big 404 */}
        <div className="relative mb-4">
          <p className="text-[120px] sm:text-[160px] font-black leading-none select-none"
            style={{
              background: "linear-gradient(135deg, #f97316, #fbbf24, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 8px 24px rgba(249,115,22,0.25))",
              animation: "float 3s ease-in-out infinite",
            }}>
            404
          </p>
          {/* Emoji overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl sm:text-6xl" style={{ animation: "wiggle 2s ease-in-out infinite" }}>
              {msg.emoji}
            </span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          {msg.title}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mb-8">
          {msg.desc}
        </p>

        {/* Fun stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Сторінок знайдено", value: "0" },
            { label: "Витрачено часу", value: "∞ сек" },
            { label: "Збитки", value: "404 грн" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3">
              <p className="text-lg font-bold text-orange-400">{value}</p>
              <p className="text-xs text-neutral-400 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="px-6 py-3 rounded-2xl bg-orange-400 text-white font-bold text-sm hover:bg-orange-500 active:scale-95 transition-all shadow-lg shadow-orange-200 dark:shadow-none">
            🏠 На дашборд
          </Link>
          <button onClick={() => window.history.back()}
            className="px-6 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all">
            ← Назад
          </button>
        </div>

        {/* Easter egg */}
        <p className="mt-8 text-xs text-neutral-300 dark:text-neutral-700">
          Ця помилка не врахована в бюджеті 🙃
        </p>
      </div>
    </div>
  );
}