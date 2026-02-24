import { createBrowserClient } from '@supabase/ssr'

// Singleton — один екземпляр на весь браузер
let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

// Для зворотної сумісності з існуючим кодом
export const supabase = getSupabase()