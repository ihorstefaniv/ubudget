import Link from "next/link";

// ─── SVG Icons ───────────────────────────────────────────────
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v5c0 5-3.5 9-7 10C8.5 20 5 16 5 11V6l7-4z" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-8 4 4 4-6 4 3" />
      <path strokeLinecap="round" d="M3 20h18" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <circle cx="8" cy="7" r="3" />
      <path strokeLinecap="round" d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="7" r="3" />
      <path strokeLinecap="round" d="M16 14c2.2.4 4 2.5 4 5" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13H12l-1 9L20 11h-7.5L13 2z" />
    </svg>
  );
}
function IconCoin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v1m0 8v1m-3-5h5.5a1.5 1.5 0 010 3H9a1.5 1.5 0 010-3h1" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-orange-400 shrink-0 mt-0.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────
function MiniBarChart() {
  const bars = [40, 65, 50, 80, 60, 90, 72];
  const months = ["Лип", "Сер", "Вер", "Жов", "Лис", "Гру", "Січ"];
  return (
    <div className="w-full rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6">
      <div className="flex items-end justify-between gap-2 h-24">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-md transition-all duration-700 ${
                i === 5 ? "bg-orange-400" : "bg-neutral-300 dark:bg-neutral-500"
              }`}
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{months[i]}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">Витрати / місяць</span>
        <span className="text-xs font-semibold text-orange-400">↑ 12% цього місяця</span>
      </div>
    </div>
  );
}

// ─── Health Score Donut ───────────────────────────────────────
function HealthDonut({ score = 82 }: { score?: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-neutral-900 dark:text-neutral-100">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="10" strokeOpacity="0.08" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="#fb923c"
            strokeWidth="10"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor">
            {score}
          </text>
        </svg>
      </div>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Health Score</span>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-lg hover:shadow-orange-50 dark:hover:shadow-orange-950/30 transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-400 flex items-center justify-center mb-4 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Stat ─────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{label}</p>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="space-y-32 pb-32">

      {/* ── HERO ── */}
      <section className="pt-20 pb-8 text-center max-w-3xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/50 text-orange-500 dark:text-orange-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Зараз у бета-тестуванні
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          Фінанси під{" "}
          <span className="relative inline-block">
            контролем
            <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none">
              <path d="M0 8 Q50 2 100 8 Q150 14 200 8" stroke="#fb923c" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          <br />— нарешті.
        </h1>

        <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto">
          UBudget — мінімалістичний фінансовий трекер для сімей та особистого бюджету.
          Без зайвого шуму. Тільки те, що важливо.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors duration-200 shadow-lg shadow-orange-100 dark:shadow-orange-950/40"
          >
            Почати безкоштовно
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              <IconArrow />
            </span>
          </Link>
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"
          >
            Переглянути демо
          </Link>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="max-w-2xl mx-auto grid sm:grid-cols-3 gap-4 items-center">
        <div className="sm:col-span-2">
          <MiniBarChart />
        </div>
        <div className="flex flex-col items-center gap-4">
          <HealthDonut score={82} />
          <div className="w-full rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4 text-center">
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">₴ 24,500</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Залишок цього місяця</p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
        <Stat value="3 хв" label="на налаштування" />
        <Stat value="100%" label="безкоштовно" />
        <Stat value="0" label="реклами" />
      </section>

      {/* ── FEATURES ── */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Що вміє UBudget</h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto text-sm">
            Продуманий до деталей, без перевантаження. Все, що потрібно — і нічого зайвого.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={<IconChart />} title="Cashflow прогноз" desc="Аналізуємо нерегулярні витрати та прогнозуємо майбутній баланс з урахуванням сезонності." />
          <FeatureCard icon={<IconShield />} title="Health Score" desc="Фінансовий профіль сім'ї: борги, резерви, інвестиції, здоров'я — в одному числі." />
          <FeatureCard icon={<IconUsers />} title="Сімейний бюджет" desc="Household режим з ролями: Owner, Member, Viewer. Один бюджет — для всієї родини." />
          <FeatureCard icon={<IconCoin />} title="Кешбек & кредитки" desc="Flow Engine автоматично відстежує кешбек, нарахування відсотків і повернення коштів." />
          <FeatureCard icon={<IconBolt />} title="Нерегулярні витрати" desc="Страховка, техогляд, ремонт — система розмазує річні витрати по місяцях у прогнозі." />
          <FeatureCard icon={<IconChart />} title="Доходи з впевненістю" desc="Фріланс, бонуси, борги — задайте рівень впевненості і отримайте реалістичний прогноз." />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-2xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Як це працює</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Три кроки до повного контролю</p>
        </div>
        <div className="relative space-y-6">
          {[
            { n: "01", title: "Додай рахунки", desc: "Картки, готівка, кредитки — все в одному місці." },
            { n: "02", title: "Фіксуй транзакції", desc: "Вручну або через імпорт. Категоризація — автоматична." },
            { n: "03", title: "Читай Health Score", desc: "Отримуй чесну оцінку фінансового здоров'я щомісяця." },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-6 items-start group">
              <div className="w-12 h-12 shrink-0 rounded-xl border-2 border-neutral-100 dark:border-neutral-800 group-hover:border-orange-300 dark:group-hover:border-orange-700 flex items-center justify-center text-sm font-bold text-neutral-400 dark:text-neutral-500 group-hover:text-orange-400 transition-all duration-300">
                {n}
              </div>
              <div className="pt-2.5">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative rounded-3xl bg-neutral-900 dark:bg-neutral-800 dark:border dark:border-neutral-700 text-white overflow-hidden px-8 py-16 text-center">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-orange-400/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-orange-400/10 blur-2xl pointer-events-none" />
        <div className="relative space-y-6 max-w-lg mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">
            Готовий взяти фінанси<br />під контроль?
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Реєстрація займає менше хвилини. Безкоштовно. Без кредитної картки.
          </p>
          <ul className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-neutral-300">
            {["Безкоштовний старт", "Без реклами", "Дані тільки ваші"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <IconCheck />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors duration-200 shadow-xl shadow-orange-900/30"
          >
            Зареєструватись безкоштовно
            <IconArrow />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="-mb-32">
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-16 pb-8 space-y-12">
          <div className="grid sm:grid-cols-3 gap-10">
            <div className="space-y-3">
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                <span className="text-orange-400">U</span>Budget
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Мінімалістичний фінансовий трекер для сімей і особистого бюджету.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Продукт</p>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                {["Функціонал", "Демо", "Ціни", "Roadmap"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-orange-400 transition-colors duration-150">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Підтримка</p>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                {["FAQ", "Зворотній зв'язок", "Конфіденційність", "Умови використання"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-orange-400 transition-colors duration-150">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">© 2026 UBudget. Зроблено з ♥ в Україні.</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Версія 1.2 Beta</p>
          </div>
        </div>
      </footer>

    </div>
  );
}