// ФАЙЛ: app/(landing)/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Про нас — UBudget",
  description: "UBudget — український фінансовий трекер для особистого бюджету. Зроблено з любов'ю в Україні. Наша історія, цінності та команда.",
  openGraph: {
    title: "Про UBudget",
    description: "Український фінансовий трекер для особистого бюджету",
    type: "website",
    locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/about" },
};

function Check({ cls = "w-4 h-4" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={cls}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="py-12 space-y-20 max-w-3xl mx-auto">

      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/50 text-orange-500 dark:text-orange-400 text-xs font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Зроблено з ♥ в Україні
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
          Про UBudget
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          Простий, чесний та зрозумілий фінансовий трекер для українців. 
          Без нав'язливої реклами, без підписок, без прихованих платежів.
        </p>
      </section>

      {/* Історія */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
            <span className="text-xl">📖</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Як все почалося</h2>
        </div>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            UBudget народився з особистої потреби. Ми шукали простий спосіб відстежувати особисті фінанси — 
            без складних налаштувань, без сотень полів для заповнення, без необхідності мати фінансову освіту.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Більшість інструментів на ринку — або занадто складні (призначені для бізнесу), 
            або закордонні (не підтримують гривню та українські банки), або переповнені рекламою.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Тому ми вирішили зробити інструмент, який би був <strong className="text-neutral-900 dark:text-neutral-100">простим, 
            зручним та українським</strong>. Без зайвого. Без нав'язування платних підписок. 
            Просто чесний трекер для таких самих людей, як ми.
          </p>
        </div>
      </section>

      {/* Цінності */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
            <span className="text-xl">💎</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Наші цінності</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              emoji: "🇺🇦",
              title: "Українське",
              desc: "Створено в Україні, для українців. Підтримка гривні, українських банків та локального контексту.",
            },
            {
              emoji: "🎯",
              title: "Просте",
              desc: "Без перевантаження функціями. Тільки те, що справді потрібно для контролю фінансів.",
            },
            {
              emoji: "🔒",
              title: "Безпечне",
              desc: "Ваші дані — ваші. Ми не продаємо інформацію третім особам і не використовуємо для реклами.",
            },
            {
              emoji: "🎁",
              title: "Безкоштовне",
              desc: "Повний функціонал без підписок. Монетизація — через опціональні донати від вдячних користувачів.",
            },
            {
              emoji: "🚫",
              title: "Без реклами",
              desc: "Ніяких банерів, попапів чи рекламних інтеграцій. Фокус тільки на вашому бюджеті.",
            },
            {
              emoji: "🔓",
              title: "Відкрите",
              desc: "Відкритий до зворотного зв'язку. Розвиваємося разом з користувачами, а не всупереч їм.",
            },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="p-5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{emoji}</span>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Команда */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
            <span className="text-xl">👥</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Команда</h2>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          UBudget — це невеликий проект, створений <strong className="text-neutral-900 dark:text-neutral-100">однією людиною</strong> (привіт! 👋). 
          Розробка, дизайн, контент — все робиться з любов'ю та увагою до деталей.
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Якщо маєте питання, ідеї або просто хочете сказати "дякую" — пишіть! 
          Ми завжди відкриті до спілкування та вдячні за зворотній зв'язок.
        </p>
      </section>

      {/* Що далі */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
            <span className="text-xl">🚀</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Що далі?</h2>
        </div>
        <div className="space-y-4">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Наразі UBudget перебуває в <strong className="text-neutral-900 dark:text-neutral-100">активній розробці</strong>. 
            Ми постійно додаємо нові функції, виправляємо баги та вдосконалюємо інтерфейс.
          </p>
          <div className="p-5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">📋 У планах найближчим часом:</p>
            <ul className="space-y-2">
              {[
                "Автоматичний імпорт виписок з банків",
                "Мобільні додатки (iOS та Android)",
                "Спільний доступ до бюджету для сімей",
                "Розширена аналітика та звіти",
                "Інтеграція з банківськими API",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <Check cls="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="p-8 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-center">
        <p className="text-white text-xl font-bold mb-2">Приєднуйтесь до UBudget</p>
        <p className="text-neutral-400 text-sm mb-6 max-w-md mx-auto">
          Безкоштовна реєстрація. Без кредитних карток. Без прихованих платежів. 
          Просто почніть контролювати свої фінанси вже сьогодні.
        </p>
        <Link href="/register" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
          Почати безкоштовно →
        </Link>
      </section>

      {/* Контакти */}
      <section className="space-y-4 text-center">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Залишились питання?</h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Перегляньте наш{" "}
          <Link href="/faq" className="text-orange-500 hover:underline font-medium">
            розділ FAQ
          </Link>
          {" "}або напишіть нам на{" "}
          <a href="mailto:hello@ubudget.app" className="text-orange-500 hover:underline font-medium">
            hello@ubudget.app
          </a>
        </p>
      </section>

    </div>
  );
}