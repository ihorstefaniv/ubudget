"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Card } from "@/components/ui";
import { getCategoryDef } from "@/lib/category-registry";
import FeatureGate from "@/components/FeatureGate";

// ─── Types ────────────────────────────────────────────────────
interface MandatoryItem {
  id: string; label: string; amount: number; icon: string; paid: boolean;
  category_key?: string; source?: "credit" | "manual"; credit_id?: string;
}
interface EnvSettings { id: string; is_active: boolean; mandatory: MandatoryItem[]; }
interface Transaction {
  id: string; amount: number; category_key: string; type: string;
  transaction_date: string; description?: string;
}
interface Credit { id: string; name: string; monthly_payment: number; type: string; }

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн";
}
function pad(n: number) { return String(n).padStart(2, "0"); }
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function weeksInMonth(y: number, m: number) { return Math.ceil(daysInMonth(y, m) / 7); }
function getWeekRange(week: number, y: number, m: number) {
  const days = daysInMonth(y, m);
  const wCount = weeksInMonth(y, m);
  const startDay = (week - 1) * 7 + 1;
  const endDay = week === wCount ? days : week * 7;
  return {
    startDay, endDay,
    start: `${y}-${pad(m)}-${pad(startDay)}`,
    end:   `${y}-${pad(m)}-${pad(endDay)}`,
    label: `${startDay}–${endDay}`,
  };
}
function getCurrentWeek(y: number, m: number): number {
  const now = new Date();
  if (now.getFullYear() !== y || now.getMonth() + 1 !== m) return 0;
  return Math.min(Math.ceil(now.getDate() / 7), weeksInMonth(y, m));
}
function uid() { return Math.random().toString(36).slice(2, 9); }

const MONTHS = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
const MONTH_SHORT = ["Січ","Лют","Бер","Квіт","Трав","Черв","Лип","Серп","Вер","Жовт","Лист","Груд"];
const CREDIT_TYPE_LABEL: Record<string, string> = {
  credit_card: "Кредитна карта", installment: "Розстрочка",
  mortgage: "Іпотека", loan: "Кредит",
};
const CATEGORY_EMOJIS: Record<string, string> = {
  food: "🛒", cafe: "☕", transport: "🚇", fuel: "⛽", health: "💊",
  clothes: "👔", housing: "🏠", utilities: "💡", entertainment: "🎮",
  education: "📚", sport: "💪", beauty: "💈", travel: "✈️", gifts: "🎁",
  subscriptions: "📱", pets: "🐾", other: "📦",
};

const extraIcons = {
  chevDown:  "M19 9l-7 7-7-7",
  chevRight: "M9 5l7 7-7 7",
  check:     "M5 13l4 4L19 7",
  warn:      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  spark:     "M13 10V3L4 14h7v7l9-11h-7z",
  carry:     "M17 8l4 4m0 0l-4 4m4-4H3",
  lock:      "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
};

// ─── ACTIVATION SCREEN ────────────────────────────────────────
function ActivationScreen({ onActivate }: { onActivate: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { emoji: "💰", title: "Збирай дохід",         desc: "Дохід береться автоматично з ваших транзакцій. Нічого вводити вручну." },
    { emoji: "🔒", title: "Обов'язкові першими",  desc: "Кредити та фіксовані витрати списуються першими. Автоматично з розділу Кредити." },
    { emoji: "📅", title: "Ділимо на тижні",      desc: "Залишок після обов'язкових ділиться на тижні місяця. Кожен тиждень — окремий конверт." },
    { emoji: "✨", title: "Залишок переходить",    desc: "Зекономив на тижні 1? Гроші переходять на тиждень 2. Перевищив — береться з наступного." },
    { emoji: "📊", title: "Звіт в кінці місяця",  desc: "Підсумок: скільки заощадив або дефіцит. Якщо є резервний фонд — компенсується автоматично." },
  ];
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-300 shadow-lg shadow-orange-200 dark:shadow-none mb-5">
            <span className="text-4xl">✉️</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Метод конвертів</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">Навчись витрачати усвідомлено і відкладати без зусиль</p>
        </div>
        <div className="space-y-3 mb-8">
          {steps.map((s, i) => (
            <div key={i} onClick={() => setStep(i)}
              className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                step === i ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 shadow-sm"
                : i < step ? "border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10"
                : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all ${
                step === i ? "bg-orange-100 dark:bg-orange-950/30 scale-110" : i < step ? "bg-green-100 dark:bg-green-950/20" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                {i < step ? "✅" : s.emoji}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${step === i ? "text-orange-600 dark:text-orange-400" : i < step ? "text-green-600 dark:text-green-400" : "text-neutral-700 dark:text-neutral-300"}`}>{s.title}</p>
                <p className={`text-xs mt-0.5 overflow-hidden transition-all ${step === i ? "text-neutral-600 dark:text-neutral-400 max-h-20" : "text-neutral-400 max-h-0 sm:max-h-20"}`}>{s.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                step === i || i < step ? "border-orange-400 bg-orange-400" : "border-neutral-200 dark:border-neutral-700"}`}>
                {(step === i || i < step) && <Icon d={extraIcons.check} className="w-3 h-3 text-white" />}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          {step < steps.length - 1 ? (
            <>
              <button onClick={() => setStep(s => Math.min(s + 1, steps.length - 1))}
                className="flex-1 py-3.5 rounded-2xl bg-orange-400 text-white font-bold hover:bg-orange-500 active:scale-95 transition-all shadow-md shadow-orange-200 dark:shadow-none">
                Далі →
              </button>
              <button onClick={onActivate} className="px-5 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                Пропустити
              </button>
            </>
          ) : (
            <button onClick={onActivate}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 text-white font-bold text-lg hover:from-orange-500 hover:to-amber-500 active:scale-95 transition-all shadow-lg shadow-orange-200 dark:shadow-none flex items-center justify-center gap-2">
              <Icon d={extraIcons.spark} className="w-5 h-5" />
              Активувати метод конвертів!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── END OF MONTH DIALOG ──────────────────────────────────────
function EomDialog({
  totalIncome, totalMandatory, totalSpent, lastCarryOut, month, year, onClose,
}: {
  totalIncome: number; totalMandatory: number; totalSpent: number;
  lastCarryOut: number; month: number; year: number; onClose: () => void;
}) {
  const surplus = lastCarryOut > 0;
  const deficit = lastCarryOut < 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md border-t sm:border border-neutral-100 dark:border-neutral-800 p-6 space-y-5">
        <div className="text-center">
          <div className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center text-3xl mb-3 ${
            surplus ? "bg-green-100 dark:bg-green-950/30" : deficit ? "bg-red-100 dark:bg-red-950/30" : "bg-neutral-100 dark:bg-neutral-800"}`}>
            {surplus ? "🎉" : deficit ? "⚠️" : "✅"}
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Підсумок місяця</h2>
          <p className="text-sm text-neutral-400 mt-1">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="space-y-2">
          {[
            { label: "Дохід",               value: `+${fmt(totalIncome)}`,    color: "text-green-500" },
            { label: "Обов'язкові витрати", value: `−${fmt(totalMandatory)}`, color: "text-red-400" },
            { label: "Дискреційні витрати", value: `−${fmt(totalSpent)}`,     color: "text-orange-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-neutral-50 dark:border-neutral-800/50">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
              <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {surplus ? "Заощаджено" : deficit ? "Дефіцит" : "Баланс"}
            </span>
            <span className={`text-lg font-bold tabular-nums ${surplus ? "text-green-500" : deficit ? "text-red-500" : "text-neutral-500"}`}>
              {surplus ? "+" : deficit ? "−" : ""}{fmt(Math.abs(lastCarryOut))}
            </span>
          </div>
        </div>
        {surplus && (
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">🎯 Відмінна робота!</p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Рекомендуємо перенести залишок у резервний фонд або цілі заощаджень.</p>
          </div>
        )}
        {deficit && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">📉 Бюджет вичерпано</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Дефіцит покрито з тижневих конвертів. Якщо є резервний фонд — розгляньте поповнення.</p>
          </div>
        )}
        <button onClick={onClose}
          className="w-full py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
          Закрити
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
function EnvelopesMain({ month, year, onDeactivate }: { month: number; year: number; onDeactivate: () => void }) {
  const supabase   = createClient();
  const weeksCount = weeksInMonth(year, month);
  const curWeek    = getCurrentWeek(year, month);
  const monthName  = `${MONTHS[month - 1]} ${year}`;
  const isPastMonth = curWeek === 0;

  const [loading, setLoading]           = useState(true);
  const [settings, setSettings]         = useState<EnvSettings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [credits, setCredits]           = useState<Credit[]>([]);

  const [expandedWeek, setExpandedWeek]         = useState<number | null>(curWeek || 1);
  const [addMandatoryOpen, setAddMandatoryOpen] = useState(false);
  const [newMandatory, setNewMandatory]         = useState({ label: "", amount: "", icon: "💳", category_key: "" });
  const [showEom, setShowEom]                   = useState(false);

  const inp = "px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all";

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const dateStart = `${year}-${pad(month)}-01`;
    const dateEnd   = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;

    const [{ data: sets }, { data: txs }, { data: creds }] = await Promise.all([
      supabase.from("envelope_settings").select("*")
        .eq("user_id", user.id).eq("month", month).eq("year", year).single(),
      supabase.from("transactions").select("id,amount,category_key,type,transaction_date,description")
        .eq("user_id", user.id)
        .gte("transaction_date", dateStart).lt("transaction_date", dateEnd)
        .is("deleted_at", null),
      supabase.from("credits").select("id,name,monthly_payment,type")
        .eq("user_id", user.id).neq("is_archived", true).gt("monthly_payment", 0),
    ]);

    setSettings(sets ? { ...sets, mandatory: sets.mandatory ?? [] } : null);
    setTransactions(txs ?? []);
    setCredits(creds ?? []);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  // ── Computed ───────────────────────────────────────────────
  const incomeTxs   = transactions.filter(t => t.type === "income");
  const totalIncome = incomeTxs.reduce((s, t) => s + Number(t.amount), 0);

  const manualMandatory: MandatoryItem[] = (settings?.mandatory ?? []).filter(m => m.source !== "credit");
  const creditItems: MandatoryItem[] = credits.map(c => {
    const stored = (settings?.mandatory ?? []).find(m => m.credit_id === c.id);
    return {
      id: `credit_${c.id}`, label: c.name, amount: Number(c.monthly_payment),
      icon: "💳", paid: stored?.paid ?? false, source: "credit", credit_id: c.id,
    };
  });

  const allMandatory   = [...creditItems, ...manualMandatory];
  const totalMandatory = allMandatory.reduce((s, m) => s + Number(m.amount), 0);
  const disposable     = totalIncome - totalMandatory;
  const weeklyBudget   = weeksCount > 0 ? Math.floor(Math.max(0, disposable) / weeksCount) : 0;

  const weeksBase = Array.from({ length: weeksCount }, (_, i) => {
    const wNum  = i + 1;
    const range = getWeekRange(wNum, year, month);
    const wTxs  = transactions.filter(
      t => t.type === "expense" && t.transaction_date >= range.start && t.transaction_date <= range.end
    );
    return { wNum, range, spent: wTxs.reduce((s, t) => s + Number(t.amount), 0), txs: wTxs };
  });

  type WeekData = typeof weeksBase[0] & { carryIn: number; effective: number; carryOut: number };
  const weeksData = weeksBase.reduce<WeekData[]>((acc, w, i) => {
    const carryIn   = i === 0 ? 0 : acc[i - 1].carryOut;
    const effective = weeklyBudget + carryIn;
    const carryOut  = effective - w.spent;
    return [...acc, { ...w, carryIn, effective, carryOut }];
  }, []);

  const totalSpent   = weeksBase.reduce((s, w) => s + w.spent, 0);
  const lastCarryOut = weeksData[weeksCount - 1]?.carryOut ?? 0;
  const currentFree  = curWeek > 0
    ? (weeksData[curWeek - 1]?.effective ?? 0) - (weeksData[curWeek - 1]?.spent ?? 0)
    : 0;

  // ── Settings save ──────────────────────────────────────────
  async function saveSettings(patch: Partial<EnvSettings>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const merged = { ...settings!, ...patch };
    if (settings?.id) {
      await supabase.from("envelope_settings").update(patch).eq("id", settings.id);
    } else {
      const { data } = await supabase.from("envelope_settings").insert({
        user_id: user.id, month, year, is_active: true, weeks_count: weeksCount, ...patch,
      }).select().single();
      if (data) { setSettings({ ...data, mandatory: data.mandatory ?? [] }); return; }
    }
    setSettings(merged);
  }

  // ── Mandatory actions ──────────────────────────────────────
  function togglePaid(item: MandatoryItem) {
    const current = settings?.mandatory ?? [];
    let updated: MandatoryItem[];
    if (item.source === "credit") {
      const exists = current.find(m => m.credit_id === item.credit_id);
      updated = exists
        ? current.map(m => m.credit_id === item.credit_id ? { ...m, paid: !m.paid } : m)
        : [...current, { ...item, paid: true }];
    } else {
      updated = current.map(m => m.id === item.id ? { ...m, paid: !m.paid } : m);
    }
    saveSettings({ mandatory: updated });
  }

  function addManualMandatory() {
    if (!newMandatory.label || !newMandatory.amount) return;
    const item: MandatoryItem = {
      id: uid(), label: newMandatory.label, amount: +newMandatory.amount,
      icon: newMandatory.icon || "💳", paid: false, source: "manual",
      category_key: newMandatory.category_key || undefined,
    };
    saveSettings({ mandatory: [...(settings?.mandatory ?? []), item] });
    setNewMandatory({ label: "", amount: "", icon: "💳", category_key: "" });
    setAddMandatoryOpen(false);
  }

  function deleteMandatory(id: string) {
    saveSettings({ mandatory: (settings?.mandatory ?? []).filter(m => m.id !== id) });
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
              <span className="text-base">✉️</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Конверти</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />Активно
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">{monthName}</p>
        </div>
        <div className="flex items-center gap-2">
          {(isPastMonth || curWeek >= weeksCount) && (
            <button onClick={() => setShowEom(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-500 text-xs font-semibold hover:bg-orange-100 transition-all">
              📊 Підсумок місяця
            </button>
          )}
          <button onClick={onDeactivate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-all">
            <Icon d={icons.close} className="w-3.5 h-3.5" />Деактивувати
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "💰", label: "Дохід місяця",     value: totalIncome,    color: "text-green-500",  sub: `${incomeTxs.length} надходжень` },
          { emoji: "🔒", label: "Обов'язкові",      value: totalMandatory, color: "text-red-400",    sub: `${allMandatory.filter(m => m.paid).length}/${allMandatory.length} сплачено` },
          { emoji: "📅", label: "Тижневий конверт", value: weeklyBudget,   color: "text-orange-500", sub: `${weeksCount} тижні у місяці` },
          {
            emoji: curWeek > 0 ? "✨" : "📊",
            label: curWeek > 0 ? "Вільно зараз" : "Залишок місяця",
            value: curWeek > 0 ? Math.max(0, currentFree) : Math.abs(lastCarryOut),
            color: curWeek > 0 ? (currentFree < 0 ? "text-red-500" : "text-blue-500") : (lastCarryOut >= 0 ? "text-green-500" : "text-red-500"),
            sub: curWeek > 0 ? `Тиждень ${curWeek}` : (lastCarryOut >= 0 ? "заощаджено" : "дефіцит"),
          },
        ].map(({ emoji, label, value, color, sub }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{emoji}</span>
              <p className="text-xs text-neutral-400">{label}</p>
            </div>
            <p className={`text-lg font-bold ${color}`}>{fmt(value)}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Warnings */}
      {totalIncome === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <Icon d={extraIcons.warn} className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Доходів ще не зафіксовано</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Тижневий бюджет розраховується автоматично після надходження income-транзакцій.</p>
          </div>
        </div>
      )}
      {totalIncome > 0 && disposable < 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <Icon d={extraIcons.warn} className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Обов'язкові перевищують дохід</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Дохід {fmt(totalIncome)} — обов'язкові {fmt(totalMandatory)} = дефіцит {fmt(Math.abs(disposable))}</p>
          </div>
        </div>
      )}

      {/* Income */}
      <Card>
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💰</span>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Доходи місяця</h2>
            <span className="text-xs text-neutral-400">з транзакцій</span>
          </div>
          <span className="text-sm font-bold text-green-500">+{fmt(totalIncome)}</span>
        </div>
        {incomeTxs.length === 0 ? (
          <p className="text-center py-8 text-sm text-neutral-400">Немає income-транзакцій цього місяця</p>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {incomeTxs.map(tx => {
              const cat = getCategoryDef(tx.category_key);
              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-950/20 flex items-center justify-center text-sm shrink-0">{cat.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{tx.description || cat.label}</p>
                    <p className="text-xs text-neutral-400">{tx.transaction_date}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-500 tabular-nums shrink-0">+{fmt(Number(tx.amount))}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Mandatory */}
      <Card>
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Обов'язкові витрати</h2>
          </div>
          <button onClick={() => setAddMandatoryOpen(v => !v)}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>

        {addMandatoryOpen && (
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-orange-50/50 dark:bg-orange-950/10 space-y-3">
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input value={newMandatory.icon} onChange={e => setNewMandatory(p => ({ ...p, icon: e.target.value }))}
                placeholder="🏠" className={`w-14 ${inp} text-center text-lg`} />
              <input value={newMandatory.label} onChange={e => setNewMandatory(p => ({ ...p, label: e.target.value }))}
                placeholder="Назва витрати (оренда, комунальні...)" className={`flex-1 ${inp}`} autoFocus />
              <input type="number" value={newMandatory.amount} onChange={e => setNewMandatory(p => ({ ...p, amount: e.target.value }))}
                placeholder="Сума" className={`w-28 ${inp}`} />
            </div>
            <div className="flex gap-2 items-center">
              <select value={newMandatory.category_key} onChange={e => setNewMandatory(p => ({ ...p, category_key: e.target.value }))}
                className={`flex-1 ${inp}`}>
                <option value="">— Категорія бюджету (опційно) —</option>
                {Object.entries(CATEGORY_EMOJIS).map(([key, emoji]) => (
                  <option key={key} value={key}>{emoji} {getCategoryDef(key).label}</option>
                ))}
              </select>
              <button onClick={addManualMandatory}
                className="px-4 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
                Додати
              </button>
              <button onClick={() => setAddMandatoryOpen(false)}
                className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">✕</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {creditItems.length > 0 && (
            <div className="px-5 py-2 bg-neutral-50/60 dark:bg-neutral-800/30">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Авто · з кредитів</p>
            </div>
          )}
          {creditItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${item.paid ? "opacity-50" : ""}`}>{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.paid ? "line-through text-neutral-400" : "text-neutral-900 dark:text-neutral-100"}`}>{item.label}</p>
                <p className="text-xs text-neutral-400">
                  {credits.find(c => c.id === item.credit_id) ? CREDIT_TYPE_LABEL[credits.find(c => c.id === item.credit_id)!.type] ?? "Кредит" : "Кредит"}
                  {" · "}{fmt(item.amount)}
                </p>
              </div>
              <button onClick={() => togglePaid(item)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${item.paid
                  ? "bg-green-100 dark:bg-green-950/20 text-green-600"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-orange-50 hover:text-orange-500"}`}>
                {item.paid ? "Сплачено ✓" : "Позначити"}
              </button>
            </div>
          ))}

          {manualMandatory.length > 0 && (
            <div className="px-5 py-2 bg-neutral-50/60 dark:bg-neutral-800/30">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Додані вручну</p>
            </div>
          )}
          {manualMandatory.map(item => (
            <div key={item.id} className="group flex items-center gap-3 px-5 py-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${item.paid ? "opacity-50" : ""}`}>{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.paid ? "line-through text-neutral-400" : "text-neutral-900 dark:text-neutral-100"}`}>{item.label}</p>
                <p className="text-xs text-neutral-400">
                  {item.category_key ? `${CATEGORY_EMOJIS[item.category_key] ?? ""} ${getCategoryDef(item.category_key).label} · ` : ""}
                  {fmt(item.amount)}
                </p>
              </div>
              <button onClick={() => togglePaid(item)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${item.paid
                  ? "bg-green-100 dark:bg-green-950/20 text-green-600"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-orange-50 hover:text-orange-500"}`}>
                {item.paid ? "Сплачено ✓" : "Сплатити"}
              </button>
              <button onClick={() => deleteMandatory(item.id)}
                className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all shrink-0">
                <Icon d={icons.trash} className="w-4 h-4" />
              </button>
            </div>
          ))}

          {allMandatory.length === 0 && !addMandatoryOpen && (
            <p className="text-center py-8 text-sm text-neutral-400">Немає обов'язкових витрат. Кредити з'являться автоматично.</p>
          )}
        </div>

        {allMandatory.length > 0 && (
          <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 flex justify-between">
            <span className="text-xs text-neutral-400">Всього обов'язкових</span>
            <span className="text-sm font-bold text-red-400">−{fmt(totalMandatory)}</span>
          </div>
        )}
      </Card>

      {/* Budget formula */}
      {totalIncome > 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
          <span className="text-xl">📅</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              Тижневий конверт: {fmt(weeklyBudget)} / тиждень
            </p>
            <p className="text-xs text-orange-600/70 dark:text-orange-500/70 mt-0.5">
              ({fmt(totalIncome)} − {fmt(totalMandatory)}) ÷ {weeksCount} тижні
            </p>
          </div>
        </div>
      )}

      {/* Weekly envelopes */}
      <div className="space-y-3">
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span>📅</span> Тижневі конверти
        </h2>
        {weeksData.map(w => {
          const isOver    = w.carryOut < 0;
          const isCurrent = w.wNum === curWeek;
          const isPast    = curWeek > 0 ? w.wNum < curWeek : true;
          const isFuture  = curWeek > 0 && w.wNum > curWeek;
          const pct       = Math.min(100, (w.spent / (w.effective || 1)) * 100);
          const isOpen    = expandedWeek === w.wNum;

          return (
            <Card key={w.wNum} className={`overflow-hidden transition-all ${
              isCurrent ? "border-orange-200 dark:border-orange-800 shadow-sm" : isOver ? "border-red-100 dark:border-red-900/30" : ""}`}>
              <div className="px-5 py-4 cursor-pointer" onClick={() => setExpandedWeek(isOpen ? null : w.wNum)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      isCurrent ? "bg-orange-400 text-white" : isPast ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"}`}>
                      {w.wNum}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          Тиждень {w.wNum}
                          <span className="text-xs font-normal text-neutral-400 ml-1.5">{w.range.label}</span>
                        </p>
                        {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500 font-medium">Зараз</span>}
                        {isFuture  && <span className="text-xs text-neutral-400">майбутній</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-neutral-400">Бюджет {fmt(weeklyBudget)}</p>
                        {w.carryIn > 0 && <span className="flex items-center gap-1 text-xs text-green-500 font-medium"><Icon d={extraIcons.carry} className="w-3 h-3" />+{fmt(w.carryIn)} перехід</span>}
                        {w.carryIn < 0 && <span className="flex items-center gap-1 text-xs text-red-400 font-medium"><Icon d={extraIcons.carry} className="w-3 h-3" />{fmt(w.carryIn)} дефіцит</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-base font-bold tabular-nums ${isOver ? "text-red-500" : isCurrent ? "text-orange-500" : isPast ? "text-neutral-500" : "text-neutral-400"}`}>
                        {isOver ? "−" : ""}{fmt(Math.abs(w.carryOut))}
                      </p>
                      <p className="text-xs text-neutral-400">{isOver ? "перевищення" : isFuture ? "прогноз" : "залишок"}</p>
                    </div>
                    <Icon d={isOpen ? extraIcons.chevDown : extraIcons.chevRight} className="w-4 h-4 text-neutral-300" />
                  </div>
                </div>
                {!isFuture && (
                  <>
                    <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-orange-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <p className="text-xs text-neutral-400">Витрачено {fmt(w.spent)}</p>
                      <p className="text-xs text-neutral-400">З {fmt(w.effective)}</p>
                    </div>
                  </>
                )}
              </div>

              {isOpen && w.txs.length > 0 && (
                <div className="border-t border-neutral-50 dark:border-neutral-800/50">
                  <p className="px-5 pt-3 pb-1 text-xs font-semibold text-neutral-400 uppercase tracking-wide">Транзакції тижня</p>
                  {w.txs.map(tx => {
                    const cat = getCategoryDef(tx.category_key);
                    return (
                      <div key={tx.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                        <span className="text-sm shrink-0">{cat.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{tx.description || cat.label}</p>
                          <p className="text-xs text-neutral-400">{tx.transaction_date}</p>
                        </div>
                        <p className="text-xs font-medium text-red-400 tabular-nums shrink-0">−{fmt(Number(tx.amount))}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {isOpen && w.txs.length === 0 && !isFuture && (
                <div className="border-t border-neutral-50 dark:border-neutral-800/50 px-5 py-4">
                  <p className="text-xs text-neutral-400 text-center">Немає витрат у цьому тижні</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showEom && (
        <EomDialog
          totalIncome={totalIncome} totalMandatory={totalMandatory}
          totalSpent={totalSpent} lastCarryOut={lastCarryOut}
          month={month} year={year}
          onClose={() => setShowEom(false)}
        />
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function EnvelopesPage() {
  const supabase = createClient();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year]  = useState(now.getFullYear());
  const [active, setActive]   = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("envelope_settings").select("is_active")
        .eq("user_id", user.id).eq("month", month).eq("year", year).single();
      setActive(data?.is_active ?? false);
      setLoading(false);
    }
    check();
  }, [month, year]);

  async function activate() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const weeksCount = weeksInMonth(year, month);
    const { data: existing } = await supabase.from("envelope_settings").select("id")
      .eq("user_id", user.id).eq("month", month).eq("year", year).single();
    if (existing) {
      await supabase.from("envelope_settings").update({ is_active: true }).eq("id", existing.id);
    } else {
      await supabase.from("envelope_settings").insert({
        user_id: user.id, month, year, is_active: true, weeks_count: weeksCount, mandatory: [],
      });
    }
    setActive(true);
  }

  async function deactivate() {
    if (!confirm("Деактивувати метод конвертів цього місяця?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("envelope_settings").update({ is_active: false })
      .eq("user_id", user.id).eq("month", month).eq("year", year);
    setActive(false);
  }

  if (loading || active === null) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <FeatureGate featureKey="feature_envelopes" label="Конверти">
      <div className="pb-8">
        {!active
          ? <ActivationScreen onActivate={activate} />
          : <EnvelopesMain month={month} year={year} onDeactivate={deactivate} />}
      </div>
    </FeatureGate>
  );
}
