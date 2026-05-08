import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FALLBACK_RATES } from "@/lib/nbu-rates";

const CURRENCIES = ["USD", "EUR", "PLN"];

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().split("T")[0];

  // Спробуємо кеш за сьогодні
  const { data: cached } = await supabase
    .from("exchange_rates")
    .select("currency, rate")
    .eq("date", today);

  if (cached && cached.length >= CURRENCIES.length) {
    const rates: Record<string, number> = {};
    cached.forEach((r) => { rates[r.currency] = r.rate; });
    return NextResponse.json({ ...rates, date: today, source: "cache" });
  }

  // Fallback — живий NBU API
  const rates: Record<string, number> = { ...FALLBACK_RATES };
  await Promise.allSettled(
    CURRENCIES.map(async (cur) => {
      try {
        const res = await fetch(
          `https://bank.gov.ua/NBU_Exchange/exchange?valcode=${cur}&json`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data[0]?.rate) rates[cur] = data[0].rate;
      } catch { /* залишаємо fallback */ }
    })
  );

  return NextResponse.json({ ...rates, date: today, source: "live" });
}
