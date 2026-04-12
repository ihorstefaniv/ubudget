// ФАЙЛ: app/(app)/admin/monitor/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminRole } from "../layout";
import { can } from "@/lib/permissions";

import { fetchLogs, addLog, fetchHealth, fetchPings, type LogEntry, type HealthResult, type PingResult } from "../actions/monitor";

// ─── Icon ─────────────────────────────────────────────────────
const I = ({ d, c = "w-4 h-4" }: { d: string; c?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={c}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const SPIN = "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15";
const SEND = "M12 19l9 2-9-18-9 18 9-2zm0 0v-8";
const WARN = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
const CHEV = "M19 9l-7 7-7-7";

const LEVEL_CLR: Record<string, string> = {
  info: "text-cyan-400",
  warn: "text-amber-400",
  error: "text-red-400",
};
const LEVEL_BG: Record<string, string> = {
  info: "bg-cyan-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("uk-UA", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ─── Log line ─────────────────────────────────────────────────
function LogLine({ log }: { log: LogEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border-b border-white/5 hover:bg-white/5 transition-colors px-1 cursor-pointer ${open ? "bg-white/5" : ""}`}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center gap-2 py-1.5 font-mono text-[11px]">
        <span className="text-neutral-600 shrink-0 w-32">{formatDate(log.created_at)}</span>
        <span className={`shrink-0 w-10 font-bold uppercase ${LEVEL_CLR[log.level] ?? "text-neutral-400"}`}>
          {log.level}
        </span>
        <span className="text-neutral-200 shrink-0">{log.event}</span>
        {log.detail && <span className="text-neutral-500 truncate flex-1 min-w-0">{log.detail}</span>}
        {log.detail && <I d={CHEV} c={`w-3 h-3 text-neutral-600 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />}
      </div>
      {open && log.detail && (
        <div className="px-2 pb-2 text-[11px] font-mono text-neutral-400 break-all">{log.detail}</div>
      )}
    </div>
  );
}

// ─── Health pill ──────────────────────────────────────────────
function Pill({ label, ok, value, ms }: { label: string; ok: boolean; value?: string; ms?: number }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${ok ? "border-green-800/50 bg-green-950/40" : "border-red-800/50 bg-red-950/40"}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-300">{label}</p>
        {value && <p className="text-[10px] text-neutral-600 mt-0.5 truncate">{value}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-xs font-bold ${ok ? "text-green-400" : "text-red-400"}`}>{ok ? "OK" : "ERR"}</p>
        {ms !== undefined && <p className="text-[10px] text-neutral-600">{ms}ms</p>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function MonitorPage() {
  const role   = useAdminRole();
  const router = useRouter();

  // Superadmin only — редіректимо одразу, ще до рендеру контенту
  useEffect(() => {
    if (!can(role, "viewMonitor")) {
      router.replace("/admin/dashboard");
    }
  }, [role, router]);

  const [logs, setLogs]     = useState<LogEntry[]>([]);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [pings, setPings]   = useState<PingResult[]>([]);
  const [busy, setBusy]     = useState(true);
  const [error, setError]   = useState("");
  const [live, setLive]     = useState(true);
  const [lvl, setLvl]       = useState("all");
  const [q, setQ]           = useState("");
  const [input, setInput]   = useState("");
  const [inputLvl, setInputLvl] = useState<"info" | "warn" | "error">("info");
  const [sending, setSending]   = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [l, h, p] = await Promise.all([
        fetchLogs(300),
        fetchHealth(),
        fetchPings(),
      ]);
      setLogs(l);
      setHealth(h);
      setPings(p);
      setRefreshedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    }
    setBusy(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!live) return;
    timerRef.current = setInterval(load, 15_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [live, load]);

  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  async function submitLog() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await addLog("manual.note", input.trim(), inputLvl);
      setInput("");
      await load();
    } catch { /* ignore */ }
    setSending(false);
  }

  const errCount  = logs.filter(l => l.level === "error").length;
  const warnCount = logs.filter(l => l.level === "warn").length;

  const visible = logs.filter(l =>
    (lvl === "all" || l.level === lvl) &&
    (!q || l.event.toLowerCase().includes(q.toLowerCase()) ||
          (l.detail ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const eventCounts: Record<string, number> = {};
  logs.forEach(l => { eventCounts[l.event] = (eventCounts[l.event] ?? 0) + 1; });
  const topEvents = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCount  = topEvents[0]?.[1] ?? 1;

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${live ? "bg-green-500 animate-pulse" : "bg-neutral-400"}`} />
            Моніторинг
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {refreshedAt ? `${refreshedAt.toLocaleTimeString("uk-UA")}${live ? " · auto 15s" : ""}` : "Завантаження..."}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLive(v => !v)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${live ? "bg-green-50 border-green-200 text-green-700" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}>
            {live ? "● LIVE" : "○ Пауза"}
          </button>
          <button onClick={load} disabled={busy}
            className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">
            <I d={SPIN} c={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-red-50">
          <I d={WARN} c="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Alerts */}
      {(errCount > 0 || warnCount > 0) && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
          <I d={WARN} c="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex gap-3 text-sm font-medium text-amber-700">
            {errCount  > 0 && <span>{errCount} помилок</span>}
            {warnCount > 0 && <span>{warnCount} попереджень</span>}
          </div>
        </div>
      )}

      {/* Health */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">Здоров'я</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {health ? (
            <>
              <Pill label="Supabase DB"   ok={health.db.ok}   ms={health.latency} value={`${health.counts.users} юзерів · ${health.counts.posts} постів`} />
              <Pill label="Supabase Auth" ok={health.auth.ok} value="Admin API" />
              <Pill label="Тикети"        ok={true}           value={`${health.counts.tickets} відкритих`} />
            </>
          ) : (
            [...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-neutral-100 animate-pulse" />)
          )}
          {pings.map(p => (
            <Pill key={p.name} label={p.name} ok={p.ok} ms={p.latency}
              value={p.statusCode ? `HTTP ${p.statusCode}` : (p.ok ? "—" : "Timeout")} />
          ))}
        </div>
      </div>

      {/* Console */}
      <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-xl">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-800 bg-neutral-900 flex-wrap">
          <div className="flex gap-1.5 mr-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] font-mono text-neutral-500 mr-2 shrink-0">
            admin_logs · {visible.length}/{logs.length}
          </span>
          <div className="flex gap-0.5">
            {(["all", "info", "warn", "error"] as const).map(l => (
              <button key={l} onClick={() => setLvl(l)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${lvl === l ? "bg-neutral-700 text-white" : "text-neutral-600 hover:text-neutral-300"}`}>
                {l === "all" ? "all" : <span className={LEVEL_CLR[l]}>{l}</span>}
              </button>
            ))}
          </div>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="grep..."
            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 w-28 ml-auto" />
        </div>

        {/* Log list */}
        <div ref={consoleRef} className="h-80 overflow-y-auto px-2 py-1">
          {busy && logs.length === 0 ? (
            <div className="flex items-center gap-2 justify-center h-full text-neutral-600 text-xs font-mono">
              <div className="w-3 h-3 border border-neutral-600 border-t-transparent rounded-full animate-spin" />
              Завантаження логів...
            </div>
          ) : visible.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] font-mono text-neutral-700">
                {q || lvl !== "all" ? "// нічого не знайдено" : "// admin_logs порожня — запусти SQL нижче"}
              </p>
            </div>
          ) : (
            visible.map(l => <LogLine key={l.id} log={l} />)
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-neutral-800 bg-neutral-900 px-3 py-2">
          <span className="text-neutral-600 font-mono text-xs shrink-0">❯</span>
          <select value={inputLvl} onChange={e => setInputLvl(e.target.value as "info" | "warn" | "error")}
            className="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-neutral-300 focus:outline-none w-14 shrink-0">
            <option>info</option><option>warn</option><option>error</option>
          </select>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitLog()}
            placeholder="Ввести нотатку вручну (Enter)..."
            className="flex-1 bg-transparent text-[11px] font-mono text-neutral-300 placeholder-neutral-700 focus:outline-none" />
          <button onClick={submitLog} disabled={sending || !input.trim()}
            className="text-neutral-600 hover:text-orange-400 disabled:opacity-30 transition-colors">
            <I d={SEND} c="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {topEvents.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Топ подій</p>
            <div className="space-y-2.5">
              {topEvents.map(([ev, n]) => (
                <div key={ev} className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono text-neutral-500 w-36 truncate shrink-0">{ev}</span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-1.5">
                    <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${(n / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-neutral-600 w-5 text-right shrink-0">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">По рівню</p>
            <div className="space-y-3">
              {(["info", "warn", "error"] as const).map(l => {
                const cnt = logs.filter(x => x.level === l).length;
                return (
                  <div key={l} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${LEVEL_BG[l]}`} />
                    <span className="text-xs font-mono text-neutral-500 w-10">{l}</span>
                    <div className="flex-1 bg-neutral-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${LEVEL_BG[l]}`} style={{ width: `${(cnt / (logs.length || 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-neutral-600 w-5 text-right">{cnt}</span>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-neutral-100 flex justify-between text-xs text-neutral-400">
                <span>Всього</span>
                <span className="font-semibold text-neutral-700">{logs.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Схема admin_logs + RLS</p>
        <pre className="text-[11px] font-mono bg-neutral-950 text-green-400 rounded-xl p-4 overflow-x-auto leading-relaxed">
{`-- Додати колонку level (якщо ще немає):
ALTER TABLE admin_logs ADD COLUMN IF NOT EXISTS level text DEFAULT 'info';

-- Індекси:
CREATE INDEX IF NOT EXISTS admin_logs_ts  ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_lvl ON admin_logs(level);

-- RLS:
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_logs" ON admin_logs FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));
CREATE POLICY "admins_write_logs" ON admin_logs FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','superadmin'));`}
        </pre>
      </div>
    </div>
  );
}