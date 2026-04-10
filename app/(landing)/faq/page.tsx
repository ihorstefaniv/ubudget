// ФАЙЛ: app/(landing)/faq/page.tsx
"use client";

import { useState } from "react";
import type { Metadata } from "next";
import Link from "next/link";

const FAQ_DATA = [
  {
    category: "Загальні питання",
    emoji: "❓",
    questions: [
      {
        q: "Що таке UBudget?",
        a: "UBudget — це безкоштовний фінансовий трекер для особистого бюджету. Дозволяє відстежувати доходи та витрати, планувати бюджет, контролювати кредити та депозити, а також отримувати Health Score — показник фінансового здоров'я.",
      },
      {
        q: "Чи безкоштовний UBudget?",
        a: "Так, UBudget повністю безкоштовний. Немає прихованих платежів, підписок чи обмежень базового функціоналу. Якщо вам сподобається продукт — ви можете підтримати проект через донат, але це абсолютно опційно.",
      },
      {
        q: "Чи потрібна кредитна картка для реєстрації?",
        a: "Ні! Для реєстрації потрібна тільки електронна пошта. Ніяких кредитних карток, номерів телефонів чи іншої особистої інформації.",
      },
      {
        q: "Чи працює UBudget на мобільних?",
        a: "Так, веб-версія UBudget повністю адаптована для мобільних пристроїв. Також у планах запуск нативних додатків для iOS та Android.",
      },
    ],
  },
  {
    category: "Безпека та приватність",
    emoji: "🔒",
    questions: [
      {
        q: "Чи безпечно зберігати фінансові дані в UBudget?",
        a: "Так. Усі дані зберігаються в зашифрованому вигляді на серверах Supabase (провайдер з EU-стандартами безпеки). Ми не маємо доступу до ваших паролів і не передаємо дані третім особам.",
      },
      {
        q: "Чи збираєте ви мої персональні дані?",
        a: "Ми зберігаємо тільки те, що необхідно для роботи сервісу: email, ім'я (якщо ви вказали) та ваші фінансові записи. Ми НЕ продаємо дані рекламодавцям і НЕ відстежуємо вас за межами сайту.",
      },
      {
        q: "Чи можна видалити мій акаунт?",
        a: "Так, ви можете видалити акаунт у будь-який момент у налаштуваннях. При видаленні всі ваші дані буде безповоротно видалено з серверів.",
      },
      {
        q: "Чи інтегруєтесь ви з банками?",
        a: "Наразі ні, але ми працюємо над цим. У майбутньому планується підтримка автоматичного імпорту виписок через API українських банків.",
      },
    ],
  },
  {
    category: "Функціонал",
    emoji: "⚙️",
    questions: [
      {
        q: "Що таке Health Score?",
        a: "Health Score — це показник вашого фінансового здоров'я від 0 до 100. Враховує баланс доходів і витрат, наявність заощаджень, своєчасність платежів по кредитах та співвідношення боргу до доходу.",
      },
      {
        q: "Як працює метод конвертів?",
        a: "Це класичний метод бюджетування: ви ділите місячний дохід на тижневі 'конверти'. Якщо зекономили на першому тижні — залишок переходить на наступний як бонус. Це допомагає контролювати витрати без жорсткої економії.",
      },
      {
        q: "Чи можна імпортувати виписки з банку?",
        a: "Наразі імпорт виписок у розробці. Зараз транзакції додаються вручну, але ми працюємо над автоматичним імпортом CSV-файлів та інтеграцією з банківськими API.",
      },
      {
        q: "Чи підтримується кілька валют?",
        a: "Так, ви можете додавати рахунки в різних валютах (гривня, долар, євро). Для конвертації використовуються актуальні курси НБУ.",
      },
      {
        q: "Чи можна ділитися бюджетом із сім'єю?",
        a: "Поки що ні, але спільний доступ до бюджету для сімей — у списку пріоритетних функцій. Очікуйте у наступних оновленнях!",
      },
    ],
  },
  {
    category: "Технічні питання",
    emoji: "🛠",
    questions: [
      {
        q: "Які браузери підтримуються?",
        a: "UBudget працює у всіх сучасних браузерах: Chrome, Firefox, Safari, Edge. Рекомендуємо використовувати останні версії для найкращого досвіду.",
      },
      {
        q: "Чому у мене не завантажуються дані?",
        a: "Спробуйте оновити сторінку (Ctrl+F5 або Cmd+Shift+R). Якщо проблема залишається — очистіть кеш браузера або спробуйте інший браузер. Якщо нічого не допомагає — напишіть на hello@ubudget.app.",
      },
      {
        q: "Чи є API для розробників?",
        a: "Наразі публічного API немає, але ми розглядаємо можливість його запуску для інтеграцій з іншими сервісами.",
      },
      {
        q: "Чи буде мобільний додаток?",
        a: "Так! Нативні додатки для iOS та Android вже в розробці. Поки що веб-версія повністю адаптована для мобільних екранів.",
      },
    ],
  },
  {
    category: "Оплата та підтримка",
    emoji: "💰",
    questions: [
      {
        q: "Чи є платні плани?",
        a: "Ні. UBudget повністю безкоштовний для всіх користувачів. Якщо хочете підтримати проект — можете зробити добровільний донат, але це не обов'язково.",
      },
      {
        q: "Як я можу підтримати проект?",
        a: "Ви можете підтримати UBudget через Buy Me a Coffee або інші платформи для донатів (посилання у футері). Також дуже допомагає зворотній зв'язок і рекомендації друзям!",
      },
      {
        q: "Чи будуть додаватись нові функції?",
        a: "Так! UBudget активно розвивається. Ми постійно додаємо нові функції, виправляємо баги та вдосконалюємо інтерфейс на основі вашого фідбеку.",
      },
    ],
  },
];

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-orange-500 transition-colors">
          {question}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 pb-4" : "max-h-0"
        }`}
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQ = FAQ_DATA.map(category => ({
    ...category,
    questions: category.questions.filter(
      ({ q, a }) =>
        q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="py-12 space-y-12 max-w-4xl mx-auto">

      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/50 text-orange-500 dark:text-orange-400 text-xs font-medium mb-2">
          <span>❓</span>
          Допомога
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
          Питання та відповіді
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          Відповіді на найпоширеніші запитання про UBudget. 
          Не знайшли відповідь? Напишіть нам!
        </p>
      </section>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Шукайте відповіді..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors"
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* FAQ Categories */}
      {filteredFAQ.length > 0 ? (
        <div className="space-y-10">
          {filteredFAQ.map((category) => (
            <section key={category.category}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                  <span className="text-xl">{category.emoji}</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {category.category}
                </h2>
                <span className="text-xs text-neutral-400">
                  {category.questions.length} питань
                </span>
              </div>
              <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                <div className="px-6">
                  {category.questions.map((item, i) => (
                    <AccordionItem key={i} question={item.q} answer={item.a} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-neutral-500 dark:text-neutral-400">
            Нічого не знайдено за запитом "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 text-sm text-orange-500 hover:underline"
          >
            Скинути пошук
          </button>
        </div>
      )}

      {/* Still have questions */}
      <section className="p-8 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-center">
        <p className="text-white text-xl font-bold mb-2">Залишились питання?</p>
        <p className="text-neutral-400 text-sm mb-6 max-w-md mx-auto">
          Не знайшли відповідь у FAQ? Напишіть нам — ми завжди раді допомогти!
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:hello@ubudget.app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors"
          >
            ✉️ Написати на пошту
          </a>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 font-medium hover:border-neutral-600 hover:text-white transition-colors"
          >
            Дізнатись більше
          </Link>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/register", emoji: "🚀", label: "Почати користуватись", desc: "Безкоштовна реєстрація" },
          { href: "/about", emoji: "📖", label: "Про нас", desc: "Історія та цінності" },
          { href: "/blog", emoji: "✍️", label: "Блог", desc: "Поради та новини" },
        ].map(({ href, emoji, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="p-5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg transition-all group"
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">
              {emoji}
            </span>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 group-hover:text-orange-500 transition-colors">
              {label}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{desc}</p>
          </Link>
        ))}
      </section>

    </div>
  );
}