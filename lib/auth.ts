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
  modules = ["budget"],
}: {
  email: string;
  password: string;
  fullName: string;
  modules?: string[];
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

  if (data.user) {
    const allModuleKeys = ["budget", "credits", "investments", "envelopes", "household"];
    const modulesMap = Object.fromEntries(
      allModuleKeys.map((key) => [key, modules.includes(key)])
    );
    // budget завжди увімкнений
    modulesMap["budget"] = true;

    // upsert щоб не конфліктувати з можливим тригером на auth.users
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      base_currency: "UAH",
      modules: modulesMap,
    });
    if (profileError) return { error: profileError.message };
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