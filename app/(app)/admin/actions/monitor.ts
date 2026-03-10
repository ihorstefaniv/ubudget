"use server";
// ФАЙЛ: app/(admin)/actions/monitor.ts

import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type LogEntry = {
  id: string;
  event: string;
  detail: string | null;
  user_id: string | null;
  created_at: string;
  level: string;
};

export type HealthResult = {
  latency: number;
  db:   { ok: boolean };
  auth: { ok: boolean };
  counts: { posts: number; users: number; tickets: number };
};

export type PingResult = {
  name: string;
  ok: boolean;
  latency: number;
  statusCode?: number;
};

export async function fetchLogs(limit = 200): Promise<LogEntry[]> {
  const { data } = await admin()
    .from("admin_logs")
    .select("id, action, details, admin_id, created_at, level")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id:         r.id         as string,
    event:      (r.action   as string) ?? "",
    detail:     (r.details  as string) ?? null,
    user_id:    (r.admin_id as string) ?? null,
    created_at: r.created_at as string,
    level:      (r.level    as string) ?? "info",
  }));
}

export async function addLog(
  event: string,
  detail?: string,
  level: "info" | "warn" | "error" = "info"
): Promise<void> {
  await admin()
    .from("admin_logs")
    .insert({ action: event, details: detail ?? null, level, admin_id: "00000000-0000-0000-0000-000000000000" });
}

export async function fetchHealth(): Promise<HealthResult> {
  const db = admin();
  const t0 = Date.now();
  const [postsRes, usersRes, ticketsRes, authRes] = await Promise.all([
    db.from("posts").select("*", { count: "exact", head: true }),
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("tickets").select("*", { count: "exact", head: true }).neq("status", "closed"),
    db.auth.admin.listUsers({ perPage: 1 }),
  ]);
  return {
    latency: Date.now() - t0,
    db:   { ok: !postsRes.error },
    auth: { ok: !authRes.error },
    counts: {
      posts:   postsRes.count   ?? 0,
      users:   usersRes.count   ?? 0,
      tickets: ticketsRes.count ?? 0,
    },
  };
}

export async function fetchPings(): Promise<PingResult[]> {
  const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const targets = [
    { name: "Supabase REST", url: `${BASE}/rest/v1/` },
    { name: "Supabase Auth", url: `${BASE}/auth/v1/health` },
  ];
  return Promise.all(
    targets.map(async t => {
      const t0 = Date.now();
      try {
        const r = await fetch(t.url, {
          headers: { apikey: ANON },
          signal: AbortSignal.timeout(4000),
        });
        return { name: t.name, ok: r.status < 500, latency: Date.now() - t0, statusCode: r.status };
      } catch {
        return { name: t.name, ok: false, latency: Date.now() - t0 };
      }
    })
  );
}