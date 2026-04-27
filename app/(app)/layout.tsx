/**
 * @file app/(app)/layout.tsx
 * @description Головний layout авторизованої частини додатку.
 * Містить: десктопний сайдбар, мобільний сайдбар з overlay,
 * мобільний хедер, глобальну кнопку додавання транзакції.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import AddTransactionModal from "@/components/AddTransactionModal";
import BugReportModal from "@/components/BugReportModal";
import { Icon, icons } from "@/components/ui";
import { FeaturesProvider } from "@/lib/features-context";

/** Версія білду — оновлюй при кожному релізі */
const APP_VERSION = "v1.2.0";

// ─── Theme Toggle ─────────────────────────────────────────────

/**
 * Кнопка перемикання теми (світла/темна).
 * Зберігає вибір у localStorage і застосовує клас "dark" до <html>.
 */
function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Світла тема" : "Темна тема"}
      className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
    >
      <Icon
        d={dark ? icons.sun : icons.moon}
        className="w-4 h-4"
      />
    </button>
  );
}

// ─── Nav config ───────────────────────────────────────────────

/** Всі можливі пункти навігації з ключем модуля (null = завжди видимий) */
const allNavItems: { href: string; label: string; icon: "home"|"wallet"|"bank"|"creditCard"|"trendUp"|"envelope"|"chart"|"user"; moduleKey: string | null }[] = [
  { href: "/dashboard",    label: "Дашборд",           icon: "home",       moduleKey: null },
  { href: "/transactions", label: "Транзакції",         icon: "wallet",     moduleKey: null },
  { href: "/accounts",     label: "Рахунки",            icon: "bank",       moduleKey: null },
  { href: "/budget",       label: "Бюджет",             icon: "chart",      moduleKey: "budget" },
  { href: "/credits",      label: "Кредити & Депозити", icon: "creditCard", moduleKey: "credits" },
  { href: "/investments",  label: "Інвестиції",         icon: "trendUp",    moduleKey: "investments" },
  { href: "/envelopes",    label: "Конверти",           icon: "envelope",   moduleKey: "envelopes" },
  { href: "/household",    label: "Сімейний бюджет",    icon: "user",       moduleKey: "household" },
];

/** Підменю Інструменти */
const toolsNav = [
  { href: "/tools/fuel-prices",  label: "⛽ Ціни на пальне", badge: "new" },
  { href: "/tools/deposit-calc", label: "💰 Калькулятор депозитів" },
  { href: "/tools/credit-calc",  label: "📊 Калькулятор кредитів" },
  { href: "/tools/fuel-calc",    label: "🗺 Витрати пального" },
  { href: "/tools/scenarios",    label: "🔮 Сценарії" },
  { href: "/tools/history",      label: "📜 Фінансова історія" },
  { href: "/tools/health",       label: "❤️ Health Score деталі" },
  { href: "/tools/shock",        label: "🚨 Shock Tracker" },
  { href: "/tools/crisis",       label: "🛑 Режим КРИЗА" },
];

// ─── Sidebar Content ──────────────────────────────────────────

interface SidebarContentProps {
  pathname: string;
  userName: string;
  modules: Record<string, boolean>;
  /** Колбек закриття — є тільки в мобільному варіанті */
  onClose?: () => void;
  onBugReport: () => void;
}

/**
 * Вміст сайдбару — використовується і в десктопному і в мобільному варіанті.
 */
function SidebarContent({ pathname, userName, modules, onClose, onBugReport }: SidebarContentProps) {
  const mainNav = allNavItems.filter(item =>
    item.moduleKey === null || (modules[item.moduleKey] ?? true)
  );
  const router = useRouter();

  /** Розгорнути підменю якщо зараз активна сторінка з /tools */
  const [toolsOpen, setToolsOpen] = useState(pathname.startsWith("/tools"));

  // Ref на <nav> елемент для програмного скролу
  const navRef = useRef<HTMLElement>(null);
  // Ref на контейнер "Інструменти" — щоб скролити до нього при розкритті
  const toolsRef = useRef<HTMLDivElement>(null);

  /**
   * Розгортає/згортає підменю Інструменти з автоскролом:
   * - при розкритті — скролимо вниз до блоку інструментів
   * - при згортанні — скролимо nav вгору на початок
   */
  function toggleTools() {
    const next = !toolsOpen;
    setToolsOpen(next);
    setTimeout(() => {
      if (next) {
        toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        navRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Логотип ── */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        {/*
          Клік на лого → головна (лендінг), а не дашборд.
          target="_self" щоб не відкривалось в новій вкладці.
        */}
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-1.5 group"
          title="На головну"
        >
          {/* Квадратик-акцент як на лендінгу */}
          <div className="w-7 h-7 rounded-lg bg-orange-400 flex items-center justify-center shadow-sm group-hover:bg-orange-500 transition-colors">
            <span className="text-white font-black text-sm leading-none">U</span>
          </div>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Budget
          </span>
        </Link>

        {/* Кнопка закрити — тільки в мобільному drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <Icon d={icons.close} className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Навігація ── */}
      <nav ref={navRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-transparent">

        {/* Основні пункти */}
        {mainNav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              <Icon
                d={icons[icon]}
                className={`w-4 h-4 shrink-0 ${active ? "text-orange-400" : ""}`}
              />
              {label}
            </Link>
          );
        })}

        {/* Підменю Інструменти */}
        <div ref={toolsRef} className="pt-2">
          <button
            onClick={toggleTools}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-150"
          >
            <span className="flex items-center gap-3">
              <Icon d={icons.settings} className="w-4 h-4 shrink-0" />
              Інструменти
            </span>
            <Icon
              d={icons.chevDown}
              className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsOpen ? "rotate-180" : ""}`}
            />
          </button>

          {toolsOpen && (
            <div className="ml-7 mt-0.5 space-y-0.5">
              {toolsNav.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      active
                        ? "text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40"
                        : "text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* ── Нижня частина ── */}
      <div className="px-3 py-4 border-t border-neutral-100 dark:border-neutral-800 space-y-0.5 shrink-0">

        {/* Налаштування */}
        <Link
          href="/settings"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === "/settings"
              ? "bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100"
          }`}
        >
          <Icon d={icons.settings} className="w-4 h-4" />
          Налаштування
        </Link>

        {/* Тема */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Тема</span>
          <ThemeToggle />
        </div>

        {/* Кнопка "Знайшли помилку" */}
        <button
          onClick={() => { onClose?.(); onBugReport(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-400 dark:text-neutral-500 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all text-left"
          title="Повідомити про помилку"
        >
          <Icon d={icons.warn} className="w-4 h-4 shrink-0" />
          Знайшли помилку?
        </button>

        {/* Юзер + версія + вихід */}
        <div className="px-3 py-2.5 rounded-xl">
          <div className="flex items-center gap-3">
            {/* Аватар — перша літера імені */}
            <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0">
              {userName?.[0]?.toUpperCase() ?? "U"}
            </div>

            <div className="flex-1 min-w-0">
              {/* Повне ім'я */}
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
                {userName}
              </p>
              {/* Версія білду — дрібно під іменем */}
              <p className="text-[10px] text-neutral-400 dark:text-neutral-600 leading-tight">
                {APP_VERSION}
              </p>
            </div>

            {/* Кнопка виходу */}
            <button
              onClick={handleSignOut}
              className="text-neutral-400 hover:text-red-400 transition-colors shrink-0"
              title="Вийти"
            >
              <Icon d={icons.logout} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP LAYOUT ───────────────────────────────────────────────

/**
 * Кореневий layout авторизованої зони.
 * Перевіряє авторизацію і редіректить на /login якщо не залогінений.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userName, setUserName]         = useState("Користувач");
  const [showTxModal, setShowTxModal]   = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [modules, setModules]           = useState<Record<string, boolean>>({
    budget: true, credits: true, investments: true, envelopes: true, household: true,
  });

  // Завантажуємо ім'я юзера, перевіряємо авторизацію і завантажуємо модулі
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      const name =
        data.user.user_metadata?.full_name ||
        data.user.email?.split("@")[0] ||
        "Користувач";
      setUserName(name);

      const { data: profile } = await supabase
        .from("profiles").select("full_name, modules").eq("id", data.user.id).single();
      if (profile?.full_name) setUserName(profile.full_name);
      if (profile?.modules)   setModules(m => ({ ...m, ...profile.modules }));
    });
  }, [router]);

  // Закриваємо мобільний drawer при переході між сторінками
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <FeaturesProvider>
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">

      {/* ── Десктопний сайдбар (фіксований, 240px) ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 fixed inset-y-0 left-0 bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 z-30">
        <SidebarContent pathname={pathname} userName={userName} modules={modules} onBugReport={() => setShowBugModal(true)} />
      </aside>

      {/* ── Мобільний overlay (затемнення) ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Мобільний сайдбар (drawer з лівого краю) ── */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-neutral-900 z-50 lg:hidden transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          userName={userName}
          modules={modules}
          onClose={() => setMobileOpen(false)}
          onBugReport={() => setShowBugModal(true)}
        />
      </aside>

      {/* ── Основний контент ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Мобільний хедер (тільки < lg) */}
        <header className="lg:hidden sticky top-0 z-20 h-14 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-neutral-600 dark:text-neutral-400"
            aria-label="Відкрити меню"
          >
            <Icon d={icons.menu} className="w-5 h-5" />
          </button>

          {/* Лого в мобільному хедері */}
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-orange-400 flex items-center justify-center">
              <span className="text-white font-black text-xs leading-none">U</span>
            </div>
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">Budget</span>
          </Link>

          <ThemeToggle />
        </header>

        {/* Сторінка */}
        <main className="flex-1 p-5 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ── Глобальна кнопка + (додати транзакцію) ── */}
      {/* Прихована на сторінці транзакцій щоб не дублювати */}
      {pathname !== "/transactions" && (
        <button
          onClick={() => setShowTxModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-orange-400 text-white shadow-lg shadow-orange-200 dark:shadow-none hover:bg-orange-500 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-30 lg:bottom-8 lg:right-8"
          title="Додати транзакцію"
          aria-label="Додати транзакцію"
        >
          <Icon d={icons.plus} className="w-6 h-6" />
        </button>
      )}

      {/* Модалка додавання транзакції */}
      {showTxModal && (
        <AddTransactionModal
          onClose={() => setShowTxModal(false)}
          onSaved={() => setShowTxModal(false)}
        />
      )}

      {/* Модалка звіту про помилку */}
      {showBugModal && (
        <BugReportModal
          sourceUrl={pathname}
          onClose={() => setShowBugModal(false)}
        />
      )}
    </div>
    </FeaturesProvider>
  );
}