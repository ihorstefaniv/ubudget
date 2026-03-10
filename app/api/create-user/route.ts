// ФАЙЛ: app/api/create-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin() {
  const cookieStore = await cookies(); // ← await для Next.js 14.2+
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "superadmin"].includes(profile?.role ?? "")) return null;
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const caller = await verifyAdmin();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { email, password, full_name, role } = await req.json();
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Заповніть всі поля" }, { status: 400 });
    }

    const admin = adminClient();

    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (list?.users.some((u: { email?: string }) => u.email === email)) {
      return NextResponse.json({ error: "Користувач з таким email вже існує" }, { status: 409 });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Помилка Auth API" }, { status: 500 });
    }

    await admin.from("profiles").upsert({
      id: data.user.id, full_name, role: role ?? "user",
      base_currency: "UAH",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Log non-blocking
    void (async () => { try { await admin.from("admin_logs").insert({ event: "user.created", detail: `${email} (${role ?? "user"}) by ${caller.email}`, user_id: data.user.id, level: "info" }); } catch { /* ignore */ } })();

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Помилка" },
      { status: 500 }
    );
  }
}