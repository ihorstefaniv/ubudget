// ФАЙЛ: app/api/route/route.ts
// Proxy до OSRM для побудови маршрутів (без CORS проблем)
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Only digits, dots, commas and semicolons — prevents path traversal / injection
const COORDS_RE = /^[\d.,;-]+$/;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`route:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const coords = req.nextUrl.searchParams.get("coords");
  if (!coords) return NextResponse.json({ error: "No coords" }, { status: 400 });
  if (!COORDS_RE.test(coords) || coords.length > 500) {
    return NextResponse.json({ error: "Invalid coords" }, { status: 400 });
  }

  try {
    // OSRM публічний сервер
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`,
      {
        headers: {
          "User-Agent": "UBudget/1.2 (https://ubudget.app)",
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ routes: [] }, { status: 500 });
  }
}