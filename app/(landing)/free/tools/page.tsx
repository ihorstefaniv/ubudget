// ФАЙЛ: app/(app)/tools/page.tsx
// URL: /tools — Каталог інструментів кабінету
"use client";

import Link from "next/link";

const TOOLS = [
  {
    href: "/tools/fuel-prices",
    emoji: "⛽",
    title: "Ціни на пальне",
    desc: "Актуальні ціни на АЗС України: А-95, А-92, дизель, газ. Динаміка та порівняння мереж.",
    tags: ["паливо", "АЗС", "ціни"],
    badge: "new",
    color: "from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10",
    borderColor: "border-orange-200 dark:border-orange-800/40",
  },
  {
    href: "/tools/health",
    emoji: "❤️",
    title: "Health Score",
    desc: "Детальна оцінка фінансового здоров'я від 0 до 100 з розбивкою по факторах та рекомендаціями.",
    tags: ["аналітика", "скор", "рекомендації"],
    color: "from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-900/10",
    borderColor: "border-red-200 dark:border-red-800/40",
  },
  {
    href: "/tools/deposit-calc",
    emoji: "💰",
    title: "Калькулятор депозитів",
    desc: "Складні відсотки, капіталізація, ПДФО 18% + ВЗ 1.5%, довнесення, порівняння з ОВДП.",
    tags: ["депозит", "відсотки", "ОВДП"],
    color: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-900/10",
    borderColor: "border-green-200 dark:border-green-800/40",
  },
  {
    href: "/tools/credit-calc",
    emoji: "📊",
    title: "Калькулятор кредитів",
    desc: "Ануїтет, диференційований, дострокове погашення, рефінансування, реальна вартість.",
    tags: ["кредит", "іпотека", "переплата"],
    color: "from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-900/10",
    borderColor: "border-blue-200 dark:border-blue-800/40",
  },
  {
    href: "/tools/fuel-calc",
    emoji: "🗺",
    title: "Витрати пального",
    desc: "Маршрути на карті OpenStreetMap, тижневий план поїздок, вартість подорожей.",
    tags: ["паливо", "маршрути", "авто"],
    color: "from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-900/10",
    borderColor: "border-amber-200 dark:border-amber-800/40",
  },
  {
    href: "/tools/scenarios",
    emoji: "🔮",
    title: "Сценарії",
    desc: "Моделювання фінансових змін: втрата роботи, підвищення, кредит, переїзд і ін.",
    tags: ["планування", "прогноз", "що якщо"],
    color: "from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-900/10",
    borderColor: "border-purple-200 dark:border-purple-800/40",
  },
  {
    href: "/tools/history",
    emoji: "📜",
    title: "Фінансова історія",
    desc: "Доходи, витрати та заощадження по місяцях. Кращий і гірший місяць, тренди.",
    tags: ["статистика", "місяці", "тренди"],
    color: "from-neutral-50 to-slate-50 dark:from-neutral-900/50 dark:to-slate-900/10",
    borderColor: "border-neutral-200 dark:border-neutral-700",
  },
  {
    href: "/tools/shock",
    emoji: "🚨",
    title: "Shock Tracker",
    desc: "Відстеження непередбачених витрат: здоров'я, авто, житло. Прогрес покриття збитків.",
    tags: ["шоки", "витрати", "трекер"],
    color: "from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-900/10",
    borderColor: "border-red-200 dark:border-red-800/40",
  },
  {
    href: "/tools/crisis",
    emoji: "🛑",
    title: "Режим КРИЗА",
    desc: "Кризовий план, захисний бюджет, стрес-тести. Підготовка до непередбачених ситуацій.",
    tags: ["криза", "план", "захист"],
    badge: "soon",
    color: "from-neutral-50 to-zinc-50 dark:from-neutral-900/50 dark:to-zinc-900/10",
    borderColor: "border-neutral-200 dark:border-neutral-700",
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">🧰 Інструменти</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Фінансові калькулятори та аналітика підключені до ваших даних
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className={`group relative p-5 rounded-2xl border bg-gradient-to-br ${tool.color} ${tool.borderColor} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
          >
            {/* Badge */}
            {tool.badge && (
              <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                tool.badge === "new"
                  ? "bg-orange-100 dark:bg-orange-950/40 text-orange-500"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
              }`}>
                {tool.badge}
              </span>
            )}

            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{tool.emoji}</span>
            </div>

            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1.5 group-hover:text-orange-500 transition-colors">
              {tool.title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">{tool.desc}</p>

            <div className="flex gap-1.5 flex-wrap">
              {tool.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 dark:bg-neutral-900/40 text-neutral-400 border border-white/80 dark:border-neutral-700/50">
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Публічні інструменти */}
      <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🌐</span>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Публічні інструменти</p>
          <span className="text-xs text-neutral-400">без реєстрації</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/free/tools/fuel-prices",    label: "⛽ Ціни на пальне" },
            { href: "/free/tools/fuel-free-calc",  label: "🗺 Калькулятор пального" },
            { href: "/free/tools/deposit-calc",    label: "💰 Депозитний калькулятор" },
            { href: "/free/tools/credit-calc",     label: "📊 Кредитний калькулятор" },
            { href: "/free/tools/inflation-calc",  label: "🔥 Калькулятор інфляції" },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-400 hover:border-orange-300 hover:text-orange-500 transition-all">
              {t.label}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 opacity-40">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}