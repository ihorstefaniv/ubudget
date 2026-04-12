// ФАЙЛ: app/(admin)/layout.tsx
"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/auth";
import { type Role, can } from "@/lib/permissions";

// ─── Role Context ─────────────────────────────────────────────
// Дає доступ до ролі поточного адміна в будь-якому дочірньому компоненті.

const AdminRoleContext = createContext<Role>("admin");

/** Хук для отримання ролі поточного адміна з контексту layout-у. */
export function useAdminRole(): Role {
  return useContext(AdminRoleContext);
}

const Icon = ({ d, cls = "w-5 h-5" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ic = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users:     "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  blog:      "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  tickets:   "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
  settings:  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  docs:      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  live:      "M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
  logout:    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  back:      "M10 19l-7-7m0 0l7-7m-7 7h18",
  menu:      "M4 6h16M4 12h16M4 18h16",
  close:     "M6 18L18 6M6 6l12 12",
};

const NAV_MAIN = [
  { href: "/admin/dashboard", label: "Дашборд",     icon: "dashboard" },
  { href: "/admin/users",     label: "Користувачі", icon: "users"     },
  { href: "/admin/blog",      label: "Блог",         icon: "blog"      },
  { href: "/admin/tickets",   label: "Тикети",       icon: "tickets"   },
];

const NAV_BOTTOM = [
  { href: "/admin/monitor",  label: "Моніторинг",    icon: "live",     superadminOnly: true },
  { href: "/admin/settings", label: "Налаштування", icon: "settings", superadminOnly: false },
  { href: "/admin/docs",     label: "Документація", icon: "docs",     superadminOnly: false },
];

function NavItem({ href, label, icon, active, badge, onClose }: {
  href: string; label: string; icon: string; active: boolean; badge?: boolean; onClose?: () => void;
}) {
  return (
    <Link href={href} onClick={onClose}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? "bg-orange-500 text-white" : "text-white/50 hover:text-white hover:bg-white/8"
      }`}>
      <Icon d={ic[icon as keyof typeof ic]} cls="w-4 h-4 shrink-0" />
      {label}
      {badge && <span className="ml-auto w-2 h-2 rounded-full bg-orange-300 animate-pulse" />}
    </Link>
  );
}

function Sidebar({ pathname, userName, role, onClose, ticketsCount }: {
  pathname: string; userName: string; role: Role; onClose?: () => void; ticketsCount: number;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin-login");
  }

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white font-black text-xs">U</span>
          </div>
          <span className="font-bold text-sm">
            <span className="text-white">Ubudget</span>
            <span className="text-orange-400"> Admin</span>
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <Icon d={ic.close} cls="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_MAIN.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon}
            active={pathname.startsWith(href)}
            badge={icon === "tickets" && ticketsCount > 0}
            onClose={onClose} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-2 space-y-0.5 border-t border-white/10 pt-3">
        {NAV_BOTTOM.filter(item => !item.superadminOnly || can(role, "viewMonitor")).map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon}
            active={pathname.startsWith(href)} onClose={onClose} />
        ))}
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-white hover:bg-white/8 transition-all">
          <Icon d={ic.back} cls="w-4 h-4" />
          На сайт
        </Link>
      </div>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
            {userName?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wide">{role}</p>
          </div>
          <button onClick={handleSignOut} title="Вийти"
            className="text-white/30 hover:text-red-400 transition-colors">
            <Icon d={ic.logout} cls="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-white/20 font-mono px-3 pt-1">
          build: {process.env.NEXT_PUBLIC_BUILD_SHA}
        </p>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [ready, setReady]           = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName]     = useState("");
  const [role, setRole]             = useState<Role>("admin");
  const [ticketsCount, setTicketsCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/admin-login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("full_name, role").eq("id", data.user.id).single();

      if (!profile || !["admin", "superadmin"].includes(profile.role ?? "")) {
        router.replace("/admin-login"); return;
      }

      // Кількість нових тикетів для badge
      const { count } = await supabase
        .from("tickets").select("*", { count: "exact", head: true }).eq("status", "new");

      setUserName(profile.full_name || data.user.email?.split("@")[0] || "Admin");
      setRole(profile.role as Role);
      setTicketsCount(count ?? 0);
      setReady(true);
    });
  }, [router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!ready) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AdminRoleContext.Provider value={role}>
      <div className="min-h-screen bg-neutral-100 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 fixed inset-y-0 left-0 z-30">
          <Sidebar pathname={pathname} userName={userName} role={role} ticketsCount={ticketsCount} />
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Mobile sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-64 z-50 lg:hidden transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar pathname={pathname} userName={userName} role={role} ticketsCount={ticketsCount} onClose={() => setMobileOpen(false)} />
        </aside>

        {/* Main */}
        <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
          <header className="lg:hidden h-12 bg-neutral-950 flex items-center justify-between px-4 shrink-0">
            <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
              <Icon d={ic.menu} cls="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-white">
              <span className="text-orange-400">U</span>budget Admin
            </span>
            <div className="w-5" />
          </header>
          <main className="flex-1 p-5 lg:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AdminRoleContext.Provider>
  );
}