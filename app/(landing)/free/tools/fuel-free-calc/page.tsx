// ФАЙЛ: app/(landing)/tools/fuel-calc/page.tsx
import type { Metadata } from "next";
import FuelCalcClient from "./FuelCalcClient";

export const metadata: Metadata = {
  title: "Калькулятор витрат пального 2026 — розрахунок вартості поїздок | UBudget",
  description: "Безкоштовний калькулятор витрат пального: маршрути на карті, вартість поїздки, тижневий та місячний план. Бензин, дизель, газ, електро. Без реєстрації.",
  keywords: [
    "калькулятор пального", "витрати на бензин", "вартість поїздки",
    "розрахунок палива", "витрати авто", "калькулятор бензину",
    "витрати на паливо Україна", "калькулятор відстані",
  ],
  openGraph: {
    title: "Калькулятор витрат пального — UBudget",
    description: "Розрахуйте витрати на паливо для поїздок і подорожей. Бензин, дизель, газ, електро.",
    type: "website", locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/tools/fuel-calc" },
};

export default function FuelCalcPage() {
  return (
    <div className="py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Калькулятор витрат пального
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Розрахуйте вартість поїздок: прокладіть маршрут на карті, вкажіть розхід і ціну палива. 
          Бензин, дизель, газ, електро. Тижневий та місячний план. Безкоштовно.
        </p>
      </div>

      <FuelCalcClient />

      <div className="max-w-3xl mx-auto space-y-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Як розрахувати витрати на паливо?</h2>
          <p>
            Формула проста: (відстань × розхід / 100) × ціна палива. Калькулятор автоматично будує 
            маршрут через OpenStreetMap, рахує відстань і час, та показує вартість поїздки для вашого авто.
          </p>
        </section>

        <div className="p-6 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-center">
          <p className="text-white text-lg font-bold mb-2">Хочете вести облік витрат на авто?</p>
          <p className="text-neutral-400 text-sm mb-4">
            В UBudget є категорія «Паливо» з автоматичним підрахунком місячних витрат та інтеграцією з бюджетом.
          </p>
          <a href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors text-sm">
            Спробувати безкоштовно →
          </a>
        </div>
      </div>
    </div>
  );
}