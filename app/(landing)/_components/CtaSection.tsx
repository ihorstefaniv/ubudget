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

export default function CtaSection() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session?.user);
    });
  }, []);

  // Авторизований — не показуємо CTA взагалі
  if (mounted && isAuthed) return null;

  return (
    <section aria-label="Заклик до дії">
      <div className="relative rounded-3xl bg-neutral-900 dark:bg-neutral-800 border border-neutral-800 dark:border-neutral-700 text-white overflow-hidden px-6 sm:px-12 py-16 text-center">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative space-y-6 max-w-lg mx-auto">
          <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest">Починай сьогодні</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Готовий взяти фінанси<br />під контроль?
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Реєстрація займає менше хвилини. Безкоштовно. Без кредитної картки. Без підписки.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-400">
            {["Безкоштовний старт", "Без реклами", "Дані тільки ваші"].map(item => (
              <li key={item} className="flex items-center gap-1.5">
                <Check cls="w-3.5 h-3.5 text-orange-400" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 active:scale-95 transition-all shadow-xl shadow-orange-900/30 text-sm sm:text-base">
            Зареєструватись безкоштовно
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}