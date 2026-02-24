"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import TransactionModal from "@/components/TransactionModal";

// ─── Theme Toggle ─────────────────────────────────────────────
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
      className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
    >
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const icons = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  accounts: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  credits: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  transactions: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  investments: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  envelopes: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  budget: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  household: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  tools: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  chevron: "M19 9l-7 7-7-7",
  close: "M6 18L18 6M6 6l12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
};

// ─── Nav items ────────────────────────────────────────────────
const mainNav = [
  { href: "/dashboard", label: "Дашборд", icon: "dashboard" },
  { href: "/transactions", label: "Транзакції", icon: "transactions" },
  { href: "/accounts", label: "Рахунки", icon: "accounts" },
  { href: "/credits", label: "Кредити & Депозити", icon: "credits" },
  { href: "/investments", label: "Інвестиції", icon: "investments" },
  { href: "/envelopes", label: "Конверти", icon: "envelopes" },
  { href: "/budget", label: "Бюджет", icon: "budget" },
  { href: "/household", label: "Сімейний бюджет", icon: "household" },
];

const toolsNav = [
  { href: "/tools/deposit-calc", label: "Калькулятор депозитів" },
  { href: "/tools/credit-calc", label: "Калькулятор кредитів" },
  { href: "/tools/fuel-calc", label: "Витрати пального" },
  { href: "/tools/scenarios", label: "Сценарії" },
  { href: "/tools/history", label: "Фінансова історія" },
  { href: "/tools/health", label: "Health Score деталі" },
  { href: "/tools/shock", label: "Shock Tracker" },
  { href: "/tools/crisis", label: "🚨 Режим КРИЗА" },
];

// ─── Sidebar content ──────────────────────────────────────────
function SidebarContent({
  pathname,
  userName,
  onClose,
}: {
  pathname: string;
  userName: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [toolsOpen, setToolsOpen] = useState(
    pathname.startsWith("/tools")
  );

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        <Link href="/dashboard" onClick={onClose} className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          <span className="text-orange-400">U</span>Budget
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
            <Icon d={icons.close} className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-transparent">
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
              <Icon d={icons[icon as keyof typeof icons]} className={`w-4.5 h-4.5 shrink-0 ${active ? "text-orange-400" : ""}`} />
              {label}
            </Link>
          );
        })}

        {/* Tools section */}
        <div className="pt-2">
          <button
            onClick={() => setToolsOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-150"
          >
            <span className="flex items-center gap-3">
              <Icon d={icons.tools} className="w-4.5 h-4.5 shrink-0" />
              Інструменти
            </span>
            <Icon
              d={icons.chevron}
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

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-neutral-100 dark:border-neutral-800 space-y-0.5 shrink-0">
        <Link
          href="/settings"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === "/settings"
              ? "bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100"
          }`}
        >
          <Icon d={icons.settings} className="w-4.5 h-4.5" />
          Налаштування
        </Link>

        {/* Theme toggle row */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Тема</span>
          <ThemeToggle />
        </div>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium truncate flex-1">
            {userName}
          </span>
          <button
            onClick={handleSignOut}
            className="text-neutral-400 hover:text-red-400 transition-colors"
            title="Вийти"
          >
            <Icon d={icons.logout} className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("Користувач");
  const [showTxModal, setShowTxModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      const name =
        data.user.user_metadata?.full_name ||
        data.user.email?.split("@")[0] ||
        "Користувач";
      setUserName(name);
    });
  }, [router]);

  // Закрити мобільне меню при зміні роуту
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 fixed inset-y-0 left-0 bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 z-30">
        <SidebarContent pathname={pathname} userName={userName} />
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-neutral-900 z-50 lg:hidden transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          userName={userName}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 h-14 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-neutral-600 dark:text-neutral-400"
          >
            <Icon d={icons.menu} className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            <span className="text-orange-400">U</span>Budget
          </span>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-5 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global quick-add button */}
      {pathname !== "/transactions" && (
        <button
          onClick={() => setShowTxModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-orange-400 text-white shadow-lg shadow-orange-200 dark:shadow-none hover:bg-orange-500 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-30 lg:bottom-8 lg:right-8"
          title="Додати транзакцію"
        >
          <Icon d={icons.close} className="w-6 h-6 rotate-45" />
        </button>
      )}

      {showTxModal && (
        <TransactionModal
          onClose={() => setShowTxModal(false)}
          onAdd={(tx) => {
            console.log("New transaction:", tx);
            setShowTxModal(false);
          }}
        />
      )}
    </div>
  );
}