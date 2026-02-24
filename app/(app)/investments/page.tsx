"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────
type Tab = "portfolio" | "stocks" | "bonds" | "realestate" | "business" | "collections";

interface Stock { id: string; ticker: string; name: string; broker: string; qty: number; buyPrice: number; currentPrice: number; currency: string; buyDate: string; }
interface Bond { id: string; name: string; type: "ovdp" | "corporate"; issuer: string; series: string; amount: number; rate: number; buyDate: string; maturityDate: string; currency: string; freeToSell: boolean; couponPeriod: "monthly" | "quarterly" | "semiannual" | "annual"; }
interface RealEstate { id: string; name: string; address: string; buyPrice: number; currentPrice: number; rentalIncome: number; currency: string; buyDate: string; area: number; }
interface BusinessEmployee { id: string; name: string; role: string; type: "fop" | "hired" | "contractor"; salary: number; }
interface BusinessItem { id: string; label: string; amount: number; }
interface Business { id: string; name: string; type: string; share: number; startDate: string; incomes: BusinessItem[]; expenses: BusinessItem[]; assets: BusinessItem[]; employees: BusinessEmployee[]; }
interface Collection { id: string; name: string; category: string; description: string; buyPrice: number; expectedPrice: number; currency: string; buyDate: string; status: "owned" | "sold"; }

// ─── Mock Data ────────────────────────────────────────────────
const MOCK_STOCKS: Stock[] = [
  { id: "1", ticker: "AAPL", name: "Apple Inc.", broker: "Interactive Brokers", qty: 10, buyPrice: 165, currentPrice: 189, currency: "USD", buyDate: "2023-08-15" },
  { id: "2", ticker: "VOO", name: "Vanguard S&P 500 ETF", broker: "Interactive Brokers", qty: 5, buyPrice: 380, currentPrice: 445, currency: "USD", buyDate: "2023-06-01" },
  { id: "3", ticker: "MSFT", name: "Microsoft Corp.", broker: "Freedom Finance", qty: 3, buyPrice: 310, currentPrice: 378, currency: "USD", buyDate: "2024-01-10" },
];

const MOCK_BONDS: Bond[] = [
  { id: "1", name: "ОВДП 2025", type: "ovdp", issuer: "Мінфін України", series: "UA4000238350", amount: 100000, rate: 16.5, buyDate: "2024-10-01", maturityDate: "2025-10-01", currency: "UAH", freeToSell: true, couponPeriod: "semiannual" },
  { id: "2", name: "ОВДП валютна", type: "ovdp", issuer: "Мінфін України", series: "UA4000198356", amount: 5000, rate: 4.5, buyDate: "2024-06-01", maturityDate: "2026-06-01", currency: "USD", freeToSell: false, couponPeriod: "annual" },
  { id: "3", name: "Нова Пошта 2026", type: "corporate", issuer: "Нова Пошта", series: "NP-2026-A", amount: 50000, rate: 18.5, buyDate: "2024-09-01", maturityDate: "2026-09-01", currency: "UAH", freeToSell: true, couponPeriod: "quarterly" },
  { id: "4", name: "МХП 2027", type: "corporate", issuer: "МХП", series: "MHP-2027-B", amount: 30000, rate: 17.0, buyDate: "2025-01-01", maturityDate: "2027-01-01", currency: "UAH", freeToSell: false, couponPeriod: "semiannual" },
];

const MOCK_REALESTATE: RealEstate[] = [
  { id: "1", name: "Квартира Львів", address: "вул. Городоцька, 50", buyPrice: 1800000, currentPrice: 2100000, rentalIncome: 18000, currency: "UAH", buyDate: "2021-05-01", area: 52 },
  { id: "2", name: "Комерційне Стрий", address: "вул. Шевченка, 12", buyPrice: 600000, currentPrice: 750000, rentalIncome: 8000, currency: "UAH", buyDate: "2022-03-01", area: 35 },
];

const MOCK_BUSINESSES: Business[] = [
  {
    id: "1", name: "ФОП Стефанів І.О.", type: "Кав'ярня", share: 100, startDate: "2020-01-01",
    incomes: [{ id: "i1", label: "Виручка від продажів", amount: 85000 }, { id: "i2", label: "Доставка", amount: 12000 }],
    expenses: [{ id: "e1", label: "Оренда", amount: 15000 }, { id: "e2", label: "Інгредієнти (35%)", amount: 33950 }, { id: "e3", label: "Комунальні", amount: 3500 }, { id: "e4", label: "Термінал", amount: 700 }, { id: "e5", label: "Бухгалтер", amount: 1800 }, { id: "e6", label: "Податки ФОП", amount: 2400 }],
    assets: [{ id: "a1", label: "Кавова машина", amount: 85000 }, { id: "a2", label: "Меблі та інтер'єр", amount: 120000 }, { id: "a3", label: "Товарний залишок", amount: 15000 }],
    employees: [{ id: "p1", name: "Оксана Мельник", role: "Баріста", type: "hired", salary: 18000 }, { id: "p2", name: "Тарас Коваль", role: "Баріста (пт-нд)", type: "fop", salary: 9000 }],
  },
];

const MOCK_COLLECTIONS: Collection[] = [
  { id: "1", name: "Монета 10 грн 1999 р.", category: "Нумізматика", description: "Рідкісний випуск НБУ", buyPrice: 850, expectedPrice: 2500, currency: "UAH", buyDate: "2022-04-01", status: "owned" },
  { id: "2", name: "Вініл Pink Floyd", category: "Вініл", description: "The Dark Side of the Moon, оригінал 1973", buyPrice: 3200, expectedPrice: 8000, currency: "UAH", buyDate: "2023-11-15", status: "owned" },
  { id: "3", name: "Картина аквареллю", category: "Мистецтво", description: "Карпатський пейзаж, Олег Шупляк", buyPrice: 12000, expectedPrice: 18000, currency: "UAH", buyDate: "2024-02-01", status: "owned" },
];

// ─── Helpers ──────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(n: number, cur = "UAH") {
  const v = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (cur === "USD") return `$${v}`;
  if (cur === "EUR") return `€${v}`;
  return `${v} грн`;
}
function pct(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`; }
function daysUntil(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }
function monthsLeft(d: string) { const e = new Date(d); const n = new Date(); return Math.max(0, (e.getFullYear() - n.getFullYear()) * 12 + e.getMonth() - n.getMonth()); }
const USD_RATE = 41.5;

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  plus: "M12 4v16m8-8H4", close: "M6 18L18 6M6 6l12 12",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  trend: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  warn: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  person: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
};

// ─── Shared UI ────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = "text-neutral-900 dark:text-neutral-100", bg = "bg-white dark:bg-neutral-900" }: { label: string; value: string; sub?: string; color?: string; bg?: string }) => (
  <div className={`${bg} rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4`}>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    {sub && <p className={`text-xs font-medium mt-0.5 ${sub.startsWith("+") ? "text-green-500" : sub.startsWith("-") ? "text-red-500" : "text-neutral-400"}`}>{sub}</p>}
    <p className="text-xs text-neutral-400 mt-1">{label}</p>
  </div>
);

function ModalWrap({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto border-t sm:border border-neutral-100 dark:border-neutral-800 shadow-xl [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between z-10">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><Icon d={icons.close} className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all";
const btn = "w-full py-3.5 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 transition-colors";

// ─── PORTFOLIO TAB ────────────────────────────────────────────
function PortfolioTab({ stocks, bonds, realestate, businesses, collections }: { stocks: Stock[]; bonds: Bond[]; realestate: RealEstate[]; businesses: Business[]; collections: Collection[] }) {
  const stocksValue = stocks.reduce((s, x) => s + x.qty * x.currentPrice * (x.currency === "USD" ? USD_RATE : 1), 0);
  const stocksCost = stocks.reduce((s, x) => s + x.qty * x.buyPrice * (x.currency === "USD" ? USD_RATE : 1), 0);
  const bondsValue = bonds.reduce((s, x) => s + x.amount * (x.currency === "USD" ? USD_RATE : 1), 0);
  const reValue = realestate.reduce((s, x) => s + x.currentPrice, 0);
  const reCost = realestate.reduce((s, x) => s + x.buyPrice, 0);
  const bizValue = businesses.reduce((s, b) => s + b.assets.reduce((a, x) => a + x.amount, 0), 0);
  const colValue = collections.filter(c => c.status === "owned").reduce((s, x) => s + x.expectedPrice * (x.currency === "USD" ? USD_RATE : 1), 0);
  const colCost = collections.filter(c => c.status === "owned").reduce((s, x) => s + x.buyPrice * (x.currency === "USD" ? USD_RATE : 1), 0);
  const total = stocksValue + bondsValue + reValue + bizValue + colValue;
  const totalCost = stocksCost + bondsValue + reCost + bizValue + colCost;
  const totalPnL = total - totalCost;

  const classes = [
    { label: "Акції & ETF", value: stocksValue, color: "bg-blue-400" },
    { label: "Облігації", value: bondsValue, color: "bg-violet-400" },
    { label: "Нерухомість", value: reValue, color: "bg-orange-400" },
    { label: "Бізнес", value: bizValue, color: "bg-green-400" },
    { label: "Колекції", value: colValue, color: "bg-pink-400" },
  ].filter(c => c.value > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Загальний портфель" value={fmt(total)} color="text-orange-500" />
        <StatCard label="P&L загальний" value={fmt(Math.abs(totalPnL))} sub={`${pct((totalPnL / totalCost) * 100)} від вкладень`} color={totalPnL >= 0 ? "text-green-500" : "text-red-500"} />
        <StatCard label="Акції & ETF" value={fmt(stocksValue)} sub={pct(((stocksValue - stocksCost) / stocksCost) * 100)} />
        <StatCard label="Нерухомість" value={fmt(reValue)} sub={pct(((reValue - reCost) / reCost) * 100)} />
      </div>

      {/* Asset allocation bars */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Розподіл активів</h3>
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
          {classes.map(c => (
            <div key={c.label} className={`${c.color} transition-all`} style={{ width: `${(c.value / total * 100).toFixed(1)}%` }} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {classes.map(c => (
            <div key={c.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${c.color} shrink-0`} />
              <div>
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{c.label}</p>
                <p className="text-xs text-neutral-400">{fmt(c.value)} · {(c.value / total * 100).toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync notice */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
        <Icon d={icons.trend} className="w-5 h-5 text-blue-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Синхронізація активна</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Крипто та метали підтягуються з Рахунків · Доходи від оренди та дивіденди записуються в Транзакції</p>
        </div>
      </div>
    </div>
  );
}

// ─── STOCKS TAB ───────────────────────────────────────────────
function StocksModal({ onClose, onSave, edit }: { onClose: () => void; onSave: (s: Stock) => void; edit?: Stock }) {
  const [ticker, setTicker] = useState(edit?.ticker ?? "");
  const [name, setName] = useState(edit?.name ?? "");
  const [broker, setBroker] = useState(edit?.broker ?? "Interactive Brokers");
  const [qty, setQty] = useState(edit?.qty.toString() ?? "");
  const [buyPrice, setBuyPrice] = useState(edit?.buyPrice.toString() ?? "");
  const [currentPrice, setCurrentPrice] = useState(edit?.currentPrice.toString() ?? "");
  const [currency, setCurrency] = useState(edit?.currency ?? "USD");
  const [buyDate, setBuyDate] = useState(edit?.buyDate ?? "");

  return (
    <ModalWrap title={edit ? "Редагувати позицію" : "Додати акцію / ETF"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Тікер"><input className={inp} value={ticker} onChange={e => setTicker(e.target.value)} placeholder="AAPL" /></Field>
        <Field label="Назва"><input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Apple Inc." /></Field>
        <Field label="Брокер"><input className={inp} value={broker} onChange={e => setBroker(e.target.value)} placeholder="Interactive Brokers" /></Field>
        <Field label="Кількість"><input className={inp} type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="10" /></Field>
        <Field label="Ціна купівлі"><input className={inp} type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="165" /></Field>
        <Field label="Поточна ціна"><input className={inp} type="number" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="189" /></Field>
        <Field label="Дата купівлі"><input className={inp} type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} /></Field>
        <Field label="Валюта">
          <select className={inp} value={currency} onChange={e => setCurrency(e.target.value)}>
            {["USD", "EUR", "UAH"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      {qty && buyPrice && currentPrice && (
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <p className="text-xs text-neutral-400 mb-1">Прев'ю P&L</p>
          <p className={`text-lg font-bold ${+currentPrice >= +buyPrice ? "text-green-500" : "text-red-500"}`}>
            {+currentPrice >= +buyPrice ? "+" : ""}{fmt(+qty * (+currentPrice - +buyPrice), currency)} · {pct((+currentPrice - +buyPrice) / +buyPrice * 100)}
          </p>
        </div>
      )}
      <button className={btn} onClick={() => { if (!ticker || !qty || !buyPrice) return; onSave({ id: edit?.id ?? uid(), ticker, name, broker, qty: +qty, buyPrice: +buyPrice, currentPrice: +currentPrice || +buyPrice, currency, buyDate }); onClose(); }}>
        {edit ? "Зберегти" : "Додати"}
      </button>
    </ModalWrap>
  );
}

function StocksTab({ stocks, setStocks }: { stocks: Stock[]; setStocks: React.Dispatch<React.SetStateAction<Stock[]>> }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Stock | undefined>();

  const totalValue = stocks.reduce((s, x) => s + x.qty * x.currentPrice * (x.currency === "USD" ? USD_RATE : 1), 0);
  const totalCost = stocks.reduce((s, x) => s + x.qty * x.buyPrice * (x.currency === "USD" ? USD_RATE : 1), 0);
  const totalPnL = totalValue - totalCost;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Вартість портфеля" value={fmt(totalValue)} color="text-blue-500" />
        <StatCard label="Вкладено" value={fmt(totalCost)} />
        <StatCard label="P&L" value={fmt(Math.abs(totalPnL))} sub={pct(totalPnL / totalCost * 100)} color={totalPnL >= 0 ? "text-green-500" : "text-red-500"} />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Позиції</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {stocks.map(s => {
            const value = s.qty * s.currentPrice;
            const cost = s.qty * s.buyPrice;
            const pl = value - cost;
            const plPct = (pl / cost) * 100;
            return (
              <div key={s.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{s.ticker.slice(0, 3)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{s.ticker} <span className="font-normal text-neutral-400">· {s.name}</span></p>
                  <p className="text-xs text-neutral-400">{s.broker} · {s.qty} шт. · ціна купівлі {s.buyPrice} {s.currency}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{s.currentPrice} {s.currency}</p>
                  <p className={`text-xs font-medium ${pl >= 0 ? "text-green-500" : "text-red-500"}`}>{pl >= 0 ? "+" : ""}{fmt(pl, s.currency)} ({pct(plPct)})</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditItem(s); setModal(true); }} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors"><Icon d={icons.edit} className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setStocks(p => p.filter(x => x.id !== s.id))} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {modal && <StocksModal onClose={() => { setModal(false); setEditItem(undefined); }} onSave={s => setStocks(p => editItem ? p.map(x => x.id === s.id ? s : x) : [s, ...p])} edit={editItem} />}
    </div>
  );
}

// ─── BONDS TAB ────────────────────────────────────────────────
function BondsModal({ onClose, onSave, edit }: { onClose: () => void; onSave: (b: Bond) => void; edit?: Bond }) {
  const [type, setType] = useState<"ovdp" | "corporate">(edit?.type ?? "ovdp");
  const [name, setName] = useState(edit?.name ?? "");
  const [issuer, setIssuer] = useState(edit?.issuer ?? "");
  const [series, setSeries] = useState(edit?.series ?? "");
  const [amount, setAmount] = useState(edit?.amount.toString() ?? "");
  const [rate, setRate] = useState(edit?.rate.toString() ?? "");
  const [currency, setCurrency] = useState(edit?.currency ?? "UAH");
  const [buyDate, setBuyDate] = useState(edit?.buyDate ?? "");
  const [maturityDate, setMaturityDate] = useState(edit?.maturityDate ?? "");
  const [freeToSell, setFreeToSell] = useState(edit?.freeToSell ?? true);
  const [couponPeriod, setCouponPeriod] = useState<Bond["couponPeriod"]>(edit?.couponPeriod ?? "semiannual");

  const months = maturityDate && buyDate ? Math.max(0, (new Date(maturityDate).getFullYear() - new Date(buyDate).getFullYear()) * 12 + new Date(maturityDate).getMonth() - new Date(buyDate).getMonth()) : 0;
  const income = amount && rate ? +amount * (+rate / 100) * (months / 12) : 0;

  const CORPORATE_ISSUERS = ["Нова Пошта", "МХП", "Укренерго", "Укрзалізниця", "ДТЕК", "Метінвест", "Kernel", "Інший"];

  return (
    <ModalWrap title={edit ? "Редагувати облігацію" : "Додати облігацію"} onClose={onClose}>
      <div className="flex gap-2">
        {(["ovdp", "corporate"] as const).map(t => (
          <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${type === t ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
            {t === "ovdp" ? "🇺🇦 ОВДП" : "🏢 Корпоративна"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Назва"><input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="ОВДП 2025" /></Field>
        <Field label={type === "ovdp" ? "Емітент" : "Компанія"}>
          {type === "corporate" ? (
            <select className={inp} value={issuer} onChange={e => setIssuer(e.target.value)}>
              <option value="">Оберіть...</option>
              {CORPORATE_ISSUERS.map(i => <option key={i}>{i}</option>)}
            </select>
          ) : (
            <input className={inp} value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="Мінфін України" />
          )}
        </Field>
        <Field label="Серія / ISIN"><input className={inp} value={series} onChange={e => setSeries(e.target.value)} placeholder="UA4000238350" /></Field>
        <Field label="Сума інвестиції"><input className={inp} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100000" /></Field>
        <Field label="Ставка (%)"><input className={inp} type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="16.5" /></Field>
        <Field label="Валюта">
          <select className={inp} value={currency} onChange={e => setCurrency(e.target.value)}>
            {["UAH", "USD", "EUR"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Дата купівлі"><input className={inp} type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} /></Field>
        <Field label="Дата погашення"><input className={inp} type="date" value={maturityDate} onChange={e => setMaturityDate(e.target.value)} /></Field>
      </div>

      <Field label="Купонний період">
        <div className="grid grid-cols-4 gap-2">
          {([["monthly", "Щомісяця"], ["quarterly", "Квартал"], ["semiannual", "Пів року"], ["annual", "Рік"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setCouponPeriod(v)} className={`py-2 rounded-xl text-xs font-medium border transition-all ${couponPeriod === v ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{l}</button>
          ))}
        </div>
      </Field>

      <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
        <div>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Вільний до продажу</p>
          <p className="text-xs text-neutral-400">На вторинному ринку</p>
        </div>
        <button onClick={() => setFreeToSell(v => !v)} className={`relative w-11 h-6 rounded-full transition-colors ${freeToSell ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${freeToSell ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {income > 0 && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
          <p className="text-xs text-green-600 font-medium">Очікуваний дохід за {months} міс.</p>
          <p className="text-xl font-bold text-green-600 mt-0.5">+{fmt(income, currency)}</p>
        </div>
      )}
      <button className={btn} onClick={() => { if (!name || !amount || !rate) return; onSave({ id: edit?.id ?? uid(), type, name, issuer, series, amount: +amount, rate: +rate, currency, buyDate, maturityDate, freeToSell, couponPeriod }); onClose(); }}>
        {edit ? "Зберегти" : "Додати облігацію"}
      </button>
    </ModalWrap>
  );
}

function BondsTab({ bonds, setBonds }: { bonds: Bond[]; setBonds: React.Dispatch<React.SetStateAction<Bond[]>> }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Bond | undefined>();
  const [filter, setFilter] = useState<"all" | "ovdp" | "corporate">("all");

  const filtered = bonds.filter(b => filter === "all" || b.type === filter);
  const totalUAH = bonds.reduce((s, b) => s + b.amount * (b.currency === "USD" ? USD_RATE : 1), 0);
  const totalIncome = bonds.reduce((s, b) => s + b.amount * (b.rate / 100) * (monthsLeft(b.maturityDate) / 12), 0);

  const couponLabels: Record<string, string> = { monthly: "щомісяця", quarterly: "щокварталу", semiannual: "кожні пів року", annual: "щорічно" };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Інвестовано" value={fmt(totalUAH)} color="text-violet-500" />
        <StatCard label="Очікуваний дохід" value={fmt(totalIncome)} color="text-green-500" />
        <StatCard label="Вільних до продажу" value={bonds.filter(b => b.freeToSell).length.toString()} />
      </div>

      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit">
        {([["all", "Всі"], ["ovdp", "🇺🇦 ОВДП"], ["corporate", "🏢 Корпоративні"]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === v ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>{l}</button>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Облігації</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium"><Icon d={icons.plus} className="w-4 h-4" />Додати</button>
        </div>
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {filtered.map(b => {
            const income = b.amount * (b.rate / 100) * (monthsLeft(b.maturityDate) / 12);
            return (
              <div key={b.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{b.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.type === "ovdp" ? "bg-blue-100 dark:bg-blue-950/30 text-blue-600" : "bg-purple-100 dark:bg-purple-950/30 text-purple-600"}`}>{b.type === "ovdp" ? "ОВДП" : "Корпоративна"}</span>
                      {b.freeToSell && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/20 text-green-600 font-medium">Вільна до продажу</span>}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{b.issuer} · {b.series}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditItem(b); setModal(true); }} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center"><Icon d={icons.edit} className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setBonds(p => p.filter(x => x.id !== b.id))} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Сума", value: fmt(b.amount, b.currency) },
                    { label: "Ставка", value: `${b.rate}%` },
                    { label: "Дохід", value: `+${fmt(income, b.currency)}` },
                    { label: "Погашення", value: `${new Date(b.maturityDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })} · ${monthsLeft(b.maturityDate)} міс.` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-neutral-400">{label}</p>
                      <p className={`text-sm font-medium mt-0.5 ${label === "Дохід" ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mt-2">Купон {couponLabels[b.couponPeriod]}</p>
              </div>
            );
          })}
        </div>
      </div>
      {modal && <BondsModal onClose={() => { setModal(false); setEditItem(undefined); }} onSave={b => setBonds(p => editItem ? p.map(x => x.id === b.id ? b : x) : [b, ...p])} edit={editItem} />}
    </div>
  );
}

// ─── REAL ESTATE TAB ─────────────────────────────────────────
function RealEstateModal({ onClose, onSave, edit }: { onClose: () => void; onSave: (r: RealEstate) => void; edit?: RealEstate }) {
  const [f, setF] = useState({ name: edit?.name ?? "", address: edit?.address ?? "", buyPrice: edit?.buyPrice.toString() ?? "", currentPrice: edit?.currentPrice.toString() ?? "", rentalIncome: edit?.rentalIncome.toString() ?? "", currency: edit?.currency ?? "UAH", buyDate: edit?.buyDate ?? "", area: edit?.area.toString() ?? "" });
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const roi = f.buyPrice && f.rentalIncome ? (+f.rentalIncome * 12 / +f.buyPrice * 100).toFixed(1) : null;
  const appreciation = f.buyPrice && f.currentPrice ? ((+f.currentPrice - +f.buyPrice) / +f.buyPrice * 100).toFixed(1) : null;

  return (
    <ModalWrap title={edit ? "Редагувати об'єкт" : "Додати нерухомість"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Назва"><input className={inp} value={f.name} onChange={up("name")} placeholder="Квартира Львів" /></Field>
        <Field label="Площа (м²)"><input className={inp} type="number" value={f.area} onChange={up("area")} placeholder="52" /></Field>
        <div className="col-span-2"><Field label="Адреса"><input className={inp} value={f.address} onChange={up("address")} placeholder="вул. Городоцька, 50" /></Field></div>
        <Field label="Ціна купівлі"><input className={inp} type="number" value={f.buyPrice} onChange={up("buyPrice")} placeholder="1800000" /></Field>
        <Field label="Поточна ціна"><input className={inp} type="number" value={f.currentPrice} onChange={up("currentPrice")} placeholder="2100000" /></Field>
        <Field label="Дохід з оренди / міс"><input className={inp} type="number" value={f.rentalIncome} onChange={up("rentalIncome")} placeholder="18000" /></Field>
        <Field label="Дата купівлі"><input className={inp} type="date" value={f.buyDate} onChange={up("buyDate")} /></Field>
      </div>
      {(roi || appreciation) && (
        <div className="grid grid-cols-2 gap-3">
          {roi && <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30"><p className="text-xs text-green-600">ROI оренди / рік</p><p className="text-lg font-bold text-green-600">{roi}%</p></div>}
          {appreciation && <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30"><p className="text-xs text-blue-600">Зростання вартості</p><p className="text-lg font-bold text-blue-600">{+appreciation >= 0 ? "+" : ""}{appreciation}%</p></div>}
        </div>
      )}
      <button className={btn} onClick={() => { if (!f.name || !f.buyPrice) return; onSave({ id: edit?.id ?? uid(), ...f, buyPrice: +f.buyPrice, currentPrice: +f.currentPrice || +f.buyPrice, rentalIncome: +f.rentalIncome, area: +f.area }); onClose(); }}>
        {edit ? "Зберегти" : "Додати"}
      </button>
    </ModalWrap>
  );
}

function RealEstateTab({ realestate, setRealestate }: { realestate: RealEstate[]; setRealestate: React.Dispatch<React.SetStateAction<RealEstate[]>> }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<RealEstate | undefined>();
  const totalValue = realestate.reduce((s, r) => s + r.currentPrice, 0);
  const totalRental = realestate.reduce((s, r) => s + r.rentalIncome, 0);
  const totalAppreciation = realestate.reduce((s, r) => s + (r.currentPrice - r.buyPrice), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Загальна вартість" value={fmt(totalValue)} color="text-orange-500" />
        <StatCard label="Дохід з оренди / міс" value={fmt(totalRental)} color="text-green-500" sub={`${fmt(totalRental * 12)} / рік`} />
        <StatCard label="Зростання капіталу" value={fmt(totalAppreciation)} color={totalAppreciation >= 0 ? "text-green-500" : "text-red-500"} />
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Об'єкти</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium"><Icon d={icons.plus} className="w-4 h-4" />Додати</button>
        </div>
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {realestate.map(r => {
            const roi = (r.rentalIncome * 12 / r.buyPrice * 100).toFixed(1);
            const appr = ((r.currentPrice - r.buyPrice) / r.buyPrice * 100).toFixed(1);
            return (
              <div key={r.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{r.name}</p>
                    <p className="text-xs text-neutral-400">{r.address} · {r.area} м²</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditItem(r); setModal(true); }} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center"><Icon d={icons.edit} className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setRealestate(p => p.filter(x => x.id !== r.id))} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Куплено за", value: fmt(r.buyPrice) },
                    { label: "Поточна вартість", value: fmt(r.currentPrice) },
                    { label: "Оренда / міс", value: fmt(r.rentalIncome) },
                    { label: "ROI оренди", value: `${roi}% / рік` },
                  ].map(({ label, value }) => (
                    <div key={label}><p className="text-xs text-neutral-400">{label}</p><p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">{value}</p></div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${+appr >= 0 ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-red-100 dark:bg-red-950/20 text-red-500"}`}>
                    {+appr >= 0 ? "+" : ""}{appr}% зростання
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/20 text-orange-600 font-medium">{fmt((r.currentPrice - r.buyPrice) + r.rentalIncome * 12)} загальний дохід / рік</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {modal && <RealEstateModal onClose={() => { setModal(false); setEditItem(undefined); }} onSave={r => setRealestate(p => editItem ? p.map(x => x.id === r.id ? r : x) : [r, ...p])} edit={editItem} />}
    </div>
  );
}

// ─── BUSINESS TAB ─────────────────────────────────────────────
function BusinessTab({ businesses, setBusinesses }: { businesses: Business[]; setBusinesses: React.Dispatch<React.SetStateAction<Business[]>> }) {
  const [selected, setSelected] = useState<string>(businesses[0]?.id ?? "");
  const [addModal, setAddModal] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newBizType, setNewBizType] = useState("");
  const [newBizShare, setNewBizShare] = useState("100");

  const biz = businesses.find(b => b.id === selected);
  if (!biz && businesses.length === 0) return (
    <div className="text-center py-16 text-neutral-400">
      <p className="text-4xl mb-3">🏪</p>
      <p className="text-sm mb-4">Бізнесів не додано</p>
      <button onClick={() => setAddModal(true)} className="px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">Додати бізнес</button>
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm space-y-4 border border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Новий бізнес</h3>
            <Field label="Назва"><input className={inp} value={newBizName} onChange={e => setNewBizName(e.target.value)} placeholder="ФОП Іваненко" /></Field>
            <Field label="Тип бізнесу"><input className={inp} value={newBizType} onChange={e => setNewBizType(e.target.value)} placeholder="Кав'ярня, IT, Торгівля..." /></Field>
            <Field label="Частка (%)"><input className={inp} type="number" value={newBizShare} onChange={e => setNewBizShare(e.target.value)} /></Field>
            <div className="flex gap-2">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">Скасувати</button>
              <button onClick={() => { if (!newBizName) return; const nb: Business = { id: uid(), name: newBizName, type: newBizType, share: +newBizShare, startDate: new Date().toISOString().slice(0, 10), incomes: [], expenses: [], assets: [], employees: [] }; setBusinesses(p => [...p, nb]); setSelected(nb.id); setAddModal(false); }} className="flex-1 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-bold">Додати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const totalIncome = biz ? biz.incomes.reduce((s, x) => s + x.amount, 0) : 0;
  const totalExpense = biz ? biz.expenses.reduce((s, x) => s + x.amount, 0) : 0;
  const totalAssets = biz ? biz.assets.reduce((s, x) => s + x.amount, 0) : 0;
  const totalSalary = biz ? biz.employees.reduce((s, e) => s + e.salary, 0) : 0;
  const netProfit = totalIncome - totalExpense - totalSalary;
  const margin = totalIncome > 0 ? (netProfit / totalIncome * 100).toFixed(1) : "0";

  function updateBiz(updated: Business) { setBusinesses(p => p.map(b => b.id === updated.id ? updated : b)); }
  function addItem(field: "incomes" | "expenses" | "assets") {
    if (!biz) return;
    const item: BusinessItem = { id: uid(), label: "Нова стаття", amount: 0 };
    updateBiz({ ...biz, [field]: [...biz[field], item] });
  }
  function updateItem(field: "incomes" | "expenses" | "assets", id: string, key: "label" | "amount", val: string) {
    if (!biz) return;
    updateBiz({ ...biz, [field]: biz[field].map(x => x.id === id ? { ...x, [key]: key === "amount" ? +val : val } : x) });
  }
  function removeItem(field: "incomes" | "expenses" | "assets", id: string) {
    if (!biz) return; updateBiz({ ...biz, [field]: biz[field].filter(x => x.id !== id) });
  }
  function addEmployee() {
    if (!biz) return;
    updateBiz({ ...biz, employees: [...biz.employees, { id: uid(), name: "Новий", role: "", type: "hired", salary: 0 }] });
  }
  function updateEmployee(id: string, key: keyof BusinessEmployee, val: string | number) {
    if (!biz) return; updateBiz({ ...biz, employees: biz.employees.map(e => e.id === id ? { ...e, [key]: val } : e) });
  }
  function removeEmployee(id: string) { if (!biz) return; updateBiz({ ...biz, employees: biz.employees.filter(e => e.id !== id) }); }

  const ItemRow = ({ item, field }: { item: BusinessItem; field: "incomes" | "expenses" | "assets" }) => (
    <div className="flex items-center gap-2 group">
      <input value={item.label} onChange={e => updateItem(field, item.id, "label", e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all" />
      <input type="number" value={item.amount} onChange={e => updateItem(field, item.id, "amount", e.target.value)} className="w-32 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-right text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all" />
      <button onClick={() => removeItem(field, item.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all"><Icon d={icons.trash} className="w-4 h-4" /></button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Business selector */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {businesses.map(b => (
            <button key={b.id} onClick={() => setSelected(b.id)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selected === b.id ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300"}`}>
              {b.name} <span className="text-xs opacity-60">{b.share < 100 ? `${b.share}%` : ""}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium shrink-0"><Icon d={icons.plus} className="w-4 h-4" />Бізнес</button>
      </div>

      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm space-y-4 border border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Новий бізнес</h3>
            <Field label="Назва"><input className={inp} value={newBizName} onChange={e => setNewBizName(e.target.value)} placeholder="ФОП Іваненко" /></Field>
            <Field label="Тип бізнесу"><input className={inp} value={newBizType} onChange={e => setNewBizType(e.target.value)} placeholder="Кав'ярня, IT, Торгівля..." /></Field>
            <Field label="Моя частка (%)"><input className={inp} type="number" value={newBizShare} onChange={e => setNewBizShare(e.target.value)} /></Field>
            <div className="flex gap-2">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">Скасувати</button>
              <button onClick={() => { if (!newBizName) return; const nb: Business = { id: uid(), name: newBizName, type: newBizType, share: +newBizShare, startDate: new Date().toISOString().slice(0, 10), incomes: [], expenses: [], assets: [], employees: [] }; setBusinesses(p => [...p, nb]); setSelected(nb.id); setAddModal(false); setNewBizName(""); setNewBizType(""); setNewBizShare("100"); }} className="flex-1 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-bold">Додати</button>
            </div>
          </div>
        </div>
      )}

      {biz && (
        <>
          {/* P&L Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Дохід / міс" value={fmt(totalIncome)} color="text-green-500" />
            <StatCard label="Витрати / міс" value={fmt(totalExpense + totalSalary)} color="text-red-500" />
            <StatCard label="Чистий прибуток" value={fmt(Math.abs(netProfit))} sub={`${+margin >= 0 ? "+" : ""}${margin}% рентабельність`} color={netProfit >= 0 ? "text-orange-500" : "text-red-500"} />
            <StatCard label="Активи бізнесу" value={fmt(totalAssets)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Incomes */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">📈 Доходи</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-500">{fmt(totalIncome)}</span>
                  <button onClick={() => addItem("incomes")} className="text-orange-400 hover:text-orange-500"><Icon d={icons.plus} className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">{biz.incomes.map(item => <ItemRow key={item.id} item={item} field="incomes" />)}</div>
            </div>

            {/* Expenses */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">📉 Витрати</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-500">{fmt(totalExpense)}</span>
                  <button onClick={() => addItem("expenses")} className="text-orange-400 hover:text-orange-500"><Icon d={icons.plus} className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">{biz.expenses.map(item => <ItemRow key={item.id} item={item} field="expenses" />)}</div>
            </div>

            {/* Assets */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">🏭 Активи</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{fmt(totalAssets)}</span>
                  <button onClick={() => addItem("assets")} className="text-orange-400 hover:text-orange-500"><Icon d={icons.plus} className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">{biz.assets.map(item => <ItemRow key={item.id} item={item} field="assets" />)}</div>
            </div>

            {/* Employees */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">👥 Персонал</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-400">{fmt(totalSalary)}</span>
                  <button onClick={addEmployee} className="text-orange-400 hover:text-orange-500"><Icon d={icons.plus} className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-3">
                {biz.employees.map(e => (
                  <div key={e.id} className="group flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0"><Icon d={icons.person} className="w-3.5 h-3.5 text-neutral-400" /></div>
                    <input value={e.name} onChange={ev => updateEmployee(e.id, "name", ev.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 min-w-0" />
                    <select value={e.type} onChange={ev => updateEmployee(e.id, "type", ev.target.value)} className="px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-xs text-neutral-600 dark:text-neutral-400 focus:outline-none">
                      <option value="hired">Найманий</option>
                      <option value="fop">ФОП</option>
                      <option value="contractor">Підрядник</option>
                    </select>
                    <input type="number" value={e.salary} onChange={ev => updateEmployee(e.id, "salary", +ev.target.value)} className="w-24 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-right text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300" />
                    <button onClick={() => removeEmployee(e.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all"><Icon d={icons.trash} className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── COLLECTIONS TAB ─────────────────────────────────────────
const COL_CATEGORIES = ["Нумізматика", "Філателія", "Мистецтво", "Антикваріат", "Вініл", "Військова атрибутика", "Книги", "Інше"];
const COL_EMOJI: Record<string, string> = { "Нумізматика": "🪙", "Філателія": "📮", "Мистецтво": "🎨", "Антикваріат": "🏺", "Вініл": "💿", "Військова атрибутика": "🎖", "Книги": "📚", "Інше": "🎁" };

function CollectionModal({ onClose, onSave, edit }: { onClose: () => void; onSave: (c: Collection) => void; edit?: Collection }) {
  const [f, setF] = useState({ name: edit?.name ?? "", category: edit?.category ?? "Нумізматика", description: edit?.description ?? "", buyPrice: edit?.buyPrice.toString() ?? "", expectedPrice: edit?.expectedPrice.toString() ?? "", currency: edit?.currency ?? "UAH", buyDate: edit?.buyDate ?? "", status: edit?.status ?? "owned" });
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const profit = f.buyPrice && f.expectedPrice ? +f.expectedPrice - +f.buyPrice : 0;

  return (
    <ModalWrap title={edit ? "Редагувати предмет" : "Додати до колекції"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 mb-1">
        {COL_CATEGORIES.map(c => (
          <button key={c} onClick={() => setF(p => ({ ...p, category: c }))} className={`flex items-center gap-2 py-2 px-3 rounded-xl border text-sm transition-all ${f.category === c ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
            <span>{COL_EMOJI[c]}</span>{c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Назва"><input className={inp} value={f.name} onChange={up("name")} placeholder="Монета 10 грн 1999" /></Field></div>
        <div className="col-span-2"><Field label="Опис"><textarea value={f.description} onChange={up("description") as any} placeholder="Деталі, стан, рідкісність..." className={`${inp} resize-none h-16`} /></Field></div>
        <Field label="Ціна купівлі"><input className={inp} type="number" value={f.buyPrice} onChange={up("buyPrice")} placeholder="850" /></Field>
        <Field label="Очікувана ціна продажу"><input className={inp} type="number" value={f.expectedPrice} onChange={up("expectedPrice")} placeholder="2500" /></Field>
        <Field label="Дата придбання"><input className={inp} type="date" value={f.buyDate} onChange={up("buyDate")} /></Field>
        <Field label="Валюта">
          <select className={inp} value={f.currency} onChange={up("currency")}>
            {["UAH", "USD", "EUR"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex gap-2">
        {(["owned", "sold"] as const).map(s => (
          <button key={s} onClick={() => setF(p => ({ ...p, status: s }))} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${f.status === s ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
            {s === "owned" ? "У власності" : "Продано"}
          </button>
        ))}
      </div>
      {profit !== 0 && (
        <div className={`p-3 rounded-xl border ${profit > 0 ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30" : "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30"}`}>
          <p className="text-xs text-neutral-400">Нереалізований прибуток</p>
          <p className={`text-lg font-bold ${profit > 0 ? "text-green-600" : "text-red-500"}`}>{profit > 0 ? "+" : ""}{fmt(profit, f.currency)} · {pct(profit / +f.buyPrice * 100)}</p>
        </div>
      )}
      <button className={btn} onClick={() => { if (!f.name || !f.buyPrice) return; onSave({ id: edit?.id ?? uid(), ...f, buyPrice: +f.buyPrice, expectedPrice: +f.expectedPrice || +f.buyPrice, status: f.status as "owned" | "sold" }); onClose(); }}>
        {edit ? "Зберегти" : "Додати"}
      </button>
    </ModalWrap>
  );
}

function CollectionsTab({ collections, setCollections }: { collections: Collection[]; setCollections: React.Dispatch<React.SetStateAction<Collection[]>> }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Collection | undefined>();
  const [filter, setFilter] = useState("all");

  const owned = collections.filter(c => c.status === "owned");
  const totalCost = owned.reduce((s, c) => s + c.buyPrice * (c.currency === "USD" ? USD_RATE : 1), 0);
  const totalExpected = owned.reduce((s, c) => s + c.expectedPrice * (c.currency === "USD" ? USD_RATE : 1), 0);
  const totalProfit = totalExpected - totalCost;

  const categories = ["all", ...Array.from(new Set(collections.map(c => c.category)))];
  const filtered = filter === "all" ? collections : collections.filter(c => c.category === filter);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Предметів у колекції" value={owned.length.toString()} />
        <StatCard label="Вкладено" value={fmt(totalCost)} />
        <StatCard label="Нереалізований прибуток" value={fmt(Math.abs(totalProfit))} sub={pct(totalProfit / totalCost * 100)} color={totalProfit >= 0 ? "text-green-500" : "text-red-500"} />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${filter === c ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
            {c === "all" ? "Всі" : `${COL_EMOJI[c] ?? ""} ${c}`}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Колекція</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium"><Icon d={icons.plus} className="w-4 h-4" />Додати</button>
        </div>
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {filtered.map(c => {
            const profit = c.expectedPrice - c.buyPrice;
            const profitPct = (profit / c.buyPrice * 100);
            return (
              <div key={c.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center text-xl shrink-0">{COL_EMOJI[c.category] ?? "🎁"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{c.name}</p>
                    {c.status === "sold" && <span className="text-xs px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400">Продано</span>}
                  </div>
                  <p className="text-xs text-neutral-400">{c.category}{c.description ? ` · ${c.description.slice(0, 40)}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(c.expectedPrice, c.currency)}</p>
                  <p className={`text-xs font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>{profit >= 0 ? "+" : ""}{fmt(profit, c.currency)} ({pct(profitPct)})</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditItem(c); setModal(true); }} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center"><Icon d={icons.edit} className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setCollections(p => p.filter(x => x.id !== c.id))} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {modal && <CollectionModal onClose={() => { setModal(false); setEditItem(undefined); }} onSave={c => setCollections(p => editItem ? p.map(x => x.id === c.id ? c : x) : [c, ...p])} edit={editItem} />}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function InvestmentsPage() {
  const [tab, setTab] = useState<Tab>("portfolio");
  const [stocks, setStocks] = useState<Stock[]>(MOCK_STOCKS);
  const [bonds, setBonds] = useState<Bond[]>(MOCK_BONDS);
  const [realestate, setRealestate] = useState<RealEstate[]>(MOCK_REALESTATE);
  const [businesses, setBusinesses] = useState<Business[]>(MOCK_BUSINESSES);
  const [collections, setCollections] = useState<Collection[]>(MOCK_COLLECTIONS);

  const tabs = [
    { id: "portfolio" as Tab, label: "📊 Портфель" },
    { id: "stocks" as Tab, label: "📈 Акції & ETF" },
    { id: "bonds" as Tab, label: "🏛 Облігації" },
    { id: "realestate" as Tab, label: "🏠 Нерухомість" },
    { id: "business" as Tab, label: "🏪 Бізнес" },
    { id: "collections" as Tab, label: "🎨 Колекції" },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Інвестиції</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Портфель, бізнес та альтернативні активи</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl overflow-x-auto">
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "portfolio" && <PortfolioTab stocks={stocks} bonds={bonds} realestate={realestate} businesses={businesses} collections={collections} />}
      {tab === "stocks" && <StocksTab stocks={stocks} setStocks={setStocks} />}
      {tab === "bonds" && <BondsTab bonds={bonds} setBonds={setBonds} />}
      {tab === "realestate" && <RealEstateTab realestate={realestate} setRealestate={setRealestate} />}
      {tab === "business" && <BusinessTab businesses={businesses} setBusinesses={setBusinesses} />}
      {tab === "collections" && <CollectionsTab collections={collections} setCollections={setCollections} />}
    </div>
  );
}