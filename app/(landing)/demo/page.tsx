// ФАЙЛ: app/(landing)/demo/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Демо — UBudget",
  description: "Спробуйте UBudget у дії. Інтерактивне демо фінансового трекера для особистого бюджету.",
  openGraph: {
    title: "Демо UBudget",
    description: "Спробуйте UBudget у дії без реєстрації",
    type: "website",
    locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/demo" },
};

export default function DemoPage() {
  return (
    <div className="py-20 text-center max-w-2xl mx-auto space-y-8">

      {/* Заглушка */}
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
          <span className="text-4xl">🚧</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Демо-режим у розробці
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Ми працюємо над інтерактивним демо, щоб ви могли спробувати UBudget без реєстрації. 
          А поки що — зареєструйтесь безкоштовно!
        </p>
      </div>

      {/* Альтернативи */}
      <div className="grid sm:grid-cols-2 gap-4 pt-6">
        <Link
          href="/register"
          className="group p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">🚀</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-neutral-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-orange-500 transition-colors">
            Почати безкоштовно
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Реєстрація займає менше хвилини. Без кредитних карток.
          </p>
        </Link>

        <Link
          href="/free/tools"
          className="group p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">🛠</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-neutral-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-orange-500 transition-colors">
            Безкоштовні інструменти
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Калькулятори кредитів, депозитів, пального — без реєстрації.
          </p>
        </Link>
      </div>

      {/* Що буде в демо */}
      <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-left space-y-4">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          📋 Що буде в інтерактивному демо:
        </p>
        <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          {[
            "Попередньо заповнені рахунки та транзакції",
            "Можливість додавати тестові витрати та доходи",
            "Перегляд бюджету та методу конвертів",
            "Демо Health Score з поясненнями",
            "Скидання до початкового стану одним кліком",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-orange-400 shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="pt-6">
        <Link
          href="/"
          className="text-sm text-orange-500 hover:underline"
        >
          ← Повернутись на головну
        </Link>
      </div>

    </div>
  );
}