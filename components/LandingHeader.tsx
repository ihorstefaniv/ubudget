"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  if (!mounted) return <div className="w-9 h-9" />;
  return (
    <button onClick={toggle} className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:border-orange-300 hover:text-orange-400 transition-all">
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
      )}
    </button>
  );
}

// ── ОНОВЛЕНО: правильні посилання на /free/tools/* ──
const TOOLS = [
  { href: "/free/tools",                label: "🧰 Всі інструменти" },
  { href: "/free/tools/fuel-prices",    label: "⛽ Ціни на пальне" },
  { href: "/free/tools/fuel-free-calc", label: "🗺 Калькулятор пального" },
  { href: "/free/tools/deposit-calc",   label: "💰 Калькулятор депозиту" },
  { href: "/free/tools/credit-calc",    label: "📊 Калькулятор кредиту" },
  { href: "/free/tools/inflation-calc", label: "🔥 Калькулятор інфляції" },
];

function UserMenu({ name, balance, onSignOut }: { name: string; balance: number; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const fmt = (n: number) => n.toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-orange-300 transition-all">
        <span className="hidden sm:block text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(balance)} грн</span>
        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />
        <div className="w-7 h-7 rounded-lg bg-orange-400 flex items-center justify-center"><span className="text-xs font-bold text-white">{initials || "U"}</span></div>
        <span className="hidden sm:block text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-[100px] truncate">{name.split(" ")[0]}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">Вітаю, {name.split(" ")[0]}!</p>
            <p className="text-xs text-neutral-400 mt-0.5">{fmt(balance)} грн · баланс</p>
          </div>
          <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-500 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Налаштування
          </Link>
          <button onClick={() => { setOpen(false); onSignOut(); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Вийти
          </button>
        </div>
      )}
    </div>
  );
}

export default function LandingHeader() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen]   = useState(false);
  const [user, setUser]             = useState<{ name: string; balance: number } | null>(null);
  const [mounted, setMounted]       = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) { if (!toolsRef.current?.contains(e.target as Node)) setToolsOpen(false); }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    setMounted(true);
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setUser(null); return; }
      const u = session.user;
      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Користувач";
      const { data: accounts } = await supabase.from("accounts").select("balance, currency").eq("user_id", u.id).eq("is_active", true).eq("is_archived", false);
      const balance = (accounts ?? []).filter((a: any) => a.currency === "UAH").reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0);
      setUser({ name, balance });
    }
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session?.user) { setUser(null); return; }
      const u = session.user;
      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Користувач";
      supabase.from("accounts").select("balance, currency").eq("user_id", u.id).eq("is_active", true).eq("is_archived", false).then(({ data: accounts }: any) => {
        const balance = (accounts ?? []).filter((a: any) => a.currency === "UAH").reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0);
        setUser({ name, balance });
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  const isAuthed = !!user;
  const navLinks = [
    { href: "/blog",  label: "Блог",             icon: "✍️" },
    { href: "/about", label: "Про нас",           icon: "👋" },
    { href: "/faq",   label: "Питання/Відповіді", icon: "❓" },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800 shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-orange-400 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">U</span>
            </div>
            <span className="font-bold text-lg">
              <span className="text-orange-400">U</span>
              <span className="text-neutral-900 dark:text-neutral-100">Budget</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {isAuthed ? (
              <Link href="/dashboard" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all">
                🏠 Мій кабінет
              </Link>
            ) : (
              <div className="relative" ref={toolsRef}>
                <button onClick={() => setToolsOpen(v => !v)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all">
                  🛠 Інструменти
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {toolsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Безкоштовно · Без реєстрації</p>
                    </div>
                    {TOOLS.map((t, i) => (
                      <Link key={t.href} href={t.href} onClick={() => setToolsOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-500 transition-colors ${i === 0 ? "font-semibold border-b border-neutral-50 dark:border-neutral-800/50" : ""}`}>
                        {t.label}
                        {i === 0 && <span className="ml-auto text-xs text-orange-400">→</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {mounted && (
              isAuthed && user ? (
                <UserMenu name={user.name} balance={user.balance} onSignOut={handleSignOut} />
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all">Увійти</Link>
                  <Link href="/register" className="px-4 py-2 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 active:scale-95 transition-all shadow-sm shadow-orange-200 dark:shadow-none">Зареєструватись</Link>
                </div>
              )
            )}
            <button onClick={() => setMobileOpen(v => !v)} className="md:hidden w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center gap-1.5 hover:border-orange-300 transition-all">
              <span className={`block w-4 h-0.5 bg-neutral-600 dark:bg-neutral-400 transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-4 h-0.5 bg-neutral-600 dark:bg-neutral-400 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-4 h-0.5 bg-neutral-600 dark:bg-neutral-400 transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-72 bg-white dark:bg-neutral-950 shadow-2xl transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-100 dark:border-neutral-800">
            <span className="font-bold"><span className="text-orange-400">U</span><span className="text-neutral-900 dark:text-neutral-100">Budget</span></span>
            <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {isAuthed && user && (
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-orange-50/50 dark:bg-orange-950/10">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Вітаю, {user.name.split(" ")[0]}!</p>
              <p className="text-xs text-neutral-400 mt-0.5">{user.balance.toLocaleString("uk-UA")} грн · баланс</p>
            </div>
          )}
          <div className="px-4 py-4 space-y-1 overflow-y-auto">
            {isAuthed ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-orange-500 bg-orange-50 dark:bg-orange-950/20">🏠 Мій кабінет</Link>
            ) : (
              <div className="px-2 pt-1 pb-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">🛠 Інструменти</p>
                {TOOLS.map(t => (
                  <Link key={t.href} href={t.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-orange-500 transition-colors">{t.label}</Link>
                ))}
              </div>
            )}
            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">{l.icon} {l.label}</Link>
            ))}
            {isAuthed && (
              <>
                <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">⚙️ Налаштування</Link>
                <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">🚪 Вийти</button>
              </>
            )}
          </div>
          {!isAuthed && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block w-full py-3 rounded-xl bg-orange-400 text-white text-sm font-bold text-center hover:bg-orange-500 transition-colors">Зареєструватись</Link>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Увійти</Link>
            </div>
          )}
        </div>
      </div>

      <div className="h-16" />
    </>
  );
}