"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Button, Modal, Card, InfoBox, ToggleRow } from "@/components/ui";

function fmt(n: number, cur = "UAH") {
  const v = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (cur === "USD") return `$${v}`;
  if (cur === "EUR") return `€${v}`;
  return `${v} грн`;
}

const extraIcons = {
  bell:  "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  trend: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  check: "M5 13l4 4L19 7",
};

type Tab = "credits" | "deposits" | "archive";
type CreditType = "consumer" | "car" | "mortgage" | "credit_card" | "installment" | "partpay";

interface Credit {
  id: string;
  user_id: string;
  name: string;
  bank: string | null;
  type: CreditType;
  total_amount: number;
  remaining_amount: number;
  monthly_payment: number;
  interest_rate: number;
  real_rate: number | null;
  currency: string;
  payment_day: number | null;
  start_date: string | null;
  end_date: string | null;
  is_archived: boolean;
  car_model: string | null;
  car_year: number | null;
  kasko_amount: number | null;
  registration_amount: number | null;
}

interface Deposit {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  amount: number;
  interest_rate: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  capitalization: boolean;
  coupon_period: string;
  is_archived: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────
function daysUntil(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }
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
  const months = d.end_date ? monthsLeft(d.end_date) : 0;
  if (d.capitalization) return d.amount * (Math.pow(1 + d.interest_rate / 100 / 12, months) - 1);
  return d.amount * (d.interest_rate / 100) * (months / 12);
}

const NBU_RATE = 15.5;

const TYPE_META: Record<CreditType, { label: string; emoji: string }> = {
  consumer:    { label: "Споживчий",        emoji: "💳" },
  car:         { label: "Авто кредит",      emoji: "🚗" },
  mortgage:    { label: "Іпотека",          emoji: "🏠" },
  credit_card: { label: "Кредитна картка",  emoji: "💳" },
  installment: { label: "Розтермінування",  emoji: "🛍" },
  partpay:     { label: "Оплата частинами", emoji: "🛒" },
};

// ─── UI primitives ────────────────────────────────────────────
const inp    = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all";
const inpErr = "w-full px-3 py-2.5 rounded-xl border border-red-400 bg-red-50/40 dark:bg-red-950/10 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-400 transition-all";

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Credit Modal ─────────────────────────────────────────────
function CreditModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: Credit }) {
  const supabase = createClient();
  const [saving, setSaving]   = useState(false);
  const [type, setType]       = useState<CreditType>(edit?.type ?? "consumer");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasRate, setHasRate] = useState(isInstallT(edit?.type) ? !!(edit?.interest_rate && edit.interest_rate > 0) : true);
  const [hasRealRate, setHasRealRate] = useState(!!(edit?.real_rate));
  const [firstPayment, setFirstPayment] = useState<"1" | "2">("1");

  function isInstallT(t?: string) { return t === "installment" || t === "partpay"; }
  const isInstall = isInstallT(type);

  const [f, setF] = useState({
    name:                edit?.name ?? "",
    bank:                edit?.bank ?? "",
    currency:            edit?.currency ?? "UAH",
    total_amount:        edit ? String(edit.total_amount) : "",
    remaining_amount:    edit ? String(edit.remaining_amount) : "",
    monthly_payment:     edit ? String(edit.monthly_payment) : "",
    installments:        edit && isInstallT(edit.type) && edit.monthly_payment
      ? String(Math.round(edit.total_amount / edit.monthly_payment)) : "",
    paid_count:          edit && isInstallT(edit.type) && edit.monthly_payment
      ? String(Math.round((edit.total_amount - edit.remaining_amount) / edit.monthly_payment)) : "",
    interest_rate:       edit ? String(edit.interest_rate) : "",
    real_rate:           edit?.real_rate ? String(edit.real_rate) : "",
    payment_day:         edit?.payment_day ? String(edit.payment_day) : "",
    start_date:          edit?.start_date ?? "",
    end_date:            edit?.end_date ?? "",
    car_model:           edit?.car_model ?? "",
    car_year:            edit?.car_year ? String(edit.car_year) : "",
    kasko_amount:        edit?.kasko_amount ? String(edit.kasko_amount) : "",
    registration_amount: edit?.registration_amount ? String(edit.registration_amount) : "",
  });

  const upd   = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const touch = (k: string) => setTouched(p => ({ ...p, [k]: true }));
  const cls   = (k: string) => touched[k] && errs[k] ? inpErr : inp;

  const autoMonthly = isInstall && +f.total_amount > 0 && +f.installments > 0
    ? +f.total_amount / +f.installments : 0;
  const autoRemaining = isInstall && autoMonthly > 0 && +f.paid_count >= 0
    ? Math.max(0, +f.total_amount - +f.paid_count * autoMonthly) : null;
  const autoEndDate = (() => {
    if (!isInstall || !f.start_date || !f.installments) return "";
    const d = new Date(f.start_date);
    d.setMonth(d.getMonth() + +f.installments + (firstPayment === "2" ? 1 : 0));
    return d.toISOString().slice(0, 10);
  })();
  const suggestedMonthly = (() => {
    if (isInstall || !f.remaining_amount || !f.end_date) return 0;
    const ml = monthsLeft(f.end_date);
    return ml > 0 ? Math.ceil(+f.remaining_amount / ml) : 0;
  })();

  const errs: Record<string, string> = {};
  if (!f.name.trim()) errs.name = "Обов'язкове поле";
  if (!f.total_amount || +f.total_amount <= 0) errs.total_amount = "Вкажіть суму";
  if (!isInstall) {
    if (!f.remaining_amount) errs.remaining_amount = "Обов'язкове поле";
    else if (+f.remaining_amount > +f.total_amount) errs.remaining_amount = "Не може бути більше загальної суми";
    if (f.monthly_payment && f.remaining_amount && +f.monthly_payment > +f.remaining_amount)
      errs.monthly_payment = "Не може бути більше залишку боргу";
  } else {
    if (!f.installments || +f.installments <= 0) errs.installments = "Вкажіть кількість частин";
    if (f.paid_count && +f.paid_count >= +f.installments) errs.paid_count = "Не може бути ≥ кількості частин";
  }
  if (f.payment_day && (+f.payment_day < 1 || +f.payment_day > 31)) errs.payment_day = "1–31";

  async function save() {
    const req = isInstall ? ["name", "total_amount", "installments"] : ["name", "total_amount", "remaining_amount"];
    setTouched(Object.fromEntries(req.map(k => [k, true])));
    if (req.some(k => errs[k])) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const monthly   = isInstall ? autoMonthly : (+f.monthly_payment || 0);
    const remaining = isInstall ? (autoRemaining ?? +f.total_amount) : +f.remaining_amount;
    const endDate   = isInstall ? (autoEndDate || null) : (f.end_date || null);
    const payload: Record<string, unknown> = {
      user_id: user.id, type,
      name: f.name.trim(), bank: f.bank.trim() || null,
      currency: f.currency, total_amount: +f.total_amount,
      remaining_amount: remaining, monthly_payment: monthly,
      interest_rate: (hasRate || !isInstall) ? (+f.interest_rate || 0) : 0,
      real_rate: hasRealRate && f.real_rate ? +f.real_rate : null,
      payment_day: f.payment_day ? +f.payment_day : null,
      start_date: f.start_date || null, end_date: endDate, is_archived: false,
      car_model: type === "car" ? (f.car_model || null) : null,
      car_year: type === "car" && f.car_year ? +f.car_year : null,
      kasko_amount: type === "car" && f.kasko_amount ? +f.kasko_amount : null,
      registration_amount: type === "car" && f.registration_amount ? +f.registration_amount : null,
    };
    if (edit) await supabase.from("credits").update(payload).eq("id", edit.id);
    else await supabase.from("credits").insert(payload);
    setSaving(false); onSaved(); onClose();
  }

  return (
    <Modal title={edit ? "Редагувати" : "Нове зобов'язання"} onClose={onClose}>
      {/* Тип */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(TYPE_META) as [CreditType, { label: string; emoji: string }][]).map(([v, m]) => (
          <button key={v} onClick={() => { setType(v); setHasRate(!isInstallT(v)); }}
            className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-all text-center leading-tight ${type === v ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300"}`}>
            {m.emoji}<br />{m.label}
          </button>
        ))}
      </div>

      {/* Назва + Банк */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Назва" required error={touched.name ? errs.name : undefined}>
          <input value={f.name} onChange={e => upd("name", e.target.value)} onBlur={() => touch("name")}
            placeholder={type === "partpay" ? "iPhone 15 Pro" : type === "car" ? "Авто кредит" : type === "mortgage" ? "Іпотека" : "Назва"}
            className={cls("name")} />
        </Field>
        <Field label={isInstall ? "Магазин / Банк" : "Банк"}>
          <input value={f.bank} onChange={e => upd("bank", e.target.value)}
            placeholder={type === "partpay" ? "Rozetka / Mono" : "Monobank"} className={inp} />
        </Field>
      </div>

      {/* Авто поля */}
      {type === "car" && (
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Деталі авто</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Марка / Модель">
              <input value={f.car_model} onChange={e => upd("car_model", e.target.value)} placeholder="Toyota Camry" className={inp} />
            </Field>
            <Field label="Рік випуску">
              <input type="number" value={f.car_year} onChange={e => upd("car_year", e.target.value)} placeholder="2022" min="1990" max="2030" className={inp} />
            </Field>
            <Field label="КАСКО / рік">
              <input type="number" value={f.kasko_amount} onChange={e => upd("kasko_amount", e.target.value)} placeholder="15 000" className={inp} />
            </Field>
            <Field label="Держреєстрація">
              <input type="number" value={f.registration_amount} onChange={e => upd("registration_amount", e.target.value)} placeholder="5 000" className={inp} />
            </Field>
          </div>
        </div>
      )}

      {/* Installment / Partpay */}
      {isInstall ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Загальна сума" required error={touched.total_amount ? errs.total_amount : undefined}>
              <input type="number" value={f.total_amount} onChange={e => upd("total_amount", e.target.value)} onBlur={() => touch("total_amount")} placeholder="48 000" className={cls("total_amount")} />
            </Field>
            <Field label="Кількість частин" required error={touched.installments ? errs.installments : undefined}>
              <input type="number" value={f.installments} onChange={e => upd("installments", e.target.value)} onBlur={() => touch("installments")} placeholder="12" min="1" className={cls("installments")} />
            </Field>
            <Field label="Вже сплачено частин" error={touched.paid_count ? errs.paid_count : undefined}>
              <input type="number" value={f.paid_count} onChange={e => upd("paid_count", e.target.value)} onBlur={() => touch("paid_count")} placeholder="0" min="0" className={cls("paid_count")} />
            </Field>
            <Field label="День платежу" error={touched.payment_day ? errs.payment_day : undefined}>
              <input type="number" value={f.payment_day} onChange={e => upd("payment_day", e.target.value)} onBlur={() => touch("payment_day")} placeholder="10" min="1" max="31" className={cls("payment_day")} />
            </Field>
          </div>

          {autoMonthly > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <InfoBox>
                <p className="text-xs text-orange-500 font-medium">Платіж / місяць</p>
                <p className="text-lg font-bold text-orange-500 mt-0.5">{fmt(autoMonthly, f.currency)}</p>
              </InfoBox>
              {autoRemaining !== null && (
                <InfoBox>
                  <p className="text-xs text-orange-500 font-medium">Залишок боргу</p>
                  <p className="text-lg font-bold text-orange-500 mt-0.5">{fmt(autoRemaining, f.currency)}</p>
                </InfoBox>
              )}
            </div>
          )}

          <Field label="Перший платіж">
            <div className="grid grid-cols-2 gap-2">
              {[{ v: "1", l: "З 1-го місяця" }, { v: "2", l: "З 2-го місяця" }].map(({ v, l }) => (
                <button key={v} onClick={() => setFirstPayment(v as "1" | "2")}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${firstPayment === v ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
                  {l}
                </button>
              ))}
            </div>
          </Field>

          {autoEndDate && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
              <span className="text-xs text-neutral-400">Дата завершення:</span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {new Date(autoEndDate).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
            <ToggleRow label="Відсоткова ставка" desc="Якщо є комісія або %" checked={hasRate} onChange={setHasRate} />
            {hasRate && (
              <Field label="% ставка річна">
                <input type="number" value={f.interest_rate} onChange={e => upd("interest_rate", e.target.value)} placeholder="0.00" className={inp} />
              </Field>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Загальна сума" required error={touched.total_amount ? errs.total_amount : undefined}>
              <input type="number" value={f.total_amount} onChange={e => upd("total_amount", e.target.value)} onBlur={() => touch("total_amount")} placeholder="350 000" className={cls("total_amount")} />
            </Field>
            <Field label="Залишок боргу" required error={touched.remaining_amount ? errs.remaining_amount : undefined}>
              <input type="number" value={f.remaining_amount} onChange={e => upd("remaining_amount", e.target.value)} onBlur={() => touch("remaining_amount")} placeholder="180 000" className={cls("remaining_amount")} />
            </Field>
            <Field label="Щомісячний платіж" error={touched.monthly_payment ? errs.monthly_payment : undefined}>
              <input type="number" value={f.monthly_payment} onChange={e => upd("monthly_payment", e.target.value)} onBlur={() => touch("monthly_payment")} placeholder="9 800" className={cls("monthly_payment")} />
            </Field>
            <Field label="День платежу" error={touched.payment_day ? errs.payment_day : undefined}>
              <input type="number" value={f.payment_day} onChange={e => upd("payment_day", e.target.value)} onBlur={() => touch("payment_day")} placeholder="10" min="1" max="31" className={cls("payment_day")} />
            </Field>
          </div>

          {suggestedMonthly > 0 && !f.monthly_payment && (
            <button onClick={() => upd("monthly_payment", String(suggestedMonthly))}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
              <span className="text-xs text-blue-600 dark:text-blue-400">💡 Рекомендований платіж (залишок ÷ місяці)</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{fmt(suggestedMonthly, f.currency)}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="% ставка (номінальна)">
              <input type="number" value={f.interest_rate} onChange={e => upd("interest_rate", e.target.value)} placeholder="19.9" className={inp} />
            </Field>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-500">% ставка (реальна)</label>
                <button onClick={() => setHasRealRate(v => !v)} className="text-xs text-orange-400 hover:text-orange-500">
                  {hasRealRate ? "− прибрати" : "+ додати"}
                </button>
              </div>
              {hasRealRate ? (
                <input type="number" value={f.real_rate} onChange={e => upd("real_rate", e.target.value)} placeholder="22.4" className={inp} />
              ) : (
                <div className="px-3 py-2.5 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-xs text-neutral-400 text-center">опційно</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Валюта */}
      <Field label="Валюта">
        <div className="flex gap-2">
          {["UAH", "USD", "EUR"].map(c => (
            <button key={c} onClick={() => upd("currency", c)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${f.currency === c ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{c}</button>
          ))}
        </div>
      </Field>

      {/* Дати */}
      <div className={`grid gap-3 ${!isInstall ? "grid-cols-2" : "grid-cols-1"}`}>
        <Field label="Дата відкриття">
          <input type="date" value={f.start_date} onChange={e => upd("start_date", e.target.value)} className={inp} />
        </Field>
        {!isInstall && (
          <Field label="Дата закриття">
            <input type="date" value={f.end_date} onChange={e => upd("end_date", e.target.value)} className={inp} />
          </Field>
        )}
      </div>

      <Button onClick={save} loading={saving} fullWidth>
        {edit ? "Зберегти зміни" : "Додати"}
      </Button>
    </Modal>
  );
}

// ─── Deposit Modal ────────────────────────────────────────────
function DepositModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: Deposit }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cap, setCap] = useState(edit?.capitalization ?? true);
  const [f, setF] = useState({
    name: edit?.name ?? "", bank: edit?.bank ?? "",
    amount: edit ? String(edit.amount) : "",
    interest_rate: edit ? String(edit.interest_rate) : "",
    currency: edit?.currency ?? "UAH",
    start_date: edit?.start_date ?? "",
    end_date: edit?.end_date ?? "",
    coupon_period: edit?.coupon_period ?? "monthly",
  });

  const upd   = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const touch = (k: string) => setTouched(p => ({ ...p, [k]: true }));

  const errs: Record<string, string> = {};
  if (!f.name.trim()) errs.name = "Обов'язкове поле";
  if (!f.amount || +f.amount <= 0) errs.amount = "Вкажіть суму";
  if (!f.interest_rate || +f.interest_rate <= 0) errs.interest_rate = "Вкажіть ставку";

  const cls = (k: string) => touched[k] && errs[k] ? inpErr : inp;

  const months = f.end_date && f.start_date
    ? Math.max(0, (new Date(f.end_date).getFullYear() - new Date(f.start_date).getFullYear()) * 12
        + new Date(f.end_date).getMonth() - new Date(f.start_date).getMonth()) : 0;
  const preview = f.amount && f.interest_rate
    ? (cap ? +f.amount * (Math.pow(1 + +f.interest_rate / 100 / 12, months) - 1)
           : +f.amount * (+f.interest_rate / 100) * (months / 12)) : 0;

  async function save() {
    const req = ["name", "amount", "interest_rate"];
    setTouched(Object.fromEntries(req.map(k => [k, true])));
    if (req.some(k => errs[k])) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = {
      user_id: user.id, name: f.name.trim(), bank: f.bank.trim() || null,
      amount: +f.amount, interest_rate: +f.interest_rate,
      currency: f.currency, start_date: f.start_date || null,
      end_date: f.end_date || null, capitalization: cap,
      coupon_period: f.coupon_period, is_archived: false,
    };
    if (edit) await supabase.from("deposits").update(payload).eq("id", edit.id);
    else await supabase.from("deposits").insert(payload);
    setSaving(false); onSaved(); onClose();
  }

  return (
    <Modal title={edit ? "Редагувати депозит" : "Новий депозит"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Назва" required error={touched.name ? errs.name : undefined}>
          <input value={f.name} onChange={e => upd("name", e.target.value)} onBlur={() => touch("name")} placeholder="Основний депозит" className={cls("name")} />
        </Field>
        <Field label="Банк">
          <input value={f.bank} onChange={e => upd("bank", e.target.value)} placeholder="ПриватБанк" className={inp} />
        </Field>
        <Field label="Сума" required error={touched.amount ? errs.amount : undefined}>
          <input type="number" value={f.amount} onChange={e => upd("amount", e.target.value)} onBlur={() => touch("amount")} placeholder="100 000" className={cls("amount")} />
        </Field>
        <Field label="% ставка річна" required error={touched.interest_rate ? errs.interest_rate : undefined}>
          <input type="number" value={f.interest_rate} onChange={e => upd("interest_rate", e.target.value)} onBlur={() => touch("interest_rate")} placeholder="14.5" className={cls("interest_rate")} />
        </Field>
        <Field label="Дата відкриття">
          <input type="date" value={f.start_date} onChange={e => upd("start_date", e.target.value)} className={inp} />
        </Field>
        <Field label="Дата закриття">
          <input type="date" value={f.end_date} onChange={e => upd("end_date", e.target.value)} className={inp} />
        </Field>
      </div>

      <Field label="Валюта">
        <div className="flex gap-2">
          {["UAH", "USD", "EUR"].map(c => (
            <button key={c} onClick={() => upd("currency", c)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${f.currency === c ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{c}</button>
          ))}
        </div>
      </Field>

      <Field label="Нарахування відсотків">
        <div className="grid grid-cols-3 gap-2">
          {[{ v: "monthly", l: "Щомісяця" }, { v: "quarterly", l: "Квартально" }, { v: "end", l: "В кінці" }].map(({ v, l }) => (
            <button key={v} onClick={() => upd("coupon_period", v)}
              className={`py-2 rounded-xl text-xs font-medium border transition-all ${f.coupon_period === v ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>{l}</button>
          ))}
        </div>
      </Field>

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
        <ToggleRow label="Капіталізація відсотків" desc="Відсотки нараховуються на відсотки" checked={cap} onChange={setCap} />
      </div>

      {preview > 0 && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Очікуваний дохід за {months} міс.</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">+{fmt(preview, f.currency)}</p>
        </div>
      )}

      <Button onClick={save} loading={saving} fullWidth>
        {edit ? "Зберегти зміни" : "Додати депозит"}
      </Button>
    </Modal>
  );
}

// ─── Credits Tab ──────────────────────────────────────────────
function CreditsTab({ credits, onReload }: { credits: Credit[]; onReload: () => void }) {
  const supabase = createClient();
  const [modal, setModal]       = useState(false);
  const [editItem, setEditItem] = useState<Credit | undefined>();

  const active      = credits.filter(c => !c.is_archived);
  const totalDebt   = active.reduce((s, c) => s + Number(c.remaining_amount), 0);
  const monthlyLoad = active.reduce((s, c) => s + Number(c.monthly_payment), 0);
  const upcoming    = active.filter(c => c.payment_day != null && daysUntilPayment(c.payment_day!) <= 7);

  async function archive(id: string) {
    await supabase.from("credits").update({ is_archived: true }).eq("id", id);
    onReload();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Загальний борг",         value: fmt(totalDebt),          color: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/20" },
          { label: "Щомісячне навантаження", value: fmt(monthlyLoad),        color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
          { label: "Активних кредитів",      value: String(active.length),   color: "text-neutral-900 dark:text-neutral-100", bg: "bg-neutral-50 dark:bg-neutral-800" },
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
              <Icon d={extraIcons.bell} className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Платіж через {daysUntilPayment(c.payment_day!)} дн.: {c.name}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">{c.bank ?? ""} · {fmt(Number(c.monthly_payment), c.currency)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card>
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
              const pct  = progressPct(Number(c.remaining_amount), Number(c.total_amount));
              const meta = TYPE_META[c.type] ?? { label: c.type, emoji: "💳" };
              const ml   = c.end_date ? monthsLeft(c.end_date) : null;
              const daysLeft   = c.payment_day != null ? daysUntilPayment(c.payment_day) : null;
              const isInstallC = c.type === "installment" || c.type === "partpay";
              const installCount = isInstallC && c.monthly_payment > 0 ? Math.round(c.total_amount / c.monthly_payment) : null;
              const paidCount    = isInstallC && c.monthly_payment > 0 ? Math.round((c.total_amount - c.remaining_amount) / c.monthly_payment) : null;

              return (
                <div key={c.id} className="group p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{meta.emoji}</span>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{c.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">{meta.label}</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {[c.bank, c.currency, c.type === "car" && c.car_model ? c.car_model : null].filter(Boolean).join(" · ")}
                      </p>
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
                      <span>{isInstallC && installCount ? `${paidCount ?? 0} з ${installCount} частин` : `Погашено ${pct}%`}</span>
                      <span>{fmt(Number(c.remaining_amount), c.currency)} залишок</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Щомісяця",    value: fmt(Number(c.monthly_payment), c.currency) },
                      { label: "Ставка",      value: c.interest_rate > 0 ? `${c.interest_rate}%${c.real_rate ? ` / ${c.real_rate}%` : ""}` : "Безвідс." },
                      { label: c.payment_day ? "Наступний платіж" : "Дата закриття", value: daysLeft !== null ? `${c.payment_day} числа · ${daysLeft} дн.` : ml !== null ? `${ml} міс.` : "—" },
                      { label: isInstallC ? "Загальна сума" : "Залишок міс.", value: isInstallC ? fmt(Number(c.total_amount), c.currency) : ml !== null ? `${ml} міс.` : "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-neutral-400">{label}</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  {c.type === "car" && (c.kasko_amount || c.registration_amount) && (
                    <div className="mt-3 pt-3 border-t border-neutral-50 dark:border-neutral-800/50 flex flex-wrap gap-3">
                      {c.kasko_amount && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span>🛡 КАСКО:</span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{fmt(Number(c.kasko_amount), c.currency)}/рік</span>
                        </div>
                      )}
                      {c.registration_amount && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span>📋 Реєстрація:</span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{fmt(Number(c.registration_amount), c.currency)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {active.filter(c => c.payment_day).length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Графік платежів цього місяця</h3>
          <div className="space-y-2">
            {active.filter(c => c.payment_day).sort((a, b) => (a.payment_day ?? 0) - (b.payment_day ?? 0)).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  daysUntilPayment(c.payment_day!) <= 3 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"}`}>
                  {c.payment_day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{c.name}</p>
                  <p className="text-xs text-neutral-400">{c.bank ?? TYPE_META[c.type]?.label}</p>
                </div>
                <p className="text-sm font-bold text-red-500 shrink-0">−{fmt(Number(c.monthly_payment), c.currency)}</p>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
              <span className="text-sm text-neutral-500">Всього цього місяця</span>
              <span className="text-sm font-bold text-red-500">−{fmt(monthlyLoad)}</span>
            </div>
          </div>
        </Card>
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

  const active      = deposits.filter(d => !d.is_archived);
  const totalUAH    = active.filter(d => d.currency === "UAH").reduce((s, d) => s + Number(d.amount), 0);
  const totalIncome = active.reduce((s, d) => s + depositIncome(d), 0);
  const uahDeps     = active.filter(d => d.currency === "UAH");
  const avgRate     = uahDeps.length ? uahDeps.reduce((s, d) => s + Number(d.interest_rate), 0) / uahDeps.length : 0;
  const closingSoon = active.filter(d => d.end_date && daysUntil(d.end_date) <= 30);

  async function archive(id: string) {
    await supabase.from("deposits").update({ is_archived: true }).eq("id", id);
    onReload();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Сума депозитів UAH", value: fmt(totalUAH),            color: "text-green-500" },
          { label: "Очікуваний дохід",   value: `+${fmt(totalIncome)}`,   color: "text-green-500" },
          { label: "Середня ставка",     value: `${avgRate.toFixed(1)}%`, color: avgRate >= NBU_RATE ? "text-green-500" : "text-amber-500" },
          { label: "Ставка НБУ",         value: `${NBU_RATE}%`,           color: "text-neutral-900 dark:text-neutral-100" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {avgRate > 0 && (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${avgRate >= NBU_RATE ? "bg-green-100 dark:bg-green-950/30" : "bg-amber-100 dark:bg-amber-950/20"}`}>
              <Icon d={extraIcons.trend} className={`w-5 h-5 ${avgRate >= NBU_RATE ? "text-green-500" : "text-amber-500"}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${avgRate >= NBU_RATE ? "text-green-600 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
                {avgRate >= NBU_RATE ? "✅ Дохідність вища за ставку НБУ" : "⚠️ Дохідність нижча за ставку НБУ"}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Ваша: <strong>{avgRate.toFixed(1)}%</strong> · НБУ: <strong>{NBU_RATE}%</strong> · Різниця: <strong className={avgRate >= NBU_RATE ? "text-green-500" : "text-red-500"}>{(avgRate - NBU_RATE).toFixed(1)}%</strong>
              </p>
            </div>
          </div>
        </Card>
      )}

      {closingSoon.map(d => (
        <div key={d.id} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
          <Icon d={extraIcons.bell} className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Депозит закінчується через {daysUntil(d.end_date!)} дн.: {d.name}</p>
            <p className="text-xs text-amber-600">{d.bank} · {fmt(Number(d.amount), d.currency)} · {d.interest_rate}%</p>
          </div>
        </div>
      ))}

      <Card>
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Активні депозити</h3>
          <button onClick={() => { setEditItem(undefined); setModal(true); }}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>

        {active.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <p className="text-3xl mb-2">🏦</p><p className="text-sm">Немає активних депозитів</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {active.map(d => {
              const income = depositIncome(d);
              const dLeft  = d.end_date ? daysUntil(d.end_date) : null;
              const mLeft  = d.end_date ? monthsLeft(d.end_date) : 0;
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
                      { label: "Сума",         value: fmt(Number(d.amount), d.currency) },
                      { label: "Ставка",        value: `${d.interest_rate}%` },
                      { label: "Дохід",         value: `+${fmt(income, d.currency)}`, green: true },
                      { label: "Закривається",  value: d.end_date ? `${new Date(d.end_date).toLocaleDateString("uk-UA")} · ${mLeft} міс.` : "—" },
                    ].map(({ label, value, green }) => (
                      <div key={label}>
                        <p className="text-xs text-neutral-400">{label}</p>
                        <p className={`text-sm font-medium mt-0.5 ${green ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-50 dark:border-neutral-800/50">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${Number(d.interest_rate) >= NBU_RATE ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-amber-100 dark:bg-amber-950/20 text-amber-600"}`}>
                      {Number(d.interest_rate) >= NBU_RATE ? "+" : ""}{(Number(d.interest_rate) - NBU_RATE).toFixed(1)}% до НБУ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {modal && <DepositModal onClose={() => { setModal(false); setEditItem(undefined); }} onSaved={onReload} edit={editItem} />}
    </div>
  );
}

// ─── Archive Tab ──────────────────────────────────────────────
function ArchiveTab({ credits, deposits }: { credits: Credit[]; deposits: Deposit[] }) {
  const [filter, setFilter] = useState<"all" | "credits" | "deposits">("all");
  const archivedCredits  = credits.filter(c => c.is_archived);
  const archivedDeposits = deposits.filter(d => d.is_archived);
  const totalPaid   = archivedCredits.reduce((s, c) => s + Number(c.total_amount), 0);
  const totalEarned = archivedDeposits.reduce((s, d) => {
    const years = d.start_date && d.end_date
      ? (new Date(d.end_date).getTime() - new Date(d.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
    return s + Number(d.amount) * (Number(d.interest_rate) / 100) * years;
  }, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: String(archivedCredits.length + archivedDeposits.length), label: "Закритих інструментів", color: "text-neutral-900 dark:text-neutral-100" },
          { value: fmt(totalPaid),         label: "Погашено кредитів",      color: "text-red-400" },
          { value: `+${fmt(totalEarned)}`, label: "Зароблено на депозитах", color: "text-green-500" },
        ].map(({ value, label, color }) => (
          <Card key={label} className="p-4">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit">
        {[{ id: "all" as const, l: "Всі" }, { id: "credits" as const, l: "💳 Кредити" }, { id: "deposits" as const, l: "🏦 Депозити" }].map(({ id, l }) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>{l}</button>
        ))}
      </div>

      {(filter === "all" || filter === "credits") && archivedCredits.length > 0 && (
        <Card>
          <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Закриті кредити</p>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {archivedCredits.map(c => {
              const meta = TYPE_META[c.type] ?? { label: c.type, emoji: "💳" };
              return (
                <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-base shrink-0">{meta.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{c.name}</p>
                    <p className="text-xs text-neutral-400">{c.bank ?? meta.label} · {c.interest_rate > 0 ? `${c.interest_rate}%` : "Безвідс."}</p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-500 shrink-0">{fmt(Number(c.total_amount), c.currency)}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 shrink-0">Закрито</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {(filter === "all" || filter === "deposits") && archivedDeposits.length > 0 && (
        <Card>
          <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Закриті депозити</p>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {archivedDeposits.map(d => {
              const years = d.start_date && d.end_date
                ? (new Date(d.end_date).getTime() - new Date(d.start_date).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
              const earned = Number(d.amount) * (Number(d.interest_rate) / 100) * years;
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center shrink-0">
                    <Icon d={extraIcons.check} className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{d.name}</p>
                    <p className="text-xs text-neutral-400">{d.bank} · {d.currency} · {d.interest_rate}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{fmt(Number(d.amount), d.currency)}</p>
                    <p className="text-xs text-green-500">+{fmt(earned, d.currency)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {archivedCredits.length === 0 && archivedDeposits.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-4xl mb-3">📂</p><p className="text-sm">Архів порожній</p>
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
          {tab === "archive"  && <ArchiveTab  credits={credits}   deposits={deposits} />}
        </>
      )}
    </div>
  );
}