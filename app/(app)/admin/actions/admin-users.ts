// ФАЙЛ: app/(admin)/actions/admin-users.ts
// ⚠️  Server Action — НЕ виконується на клієнті.
//     Потрібен SUPABASE_SERVICE_ROLE_KEY в .env.local
"use server";

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY не налаштований у .env.local");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getUsersWithEmails(): Promise<
  Array<{ id: string; email: string; created_at: string; last_sign_in_at: string | null }>
> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error || !data) return [];
    return data.users.map(u => ({
      id: u.id, email: u.email ?? "—",
      created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null,
    }));
  } catch { return []; }
}

export async function createUserAdmin(params: {
  email: string; password: string; full_name: string; role: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getAdminClient();
    const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (existing?.users.some(u => u.email === params.email)) {
      return { success: false, error: "Користувач з таким email вже існує" };
    }
    const { data, error } = await admin.auth.admin.createUser({
      email: params.email, password: params.password,
      email_confirm: true,
      user_metadata: { full_name: params.full_name },
    });
    if (error || !data.user) return { success: false, error: error?.message ?? "Помилка Auth API" };
    await admin.from("profiles").upsert({
      id: data.user.id, full_name: params.full_name,
      role: params.role, base_currency: "UAH",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    await writeLog("user.created", `${params.email} (${params.role})`, data.user.id);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Невідома помилка" };
  }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return { success: false, error: error.message };
    await writeLog("user.password_reset", userId);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Помилка" };
  }
}

export async function getSystemHealth() {
  const admin = getAdminClient();
  const t0 = Date.now();
  const [
    { count: postsCount, error: e1 },
    { count: usersCount },
    { count: openTickets },
    authCheck,
  ] = await Promise.all([
    admin.from("posts").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("tickets").select("*", { count: "exact", head: true }).neq("status", "closed"),
    admin.auth.admin.listUsers({ perPage: 1 }),
  ]);
  return {
    db:      { ok: !e1, latency: Date.now() - t0 },
    auth:    { ok: !authCheck.error },
    storage: { ok: true },
    posts:   { count: postsCount ?? 0 },
    users:   { count: usersCount ?? 0 },
    tickets: { open: openTickets ?? 0 },
  };
}

export async function getAdminLogs(limit = 200) {
  const admin = getAdminClient();
  const { data } = await admin
    .from("admin_logs")
    .select("id, action, details, admin_id, created_at, level")
    .order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id:         r.id         as string,
    event:      (r.action   as string) ?? "",
    detail:     (r.details  as string) ?? null,
    user_id:    (r.admin_id as string) ?? null,
    created_at: r.created_at as string,
    level:      (r.level    as string) ?? "info",
  }));
}

export async function writeLog(
  event: string, detail?: string, userId?: string,
  level: "info" | "warn" | "error" = "info"
) {
  try {
    const admin = getAdminClient();
    await admin.from("admin_logs").insert({ action: event, details: detail ?? null, admin_id: userId ?? "00000000-0000-0000-0000-000000000000", level });
  } catch { /* не блокуємо основний флоу */ }
}

export async function pingExternalServices(): Promise<Array<{
  name: string; url: string; ok: boolean; latency: number; status?: number;
}>> {
  const services = [
    { name: "Supabase DB",   url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/` },
    { name: "Supabase Auth", url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health` },
  ];
  return Promise.all(services.map(async s => {
    const t0 = Date.now();
    try {
      const r = await fetch(s.url, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
        signal: AbortSignal.timeout(5000),
      });
      return { ...s, ok: r.ok || r.status < 500, latency: Date.now() - t0, status: r.status };
    } catch {
      return { ...s, ok: false, latency: Date.now() - t0 };
    }
  }));
}

export async function getRegistrationChart(): Promise<Array<{ date: string; count: number }>> {
  const admin = getAdminClient();
  const days: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const from = new Date(d); from.setHours(0, 0, 0, 0);
    const to   = new Date(d); to.setHours(23, 59, 59, 999);
    const { count } = await admin.from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString());
    days.push({ date: d.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric" }), count: count ?? 0 });
  }
  return days;
}