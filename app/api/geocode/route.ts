// ФАЙЛ: app/api/geocode/route.ts
// Proxy до Nominatim для геокодування (без CORS проблем)
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`geocode:${ip}`, 30, 60_000)) {
    return NextResponse.json([], { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length > 200) return NextResponse.json([], { status: 400 });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=ua&accept-language=uk`,
      {
        headers: {
          "User-Agent": "UBudget/1.2 (https://ubudget.app)",
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}