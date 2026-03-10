"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function Check({ cls = "w-3.5 h-3.5" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={cls}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function HeroSection() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session?.user);
    });
  }, []);

  return (
    <section className="pt-12 sm:pt-20 text-center max-w-3xl mx-auto space-y-7">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/50 text-orange-500 dark:text-orange-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        Зараз у бета-тестуванні · Безкоштовно
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-neutral-900 dark:text-neutral-100">
        Особистий бюджет{" "}
        <span className="relative inline-block text-orange-400">
          під контролем
          <svg viewBox="0 0 260 14" className="absolute -bottom-1 left-0 w-full" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 10 Q65 3 130 10 Q195 17 258 10" stroke="#fb923c" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
          </svg>
        </span>
        {" "}— нарешті.
      </h1>

      <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto">
        UBudget — простий трекер для особистого бюджету. Рахунки, бюджет по категоріях, метод конвертів, кредити, депозити та Health Score — все в одному місці. Без реклами.
      </p>

      {/* Кнопки — ховаємо якщо авторизований */}
      {mounted && !isAuthed && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register"
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 active:scale-95 transition-all shadow-lg shadow-orange-100 dark:shadow-orange-950/40 text-sm sm:text-base w-full sm:w-auto justify-center">
            Почати безкоштовно
            <span className="group-hover:translate-x-1 transition-transform"><Arrow /></span>
          </Link>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-500 dark:hover:text-orange-400 transition-all text-sm sm:text-base w-full sm:w-auto justify-center">
            Вже маю акаунт
          </Link>
        </div>
      )}

      {/* Якщо авторизований — кнопка до кабінету */}
      {mounted && isAuthed && (
        <div className="flex justify-center">
          <Link href="/dashboard"
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 active:scale-95 transition-all shadow-lg shadow-orange-100 dark:shadow-orange-950/40 text-sm sm:text-base">
            Перейти до кабінету
            <span className="group-hover:translate-x-1 transition-transform"><Arrow /></span>
          </Link>
        </div>
      )}

      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-400 dark:text-neutral-500">
        {["Безкоштовно назавжди", "Без реклами", "Без підписки", "Темна тема"].map(item => (
          <li key={item} className="flex items-center gap-1.5">
            <Check cls="w-3.5 h-3.5 text-orange-400" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}