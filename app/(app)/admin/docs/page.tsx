// ФАЙЛ: app/(admin)/docs/page.tsx
// URL: /admin/docs
"use client";

const Icon = ({ d, cls = "w-5 h-5" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const SECTIONS = [
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "Управління користувачами",
    items: ["Ролі та грейди", "Блокування акаунтів", "CRUD операції", "Експорт даних"],
  },
  {
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    title: "Блог та контент",
    items: ["Markdown редактор", "SEO налаштування", "Публікація статей", "Управління slug"],
  },
  {
    icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
    title: "Helpdesk",
    items: ["Статуси тикетів", "Відповіді адміна", "Фільтрація звернень", "Email сповіщення"],
  },
  {
    icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
    title: "Feature Flags",
    items: ["Вмикання модулів", "Maintenance mode", "A/B тестування", "Поступовий rollout"],
  },
  {
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z",
    title: "Telegram інтеграція",
    items: ["Налаштування бота", "Chat ID", "Типи сповіщень", "Тестування"],
  },
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Безпека",
    items: ["Ролі superadmin/admin", "Service Role Key", "RLS політики Supabase", "Логування дій"],
  },
];

export default function AdminDocsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Документація</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Довідник по адмін-панелі UBudget</p>
      </div>

      {/* In progress banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">В розробці</span>
          </div>
          <h2 className="text-lg font-bold mb-1">Документація поповнюється</h2>
          <p className="text-sm text-orange-100 max-w-md">
            Повна документація з прикладами, схемами бази даних і відеоінструкціями з'явиться у наступних релізах.
            Поки що тут — структура розділів та короткий огляд.
          </p>
        </div>
        {/* Decorative */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl opacity-20 select-none">📖</div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">Швидкі посилання</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Supabase Dashboard", href: "https://supabase.com/dashboard" },
            { label: "Next.js Docs",       href: "https://nextjs.org/docs"         },
            { label: "Tailwind CSS",       href: "https://tailwindcss.com/docs"    },
            { label: "Vercel",             href: "https://vercel.com/dashboard"    },
            { label: "GitHub Repo",        href: "#"                               },
            { label: "Figma Design",       href: "#"                               },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all">
              <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Sections grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {SECTIONS.map(({ icon, title, items }) => (
          <div key={title} className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Icon d={icon} cls="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
            </div>
            <ul className="space-y-1.5">
              {items.map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
                  {item}
                  <span className="ml-auto text-[10px] text-neutral-300 bg-neutral-100 px-1.5 py-0.5 rounded">скоро</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* SQL Schema */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">SQL — таблиці адмінки</h2>
        <pre className="text-xs font-mono bg-neutral-950 text-green-400 rounded-xl p-4 overflow-x-auto leading-relaxed">{`-- Налаштування сайту
CREATE TABLE site_settings (
  key         text PRIMARY KEY,
  value       text,
  updated_at  timestamptz DEFAULT now()
);

-- Блог
CREATE TABLE posts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title        text NOT NULL,
  slug         text UNIQUE NOT NULL,
  content      text,
  excerpt      text,
  status       text DEFAULT 'draft',
  published_at timestamptz,
  meta_title   text,
  meta_desc    text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Тикети
CREATE TABLE tickets (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  number      text GENERATED ALWAYS AS 
              ('T-' || LPAD(id::text, 4, '0')) STORED,
  user_id     uuid REFERENCES auth.users(id),
  email       text,
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text DEFAULT 'new',
  admin_reply text,
  created_at  timestamptz DEFAULT now()
);

-- Роль в profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';`}
        </pre>
      </div>
    </div>
  );
}