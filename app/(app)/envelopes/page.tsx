"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Card } from "@/components/ui";

interface IncomeSource { id: string; label: string; amount: number; expected_day: number; received: boolean; month: number; year: number; }
interface MandatoryItem { id: string; label: string; amount: number; icon: string; paid: boolean; }
interface WeekTx { id: string; label: string; amount: number; critical: boolean; }
interface WeekRow { id: string; week_number: number; budget: number; spent: number; carry: number; transactions: WeekTx[]; }
interface EnvSettings { id: string; is_active: boolean; weeks_count: number; mandatory: MandatoryItem[]; }

function fmt(n: number) { return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн"; }
function uid() { return Math.random().toString(36).slice(2, 9); }
function getWeeksInMonth(y: number, m: number) {
  const firstDay = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  return Math.ceil((firstDay + daysInMonth) / 7);
}
function getCurrentWeek(m: number, y: number) {
  const now = new Date();
  if (now.getMonth() + 1 !== m || now.getFullYear() !== y) return 1;
  const firstDay = new Date(y, m - 1, 1);
  return Math.ceil((now.getDate() + firstDay.getDay()) / 7);
}

// ─── Extra icons (не в бібліотеці) ───────────────────────────
const extraIcons = {
  check:  "M5 13l4 4L19 7",
  warn:   "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  spark:  "M13 10V3L4 14h7v7l9-11h-7z",
  carry:  "M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4",
};

// ─── ACTIVATION SCREEN ────────────────────────────────────────
function ActivationScreen({ onActivate }: { onActivate: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { emoji: "💰", title: "Збирай дохід",        desc: "Додай всі джерела доходу — зарплата, фріланс, оренда. Дохід може приходити частинами протягом місяця." },
    { emoji: "🔒", title: "Обов'язкові першими", desc: "Виділи фіксовані витрати: оренда, кредити, комунальні. Вони списуються автоматично з першого надходження." },
    { emoji: "📅", title: "Ділимо на тижні",     desc: "Залишок після обов'язкових ділиться на кількість тижнів місяця. Кожен тиждень — окремий конверт." },
    { emoji: "✨", title: "Залишок переходить",   desc: "Зекономив на тижні 1? Ці гроші переходять на тиждень 2 і збільшують конверт. Економія = нагорода!" },
    { emoji: "🚨", title: "Перевищення = сигнал", desc: "Якщо тижневий конверт вичерпано — система попереджає. Критичну витрату можна додати з поясненням." },
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
              className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                step === i ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 shadow-sm"
                : i < step ? "border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10"
                : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all ${
                step === i ? "bg-orange-100 dark:bg-orange-950/30 scale-110" : i < step ? "bg-green-100 dark:bg-green-950/20" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                {i < step ? "✅" : s.emoji}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold transition-colors ${step === i ? "text-orange-600 dark:text-orange-400" : i < step ? "text-green-600 dark:text-green-400" : "text-neutral-700 dark:text-neutral-300"}`}>{s.title}</p>
                <p className={`text-xs mt-0.5 transition-all overflow-hidden ${step === i ? "text-neutral-600 dark:text-neutral-400 max-h-20" : "text-neutral-400 max-h-0 sm:max-h-20"}`}>{s.desc}</p>
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

// ─── MAIN ─────────────────────────────────────────────────────
function EnvelopesMain({ month, year, onDeactivate }: { month: number; year: number; onDeactivate: () => void }) {
  const supabase = createClient();
  const weeksCount  = getWeeksInMonth(year, month);
  const currentWeek = getCurrentWeek(month, year);
  const monthName   = new Date(year, month - 1, 1).toLocaleDateString("uk-UA", { month: "long", year: "numeric" });

  const [loading, setLoading]               = useState(true);
  const [settings, setSettings]             = useState<EnvSettings | null>(null);
  const [incomeSources, setIncomeSources]   = useState<IncomeSource[]>([]);
  const [weeks, setWeeks]                   = useState<WeekRow[]>([]);

  const [addIncomeOpen, setAddIncomeOpen]       = useState(false);
  const [addMandatoryOpen, setAddMandatoryOpen] = useState(false);
  const [newIncome, setNewIncome]               = useState({ label: "", amount: "", day: "1" });
  const [newMandatory, setNewMandatory]         = useState({ label: "", amount: "", icon: "💳" });
  const [addSpendModal, setAddSpendModal]       = useState<{ weekId: string; weekNum: number } | null>(null);
  const [spendLabel, setSpendLabel]             = useState("");
  const [spendAmount, setSpendAmount]           = useState("");
  const [criticalModal, setCriticalModal]       = useState<{ weekId: string; weekNum: number } | null>(null);
  const [critLabel, setCritLabel]               = useState("");
  const [critAmount, setCritAmount]             = useState("");

  const inp = "px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300";

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: sets }, { data: srcs }, { data: wks }] = await Promise.all([
      supabase.from("envelope_settings").select("*").eq("user_id", user.id).eq("month", month).eq("year", year).single(),
      supabase.from("envelope_income_sources").select("*").eq("user_id", user.id).eq("month", month).eq("year", year).order("created_at"),
      supabase.from("envelope_weeks").select("*").eq("user_id", user.id).eq("month", month).eq("year", year).order("week_number"),
    ]);

    setSettings(sets ? { ...sets, mandatory: sets.mandatory ?? [] } : null);
    setIncomeSources(srcs ?? []);
    if (wks && wks.length > 0) setWeeks(wks.map(w => ({ ...w, transactions: w.transactions ?? [] })));
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const totalIncome    = incomeSources.reduce((s, x) => s + Number(x.amount), 0);
  const receivedIncome = incomeSources.filter(x => x.received).reduce((s, x) => s + Number(x.amount), 0);
  const mandatory      = settings?.mandatory ?? [];
  const totalMandatory = mandatory.reduce((s, m) => s + Number(m.amount), 0);
  const available      = totalIncome - totalMandatory;
  const weeklyBudget   = weeksCount > 0 ? Math.floor(available / weeksCount) : 0;

  const weeksWithCarry = weeks.reduce<WeekRow[]>((acc, w, i) => {
    const prev  = acc[i - 1];
    const carry = i === 0 ? 0 : Math.max(0, Number(prev.budget) + Number(prev.carry) - Number(prev.spent));
    return [...acc, { ...w, carry }];
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async function ensureWeeks() {
    const user = await getUser(); if (!user) return;
    if (weeks.length >= weeksCount) return;
    const existing = new Set(weeks.map(w => w.week_number));
    const toInsert = Array.from({ length: weeksCount }, (_, i) => i + 1).filter(n => !existing.has(n));
    if (toInsert.length === 0) return;
    const { data: created } = await supabase.from("envelope_weeks").insert(
      toInsert.map(n => ({ user_id: user.id, month, year, week_number: n, budget: weeklyBudget, spent: 0, carry: 0, transactions: [] }))
    ).select();
    if (created) setWeeks(prev => [...prev, ...created.map(w => ({ ...w, transactions: [] }))].sort((a, b) => a.week_number - b.week_number));
  }

  async function addIncome() {
    if (!newIncome.label || !newIncome.amount) return;
    const user = await getUser(); if (!user) return;
    const { data } = await supabase.from("envelope_income_sources").insert({
      user_id: user.id, label: newIncome.label, amount: +newIncome.amount,
      expected_day: +newIncome.day || 1, received: false, month, year,
    }).select().single();
    if (data) setIncomeSources(p => [...p, data]);
    setNewIncome({ label: "", amount: "", day: "1" }); setAddIncomeOpen(false);
  }
  async function toggleReceived(id: string, current: boolean) {
    await supabase.from("envelope_income_sources").update({ received: !current }).eq("id", id);
    setIncomeSources(p => p.map(s => s.id === id ? { ...s, received: !current } : s));
  }
  async function deleteIncome(id: string) {
    await supabase.from("envelope_income_sources").delete().eq("id", id);
    setIncomeSources(p => p.filter(s => s.id !== id));
  }

  async function saveSettings(patch: Partial<EnvSettings>) {
    const user = await getUser(); if (!user) return;
    const merged = { ...settings, ...patch };
    if (settings?.id) {
      await supabase.from("envelope_settings").update(patch).eq("id", settings.id);
    } else {
      const { data } = await supabase.from("envelope_settings").insert({
        user_id: user.id, month, year, is_active: true, weeks_count: weeksCount, ...patch,
      }).select().single();
      if (data) setSettings({ ...data, mandatory: data.mandatory ?? [] });
      return;
    }
    setSettings(merged as EnvSettings);
  }

  function addMandatory() {
    if (!newMandatory.label || !newMandatory.amount) return;
    const item: MandatoryItem = { id: uid(), label: newMandatory.label, amount: +newMandatory.amount, icon: newMandatory.icon || "💳", paid: false };
    saveSettings({ mandatory: [...mandatory, item] });
    setNewMandatory({ label: "", amount: "", icon: "💳" }); setAddMandatoryOpen(false);
  }
  function toggleMandatoryPaid(id: string) {
    saveSettings({ mandatory: mandatory.map(m => m.id === id ? { ...m, paid: !m.paid } : m) });
  }
  function deleteMandatory(id: string) {
    saveSettings({ mandatory: mandatory.filter(m => m.id !== id) });
  }

  async function addSpend(weekId: string, label: string, amount: number, critical: boolean) {
    const week = weeks.find(w => w.id === weekId); if (!week) return;
    const tx: WeekTx = { id: uid(), label, amount, critical };
    const newTxs  = [...(week.transactions ?? []), tx];
    const newSpent = Number(week.spent) + amount;
    await supabase.from("envelope_weeks").update({ spent: newSpent, transactions: newTxs }).eq("id", weekId);
    setWeeks(p => p.map(w => w.id === weekId ? { ...w, spent: newSpent, transactions: newTxs } : w));
  }
  async function removeTransaction(weekId: string, txId: string) {
    const week = weeks.find(w => w.id === weekId); if (!week) return;
    const tx = week.transactions.find(t => t.id === txId);
    const newTxs   = week.transactions.filter(t => t.id !== txId);
    const newSpent = Math.max(0, Number(week.spent) - (tx?.amount ?? 0));
    await supabase.from("envelope_weeks").update({ spent: newSpent, transactions: newTxs }).eq("id", weekId);
    setWeeks(p => p.map(w => w.id === weekId ? { ...w, spent: newSpent, transactions: newTxs } : w));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  const currentWeekData = weeksWithCarry.find(w => w.week_number === currentWeek);
  const freeNow = currentWeekData ? Math.max(0, Number(currentWeekData.budget) + Number(currentWeekData.carry) - Number(currentWeekData.spent)) : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center"><span className="text-base">✉️</span></div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Конверти</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />Активно
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">{monthName}</p>
        </div>
        <button onClick={onDeactivate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-all">
          <Icon d={icons.close} className="w-3.5 h-3.5" />Деактивувати
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "💰", label: "Дохід місяця",     value: fmt(totalIncome),    sub: `Отримано ${fmt(receivedIncome)}`,                         color: "text-green-500" },
          { emoji: "🔒", label: "Обов'язкові",      value: fmt(totalMandatory), sub: `${mandatory.filter(m=>m.paid).length}/${mandatory.length} сплачено`, color: "text-red-400" },
          { emoji: "📅", label: "Тижневий конверт", value: fmt(weeklyBudget),   sub: `${weeksCount} тижні у місяці`,                            color: "text-orange-500" },
          { emoji: "✨", label: "Вільно зараз",     value: fmt(freeNow),        sub: `Тиждень ${currentWeek}`,                                   color: "text-blue-500" },
        ].map(({ emoji, label, value, sub, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-2"><span className="text-lg">{emoji}</span><p className="text-xs text-neutral-400">{label}</p></div>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Income sources */}
      <Card>
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2"><span>💰</span><h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Джерела доходу</h2></div>
          <button onClick={() => setAddIncomeOpen(v => !v)}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>
        {addIncomeOpen && (
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-orange-50/50 dark:bg-orange-950/10">
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input value={newIncome.label} onChange={e => setNewIncome(p => ({ ...p, label: e.target.value }))}
                placeholder="Назва (зарплата, фріланс...)" className={`flex-1 ${inp}`} />
              <input type="number" value={newIncome.amount} onChange={e => setNewIncome(p => ({ ...p, amount: e.target.value }))}
                placeholder="Сума" className={`w-28 ${inp}`} />
              <input type="number" value={newIncome.day} onChange={e => setNewIncome(p => ({ ...p, day: e.target.value }))}
                placeholder="День" className={`w-16 ${inp}`} />
              <button onClick={addIncome} className="px-4 py-2 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">Додати</button>
            </div>
          </div>
        )}
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {incomeSources.length === 0 && !addIncomeOpen && (
            <p className="text-center py-8 text-sm text-neutral-400">Немає джерел доходу — додай першим</p>
          )}
          {incomeSources.map(src => (
            <div key={src.id} className="group flex items-center gap-3 px-5 py-3.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${src.received ? "bg-green-100 dark:bg-green-950/20" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                {src.received ? "✅" : "⏳"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{src.label}</p>
                <p className="text-xs text-neutral-400">{src.received ? "Отримано" : `Очікується ${src.expected_day} числа`}</p>
              </div>
              <p className={`text-sm font-bold ${src.received ? "text-green-500" : "text-neutral-400"}`}>+{fmt(src.amount)}</p>
              <button onClick={() => toggleReceived(src.id, src.received)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${src.received ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-orange-50 hover:text-orange-500"}`}>
                {src.received ? "Отримано ✓" : "Позначити"}
              </button>
              <button onClick={() => deleteIncome(src.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                <Icon d={icons.trash} className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Mandatory envelopes */}
      <Card>
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Обов'язкові конверти</h2>
            <span className="text-xs text-neutral-400">списуються першими</span>
          </div>
          <button onClick={() => setAddMandatoryOpen(v => !v)}
            className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>
        {addMandatoryOpen && (
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-orange-50/50 dark:bg-orange-950/10">
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input value={newMandatory.icon} onChange={e => setNewMandatory(p => ({ ...p, icon: e.target.value }))}
                placeholder="🏠" className={`w-14 ${inp} text-center text-lg`} />
              <input value={newMandatory.label} onChange={e => setNewMandatory(p => ({ ...p, label: e.target.value }))}
                placeholder="Назва витрати" className={`flex-1 ${inp}`} />
              <input type="number" value={newMandatory.amount} onChange={e => setNewMandatory(p => ({ ...p, amount: e.target.value }))}
                placeholder="Сума" className={`w-28 ${inp}`} />
              <button onClick={addMandatory} className="px-4 py-2 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">Додати</button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-neutral-50 dark:divide-neutral-800/50">
          {mandatory.length === 0 && !addMandatoryOpen && (
            <p className="col-span-2 text-center py-8 text-sm text-neutral-400">Немає обов'язкових витрат</p>
          )}
          {mandatory.map(m => (
            <div key={m.id} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${m.paid ? "opacity-60" : ""}`}>{m.icon}</div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${m.paid ? "line-through text-neutral-400" : "text-neutral-900 dark:text-neutral-100"}`}>{m.label}</p>
                <p className="text-xs text-neutral-400">{fmt(m.amount)}</p>
              </div>
              <button onClick={() => toggleMandatoryPaid(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${m.paid ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-orange-50 hover:text-orange-500"}`}>
                {m.paid ? "Сплачено ✓" : "Сплатити"}
              </button>
              <button onClick={() => deleteMandatory(m.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                <Icon d={icons.trash} className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {mandatory.length > 0 && (
          <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 flex justify-between items-center">
            <span className="text-xs text-neutral-400">Всього обов'язкових</span>
            <span className="text-sm font-bold text-red-400">−{fmt(totalMandatory)}</span>
          </div>
        )}
      </Card>

      {/* Weekly envelopes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Тижневі конверти</h2>
            <span className="text-xs text-neutral-400">по {fmt(weeklyBudget)} / тиждень</span>
          </div>
          {weeks.length < weeksCount && (
            <button onClick={ensureWeeks} className="text-xs text-orange-400 hover:text-orange-500 font-medium transition-colors">
              Ініціалізувати тижні
            </button>
          )}
        </div>

        {weeks.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm text-neutral-400 mb-3">Тижні ще не створено</p>
            <button onClick={ensureWeeks} className="px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
              Створити тижні місяця
            </button>
          </Card>
        ) : (
          <div className="space-y-3">
            {weeksWithCarry.map(w => {
              const effective = Number(w.budget) + Number(w.carry);
              const remaining = effective - Number(w.spent);
              const isOver    = remaining < 0;
              const pct       = Math.min(100, (Number(w.spent) / (effective || 1)) * 100);
              const isCurrent = w.week_number === currentWeek;
              const isPast    = w.week_number < currentWeek;

              return (
                <Card key={w.id} className={`overflow-hidden transition-all ${
                  isCurrent ? "border-orange-200 dark:border-orange-800 shadow-sm" : isOver ? "border-red-100 dark:border-red-900/30" : ""}`}>
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                          isCurrent ? "bg-orange-400 text-white" : isPast ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"}`}>
                          {w.week_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Тиждень {w.week_number}</p>
                            {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500 font-medium">Зараз</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-neutral-400">Бюджет {fmt(Number(w.budget))}</p>
                            {Number(w.carry) > 0 && (
                              <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                <Icon d={extraIcons.carry} className="w-3 h-3" />+{fmt(Number(w.carry))} перехід
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isOver ? "text-red-500" : isCurrent ? "text-orange-500" : "text-neutral-700 dark:text-neutral-300"}`}>
                          {isOver ? "−" : ""}{fmt(Math.abs(remaining))}
                        </p>
                        <p className="text-xs text-neutral-400">{isOver ? "перевищення" : "залишок"}</p>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-orange-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <p className="text-xs text-neutral-400">Витрачено {fmt(Number(w.spent))}</p>
                      <p className="text-xs text-neutral-400">З {fmt(effective)}</p>
                    </div>
                  </div>

                  {w.transactions.length > 0 && (
                    <div className="border-t border-neutral-50 dark:divide-neutral-800/50">
                      {w.transactions.map(tx => (
                        <div key={tx.id} className="group flex items-center gap-3 px-5 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tx.critical ? "bg-red-400" : "bg-neutral-300 dark:bg-neutral-600"}`} />
                          <p className="flex-1 text-xs text-neutral-600 dark:text-neutral-400">{tx.label}</p>
                          {tx.critical && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/20 text-red-500">критична</span>}
                          <p className="text-xs font-medium text-red-400">−{fmt(tx.amount)}</p>
                          <button onClick={() => removeTransaction(w.id, tx.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                            <Icon d={icons.trash} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(isCurrent || isPast) && (
                    <div className="px-5 py-3 border-t border-neutral-50 dark:border-neutral-800/50 flex gap-2">
                      <button onClick={() => { setAddSpendModal({ weekId: w.id, weekNum: w.week_number }); setSpendLabel(""); setSpendAmount(""); }}
                        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-orange-400 transition-colors font-medium">
                        <Icon d={icons.plus} className="w-3.5 h-3.5" />Додати витрату
                      </button>
                      {isOver && (
                        <button onClick={() => { setCriticalModal({ weekId: w.id, weekNum: w.week_number }); setCritLabel(""); setCritAmount(""); }}
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 transition-colors font-medium ml-auto">
                          <Icon d={extraIcons.warn} className="w-3.5 h-3.5" />Критична витрата
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add spend modal */}
      {addSpendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm border-t sm:border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Витрата · Тиждень {addSpendModal.weekNum}</h3>
              <button onClick={() => setAddSpendModal(null)}><Icon d={icons.close} className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <input value={spendLabel} onChange={e => setSpendLabel(e.target.value)}
              placeholder="Назва (кафе, продукти...)" className={`w-full ${inp} bg-neutral-50 dark:bg-neutral-800`} autoFocus />
            <input type="number" value={spendAmount} onChange={e => setSpendAmount(e.target.value)}
              placeholder="Сума" className={`w-full ${inp} bg-neutral-50 dark:bg-neutral-800`} />
            <button onClick={() => { if (!spendLabel || !spendAmount) return; addSpend(addSpendModal.weekId, spendLabel, +spendAmount, false); setAddSpendModal(null); }}
              className="w-full py-3 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 transition-colors">
              Записати витрату
            </button>
          </div>
        </div>
      )}

      {/* Critical modal */}
      {criticalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm border-t sm:border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/20 flex items-center justify-center">
                <Icon d={extraIcons.warn} className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Критична витрата</h3>
                <p className="text-xs text-neutral-400">Конверт вичерпано. Витрата буде позначена як критична.</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
              <p className="text-xs text-red-600 dark:text-red-400">⚠️ Використовуй лише у разі крайньої необхідності.</p>
            </div>
            <input value={critLabel} onChange={e => setCritLabel(e.target.value)}
              placeholder="Що трапилось? (обґрунтування)"
              className={`w-full ${inp} border-red-200 dark:border-red-800 bg-neutral-50 dark:bg-neutral-800 focus:border-red-400`} autoFocus />
            <input type="number" value={critAmount} onChange={e => setCritAmount(e.target.value)}
              placeholder="Сума" className={`w-full ${inp} bg-neutral-50 dark:bg-neutral-800`} />
            <div className="flex gap-2">
              <button onClick={() => setCriticalModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">
                Скасувати
              </button>
              <button onClick={() => { if (!critLabel || !critAmount) return; addSpend(criticalModal.weekId, critLabel, +critAmount, true); setCriticalModal(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                Підтвердити
              </button>
            </div>
          </div>
        </div>
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
    const weeksCount = getWeeksInMonth(year, month);
    const { data: existing } = await supabase.from("envelope_settings").select("id")
      .eq("user_id", user.id).eq("month", month).eq("year", year).single();
    if (existing) {
      await supabase.from("envelope_settings").update({ is_active: true }).eq("id", existing.id);
    } else {
      await supabase.from("envelope_settings").insert({ user_id: user.id, month, year, is_active: true, weeks_count: weeksCount, mandatory: [] });
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
    <div className="pb-8">
      {!active
        ? <ActivationScreen onActivate={activate} />
        : <EnvelopesMain month={month} year={year} onDeactivate={deactivate} />}
    </div>
  );
}