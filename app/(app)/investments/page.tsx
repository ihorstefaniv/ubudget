"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "portfolio" | "stocks" | "bonds" | "realestate" | "business" | "collections";

interface Stock { id: string; ticker: string; name: string; broker: string; quantity: number; buy_price: number; current_price: number; currency: string; buy_date: string; }
interface Bond { id: string; name: string; type: string; issuer: string; isin: string; amount: number; interest_rate: number; currency: string; buy_date: string; maturity_date: string; coupon_period: string; is_free_to_sell: boolean; }
interface RealEstate { id: string; name: string; address: string; area: number; buy_price: number; current_price: number; rental_income: number; currency: string; buy_date: string; }
interface BusinessEmployee { id: string; business_id: string; name: string; role: string; type: string; salary: number; }
interface BusinessItem { id: string; business_id: string; section: string; label: string; amount: number; }
interface Business { id: string; name: string; type: string; share: number; start_date: string; items: BusinessItem[]; employees: BusinessEmployee[]; }
interface Collection { id: string; name: string; category: string; description: string; buy_price: number; expected_price: number; currency: string; buy_date: string; status: string; }

const USD_RATE = 41.5;

function fmt(n: number, cur = "UAH") {
  const v = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (cur === "USD") return `$${v}`;
  if (cur === "EUR") return `€${v}`;
  return `${v} грн`;
}
function pct(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`; }
function monthsLeft(d: string) { const e = new Date(d), n = new Date(); return Math.max(0, (e.getFullYear() - n.getFullYear()) * 12 + e.getMonth() - n.getMonth()); }
function toUAH(n: number, cur: string) { return n * (cur === "USD" ? USD_RATE : cur === "EUR" ? USD_RATE * 1.08 : 1); }

const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  plus:   "M12 4v16m8-8H4",
  close:  "M6 18L18 6M6 6l12 12",
  edit:   "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  loader: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
  trend:  "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  person: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all";
const btnPrimary = "w-full py-3.5 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-neutral-900 dark:text-neutral-100" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className={`text-xs font-medium mt-0.5 ${sub.startsWith("+") ? "text-green-500" : sub.startsWith("-") ? "text-red-500" : "text-neutral-400"}`}>{sub}</p>}
      <p className="text-xs text-neutral-400 mt-1">{label}</p>
    </div>
  );
}

function ModalWrap({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto border-t sm:border border-neutral-100 dark:border-neutral-800 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between z-10">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><Icon d={icons.close} className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
      <div>
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
        {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

// ─── STOCKS ───────────────────────────────────────────────────
function StockModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: Stock }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ ticker: edit?.ticker ?? "", name: edit?.name ?? "", broker: edit?.broker ?? "", quantity: edit ? String(edit.quantity) : "", buy_price: edit ? String(edit.buy_price) : "", current_price: edit ? String(edit.current_price) : "", currency: edit?.currency ?? "USD", buy_date: edit?.buy_date ?? "" });
  const upd = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const pl = f.quantity && f.buy_price && f.current_price ? +f.quantity * (+f.current_price - +f.buy_price) : 0;
  const plPct = f.buy_price && f.current_price ? (+f.current_price - +f.buy_price) / +f.buy_price * 100 : 0;

  async function save() {
    if (!f.ticker || !f.quantity || !f.buy_price) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = { user_id: user.id, ticker: f.ticker.toUpperCase(), name: f.name, broker: f.broker, quantity: +f.quantity, buy_price: +f.buy_price, current_price: +f.current_price || +f.buy_price, currency: f.currency, buy_date: f.buy_date || null };
    if (edit) await supabase.from("stocks").update(payload).eq("id", edit.id);
    else await supabase.from("stocks").insert(payload);
    setSaving(false); onSaved(); onClose();
  }

  return (
    <ModalWrap title={edit ? "Редагувати позицію" : "Додати акцію / ETF"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Тікер *"><input className={inp} value={f.ticker} onChange={e => upd("ticker", e.target.value)} placeholder="AAPL" /></Field>
        <Field label="Назва"><input className={inp} value={f.name} onChange={e => upd("name", e.target.value)} placeholder="Apple Inc." /></Field>
        <Field label="Брокер"><input className={inp} value={f.broker} onChange={e => upd("broker", e.target.value)} placeholder="Interactive Brokers" /></Field>
        <Field label="Кількість *"><input className={inp} type="number" value={f.quantity} onChange={e => upd("quantity", e.target.value)} placeholder="10" /></Field>
        <Field label="Ціна купівлі *"><input className={inp} type="number" value={f.buy_price} onChange={e => upd("buy_price", e.target.value)} placeholder="165" /></Field>
        <Field label="Поточна ціна"><input className={inp} type="number" value={f.current_price} onChange={e => upd("current_price", e.target.value)} placeholder="189" /></Field>
        <Field label="Дата купівлі"><input className={inp} type="date" value={f.buy_date} onChange={e => upd("buy_date", e.target.value)} /></Field>
        <Field label="Валюта">
          <select className={inp} value={f.currency} onChange={e => upd("currency", e.target.value)}>
            {["USD", "EUR", "UAH"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      {pl !== 0 && (
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <p className="text-xs text-neutral-400 mb-1">P&L прев'ю</p>
          <p className={`text-lg font-bold ${pl >= 0 ? "text-green-500" : "text-red-500"}`}>{pl >= 0 ? "+" : ""}{fmt(pl, f.currency)} · {pct(plPct)}</p>
        </div>
      )}
      <button className={btnPrimary} onClick={save} disabled={saving}>
        {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> : edit ? "Зберегти" : "Додати"}
      </button>
    </ModalWrap>
  );
}

function StocksTab({ stocks, onReload }: { stocks: Stock[]; onReload: () => void }) {
  const supabase = createClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Stock | undefined>();
  const totalValue = stocks.reduce((s, x) => s + toUAH(x.quantity * x.current_price, x.currency), 0);
  const totalCost  = stocks.reduce((s, x) => s + toUAH(x.quantity * x.buy_price, x.currency), 0);
  const totalPnL   = totalValue - totalCost;

  async function del(id: string) { await supabase.from("stocks").delete().eq("id", id); onReload(); }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Вартість портфеля" value={fmt(totalValue)} color="text-blue-500" />
        <StatCard label="Вкладено" value={fmt(totalCost)} />
        <StatCard label="P&L" value={fmt(Math.abs(totalPnL))} sub={totalCost > 0 ? pct(totalPnL / totalCost * 100) : ""} color={totalPnL >= 0 ? "text-green-500" : "text-red-500"} />
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Позиції</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium"><Icon d={icons.plus} className="w-4 h-4" />Додати</button>
        </div>
        {stocks.length === 0 ? (
          <div className="text-center py-12 text-neutral-400"><p className="text-3xl mb-2">📈</p><p className="text-sm">Немає акцій</p></div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {stocks.map(s => {
              const value = s.quantity * s.current_price;
              const cost  = s.quantity * s.buy_price;
              const pl = value - cost;
              const plPct = cost > 0 ? (pl / cost) * 100 : 0;
              return (
                <div key={s.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{s.ticker.slice(0, 4)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{s.ticker} <span className="font-normal text-neutral-400">· {s.name}</span></p>
                    <p className="text-xs text-neutral-400">{s.broker} · {s.quantity} шт. · куплено {s.buy_price} {s.currency}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{s.current_price} {s.currency}</p>
                    <p className={`text-xs font-medium ${pl >= 0 ? "text-green-500" : "text-red-500"}`}>{pl >= 0 ? "+" : ""}{fmt(pl, s.currency)} ({pct(plPct)})</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditItem(s); setModal(true); }} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center"><Icon d={icons.edit} className="w-3.5 h-3.5" /></button>
                    <button onClick={() => del(s.id)} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modal && <StockModal onClose={() => { setModal(false); setEditItem(undefined); }} onSaved={onReload} edit={editItem} />}
    </div>
  );
}

// ─── BONDS ────────────────────────────────────────────────────
function BondModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: Bond }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState(edit?.type ?? "ovdp");
  const [freeToSell, setFreeToSell] = useState(edit?.is_free_to_sell ?? true);
  const [f, setF] = useState({ name: edit?.name ?? "", issuer: edit?.issuer ?? "", isin: edit?.isin ?? "", amount: edit ? String(edit.amount) : "", interest_rate: edit ? String(edit.interest_rate) : "", currency: edit?.currency ?? "UAH", buy_date: edit?.buy_date ?? "", maturity_date: edit?.maturity_date ?? "", coupon_period: edit?.coupon_period ?? "semiannual" });
  const upd = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const months = f.maturity_date && f.buy_date ? Math.max(0, (new Date(f.maturity_date).getFullYear() - new Date(f.buy_date).getFullYear()) * 12 + new Date(f.maturity_date).getMonth() - new Date(f.buy_date).getMonth()) : 0;
  const income = f.amount && f.interest_rate ? +f.amount * (+f.interest_rate / 100) * (months / 12) : 0;

  const CORPORATE = ["Нова Пошта", "МХП", "Укренерго", "Укрзалізниця", "ДТЕК", "Метінвест", "Kernel", "Інший"];

  async function save() {
    if (!f.name || !f.amount || !f.interest_rate) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = { user_id: user.id, type, name: f.name, issuer: f.issuer, isin: f.isin, amount: +f.amount, interest_rate: +f.interest_rate, currency: f.currency, buy_date: f.buy_date || null, maturity_date: f.maturity_date || null, coupon_period: f.coupon_period, is_free_to_sell: freeToSell };
    if (edit) await supabase.from("bonds").update(payload).eq("id", edit.id);
    else await supabase.from("bonds").insert(payload);
    setSaving(false); onSaved(); onClose();
  }

  return (
    <ModalWrap title={edit ? "Редагувати облігацію" : "Додати облігацію"} onClose={onClose}>
      <div className="flex gap-2">
        {[["ovdp", "🇺🇦 ОВДП"], ["corporate", "🏢 Корпоративна"]].map(([v, l]) => (
          <button key={v} onClick={() => setType(v)} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${type === v ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Назва *"><input className={inp} value={f.name} onChange={e => upd("name", e.target.value)} placeholder="ОВДП 2025" /></Field>
        <Field label={type === "ovdp" ? "Емітент" : "Компанія"}>
          {type === "corporate" ? (
            <select className={inp} value={f.issuer} onChange={e => upd("issuer", e.target.value)}>
              <option value="">Оберіть...</option>
              {CORPORATE.map(i => <option key={i}>{i}</option>)}
            </select>
          ) : (
            <input className={inp} value={f.issuer} onChange={e => upd("issuer", e.target.value)} placeholder="Мінфін України" />
          )}
        </Field>
        <Field label="ISIN"><input className={inp} value={f.isin} onChange={e => upd("isin", e.target.value)} placeholder="UA4000238350" /></Field>
        <Field label="Сума *"><input className={inp} type="number" value={f.amount} onChange={e => upd("amount", e.target.value)} placeholder="100000" /></Field>
        <Field label="Ставка % *"><input className={inp} type="number" value={f.interest_rate} onChange={e => upd("interest_rate", e.target.value)} placeholder="16.5" /></Field>
        <Field label="Валюта">
          <select className={inp} value={f.currency} onChange={e => upd("currency", e.target.value)}>
            {["UAH", "USD", "EUR"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Дата купівлі"><input className={inp} type="date" value={f.buy_date} onChange={e => upd("buy_date", e.target.value)} /></Field>
        <Field label="Дата погашення"><input className={inp} type="date" value={f.maturity_date} onChange={e => upd("maturity_date", e.target.value)} /></Field>
      </div>
      <Field label="Купонний період">
        <div className="grid grid-cols-4 gap-2">
          {[["monthly", "Щомісяця"], ["quarterly", "Квартал"], ["semiannual", "Пів року"], ["annual", "Рік"]].map(([v, l]) => (
            <button key={v} onClick={() => upd("coupon_period", v)} className={`py-2 rounded-xl text-xs font-medium border transition-all ${f.coupon_period === v ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{l}</button>
          ))}
        </div>
      </Field>
      <Toggle label="Вільний до продажу" sub="На вторинному ринку" checked={freeToSell} onChange={setFreeToSell} />
      {income > 0 && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
          <p className="text-xs text-green-600 font-medium">Очікуваний дохід за {months} міс.</p>
          <p className="text-xl font-bold text-green-600 mt-0.5">+{fmt(income, f.currency)}</p>
        </div>
      )}
      <button className={btnPrimary} onClick={save} disabled={saving}>
        {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> : edit ? "Зберегти" : "Додати облігацію"}
      </button>
    </ModalWrap>
  );
}

function BondsTab({ bonds, onReload }: { bonds: Bond[]; onReload: () => void }) {
  const supabase = createClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Bond | undefined>();
  const [filter, setFilter] = useState("all");
  const filtered = bonds.filter(b => filter === "all" || b.type === filter);
  const totalUAH    = bonds.reduce((s, b) => s + toUAH(b.amount, b.currency), 0);
  const totalIncome = bonds.reduce((s, b) => s + b.amount * (b.interest_rate / 100) * (b.maturity_date ? monthsLeft(b.maturity_date) / 12 : 0), 0);
  const couponLabels: Record<string, string> = { monthly: "щомісяця", quarterly: "щокварталу", semiannual: "кожні пів року", annual: "щорічно" };

  async function del(id: string) { await supabase.from("bonds").delete().eq("id", id); onReload(); }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Інвестовано" value={fmt(totalUAH)} color="text-violet-500" />
        <StatCard label="Очікуваний дохід" value={fmt(totalIncome)} color="text-green-500" />
        <StatCard label="Вільних до продажу" value={bonds.filter(b => b.is_free_to_sell).length.toString()} />
      </div>
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit">
        {[["all", "Всі"], ["ovdp", "🇺🇦 ОВДП"], ["corporate", "🏢 Корпоративні"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === v ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>{l}</button>
        ))}
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Облігації</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium"><Icon d={icons.plus} className="w-4 h-4" />Додати</button>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400"><p className="text-3xl mb-2">🏛</p><p className="text-sm">Немає облігацій</p></div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {filtered.map(b => {
              const income = b.maturity_date ? b.amount * (b.interest_rate / 100) * (monthsLeft(b.maturity_date) / 12) : 0;
              return (
                <div key={b.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{b.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.type === "ovdp" ? "bg-blue-100 dark:bg-blue-950/30 text-blue-600" : "bg-purple-100 dark:bg-purple-950/30 text-purple-600"}`}>{b.type === "ovdp" ? "ОВДП" : "Корпоративна"}</span>
                        {b.is_free_to_sell && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/20 text-green-600 font-medium">Вільна до продажу</span>}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{b.issuer}{b.isin ? ` · ${b.isin}` : ""}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditItem(b); setModal(true); }} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center"><Icon d={icons.edit} className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(b.id)} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Сума", value: fmt(b.amount, b.currency) },
                      { label: "Ставка", value: `${b.interest_rate}%` },
                      { label: "Дохід", value: `+${fmt(income, b.currency)}`, green: true },
                      { label: "Погашення", value: b.maturity_date ? `${new Date(b.maturity_date).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })} · ${monthsLeft(b.maturity_date)} міс.` : "—" },
                    ].map(({ label, value, green }) => (
                      <div key={label}><p className="text-xs text-neutral-400">{label}</p><p className={`text-sm font-medium mt-0.5 ${green ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"}`}>{value}</p></div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">Купон {couponLabels[b.coupon_period] ?? b.coupon_period}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modal && <BondModal onClose={() => { setModal(false); setEditItem(undefined); }} onSaved={onReload} edit={editItem} />}
    </div>
  );
}

// ─── REAL ESTATE ──────────────────────────────────────────────
function RealEstateModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: RealEstate }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: edit?.name ?? "", address: edit?.address ?? "", area: edit ? String(edit.area) : "", buy_price: edit ? String(edit.buy_price) : "", current_price: edit ? String(edit.current_price) : "", rental_income: edit ? String(edit.rental_income) : "", currency: edit?.currency ?? "UAH", buy_date: edit?.buy_date ?? "" });
  const upd = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const roi = f.buy_price && f.rental_income ? (+f.rental_income * 12 / +f.buy_price * 100).toFixed(1) : null;
  const appr = f.buy_price && f.current_price ? ((+f.current_price - +f.buy_price) / +f.buy_price * 100).toFixed(1) : null;

  async function save() {
    if (!f.name || !f.buy_price) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = { user_id: user.id, name: f.name, address: f.address, area: +f.area || 0, buy_price: +f.buy_price, current_price: +f.current_price || +f.buy_price, rental_income: +f.rental_income || 0, currency: f.currency, buy_date: f.buy_date || null };
    if (edit) await supabase.from("real_estate").update(payload).eq("id", edit.id);
    else await supabase.from("real_estate").insert(payload);
    setSaving(false); onSaved(); onClose();
  }

  return (
    <ModalWrap title={edit ? "Редагувати об'єкт" : "Додати нерухомість"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Назва *"><input className={inp} value={f.name} onChange={e => upd("name", e.target.value)} placeholder="Квартира Львів" /></Field>
        <Field label="Площа (м²)"><input className={inp} type="number" value={f.area} onChange={e => upd("area", e.target.value)} placeholder="52" /></Field>
        <div className="col-span-2"><Field label="Адреса"><input className={inp} value={f.address} onChange={e => upd("address", e.target.value)} placeholder="вул. Городоцька, 50" /></Field></div>
        <Field label="Ціна купівлі *"><input className={inp} type="number" value={f.buy_price} onChange={e => upd("buy_price", e.target.value)} placeholder="1 800 000" /></Field>
        <Field label="Поточна ціна"><input className={inp} type="number" value={f.current_price} onChange={e => upd("current_price", e.target.value)} placeholder="2 100 000" /></Field>
        <Field label="Оренда / міс"><input className={inp} type="number" value={f.rental_income} onChange={e => upd("rental_income", e.target.value)} placeholder="18 000" /></Field>
        <Field label="Дата купівлі"><input className={inp} type="date" value={f.buy_date} onChange={e => upd("buy_date", e.target.value)} /></Field>
      </div>
      {(roi || appr) && (
        <div className="grid grid-cols-2 gap-3">
          {roi && <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30"><p className="text-xs text-green-600">ROI оренди / рік</p><p className="text-lg font-bold text-green-600">{roi}%</p></div>}
          {appr && <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30"><p className="text-xs text-blue-600">Зростання вартості</p><p className="text-lg font-bold text-blue-600">{+appr >= 0 ? "+" : ""}{appr}%</p></div>}
        </div>
      )}
      <button className={btnPrimary} onClick={save} disabled={saving}>
        {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> : edit ? "Зберегти" : "Додати"}
      </button>
    </ModalWrap>
  );
}

function RealEstateTab({ realestate, onReload }: { realestate: RealEstate[]; onReload: () => void }) {
  const supabase = createClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<RealEstate | undefined>();
  const totalValue = realestate.reduce((s, r) => s + Number(r.current_price), 0);
  const totalRental = realestate.reduce((s, r) => s + Number(r.rental_income), 0);
  const totalGain = realestate.reduce((s, r) => s + (Number(r.current_price) - Number(r.buy_price)), 0);

  async function del(id: string) { await supabase.from("real_estate").delete().eq("id", id); onReload(); }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Загальна вартість" value={fmt(totalValue)} color="text-orange-500" />
        <StatCard label="Оренда / міс" value={fmt(totalRental)} color="text-green-500" sub={`${fmt(totalRental * 12)} / рік`} />
        <StatCard label="Зростання капіталу" value={fmt(Math.abs(totalGain))} color={totalGain >= 0 ? "text-green-500" : "text-red-500"} />
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Об'єкти</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium"><Icon d={icons.plus} className="w-4 h-4" />Додати</button>
        </div>
        {realestate.length === 0 ? (
          <div className="text-center py-12 text-neutral-400"><p className="text-3xl mb-2">🏠</p><p className="text-sm">Немає об'єктів</p></div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {realestate.map(r => {
              const roi  = r.buy_price > 0 ? (Number(r.rental_income) * 12 / Number(r.buy_price) * 100).toFixed(1) : "0";
              const appr = r.buy_price > 0 ? ((Number(r.current_price) - Number(r.buy_price)) / Number(r.buy_price) * 100).toFixed(1) : "0";
              return (
                <div key={r.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{r.name}</p>
                      <p className="text-xs text-neutral-400">{r.address}{r.area ? ` · ${r.area} м²` : ""}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditItem(r); setModal(true); }} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center"><Icon d={icons.edit} className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(r.id)} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Куплено за",        value: fmt(Number(r.buy_price), r.currency) },
                      { label: "Поточна вартість",   value: fmt(Number(r.current_price), r.currency) },
                      { label: "Оренда / міс",       value: fmt(Number(r.rental_income), r.currency) },
                      { label: "ROI оренди",         value: `${roi}% / рік` },
                    ].map(({ label, value }) => (
                      <div key={label}><p className="text-xs text-neutral-400">{label}</p><p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">{value}</p></div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${+appr >= 0 ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-red-100 dark:bg-red-950/20 text-red-500"}`}>{+appr >= 0 ? "+" : ""}{appr}% зростання</span>
                    {Number(r.rental_income) > 0 && <span className="text-xs px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/20 text-orange-600 font-medium">{fmt(Number(r.rental_income) * 12)} / рік оренда</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modal && <RealEstateModal onClose={() => { setModal(false); setEditItem(undefined); }} onSaved={onReload} edit={editItem} />}
    </div>
  );
}

// ─── BUSINESS ─────────────────────────────────────────────────
function BusinessTab({ businesses, onReload }: { businesses: Business[]; onReload: () => void }) {
  const supabase = createClient();
  const [selected, setSelected] = useState<string>(businesses[0]?.id ?? "");
  const [addModal, setAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: "", type: "", share: "100" });

  const biz = businesses.find(b => b.id === selected);

  const incomes   = biz?.items.filter(i => i.section === "income") ?? [];
  const expenses  = biz?.items.filter(i => i.section === "expense") ?? [];
  const assets    = biz?.items.filter(i => i.section === "asset") ?? [];
  const employees = biz?.employees ?? [];

  const totalIncome  = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, i) => s + Number(i.amount), 0);
  const totalSalary  = employees.reduce((s, e) => s + Number(e.salary), 0);
  const totalAssets  = assets.reduce((s, i) => s + Number(i.amount), 0);
  const netProfit    = totalIncome - totalExpense - totalSalary;
  const margin       = totalIncome > 0 ? (netProfit / totalIncome * 100).toFixed(1) : "0";

  async function createBiz() {
    if (!newBiz.name) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data } = await supabase.from("businesses").insert({ user_id: user.id, name: newBiz.name, type: newBiz.type, share: +newBiz.share || 100, start_date: new Date().toISOString().slice(0, 10) }).select().single();
    setSaving(false); setAddModal(false); setNewBiz({ name: "", type: "", share: "100" });
    await onReload();
    if (data) setSelected(data.id);
  }

  async function addItem(section: string) {
    if (!biz) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("business_items").insert({ user_id: user.id, business_id: biz.id, section, label: "Нова стаття", amount: 0 });
    onReload();
  }
  async function updateItem(id: string, key: string, val: string) {
    await supabase.from("business_items").update({ [key]: key === "amount" ? +val : val }).eq("id", id);
    onReload();
  }
  async function deleteItem(id: string) { await supabase.from("business_items").delete().eq("id", id); onReload(); }

  async function addEmployee() {
    if (!biz) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("business_employees").insert({ user_id: user.id, business_id: biz.id, name: "Новий", role: "", type: "hired", salary: 0 });
    onReload();
  }
  async function updateEmployee(id: string, key: string, val: string | number) { await supabase.from("business_employees").update({ [key]: val }).eq("id", id); onReload(); }
  async function deleteEmployee(id: string) { await supabase.from("business_employees").delete().eq("id", id); onReload(); }

  if (businesses.length === 0) return (
    <div className="text-center py-16 text-neutral-400">
      <p className="text-4xl mb-3">🏪</p>
      <p className="text-sm mb-4">Бізнесів не додано</p>
      <button onClick={() => setAddModal(true)} className="px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">Додати бізнес</button>
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm space-y-4 border border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-left">Новий бізнес</h3>
            <Field label="Назва"><input className={inp} value={newBiz.name} onChange={e => setNewBiz(p => ({ ...p, name: e.target.value }))} placeholder="ФОП Іваненко" /></Field>
            <Field label="Тип"><input className={inp} value={newBiz.type} onChange={e => setNewBiz(p => ({ ...p, type: e.target.value }))} placeholder="Кав'ярня, IT..." /></Field>
            <Field label="Моя частка %"><input className={inp} type="number" value={newBiz.share} onChange={e => setNewBiz(p => ({ ...p, share: e.target.value }))} /></Field>
            <div className="flex gap-2">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">Скасувати</button>
              <button onClick={createBiz} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-bold disabled:opacity-50">Додати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ItemRow = ({ item, section }: { item: BusinessItem; section: string }) => (
    <div className="flex items-center gap-2 group">
      <input defaultValue={item.label} onBlur={e => updateItem(item.id, "label", e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 min-w-0" />
      <input type="number" defaultValue={item.amount} onBlur={e => updateItem(item.id, "amount", e.target.value)} className="w-32 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-right text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 shrink-0" />
      <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all shrink-0"><Icon d={icons.trash} className="w-4 h-4" /></button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {businesses.map(b => (
            <button key={b.id} onClick={() => setSelected(b.id)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selected === b.id ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
              {b.name}{Number(b.share) < 100 ? ` (${b.share}%)` : ""}
            </button>
          ))}
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium shrink-0"><Icon d={icons.plus} className="w-4 h-4" />Бізнес</button>
      </div>

      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm space-y-4 border border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Новий бізнес</h3>
            <Field label="Назва"><input className={inp} value={newBiz.name} onChange={e => setNewBiz(p => ({ ...p, name: e.target.value }))} placeholder="ФОП Іваненко" /></Field>
            <Field label="Тип"><input className={inp} value={newBiz.type} onChange={e => setNewBiz(p => ({ ...p, type: e.target.value }))} placeholder="Кав'ярня, IT..." /></Field>
            <Field label="Моя частка %"><input className={inp} type="number" value={newBiz.share} onChange={e => setNewBiz(p => ({ ...p, share: e.target.value }))} /></Field>
            <div className="flex gap-2">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">Скасувати</button>
              <button onClick={createBiz} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-bold disabled:opacity-50">Додати</button>
            </div>
          </div>
        </div>
      )}

      {biz && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Дохід / міс" value={fmt(totalIncome)} color="text-green-500" />
            <StatCard label="Витрати / міс" value={fmt(totalExpense + totalSalary)} color="text-red-500" />
            <StatCard label="Чистий прибуток" value={fmt(Math.abs(netProfit))} sub={`${+margin >= 0 ? "+" : ""}${margin}% рентабельність`} color={netProfit >= 0 ? "text-orange-500" : "text-red-500"} />
            <StatCard label="Активи бізнесу" value={fmt(totalAssets)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              { title: "📈 Доходи", items: incomes, section: "income", total: totalIncome, totalColor: "text-green-500" },
              { title: "📉 Витрати", items: expenses, section: "expense", total: totalExpense, totalColor: "text-red-500" },
              { title: "🏭 Активи", items: assets, section: "asset", total: totalAssets, totalColor: "text-neutral-900 dark:text-neutral-100" },
            ].map(({ title, items, section, total, totalColor }) => (
              <div key={section} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${totalColor}`}>{fmt(total)}</span>
                    <button onClick={() => addItem(section)} className="text-orange-400 hover:text-orange-500"><Icon d={icons.plus} className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-2">{items.map(item => <ItemRow key={item.id} item={item} section={section} />)}</div>
                {items.length === 0 && <p className="text-xs text-neutral-400 text-center py-3">Порожньо — натисни + щоб додати</p>}
              </div>
            ))}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">👥 Персонал</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-400">{fmt(totalSalary)}</span>
                  <button onClick={addEmployee} className="text-orange-400 hover:text-orange-500"><Icon d={icons.plus} className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-3">
                {employees.map(e => (
                  <div key={e.id} className="group flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0"><Icon d={icons.person} className="w-3.5 h-3.5 text-neutral-400" /></div>
                    <input defaultValue={e.name} onBlur={ev => updateEmployee(e.id, "name", ev.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 min-w-0" placeholder="Ім'я" />
                    <input defaultValue={e.role ?? ""} onBlur={ev => updateEmployee(e.id, "role", ev.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-neutral-500 focus:outline-none focus:border-orange-300 min-w-0" placeholder="Роль" />
                    <select defaultValue={e.type} onBlur={ev => updateEmployee(e.id, "type", ev.target.value)} className="px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-xs text-neutral-600 dark:text-neutral-400 focus:outline-none shrink-0">
                      <option value="hired">Найманий</option>
                      <option value="fop">ФОП</option>
                      <option value="contractor">Підрядник</option>
                    </select>
                    <input type="number" defaultValue={e.salary} onBlur={ev => updateEmployee(e.id, "salary", ev.target.value)} className="w-24 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm text-right text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 shrink-0" />
                    <button onClick={() => deleteEmployee(e.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all shrink-0"><Icon d={icons.trash} className="w-4 h-4" /></button>
                  </div>
                ))}
                {employees.length === 0 && <p className="text-xs text-neutral-400 text-center py-3">Немає персоналу</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── COLLECTIONS ──────────────────────────────────────────────
const COL_CATS = ["Нумізматика", "Філателія", "Мистецтво", "Антикваріат", "Вініл", "Військова атрибутика", "Книги", "Метали", "Інше"];
const COL_EMOJI: Record<string, string> = { "Нумізматика": "🪙", "Філателія": "📮", "Мистецтво": "🎨", "Антикваріат": "🏺", "Вініл": "💿", "Військова атрибутика": "🎖", "Книги": "📚", "Метали": "🥇", "Інше": "🎁" };

function CollectionModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: Collection }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: edit?.name ?? "", category: edit?.category ?? "Нумізматика", description: edit?.description ?? "", buy_price: edit ? String(edit.buy_price) : "", expected_price: edit ? String(edit.expected_price) : "", currency: edit?.currency ?? "UAH", buy_date: edit?.buy_date ?? "", status: edit?.status ?? "owned" });
  const upd = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const profit = f.buy_price && f.expected_price ? +f.expected_price - +f.buy_price : 0;

  async function save() {
    if (!f.name || !f.buy_price) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = { user_id: user.id, name: f.name, category: f.category, description: f.description, buy_price: +f.buy_price, expected_price: +f.expected_price || +f.buy_price, currency: f.currency, buy_date: f.buy_date || null, status: f.status };
    if (edit) await supabase.from("collections").update(payload).eq("id", edit.id);
    else await supabase.from("collections").insert(payload);
    setSaving(false); onSaved(); onClose();
  }

  return (
    <ModalWrap title={edit ? "Редагувати предмет" : "Додати до колекції"} onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {COL_CATS.map(c => (
          <button key={c} onClick={() => upd("category", c)} className={`flex items-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-medium transition-all ${f.category === c ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
            <span>{COL_EMOJI[c]}</span>{c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Назва *"><input className={inp} value={f.name} onChange={e => upd("name", e.target.value)} placeholder="Монета 10 грн 1999" /></Field></div>
        <div className="col-span-2">
          <Field label="Опис">
            <textarea value={f.description} onChange={e => upd("description", e.target.value)} placeholder="Деталі, стан, рідкісність..." className={`${inp} resize-none h-16`} />
          </Field>
        </div>
        <Field label="Ціна купівлі *"><input className={inp} type="number" value={f.buy_price} onChange={e => upd("buy_price", e.target.value)} placeholder="850" /></Field>
        <Field label="Очікувана ціна продажу"><input className={inp} type="number" value={f.expected_price} onChange={e => upd("expected_price", e.target.value)} placeholder="2500" /></Field>
        <Field label="Дата придбання"><input className={inp} type="date" value={f.buy_date} onChange={e => upd("buy_date", e.target.value)} /></Field>
        <Field label="Валюта">
          <select className={inp} value={f.currency} onChange={e => upd("currency", e.target.value)}>
            {["UAH", "USD", "EUR"].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex gap-2">
        {[["owned", "✅ У власності"], ["sold", "💰 Продано"]].map(([s, l]) => (
          <button key={s} onClick={() => upd("status", s)} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${f.status === s ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{l}</button>
        ))}
      </div>
      {profit !== 0 && (
        <div className={`p-3 rounded-xl border ${profit > 0 ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30" : "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30"}`}>
          <p className="text-xs text-neutral-400">Нереалізований прибуток</p>
          <p className={`text-lg font-bold ${profit > 0 ? "text-green-600" : "text-red-500"}`}>{profit > 0 ? "+" : ""}{fmt(profit, f.currency)} · {pct(profit / +f.buy_price * 100)}</p>
        </div>
      )}
      <button className={btnPrimary} onClick={save} disabled={saving}>
        {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> : edit ? "Зберегти" : "Додати"}
      </button>
    </ModalWrap>
  );
}

function CollectionsTab({ collections, onReload }: { collections: Collection[]; onReload: () => void }) {
  const supabase = createClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Collection | undefined>();
  const [filter, setFilter] = useState("all");
  const owned = collections.filter(c => c.status === "owned");
  const totalCost     = owned.reduce((s, c) => s + toUAH(Number(c.buy_price), c.currency), 0);
  const totalExpected = owned.reduce((s, c) => s + toUAH(Number(c.expected_price), c.currency), 0);
  const totalProfit   = totalExpected - totalCost;
  const categories = ["all", ...Array.from(new Set(collections.map(c => c.category)))];
  const filtered = filter === "all" ? collections : collections.filter(c => c.category === filter);

  async function del(id: string) { await supabase.from("collections").delete().eq("id", id); onReload(); }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Предметів у колекції" value={String(owned.length)} />
        <StatCard label="Вкладено" value={fmt(totalCost)} />
        <StatCard label="Нереалізований прибуток" value={fmt(Math.abs(totalProfit))} sub={totalCost > 0 ? pct(totalProfit / totalCost * 100) : ""} color={totalProfit >= 0 ? "text-green-500" : "text-red-500"} />
      </div>
      <div className="flex gap-2 flex-wrap">
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
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400"><p className="text-3xl mb-2">🎨</p><p className="text-sm">Колекція порожня</p></div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {filtered.map(c => {
              const profit = Number(c.expected_price) - Number(c.buy_price);
              const profitPct = Number(c.buy_price) > 0 ? profit / Number(c.buy_price) * 100 : 0;
              return (
                <div key={c.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center text-xl shrink-0">{COL_EMOJI[c.category] ?? "🎁"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{c.name}</p>
                      {c.status === "sold" && <span className="text-xs px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400 shrink-0">Продано</span>}
                    </div>
                    <p className="text-xs text-neutral-400">{c.category}{c.description ? ` · ${c.description.slice(0, 40)}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(Number(c.expected_price), c.currency)}</p>
                    <p className={`text-xs font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>{profit >= 0 ? "+" : ""}{fmt(profit, c.currency)} ({pct(profitPct)})</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditItem(c); setModal(true); }} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center"><Icon d={icons.edit} className="w-3.5 h-3.5" /></button>
                    <button onClick={() => del(c.id)} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center"><Icon d={icons.trash} className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modal && <CollectionModal onClose={() => { setModal(false); setEditItem(undefined); }} onSaved={onReload} edit={editItem} />}
    </div>
  );
}

// ─── PORTFOLIO TAB ────────────────────────────────────────────
function PortfolioTab({ stocks, bonds, realestate, businesses, collections }: { stocks: Stock[]; bonds: Bond[]; realestate: RealEstate[]; businesses: Business[]; collections: Collection[] }) {
  const stocksValue = stocks.reduce((s, x) => s + toUAH(x.quantity * x.current_price, x.currency), 0);
  const stocksCost  = stocks.reduce((s, x) => s + toUAH(x.quantity * x.buy_price, x.currency), 0);
  const bondsValue  = bonds.reduce((s, b) => s + toUAH(b.amount, b.currency), 0);
  const reValue     = realestate.reduce((s, r) => s + Number(r.current_price), 0);
  const reCost      = realestate.reduce((s, r) => s + Number(r.buy_price), 0);
  const bizValue    = businesses.reduce((s, b) => s + b.items.filter(i => i.section === "asset").reduce((a, x) => a + Number(x.amount), 0), 0);
  const colValue    = collections.filter(c => c.status === "owned").reduce((s, c) => s + toUAH(Number(c.expected_price), c.currency), 0);
  const colCost     = collections.filter(c => c.status === "owned").reduce((s, c) => s + toUAH(Number(c.buy_price), c.currency), 0);
  const total       = stocksValue + bondsValue + reValue + bizValue + colValue;
  const totalCost   = stocksCost + bondsValue + reCost + bizValue + colCost;
  const totalPnL    = total - totalCost;

  const classes = [
    { label: "Акції & ETF",  value: stocksValue, color: "bg-blue-400" },
    { label: "Облігації",    value: bondsValue,  color: "bg-violet-400" },
    { label: "Нерухомість",  value: reValue,     color: "bg-orange-400" },
    { label: "Бізнес",       value: bizValue,    color: "bg-green-400" },
    { label: "Колекції",     value: colValue,    color: "bg-pink-400" },
  ].filter(c => c.value > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Загальний портфель" value={fmt(total)} color="text-orange-500" />
        <StatCard label="P&L загальний" value={fmt(Math.abs(totalPnL))} sub={totalCost > 0 ? pct(totalPnL / totalCost * 100) : ""} color={totalPnL >= 0 ? "text-green-500" : "text-red-500"} />
        <StatCard label="Акції & ETF" value={fmt(stocksValue)} sub={stocksCost > 0 ? pct((stocksValue - stocksCost) / stocksCost * 100) : ""} />
        <StatCard label="Нерухомість" value={fmt(reValue)} sub={reCost > 0 ? pct((reValue - reCost) / reCost * 100) : ""} />
      </div>

      {classes.length > 0 && (
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
                  <p className="text-xs text-neutral-400">{fmt(c.value)} · {total > 0 ? (c.value / total * 100).toFixed(0) : 0}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
        <Icon d={icons.trend} className="w-5 h-5 text-blue-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Синхронізація</p>
          <p className="text-xs text-blue-500 mt-0.5">Крипто та метали — через Рахунки · Оренда та дивіденди — через Транзакції</p>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function InvestmentsPage() {
  const supabase = createClient();
  const [tab, setTab]             = useState<Tab>("portfolio");
  const [loading, setLoading]     = useState(true);
  const [stocks, setStocks]       = useState<Stock[]>([]);
  const [bonds, setBonds]         = useState<Bond[]>([]);
  const [realestate, setRealestate] = useState<RealEstate[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: st }, { data: bo }, { data: re }, { data: biz }, { data: bi }, { data: be }, { data: co }] = await Promise.all([
      supabase.from("stocks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bonds").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("real_estate").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("businesses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("business_items").select("*").eq("user_id", user.id),
      supabase.from("business_employees").select("*").eq("user_id", user.id),
      supabase.from("collections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    setStocks(st ?? []);
    setBonds(bo ?? []);
    setRealestate(re ?? []);
    setBusinesses((biz ?? []).map(b => ({
      ...b,
      items: (bi ?? []).filter(i => i.business_id === b.id),
      employees: (be ?? []).filter(e => e.business_id === b.id),
    })));
    setCollections(co ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { id: "portfolio"   as Tab, label: "📊 Портфель" },
    { id: "stocks"      as Tab, label: "📈 Акції & ETF" },
    { id: "bonds"       as Tab, label: "🏛 Облігації" },
    { id: "realestate"  as Tab, label: "🏠 Нерухомість" },
    { id: "business"    as Tab, label: "🏪 Бізнес" },
    { id: "collections" as Tab, label: "🎨 Колекції" },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Інвестиції</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Портфель, бізнес та альтернативні активи</p>
      </div>

      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl overflow-x-auto">
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : (
        <>
          {tab === "portfolio"   && <PortfolioTab stocks={stocks} bonds={bonds} realestate={realestate} businesses={businesses} collections={collections} />}
          {tab === "stocks"      && <StocksTab stocks={stocks} onReload={load} />}
          {tab === "bonds"       && <BondsTab bonds={bonds} onReload={load} />}
          {tab === "realestate"  && <RealEstateTab realestate={realestate} onReload={load} />}
          {tab === "business"    && <BusinessTab businesses={businesses} onReload={load} />}
          {tab === "collections" && <CollectionsTab collections={collections} onReload={load} />}
        </>
      )}
    </div>
  );
}