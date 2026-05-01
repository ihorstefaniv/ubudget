import { createClient } from "@/lib/supabase/client";

export async function logActivity(action: string, details?: string) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("activity_logs").insert({
    user_id: data.user.id,
    action,
    details: details ?? null,
  });
}
