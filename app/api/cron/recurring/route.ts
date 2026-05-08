import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function addInterval(dateStr: string, interval: string): string {
  const d = new Date(dateStr);
  switch (interval) {
    case "daily":   d.setDate(d.getDate() + 1); break;
    case "weekly":  d.setDate(d.getDate() + 7); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "yearly":  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split("T")[0];
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: rows } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("is_active", true)
    .lte("next_date", today);

  if (!rows?.length) return NextResponse.json({ processed: 0, date: today });

  let processed = 0;
  for (const r of rows) {
    const { error } = await supabase.from("transactions").insert({
      user_id:          r.user_id,
      account_id:       r.account_id,
      type:             r.type,
      amount:           r.amount,
      currency:         r.currency,
      category_key:     r.category_key ?? "other",
      note:             r.note,
      transaction_date: r.next_date,
      exchange_rate:    1,
    });

    if (error) continue;

    await supabase
      .from("recurring_transactions")
      .update({ next_date: addInterval(r.next_date, r.interval) })
      .eq("id", r.id);

    processed++;
  }

  return NextResponse.json({ processed, date: today });
}
