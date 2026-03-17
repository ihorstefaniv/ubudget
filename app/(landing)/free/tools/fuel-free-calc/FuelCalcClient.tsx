// ФАЙЛ: app/(landing)/tools/fuel-calc/FuelCalcClient.tsx
// Копія app/(app)/tools/fuel-calc/page.tsx, перейменована для лендінгу
"use client";

import { useState, useEffect, useRef } from "react";

type FuelType = "petrol" | "diesel" | "gas" | "electric" | "hybrid";
interface Car { name: string; year: string; fuelType: FuelType; consumption: number; consumptionWinter: number; fuelPrice: number; batteryCapacity: number; soh: number; }
interface Route { id: string; from: string; to: string; km: number; timeMin: number; roundTrip: boolean; weeklyCnt: number; }
type Tab = "car" | "routes" | "plan" | "trip";

function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(n: number) { return n.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " грн"; }
function calcRouteCost(route: Route, car: Car, winter = false) {
  const km = route.roundTrip ? route.km * 2 : route.km;
  const consumption = car.fuelType === "electric" ? (winter ? car.consumptionWinter : car.consumption) : car.consumption;
  return { liters: (km * consumption) / 100, cost: ((km * consumption) / 100) * car.fuelPrice, km };
}

const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
);
const icons = {
  car: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m0-10h7l3 5h2a1 1 0 011 1v3l-1 1h-1",
  route: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  plan: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  trip: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  plus: "M12 4v16m8-8H4",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  import: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
};

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (<div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label><input {...props} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all" /></div>);
}
function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (<div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label><select {...props} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all">{children}</select></div>);
}

function MapPicker({ onRouteFound }: { onRouteFound: (from: string, to: string, km: number, timeMin: number) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [searching, setSearching] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ km: number; time: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return;
    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(link); }
      if (!(window as any).L) { await new Promise<void>((resolve) => { const script = document.createElement("script"); script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; script.onload = () => resolve(); document.head.appendChild(script); }); }
      const L = (window as any).L;
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current).setView([49.0, 31.5], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      mapInstanceRef.current = map; setMapLoaded(true);
      map.on("click", async (e: any) => { const { lat, lng } = e.latlng; try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`); const data = await res.json(); const addr = data.display_name?.split(",").slice(0, 2).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`; if (markersRef.current.length < 2) { const icon = L.divIcon({ html: `<div style="background:${markersRef.current.length === 0 ? "#22c55e" : "#ef4444"};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }); const marker = L.marker([lat, lng], { icon }).addTo(map); markersRef.current.push({ marker, lat, lng, addr }); if (markersRef.current.length === 1) setFromAddr(addr); if (markersRef.current.length === 2) { setToAddr(addr); await buildRoute(map, markersRef.current[0], { lat, lng, addr }); } } } catch {} });
    };
    loadLeaflet();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  async function buildRoute(map: any, from: any, to: any) {
    const L = (window as any).L;
    try { setSearching(true); setError(""); if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
      const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`; let routeData = null;
      try { const res = await fetch(`/api/route?coords=${encodeURIComponent(coords)}`); const data = await res.json(); if (data.routes?.[0]) routeData = data.routes[0]; } catch {}
      if (routeData) { const km = Math.round(routeData.distance / 100) / 10; const timeMin = Math.round(routeData.duration / 60); setRouteInfo({ km, time: timeMin }); routeLayerRef.current = L.geoJSON(routeData.geometry, { style: { color: "#fb923c", weight: 4, opacity: 0.8 } }).addTo(map); map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });
      } else { const R = 6371; const dLat = (to.lat - from.lat) * Math.PI / 180; const dLon = (to.lng - from.lng) * Math.PI / 180; const a = Math.sin(dLat/2)**2 + Math.cos(from.lat * Math.PI/180) * Math.cos(to.lat * Math.PI/180) * Math.sin(dLon/2)**2; const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); const roadKm = Math.round(straightKm * 1.3 * 10) / 10; const timeMin = Math.round(roadKm / 60 * 60); setRouteInfo({ km: roadKm, time: timeMin }); routeLayerRef.current = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], { color: "#fb923c", weight: 3, opacity: 0.6, dashArray: "8, 8" }).addTo(map); map.fitBounds([[from.lat, from.lng], [to.lat, to.lng]], { padding: [40, 40] }); setError("⚠️ Орієнтовна відстань (×1.3 до прямої лінії)"); }
    } catch { setError("Помилка побудови маршруту"); } finally { setSearching(false); }
  }

  async function searchRoute() {
    if (!fromAddr || !toAddr || !mapLoaded) return; setSearching(true); setError("");
    const L = (window as any).L; const map = mapInstanceRef.current;
    try { markersRef.current.forEach(({ marker }) => map.removeLayer(marker)); markersRef.current = []; if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; } setRouteInfo(null);
      const geocode = async (addr: string) => { try { const res = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`); const data = await res.json(); if (data[0]) return data[0]; } catch {} try { const res = await fetch(`/api/geocode?q=${encodeURIComponent(addr + ", Україна")}`); const data = await res.json(); if (data[0]) return data[0]; } catch {} return null; };
      const [dataFrom, dataTo] = await Promise.all([geocode(fromAddr), geocode(toAddr)]);
      if (!dataFrom) { setError(`❌ Не знайдено: "${fromAddr}"`); setSearching(false); return; }
      if (!dataTo) { setError(`❌ Не знайдено: "${toAddr}"`); setSearching(false); return; }
      const from = { lat: parseFloat(dataFrom.lat), lng: parseFloat(dataFrom.lon), addr: fromAddr };
      const to = { lat: parseFloat(dataTo.lat), lng: parseFloat(dataTo.lon), addr: toAddr };
      [from, to].forEach((p, i) => { const icon = L.divIcon({ html: `<div style="background:${i === 0 ? "#22c55e" : "#ef4444"};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }); const marker = L.marker([p.lat, p.lng], { icon }).addTo(map); markersRef.current.push({ marker, ...p }); });
      await buildRoute(map, from, to);
    } catch (e: any) { setError(`Помилка: ${e?.message || "невідома"}`); } finally { setSearching(false); }
  }

  function clearMap() { const map = mapInstanceRef.current; if (!map) return; markersRef.current.forEach(({ marker }) => map.removeLayer(marker)); markersRef.current = []; if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; } setRouteInfo(null); setFromAddr(""); setToAddr(""); }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500 dark:text-neutral-400"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5" />Звідки</label><input value={fromAddr} onChange={(e) => setFromAddr(e.target.value)} placeholder="Стрий" onKeyDown={(e) => e.key === "Enter" && searchRoute()} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all" /></div>
        <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500 dark:text-neutral-400"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />Куди</label><input value={toAddr} onChange={(e) => setToAddr(e.target.value)} placeholder="Львів" onKeyDown={(e) => e.key === "Enter" && searchRoute()} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all" /></div>
      </div>
      <div className="flex gap-2">
        <button onClick={searchRoute} disabled={searching || !fromAddr || !toAddr} className="flex-1 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 disabled:opacity-50 transition-colors">{searching ? "Шукаємо..." : "Знайти маршрут"}</button>
        <button onClick={clearMap} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Очистити</button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div ref={mapRef} className="w-full h-72 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden" style={{ zIndex: 0 }} />
      <p className="text-xs text-neutral-400">💡 Або клікніть на карту щоб додати точки вручну</p>
      {routeInfo && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
          <div className="flex gap-6"><div><p className="text-lg font-bold text-orange-500">{routeInfo.km} км</p><p className="text-xs text-neutral-400">Відстань</p></div><div><p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{routeInfo.time} хв</p><p className="text-xs text-neutral-400">Час в дорозі</p></div></div>
          <button onClick={() => onRouteFound(fromAddr, toAddr, routeInfo.km, routeInfo.time)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"><Icon d={icons.import} className="w-4 h-4" />Додати</button>
        </div>
      )}
    </div>
  );
}

export default function FuelCalcClient() {
  const [tab, setTab] = useState<Tab>("car");
  const [winter, setWinter] = useState(false);
  const [car, setCar] = useState<Car>({ name: "", year: "", fuelType: "petrol", consumption: 7.5, consumptionWinter: 9.5, fuelPrice: 62, batteryCapacity: 0, soh: 100 });
  const [routes, setRoutes] = useState<Route[]>([{ id: uid(), from: "Дім", to: "Робота", km: 17.6, timeMin: 22, roundTrip: true, weeklyCnt: 5 }, { id: uid(), from: "Дім", to: "Місто", km: 6.1, timeMin: 10, roundTrip: true, weeklyCnt: 3 }]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tripFrom, setTripFrom] = useState(""); const [tripTo, setTripTo] = useState(""); const [tripKm, setTripKm] = useState(0); const [tripRound, setTripRound] = useState(false);

  function addRoute() { setRoutes((r) => [...r, { id: uid(), from: "", to: "", km: 0, timeMin: 0, roundTrip: true, weeklyCnt: 1 }]); }
  function removeRoute(id: string) { setRoutes((r) => r.filter((x) => x.id !== id)); }
  function updateRoute(id: string, field: keyof Route, value: any) { setRoutes((r) => r.map((x) => x.id === id ? { ...x, [field]: value } : x)); }
  function importFromMap(from: string, to: string, km: number, timeMin: number) { setRoutes((r) => [...r, { id: uid(), from, to, km, timeMin, roundTrip: true, weeklyCnt: 1 }]); setTab("routes"); }

  const weeklyTotal = routes.reduce((sum, r) => sum + calcRouteCost(r, car, winter).cost * r.weeklyCnt, 0);
  const monthlyTotal = weeklyTotal * 4;
  const tripKmFinal = tripRound ? tripKm * 2 : tripKm;
  const tripLiters = (tripKmFinal * car.consumption) / 100;
  const tripCost = tripLiters * car.fuelPrice;
  const fuelLabel = car.fuelType === "electric" ? "кВт" : "л";
  const priceLabel = car.fuelType === "electric" ? "грн/кВт" : "грн/л";
  const tabs = [{ id: "car" as Tab, label: "Авто", icon: icons.car }, { id: "routes" as Tab, label: "Маршрути", icon: icons.route }, { id: "plan" as Tab, label: "План", icon: icons.plan }, { id: "trip" as Tab, label: "Подорож", icon: icons.trip }];

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: "На тиждень", value: fmt(weeklyTotal), color: "text-orange-500" }, { label: "На місяць", value: fmt(monthlyTotal), color: "text-orange-500" }, { label: car.fuelType === "electric" ? "кВт/100км" : "л/100км", value: `${winter ? car.consumptionWinter : car.consumption}`, color: "text-neutral-900 dark:text-neutral-100" }, { label: priceLabel, value: `${car.fuelPrice}`, color: "text-neutral-900 dark:text-neutral-100" }].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4"><p className={`text-xl font-bold ${color}`}>{value}</p><p className="text-xs text-neutral-400 mt-0.5">{label}</p></div>
        ))}
      </div>
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl">
        {tabs.map(({ id, label, icon }) => (<button key={id} onClick={() => setTab(id)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}><Icon d={icon} className="w-4 h-4 shrink-0" /><span className="hidden sm:inline">{label}</span></button>))}
      </div>

      {tab === "car" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-5">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Параметри авто</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Марка / Модель" value={car.name} onChange={(e) => setCar((c) => ({ ...c, name: e.target.value }))} placeholder="Toyota Camry" />
            <Input label="Рік випуску" value={car.year} onChange={(e) => setCar((c) => ({ ...c, year: e.target.value }))} placeholder="2020" />
            <Select label="Вид палива" value={car.fuelType} onChange={(e) => setCar((c) => ({ ...c, fuelType: e.target.value as FuelType }))}><option value="petrol">⛽ Бензин</option><option value="diesel">🛢 Дизель</option><option value="gas">🔵 Газ</option><option value="electric">⚡ Електро</option><option value="hybrid">🔋 Гібрид</option></Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {car.fuelType === "electric" ? (<><Input label="Розхід влітку (кВт/100км)" type="number" value={car.consumption} onChange={(e) => setCar((c) => ({ ...c, consumption: +e.target.value }))} /><Input label="Розхід взимку (кВт/100км)" type="number" value={car.consumptionWinter} onChange={(e) => setCar((c) => ({ ...c, consumptionWinter: +e.target.value }))} /><Input label="Ємність батареї (кВт·год)" type="number" value={car.batteryCapacity} onChange={(e) => setCar((c) => ({ ...c, batteryCapacity: +e.target.value }))} /><Input label="SOH батареї (%)" type="number" value={car.soh} onChange={(e) => setCar((c) => ({ ...c, soh: +e.target.value }))} /></>) : car.fuelType === "hybrid" ? (<><Input label="Розхід (л/100км)" type="number" value={car.consumption} onChange={(e) => setCar((c) => ({ ...c, consumption: +e.target.value }))} /><Input label="Розхід взимку (л/100км)" type="number" value={car.consumptionWinter} onChange={(e) => setCar((c) => ({ ...c, consumptionWinter: +e.target.value }))} /><Input label="Ємність батареї (кВт·год)" type="number" value={car.batteryCapacity} onChange={(e) => setCar((c) => ({ ...c, batteryCapacity: +e.target.value }))} /><Input label="SOH батареї (%)" type="number" value={car.soh} onChange={(e) => setCar((c) => ({ ...c, soh: +e.target.value }))} /></>) : (<Input label="Розхід (л/100км)" type="number" value={car.consumption} onChange={(e) => setCar((c) => ({ ...c, consumption: +e.target.value }))} />)}
            <Input label={priceLabel} type="number" value={car.fuelPrice} onChange={(e) => setCar((c) => ({ ...c, fuelPrice: +e.target.value }))} />
          </div>
          {car.fuelType === "electric" && (<div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700"><div><p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Зимовий режим</p><p className="text-xs text-neutral-400">Підвищений розхід</p></div><button onClick={() => setWinter((v) => !v)} className={`relative w-11 h-6 rounded-full transition-colors ${winter ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${winter ? "translate-x-5" : ""}`} /></button></div>)}
          {car.batteryCapacity > 0 && car.soh > 0 && (<div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30"><p className="text-sm font-medium text-blue-700 dark:text-blue-400">🔋 Реальний запас ходу</p><p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{Math.round((car.batteryCapacity * car.soh / 100) / car.consumption * 100)} км</p><p className="text-xs text-blue-500 mt-0.5">з урахуванням SOH {car.soh}%</p></div>)}
        </div>
      )}

      {tab === "routes" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4"><Icon d={icons.map} className="w-4 h-4 inline mr-2 text-orange-400" />OpenStreetMap — прокласти маршрут</h2>
            <MapPicker onRouteFound={importFromMap} />
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between"><h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Таблиця маршрутів</h2><button onClick={addRoute} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium"><Icon d={icons.plus} className="w-4 h-4" />Додати</button></div>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-neutral-100 dark:border-neutral-800">{["Звідки", "Куди", "км", "хв", "Туди/Назад", fuelLabel, "Вартість", ""].map((h) => (<th key={h} className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">{h}</th>))}</tr></thead><tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">{routes.map((r) => { const { liters, cost } = calcRouteCost(r, car, winter); return (<tr key={r.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/30">{(["from", "to"] as const).map((field) => (<td key={field} className="px-4 py-3">{editingId === r.id && editingField === field ? (<input autoFocus value={r[field]} onChange={(e) => updateRoute(r.id, field, e.target.value)} onBlur={() => { setEditingId(null); setEditingField(null); }} className="w-full px-2 py-1 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-sm focus:outline-none" />) : (<span onDoubleClick={() => { setEditingId(r.id); setEditingField(field); }} className="cursor-pointer text-neutral-900 dark:text-neutral-100 hover:text-orange-400">{r[field] || <span className="text-neutral-400">—</span>}</span>)}</td>))}{(["km", "timeMin"] as const).map((field) => (<td key={field} className="px-4 py-3">{editingId === r.id && editingField === field ? (<input autoFocus type="number" value={r[field]} onChange={(e) => updateRoute(r.id, field, +e.target.value)} onBlur={() => { setEditingId(null); setEditingField(null); }} className="w-16 px-2 py-1 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-sm focus:outline-none" />) : (<span onDoubleClick={() => { setEditingId(r.id); setEditingField(field); }} className="cursor-pointer text-neutral-900 dark:text-neutral-100 hover:text-orange-400">{r[field]}</span>)}</td>))}<td className="px-4 py-3"><button onClick={() => updateRoute(r.id, "roundTrip", !r.roundTrip)} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${r.roundTrip ? "bg-orange-100 dark:bg-orange-950/30 text-orange-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>{r.roundTrip ? "↔ Туди/назад" : "→ В один бік"}</button></td><td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">{liters.toFixed(2)}</td><td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{fmt(cost)}</td><td className="px-4 py-3"><button onClick={() => removeRoute(r.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400"><Icon d={icons.trash} className="w-4 h-4" /></button></td></tr>); })}</tbody></table></div>
            <p className="px-4 py-2 text-xs text-neutral-400">💡 Двічі клікніть на комірку щоб редагувати</p>
          </div>
        </div>
      )}

      {tab === "plan" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-5">Тижневий план поїздок</h2>
            <div className="space-y-3">{routes.map((r) => { const { cost } = calcRouteCost(r, car, winter); return (<div key={r.id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{r.from} → {r.to}<span className="ml-2 text-xs text-neutral-400">{r.km} км</span></p><p className="text-xs text-orange-400 mt-0.5">{fmt(cost)} / поїздка</p></div><div className="flex items-center gap-3 shrink-0"><span className="text-xs text-neutral-400">разів/тиж</span><div className="flex items-center gap-1"><button onClick={() => updateRoute(r.id, "weeklyCnt", Math.max(0, r.weeklyCnt - 1))} className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-bold">−</button><span className="w-8 text-center text-sm font-bold text-neutral-900 dark:text-neutral-100">{r.weeklyCnt}</span><button onClick={() => updateRoute(r.id, "weeklyCnt", r.weeklyCnt + 1)} className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-bold">+</button></div><span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 w-28 text-right">{fmt(cost * r.weeklyCnt)}</span></div></div>); })}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5"><p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">На тиждень</p><p className="text-3xl font-bold text-orange-500">{fmt(weeklyTotal)}</p></div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5"><p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">На місяць (×4)</p><p className="text-3xl font-bold text-orange-500">{fmt(monthlyTotal)}</p></div>
          </div>
        </div>
      )}

      {tab === "trip" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-5">
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Вартість подорожі</h2>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4"><MapPicker onRouteFound={(from, to, km) => { setTripFrom(from); setTripTo(to); setTripKm(km); }} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Input label="Звідки" value={tripFrom} onChange={(e) => setTripFrom(e.target.value)} placeholder="Стрий" /><Input label="Куди" value={tripTo} onChange={(e) => setTripTo(e.target.value)} placeholder="Київ" /><Input label="Відстань (км)" type="number" value={tripKm || ""} onChange={(e) => setTripKm(+e.target.value)} placeholder="0" /></div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700"><div><p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Туди і назад</p><p className="text-xs text-neutral-400">Подвоїти відстань</p></div><button onClick={() => setTripRound((v) => !v)} className={`relative w-11 h-6 rounded-full transition-colors ${tripRound ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${tripRound ? "translate-x-5" : ""}`} /></button></div>
            {tripKm > 0 && (<div className="grid grid-cols-3 gap-4"><div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 text-center"><p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{tripKmFinal} км</p><p className="text-xs text-neutral-400 mt-0.5">Відстань</p></div><div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 text-center"><p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{tripLiters.toFixed(1)} {fuelLabel}</p><p className="text-xs text-neutral-400 mt-0.5">Витрата</p></div><div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-center"><p className="text-2xl font-bold text-orange-500">{fmt(tripCost)}</p><p className="text-xs text-neutral-400 mt-0.5">Вартість</p></div></div>)}
          </div>
        </div>
      )}
    </div>
  );
}