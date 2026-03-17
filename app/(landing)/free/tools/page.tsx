// ФАЙЛ: app/(landing)/tools/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Безкоштовні фінансові калькулятори онлайн — кредит, депозит, інфляція | UBudget",
  description: "Безкоштовні фінансові інструменти: кредитний калькулятор, депозитний калькулятор, калькулятор інфляції, калькулятор витрат пального. Без реєстрації.",
  keywords: ["фінансові калькулятори", "кредитний калькулятор", "депозитний калькулятор", "калькулятор інфляції"],
  openGraph: {
    title: "Безкоштовні фінансові калькулятори — UBudget",
    description: "Кредит, депозит, інфляція, паливо — все безкоштовно і без реєстрації.",
    type: "website", locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/tools" },
};

const TOOLS = [
  {
    emoji: "💳",
    title: "Кредитний калькулятор",
    desc: "Ануїтетний та диференційований платіж, дострокове погашення, рефінансування, реальна вартість кредиту.",
    href: "/tools/credit-calc",
    tags: ["кредит", "іпотека", "автокредит"],
  },
  {
    emoji: "🏦",
    title: "Калькулятор депозитів",
    desc: "Складні відсотки, капіталізація, ПДФО + ВЗ, довнесення, порівняння з ОВДП.",
    href: "/tools/deposit-calc",
    tags: ["депозит", "відсотки", "ОВДП"],
  },
  {
    emoji: "🔥",
    title: "Калькулятор інфляції",
    desc: "Як інфляція знецінює гроші. Порівняння: готівка vs депозит vs ОВДП за 1-30 років.",
    href: "/tools/inflation-calc",
    tags: ["інфляція", "заощадження"],
  },
  {
    emoji: "⛽",
    title: "Витрати пального",
    desc: "Розрахунок витрат на паливо: маршрути, тижневий план, подорожі. Карта OpenStreetMap.",
    href: "/tools/fuel-calc",
    tags: ["паливо", "авто", "маршрути"],
  },
];

export default function ToolsIndexPage() {
  return (
    <div className="py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Інструменти</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Безкоштовні фінансові калькулятори
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Всі інструменти працюють без реєстрації. Для повного функціоналу з відстеженням кредитів, 
          депозитів та автоматичним Health Score — зареєструйтесь безкоштовно.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {TOOLS.map(tool => (
          <Link key={tool.href} href={tool.href}
            className="group p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg hover:shadow-orange-50 dark:hover:shadow-none transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{tool.emoji}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-neutral-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-orange-500 transition-colors mb-2">
              {tool.title}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">{tool.desc}</p>
            <div className="flex gap-1.5 flex-wrap">
              {tool.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="p-8 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-center">
        <p className="text-white text-xl font-bold mb-2">Хочете більше?</p>
        <p className="text-neutral-400 text-sm mb-5 max-w-md mx-auto">
          В кабінеті UBudget доступні ще 6 інструментів: Health Score, Shock Tracker, фінансові сценарії, 
          фінансова історія та інші — підключені до ваших реальних даних.
        </p>
        <a href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors text-sm">
          Зареєструватись безкоштовно →
        </a>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Безкоштовні фінансові калькулятори",
        "description": "Кредитний, депозитний, калькулятор інфляції та витрат пального — безкоштовно, без реєстрації.",
        "hasPart": TOOLS.map(t => ({
          "@type": "WebApplication",
          "name": t.title,
          "description": t.desc,
          "url": `https://ubudget.app${t.href}`,
          "applicationCategory": "FinanceApplication",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "UAH" },
        })),
      })}} />
    </div>
  );
}