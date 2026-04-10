// ФАЙЛ: app/(app)/tools/fuel-prices/page.tsx
// Клади в: app/(app)/tools/fuel-prices/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";

type FuelType = "A-95+" | "A-95" | "A-92" | "ДП" | "ДП+" | "Газ";

interface StationPrices {
  name: string;
  logo: string;
  "A-95+": number | null;
  "A-95":  number | null;
  "A-92":  number | null;
  "ДП":    number | null;
  "ДП+":   number | null;
  "Газ":   number | null;
}

interface TrendPoint { date: string; "A-95": number; "ДП": number; "Газ": number; }
interface RegionPrices { name: string; "A-95": number; "ДП": number; "Газ": number; }
interface FuelData {
  updatedAt: string; source: string;
  averages: Record<FuelType, number | null>;
  stations: StationPrices[];
  trend: TrendPoint[];
  regions: RegionPrices[];
}

const FUEL_TYPES: FuelType[] = ["A-95+", "A-95", "A-92", "ДП", "ДП+", "Газ"];
const FUEL_COLORS: Record<string, string> = {
  "A-95+": "#8b5cf6", "A-95": "#f97316", "A-92": "#eab308",
  "ДП": "#3b82f6", "ДП+": "#06b6d4", "Газ": "#22c55e",
};
const FUEL_LABELS: Record<string, string> = {
  "A-95+": "Бензин А-95+", "A-95": "Бензин А-95", "A-92": "Бензин А-92",
  "ДП": "Дизель (ДП)", "ДП+": "Дизель+ (ДП+)", "Газ": "Газ (LPG)",
};
const AZS_ORDER = ["WOG","ОККО","UPG","Укрнафта","SOCAR","БРСМ","Shell","КЛО","U.GO","AMIC","Авантаж 7","Marshal"];
const ALL_FUELS_DISPLAY: FuelType[] = ["A-95+","A-95","A-92","ДП","Газ"];

function fmtPrice(n: number | null) { return n === null ? "—" : n.toFixed(2); }
function getPriceColor(price: number | null, avg: number | null) {
  if (!price || !avg) return "text-neutral-500";
  if (price <= avg - 1) return "text-green-500";
  if (price >= avg + 1) return "text-red-400";
  return "text-neutral-800 dark:text-neutral-200";
}
function getAvg(stations: StationPrices[], fuel: FuelType): number | null {
  const vals = stations.map(s => s[fuel]).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a,b) => a+b,0)/vals.length : null;
}
function stelaTopColor(price: number | null, avg: number | null): string {
  if (!price || !avg) return "#888888";
  if (price <= avg - 1) return "#22c55e";
  if (price >= avg + 1) return "#ef4444";
  return "#f97316";
}

function TrendChart({ data, fuelType }: { data: TrendPoint[]; fuelType: "A-95"|"ДП"|"Газ" }) {
  const values = data.map(d => d[fuelType]);
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const H = 80; const W = 100;
  const points = values.map((v,i) => { const x=(i/(values.length-1))*W; const y=H-((v-min)/range)*(H-10)-5; return `${x},${y}`; }).join(" ");
  const lastVal = values[values.length-1]; const prevVal = values[values.length-2];
  const diff = lastVal - prevVal; const color = FUEL_COLORS[fuelType]||"#f97316";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{data[0]?.date}</span>
        <span className={`text-xs font-medium ${diff>=0?"text-red-400":"text-green-500"}`}>{diff>=0?"▲":"▼"} {Math.abs(diff).toFixed(2)} грн</span>
        <span className="text-xs text-neutral-400">{data[data.length-1]?.date}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height:H}}>
        <defs><linearGradient id={`grad-${fuelType}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        <polygon points={`0,${H} ${points} ${W},${H}`} fill={`url(#grad-${fuelType})`}/>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        {(() => { const y=H-((lastVal-min)/range)*(H-10)-5; return <circle cx={W} cy={y} r="2.5" fill={color}/>; })()}
      </svg>
    </div>
  );
}

function FuelStela({ station, activeFuel, avgPrice, allAvgs }: {
  station: StationPrices; activeFuel: FuelType; avgPrice: number | null;
  allAvgs: Partial<Record<FuelType, number|null>>;
}) {
  const activePrice = station[activeFuel];
  const topColor = stelaTopColor(activePrice, avgPrice);
  const rows = ALL_FUELS_DISPLAY.map(f=>({fuel:f,price:station[f],color:FUEL_COLORS[f]})).filter(r=>r.price!==null);
  const W=84; const ROW_H=21; const HEADER_H=32; const PAD=5; const POLE_W=8; const POLE_H=36;
  const BOARD_H=HEADER_H+rows.length*ROW_H+PAD*2; const TOTAL_H=BOARD_H+POLE_H+10;
  return (
    <div className="flex flex-col items-center gap-0">
      <svg width={W} height={TOTAL_H} viewBox={`0 0 ${W} ${TOTAL_H}`} className="opacity-95 hover:opacity-100 transition-opacity">
        <rect x="0" y="0" width={W} height={BOARD_H} rx="4" fill="var(--color-bg,white)" stroke="#d1d5db" strokeWidth="0.5"/>
        <rect x="0" y="0" width={W} height={HEADER_H} rx="4" fill={topColor}/>
        <rect x="0" y={HEADER_H-4} width={W} height="4" fill={topColor}/>
        <text x={W/2} y="12" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="9" fill="white" opacity="0.85">
          {avgPrice?`сер. ₴${avgPrice.toFixed(2)}`:"немає даних"}
        </text>
        <text x={W/2} y="27" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="14" fontWeight="600" fill="white">
          {activePrice?`₴${activePrice.toFixed(2)}`:"—"}
        </text>
        {rows.map((r,i)=>{
          const y=HEADER_H+PAD+i*ROW_H; const isActive=r.fuel===activeFuel;
          const rColor=stelaTopColor(r.price,(allAvgs[r.fuel]??null));
          return (
            <g key={r.fuel}>
              {isActive&&<rect x="2" y={y} width={W-4} height={ROW_H-2} rx="2" fill={r.color+"22"}/>}
              <text x="7" y={y+14} fontFamily="system-ui,sans-serif" fontSize={isActive?"11":"10"} fontWeight={isActive?"500":"400"} fill={isActive?r.color:"#9ca3af"}>{r.fuel}</text>
              <text x={W-6} y={y+14} textAnchor="end" fontFamily="system-ui,sans-serif" fontSize={isActive?"11":"10"} fontWeight={isActive?"600":"400"} fill={isActive?rColor:"#9ca3af"}>{r.price!.toFixed(2)}</text>
            </g>
          );
        })}
        <rect x={W/2-POLE_W/2} y={BOARD_H} width={POLE_W} height={POLE_H} fill="#d1d5db" rx="1"/>
        <rect x={W/2-20} y={BOARD_H+POLE_H} width="40" height="6" rx="2" fill="#d1d5db"/>
      </svg>
      <span className="text-[11px] mt-1.5 font-medium text-neutral-400 dark:text-neutral-500">{station.name}</span>
    </div>
  );
}

export default function FuelPricesPage() {
  const [data, setData] = useState<FuelData|null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFuel, setSelectedFuel] = useState<FuelType>("A-95");
  const [selectedRegion, setSelectedRegion] = useState("Всі");
  const [sortBy, setSortBy] = useState<"name"|"price">("price");
  const [view, setView] = useState<"stations"|"regions"|"trend">("stations");

  useEffect(() => {
    fetch("/api/fuel-prices").then(r=>r.json()).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const avg = data?.averages[selectedFuel]??null;

  const allAvgs = useMemo(()=>{
    const r: Partial<Record<FuelType,number|null>> = {};
    if (data) FUEL_TYPES.forEach(f=>{r[f]=getAvg(data.stations,f);});
    return r;
  },[data]);

  const orderedStelas = useMemo(()=>{
    if (!data) return [];
    return [
      ...AZS_ORDER.map(name=>data.stations.find(s=>s.name===name)).filter((s): s is StationPrices=>!!s&&s[selectedFuel]!==null),
      ...data.stations.filter(s=>!AZS_ORDER.includes(s.name)&&s[selectedFuel]!==null),
    ];
  },[data,selectedFuel]);

  const sortedStations = useMemo(()=>{
    if (!data) return [];
    const filtered = data.stations.filter(s=>s[selectedFuel]!==null);
    return sortBy==="price" ? [...filtered].sort((a,b)=>(a[selectedFuel]??999)-(b[selectedFuel]??999)) : [...filtered].sort((a,b)=>a.name.localeCompare(b.name));
  },[data,selectedFuel,sortBy]);

  if (loading) return (
    <div className="space-y-4 max-w-5xl">
      <div><h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">⛽ Ціни на пальне</h1></div>
      {[1,2,3].map(i=><div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"/>)}
    </div>
  );

  if (!data) return (
    <div className="max-w-5xl"><h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">⛽ Ціни на пальне</h1>
      <div className="text-center py-12 text-neutral-400">Не вдалося завантажити дані.</div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">⛽ Ціни на пальне</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Актуальні ціни на АЗС України · Оновлено: {data.updatedAt}</p>
      </div>

      {/* Перемикач типу пального */}
      <div className="flex flex-wrap gap-2">
        {FUEL_TYPES.filter(f=>f!=="ДП+").map(fuel=>{
          const price=data.averages[fuel]; const isSelected=selectedFuel===fuel;
          return (
            <button key={fuel} onClick={()=>setSelectedFuel(fuel)} disabled={price===null}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${isSelected?"border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-500":price===null?"border-neutral-100 dark:border-neutral-800 opacity-40 cursor-not-allowed text-neutral-400":"border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-orange-200"}`}>
              <span className="w-2 h-2 rounded-full" style={{background:FUEL_COLORS[fuel]}}/>
              {fuel}
              {price&&<span className="tabular-nums text-xs opacity-75">₴{price.toFixed(2)}</span>}
            </button>
          );
        })}
      </div>

      {/* SVG Стели */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max px-1">
          {orderedStelas.map(station=>(
            <FuelStela key={station.name} station={station} activeFuel={selectedFuel} avgPrice={avg} allAvgs={allAvgs}/>
          ))}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex gap-4 flex-wrap text-xs text-neutral-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/>нижче середньої</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"/>середня</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/>вище середньої</span>
      </div>

      {/* Область */}
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

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl w-fit">
        {([{id:"stations",label:"⛽ АЗС"},{id:"regions",label:"🗺 Області"},{id:"trend",label:"📈 Динаміка"}] as const).map(tab=>(
          <button key={tab.id} onClick={()=>setView(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view===tab.id?"bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm":"text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Таблиця АЗС */}
      {view==="stations"&&(
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Ціни на {selectedFuel}</p>
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
                  <tr key={station.name} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${sortBy==="price"&&idx===0?"bg-green-50/50 dark:bg-green-950/10":""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{station.logo}</span>
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{station.name}</span>
                        {sortBy==="price"&&idx===0&&station[selectedFuel]!==null&&(
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 font-bold">найдешевше</span>
                        )}
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
          <div className="px-5 py-3 border-t border-neutral-50 dark:border-neutral-800 flex items-center justify-between">
            <p className="text-xs text-neutral-400">🟢 дешевше середньої &nbsp; 🔴 дорожче середньої</p>
            <p className="text-xs text-neutral-400">Оновлено: {data.updatedAt}</p>
          </div>
        </div>
      )}

      {/* Області */}
      {view==="regions"&&(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.regions.map(region=>{
            const price=region[selectedFuel as "A-95"|"ДП"|"Газ"]??null;
            return (
              <div key={region.name} className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{region.name}</p>
                  {price&&avg&&(
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${price<=avg-0.5?"bg-green-100 dark:bg-green-950/40 text-green-600":price>=avg+0.5?"bg-red-100 dark:bg-red-950/40 text-red-500":"bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>
                      {price<=avg-0.5?"↓ дешевше":price>=avg+0.5?"↑ дорожче":"~ середня"}
                    </span>
                  )}
                </div>
                <p className="text-xl font-black tabular-nums text-neutral-900 dark:text-neutral-100">₴{price?.toFixed(2)??"—"}</p>
                <p className="text-[10px] text-neutral-400 mt-1">А-95: {region["A-95"].toFixed(2)} · ДП: {region["ДП"].toFixed(2)} · Газ: {region["Газ"].toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Динаміка */}
      {view==="trend"&&(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["A-95","ДП","Газ"] as const).map(fuel=>{
              const lastPrice=data.trend[data.trend.length-1]?.[fuel];
              const firstPrice=data.trend[0]?.[fuel];
              const totalDiff=lastPrice&&firstPrice?lastPrice-firstPrice:0;
              return (
                <div key={fuel} className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:FUEL_COLORS[fuel]}}/>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fuel}</p>
                    </div>
                    <span className={`text-xs font-bold ${totalDiff>=0?"text-red-400":"text-green-500"}`}>
                      {totalDiff>=0?"+":""}{totalDiff.toFixed(2)} грн за 2 тижні
                    </span>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-neutral-900 dark:text-neutral-100 mb-3">₴{lastPrice?.toFixed(2)}</p>
                  <TrendChart data={data.trend} fuelType={fuel}/>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Середні ціни по датах</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-50 dark:border-neutral-800">
                    {["Дата","А-95","Дизель","Газ"].map(h=><th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400 uppercase">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {[...data.trend].reverse().map((row,i)=>{
                    const prev=[...data.trend].reverse()[i+1];
                    return (
                      <tr key={row.date} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                        <td className="px-5 py-2.5 text-neutral-500 tabular-nums font-medium">{row.date}</td>
                        {(["A-95","ДП","Газ"] as const).map(fuel=>{
                          const diff=prev?row[fuel]-prev[fuel]:0;
                          return (
                            <td key={fuel} className="px-5 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">₴{row[fuel].toFixed(2)}</span>
                                {prev&&Math.abs(diff)>0.005&&(
                                  <span className={`text-xs tabular-nums ${diff>0?"text-red-400":"text-green-500"}`}>
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

      {/* CTA до калькулятора */}
      <div className="p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">⛽ Порахуйте витрати на поїздку</p>
            <p className="text-xs text-neutral-500">Відкрийте калькулятор пального з актуальною ціною {selectedFuel}</p>
          </div>
          <a href={`/tools/fuel-calc`}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
            Відкрити калькулятор →
          </a>
        </div>
      </div>
    </div>
  );
}