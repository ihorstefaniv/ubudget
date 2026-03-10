// ФАЙЛ: app/(app)/admin/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/auth";
import { getSystemHealth, getAdminLogs } from "../actions/admin-users";

const Icon = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  users:   "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  new:     "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  tickets: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
  blog:    "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  check:   "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  warn:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  clock:   "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  ping:    "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
  terminal: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  arrow:   "M5 12h14M13 6l6 6-6 6",
};

interface Stats { totalUsers: number; newThisWeek: number; openTickets: number; totalPosts: number; publishedPosts: number; activeUsers: number; }
interface DayCount { date: string; count: number; label: string; }
interface RecentUser { id: string; full_name: string | null; role: string; created_at: string; }
interface RecentTicket { id: number; number: string; subject: string; status: string; created_at: string; email: string; }
interface TopPost { id: string; title: string; slug: string; status: string; created_at: string; }
interface Log { id: string; event: string; detail: string | null; created_at: string; level: string; }
interface Health {
  db: { ok: boolean; latency: number }; auth: { ok: boolean }; storage: { ok: boolean };
  posts: { count: number }; users: { count: number }; tickets: { open: number };
}
interface ModuleStat { label: string; icon: string; count: number; href: string; }

const TICKET_STATUS: Record<string, { cls: string; label: string }> = {
  new:         { cls: "bg-blue-100 text-blue-700",       label: "Новий"    },
  in_progress: { cls: "bg-amber-100 text-amber-700",     label: "В роботі" },
  closed:      { cls: "bg-neutral-100 text-neutral-500", label: "Закрито"  },
};
const LOG_COLORS: Record<string, string> = {
  info: "text-green-400", warn: "text-amber-400", error: "text-red-400",
};

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string; icon: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? "bg-orange-500 text-white" : "bg-white border border-neutral-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-orange-100" : "text-neutral-400"}`}>{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? "bg-white/20" : "bg-neutral-100"}`}>
          <Icon d={icon} cls={`w-4 h-4 ${accent ? "text-white" : "text-neutral-500"}`} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${accent ? "text-white" : "text-neutral-900"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-orange-100" : "text-neutral-400"}`}>{sub}</p>}
    </div>
  );
}

function BarChart({ data, color }: { data: DayCount[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => {
        const h = Math.max((d.count / max) * 100, 4);
        const isToday = i === data.length - 1;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            {d.count > 0 && <span className="text-[10px] text-neutral-500 font-medium">{d.count}</span>}
            <div className="w-full flex-1 flex items-end">
              <div className={`w-full rounded-t-md transition-all duration-500 ${isToday ? color : color.replace("500","200")}`}
                style={{ height: `${h}%` }} />
            </div>
            <span className="text-[10px] text-neutral-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({ title, sub, value, valueColor, data, color }: {
  title: string; sub: string; value: number; valueColor: string;
  data: DayCount[]; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
          <p className="text-xs text-neutral-400">за тиждень</p>
        </div>
      </div>
      <BarChart data={data} color={color} />
    </div>
  );
}

function SystemHealth({ health, lastPing, onPing, pinging }: {
  health: Health | null; lastPing: string; onPing: () => void; pinging: boolean;
}) {
  if (!health) return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  const checks = [
    { label: "База даних (Supabase)", ok: health.db.ok,      detail: health.db.ok ? `${health.db.latency}ms` : "Недоступна" },
    { label: "Auth",                  ok: health.auth.ok,    detail: health.auth.ok ? "Активна" : "Помилка" },
    { label: "Storage",               ok: health.storage.ok, detail: "Доступне" },
  ];
  const allOk = checks.every(c => c.ok);
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">Здоров'я системи</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${allOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {allOk ? "● OK" : "● Проблема"}
          </span>
        </div>
        <button onClick={onPing} disabled={pinging} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors disabled:opacity-50">
          <Icon d={ic.refresh} cls={`w-4 h-4 ${pinging ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="space-y-2.5 mb-4">
        {checks.map(({ label, ok, detail }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon d={ok ? ic.check : ic.warn} cls={`w-4 h-4 ${ok ? "text-green-500" : "text-red-400"}`} />
              <span className="text-sm text-neutral-700">{label}</span>
            </div>
            <span className={`text-xs font-mono ${ok ? "text-neutral-400" : "text-red-400"}`}>{detail}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100">
        {[{ label: "Users", value: health.users.count }, { label: "Posts", value: health.posts.count }, { label: "Tickets", value: health.tickets.open }]
          .map(({ label, value }) => (
            <div key={label} className="text-center p-2 bg-neutral-50 rounded-xl">
              <p className="text-lg font-bold text-neutral-800">{value}</p>
              <p className="text-[10px] text-neutral-400">{label}</p>
            </div>
          ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral-400">
        <Icon d={ic.clock} cls="w-3 h-3" />Пінг: {lastPing}
      </div>
    </div>
  );
}

function ModuleStats({ modules }: { modules: ModuleStat[] }) {
  const icons: Record<string, string> = { "Конверти":"✉️","Рахунки":"🏦","Транзакції":"💸","Кредити":"📋","Домогосподарство":"🏠","Інвестиції":"📈" };
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <h2 className="text-sm font-semibold text-neutral-900 mb-4">Модулі — обсяг даних</h2>
      <div className="grid grid-cols-2 gap-3">
        {modules.map(m => (
          <a key={m.label} href={m.href}
            className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all group">
            <span className="text-xl shrink-0">{icons[m.label] ?? "📦"}</span>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">{m.label}</p>
              <p className="text-base font-bold text-neutral-800 group-hover:text-orange-600 transition-colors">{m.count}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function ActivityConsole({ logs, loading, onRefresh }: { logs: Log[]; loading: boolean; onRefresh: () => void; }) {
  const [filter, setFilter] = useState<"all"|"info"|"warn"|"error">("all");
  const filtered = logs.filter(l => filter === "all" || l.level === filter);
  const LOG_LIGHT: Record<string, string> = { info: "text-blue-600", warn: "text-amber-600", error: "text-red-600" };
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <Icon d={ic.terminal} cls="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-semibold text-neutral-700">Лог активності</span>
          <span className="text-xs text-neutral-400 font-mono">{filtered.length} подій</span>
        </div>
        <div className="flex items-center gap-1">
          {(["all","info","warn","error"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === f
                  ? f==="error" ? "bg-red-100 text-red-600"
                  : f==="warn"  ? "bg-amber-100 text-amber-600"
                  : f==="info"  ? "bg-blue-100 text-blue-600"
                  : "bg-neutral-100 text-neutral-700"
                  : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"}`}>{f}</button>
          ))}
          <button onClick={onRefresh} disabled={loading}
            className="ml-1 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-40">
            <Icon d={ic.refresh} cls={`w-3.5 h-3.5 ${loading?"animate-spin":""}`}/>
          </button>
        </div>
      </div>
      <div className="font-mono text-xs p-4 h-52 overflow-y-auto space-y-1.5 bg-neutral-50">
        {loading ? <span className="text-neutral-400">Завантаження...</span>
          : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-neutral-400">{logs.length===0 ? "Логів ще немає — таблиця admin_logs порожня" : `Немає подій типу "${filter}"`}</span>
            </div>
          ) : filtered.map(log => (
            <div key={log.id} className="flex gap-3 leading-relaxed py-0.5 hover:bg-neutral-100 px-1 rounded transition-colors">
              <span className="text-neutral-400 shrink-0 tabular-nums">
                {new Date(log.created_at).toLocaleTimeString("uk-UA",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
              </span>
              <span className={`shrink-0 w-10 font-semibold ${LOG_LIGHT[log.level]??"text-neutral-500"}`}>{log.level}</span>
              <span className="text-neutral-700">{log.event}</span>
              {log.detail && <span className="text-neutral-400 truncate">{log.detail}</span>}
            </div>
          ))}
      </div>
      <div className="px-5 py-2.5 border-t border-neutral-100 flex items-center gap-2">
        <Icon d={ic.ping} cls="w-3 h-3 text-green-500"/>
        <span className="text-[10px] text-neutral-400 font-mono">Realtime monitoring · оновлюється кожні 30с</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [regChart, setRegChart]           = useState<DayCount[]>([]);
  const [ticketChart, setTicketChart]     = useState<DayCount[]>([]);
  const [recentUsers, setRecentUsers]     = useState<RecentUser[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [topPosts, setTopPosts]           = useState<TopPost[]>([]);
  const [modules, setModules]             = useState<ModuleStat[]>([]);
  const [health, setHealth]               = useState<Health | null>(null);
  const [logs, setLogs]                   = useState<Log[]>([]);
  const [logsLoading, setLogsLoading]     = useState(false);
  const [pinging, setPinging]             = useState(false);
  const [lastPing, setLastPing]           = useState("—");
  const [loading, setLoading]             = useState(true);

  const ping = useCallback(async () => {
    setPinging(true);
    try {
      const h = await getSystemHealth();
      setHealth(h);
      setLastPing(new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch { /* ignore */ }
    setPinging(false);
  }, []);

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    try { setLogs(await getAdminLogs(100)); } catch { /* table may not exist */ }
    setLogsLoading(false);
  }, []);

  useEffect(() => {
    load();
    ping();
    refreshLogs();
    const interval = setInterval(() => { ping(); refreshLogs(); }, 30_000);
    return () => clearInterval(interval);
  }, [ping, refreshLogs]);

  async function load() {
    const supabase = createClient();
    const days: DayCount[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split("T")[0], label: d.toLocaleDateString("uk-UA", { weekday: "short" }), count: 0 };
    });
    const weekAgo = days[0].date;

    const [
      { count: totalUsers }, { count: newThisWeek }, { count: openTickets },
      { count: totalPosts }, { count: publishedPosts }, { count: activeUsers },
      { data: lastUsers }, { data: lastTickets },
      { data: regData }, { data: ticketData },
      { data: postsData },
      { count: envelopesCount }, { count: accountsCount },
      { count: transactionsCount }, { count: creditsCount },
      { count: householdCount }, { count: investmentsCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", `${weekAgo}T00:00:00`),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", new Date(Date.now() - 30*24*60*60*1000).toISOString()),
      supabase.from("tickets").select("*", { count: "exact", head: true }).neq("status", "closed"),
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("tickets").select("id, number, subject, status, created_at, email").order("created_at", { ascending: false }).limit(5),
      supabase.from("profiles").select("created_at").gte("created_at", `${weekAgo}T00:00:00`),
      supabase.from("tickets").select("created_at").gte("created_at", `${weekAgo}T00:00:00`),
      supabase.from("posts").select("id, title, slug, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("envelopes").select("*", { count: "exact", head: true }),
      supabase.from("accounts").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase.from("credits").select("*", { count: "exact", head: true }),
      supabase.from("household_items").select("*", { count: "exact", head: true }),
      supabase.from("investments").select("*", { count: "exact", head: true }),
    ]);

    // Charts
    const regDays    = days.map(d => ({ ...d }));
    const ticketDays = days.map(d => ({ ...d }));
    (regData ?? []).forEach((r: { created_at: string }) => {
      const day = regDays.find(d => d.date === r.created_at.split("T")[0]); if (day) day.count++;
    });
    (ticketData ?? []).forEach((r: { created_at: string }) => {
      const day = ticketDays.find(d => d.date === r.created_at.split("T")[0]); if (day) day.count++;
    });

    setStats({ totalUsers: totalUsers??0, newThisWeek: newThisWeek??0, openTickets: openTickets??0, totalPosts: totalPosts??0, publishedPosts: publishedPosts??0, activeUsers: activeUsers??0 });
    setRegChart(regDays);
    setTicketChart(ticketDays);
    setRecentUsers(lastUsers ?? []);
    setRecentTickets(lastTickets ?? []);
    setTopPosts((postsData ?? []) as TopPost[]);
    setModules([
      { label: "Конверти",        icon: "✉️", count: envelopesCount    ?? 0, href: "/envelopes"    },
      { label: "Рахунки",         icon: "🏦", count: accountsCount     ?? 0, href: "/accounts"     },
      { label: "Транзакції",      icon: "💸", count: transactionsCount ?? 0, href: "/transactions" },
      { label: "Кредити",         icon: "📋", count: creditsCount      ?? 0, href: "/credits"      },
      { label: "Домогосподарство",icon: "🏠", count: householdCount    ?? 0, href: "/household"    },
      { label: "Інвестиції",      icon: "📈", count: investmentsCount  ?? 0, href: "/investments"  },
    ]);
    setLoading(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Дашборд</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button onClick={() => { load(); ping(); refreshLogs(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100 transition-all">
          <Icon d={ic.refresh} /> Оновити
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Всього користувачів" value={stats?.totalUsers ?? 0}   sub={`+${stats?.newThisWeek} цього тижня`} icon={ic.users} accent />
        <StatCard label="Активних (30 днів)"  value={stats?.activeUsers ?? 0}  sub="були активні"                         icon={ic.users}       />
        <StatCard label="Нових за тиждень"    value={stats?.newThisWeek ?? 0}                                               icon={ic.new}         />
        <StatCard label="Відкриті тикети"     value={stats?.openTickets ?? 0}  sub="потребують уваги"                      icon={ic.tickets}     />
        <StatCard label="Всього публікацій"   value={stats?.totalPosts ?? 0}                                                icon={ic.blog}        />
        <StatCard label="Опубліковано"        value={stats?.publishedPosts ?? 0} sub={`з ${stats?.totalPosts ?? 0} всього`} icon={ic.blog}        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Нові реєстрації" sub="Останні 7 днів"
          value={regChart.reduce((s, d) => s + d.count, 0)} valueColor="text-orange-500"
          data={regChart} color="bg-orange-500" />
        <ChartCard title="Тикети" sub="Останні 7 днів"
          value={ticketChart.reduce((s, d) => s + d.count, 0)} valueColor="text-blue-500"
          data={ticketChart} color="bg-blue-500" />
      </div>

      {/* Health + Modules */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SystemHealth health={health} lastPing={lastPing} onPing={ping} pinging={pinging} />
        <ModuleStats modules={modules} />
      </div>

      {/* Console */}
      <ActivityConsole logs={logs} loading={logsLoading} onRefresh={refreshLogs} />

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Нові користувачі</h2>
            <a href="/admin/users" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
              Всі <Icon d={ic.arrow} cls="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-neutral-50">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">Немає даних</p>
            ) : recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
                  {(u.full_name || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{u.full_name || "—"}</p>
                  <p className="text-xs text-neutral-400">{new Date(u.created_at).toLocaleDateString("uk-UA")}</p>
                </div>
                {["admin","superadmin"].includes(u.role) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-semibold uppercase">{u.role}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Останні тикети</h2>
            <a href="/admin/tickets" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
              Всі <Icon d={ic.arrow} cls="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-neutral-50">
            {recentTickets.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">Немає тикетів</p>
            ) : recentTickets.map(t => {
              const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.new;
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs text-neutral-400 font-mono shrink-0">{t.number}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{t.subject}</p>
                    <p className="text-xs text-neutral-400">{t.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${st.cls}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Останні публікації</h2>
          <a href="/admin/blog" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
            Всі <Icon d={ic.arrow} cls="w-3 h-3" />
          </a>
        </div>
        <div className="divide-y divide-neutral-50">
          {topPosts.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-neutral-400">Публікацій ще немає</p>
              <a href="/admin/blog/new" className="text-xs text-orange-500 hover:text-orange-600 mt-1 inline-block">+ Створити першу</a>
            </div>
          ) : topPosts.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Icon d={ic.blog} cls="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{p.title}</p>
                <p className="text-xs text-neutral-400">{new Date(p.created_at).toLocaleDateString("uk-UA")}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                p.status === "published" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
              }`}>
                {p.status === "published" ? "Опубліковано" : "Чернетка"}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}