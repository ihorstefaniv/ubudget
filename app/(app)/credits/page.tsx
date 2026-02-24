"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────
type Tab = "credits" | "deposits" | "archive";

interface Credit {
  id: string;
  name: string;
  bank: string;
  type: "credit" | "mortgage" | "installment" | "partpay";
  total: number;
  remaining: number;
  monthlyPayment: number;
  rate: number;
  realRate?: number;
  nextPaymentDay: number;
  startDate: string;
  endDate: string;
  status: "active" | "overdue" | "closed";
}

interface Deposit {
  id: string;
  name: string;
  bank: string;
  amount: number;
  rate: number;
  currency: string;
  openDate: string;
  closeDate: string;
  capitalization: boolean;
  autoRenew: boolean;
  status: "active" | "closing_soon" | "closed";
}

// ─── Mock Data ────────────────────────────────────────────────
const MOCK_CREDITS: Credit[] = [
  { id: "1", name: "Іпотека", bank: "ПриватБанк", type: "mortgage", total: 2400000, remaining: 1850000, monthlyPayment: 18500, rate: 14.5, realRate: 16.2, nextPaymentDay: 25, startDate: "2022-03-01", endDate: "2042-03-01", status: "active" },
  { id: "2", name: "Авто кредит", bank: "Monobank", type: "credit", total: 350000, remaining: 180000, monthlyPayment: 9800, rate: 19.9, realRate: 22.4, nextPaymentDay: 10, startDate: "2023-06-01", endDate: "2026-06-01", status: "active" },
  { id: "3", name: "iPhone 15 Pro", bank: "Monobank", type: "partpay", total: 48000, remaining: 24000, monthlyPayment: 4000, rate: 0, nextPaymentDay: 3, startDate: "2024-10-01", endDate: "2025-10-01", status: "overdue" },
  { id: "4", name: "Ноутбук Rozetka", bank: "ПриватБанк", type: "installment", total: 32000, remaining: 8000, monthlyPayment: 2667, rate: 0, nextPaymentDay: 15, startDate: "2024-07-01", endDate: "2025-07-01", status: "active" },
  { id: "c1", name: "Споживчий кредит", bank: "OTP Bank", type: "credit", total: 80000, remaining: 0, monthlyPayment: 0, rate: 23.5, realRate: 26.0, nextPaymentDay: 1, startDate: "2021-01-01", endDate: "2024-01-01", status: "closed" },
  { id: "c2", name: "Samsung TV", bank: "Monobank", type: "partpay", total: 18000, remaining: 0, monthlyPayment: 0, rate: 0, nextPaymentDay: 1, startDate: "2023-04-01", endDate: "2024-04-01", status: "closed" },
];

const MOCK_DEPOSITS: Deposit[] = [
  { id: "1", name: "Основний депозит", bank: "ПриватБанк", amount: 100000, rate: 14.5, currency: "UAH", openDate: "2024-09-01", closeDate: "2025-03-01", capitalization: true, autoRenew: true, status: "closing_soon" },
  { id: "2", name: "Валютний", bank: "Monobank", amount: 5000, rate: 4.5, currency: "USD", openDate: "2024-06-01", closeDate: "2025-06-01", capitalization: false, autoRenew: false, status: "active" },
  { id: "3", name: "Накопичувальний", bank: "ПУМБ", amount: 50000, rate: 16.0, currency: "UAH", openDate: "2025-01-01", closeDate: "2025-07-01", capitalization: true, autoRenew: false, status: "active" },
  { id: "d1", name: "Короткостроковий", bank: "Ощадбанк", amount: 30000, rate: 12.0, currency: "UAH", openDate: "2023-06-01", closeDate: "2023-12-01", capitalization: false, autoRenew: false, status: "closed" },
  { id: "d2", name: "USD депозит", bank: "ПриватБанк", amount: 2000, rate: 3.5, currency: "USD", openDate: "2023-01-01", closeDate: "2024-01-01", capitalization: false, autoRenew: false, status: "closed" },
];

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number, cur = "UAH") {
  const v = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (cur === "USD") return `$${v}`;
  if (cur === "EUR") return `€${v}`;
  return `${v} грн`;
}

function daysUntil(dateStr: string) {
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function daysUntilPayment(day: number) {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
  if (thisMonth < today) thisMonth.setMonth(thisMonth.getMonth() + 1);
  return Math.ceil((thisMonth.getTime() - today.getTime()) / 86400000);
}

function progressPct(remaining: number, total: number) {
  return Math.round((1 - remaining / total) * 100);
}

function monthsLeft(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(0, (end.getFullYear() - now.getFullYear()) * 12 + end.getMonth() - now.getMonth());
}

function depositIncome(d: Deposit) {
  const months = monthsLeft(d.closeDate);
  if (d.capitalization) {
    return d.amount * (Math.pow(1 + d.rate / 100 / 12, months) - 1);
  }
  return d.amount * (d.rate / 100) * (months / 12);
}

// NBU rate mock
const NBU_RATE = 15.5;

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  plus: "M12 4v16m8-8H4",
  close: "M6 18L18 6M6 6l12 12",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  warn: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  trend: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

// ─── Credit Modal ─────────────────────────────────────────────
function CreditModal({ onClose, onSave, edit }: { onClose: () => void; onSave: (c: Credit) => void; edit?: Credit }) {
  const [name, setName] = useState(edit?.name ?? "");
  const [bank, setBank] = useState(edit?.bank ?? "");
  const [type, setType] = useState<Credit["type"]>(edit?.type ?? "credit");
  const [total, setTotal] = useState(edit?.total.toString() ?? "");
  const [remaining, setRemaining] = useState(edit?.remaining.toString() ?? "");
  const [monthly, setMonthly] = useState(edit?.monthlyPayment.toString() ?? "");
  const [rate, setRate] = useState(edit?.rate.toString() ?? "");
  const [realRate, setRealRate] = useState(edit?.realRate?.toString() ?? "");
  const [day, setDay] = useState(edit?.nextPaymentDay.toString() ?? "");
  const [startDate, setStartDate] = useState(edit?.startDate ?? "");
  const [endDate, setEndDate] = useState(edit?.endDate ?? "");

  function save() {
    if (!name || !bank || !total || !remaining || !monthly) return;
    onSave({
      id: edit?.id ?? Math.random().toString(36).slice(2),
      name, bank, type: type as Credit["type"],
      total: +total, remaining: +remaining, monthlyPayment: +monthly,
      rate: +rate, realRate: realRate ? +realRate : undefined,
      nextPaymentDay: +day, startDate, endDate, status: edit?.status ?? "active",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto border-t sm:border border-neutral-100 dark:border-neutral-800 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{edit ? "Редагувати" : "Новий кредит"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><Icon d={icons.close} className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "credit", l: "💳 Кредит" }, { v: "mortgage", l: "🏠 Іпотека" },
              { v: "installment", l: "🛍 Розтермінування" }, { v: "partpay", l: "🛒 Оплата частинами" },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setType(v as Credit["type"])}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${type === v ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Назва", val: name, set: setName, placeholder: "Авто кредит" },
              { label: "Банк", val: bank, set: setBank, placeholder: "Monobank" },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500">{label}</label>
                <input value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Загальна сума", val: total, set: setTotal, placeholder: "350000" },
              { label: "Залишок боргу", val: remaining, set: setRemaining, placeholder: "180000" },
              { label: "Щомісячний платіж", val: monthly, set: setMonthly, placeholder: "9800" },
              { label: "% ставка (номінальна)", val: rate, set: setRate, placeholder: "19.9" },
              { label: "% ставка (реальна)", val: realRate, set: setRealRate, placeholder: "22.4 (опційно)" },
              { label: "День платежу", val: day, set: setDay, placeholder: "10" },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500">{label}</label>
                <input type="number" value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Дата відкриття", val: startDate, set: setStartDate },
              { label: "Дата закриття", val: endDate, set: setEndDate },
            ].map(({ label, val, set }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500">{label}</label>
                <input type="date" value={val} onChange={(e) => set(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all" />
              </div>
            ))}
          </div>

          <button onClick={save} className="w-full py-3.5 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 transition-colors">
            {edit ? "Зберегти" : "Додати кредит"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Deposit Modal ────────────────────────────────────────────
function DepositModal({ onClose, onSave, edit }: { onClose: () => void; onSave: (d: Deposit) => void; edit?: Deposit }) {
  const [name, setName] = useState(edit?.name ?? "");
  const [bank, setBank] = useState(edit?.bank ?? "");
  const [amount, setAmount] = useState(edit?.amount.toString() ?? "");
  const [rate, setRate] = useState(edit?.rate.toString() ?? "");
  const [currency, setCurrency] = useState(edit?.currency ?? "UAH");
  const [openDate, setOpenDate] = useState(edit?.openDate ?? "");
  const [closeDate, setCloseDate] = useState(edit?.closeDate ?? "");
  const [cap, setCap] = useState(edit?.capitalization ?? true);
  const [autoRenew, setAutoRenew] = useState(edit?.autoRenew ?? false);

  function save() {
    if (!name || !bank || !amount || !rate) return;
    onSave({
      id: edit?.id ?? Math.random().toString(36).slice(2),
      name, bank, amount: +amount, rate: +rate, currency,
      openDate, closeDate, capitalization: cap, autoRenew,
      status: edit?.status ?? "active",
    });
    onClose();
  }

  const months = closeDate && openDate ? Math.max(0, (new Date(closeDate).getFullYear() - new Date(openDate).getFullYear()) * 12 + new Date(closeDate).getMonth() - new Date(openDate).getMonth()) : 0;
  const preview = amount && rate ? (cap ? +amount * (Math.pow(1 + +rate / 100 / 12, months) - 1) : +amount * (+rate / 100) * (months / 12)) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto border-t sm:border border-neutral-100 dark:border-neutral-800 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{edit ? "Редагувати" : "Новий депозит"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><Icon d={icons.close} className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Назва", val: name, set: setName, placeholder: "Основний депозит", type: "text" },
              { label: "Банк", val: bank, set: setBank, placeholder: "ПриватБанк", type: "text" },
              { label: "Сума", val: amount, set: setAmount, placeholder: "100000", type: "number" },
              { label: "% ставка", val: rate, set: setRate, placeholder: "14.5", type: "number" },
              { label: "Дата відкриття", val: openDate, set: setOpenDate, placeholder: "", type: "date" },
              { label: "Дата закриття", val: closeDate, set: setCloseDate, placeholder: "", type: "date" },
            ].map(({ label, val, set, placeholder, type }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500">{label}</label>
                <input type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all" />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-500">Валюта</label>
            <div className="flex gap-2">
              {["UAH", "USD", "EUR"].map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${currency === c ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
            {[
              { label: "Капіталізація відсотків", val: cap, set: setCap },
              { label: "Авто пролонгація", val: autoRenew, set: setAutoRenew },
            ].map(({ label, val, set }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
                <button onClick={() => set((v: boolean) => !v)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${val ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${val ? "translate-x-4" : ""}`} />
                </button>
              </div>
            ))}
          </div>

          {preview > 0 && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Очікуваний дохід за {months} міс.</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">+{fmt(preview, currency)}</p>
            </div>
          )}

          <button onClick={save} className="w-full py-3.5 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 transition-colors">
            {edit ? "Зберегти" : "Додати депозит"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Credits Tab ──────────────────────────────────────────────
function CreditsTab({ credits, setCredits }: { credits: Credit[]; setCredits: React.Dispatch<React.SetStateAction<Credit[]>> }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Credit | undefined>();

  const totalDebt = credits.filter(c => c.status !== "closed").reduce((s, c) => s + c.remaining, 0);
  const monthlyLoad = credits.filter(c => c.status !== "closed").reduce((s, c) => s + c.monthlyPayment, 0);
  const overdue = credits.filter(c => c.status === "overdue");
  const upcoming = credits.filter(c => c.status !== "closed" && daysUntilPayment(c.nextPaymentDay) <= 7);

  const typeLabels: Record<string, string> = { credit: "Кредит", mortgage: "Іпотека", installment: "Розтермінування", partpay: "Оплата частинами" };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Загальний борг", value: fmt(totalDebt), color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
          { label: "Щомісячне навантаження", value: fmt(monthlyLoad), color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
          { label: "Активних кредитів", value: credits.filter(c => c.status !== "closed").length.toString(), color: "text-neutral-900 dark:text-neutral-100", bg: "bg-neutral-50 dark:bg-neutral-800" },
          { label: "Прострочених", value: overdue.length.toString(), color: overdue.length > 0 ? "text-red-500" : "text-green-500", bg: overdue.length > 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 ${bg}`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Reminders */}
      {(overdue.length > 0 || upcoming.length > 0) && (
        <div className="space-y-2">
          {overdue.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
              <Icon d={icons.warn} className="w-5 h-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Прострочено: {c.name}</p>
                <p className="text-xs text-red-500 dark:text-red-400">{c.bank} · Платіж {c.nextPaymentDay} числа · {fmt(c.monthlyPayment)}</p>
              </div>
            </div>
          ))}
          {upcoming.filter(c => c.status !== "overdue").map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <Icon d={icons.bell} className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Платіж через {daysUntilPayment(c.nextPaymentDay)} дн.: {c.name}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">{c.bank} · {fmt(c.monthlyPayment)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Credits table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Поточні зобов'язання</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>

        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {credits.map((c) => {
            const pct = progressPct(c.remaining, c.total);
            const daysLeft = daysUntilPayment(c.nextPaymentDay);
            return (
              <div key={c.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{c.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === "overdue" ? "bg-red-100 dark:bg-red-950/30 text-red-500"
                        : c.status === "active" ? "bg-green-100 dark:bg-green-950/20 text-green-600"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                      }`}>
                        {c.status === "overdue" ? "Прострочено" : c.status === "active" ? "Активний" : "Закритий"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{c.bank} · {typeLabels[c.type]}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditItem(c); setModal(true); }}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
                      <Icon d={icons.edit} className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setCredits(prev => prev.filter(x => x.id !== c.id))}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
                      <Icon d={icons.trash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                    <span>Погашено {pct}%</span>
                    <span>{fmt(c.remaining)} з {fmt(c.total)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Щомісяця", value: fmt(c.monthlyPayment) },
                    { label: "Ставка", value: c.realRate ? `${c.rate}% / ${c.realRate}% реальна` : `${c.rate}%` },
                    { label: "Наступний платіж", value: `${c.nextPaymentDay} числа · ${daysLeft} дн.` },
                    { label: "Залишилось місяців", value: `${monthsLeft(c.endDate)} міс.` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-neutral-400">{label}</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly schedule */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Графік платежів цього місяця</h3>
        <div className="space-y-2">
          {credits.filter(c => c.status !== "closed").sort((a, b) => a.nextPaymentDay - b.nextPaymentDay).map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                c.status === "overdue" ? "bg-red-100 dark:bg-red-950/30 text-red-500"
                : daysUntilPayment(c.nextPaymentDay) <= 3 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              }`}>
                {c.nextPaymentDay}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{c.name}</p>
                <p className="text-xs text-neutral-400">{c.bank}</p>
              </div>
              <p className="text-sm font-bold text-red-500">−{fmt(c.monthlyPayment)}</p>
            </div>
          ))}
          <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
            <span className="text-sm text-neutral-500">Всього цього місяця</span>
            <span className="text-sm font-bold text-red-500">−{fmt(monthlyLoad)}</span>
          </div>
        </div>
      </div>

      {modal && (
        <CreditModal
          onClose={() => { setModal(false); setEditItem(undefined); }}
          onSave={(c) => setCredits(prev => editItem ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev])}
          edit={editItem}
        />
      )}
    </div>
  );
}

// ─── Deposits Tab ─────────────────────────────────────────────
function DepositsTab({ deposits, setDeposits }: { deposits: Deposit[]; setDeposits: React.Dispatch<React.SetStateAction<Deposit[]>> }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Deposit | undefined>();

  const totalUAH = deposits.filter(d => d.currency === "UAH" && d.status !== "closed").reduce((s, d) => s + d.amount, 0);
  const totalIncome = deposits.filter(d => d.status !== "closed").reduce((s, d) => s + depositIncome(d), 0);
  const avgRate = deposits.filter(d => d.currency === "UAH" && d.status !== "closed").reduce((s, d) => s + d.rate, 0) / (deposits.filter(d => d.currency === "UAH").length || 1);
  const closingSoon = deposits.filter(d => d.status === "closing_soon" || daysUntil(d.closeDate) <= 30);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Сума депозитів UAH", value: fmt(totalUAH), color: "text-green-500" },
          { label: "Очікуваний дохід", value: fmt(totalIncome), color: "text-green-500" },
          { label: "Середня ставка", value: `${avgRate.toFixed(1)}%`, color: avgRate >= NBU_RATE ? "text-green-500" : "text-amber-500" },
          { label: "Ставка НБУ", value: `${NBU_RATE}%`, color: "text-neutral-900 dark:text-neutral-100" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Rate analysis */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${avgRate >= NBU_RATE ? "bg-green-100 dark:bg-green-950/30" : "bg-amber-100 dark:bg-amber-950/20"}`}>
            <Icon d={icons.trend} className={`w-5 h-5 ${avgRate >= NBU_RATE ? "text-green-500" : "text-amber-500"}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${avgRate >= NBU_RATE ? "text-green-600 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
              {avgRate >= NBU_RATE ? "✅ Дохідність вища за ставку НБУ" : "⚠️ Дохідність нижча за ставку НБУ"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Ваша середня: <strong>{avgRate.toFixed(1)}%</strong> · Ставка НБУ: <strong>{NBU_RATE}%</strong> · Різниця: <strong className={avgRate >= NBU_RATE ? "text-green-500" : "text-red-500"}>{(avgRate - NBU_RATE).toFixed(1)}%</strong>
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {avgRate >= NBU_RATE
                ? "Ваші депозити ефективні. Продовжуйте моніторити ринкові пропозиції."
                : "Рекомендуємо переглянути умови — ринкові ставки можуть бути вигіднішими."}
            </p>
          </div>
        </div>
      </div>

      {/* Closing soon reminder */}
      {closingSoon.length > 0 && (
        <div className="space-y-2">
          {closingSoon.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <Icon d={icons.bell} className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Депозит закінчується через {daysUntil(d.closeDate)} дн.: {d.name}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {d.bank} · {fmt(d.amount, d.currency)} · {d.rate}% · {d.autoRenew ? "Авто пролонгація" : "Потрібно продовжити вручну"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deposits list */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Активні депозити</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>

        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {deposits.map((d) => {
            const income = depositIncome(d);
            const daysLeft = daysUntil(d.closeDate);
            const mLeft = monthsLeft(d.closeDate);
            return (
              <div key={d.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{d.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        daysLeft <= 30 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600"
                        : "bg-green-100 dark:bg-green-950/20 text-green-600"
                      }`}>
                        {daysLeft <= 30 ? `${daysLeft} дн.` : "Активний"}
                      </span>
                      {d.capitalization && <span className="text-xs text-neutral-400">+ кап.</span>}
                      {d.autoRenew && <span className="text-xs text-blue-400">↻ авто</span>}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{d.bank} · {d.currency}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditItem(d); setModal(true); }}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
                      <Icon d={icons.edit} className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeposits(prev => prev.filter(x => x.id !== d.id))}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
                      <Icon d={icons.trash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Сума", value: fmt(d.amount, d.currency) },
                    { label: "Ставка", value: `${d.rate}%` },
                    { label: "Дохід", value: `+${fmt(income, d.currency)}` },
                    { label: "Закривається", value: `${new Date(d.closeDate).toLocaleDateString("uk-UA")} · ${mLeft} міс.` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-neutral-400">{label}</p>
                      <p className={`text-sm font-medium mt-0.5 ${label === "Дохід" ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Rate vs NBU */}
                <div className="mt-3 pt-3 border-t border-neutral-50 dark:border-neutral-800/50 flex items-center gap-2">
                  <div className={`text-xs px-2 py-0.5 rounded-lg font-medium ${d.rate >= NBU_RATE ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-amber-100 dark:bg-amber-950/20 text-amber-600"}`}>
                    {d.rate >= NBU_RATE ? `+${(d.rate - NBU_RATE).toFixed(1)}% до НБУ` : `${(d.rate - NBU_RATE).toFixed(1)}% до НБУ`}
                  </div>
                  {d.currency === "UAH" && d.rate < NBU_RATE && (
                    <p className="text-xs text-neutral-400">Розгляньте вигідніші пропозиції</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <DepositModal
          onClose={() => { setModal(false); setEditItem(undefined); }}
          onSave={(d) => setDeposits(prev => editItem ? prev.map(x => x.id === d.id ? d : x) : [d, ...prev])}
          edit={editItem}
        />
      )}
    </div>
  );
}

// ─── Archive Tab ──────────────────────────────────────────────
function ArchiveTab({ credits, deposits }: { credits: Credit[]; deposits: Deposit[] }) {
  const [filter, setFilter] = useState<"all" | "credits" | "deposits">("all");

  const closedCredits = credits.filter(c => c.status === "closed");
  const closedDeposits = deposits.filter(d => d.status === "closed");
  const typeLabels: Record<string, string> = { credit: "Кредит", mortgage: "Іпотека", installment: "Розтермінування", partpay: "Оплата частинами" };

  const totalPaid = closedCredits.reduce((s, c) => s + c.total, 0);
  const totalEarned = closedDeposits.reduce((s, d) => s + d.amount * (d.rate / 100) * ((new Date(d.closeDate).getTime() - new Date(d.openDate).getTime()) / (1000 * 60 * 60 * 24 * 365)), 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{closedCredits.length + closedDeposits.length}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Закритих інструментів</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
          <p className="text-xl font-bold text-red-400">{fmt(totalPaid)}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Погашено кредитів</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
          <p className="text-xl font-bold text-green-500">+{fmt(totalEarned)}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Зароблено на депозитах</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit">
        {[
          { id: "all" as const, label: "Всі" },
          { id: "credits" as const, label: "💳 Кредити" },
          { id: "deposits" as const, label: "🏦 Депозити" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Closed credits */}
      {(filter === "all" || filter === "credits") && closedCredits.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Закриті кредити</p>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {closedCredits.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Icon d={icons.check} className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{c.name}</p>
                  <p className="text-xs text-neutral-400">{c.bank} · {typeLabels[c.type]} · {c.rate > 0 ? `${c.rate}%` : "Безвідсотково"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{fmt(c.total)}</p>
                  <p className="text-xs text-neutral-400">{new Date(c.startDate).getFullYear()} — {new Date(c.endDate).getFullYear()}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 shrink-0">Закрито</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closed deposits */}
      {(filter === "all" || filter === "deposits") && closedDeposits.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Закриті депозити</p>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {closedDeposits.map((d) => {
              const earned = d.amount * (d.rate / 100) * ((new Date(d.closeDate).getTime() - new Date(d.openDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center shrink-0">
                    <Icon d={icons.check} className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{d.name}</p>
                    <p className="text-xs text-neutral-400">{d.bank} · {d.currency} · {d.rate}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{fmt(d.amount, d.currency)}</p>
                    <p className="text-xs text-green-500">+{fmt(earned, d.currency)} дохід</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-neutral-400">{new Date(d.openDate).toLocaleDateString("uk-UA", { month: "short", year: "numeric" })}</p>
                    <p className="text-xs text-neutral-400">{new Date(d.closeDate).toLocaleDateString("uk-UA", { month: "short", year: "numeric" })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {closedCredits.length === 0 && closedDeposits.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-sm">Архів порожній</p>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function CreditsDepositsPage() {
  const [tab, setTab] = useState<Tab>("credits");
  const [credits, setCredits] = useState<Credit[]>(MOCK_CREDITS);
  const [deposits, setDeposits] = useState<Deposit[]>(MOCK_DEPOSITS);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Кредити & Депозити</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Зобов'язання та накопичення</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl w-fit">
        {[
          { id: "credits" as Tab, label: "💳 Кредити" },
          { id: "deposits" as Tab, label: "🏦 Депозити" },
          { id: "archive" as Tab, label: "📂 Архів" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "credits" && <CreditsTab credits={credits} setCredits={setCredits} />}
      {tab === "deposits" && <DepositsTab deposits={deposits} setDeposits={setDeposits} />}
      {tab === "archive" && <ArchiveTab credits={credits} deposits={deposits} />}
    </div>
  );
}