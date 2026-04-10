// ФАЙЛ: app/(landing)/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Політика конфіденційності — UBudget",
  description: "Політика конфіденційності UBudget. Як ми збираємо, використовуємо та захищаємо ваші персональні дані.",
  openGraph: {
    title: "Політика конфіденційності — UBudget",
    description: "Прозора політика конфіденційності",
    type: "website",
    locale: "uk_UA",
  },
  alternates: { canonical: "https://ubudget.app/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-12">

      {/* Hero */}
      <section className="space-y-4">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest">Оновлено: 1 квітня 2026</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Політика конфіденційності
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed">
          UBudget серйозно ставиться до захисту ваших персональних даних. 
          Ця політика пояснює, які дані ми збираємо, як використовуємо та захищаємо їх.
        </p>
      </section>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            1. Які дані ми збираємо
          </h2>
          
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            1.1. Дані облікового запису
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            При реєстрації ми збираємо:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Адреса електронної пошти</li>
            <li>• Ім'я (якщо ви вказали)</li>
            <li>• Пароль у зашифрованому вигляді (ми не маємо доступу до вашого пароля)</li>
          </ul>

          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            1.2. Фінансові дані
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Дані, які ви вводите в додаток:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Назви рахунків, категорій, транзакцій</li>
            <li>• Суми та дати транзакцій</li>
            <li>• Інформація про кредити, депозити, інвестиції</li>
            <li>• Бюджети та фінансові цілі</li>
          </ul>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <strong className="text-neutral-900 dark:text-neutral-100">Важливо:</strong> Ми НЕ збираємо номери банківських карт, PIN-коди, 
            CVV або інші конфіденційні банківські дані.
          </p>

          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
            1.3. Технічна інформація
          </h3>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• IP-адреса</li>
            <li>• Тип пристрою та браузер</li>
            <li>• Логи доступу (дата, час входу)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            2. Як ми використовуємо дані
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ваші дані використовуються виключно для:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Надання вам доступу до сервісу UBudget</li>
            <li>• Збереження ваших фінансових записів</li>
            <li>• Розрахунку Health Score та інших показників</li>
            <li>• Відправлення важливих повідомлень про акаунт (зміна пароля, оновлення політики)</li>
            <li>• Технічної підтримки та вирішення проблем</li>
          </ul>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <strong className="text-neutral-900 dark:text-neutral-100">Ми НЕ:</strong>
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Не продаємо ваші дані третім особам</li>
            <li>• Не використовуємо ваші дані для реклами</li>
            <li>• Не передаємо дані без вашої згоди (окрім випадків, передбачених законом)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            3. Як ми захищаємо дані
          </h2>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• <strong className="text-neutral-900 dark:text-neutral-100">Шифрування:</strong> Всі дані передаються по HTTPS (SSL/TLS)</li>
            <li>• <strong className="text-neutral-900 dark:text-neutral-100">Зберігання:</strong> Дані зберігаються на захищених серверах Supabase (EU-стандарти безпеки)</li>
            <li>• <strong className="text-neutral-900 dark:text-neutral-100">Паролі:</strong> Зберігаються в зашифрованому вигляді (bcrypt hashing)</li>
            <li>• <strong className="text-neutral-900 dark:text-neutral-100">Доступ:</strong> Обмежений доступ до серверів, двофакторна автентифікація для адміністраторів</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            4. Cookies та аналітика
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ми використовуємо мінімальну кількість cookies для:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Підтримки вашої сесії (щоб ви залишалися залогіненими)</li>
            <li>• Збереження налаштувань (темна тема, мова)</li>
          </ul>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ми НЕ використовуємо Google Analytics, Facebook Pixel або інші трекінгові системи третіх сторін.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            5. Ваші права
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Згідно з GDPR та законодавством України, ви маєте право:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• <strong className="text-neutral-900 dark:text-neutral-100">Доступ:</strong> Отримати копію ваших даних</li>
            <li>• <strong className="text-neutral-900 dark:text-neutral-100">Виправлення:</strong> Виправити неточні дані</li>
            <li>• <strong className="text-neutral-900 dark:text-neutral-100">Видалення:</strong> Видалити ваш акаунт та всі пов'язані дані</li>
            <li>• <strong className="text-neutral-900 dark:text-neutral-100">Експорт:</strong> Завантажити ваші дані у форматі JSON/CSV</li>
          </ul>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Щоб скористатися цими правами, напишіть на{" "}
            <a href="mailto:privacy@ubudget.app" className="text-orange-500 hover:underline font-medium">
              privacy@ubudget.app
            </a>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            6. Зберігання даних
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ваші дані зберігаються, доки ви користуєтесь UBudget. Якщо ви видалите акаунт:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Всі ваші фінансові дані будуть безповоротно видалені</li>
            <li>• Email може зберігатися в логах 30 днів для безпеки (захист від шахрайства)</li>
            <li>• Резервні копії автоматично видаляються через 90 днів</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            7. Діти
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            UBudget не призначений для дітей віком до 16 років. Ми свідомо не збираємо дані від осіб молодше 16 років. 
            Якщо ви батько/опікун та виявили, що ваша дитина надала нам особисті дані — напишіть на{" "}
            <a href="mailto:privacy@ubudget.app" className="text-orange-500 hover:underline font-medium">
              privacy@ubudget.app
            </a>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            8. Зміни в політиці
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Ми можемо оновлювати цю політику. Про суттєві зміни ми повідомимо вас на email. 
            Поточна версія завжди доступна на цій сторінці.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
            9. Контакти
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Якщо у вас є питання щодо конфіденційності:
          </p>
          <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <li>• Email: <a href="mailto:privacy@ubudget.app" className="text-orange-500 hover:underline font-medium">privacy@ubudget.app</a></li>
            <li>• Загальна підтримка: <a href="mailto:hello@ubudget.app" className="text-orange-500 hover:underline font-medium">hello@ubudget.app</a></li>
          </ul>
        </section>

      </div>

      {/* Navigation */}
      <section className="pt-8 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/terms" className="text-sm text-orange-500 hover:underline">
            → Умови використання
          </Link>
          <Link href="/" className="text-sm text-neutral-500 hover:text-orange-500 transition-colors">
            ← Повернутись на головну
          </Link>
        </div>
      </section>

    </div>
  );
}