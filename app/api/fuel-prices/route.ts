import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 86400;

export type FuelType = "A-95+" | "A-95" | "A-92" | "ДП" | "ДП+" | "Газ";

export interface StationPrices {
  name: string;
  logo: string;
  "A-95+": number | null;
  "A-95":  number | null;
  "A-92":  number | null;
  "ДП":    number | null;
  "ДП+":   number | null;
  "Газ":   number | null;
}

export interface TrendPoint {
  date: string;
  "A-95": number;
  "ДП":   number;
  "Газ":  number;
}

export interface RegionPrices {
  name: string;
  "A-95": number;
  "ДП":   number;
  "Газ":  number;
}

export interface FuelPricesResponse {
  updatedAt: string;
  source: "live" | "fallback";
  averages: Record<FuelType, number | null>;
  stations: StationPrices[];
  trend: TrendPoint[];
  regions: RegionPrices[];
}

// ─── Fallback (оновлено 02.05.2026, джерело: index.minfin.com.ua) ─────────
const FALLBACK_DATA: FuelPricesResponse = {
  updatedAt: "2026-05-02",
  source: "fallback",
  averages: {
    "A-95+": 75.76,
    "A-95":  72.39,
    "A-92":  67.23,
    "ДП":    88.07,
    "ДП+":   null,
    "Газ":   48.69,
  },
  stations: [
    { name: "WOG",       logo: "🔵", "A-95+": 78.99, "A-95": 74.99, "A-92": null,  "ДП": 91.99, "ДП+": null, "Газ": 50.98 },
    { name: "ОККО",      logo: "🟠", "A-95+": 78.99, "A-95": 74.99, "A-92": null,  "ДП": 91.99, "ДП+": null, "Газ": 50.99 },
    { name: "UPG",       logo: "🟡", "A-95+": null,  "A-95": 71.99, "A-92": 66.99, "ДП": 87.49, "ДП+": null, "Газ": 47.99 },
    { name: "Укрнафта",  logo: "🏭", "A-95+": null,  "A-95": 70.99, "A-92": 66.49, "ДП": 85.49, "ДП+": null, "Газ": 46.49 },
    { name: "SOCAR",     logo: "🔶", "A-95+": null,  "A-95": 74.49, "A-92": 67.99, "ДП": 89.99, "ДП+": null, "Газ": 48.99 },
    { name: "БРСМ",      logo: "🟢", "A-95+": null,  "A-95": 70.49, "A-92": 66.49, "ДП": 84.49, "ДП+": null, "Газ": 46.49 },
    { name: "КЛО",       logo: "🔴", "A-95+": null,  "A-95": 71.49, "A-92": 66.49, "ДП": 85.99, "ДП+": null, "Газ": 46.99 },
    { name: "U.GO",      logo: "⚡", "A-95+": null,  "A-95": 69.99, "A-92": 65.49, "ДП": 83.49, "ДП+": null, "Газ": 45.99 },
    { name: "AMIC",      logo: "🔷", "A-95+": null,  "A-95": 71.99, "A-92": 66.99, "ДП": 86.49, "ДП+": null, "Газ": 47.49 },
    { name: "Авантаж 7", logo: "🟣", "A-95+": null,  "A-95": 70.49, "A-92": 65.99, "ДП": 84.49, "ДП+": null, "Газ": 45.99 },
    { name: "Marshal",   logo: "⭐", "A-95+": null,  "A-95": 70.99, "A-92": 66.49, "ДП": 84.99, "ДП+": null, "Газ": 46.49 },
  ],
  trend: [
    { date: "19.04", "A-95": 71.80, "ДП": 85.50, "Газ": 46.80 },
    { date: "20.04", "A-95": 71.85, "ДП": 85.70, "Газ": 46.90 },
    { date: "21.04", "A-95": 71.90, "ДП": 85.90, "Газ": 47.00 },
    { date: "22.04", "A-95": 71.95, "ДП": 86.10, "Газ": 47.10 },
    { date: "23.04", "A-95": 72.00, "ДП": 86.30, "Газ": 47.20 },
    { date: "24.04", "A-95": 72.05, "ДП": 86.50, "Газ": 47.30 },
    { date: "25.04", "A-95": 72.10, "ДП": 86.80, "Газ": 47.50 },
    { date: "26.04", "A-95": 72.15, "ДП": 87.00, "Газ": 47.80 },
    { date: "27.04", "A-95": 72.20, "ДП": 87.30, "Газ": 48.00 },
    { date: "28.04", "A-95": 72.25, "ДП": 87.60, "Газ": 48.30 },
    { date: "29.04", "A-95": 72.30, "ДП": 87.80, "Газ": 48.50 },
    { date: "30.04", "A-95": 72.39, "ДП": 88.07, "Газ": 48.69 },
    { date: "01.05", "A-95": 72.39, "ДП": 88.07, "Газ": 48.69 },
    { date: "02.05", "A-95": 72.39, "ДП": 88.07, "Газ": 48.69 },
  ],
  regions: [
    { name: "Вінницька",        "A-95": 71.70, "ДП": 87.10, "Газ": 47.90 },
    { name: "Волинська",         "A-95": 72.30, "ДП": 87.80, "Газ": 48.50 },
    { name: "Дніпропетровська",  "A-95": 72.50, "ДП": 88.20, "Газ": 48.80 },
    { name: "Житомирська",       "A-95": 72.00, "ДП": 87.50, "Газ": 48.20 },
    { name: "Закарпатська",      "A-95": 73.40, "ДП": 89.10, "Газ": 49.60 },
    { name: "Запорізька",        "A-95": 72.70, "ДП": 88.40, "Газ": 48.90 },
    { name: "Івано-Франківська", "A-95": 73.00, "ДП": 88.70, "Газ": 49.20 },
    { name: "Київська",          "A-95": 72.39, "ДП": 88.07, "Газ": 48.69 },
    { name: "Кіровоградська",    "A-95": 71.80, "ДП": 87.30, "Газ": 48.00 },
    { name: "Львівська",         "A-95": 73.10, "ДП": 88.80, "Газ": 49.30 },
    { name: "Миколаївська",      "A-95": 72.30, "ДП": 87.90, "Газ": 48.50 },
    { name: "Одеська",           "A-95": 72.60, "ДП": 88.30, "Газ": 48.80 },
    { name: "Полтавська",        "A-95": 72.10, "ДП": 87.60, "Газ": 48.30 },
    { name: "Рівненська",        "A-95": 72.40, "ДП": 88.00, "Газ": 48.60 },
    { name: "Сумська",           "A-95": 71.90, "ДП": 87.40, "Газ": 48.10 },
    { name: "Тернопільська",     "A-95": 72.80, "ДП": 88.50, "Газ": 49.00 },
    { name: "Харківська",        "A-95": 72.50, "ДП": 88.10, "Газ": 48.70 },
    { name: "Хмельницька",       "A-95": 72.20, "ДП": 87.80, "Газ": 48.40 },
    { name: "Черкаська",         "A-95": 72.00, "ДП": 87.50, "Газ": 48.20 },
    { name: "Чернігівська",      "A-95": 72.10, "ДП": 87.70, "Газ": 48.30 },
    { name: "Чернівецька",       "A-95": 72.90, "ДП": 88.60, "Газ": 49.10 },
  ],
};

export async function GET() {
  // Спочатку читаємо з Supabase — адмін може оновити без деплою
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("fuel_prices")
      .select("data")
      .eq("id", 1)
      .single();

    if (data?.data) {
      return NextResponse.json(data.data, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
      });
    }
  } catch {}

  return NextResponse.json(FALLBACK_DATA, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
  });
}
