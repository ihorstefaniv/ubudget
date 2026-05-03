import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// ─── Типи (копія з /api/fuel-prices/route.ts) ─────────────────
type FuelType = "A-95+" | "A-95" | "A-92" | "ДП" | "ДП+" | "Газ";

interface StationPrices {
  name: string; logo: string;
  "A-95+": number|null; "A-95": number|null; "A-92": number|null;
  "ДП": number|null; "ДП+": number|null; "Газ": number|null;
}
interface TrendPoint { date: string; "A-95": number; "ДП": number; "Газ": number; }
interface RegionPrices { name: string; "A-95": number; "ДП": number; "Газ": number; }
interface FuelPricesResponse {
  updatedAt: string; source: "live"|"fallback";
  averages: Record<FuelType, number|null>;
  stations: StationPrices[]; trend: TrendPoint[]; regions: RegionPrices[];
}

// ─── Офсети мереж ─────────────────────────────────────────────
const STATION_OFFSETS: {
  name: string; logo: string;
  a95p: number|null; a95: number; a92: number|null; dp: number; gas: number;
}[] = [
  { name: "WOG",       logo: "🔵", a95p:  3.20, a95:  2.77, a92: null,  dp:  3.51, gas:  2.08 },
  { name: "ОККО",      logo: "🟠", a95p:  3.20, a95:  2.77, a92: null,  dp:  3.51, gas:  2.09 },
  { name: "UPG",       logo: "🟡", a95p: null,  a95: -0.23, a92: -0.24, dp: -0.49, gas: -0.41 },
  { name: "Укрнафта",  logo: "🏭", a95p: null,  a95: -1.23, a92: -0.74, dp: -2.49, gas: -1.91 },
  { name: "SOCAR",     logo: "🔶", a95p: null,  a95:  2.27, a92:  0.76, dp:  2.01, gas:  0.59 },
  { name: "БРСМ",      logo: "🟢", a95p: null,  a95: -1.48, a92: -0.74, dp: -3.49, gas: -1.98 },
  { name: "КЛО",       logo: "🔴", a95p: null,  a95: -0.73, a92: -0.74, dp: -1.99, gas: -1.41 },
  { name: "U.GO",      logo: "⚡", a95p: null,  a95: -2.32, a92: -1.50, dp: -4.58, gas: -2.50 },
  { name: "AMIC",      logo: "🔷", a95p: null,  a95: -0.23, a92: -0.24, dp: -1.49, gas: -0.91 },
  { name: "Авантаж 7", logo: "🟣", a95p: null,  a95: -1.73, a92: -1.00, dp: -3.49, gas: -2.41 },
  { name: "Marshal",   logo: "⭐", a95p: null,  a95: -1.23, a92: -0.74, dp: -2.99, gas: -1.91 },
];

const REGION_OFFSETS: [string, number, number, number][] = [
  ["Вінницька",        -0.69, -0.97, -0.79],
  ["Волинська",        -0.09, -0.27, -0.19],
  ["Дніпропетровська", +0.11, +0.13, +0.11],
  ["Житомирська",      -0.39, -0.57, -0.49],
  ["Закарпатська",     +1.01, +1.03, +0.91],
  ["Запорізька",       +0.31, +0.33, +0.21],
  ["Івано-Франківська",+0.61, +0.63, +0.51],
  ["Київська",          0,     0,     0   ],
  ["Кіровоградська",   -0.59, -0.77, -0.69],
  ["Львівська",        +0.71, +0.73, +0.61],
  ["Миколаївська",     -0.09, -0.17, -0.19],
  ["Одеська",          +0.21, +0.23, +0.11],
  ["Полтавська",       -0.29, -0.47, -0.39],
  ["Рівненська",       +0.01, -0.07, -0.09],
  ["Сумська",          -0.49, -0.67, -0.59],
  ["Тернопільська",    +0.41, +0.43, +0.31],
  ["Харківська",       +0.11, +0.03, +0.01],
  ["Хмельницька",      -0.19, -0.27, -0.29],
  ["Черкаська",        -0.39, -0.57, -0.49],
  ["Чернігівська",     -0.29, -0.37, -0.39],
  ["Чернівецька",      +0.51, +0.53, +0.41],
];

function r2(n: number) { return Math.round(n * 100) / 100; }

function buildStations(avg: Record<FuelType, number|null>): StationPrices[] {
  return STATION_OFFSETS.map(s => ({
    name: s.name, logo: s.logo,
    "A-95+": s.a95p !== null && avg["A-95+"] ? r2(avg["A-95+"] + s.a95p) : null,
    "A-95":  avg["A-95"] ? r2(avg["A-95"] + s.a95) : null,
    "A-92":  s.a92 !== null && avg["A-92"] ? r2(avg["A-92"] + s.a92) : null,
    "ДП":    avg["ДП"]   ? r2(avg["ДП"]   + s.dp)  : null,
    "ДП+":   null,
    "Газ":   avg["Газ"]  ? r2(avg["Газ"]  + s.gas) : null,
  }));
}

function buildTrend(avg: Record<FuelType, number|null>, history: {price_date: string; data: FuelPricesResponse}[]): TrendPoint[] {
  // Використовуємо архів якщо є, доповнюємо сьогоднішнім значенням
  const a95  = avg["A-95"] ?? 0;
  const dp   = avg["ДП"]   ?? 0;
  const gas  = avg["Газ"]  ?? 0;

  if (history.length >= 2) {
    const points = history.slice(-14).map(h => {
      const d = new Date(h.price_date);
      return {
        date: `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`,
        "A-95": h.data.averages["A-95"] ?? a95,
        "ДП":   h.data.averages["ДП"]   ?? dp,
        "Газ":  h.data.averages["Газ"]  ?? gas,
      };
    });
    return points;
  }

  // Якщо архіву ще немає — генеруємо 14 точок
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const noise = Math.sin(i * 1.3) * 0.12;
    const factor = i / 13;
    return {
      date: `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`,
      "A-95": r2(a95 - (1 - factor) * 0.8 + noise),
      "ДП":   r2(dp  - (1 - factor) * 1.2 + noise * 1.2),
      "Газ":  r2(gas - (1 - factor) * 0.5 + noise * 0.4),
    };
  });
}

function buildRegions(avg: Record<FuelType, number|null>): RegionPrices[] {
  const a95 = avg["A-95"] ?? 0;
  const dp  = avg["ДП"]   ?? 0;
  const gas = avg["Газ"]  ?? 0;
  return REGION_OFFSETS.map(([name, da, dd, dg]) => ({
    name, "A-95": r2(a95+da), "ДП": r2(dp+dd), "Газ": r2(gas+dg),
  }));
}

// ─── Скрапінг vseazs.com ──────────────────────────────────────
const VSEAZS_FUEL_IDS: Record<number, FuelType> = {
  2: "A-95+", 3: "A-95", 4: "A-92", 6: "ДП", 7: "ДП+", 8: "Газ",
};

async function scrapeVseazs(): Promise<Record<FuelType, number|null> | null> {
  const res = await fetch("https://vseazs.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "uk-UA,uk;q=0.9",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`vseazs status ${res.status}`);
  const html = await res.text();

  const avg: Record<FuelType, number|null> = {
    "A-95+": null, "A-95": null, "A-92": null,
    "ДП": null, "ДП+": null, "Газ": null,
  };
  const re = /id="PriceID(\d+)"[^>]*>\s*<p>([\d.]+)<\/p>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const ft = VSEAZS_FUEL_IDS[parseInt(m[1])];
    if (ft) avg[ft] = parseFloat(m[2]);
  }

  if (!avg["A-95"] || !avg["ДП"]) throw new Error("Не вдалося розпарсити ціни");
  return avg;
}

// ─── POST /api/cron/fuel-prices ───────────────────────────────
export async function GET(req: NextRequest) {
  // Перевірка Vercel Cron Secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Скрапінг
    const avg = await scrapeVseazs();
    if (!avg) throw new Error("avg is null");

    // 2. Читаємо архів для побудови тренду
    const { data: history } = await supabase
      .from("fuel_prices_history")
      .select("price_date, data")
      .order("price_date", { ascending: true })
      .limit(14);

    // 3. Будуємо повну відповідь
    const today = new Date();
    const priceDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const updatedAt = `${String(today.getDate()).padStart(2,"0")}.${String(today.getMonth()+1).padStart(2,"0")}.${today.getFullYear()}`;

    const payload: FuelPricesResponse = {
      updatedAt,
      source: "live",
      averages: avg,
      stations: buildStations(avg),
      trend:    buildTrend(avg, (history ?? []) as {price_date: string; data: FuelPricesResponse}[]),
      regions:  buildRegions(avg),
    };

    // 4. Зберігаємо в архів (один запис на день)
    await supabase.from("fuel_prices_history").upsert(
      { price_date: priceDate, data: payload },
      { onConflict: "price_date" }
    );

    // 5. Оновлюємо "поточний" запис (id=1) для основного API
    await supabase.from("fuel_prices").upsert(
      { id: 1, data: payload, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    // Скидаємо ISR-кеш щоб сторінка одразу побачила нові ціни
    revalidatePath("/api/fuel-prices");
    revalidatePath("/free/tools/fuel-prices");
    revalidatePath("/tools/fuel-prices");

    return NextResponse.json({
      ok: true,
      date: priceDate,
      averages: avg,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
