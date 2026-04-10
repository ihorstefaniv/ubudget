// ФАЙЛ: app/(landing)/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Умови використання — UBudget",
  description: "Умови використання сервісу UBudget. Права та обов'язки користувачів.",
  openGraph: {
    title: "Умови використання — UBudget",
    description: "Умови використання фінансового трекера UBudget",
    type: "website",
    locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/terms" },
};

export default function TermsPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-12">

      {/* Hero */}
      <section className="space-y-4">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest">Оновлено: 1 квітня 2026</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Умови використання
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Використовуючи UBudget, ви погоджуєтесь з цими умовами. 
          Будь ласка, уважно прочитайте їх перед реєстрацією.
        </p>
      </section>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            1. Прийняття умов
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Реєструючись та використовуючи UBudget (далі — "Сервіс"), ви підтверджуєте, що:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Вам виповнилось 16 років</li>
            <li>• Ви прочитали та погодились з цими Умовами використання</li>
            <li>• Ви прочитали та погодились з нашою <Link href="/privacy" className="text-orange-500 hover:underline">Політикою конфіденційності</Link></li>
            <li>• Ви маєте право укладати юридично обов'язкову угоду</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            2. Опис сервісу
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            UBudget — це веб-додаток для особистого фінансового обліку, який допомагає:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Відстежувати доходи та витрати</li>
            <li>• Керувати рахунками та бюджетом</li>
            <li>• Контролювати кредити, депозити та інвестиції</li>
            <li>• Використовувати метод конвертів для планування бюджету</li>
            <li>• Оцінювати фінансове здоров'я через Health Score</li>
          </ul>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <strong className="text-neutral-900 dark:text-neutral-100">Сервіс надається "як є"</strong> — ми робимо все можливе для стабільної роботи, 
            але не гарантуємо відсутність помилок або перебоїв.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            3. Обліковий запис
          </h2>
          
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            3.1. Реєстрація
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            При створенні акаунта ви зобов'язуєтесь:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Надати точну та актуальну інформацію</li>
            <li>• Зберігати пароль у таємниці</li>
            <li>• Не передавати доступ до акаунта третім особам</li>
            <li>• Негайно повідомити нас про несанкціонований доступ</li>
          </ul>

          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            3.2. Відповідальність за акаунт
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ви повністю відповідаєте за всі дії, виконані через ваш акаунт. 
            Ми не несемо відповідальності за втрату даних через:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Втрату пароля</li>
            <li>• Несанкціонований доступ через вашу недбалість</li>
            <li>• Передачу доступу третім особам</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            4. Використання сервісу
          </h2>
          
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            4.1. Дозволене використання
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            UBudget призначений для особистого використання. Ви можете:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Вести облік своїх фінансів</li>
            <li>• Експортувати свої дані</li>
            <li>• Використовувати безкоштовні інструменти (калькулятори)</li>
          </ul>

          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            4.2. Заборонене використання
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ви НЕ можете:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Використовувати Сервіс для незаконної діяльності</li>
            <li>• Копіювати, модифікувати або розповсюджувати код UBudget</li>
            <li>• Намагатись зламати або обійти систему безпеки</li>
            <li>• Використовувати автоматизовані скрипти для масових запитів (без дозволу)</li>
            <li>• Створювати фейкові акаунти або спам</li>
            <li>• Завантажувати шкідливе ПЗ або віруси</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            5. Ваші дані
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Всі дані, які ви вводите в UBudget (транзакції, рахунки, бюджети) — це <strong className="text-neutral-900 dark:text-neutral-100">ваша власність</strong>.
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Ми не претендуємо на права власності на ваші дані</li>
            <li>• Ви маєте право експортувати дані у будь-який момент</li>
            <li>• Ви маєте право видалити акаунт та всі дані</li>
          </ul>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Детальніше про обробку даних — у нашій{" "}
            <Link href="/privacy" className="text-orange-500 hover:underline">Політиці конфіденційності</Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            6. Обмеження відповідальності
          </h2>
          
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            6.1. Фінансові поради
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <strong className="text-neutral-900 dark:text-neutral-100">UBudget НЕ є фінансовим радником.</strong> Сервіс надає інструменти для обліку, але не дає фінансових рекомендацій. 
            Health Score — це лише індикатор, а не професійна консультація.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ми не несемо відповідальності за фінансові рішення, прийняті на основі даних з UBudget.
          </p>

          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            6.2. Точність даних
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ви самостійно вводите всі дані. Ми не несемо відповідальності за:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Помилки у введених даних</li>
            <li>• Неточні розрахунки через некоректні вхідні дані</li>
            <li>• Втрату даних через технічні збої (хоча ми робимо резервні копії)</li>
          </ul>

          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            6.3. Доступність сервісу
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ми прагнемо до 99.9% uptime, але не гарантуємо безперебійну роботу. 
            Сервіс може бути тимчасово недоступний через:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Технічне обслуговування</li>
            <li>• Форс-мажорні обставини</li>
            <li>• Проблеми з хостинг-провайдерами</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            7. Інтелектуальна власність
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Весь контент UBudget (дизайн, логотип, код, тексти) є власністю UBudget та захищений законами України про авторське право.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ви не можете копіювати, модифікувати або створювати похідні роботи без письмового дозволу.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            8. Припинення використання
          </h2>
          
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            8.1. З вашого боку
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ви можете видалити акаунт у будь-який час через налаштування профілю. 
            Після видалення всі дані будуть безповоротно знищені (крім логів безпеки на 30 днів).
          </p>

          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            8.2. З нашого боку
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ми залишаємо за собою право призупинити або видалити акаунт у випадку:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Порушення цих Умов використання</li>
            <li>• Незаконної діяльності</li>
            <li>• Спроб зламу або шкоди сервісу</li>
            <li>• Неактивності більше 2 років (з попередженням на email)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            9. Зміни в умовах
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ми можемо оновлювати ці Умови. Про суттєві зміни ми повідомимо вас на email за 14 днів до набуття чинності.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Продовжуючи користуватись Сервісом після змін, ви погоджуєтесь з новими Умовами.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            10. Застосовне право
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ці Умови регулюються законодавством України. 
            Будь-які спори вирішуються у судах за місцезнаходженням UBudget (Україна).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            11. Контакти
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Якщо у вас є питання щодо цих Умов:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Email: <a href="mailto:hello@ubudget.app" className="text-orange-500 hover:underline font-medium">hello@ubudget.app</a></li>
            <li>• FAQ: <Link href="/faq" className="text-orange-500 hover:underline font-medium">ubudget.app/faq</Link></li>
          </ul>
        </section>

      </div>

      {/* Navigation */}
      <section className="pt-8 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/privacy" className="text-sm text-orange-500 hover:underline">
            → Політика конфіденційності
          </Link>
          <Link href="/" className="text-sm text-neutral-500 hover:text-orange-500 transition-colors">
            ← Повернутись на головну
          </Link>
        </div>
      </section>

    </div>
  );
}