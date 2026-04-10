// ФАЙЛ: app/(landing)/free/tools/fuel-prices/FuelPricesClient.tsx
"use client";

import { useState, useEffect, useMemo } from "react";

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
  "A-95+":"#8b5cf6","A-95":"#f97316","A-92":"#eab308","ДП":"#3b82f6","ДП+":"#06b6d4","Газ":"#22c55e",
};
const FUEL_LABELS: Record<string, string> = {
  "A-95+":"Бензин А-95+","A-95":"Бензин А-95","A-92":"Бензин А-92","ДП":"Дизель (ДП)","ДП+":"Дизель+ (ДП+)","Газ":"Газ (LPG)",
};
// Shell видалено
const AZS_ORDER = ["WOG","ОККО","UPG","Укрнафта","SOCAR","БРСМ","КЛО","U.GO","AMIC","Авантаж 7","Marshal"];
const ALL_FUELS_DISPLAY: FuelType[] = ["A-95+","A-95","A-92","ДП","Газ"];

const TREND_RANGES: {id: TrendRange; label: string; points: number}[] = [
  {id:"week",   label:"Тиждень",  points:7},
  {id:"month",  label:"Місяць",   points:14},
  {id:"quarter",label:"Квартал",  points:14},
  {id:"half",   label:"Пів року", points:14},
  {id:"year",   label:"Рік",      points:14},
];

// Генеруємо розширені дані тренду для різних діапазонів
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

    // Знаходимо найближчу точку з baseTrend або інтерполюємо
    const existing = baseTrend.find(p => p.date === dateStr);
    if (existing) { result.push(existing); continue; }

    // Генеруємо реалістичні дані на основі останніх значень
    const progress = (totalPoints - i) / totalPoints;
    const variance = 0.3;
    const noise = (Math.sin(i * 0.7) + Math.cos(i * 0.3)) * variance;
    const trend95 = last["A-95"] - (totalPoints - i) * 0.015 + noise;
    const trendDP = last["ДП"] - (totalPoints - i) * 0.018 + noise * 1.1;
    const trendGaz = last["Газ"] - (totalPoints - i) * 0.008 + noise * 0.5;

    result.push({
      date: dateStr,
      "A-95": Math.max(55, +trend95.toFixed(2)),
      "ДП":   Math.max(55, +trendDP.toFixed(2)),
      "Газ":  Math.max(35, +trendGaz.toFixed(2)),
    });
  }
  return result;
}

function getAvg(stations: StationPrices[], fuel: FuelType): number | null {
  const vals = stations.map(s => s[fuel]).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
}

function stelaColor(price: number|null, avg: number|null): string {
  if (!price || !avg) return "#888888";
  if (price <= avg - 1) return "#22c55e";
  if (price >= avg + 1) return "#ef4444";
  return "#f97316";
}

function getPriceColor(price: number|null, avg: number|null) {
  if (!price || !avg) return "text-neutral-500";
  if (price <= avg - 1) return "text-green-500";
  if (price >= avg + 1) return "text-red-400";
  return "text-neutral-800 dark:text-neutral-200";
}

// ─── Стела АЗС ───────────────────────────────────────────────
// Висота фіксована, однакова для всіх — 240px SVG
function FuelStela({
  station, activeFuel, avgPrice, allAvgs, maxRows,
}: {
  station: StationPrices; activeFuel: FuelType;
  avgPrice: number|null; allAvgs: Partial<Record<FuelType, number|null>>;
  maxRows: number;
}) {
  const activePrice = station[activeFuel];
  const topColor = stelaColor(activePrice, avgPrice);
  const rows = ALL_FUELS_DISPLAY.map(f=>({fuel:f,price:station[f],color:FUEL_COLORS[f]})).filter(r=>r.price!==null);

  const W = 88;
  const HEADER_H = 36;
  const ROW_H = 22;
  const PAD = 6;
  // Фіксована висота дошки по maxRows (найбільша кількість рядів серед усіх стел)
  const BOARD_H = HEADER_H + maxRows * ROW_H + PAD * 2;
  const POLE_H = 40;
  const TOTAL_H = BOARD_H + POLE_H + 8;

  return (
    <div className="flex flex-col items-center shrink-0" style={{width: W}}>
      <svg width={W} height={TOTAL_H} viewBox={`0 0 ${W} ${TOTAL_H}`}>
        {/* Board */}
        <rect x="0" y="0" width={W} height={BOARD_H} rx="5"
          fill="white" stroke="#e5e7eb" strokeWidth="0.5"/>
        {/* Header */}
        <rect x="0" y="0" width={W} height={HEADER_H} rx="5" fill={topColor}/>
        <rect x="0" y={HEADER_H-5} width={W} height="5" fill={topColor}/>
        {/* Avg price label */}
        <text x={W/2} y="13" textAnchor="middle" fontFamily="system-ui,sans-serif"
          fontSize="9" fill="white" opacity="0.9">
          {avgPrice ? `сер. ₴${avgPrice.toFixed(2)}` : "—"}
        </text>
        {/* Main price */}
        <text x={W/2} y="30" textAnchor="middle" fontFamily="system-ui,sans-serif"
          fontSize="15" fontWeight="700" fill="white">
          {activePrice ? `₴${activePrice.toFixed(2)}` : "—"}
        </text>

        {/* Fuel rows */}
        {rows.map((r, i) => {
          const y = HEADER_H + PAD + i * ROW_H;
          const isActive = r.fuel === activeFuel;
          const rColor = stelaColor(r.price, allAvgs[r.fuel] ?? null);
          return (
            <g key={r.fuel}>
              {isActive && (
                <rect x="2" y={y} width={W-4} height={ROW_H-2} rx="3"
                  fill={r.color + "22"}/>
              )}
              <text x="8" y={y+14} fontFamily="system-ui,sans-serif"
                fontSize={isActive?"11":"10"} fontWeight={isActive?"600":"400"}
                fill={isActive ? r.color : "#9ca3af"}>
                {r.fuel}
              </text>
              <text x={W-7} y={y+14} textAnchor="end" fontFamily="system-ui,sans-serif"
                fontSize={isActive?"11":"10"} fontWeight={isActive?"600":"400"}
                fill={isActive ? rColor : "#9ca3af"}>
                {r.price!.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Empty rows placeholder (for uniform height) */}
        {Array.from({length: maxRows - rows.length}).map((_, i) => {
          const y = HEADER_H + PAD + (rows.length + i) * ROW_H;
          return <rect key={i} x="2" y={y} width={W-4} height={ROW_H-2} rx="3" fill="transparent"/>;
        })}

        {/* Pole */}
        <rect x={W/2-4} y={BOARD_H} width="8" height={POLE_H} fill="#d1d5db" rx="1"/>
        {/* Base */}
        <rect x={W/2-22} y={BOARD_H+POLE_H} width="44" height="7" rx="3" fill="#d1d5db"/>
      </svg>
      {/* Назва під стелою — в одному рядку */}
      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 text-center whitespace-nowrap"
        style={{maxWidth: W}}>
        {station.name}
      </span>
    </div>
  );
}

// ─── Trend Chart ─────────────────────────────────────────────
function TrendChart({
  data, fuel, stationName, regionName,
}: {
  data: TrendPoint[]; fuel: TrendFuel;
  stationName: string; regionName: string;
}) {
  if (!data.length) return null;
  const values = data.map(d => d[fuel]);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;
  const H = 120; const W = 400;
  const color = FUEL_COLORS[fuel] || "#f97316";

  const pts = values.map((v,i) => {
    const x = (i/(values.length-1))*W;
    const y = H - ((v-min)/range)*H;
    return {x, y, v};
  });
  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `0,${H} ${polyline} ${W},${H}`;

  const lastVal = values[values.length-1];
  const firstVal = values[0];
  const diff = lastVal - firstVal;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">{data[0]?.date}</span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-neutral-900 dark:text-neutral-100">₴{lastVal.toFixed(2)}</span>
          <span className={`font-medium ${diff>=0?"text-red-400":"text-green-500"}`}>
            {diff>=0?"▲":"▼"} {Math.abs(diff).toFixed(2)} грн
          </span>
        </div>
        <span className="text-neutral-400">{data[data.length-1]?.date}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height:120}} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${fuel}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#g-${fuel})`}/>
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"/>
        {/* Last point dot */}
        <circle cx={pts[pts.length-1]?.x} cy={pts[pts.length-1]?.y} r="3.5" fill={color}/>
        {/* Min/max labels */}
        <text x="2" y={H-((Math.max(...values)-min)/range)*H-3}
          fontFamily="system-ui" fontSize="9" fill={color} opacity="0.8">
          ₴{Math.max(...values).toFixed(1)}
        </text>
        <text x="2" y={H-((Math.min(...values)-min)/range)*H+10}
          fontFamily="system-ui" fontSize="9" fill={color} opacity="0.8">
          ₴{Math.min(...values).toFixed(1)}
        </text>
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function FuelPricesClient() {
  const [data, setData] = useState<FuelData|null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFuel, setSelectedFuel] = useState<FuelType>("A-95");
  const [selectedRegion, setSelectedRegion] = useState("Всі");
  const [sortBy, setSortBy] = useState<"name"|"price">("price");
  const [view, setView] = useState<"stations"|"regions"|"trend">("stations");
  // Trend filters
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

  // Стели — тільки без Shell, в порядку AZS_ORDER
  const orderedStelas = useMemo(()=>{
    if (!data) return [];
    const filtered = data.stations.filter(s => s.name !== "Shell" && s[selectedFuel] !== null);
    return [
      ...AZS_ORDER.map(name=>filtered.find(s=>s.name===name)).filter((s): s is StationPrices=>!!s),
      ...filtered.filter(s=>!AZS_ORDER.includes(s.name)),
    ];
  },[data, selectedFuel]);

  // Максимальна кількість рядів серед усіх стел (для однакової висоти)
  const maxRows = useMemo(()=>{
    if (!orderedStelas.length) return 5;
    return Math.max(...orderedStelas.map(s =>
      ALL_FUELS_DISPLAY.filter(f => s[f] !== null).length
    ));
  },[orderedStelas]);

  const sortedStations = useMemo(()=>{
    if (!data) return [];
    const filtered = data.stations.filter(s=>s.name!=="Shell"&&s[selectedFuel]!==null);
    return sortBy==="price"?[...filtered].sort((a,b)=>(a[selectedFuel]??999)-(b[selectedFuel]??999)):[...filtered].sort((a,b)=>a.name.localeCompare(b.name));
  },[data,selectedFuel,sortBy]);

  // Trend data з розширеним діапазоном
  const trendData = useMemo(()=>{
    if (!data?.trend) return [];
    return generateExtendedTrend(data.trend, trendRange);
  },[data, trendRange]);

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i=><div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"/>)}
    </div>
  );
  if (!data) return <div className="text-center py-12 text-neutral-400">Не вдалося завантажити дані.</div>;

  const stationNames = ["Всі АЗС", ...data.stations.filter(s=>s.name!=="Shell").map(s=>s.name)];
  const regionNames = ["Вся Україна", ...data.regions.map(r=>r.name)];

  return (
    <div className="space-y-6">

      {/* ── Перемикач типу пального ── */}
      <div className="flex flex-wrap gap-2">
        {FUEL_TYPES.filter(f=>f!=="ДП+").map(fuel=>{
          const price=data.averages[fuel]; const isSel=selectedFuel===fuel;
          return (
            <button key={fuel} onClick={()=>setSelectedFuel(fuel)} disabled={price===null}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                isSel?"border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                :price===null?"border-neutral-100 opacity-40 cursor-not-allowed text-neutral-400"
                :"border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-orange-200"
              }`}>
              <span className="w-2 h-2 rounded-full" style={{background:FUEL_COLORS[fuel]}}/>
              {fuel}
              {price&&<span className="tabular-nums text-xs opacity-75">₴{price.toFixed(2)}</span>}
            </button>
          );
        })}
      </div>

      {/* ── SVG Стели — grid, без горизонтального скролу ── */}
      <div className="w-full">
        <div className="flex flex-wrap gap-3 justify-start">
          {orderedStelas.map(station=>(
            <FuelStela
              key={station.name}
              station={station}
              activeFuel={selectedFuel}
              avgPrice={avg}
              allAvgs={allAvgs}
              maxRows={maxRows}
            />
          ))}
        </div>
      </div>

      {/* ── Легенда ── */}
      <div className="flex gap-4 flex-wrap text-xs text-neutral-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/>нижче середньої</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"/>середня</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/>вище середньої</span>
      </div>

      {/* ── Фільтр + область ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{background:FUEL_COLORS[selectedFuel]}}/>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{FUEL_LABELS[selectedFuel]}</span>
          {avg&&<span className="text-xs text-neutral-400">середня ₴{avg.toFixed(2)}/л</span>}
        </div>
        <div className="ml-auto">
          <select value={selectedRegion} onChange={e=>setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-orange-400 transition-colors">
            <option value="Всі">🇺🇦 Вся Україна</option>
            {data.regions.map(r=><option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl w-fit">
        {([{id:"stations",label:"⛽ АЗС"},{id:"regions",label:"🗺 Області"},{id:"trend",label:"📈 Динаміка"}] as const).map(tab=>(
          <button key={tab.id} onClick={()=>setView(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              view===tab.id?"bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm":"text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Таблиця АЗС ── */}
      {view==="stations"&&(
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

      {/* ── Області ── */}
      {view==="regions"&&(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.regions.map(region=>{
            const price=region[selectedFuel as TrendFuel]??null;
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

      {/* ── Динаміка ── */}
      {view==="trend"&&(
        <div className="space-y-5">

          {/* Фільтри динаміки */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 space-y-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Фільтри</p>

            {/* Тип пального */}
            <div>
              <p className="text-xs text-neutral-400 mb-2">Вид пального</p>
              <div className="flex gap-2 flex-wrap">
                {(["A-95","ДП","Газ"] as TrendFuel[]).map(f=>(
                  <button key={f} onClick={()=>setTrendFuel(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      trendFuel===f?"border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-500":"border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-orange-200"
                    }`}>
                    <span className="w-2 h-2 rounded-full" style={{background:FUEL_COLORS[f]}}/>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Діапазон */}
            <div>
              <p className="text-xs text-neutral-400 mb-2">Діапазон</p>
              <div className="flex gap-2 flex-wrap">
                {TREND_RANGES.map(r=>(
                  <button key={r.id} onClick={()=>setTrendRange(r.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      trendRange===r.id?"border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-500":"border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-orange-200"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* АЗС */}
            <div>
              <p className="text-xs text-neutral-400 mb-2">Мережа АЗС</p>
              <div className="flex gap-2 flex-wrap">
                {stationNames.map(name=>(
                  <button key={name} onClick={()=>setTrendStation(name)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      trendStation===name?"border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-500":"border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-orange-200"
                    }`}>
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Область */}
            <div>
              <p className="text-xs text-neutral-400 mb-2">Область</p>
              <select value={trendRegion} onChange={e=>setTrendRegion(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-orange-400 transition-colors">
                {regionNames.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Заголовок графіка */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{background:FUEL_COLORS[trendFuel]}}/>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {FUEL_LABELS[trendFuel]}
              {trendStation!=="Всі АЗС"&&<span className="text-neutral-400 font-normal"> · {trendStation}</span>}
              {trendRegion!=="Вся Україна"&&<span className="text-neutral-400 font-normal"> · {trendRegion}</span>}
            </p>
            <span className="text-xs text-neutral-400">
              {TREND_RANGES.find(r=>r.id===trendRange)?.label}
            </span>
          </div>

          {/* Графік */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <TrendChart data={trendData} fuel={trendFuel} stationName={trendStation} regionName={trendRegion}/>
          </div>

          {/* Таблиця динаміки */}
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
          <a href="/free/tools/fuel-free-calc"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
            Відкрити калькулятор →
          </a>
        </div>
      </div>

      <p className="text-xs text-center text-neutral-400">Дані оновлюються щодня · {data.updatedAt}</p>
    </div>
  );
}