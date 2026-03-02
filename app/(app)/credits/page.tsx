"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "credits" | "deposits" | "archive";

interface Credit {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  type: "credit" | "mortgage" | "installment" | "partpay";
  total_amount: number;
  remaining_amount: number;
  monthly_payment: number;
  interest_rate: number;
  real_rate?: number;
  currency: string;
  payment_day: number;
  start_date: string;
  end_date: string;
  is_archived: boolean;
}

interface Deposit {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  amount: number;
  interest_rate: number;
  currency: string;
  start_date: string;
  end_date: string;
  capitalization: boolean;
  coupon_period: string;
  is_archived: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number, cur = "UAH") {
  const v = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (cur === "USD") return `$${v}`;
  if (cur === "EUR") return `€${v}`;
  return `${v} грн`;
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function daysUntilPayment(day: number) {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), day);
  if (d < today) d.setMonth(d.getMonth() + 1);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function monthsLeft(endDate: string) {
  const end = new Date(endDate), now = new Date();
  return Math.max(0, (end.getFullYear() - now.getFullYear()) * 12 + end.getMonth() - now.getMonth());
}

function progressPct(remaining: number, total: number) {
  return total > 0 ? Math.round((1 - remaining / total) * 100) : 0;
}

function depositIncome(d: Deposit) {
  const months = monthsLeft(d.end_date);
  if (d.capitalization) return d.amount * (Math.pow(1 + d.interest_rate / 100 / 12, months) - 1);
  return d.amount * (d.interest_rate / 100) * (months / 12);
}

const NBU_RATE = 15.5;

// ─── Icons ────────────────────────────────────────────────────
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
  warn:   "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  bell:   "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  trend:  "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  check:  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  loader: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
};

// ─── Input / Select / Toggle ──────────────────────────────────
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

// ─── Credit Modal ─────────────────────────────────────────────
function CreditModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: Credit }) {
  const supabase = createClient();
  const [saving, setSaving]   = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [type, setType]       = useState<Credit["type"]>(edit?.type ?? "credit");
  const [firstPayment, setFirstPayment] = useState<"1" | "2">("1"); // для partpay
  const [hasRate, setHasRate] = useState(false); // для partpay/installment
  const [form, setForm] = useState({
    name: edit?.name ?? "", bank: edit?.bank ?? "",
    total_amount: String(edit?.total_amount ?? ""),
    remaining_amount: String(edit?.remaining_amount ?? ""),
    monthly_payment: String(edit?.monthly_payment ?? ""),
    installments: "",   // кількість частин (partpay/installment)
    paid_count: "",     // вже сплачено частин
    interest_rate: String(edit?.interest_rate ?? ""),
    real_rate: String(edit?.real_rate ?? ""),
    currency: edit?.currency ?? "UAH",
    payment_day: String(edit?.payment_day ?? ""),
    start_date: edit?.start_date ?? "",
    end_date: edit?.end_date ?? "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const touch = (k: string) => setTouched(p => ({ ...p, [k]: true }));

  // Автообчислення щомісячного платежу для partpay/installment
  const autoMonthly = (type === "partpay" || type === "installment") && form.total_amount && form.installments
    ? (+form.total_amount / +form.installments).toFixed(2) : "";

  // Валідація
  const errors: Record<string, string> = {};
  if (!form.name) errors.name = "Обов'язкове поле";
  if (!form.total_amount || +form.total_amount <= 0) errors.total_amount = "Вкажіть суму";
  if (type !== "partpay" && type !== "installment") {
    if (!form.remaining_amount) errors.remaining_amount = "Обов'язкове поле";
    else if (+form.remaining_amount > +form.total_amount) errors.remaining_amount = "Не може бути більше загальної суми";
    if (form.monthly_payment && +form.monthly_payment > +form.remaining_amount) errors.monthly_payment = "Не може бути більше залишку боргу";
  }
  if (type === "partpay" || type === "installment") {
    if (!form.installments || +form.installments <= 0) errors.installments = "Вкажіть кількість частин";
  }

  function errCls(k: string) {
    return touched[k] && errors[k]
      ? "w-full px-3 py-2.5 rounded-xl border border-red-400 bg-red-50/50 dark:bg-red-950/10 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-400 transition-all"
      : inputCls;
  }

  function ErrMsg({ k }: { k: string }) {
    return touched[k] && errors[k] ? <p className="text-xs text-red-500 mt-1">{errors[k]}</p> : null;
  }

  async function save() {
    // Touch all required fields
    const required = type === "partpay" || type === "installment"
      ? ["name", "total_amount", "installments"]
      : ["name", "total_amount", "remaining_amount"];
    const allTouched = Object.fromEntries(required.map(k => [k, true]));
    setTouched(p => ({ ...p, ...allTouched }));
    if (required.some(k => errors[k])) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const monthly = type === "partpay" || type === "installment"
      ? (autoMonthly ? +autoMonthly : 0) : (+form.monthly_payment || 0);

    const remaining = type === "partpay" || type === "installment"
      ? (form.paid_count ? +form.total_amount - (+form.paid_count * monthly) : +form.total_amount)
      : +form.remaining_amount;

    // Для partpay/installment — розраховуємо end_date з start_date + кількість місяців
    let endDate = form.end_date || null;
    if ((type === "partpay" || type === "installment") && form.start_date && form.installments) {
      const start = new Date(form.start_date);
      const offset = +form.installments + (firstPayment === "2" ? 1 : 0);
      start.setMonth(start.getMonth() + offset);
      endDate = start.toISOString().slice(0, 10);
    }

    const payload = {
      user_id: user.id, type, name: form.name,
      bank: form.bank || "—",
      total_amount: +form.total_amount,
      remaining_amount: Math.max(0, remaining),
      monthly_payment: monthly,
      interest_rate: hasRate || (type === "credit" || type === "mortgage") ? (+form.interest_rate || 0) : 0,
      real_rate: form.real_rate ? +form.real_rate : null,
      currency: form.currency,
      payment_day: form.payment_day ? +form.payment_day : null,
      start_date: form.start_date || null,
      end_date: endDate,
      is_archived: false,
    };

    if (edit) await supabase.from("credits").update(payload).eq("id", edit.id);
    else await supabase.from("credits").insert(payload);

    setSaving(false);
    onSaved();
    onClose();
  }

  const isPartpayType = type === "partpay" || type === "installment";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto border-t sm:border border-neutral-100 dark:border-neutral-800 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{edit ? "Редагувати" : "Нове зобов'язання"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><Icon d={icons.close} className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {[{ v: "credit", l: "💳 Кредит" }, { v: "mortgage", l: "🏠 Іпотека" },
              { v: "installment", l: "🛍 Розтермінування" }, { v: "partpay", l: "🛒 Оплата частинами" }].map(({ v, l }) => (
              <button key={v} onClick={() => setType(v as Credit["type"])}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${type === v ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Назва + Банк */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Field label={<>Назва <span className="text-red-400">*</span></>}>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  onBlur={() => touch("name")} placeholder={isPartpayType ? "iPhone 15 Pro" : "Авто кредит"}
                  className={errCls("name")} />
              </Field>
              <ErrMsg k="name" />
            </div>
            <Field label={isPartpayType ? "Магазин" : "Банк"}>
              <input value={form.bank} onChange={e => set("bank", e.target.value)}
                placeholder={isPartpayType ? "Monobank / Rozetka" : "Monobank"} className={inputCls} />
            </Field>
          </div>

          {/* Partpay / Installment логіка */}
          {isPartpayType ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Field label={<>Загальна сума <span className="text-red-400">*</span></>}>
                    <input type="number" value={form.total_amount}
                      onChange={e => set("total_amount", e.target.value)} onBlur={() => touch("total_amount")}
                      placeholder="48000" className={errCls("total_amount")} />
                  </Field>
                  <ErrMsg k="total_amount" />
                </div>
                <div>
                  <Field label={<>Кількість частин <span className="text-red-400">*</span></>}>
                    <input type="number" value={form.installments}
                      onChange={e => set("installments", e.target.value)} onBlur={() => touch("installments")}
                      placeholder="12" min="1" className={errCls("installments")} />
                  </Field>
                  <ErrMsg k="installments" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Вже сплачено частин">
                  <input type="number" value={form.paid_count} onChange={e => set("paid_count", e.target.value)} placeholder="0" min="0" className={inputCls} />
                </Field>
                {autoMonthly && (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center">
                    <div>
                      <p className="text-xs text-orange-500 font-medium">Платіж на місяць</p>
                      <p className="text-lg font-bold text-orange-500">{fmt(+autoMonthly, form.currency)}</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Модель оплати */}
              <Field label="Перший платіж">
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: "1", l: "З 1-го місяця", d: "Одразу" }, { v: "2", l: "З 2-го місяця", d: "Через місяць" }].map(({ v, l, d }) => (
                    <button key={v} onClick={() => setFirstPayment(v as "1" | "2")}
                      className={`p-3 rounded-xl border text-left transition-all ${firstPayment === v ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30" : "border-neutral-200 dark:border-neutral-700"}`}>
                      <p className={`text-sm font-medium ${firstPayment === v ? "text-orange-500" : "text-neutral-700 dark:text-neutral-300"}`}>{l}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{d}</p>
                    </button>
                  ))}
                </div>
              </Field>
              {/* Опційно % */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
                <Toggle label="Додати відсоткову ставку" checked={hasRate} onChange={setHasRate} />
                {hasRate && (
                  <Field label="% ставка річна">
                    <input type="number" value={form.interest_rate} onChange={e => set("interest_rate", e.target.value)} placeholder="0.00" className={inputCls} />
                  </Field>
                )}
              </div>
            </>
          ) : (
            /* Credit / Mortgage логіка */
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Field label={<>Загальна сума <span className="text-red-400">*</span></>}>
                    <input type="number" value={form.total_amount}
                      onChange={e => set("total_amount", e.target.value)} onBlur={() => touch("total_amount")}
                      placeholder="350000" className={errCls("total_amount")} />
                  </Field>
                  <ErrMsg k="total_amount" />
                </div>
                <div>
                  <Field label={<>Залишок боргу <span className="text-red-400">*</span></>}>
                    <input type="number" value={form.remaining_amount}
                      onChange={e => set("remaining_amount", e.target.value)} onBlur={() => touch("remaining_amount")}
                      placeholder="180000" className={errCls("remaining_amount")} />
                  </Field>
                  <ErrMsg k="remaining_amount" />
                </div>
                <div>
                  <Field label="Щомісячний платіж">
                    <input type="number" value={form.monthly_payment}
                      onChange={e => set("monthly_payment", e.target.value)} onBlur={() => touch("monthly_payment")}
                      placeholder="9800" className={errCls("monthly_payment")} />
                  </Field>
                  <ErrMsg k="monthly_payment" />
                </div>
                <Field label="День платежу">
                  <input type="number" value={form.payment_day} onChange={e => set("payment_day", e.target.value)} placeholder="10" min="1" max="31" className={inputCls} />
                </Field>
                <Field label="% ставка (номінальна)">
                  <input type="number" value={form.interest_rate} onChange={e => set("interest_rate", e.target.value)} placeholder="19.9" className={inputCls} />
                </Field>
                <Field label="% ставка (реальна)">
                  <input type="number" value={form.real_rate} onChange={e => set("real_rate", e.target.value)} placeholder="22.4 (опційно)" className={inputCls} />
                </Field>
              </div>
            </>
          )}

          {/* Валюта */}
          <Field label="Валюта">
            <div className="flex gap-2">
              {["UAH", "USD", "EUR"].map(c => (
                <button key={c} onClick={() => set("currency", c)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.currency === c ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{c}</button>
              ))}
            </div>
          </Field>

          {/* Дати */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Дата відкриття">
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className={inputCls} />
            </Field>
            {!isPartpayType && (
              <Field label="Дата закриття">
                <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className={inputCls} />
              </Field>
            )}
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> : edit ? "Зберегти зміни" : "Додати"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Deposit Modal ────────────────────────────────────────────
function DepositModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: Deposit }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: edit?.name ?? "", bank: edit?.bank ?? "",
    amount: String(edit?.amount ?? ""),
    interest_rate: String(edit?.interest_rate ?? ""),
    currency: edit?.currency ?? "UAH",
    start_date: edit?.start_date ?? "",
    end_date: edit?.end_date ?? "",
    coupon_period: edit?.coupon_period ?? "monthly",
  });
  const [cap, setCap]         = useState(edit?.capitalization ?? true);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const months = form.end_date && form.start_date
    ? Math.max(0, (new Date(form.end_date).getFullYear() - new Date(form.start_date).getFullYear()) * 12
        + new Date(form.end_date).getMonth() - new Date(form.start_date).getMonth()) : 0;
  const preview = form.amount && form.interest_rate
    ? (cap ? +form.amount * (Math.pow(1 + +form.interest_rate / 100 / 12, months) - 1)
           : +form.amount * (+form.interest_rate / 100) * (months / 12)) : 0;

  async function save() {
    if (!form.name || !form.bank || !form.amount) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id: user.id, name: form.name, bank: form.bank,
      amount: +form.amount, interest_rate: +form.interest_rate || 0,
      currency: form.currency, start_date: form.start_date || null,
      end_date: form.end_date || null, capitalization: cap,
      coupon_period: form.coupon_period, is_archived: false,
    };

    if (edit) await supabase.from("deposits").update(payload).eq("id", edit.id);
    else await supabase.from("deposits").insert(payload);

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto border-t sm:border border-neutral-100 dark:border-neutral-800 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{edit ? "Редагувати депозит" : "Новий депозит"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><Icon d={icons.close} className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Назва"><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Основний депозит" className={inputCls} /></Field>
            <Field label="Банк"><input value={form.bank} onChange={e => set("bank", e.target.value)} placeholder="ПриватБанк" className={inputCls} /></Field>
            <Field label="Сума"><input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="100000" className={inputCls} /></Field>
            <Field label="% ставка річна"><input type="number" value={form.interest_rate} onChange={e => set("interest_rate", e.target.value)} placeholder="14.5" className={inputCls} /></Field>
            <Field label="Дата відкриття"><input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className={inputCls} /></Field>
            <Field label="Дата закриття"><input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Валюта">
            <div className="flex gap-2">
              {["UAH", "USD", "EUR"].map(c => (
                <button key={c} onClick={() => set("currency", c)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.currency === c ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{c}</button>
              ))}
            </div>
          </Field>
          <Field label="Нарахування відсотків">
            <div className="grid grid-cols-3 gap-2">
              {[{ v: "monthly", l: "Щомісяця" }, { v: "quarterly", l: "Квартально" }, { v: "end", l: "В кінці" }].map(({ v, l }) => (
                <button key={v} onClick={() => set("coupon_period", v)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${form.coupon_period === v ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{l}</button>
              ))}
            </div>
          </Field>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
            <Toggle label="Капіталізація відсотків" checked={cap} onChange={setCap} />
          </div>
          {preview > 0 && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Очікуваний дохід за {months} міс.</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">+{fmt(preview, form.currency)}</p>
            </div>
          )}
          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> : edit ? "Зберегти" : "Додати депозит"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Credits Tab ──────────────────────────────────────────────
function CreditsTab({ credits, onReload }: { credits: Credit[]; onReload: () => void }) {
  const supabase = createClient();
  const [modal, setModal]     = useState(false);
  const [editItem, setEditItem] = useState<Credit | undefined>();

  const active = credits.filter(c => !c.is_archived);
  const totalDebt    = active.reduce((s, c) => s + Number(c.remaining_amount), 0);
  const monthlyLoad  = active.reduce((s, c) => s + Number(c.monthly_payment), 0);
  const upcoming     = active.filter(c => c.payment_day && daysUntilPayment(c.payment_day) <= 7);
  const typeLabels: Record<string, string> = { credit: "Кредит", mortgage: "Іпотека", installment: "Розтермінування", partpay: "Оплата частинами" };

  async function archive(id: string) {
    await supabase.from("credits").update({ is_archived: true }).eq("id", id);
    onReload();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Загальний борг",         value: fmt(totalDebt),        color: "text-red-500",                                       bg: "bg-red-50 dark:bg-red-950/20" },
          { label: "Щомісячне навантаження", value: fmt(monthlyLoad),      color: "text-orange-500",                                    bg: "bg-orange-50 dark:bg-orange-950/20" },
          { label: "Активних кредитів",      value: String(active.length), color: "text-neutral-900 dark:text-neutral-100",             bg: "bg-neutral-50 dark:bg-neutral-800" },
          { label: "Платежів цього тижня",   value: String(upcoming.length), color: upcoming.length > 0 ? "text-amber-500" : "text-green-500", bg: upcoming.length > 0 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-green-50 dark:bg-green-950/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 ${bg}`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <div className="space-y-2">
          {upcoming.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <Icon d={icons.bell} className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Платіж через {daysUntilPayment(c.payment_day)} дн.: {c.name}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">{c.bank} · {fmt(c.monthly_payment, c.currency)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Поточні зобов'язання</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>

        {active.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm">Немає активних кредитів</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {active.map(c => {
              const pct = progressPct(Number(c.remaining_amount), Number(c.total_amount));
              const daysLeft = c.payment_day ? daysUntilPayment(c.payment_day) : null;
              return (
                <div key={c.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{c.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-950/20 text-green-600">Активний</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{c.bank} · {typeLabels[c.type] ?? c.type} · {c.currency}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditItem(c); setModal(true); }}
                        className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
                        <Icon d={icons.edit} className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => archive(c.id)}
                        className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
                        <Icon d={icons.trash} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                      <span>Погашено {pct}%</span>
                      <span>{fmt(Number(c.remaining_amount), c.currency)} з {fmt(Number(c.total_amount), c.currency)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Щомісяця",          value: fmt(Number(c.monthly_payment), c.currency) },
                      { label: "Ставка",             value: c.real_rate ? `${c.interest_rate}% / ${c.real_rate}% реал.` : `${c.interest_rate}%` },
                      { label: "Наступний платіж",   value: daysLeft !== null ? `${c.payment_day} числа · ${daysLeft} дн.` : "—" },
                      { label: "Залишилось місяців", value: c.end_date ? `${monthsLeft(c.end_date)} міс.` : "—" },
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
        )}
      </div>

      {/* Monthly schedule */}
      {active.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Графік платежів цього місяця</h3>
          <div className="space-y-2">
            {active.filter(c => c.payment_day).sort((a, b) => a.payment_day - b.payment_day).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  daysUntilPayment(c.payment_day) <= 3 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"}`}>
                  {c.payment_day}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{c.name}</p>
                  <p className="text-xs text-neutral-400">{c.bank}</p>
                </div>
                <p className="text-sm font-bold text-red-500">−{fmt(Number(c.monthly_payment), c.currency)}</p>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
              <span className="text-sm text-neutral-500">Всього цього місяця</span>
              <span className="text-sm font-bold text-red-500">−{fmt(monthlyLoad)}</span>
            </div>
          </div>
        </div>
      )}

      {modal && <CreditModal onClose={() => { setModal(false); setEditItem(undefined); }} onSaved={onReload} edit={editItem} />}
    </div>
  );
}

// ─── Deposits Tab ─────────────────────────────────────────────
function DepositsTab({ deposits, onReload }: { deposits: Deposit[]; onReload: () => void }) {
  const supabase = createClient();
  const [modal, setModal]       = useState(false);
  const [editItem, setEditItem] = useState<Deposit | undefined>();

  const active    = deposits.filter(d => !d.is_archived);
  const totalUAH  = active.filter(d => d.currency === "UAH").reduce((s, d) => s + Number(d.amount), 0);
  const totalIncome = active.reduce((s, d) => s + depositIncome(d), 0);
  const avgRate   = active.filter(d => d.currency === "UAH").length
    ? active.filter(d => d.currency === "UAH").reduce((s, d) => s + Number(d.interest_rate), 0) / active.filter(d => d.currency === "UAH").length
    : 0;
  const closingSoon = active.filter(d => d.end_date && daysUntil(d.end_date) <= 30);

  async function archive(id: string) {
    await supabase.from("deposits").update({ is_archived: true }).eq("id", id);
    onReload();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Сума депозитів UAH", value: fmt(totalUAH),             color: "text-green-500" },
          { label: "Очікуваний дохід",   value: `+${fmt(totalIncome)}`,    color: "text-green-500" },
          { label: "Середня ставка",     value: `${avgRate.toFixed(1)}%`,  color: avgRate >= NBU_RATE ? "text-green-500" : "text-amber-500" },
          { label: "Ставка НБУ",         value: `${NBU_RATE}%`,            color: "text-neutral-900 dark:text-neutral-100" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {avgRate > 0 && (
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
            </div>
          </div>
        </div>
      )}

      {closingSoon.length > 0 && (
        <div className="space-y-2">
          {closingSoon.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <Icon d={icons.bell} className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Депозит закінчується через {daysUntil(d.end_date)} дн.: {d.name}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">{d.bank} · {fmt(Number(d.amount), d.currency)} · {d.interest_rate}%</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Активні депозити</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>

        {active.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <p className="text-3xl mb-2">🏦</p>
            <p className="text-sm">Немає активних депозитів</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {active.map(d => {
              const income  = depositIncome(d);
              const dLeft   = d.end_date ? daysUntil(d.end_date) : null;
              const mLeft   = d.end_date ? monthsLeft(d.end_date) : 0;
              return (
                <div key={d.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{d.name}</p>
                        {dLeft !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dLeft <= 30 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" : "bg-green-100 dark:bg-green-950/20 text-green-600"}`}>
                            {dLeft <= 30 ? `${dLeft} дн.` : "Активний"}
                          </span>
                        )}
                        {d.capitalization && <span className="text-xs text-neutral-400">+ кап.</span>}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{d.bank} · {d.currency}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditItem(d); setModal(true); }}
                        className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
                        <Icon d={icons.edit} className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => archive(d.id)}
                        className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
                        <Icon d={icons.trash} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Сума",        value: fmt(Number(d.amount), d.currency) },
                      { label: "Ставка",      value: `${d.interest_rate}%` },
                      { label: "Дохід",       value: `+${fmt(income, d.currency)}`, green: true },
                      { label: "Закривається", value: d.end_date ? `${new Date(d.end_date).toLocaleDateString("uk-UA")} · ${mLeft} міс.` : "—" },
                    ].map(({ label, value, green }) => (
                      <div key={label}>
                        <p className="text-xs text-neutral-400">{label}</p>
                        <p className={`text-sm font-medium mt-0.5 ${green ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-50 dark:border-neutral-800/50">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${Number(d.interest_rate) >= NBU_RATE ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-amber-100 dark:bg-amber-950/20 text-amber-600"}`}>
                      {Number(d.interest_rate) >= NBU_RATE ? `+${(Number(d.interest_rate) - NBU_RATE).toFixed(1)}% до НБУ` : `${(Number(d.interest_rate) - NBU_RATE).toFixed(1)}% до НБУ`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && <DepositModal onClose={() => { setModal(false); setEditItem(undefined); }} onSaved={onReload} edit={editItem} />}
    </div>
  );
}

// ─── Archive Tab ──────────────────────────────────────────────
function ArchiveTab({ credits, deposits }: { credits: Credit[]; deposits: Deposit[] }) {
  const [filter, setFilter] = useState<"all" | "credits" | "deposits">("all");
  const closedCredits  = credits.filter(c => c.is_archived);
  const closedDeposits = deposits.filter(d => d.is_archived);
  const typeLabels: Record<string, string> = { credit: "Кредит", mortgage: "Іпотека", installment: "Розтермінування", partpay: "Оплата частинами" };
  const totalPaid   = closedCredits.reduce((s, c) => s + Number(c.total_amount), 0);
  const totalEarned = closedDeposits.reduce((s, d) => {
    const years = d.start_date && d.end_date ? (new Date(d.end_date).getTime() - new Date(d.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
    return s + Number(d.amount) * (Number(d.interest_rate) / 100) * years;
  }, 0);

  return (
    <div className="space-y-5">
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

      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit">
        {[{ id: "all" as const, l: "Всі" }, { id: "credits" as const, l: "💳 Кредити" }, { id: "deposits" as const, l: "🏦 Депозити" }].map(({ id, l }) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>{l}</button>
        ))}
      </div>

      {(filter === "all" || filter === "credits") && closedCredits.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Закриті кредити</p>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {closedCredits.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Icon d={icons.check} className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{c.name}</p>
                  <p className="text-xs text-neutral-400">{c.bank} · {typeLabels[c.type] ?? c.type} · {c.interest_rate > 0 ? `${c.interest_rate}%` : "Безвідсотково"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-neutral-500">{fmt(Number(c.total_amount), c.currency)}</p>
                  {c.start_date && <p className="text-xs text-neutral-400">{new Date(c.start_date).getFullYear()} — {c.end_date ? new Date(c.end_date).getFullYear() : "?"}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 shrink-0">Закрито</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(filter === "all" || filter === "deposits") && closedDeposits.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Закриті депозити</p>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {closedDeposits.map(d => {
              const years = d.start_date && d.end_date ? (new Date(d.end_date).getTime() - new Date(d.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
              const earned = Number(d.amount) * (Number(d.interest_rate) / 100) * years;
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center shrink-0">
                    <Icon d={icons.check} className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{d.name}</p>
                    <p className="text-xs text-neutral-400">{d.bank} · {d.currency} · {d.interest_rate}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{fmt(Number(d.amount), d.currency)}</p>
                    <p className="text-xs text-green-500">+{fmt(earned, d.currency)} дохід</p>
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
  const supabase = createClient();
  const [tab, setTab]           = useState<Tab>("credits");
  const [credits, setCredits]   = useState<Credit[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: cr }, { data: dep }] = await Promise.all([
      supabase.from("credits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    setCredits(cr ?? []);
    setDeposits(dep ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Кредити & Депозити</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Зобов'язання та накопичення</p>
      </div>

      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl w-fit">
        {[{ id: "credits" as Tab, l: "💳 Кредити" }, { id: "deposits" as Tab, l: "🏦 Депозити" }, { id: "archive" as Tab, l: "📂 Архів" }].map(({ id, l }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : (
        <>
          {tab === "credits"  && <CreditsTab  credits={credits}   onReload={load} />}
          {tab === "deposits" && <DepositsTab deposits={deposits} onReload={load} />}
          {tab === "archive"  && <ArchiveTab  credits={credits} deposits={deposits} />}
        </>
      )}
    </div>
  );
}