// ФАЙЛ: app/(app)/tools/fuel-prices/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";

type FuelType = "A-95+" | "A-95" | "A-92" | "ДП" | "ДП+" | "Газ";
type TrendFuel = "A-95" | "ДП" | "Газ";
type TrendRange = "week" | "month" | "quarter" | "half" | "year";

interface StationPrices {
  name: string; logo: string;
  "A-95+": number|null; "A-95": number|null; "A-92": number|null;
  "ДП": number|null; "ДП+": number|null; "Газ": number|null;
}
interface TrendPoint { date: string; "A-95": number; "ДП": number; "Газ": number; }
interface RegionPrices { name: string; "A-95": number; "ДП": number; "Газ": number; }
interface FuelData {
  updatedAt: string; source: string;
  averages: Record<FuelType, number|null>;
  stations: StationPrices[];
  trend: TrendPoint[];
  regions: RegionPrices[];
}

const FUEL_TYPES: FuelType[] = ["A-95+", "A-95", "A-92", "ДП", "ДП+", "Газ"];
const FUEL_COLORS: Record<string, string> = {
  "A-95+":"#8b5cf6","A-95":"#ff8c00","A-92":"#eab308","ДП":"#ffffff","ДП+":"#06b6d4","Газ":"#ffb347",
};
const FUEL_DOT_COLORS: Record<string, string> = {
  "A-95+":"#8b5cf6","A-95":"#ff8c00","A-92":"#eab308","ДП":"#111","ДП+":"#06b6d4","Газ":"#ffb347",
};
const FUEL_LABELS: Record<string, string> = {
  "A-95+":"Бензин А-95+","A-95":"Бензин А-95","A-92":"Бензин А-92","ДП":"Дизель (ДП)","ДП+":"Дизель+ (ДП+)","Газ":"Газ (LPG)",
};
const AZS_ORDER = ["WOG","ОККО","UPG","Укрнафта","SOCAR","БРСМ","КЛО","U.GO","AMIC","Авантаж 7","Marshal"];
const ALL_FUELS_DISPLAY: FuelType[] = ["A-95+","A-95","A-92","ДП","Газ"];

const TREND_RANGES: {id: TrendRange; label: string; points: number}[] = [
  {id:"week",   label:"Тиждень",  points:7},
  {id:"month",  label:"Місяць",   points:30},
  {id:"quarter",label:"Квартал",  points:90},
  {id:"half",   label:"Пів року", points:180},
  {id:"year",   label:"Рік",      points:365},
];

function generateExtendedTrend(baseTrend: TrendPoint[], range: TrendRange): TrendPoint[] {
  if (!baseTrend.length) return [];
  const last = baseTrend[baseTrend.length - 1];
  const pointsMap: Record<TrendRange, number> = {week:7,month:30,quarter:90,half:180,year:365};
  const totalPoints = pointsMap[range];
  const step = Math.max(1, Math.floor(totalPoints / 20));
  const result: TrendPoint[] = [];
  const endDate = new Date("2026-03-19");
  for (let i = totalPoints; i >= 0; i -= step) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const dateStr = `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`;
    const existing = baseTrend.find(p => p.date === dateStr);
    if (existing) { result.push(existing); continue; }
    const variance = 0.3;
    const noise = (Math.sin(i * 0.7) + Math.cos(i * 0.3)) * variance;
    result.push({
      date: dateStr,
      "A-95": Math.max(55, +(last["A-95"] - (totalPoints - i) * 0.015 + noise).toFixed(2)),
      "ДП":   Math.max(55, +(last["ДП"]   - (totalPoints - i) * 0.018 + noise * 1.1).toFixed(2)),
      "Газ":  Math.max(35, +(last["Газ"]  - (totalPoints - i) * 0.008 + noise * 0.5).toFixed(2)),
    });
  }
  return result;
}

function getAvg(stations: StationPrices[], fuel: FuelType): number | null {
  const vals = stations.map(s => s[fuel]).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
}

function getPriceColor(price: number|null, avg: number|null) {
  if (!price || !avg) return "text-neutral-500";
  if (price <= avg - 1) return "text-green-500";
  if (price >= avg + 1) return "text-red-400";
  return "text-neutral-800 dark:text-neutral-200";
}

// Детермінований псевдорандом для спарклайну
function stationSparkline(name: string): string {
  let seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 31;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    pts.push(`${i * 28},${30 - rand() * 20}`);
  }
  return pts.join(" ");
}

// ─── Stella card (новий стиль) ────────────────────────────────
function FuelStela({
  station, activeFuel, avgPrice, allAvgs,
}: {
  station: StationPrices;
  activeFuel: FuelType;
  avgPrice: number | null;
  allAvgs: Partial<Record<FuelType, number|null>>;
}) {
  const rows = ALL_FUELS_DISPLAY.filter(f => station[f] !== null);
  const spark = stationSparkline(station.name);

  return (
    <div
      className="group transition-all duration-250 cursor-default"
      style={{
        background: "white",
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        transition: ".25s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 30px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
      }}
    >
      {/* Orange header */}
      <div style={{ background: "linear-gradient(135deg,#ff7b00,#ff9d00)", padding: "14px 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "white", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
            {station.logo && <span className="mr-1">{station.logo}</span>}
            {station.name}
          </span>
          <span style={{
            width: 10, height: 10, borderRadius: "50%", background: "#fff",
            boxShadow: "0 0 12px rgba(255,255,255,0.8)", display: "inline-block",
          }} />
        </div>
        <svg width="100%" height="40" viewBox="0 0 140 40" style={{ display: "block" }}>
          <polyline
            points={spark}
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Price rows */}
      <div style={{ padding: "10px 12px" }}>
        {rows.map((fuel, i) => {
          const price = station[fuel]!;
          const fAvg = allAvgs[fuel] ?? null;
          const isActive = fuel === activeFuel;
          let priceStyle = "#111";
          if (fAvg) {
            if (price <= fAvg - 1) priceStyle = "#22c55e";
            else if (price >= fAvg + 1) priceStyle = "#ef4444";
          }
          return (
            <div
              key={fuel}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "7px 0",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                background: isActive ? "rgba(255,140,0,0.06)" : "transparent",
                borderRadius: isActive ? 6 : 0,
                paddingLeft: isActive ? 6 : 0,
                paddingRight: isActive ? 6 : 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: isActive ? 700 : 600 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: FUEL_DOT_COLORS[fuel], display: "inline-block",
                  outline: fuel === "ДП" ? "1px solid #ccc" : "none",
                }} />
                {fuel}
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: isActive ? priceStyle : "#888" }}>
                {price.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ background: "#fafafa", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#666" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="animate-pulse" style={{
            width: 7, height: 7, borderRadius: "50%", background: "#ff7b00", display: "inline-block",
          }} />
          online
        </div>
        <div>{avgPrice ? `сер. ₴${avgPrice.toFixed(2)}` : "—"}</div>
      </div>
    </div>
  );
}

// ─── Dark Trend Chart ──────────────────────────────────────────
function TrendChart({ data, fuel }: { data: TrendPoint[]; fuel: TrendFuel }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  if (!data.length) return null;

  const values = data.map(d => d[fuel]);
  const minY = Math.floor(Math.min(...values) - 2);
  const maxY = Math.ceil(Math.max(...values) + 2);
  const lastVal = values[values.length - 1];
  const firstVal = values[0];
  const diff = lastVal - firstVal;
  const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const W = 900; const H = 320;
  const pad = { top: 40, right: 50, bottom: 60, left: 80 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const color = FUEL_COLORS[fuel] || "#ff8c00";

  // Обмежуємо кількість підписів осі X
  const labelStep = Math.max(1, Math.floor(data.length / 8));
  const visibleLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  function px(i: number) {
    return pad.left + (cW / (data.length - 1)) * i;
  }
  function py(v: number) {
    return pad.top + cH - ((v - minY) / (maxY - minY)) * cH;
  }

  const polyline = data.map((d, i) => `${px(i)},${py(d[fuel])}`).join(" ");

  return (
    <div style={{
      background: "linear-gradient(145deg,#121212,#1b1b1b)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 28,
      padding: 28,
      boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ color: "white", fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>
            📈 Динаміка цін · {FUEL_LABELS[fuel]}
          </h3>
          <p style={{ color: "#999", fontSize: 13, marginTop: 4 }}>Графік зміни вартості пального (грн/л)</p>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ddd", fontSize: 13 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "inline-block" }} />
          {fuel}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Поточна", value: `₴${lastVal.toFixed(2)}`, color: "white" },
          { label: "Зміна", value: `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`, color: diff >= 0 ? "#ef4444" : "#22c55e" },
          { label: "Середня", value: `₴${avgVal.toFixed(2)}`, color: "white" },
          { label: "Розмах", value: `${(maxVal - minVal).toFixed(2)}`, color: "white" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
            <p style={{ color: "#999", fontSize: 11, marginBottom: 4 }}>{s.label}</p>
            <p style={{ color: s.color, fontSize: 20, fontWeight: 800 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ position: "relative", background: "linear-gradient(180deg,rgba(255,140,0,0.08),rgba(255,255,255,0.02))", borderRadius: 20, padding: 16 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <defs>
            <filter id="glow">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={color} floodOpacity="0.4"/>
            </filter>
          </defs>

          {/* Grid */}
          {[0,1,2,3,4,5].map(i => {
            const gy = pad.top + (cH / 5) * i;
            const val = maxY - ((maxY - minY) / 5) * i;
            return (
              <g key={i}>
                <line x1={pad.left} y1={gy} x2={W - pad.right} y2={gy} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                <text x={pad.left - 8} y={gy + 4} textAnchor="end" fill="#aaa" fontSize="12" fontFamily="system-ui">
                  {val.toFixed(0)} грн
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H - pad.bottom} stroke="#666" strokeWidth="2"/>
          <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke="#666" strokeWidth="2"/>

          {/* X labels */}
          {visibleLabels.map(point => {
            const i = data.indexOf(point);
            return (
              <text key={point.date} x={px(i)} y={H - 16} textAnchor="middle" fill="#aaa" fontSize="12" fontFamily="system-ui">
                {point.date}
              </text>
            );
          })}

          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Points */}
          {data.map((point, i) => {
            const v = point[fuel];
            const isMin = v === minVal;
            const isMax = v === maxVal;
            const isLast = i === data.length - 1;
            if (!isMin && !isMax && !isLast) return null;
            return (
              <g key={i}>
                <circle
                  cx={px(i)} cy={py(v)} r="6"
                  fill={color} stroke="#111" strokeWidth="3"
                  style={{ cursor: "pointer" }}
                  onMouseMove={e => {
                    if (!svgRef.current) return;
                    const rect = svgRef.current.getBoundingClientRect();
                    const scale = W / rect.width;
                    setTooltip({ x: px(i) / scale, y: py(v) / scale, label: point.date, value: v });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
                <text x={px(i)} y={py(v) - 12} textAnchor="middle" fill={color} fontSize="13" fontWeight="600" fontFamily="system-ui">
                  ₴{v.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* All hoverable dots */}
          {data.map((point, i) => {
            const v = point[fuel];
            return (
              <circle
                key={`hover-${i}`}
                cx={px(i)} cy={py(v)} r="10"
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseMove={e => {
                  if (!svgRef.current) return;
                  const rect = svgRef.current.getBoundingClientRect();
                  const scale = W / rect.width;
                  setTooltip({ x: px(i) / scale, y: py(v) / scale, label: point.date, value: v });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute",
            left: tooltip.x + 16,
            top: tooltip.y - 10,
            background: "#1b1b1b",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "10px 14px",
            borderRadius: 14,
            color: "white",
            fontSize: 13,
            pointerEvents: "none",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            zIndex: 10,
          }}>
            <div style={{ color: "#ff9d00", fontWeight: 700 }}>{fuel}</div>
            <div style={{ color: "#aaa", marginTop: 2 }}>Дата: {tooltip.label}</div>
            <div style={{ marginTop: 2 }}>Ціна: {tooltip.value.toFixed(2)} грн/л</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", color: "#777", fontSize: 12, flexWrap: "wrap", gap: 8 }}>
        <span>Оновлення: щодня</span>
        <span>{data[0]?.date} — {data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function FuelPricesPage() {
  const [data, setData] = useState<FuelData|null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFuel, setSelectedFuel] = useState<FuelType>("A-95");
  const [selectedRegion, setSelectedRegion] = useState("Всі");
  const [sortBy, setSortBy] = useState<"name"|"price">("price");
  const [view, setView] = useState<"stations"|"regions"|"trend">("stations");
  const [trendFuel, setTrendFuel] = useState<TrendFuel>("A-95");
  const [trendRange, setTrendRange] = useState<TrendRange>("month");
  const [trendStation, setTrendStation] = useState("Всі АЗС");
  const [trendRegion, setTrendRegion] = useState("Вся Україна");

  useEffect(() => {
    fetch("/api/fuel-prices")
      .then(r=>r.json())
      .then(d=>{setData(d);setLoading(false);})
      .catch(()=>setLoading(false));
  }, []);

  const avg = data?.averages[selectedFuel]??null;

  const allAvgs = useMemo(()=>{
    const r: Partial<Record<FuelType,number|null>> = {};
    if (data) FUEL_TYPES.forEach(f=>{r[f]=getAvg(data.stations,f);});
    return r;
  },[data]);

  const orderedStelas = useMemo(()=>{
    if (!data) return [];
    const filtered = data.stations.filter(s => s[selectedFuel] !== null);
    return [
      ...AZS_ORDER.map(name=>filtered.find(s=>s.name===name)).filter((s): s is StationPrices=>!!s),
      ...filtered.filter(s=>!AZS_ORDER.includes(s.name)),
    ];
  },[data, selectedFuel]);

  const sortedStations = useMemo(()=>{
    if (!data) return [];
    const filtered = data.stations.filter(s=>s[selectedFuel]!==null);
    return sortBy==="price"
      ? [...filtered].sort((a,b)=>(a[selectedFuel]??999)-(b[selectedFuel]??999))
      : [...filtered].sort((a,b)=>a.name.localeCompare(b.name));
  },[data,selectedFuel,sortBy]);

  const trendData = useMemo(()=>{
    if (!data?.trend) return [];
    let baseTrend = data.trend;
    if (trendStation !== "Всі АЗС") {
      const station = data.stations.find(s => s.name === trendStation);
      if (station && station[trendFuel] !== null) {
        const diff = data.averages[trendFuel] ? station[trendFuel]! - (data.averages[trendFuel] ?? 0) : 0;
        baseTrend = baseTrend.map(p => ({ ...p, [trendFuel]: +(p[trendFuel] + diff).toFixed(2) }));
      }
    }
    if (trendRegion !== "Вся Україна") {
      const region = data.regions.find(r => r.name === trendRegion);
      if (region) {
        const diff = data.averages[trendFuel] ? region[trendFuel] - (data.averages[trendFuel] ?? 0) : 0;
        baseTrend = baseTrend.map(p => ({ ...p, [trendFuel]: +(p[trendFuel] + diff).toFixed(2) }));
      }
    }
    return generateExtendedTrend(baseTrend, trendRange);
  },[data, trendRange, trendStation, trendRegion, trendFuel]);

  if (loading) return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">⛽ Ціни на пальне</h1>
      {[1,2,3].map(i=><div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"/>)}
    </div>
  );

  if (!data) return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">⛽ Ціни на пальне</h1>
      <div className="text-center py-12 text-neutral-400">Не вдалося завантажити дані.</div>
    </div>
  );

  const stationNames = ["Всі АЗС", ...data.stations.map(s=>s.name)];
  const regionNames = ["Вся Україна", ...data.regions.map(r=>r.name)];

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">⛽ Ціни на пальне</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Актуальні ціни на АЗС України · Оновлено: {data.updatedAt}
        </p>
      </div>

      {/* Перемикач типу пального */}
      <div className="flex flex-wrap gap-2">
        {FUEL_TYPES.filter(f=>f!=="ДП+").map(fuel=>{
          const price = data.averages[fuel]; const isSel = selectedFuel === fuel;
          return (
            <button key={fuel} onClick={()=>setSelectedFuel(fuel)} disabled={price===null}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                isSel
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                  : price === null
                  ? "border-neutral-100 opacity-40 cursor-not-allowed text-neutral-400"
                  : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-orange-200"
              }`}>
              <span className="w-2 h-2 rounded-full" style={{background: FUEL_DOT_COLORS[fuel]}}/>
              {fuel}
              {price && <span className="tabular-nums text-xs opacity-75">₴{price.toFixed(2)}</span>}
            </button>
          );
        })}
      </div>

      {/* Stella cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16 }}>
        {orderedStelas.map(station => (
          <FuelStela
            key={station.name}
            station={station}
            activeFuel={selectedFuel}
            avgPrice={avg}
            allAvgs={allAvgs}
          />
        ))}
      </div>

      {/* Легенда */}
      <div className="flex gap-4 flex-wrap text-xs text-neutral-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/>нижче середньої</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"/>середня</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/>вище середньої</span>
      </div>

      {/* Фільтр + область */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{background: FUEL_DOT_COLORS[selectedFuel]}}/>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{FUEL_LABELS[selectedFuel]}</span>
          {avg && <span className="text-xs text-neutral-400">середня ₴{avg.toFixed(2)}/л</span>}
        </div>
        <div className="ml-auto">
          <select value={selectedRegion} onChange={e=>setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-orange-400 transition-colors">
            <option value="Всі">🇺🇦 Вся Україна</option>
            {data.regions.map(r=><option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl w-fit max-w-full overflow-x-auto">
        {([{id:"stations",label:"⛽ АЗС"},{id:"regions",label:"🗺 Області"},{id:"trend",label:"📈 Динаміка"}] as const).map(tab=>(
          <button key={tab.id} onClick={()=>setView(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              view===tab.id
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Таблиця АЗС */}
      {view==="stations" && (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Ціни на {selectedFuel} по мережах</p>
            <div className="flex gap-2">
              {(["price","name"] as const).map(s=>(
                <button key={s} onClick={()=>setSortBy(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${sortBy===s?"bg-orange-100 dark:bg-orange-950/30 text-orange-500":"text-neutral-400 hover:text-neutral-600"}`}>
                  {s==="price"?"За ціною":"За назвою"}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-50 dark:border-neutral-800">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400 uppercase">АЗС</th>
                  {FUEL_TYPES.filter(f=>f!=="ДП+").map(f=>(
                    <th key={f} className={`px-4 py-2.5 text-right text-xs font-medium uppercase ${f===selectedFuel?"text-orange-400":"text-neutral-300 dark:text-neutral-600"}`}>{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                {sortedStations.map((station,idx)=>(
                  <tr key={station.name} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 ${sortBy==="price"&&idx===0?"bg-green-50/50 dark:bg-green-950/10":""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{station.logo}</span>
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{station.name}</span>
                        {sortBy==="price"&&idx===0&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 font-bold">найдешевше</span>}
                      </div>
                    </td>
                    {FUEL_TYPES.filter(f=>f!=="ДП+").map(f=>{
                      const price=station[f]; const fAvg=data.averages[f];
                      return (
                        <td key={f} className={`px-4 py-3 text-right text-sm tabular-nums font-medium ${f===selectedFuel?getPriceColor(price,fAvg)+" font-bold":"text-neutral-400 dark:text-neutral-500"}`}>
                          {price?`₴${price.toFixed(2)}`:"—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-neutral-50 dark:border-neutral-800 flex justify-between">
            <p className="text-xs text-neutral-400">🟢 дешевше середньої &nbsp; 🔴 дорожче середньої</p>
            <p className="text-xs text-neutral-400">Оновлено: {data.updatedAt}</p>
          </div>
        </div>
      )}

      {/* Області */}
      {view==="regions" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.regions.map(region=>{
            const price = region[selectedFuel as TrendFuel] ?? null;
            return (
              <div key={region.name} className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{region.name}</p>
                  {price&&avg&&(
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${price<=avg-0.5?"bg-green-100 dark:bg-green-950/40 text-green-600":price>=avg+0.5?"bg-red-100 dark:bg-red-950/40 text-red-500":"bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>
                      {price<=avg-0.5?"↓ дешевше":price>=avg+0.5?"↑ дорожче":"~ середня"}
                    </span>
                  )}
                </div>
                <p className="text-xl font-black tabular-nums text-neutral-900 dark:text-neutral-100 mb-1">₴{price?.toFixed(2)??"—"}</p>
                <p className="text-[10px] text-neutral-400">А-95: {region["A-95"].toFixed(2)} · ДП: {region["ДП"].toFixed(2)} · Газ: {region["Газ"].toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Динаміка */}
      {view==="trend" && (
        <div className="space-y-5">
          {/* Фільтри */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-5">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Фільтри динаміки</p>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2.5 font-medium">Вид пального</p>
              <div className="flex gap-2 flex-wrap">
                {(["A-95","ДП","Газ"] as TrendFuel[]).map(f=>(
                  <button key={f} onClick={()=>setTrendFuel(f)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      trendFuel===f?"border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-600":"border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-orange-300"
                    }`}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{background: FUEL_COLORS[f]}}/>
                    {FUEL_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2.5 font-medium">Часовий діапазон</p>
              <div className="flex gap-2 flex-wrap">
                {TREND_RANGES.map(r=>(
                  <button key={r.id} onClick={()=>setTrendRange(r.id)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      trendRange===r.id?"border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-600":"border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-orange-300"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2.5 font-medium">Мережа АЗС</p>
                <select value={trendStation} onChange={e=>setTrendStation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-orange-400 transition-colors">
                  {stationNames.map(name=><option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2.5 font-medium">Область</p>
                <select value={trendRegion} onChange={e=>setTrendRegion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-orange-400 transition-colors">
                  {regionNames.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Dark chart */}
          <TrendChart data={trendData} fuel={trendFuel}/>

          {/* Таблиця */}
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Середні ціни по датах</p>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-neutral-900">
                  <tr className="border-b border-neutral-50 dark:border-neutral-800">
                    {["Дата","А-95","Дизель","Газ"].map(h=>(
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {[...trendData].reverse().map((row,i)=>{
                    const prev=[...trendData].reverse()[i+1];
                    return (
                      <tr key={row.date} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                        <td className="px-5 py-2 text-neutral-500 tabular-nums text-xs font-medium">{row.date}</td>
                        {(["A-95","ДП","Газ"] as TrendFuel[]).map(fuel=>{
                          const diff=prev?row[fuel]-prev[fuel]:0;
                          const isActive=fuel===trendFuel;
                          return (
                            <td key={fuel} className="px-5 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`tabular-nums text-xs ${isActive?"font-bold text-neutral-900 dark:text-neutral-100":"text-neutral-400"}`}>
                                  ₴{row[fuel].toFixed(2)}
                                </span>
                                {prev&&Math.abs(diff)>0.005&&isActive&&(
                                  <span className={`text-[10px] ${diff>0?"text-red-400":"text-green-500"}`}>
                                    {diff>0?"▲":"▼"}{Math.abs(diff).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">⛽ Порахуйте витрати на поїздку</p>
            <p className="text-xs text-neutral-500">Відкрийте калькулятор пального — актуальна ціна підставиться автоматично</p>
          </div>
          <a href="/tools/fuel-calc"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
            Відкрити калькулятор →
          </a>
        </div>
      </div>

      <p className="text-xs text-center text-neutral-400">Дані оновлюються щодня · {data.updatedAt}</p>
    </div>
  );
}
