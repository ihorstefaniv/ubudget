import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  const auth = req.headers.get("authorization") ?? "";
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: stocks } = await supabase.from("stocks").select("id, ticker");
  if (!stocks?.length) return NextResponse.json({ updated: 0 });

  const tickers = [...new Set(stocks.map((s: { id: string; ticker: string }) => s.ticker))];
  const priceMap: Record<string, number> = {};

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        );
        const json = await res.json();
        const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price && typeof price === "number") priceMap[ticker] = price;
      } catch {}
    })
  );

  let updated = 0;
  await Promise.all(
    stocks
      .filter((s: { id: string; ticker: string }) => priceMap[s.ticker] !== undefined)
      .map(async (s: { id: string; ticker: string }) => {
        await supabase.from("stocks").update({ current_price: priceMap[s.ticker] }).eq("id", s.id);
        updated++;
      })
  );

  return NextResponse.json({ updated });
}
