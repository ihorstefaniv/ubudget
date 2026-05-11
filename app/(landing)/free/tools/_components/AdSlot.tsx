"use client";

// Рекламний слот — placeholder для майбутніх партнерів/банків/сервісів.
// data-ad-slot — атрибут для підключення рекламної мережі або прямих партнерів.

export type AdContext =
  | "credit"     // кредитний калькулятор
  | "deposit"    // депозитний калькулятор
  | "fuel"       // пальне / маршрути
  | "inflation"  // інфляція
  | "generic";   // загальний

export type AdSize = "banner" | "card" | "sidebar";

interface AdSlotProps {
  context?: AdContext;
  size?: AdSize;
  slot?: string; // ідентифікатор для аналітики/мережі
}

// Контекстні оголошення — замінюються на реальні при появі партнерів
const ADS: Record<AdContext, { title: string; desc: string; cta: string; badge: string; color: string }[]> = {
  credit: [
    { title: "Кредит готівкою від 9.9%", desc: "Рішення за 15 хвилин. Без застави до 500 000 грн.", cta: "Розрахувати ставку →", badge: "ПриватБанк", color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40" },
    { title: "Рефінансування кредиту", desc: "Зменшіть щомісячний платіж. Переведіть кредит під нижчу ставку.", cta: "Дізнатись умови →", badge: "monobank", color: "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700" },
  ],
  deposit: [
    { title: "Депозит до 18% річних", desc: "Щомісячна виплата відсотків. Страхування вкладів до 600 000 грн.", cta: "Відкрити онлайн →", badge: "Ощадбанк", color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40" },
    { title: "ОВДП від 16.5%", desc: "Державні облігації — надійно та вигідно. Купити через брокера онлайн.", cta: "Купити ОВДП →", badge: "Мінфін", color: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40" },
  ],
  fuel: [
    { title: "WOG Club — −2 грн/л", desc: "Накопичуйте бали на кожній заправці. Безкоштовна карта.", cta: "Отримати карту →", badge: "WOG", color: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40" },
    { title: "Fishka — кешбек на ОККО", desc: "До 5% балами на кожній заправці. Понад 400 АЗС по Україні.", cta: "Реєструватись →", badge: "ОККО", color: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40" },
  ],
  inflation: [
    { title: "Захистіть гроші від інфляції", desc: "ОВДП та банківські депозити з фіксованою ставкою. Онлайн за 10 хвилин.", cta: "Порівняти варіанти →", badge: "Партнер", color: "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/40" },
  ],
  generic: [
    { title: "UBudget Pro — повний контроль", desc: "Всі інструменти + аналітика підключена до ваших рахунків. Безкоштовно.", cta: "Спробувати →", badge: "UBudget", color: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40" },
  ],
};

export function AdSlot({ context = "generic", size = "banner", slot = "default" }: AdSlotProps) {
  const ads = ADS[context];
  const ad  = ads[0]; // згодом можна ротувати або A/B тестувати

  if (size === "banner") {
    return (
      <div data-ad-slot={slot} className={`relative rounded-xl border px-4 py-3.5 flex items-center gap-4 ${ad.color}`}>
        <span className="absolute top-1.5 right-2 text-[9px] text-neutral-400 uppercase tracking-wide">Реклама</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/70 dark:bg-neutral-900/50 text-neutral-500">{ad.badge}</span>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{ad.title}</p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{ad.desc}</p>
        </div>
        <a href="#" onClick={e => e.preventDefault()}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-orange-300 hover:text-orange-500 transition-all whitespace-nowrap">
          {ad.cta}
        </a>
      </div>
    );
  }

  if (size === "card") {
    return (
      <div data-ad-slot={slot} className={`relative rounded-xl border p-4 space-y-2 ${ad.color}`}>
        <span className="absolute top-2 right-2 text-[9px] text-neutral-400 uppercase tracking-wide">Реклама</span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/70 dark:bg-neutral-900/50 text-neutral-500 inline-block">{ad.badge}</span>
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug pr-8">{ad.title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{ad.desc}</p>
        <a href="#" onClick={e => e.preventDefault()}
          className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-orange-300 hover:text-orange-500 transition-all">
          {ad.cta}
        </a>
      </div>
    );
  }

  // sidebar
  return (
    <div data-ad-slot={slot} className={`relative rounded-xl border p-4 space-y-3 ${ad.color}`}>
      <span className="absolute top-2 right-2 text-[9px] text-neutral-400 uppercase tracking-wide">Реклама</span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/70 dark:bg-neutral-900/50 text-neutral-500 inline-block">{ad.badge}</span>
      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-snug">{ad.title}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{ad.desc}</p>
      <a href="#" onClick={e => e.preventDefault()}
        className="block text-center text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-orange-300 hover:text-orange-500 transition-all">
        {ad.cta}
      </a>
      {ads[1] && (
        <div className={`rounded-xl border p-3 space-y-1.5 ${ads[1].color}`}>
          <span className="text-[9px] text-neutral-400 uppercase tracking-wide block">Реклама</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/70 dark:bg-neutral-900/50 text-neutral-500 inline-block">{ads[1].badge}</span>
          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{ads[1].title}</p>
          <p className="text-[11px] text-neutral-500">{ads[1].desc}</p>
          <a href="#" onClick={e => e.preventDefault()}
            className="inline-block text-[11px] font-semibold text-orange-500 hover:underline">{ads[1].cta}</a>
        </div>
      )}
    </div>
  );
}
