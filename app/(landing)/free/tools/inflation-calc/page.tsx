// ФАЙЛ: app/(landing)/tools/inflation-calc/page.tsx
import type { Metadata } from "next";
import InflationCalcClient from "./InflationCalcClient";

export const metadata: Metadata = {
  title: "Калькулятор інфляції — як знецінюються ваші гроші | UBudget",
  description: "Розрахуйте реальну купівельну спроможність грошей через 1-30 років з урахуванням інфляції. Порівняйте зі збереженням на депозиті. Безкоштовно.",
  keywords: [
    "калькулятор інфляції", "інфляція Україна", "знецінення грошей",
    "купівельна спроможність", "інфляція 2026", "реальна вартість грошей",
  ],
  openGraph: {
    title: "Калькулятор інфляції — UBudget",
    description: "Скільки будуть коштувати ваші гроші через 5, 10, 20 років?",
    type: "website", locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/tools/inflation-calc" },
};

export default function InflationCalcPage() {
  return (
    <div className="py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Калькулятор інфляції
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Дізнайтесь, скільки будуть коштувати ваші гроші через 5, 10 або 20 років. 
          Порівняйте зберігання під матрацом, на депозиті та в ОВДП.
        </p>
      </div>

      <InflationCalcClient />

      <div className="max-w-3xl mx-auto space-y-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Що таке інфляція?</h2>
          <p>
            Інфляція — це зростання цін на товари та послуги з часом. Якщо інфляція 10% на рік, 
            то через рік на 100 000 грн ви зможете купити стільки ж, скільки зараз на ~91 000 грн. 
            Гроші «під подушкою» щороку втрачають купівельну спроможність.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Як захистити гроші від інфляції?</h2>
          <p>
            Три основні стратегії: банківський депозит (найпростіший), ОВДП (державні облігації), 
            або інвестиції в активи, які ростуть швидше за інфляцію. Калькулятор показує, 
            як кожна стратегія впливає на реальну вартість ваших заощаджень.
          </p>
        </section>

        <div className="p-6 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-center">
          <p className="text-white text-lg font-bold mb-2">Захистіть свої заощадження</p>
          <p className="text-neutral-400 text-sm mb-4">
            UBudget допоможе відстежувати депозити, інвестиції та реальну дохідність з урахуванням інфляції.
          </p>
          <a href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors text-sm">
            Спробувати безкоштовно →
          </a>
        </div>
      </div>
    </div>
  );
}