import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CURRENCIES = ["USD", "EUR", "PLN", "GBP", "CHF"];

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().split("T")[0];
  const fetched: Record<string, number> = {};
  const errors: string[] = [];

  await Promise.allSettled(
    CURRENCIES.map(async (cur) => {
      try {
        const res = await fetch(
          `https://bank.gov.ua/NBU_Exchange/exchange?valcode=${cur}&json`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data[0]?.rate) fetched[cur] = data[0].rate;
      } catch {
        errors.push(cur);
      }
    })
  );

  if (Object.keys(fetched).length > 0) {
    // Видаляємо записи за сьогодні і вставляємо свіжі
    await supabase.from("exchange_rates").delete().eq("date", today);
    await supabase.from("exchange_rates").insert(
      Object.entries(fetched).map(([currency, rate]) => ({ currency, rate, date: today }))
    );
  }

  return NextResponse.json({ ok: true, date: today, rates: fetched, errors });
}
