import Link from "next/link";

const FREE_TOOLS = [
  {
    href: "/free/tools/credit-calc",
    emoji: "📊",
    title: "Кредитний калькулятор",
    desc: "Ануїтет, диференційований, дострокове погашення, рефінансування. Повна таблиця платежів і реальна переплата.",
    tags: ["кредит", "іпотека", "переплата"],
    color: "from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-900/10",
    border: "border-blue-200 dark:border-blue-800/40",
  },
  {
    href: "/free/tools/deposit-calc",
    emoji: "💰",
    title: "Депозитний калькулятор",
    desc: "Складні відсотки, капіталізація, ПДФО 18% + ВЗ 1.5%, довнесення та порівняння з ОВДП.",
    tags: ["депозит", "відсотки", "ОВДП"],
    color: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-900/10",
    border: "border-green-200 dark:border-green-800/40",
  },
  {
    href: "/free/tools/fuel-prices",
    emoji: "⛽",
    title: "Ціни на пальне",
    desc: "Актуальні ціни на АЗС України: А-95, А-92, дизель, газ. Динаміка та порівняння мереж.",
    tags: ["паливо", "АЗС", "ціни"],
    badge: "live",
    color: "from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-900/10",
    border: "border-orange-200 dark:border-orange-800/40",
  },
  {
    href: "/free/tools/fuel-free-calc",
    emoji: "🗺",
    title: "Витрати пального",
    desc: "Маршрути на карті OpenStreetMap, тижневий план поїздок, вартість подорожей за маршрутом.",
    tags: ["пальне", "маршрути", "авто"],
    color: "from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-900/10",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  {
    href: "/free/tools/inflation-calc",
    emoji: "🔥",
    title: "Калькулятор інфляції",
    desc: "Реальна купівельна спроможність грошей у часі. Скільки коштував би товар сьогодні чи рік тому.",
    tags: ["інфляція", "гроші", "ціни"],
    color: "from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-900/10",
    border: "border-rose-200 dark:border-rose-800/40",
  },
];

const LOCKED_TOOLS = [
  { emoji: "❤️", title: "Health Score", desc: "Оцінка фінансового здоров'я від 0 до 100" },
  { emoji: "📜", title: "Фінансова історія", desc: "Доходи та витрати по місяцях з трендами" },
  { emoji: "🔮", title: "Сценарії", desc: "Моделювання: втрата роботи, кредит, переїзд" },
  { emoji: "🚨", title: "Shock Tracker", desc: "Відстеження непередбачених великих витрат" },
  { emoji: "📈", title: "Звіти", desc: "Глибока аналітика та порівняння по місяцях" },
  { emoji: "✉️", title: "Метод конвертів", desc: "Тижневий бюджет по конвертах" },
];

export default function FreeToolsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500 uppercase tracking-wide">
          Безкоштовно · Без реєстрації
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">
          Фінансові інструменти
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
          Калькулятори та дані для розумних фінансових рішень. Відкриті для всіх, без реєстрації.
        </p>
      </div>

      {/* Free tools grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FREE_TOOLS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className={`group relative p-5 rounded-2xl border bg-gradient-to-br ${tool.color} ${tool.border} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
          >
            {tool.badge && (
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-100 dark:bg-green-950/40 text-green-600">
                {tool.badge}
              </span>
            )}
            <div className="mb-3">
              <span className="text-2xl group-hover:scale-110 inline-block transition-transform duration-200">{tool.emoji}</span>
            </div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1.5 group-hover:text-orange-500 transition-colors">
              {tool.title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
              {tool.desc}
            </p>
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

      {/* Locked tools — CTA block */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">🔒 Ще більше інструментів — в особистому кабінеті</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Підключені до ваших рахунків і транзакцій. Безкоштовно для зареєстрованих.
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors text-center"
          >
            Створити акаунт →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-700">
          {LOCKED_TOOLS.map(t => (
            <div key={t.title} className="flex items-start gap-3 px-5 py-4 opacity-60">
              <span className="text-xl shrink-0">{t.emoji}</span>
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.title}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
