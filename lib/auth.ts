import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Auth actions ─────────────────────────────────────────────

export async function signUp({
  email,
  password,
  fullName,
}: {
  email: string;
  password: string;
  fullName: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) return { error: error.message };

  // Після реєстрації — створюємо профіль і дефолтні модулі
  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: fullName,
      base_currency: "UAH",
    });

    // Включаємо базовий модуль за замовчуванням
    await supabase.from("user_modules").insert({
      user_id: data.user.id,
      module_name: "budget",
      is_enabled: true,
    });
  }

  return { data };
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error: error.message };
  return { data };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function getUserModules(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_modules")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function toggleModule(
  userId: string,
  moduleName: string,
  isEnabled: boolean
) {
  const supabase = createClient();
  await supabase
    .from("user_modules")
    .upsert(
      { user_id: userId, module_name: moduleName, is_enabled: isEnabled },
      { onConflict: "user_id,module_name" }
    );
}