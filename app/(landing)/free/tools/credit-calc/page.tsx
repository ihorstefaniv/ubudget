// ФАЙЛ: app/(landing)/tools/credit-calc/page.tsx
// URL: /tools/credit-calc — SEO лід-магніт кредитний калькулятор
import type { Metadata } from "next";
import CreditCalcClient from "./CreditCalcClient";

export const metadata: Metadata = {
  title: "Кредитний калькулятор онлайн 2026 — розрахунок платежу, переплати, графік | UBudget",
  description: "Безкоштовний кредитний калькулятор: ануїтетний та диференційований платіж, дострокове погашення, реальна вартість кредиту, рефінансування. Розрахуйте іпотеку, автокредит, споживчий кредит онлайн.",
  keywords: [
    "кредитний калькулятор", "калькулятор кредиту", "розрахунок кредиту",
    "ануїтетний платіж", "диференційований платіж", "переплата по кредиту",
    "дострокове погашення", "рефінансування кредиту", "іпотечний калькулятор",
    "автокредит калькулятор", "кредит Україна 2026", "графік платежів",
  ],
  openGraph: {
    title: "Кредитний калькулятор онлайн — UBudget",
    description: "Розрахуйте щомісячний платіж, переплату та реальну вартість кредиту. Ануїтет, диференційований, дострокове погашення.",
    type: "website",
    locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/tools/credit-calc" },
};

export default function CreditCalcPage() {
  return (
    <div className="py-10 space-y-10">
      {/* SEO Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Кредитний калькулятор онлайн
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Розрахуйте щомісячний платіж, загальну переплату та реальну вартість кредиту. 
          Ануїтетний і диференційований платіж. Дострокове погашення. Рефінансування. 
          Безкоштовно, без реєстрації.
        </p>
      </div>

      {/* Calculator */}
      <CreditCalcClient />

      {/* SEO Content */}
      <div className="max-w-3xl mx-auto space-y-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Як працює кредитний калькулятор?</h2>
          <p>
            Калькулятор дозволяє розрахувати два типи щомісячних платежів: ануїтетний (рівні платежі щомісяця) 
            та диференційований (спадний платіж — спочатку більший, потім менший). Для кожного типу розраховується 
            загальна сума переплати, ефективна процентна ставка з урахуванням комісій, та повний графік платежів.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Ануїтетний vs Диференційований платіж</h2>
          <p className="mb-2">
            <strong className="text-neutral-900 dark:text-neutral-100">Ануїтетний</strong> — щомісячний платіж однаковий протягом всього строку. 
            Зручно для планування бюджету, але загальна переплата більша.
          </p>
          <p>
            <strong className="text-neutral-900 dark:text-neutral-100">Диференційований</strong> — перший платіж найбільший, далі зменшується. 
            Загальна переплата менша, але на початку фінансове навантаження вище.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Дострокове погашення кредиту</h2>
          <p>
            Дострокове погашення дозволяє зменшити загальну переплату по кредиту. Є дві стратегії: 
            зменшити строк (платіж залишається тим самим, але кредит закривається раніше) або 
            зменшити платіж (строк залишається, але щомісячна сума зменшується). 
            Калькулятор покаже економію для обох варіантів.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Рефінансування кредиту</h2>
          <p>
            Якщо ставки на ринку знизились — можливо, вигідно рефінансувати кредит. 
            Калькулятор порівняє ваш поточний кредит з новим (з урахуванням комісії за рефінансування) 
            і покаже, чи це економить гроші.
          </p>
        </section>

        {/* CTA */}
        <div className="p-6 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-center">
          <p className="text-white text-lg font-bold mb-2">Хочете відстежувати кредити автоматично?</p>
          <p className="text-neutral-400 text-sm mb-4">
            В UBudget можна додати всі кредити, бачити прогрес погашення, отримувати нагадування про платежі та слідкувати за Health Score.
          </p>
          <a href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors text-sm">
            Спробувати безкоштовно →
          </a>
        </div>
      </div>

      {/* FAQ Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Що таке ануїтетний платіж?",
            "acceptedAnswer": { "@type": "Answer", "text": "Ануїтетний платіж — це рівний щомісячний платіж по кредиту, що включає частину тіла кредиту та відсотки. Сума платежу однакова протягом всього строку кредиту." }
          },
          {
            "@type": "Question",
            "name": "Як розрахувати переплату по кредиту?",
            "acceptedAnswer": { "@type": "Answer", "text": "Переплата = загальна сума всіх платежів − сума кредиту. Включає відсотки, комісії та страховку. Наш калькулятор розраховує це автоматично." }
          },
          {
            "@type": "Question",
            "name": "Чи вигідно дострокове погашення кредиту?",
            "acceptedAnswer": { "@type": "Answer", "text": "Так, дострокове погашення зменшує загальну переплату. Стратегія 'зменшити строк' економить більше на відсотках, а 'зменшити платіж' знижує щомісячне навантаження." }
          },
        ]
      })}} />
    </div>
  );
}