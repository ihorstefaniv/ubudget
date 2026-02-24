"use client";

export default function HouseholdPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/30 mb-6 text-5xl shadow-sm">
        👨‍👩‍👧
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500 text-xs font-semibold mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
        В розробці
      </div>

      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
        Сімейний бюджет
      </h1>

      <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md leading-relaxed mb-8">
        Спільне управління фінансами для всієї родини. Запрошуй членів сім'ї, розподіляй ролі та веди спільний бюджет — скоро!
      </p>

      {/* Features preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-8">
        {[
          { icon: "👥", title: "Спільний доступ", desc: "Запрошення членів сім'ї через email" },
          { icon: "🎭", title: "Ролі", desc: "Адміністратор, учасник, спостерігач" },
          { icon: "🏦", title: "Спільні рахунки", desc: "Прив'язка та розподіл рахунків" },
          { icon: "🎯", title: "Сімейні цілі", desc: "Накопичення на відпустку, ремонт..." },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-left">
            <span className="text-2xl shrink-0">{icon}</span>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400">Очікуй у Q2 2026</p>
    </div>
  );
}