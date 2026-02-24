import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const coords = req.nextUrl.searchParams.get("coords"); // "lng1,lat1;lng2,lat2"
  if (!coords) return NextResponse.json({ error: "no coords" }, { status: 400 });

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "routing failed" }, { status: 500 });
  }
}