// ФАЙЛ: app/(landing)/tools/deposit-calc/page.tsx
import type { Metadata } from "next";
import DepositCalcClient from "./DepositCalcClient";

export const metadata: Metadata = {
  title: "Калькулятор депозитів онлайн 2026 — розрахунок відсотків, капіталізація, податки | UBudget",
  description: "Безкоштовний калькулятор депозитів: складні відсотки, капіталізація, ПДФО 18% + ВЗ 1.5%, довнесення, інфляція, порівняння з ОВДП. Розрахуйте дохідність депозиту онлайн.",
  keywords: [
    "калькулятор депозитів", "депозитний калькулятор", "розрахунок депозиту",
    "відсотки по депозиту", "капіталізація відсотків", "ПДФО депозит",
    "депозити Україна 2026", "порівняння депозиту з ОВДП", "складні відсотки",
  ],
  openGraph: {
    title: "Калькулятор депозитів онлайн — UBudget",
    description: "Розрахуйте дохідність депозиту з урахуванням капіталізації, податків та інфляції.",
    type: "website", locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/tools/deposit-calc" },
};

export default function DepositCalcPage() {
  return (
    <div className="py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Калькулятор депозитів онлайн
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Розрахуйте дохідність депозиту з капіталізацією відсотків, податками (ПДФО 18% + ВЗ 1.5%), 
          довнесеннями та порівнянням з ОВДП. Безкоштовно, без реєстрації.
        </p>
      </div>

      <DepositCalcClient />

      <div className="max-w-3xl mx-auto space-y-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Як розрахувати дохідність депозиту?</h2>
          <p>
            Дохідність залежить від ставки, строку, частоти капіталізації та податків. 
            В Україні з відсотків по депозитах утримується ПДФО (18%) та військовий збір (1.5%). 
            Калькулятор враховує все це автоматично і показує чистий дохід.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Що таке капіталізація відсотків?</h2>
          <p>
            Капіталізація — це нарахування відсотків на відсотки. Якщо відсотки додаються до тіла депозиту 
            (щомісяця, щоквартально тощо), наступного періоду відсотки нараховуються вже на більшу суму. 
            Це збільшує ефективну дохідність.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Депозит чи ОВДП — що вигідніше?</h2>
          <p>
            ОВДП (облігації внутрішньої державної позики) — альтернатива депозиту з простим відсотком. 
            Калькулятор дозволяє порівняти чистий дохід після податків для обох інструментів.
          </p>
        </section>

        <div className="p-6 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-center">
          <p className="text-white text-lg font-bold mb-2">Хочете відстежувати депозити автоматично?</p>
          <p className="text-neutral-400 text-sm mb-4">
            В UBudget можна додати депозити, бачити нараховані відсотки, строк закінчення та вплив на Health Score.
          </p>
          <a href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors text-sm">
            Спробувати безкоштовно →
          </a>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Який податок з депозиту в Україні?", "acceptedAnswer": { "@type": "Answer", "text": "З відсотків по депозитах утримується ПДФО 18% та військовий збір 1.5%, разом 19.5% від нарахованих відсотків." }},
          { "@type": "Question", "name": "Що таке капіталізація відсотків?", "acceptedAnswer": { "@type": "Answer", "text": "Капіталізація — нарахування відсотків на раніше нараховані відсотки. Збільшує ефективну дохідність депозиту." }},
        ]
      })}} />
    </div>
  );
}