"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { Icon, icons } from "@/components/ui";

const APP_VERSION = "v0.1 · ERP";

// ─── Theme Toggle ─────────────────────────────────────────────

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("erp-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("erp-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Світла тема" : "Темна тема"}
      className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
    >
      <Icon d={dark ? icons.sun : icons.moon} className="w-4 h-4" />
    </button>
  );
}

// ─── Nav config ───────────────────────────────────────────────

const navItems = [
  { href: "/dashboard",      label: "Дашборд",      icon: icons.home       },
  { href: "/warehouse",      label: "Склад",         icon: icons.bag        },
  { href: "/counterparties", label: "Контрагенти",   icon: icons.users      },
  { href: "/crm",            label: "CRM",           icon: icons.pipeline   },
  { href: "/production",     label: "Виробництво",   icon: icons.factory    },
  { href: "/finance",        label: "Фінанси",       icon: icons.wallet     },
  { href: "/processes",      label: "Процеси",       icon: icons.doc        },
];

// ─── Sidebar ──────────────────────────────────────────────────

interface SidebarProps {
  pathname: string;
  userName: string;
  companyName: string;
  onClose?: () => void;
  onSignOut: () => void;
}

function SidebarContent({ pathname, userName, companyName, onClose, onSignOut }: SidebarProps) {
  const navRef = useRef<HTMLElement>(null);

  return (
    <div className="flex flex-col h-full">

      {/* Лого */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-orange-400 flex items-center justify-center shadow-sm group-hover:bg-orange-500 transition-colors">
            <span className="text-white font-black text-sm leading-none">U</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Budget</span>
            <span className="text-[10px] font-bold text-orange-400 px-1.5 py-0.5 bg-orange-50 dark:bg-orange-950/30 rounded-md leading-none">ERP</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            <Icon d={icons.close} className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Компанія */}
      {companyName && (
        <div className="px-5 py-2.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <p className="text-xs text-neutral-400">Компанія</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{companyName}</p>
        </div>
      )}

      {/* Навігація */}
      <nav ref={navRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-transparent">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
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
              <Icon d={icon} className={`w-4 h-4 shrink-0 ${active ? "text-orange-400" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Нижня частина */}
      <div className="px-3 py-4 border-t border-neutral-100 dark:border-neutral-800 space-y-0.5 shrink-0">
        <Link
          href="/settings"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname.startsWith("/settings")
              ? "bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100"
          }`}
        >
          <Icon d={icons.settings} className="w-4 h-4" />
          Налаштування
        </Link>

        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Тема</span>
          <ThemeToggle />
        </div>

        <a
          href="https://ubudget.net/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-400 dark:text-neutral-500 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all"
        >
          <Icon d={icons.arrowRight} className="w-4 h-4 shrink-0 rotate-180" />
          UBudget особистий
        </a>

        {/* Юзер */}
        <div className="px-3 py-2.5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0">
              {userName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">{userName}</p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-600 leading-tight">{APP_VERSION}</p>
            </div>
            <button onClick={onSignOut} className="text-neutral-400 hover:text-red-400 transition-colors shrink-0" title="Вийти">
              <Icon d={icons.logout} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName]     = useState("Користувач");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      const name =
        data.user.user_metadata?.full_name ||
        data.user.email?.split("@")[0] ||
        "Користувач";
      setUserName(name);

      const { data: company } = await supabase
        .from("erp_companies")
        .select("name")
        .eq("owner_id", data.user.id)
        .limit(1)
        .maybeSingle();
      if (company?.name) setCompanyName(company.name);
    });
  }, [router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">

      {/* Десктопний сайдбар */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 fixed inset-y-0 left-0 bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 z-30">
        <SidebarContent pathname={pathname} userName={userName} companyName={companyName} onSignOut={handleSignOut} />
      </aside>

      {/* Мобільний overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Мобільний drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-neutral-900 z-50 lg:hidden transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent pathname={pathname} userName={userName} companyName={companyName} onClose={() => setMobileOpen(false)} onSignOut={handleSignOut} />
      </aside>

      {/* Основний контент */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen overflow-x-hidden">

        {/* Мобільний хедер */}
        <header className="lg:hidden sticky top-0 z-20 h-14 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-4">
          <button onClick={() => setMobileOpen(true)} className="text-neutral-600 dark:text-neutral-400" aria-label="Відкрити меню">
            <Icon d={icons.menu} className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-orange-400 flex items-center justify-center">
              <span className="text-white font-black text-xs leading-none">U</span>
            </div>
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">ERP</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-5 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
