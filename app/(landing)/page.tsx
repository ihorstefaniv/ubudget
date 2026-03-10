import type { Metadata } from "next";
import HeroSection from "./_components/HeroSection";
import CtaSection  from "./_components/CtaSection";

export const metadata: Metadata = {
  title: "UBudget — Фінансовий трекер для особистого бюджету",
  description: "UBudget — простий додаток для особистого бюджету. Рахунки, витрати, кредити, депозити, конверти, Health Score — все в одному місці. Безкоштовно. Без реклами.",
  keywords: ["фінансовий трекер", "особистий бюджет", "облік витрат", "бюджет Україна", "кредити", "депозити", "конверти"],
  authors: [{ name: "UBudget" }],
  openGraph: {
    title: "UBudget — Фінанси під контролем",
    description: "Відстежуй витрати, плануй бюджет, контролюй кредити. Безкоштовно. Без реклами.",
    type: "website", locale: "uk_UA", siteName: "UBudget",
  },
  twitter: { card: "summary_large_image", title: "UBudget — Фінансовий трекер", description: "Простий трекер для особистого бюджету. Безкоштовно." },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://ubudget.app" },
};

// ─── Helpers ─────────────────────────────────────────────────
function Check({ cls = "w-4 h-4" }: { cls?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={cls}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── MOCK: Dashboard ─────────────────────────────────────────
function DashboardMock() {
  const bars = [30, 55, 40, 70, 48, 85, 62];
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xl shadow-neutral-200/50 dark:shadow-black/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-orange-400 flex items-center justify-center">
            <span className="text-white text-[10px] font-black">U</span>
          </div>
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">UBudget</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Привіт, Іване 👋</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">понеділок, 8 березня 2026</p>
          </div>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="16" fill="none" stroke="currentColor" strokeWidth="4" strokeOpacity="0.1" className="text-neutral-900 dark:text-neutral-100" />
            <circle cx="22" cy="22" r="16" fill="none" stroke="#22c55e" strokeWidth="4"
              strokeDasharray={`${0.82 * 2 * Math.PI * 16} ${2 * Math.PI * 16}`}
              strokeLinecap="round" transform="rotate(-90 22 22)" />
            <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">82</text>
          </svg>
        </div>
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50">
          <p className="text-[10px] text-neutral-400 mb-1">Загальний баланс</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">124 500 грн</p>
          <div className="flex gap-4 mt-2">
            {([["Готівка", "+12 000", "text-green-500"], ["Рахунки", "+98 500", "text-blue-500"], ["Борги", "−14 000", "text-red-400"]] as const).map(([l, v, c]) => (
              <div key={l}>
                <p className={`text-[11px] font-semibold ${c}`}>{v}</p>
                <p className="text-[10px] text-neutral-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-neutral-400">Витрати по днях</span>
            <span className="text-[10px] font-semibold text-orange-400">цей тиждень</span>
          </div>
          <div className="flex items-end gap-1 h-10">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }}>
                <div className={`w-full h-full rounded-t ${i === 5 ? "bg-orange-400" : i === 6 ? "bg-orange-300 dark:bg-orange-600" : "bg-neutral-200 dark:bg-neutral-700"}`} />
              </div>
            ))}
          </div>
          <div className="flex mt-1">
            {days.map(d => <div key={d} className="flex-1 text-center text-[9px] text-neutral-300 dark:text-neutral-600">{d}</div>)}
          </div>
        </div>
        <div className="space-y-2">
          {[
            { icon: "🛒", name: "АТБ",      sub: "Продукти",       amt: "−320 грн",    income: false },
            { icon: "⛽", name: "ОККО",     sub: "Пальне · 🎁 3%", amt: "−850 грн",   income: false },
            { icon: "💼", name: "Зарплата", sub: "Дохід",           amt: "+42 000 грн", income: true  },
          ].map(({ icon, name, sub, amt, income }) => (
            <div key={name} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 truncate">{name}</p>
                <p className="text-[10px] text-neutral-400">{sub}</p>
              </div>
              <p className={`text-[11px] font-semibold shrink-0 ${income ? "text-green-500" : "text-neutral-700 dark:text-neutral-300"}`}>{amt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MOCK: Budget ─────────────────────────────────────────────
function BudgetMock() {
  const cats = [
    { icon: "🛒", name: "Продукти", plan: 8000, fact: 5200, ok: true  },
    { icon: "☕", name: "Кафе",     plan: 3000, fact: 2800, ok: true  },
    { icon: "⛽", name: "Пальне",   plan: 4000, fact: 4300, ok: false },
    { icon: "💊", name: "Здоров'я", plan: 2000, fact: 800,  ok: true  },
  ];
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xl shadow-neutral-200/50 dark:shadow-black/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">📊 Бюджет · Березень</span>
        <span className="text-[11px] px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-500 font-semibold">17 000 / 24 000</span>
      </div>
      <div className="p-4 space-y-3">
        {cats.map(({ icon, name, plan, fact, ok }) => {
          const pct = Math.min(Math.round(fact / plan * 100), 100);
          return (
            <div key={name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400">{fact.toLocaleString()} / {plan.toLocaleString()}</span>
                  <span className={`text-[10px] font-bold ${ok ? "text-green-500" : "text-red-500"}`}>{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className={`h-full rounded-full ${ok ? "bg-green-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Залишок</span>
          <span className="text-sm font-bold text-green-500">+7 000 грн</span>
        </div>
      </div>
    </div>
  );
}

// ─── MOCK: Envelopes ─────────────────────────────────────────
function EnvelopeMock() {
  const weeks = [
    { w: 1, budget: 7000, spent: 6200, current: false },
    { w: 2, budget: 7000, spent: 7800, current: false },
    { w: 3, budget: 7000, spent: 4100, current: true  },
  ];
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xl shadow-neutral-200/50 dark:shadow-black/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-base">✉️</span>
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Конверти</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 font-semibold">Активно</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Дохід",         value: "42 000 грн",  cls: "text-green-500"  },
            { label: "Обов'язкові",   value: "−14 000 грн", cls: "text-red-400"    },
            { label: "Тижневий",      value: "7 000 грн",   cls: "text-orange-500" },
            { label: "Вільно зараз",  value: "2 900 грн",   cls: "text-blue-500"   },
          ].map(({ label, value, cls }) => (
            <div key={label} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50">
              <p className={`text-sm font-bold ${cls}`}>{value}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {weeks.map(({ w, budget, spent, current }) => {
          const over = spent > budget;
          const pct  = Math.min(spent / budget * 100, 100);
          return (
            <div key={w} className={`p-3 rounded-xl border ${current ? "border-orange-200 dark:border-orange-800/50" : over ? "border-red-200 dark:border-red-900/30" : "border-neutral-100 dark:border-neutral-800"}`}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Тиждень {w}</span>
                  {current && <span className="text-[10px] text-orange-500 font-semibold">◉ зараз</span>}
                </div>
                <span className={`text-xs font-bold ${over ? "text-red-500" : "text-green-500"}`}>
                  {over ? `−${(spent - budget).toLocaleString()}` : `+${(budget - spent).toLocaleString()}`} грн
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className={`h-full rounded-full ${over ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-orange-400"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MOCK: Credits ────────────────────────────────────────────
function CreditMock() {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xl shadow-neutral-200/50 dark:shadow-black/50">
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">💳 Кредити та депозити</span>
      </div>
      <div className="p-4 space-y-3">
        {[
          { icon: "🚗", name: "Автокредит",        type: "Авто · 15.5% річних",   remaining: "186 400 грн",   monthly: "4 200 грн/міс",  pct: 42, alert: false, deposit: false },
          { icon: "🏠", name: "Іпотека",            type: "Іпотека · 8.9% річних", remaining: "1 240 000 грн", monthly: "12 800 грн/міс", pct: 18, alert: true,  deposit: false },
          { icon: "🏦", name: "Депозит ПриватБанк", type: "Депозит · 16% річних",  remaining: "50 000 грн",    monthly: "+666 грн/міс",   pct: 60, alert: false, deposit: true  },
        ].map(({ icon, name, type, remaining, monthly, pct, alert, deposit }) => (
          <div key={name} className={`p-3 rounded-xl border ${alert ? "border-amber-200 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10" : "border-neutral-100 dark:border-neutral-800"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{name}</p>
                <p className="text-[10px] text-neutral-400">{type}</p>
              </div>
              {alert && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-medium shrink-0">⏰ 3 дні</span>}
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400 mb-1.5">
              <span>{deposit ? "На рахунку" : "Залишок"}: {remaining}</span>
              <span className={deposit ? "text-green-500 font-medium" : ""}>{monthly}</span>
            </div>
            <div className="h-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className={`h-full rounded-full ${deposit ? "bg-green-400" : "bg-orange-400"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MOCK: Health Score ───────────────────────────────────────
function HealthMock() {
  const score = 82, r = 52, circ = 2 * Math.PI * r;
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 p-6">
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">❤️ Health Score</p>
      <div className="flex items-center gap-6">
        <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
          <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="10" strokeOpacity="0.08" className="text-neutral-900 dark:text-neutral-100" />
          <circle cx="64" cy="64" r={r} fill="none" stroke="#22c55e" strokeWidth="10"
            strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 64 64)" />
          <text x="64" y="58" textAnchor="middle" fontSize="26" fontWeight="800" fill="currentColor">{score}</text>
          <text x="64" y="76" textAnchor="middle" fontSize="11" fill="#22c55e" fontWeight="600">Відмінно</text>
        </svg>
        <div className="space-y-3 flex-1">
          {["Баланс доходів/витрат", "Немає прострочених", "Є заощадження", "Борг менше 3x доходу"].map(label => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-green-100 dark:bg-green-950/40 text-green-500">
                <Check cls="w-2.5 h-2.5" />
              </div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Features ────────────────────────────────────────────────
const FEATURES = [
  { emoji: "🏦", title: "Рахунки",      tag: "Основа",     desc: "Готівка, банківські картки, депозити — всі рахунки разом. Швидке додавання витрат і доходів." },
  { emoji: "📊", title: "Бюджет",       tag: "Планування", desc: "Плануй витрати по категоріях на місяць. Бач план і факт в реальному часі — і одразу знай де перевитрата." },
  { emoji: "✉️", title: "Конверти",     tag: "Метод",      desc: "Ділиш дохід на тижні — залишок переходить далі як бонус. Класичний метод конвертів у цифровому форматі." },
  { emoji: "💳", title: "Кредити",      tag: "Контроль",   desc: "Іпотека, автокредит, розстрочка — прогрес погашення, наступні платежі і нагадування за 7 днів." },
  { emoji: "📈", title: "Інвестиції",   tag: "Портфель",   desc: "Акції, ОВДП, нерухомість, колекції — відстежуй поточну вартість портфеля без зайвих таблиць." },
  { emoji: "❤️", title: "Health Score", tag: "Аналітика",  desc: "Один показник фінансового здоров'я від 0 до 100. Враховує борги, заощадження, баланс доходів і витрат." },
];

// ─── PAGE ─────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "SoftwareApplication",
        name: "UBudget", applicationCategory: "FinanceApplication", operatingSystem: "Web",
        description: "Простий фінансовий трекер для особистого бюджету",
        offers: { "@type": "Offer", price: "0", priceCurrency: "UAH" }, inLanguage: "uk",
      })}} />

      <div className="space-y-24 sm:space-y-32 pb-24 sm:pb-32">

        {/* Hero — client, знає про авторизацію */}
        <HeroSection />

        {/* Мокапи */}
        <section className="grid sm:grid-cols-2 gap-5 items-start" aria-label="Попередній перегляд">
          <div className="sm:mt-8"><DashboardMock /></div>
          <BudgetMock />
        </section>

        {/* Stats — прибрали "0 реклами" */}
        <section aria-label="Ключові показники">
          <div className="grid grid-cols-2 gap-6 py-10 border-y border-neutral-100 dark:border-neutral-800 max-w-xs mx-auto">
            {[["3 хв", "на старт"], ["100%", "безкоштовно"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100">{v}</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1.5">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section className="space-y-10" aria-labelledby="features-heading">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Що вміє UBudget</h2>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm sm:text-base">Продуманий до деталей. Без перевантаження. Все що потрібно — і нічого зайвого.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ emoji, title, desc, tag }) => (
              <article key={title} className="group p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg hover:shadow-orange-50 dark:hover:shadow-orange-950/20 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">{emoji}</div>
                  <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-2 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800">{tag}</span>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Deep dive: Envelopes */}
        <section className="grid sm:grid-cols-2 gap-10 lg:gap-16 items-center" aria-labelledby="envelopes-heading">
          <div className="space-y-5 order-2 sm:order-1">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest">✉️ Метод конвертів</p>
            <h2 id="envelopes-heading" className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug">Класичний метод —<br />у цифровому форматі</h2>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">Ділиш місячний дохід на тижневі конверти. Зекономив на першому тижні — залишок переходить на наступний як бонус.</p>
            <ul className="space-y-3">
              {["Автоматичний розрахунок тижневого бюджету", "Перехід залишку між тижнями як бонус", "Обов'язкові витрати списуються першими", "Попередження при перевищенні конверта"].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <Check cls="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 sm:order-2"><EnvelopeMock /></div>
        </section>

        {/* Deep dive: Credits */}
        <section className="grid sm:grid-cols-2 gap-10 lg:gap-16 items-center" aria-labelledby="credits-heading">
          <CreditMock />
          <div className="space-y-5">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest">💳 Кредити & Депозити</p>
            <h2 id="credits-heading" className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug">Всі зобов'язання<br />під контролем</h2>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">Іпотека, автокредит, розстрочка, кредитна картка — відстежуй прогрес погашення, наступні платежі і реальну вартість кредиту.</p>
            <ul className="space-y-3">
              {["Нагадування про платежі за 7 днів", "Прогрес погашення кожного кредиту", "Депозити з нарахуванням відсотків", "Підтримка кількох типів кредитів"].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <Check cls="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />{item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Deep dive: Health Score */}
        <section className="grid sm:grid-cols-2 gap-10 lg:gap-16 items-center" aria-labelledby="health-heading">
          <div className="space-y-5 order-2 sm:order-1">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest">❤️ Health Score</p>
            <h2 id="health-heading" className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug">Фінансовий стан<br />в одному числі</h2>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">Health Score — це чесна оцінка твоїх фінансів від 0 до 100. Враховує баланс доходів і витрат, наявність боргів та своєчасність платежів.</p>
            <ul className="space-y-3">
              {["Оновлюється щомісяця автоматично", "Враховує кредити, депозити і баланс", "Показує що саме тягне вниз", "Зрозуміло навіть без фінансових знань"].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <Check cls="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 sm:order-2"><HealthMock /></div>
        </section>

        {/* How it works */}
        <section className="max-w-2xl mx-auto space-y-10" aria-labelledby="how-heading">
          <div className="text-center space-y-3">
            <h2 id="how-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Як це працює</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Чотири кроки до повного контролю</p>
          </div>
          <ol className="space-y-5">
            {[
              { n: "01", title: "Додай рахунки",      desc: "Готівка, картки, кредитки — все в одному місці за 2 хвилини." },
              { n: "02", title: "Фіксуй транзакції",  desc: "Вручну або через імпорт. Категоризація одним тапом." },
              { n: "03", title: "Постав план",         desc: "Задай бюджет по категоріях або активуй метод конвертів." },
              { n: "04", title: "Дивись Health Score", desc: "Отримуй чесну оцінку фінансового здоров'я щомісяця." },
            ].map(({ n, title, desc }) => (
              <li key={n} className="flex gap-5 items-start group">
                <div className="w-12 h-12 shrink-0 rounded-xl border-2 border-neutral-100 dark:border-neutral-800 group-hover:border-orange-300 dark:group-hover:border-orange-700 flex items-center justify-center text-sm font-bold text-neutral-400 group-hover:text-orange-400 transition-all duration-300">{n}</div>
                <div className="pt-2.5">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA — client, ховається для авторизованих */}
        <CtaSection />

      </div>
    </>
  );
}