// ФАЙЛ: app/api/route/route.ts
// Proxy до OSRM для побудови маршрутів (без CORS проблем)
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const coords = req.nextUrl.searchParams.get("coords");
  if (!coords) return NextResponse.json({ error: "No coords" }, { status: 400 });

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