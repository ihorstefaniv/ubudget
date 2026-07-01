import { createClient } from "./supabase/client";

export async function signIn({ email, password }: { email: string; password: string }) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { data };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
