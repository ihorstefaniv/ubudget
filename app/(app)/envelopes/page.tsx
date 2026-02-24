"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────
interface IncomeSource { id: string; label: string; amount: number; expectedDay: number; received: boolean; }
interface MandatoryEnvelope { id: string; label: string; amount: number; icon: string; paid: boolean; }
interface WeekEnvelope { week: number; label: string; budget: number; spent: number; carry: number; transactions: { id: string; label: string; amount: number; critical: boolean }[]; }

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн";
}
function uid() { return Math.random().toString(36).slice(2, 9); }

function getWeeksInMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.ceil((firstDay + daysInMonth) / 7);
}

function getCurrentWeek() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return Math.ceil((now.getDate() + firstDay.getDay()) / 7);
}

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  plus: "M12 4v16m8-8H4",
  close: "M6 18L18 6M6 6l12 12",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  check: "M5 13l4 4L19 7",
  warn: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  envelope: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  spark: "M13 10V3L4 14h7v7l9-11h-7z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  carry: "M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4",
};

// ─── ACTIVATION SCREEN ────────────────────────────────────────
function ActivationScreen({ onActivate }: { onActivate: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    { emoji: "💰", title: "Збирай дохід", desc: "Додай всі джерела доходу — зарплата, фріланс, оренда. Дохід може приходити частинами протягом місяця." },
    { emoji: "🔒", title: "Обов'язкові першими", desc: "Виділи фіксовані витрати: оренда, кредити, комунальні. Вони захищені — списуються автоматично з першого надходження." },
    { emoji: "📅", title: "Ділимо на тижні", desc: "Залишок після обов'язкових ділиться на кількість тижнів місяця. Кожен тиждень — окремий конверт." },
    { emoji: "✨", title: "Залишок переходить", desc: "Зекономив на тижні 1? Ці гроші переходять на тиждень 2 і збільшують конверт. Економія = нагорода!" },
    { emoji: "🚨", title: "Перевищення = сигнал", desc: "Якщо тижневий конверт вичерпано — система попереджає. Позичити з майбутнього можна лише позначивши як критичну витрату." },
  ];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-300 shadow-lg shadow-orange-200 dark:shadow-none mb-5">
            <span className="text-4xl">✉️</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Метод конвертів</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">Навчись витрачати усвідомлено і відкладати без зусиль</p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {steps.map((s, i) => (
            <div key={i} onClick={() => setStep(i)}
              className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                step === i
                  ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 shadow-sm"
                  : i < step
                  ? "border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/10"
                  : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all ${
                step === i ? "bg-orange-100 dark:bg-orange-950/30 scale-110" : i < step ? "bg-green-100 dark:bg-green-950/20" : "bg-neutral-100 dark:bg-neutral-800"
              }`}>
                {i < step ? "✅" : s.emoji}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold transition-colors ${step === i ? "text-orange-600 dark:text-orange-400" : i < step ? "text-green-600 dark:text-green-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                  {s.title}
                </p>
                <p className={`text-xs mt-0.5 transition-all overflow-hidden ${step === i ? "text-neutral-600 dark:text-neutral-400 max-h-20" : "text-neutral-400 max-h-0 sm:max-h-20"}`}>
                  {s.desc}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                step === i ? "border-orange-400 bg-orange-400" : i < step ? "border-green-400 bg-green-400" : "border-neutral-200 dark:border-neutral-700"
              }`}>
                {(step === i || i < step) && <Icon d={icons.check} className="w-3 h-3 text-white" />}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
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
              <Icon d={icons.spark} className="w-5 h-5" />
              Активувати метод конвертів!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ENVELOPES PAGE ──────────────────────────────────────
function EnvelopesMain({ onDeactivate }: { onDeactivate: () => void }) {
  const weeksCount = getWeeksInMonth();
  const currentWeek = getCurrentWeek();
  const now = new Date();
  const monthName = now.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });

  // Income sources
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([
    { id: "1", label: "Зарплата", amount: 45000, expectedDay: 1, received: true },
    { id: "2", label: "Фріланс", amount: 8500, expectedDay: 15, received: true },
    { id: "3", label: "Оренда", amount: 8000, expectedDay: 20, received: false },
  ]);

  // Mandatory envelopes
  const [mandatory, setMandatory] = useState<MandatoryEnvelope[]>([
    { id: "m1", label: "Іпотека", amount: 18500, icon: "🏠", paid: true },
    { id: "m2", label: "Авто кредит", amount: 9800, icon: "🚗", paid: true },
    { id: "m3", label: "Комунальні", amount: 2800, icon: "💡", paid: false },
    { id: "m4", label: "Інтернет + TV", amount: 450, icon: "📡", paid: false },
  ]);

  const [addIncomeOpen, setAddIncomeOpen] = useState(false);
  const [addMandatoryOpen, setAddMandatoryOpen] = useState(false);
  const [newIncome, setNewIncome] = useState({ label: "", amount: "", day: "1" });
  const [newMandatory, setNewMandatory] = useState({ label: "", amount: "", icon: "💳" });
  const [criticalModal, setCriticalModal] = useState<{ weekIdx: number } | null>(null);
  const [criticalLabel, setCriticalLabel] = useState("");
  const [criticalAmount, setCriticalAmount] = useState("");
  const [addSpendModal, setAddSpendModal] = useState<{ weekIdx: number } | null>(null);
  const [spendLabel, setSpendLabel] = useState("");
  const [spendAmount, setSpendAmount] = useState("");

  // Calculations
  const totalIncome = incomeSources.reduce((s, x) => s + x.amount, 0);
  const receivedIncome = incomeSources.filter(x => x.received).reduce((s, x) => s + x.amount, 0);
  const totalMandatory = mandatory.reduce((s, x) => s + x.amount, 0);
  const available = totalIncome - totalMandatory;
  const weeklyBudget = Math.floor(available / weeksCount);

  // Weekly envelopes state
  const [weeks, setWeeks] = useState<WeekEnvelope[]>(() =>
    Array.from({ length: weeksCount }, (_, i) => ({
      week: i + 1,
      label: `Тиждень ${i + 1}`,
      budget: weeklyBudget,
      spent: i === 0 ? 1160 : i === 1 ? 680 : 0,
      carry: 0,
      transactions: i === 0
        ? [{ id: uid(), label: "Сільпо", amount: 840, critical: false }, { id: uid(), label: "Кава та сніданок", amount: 320, critical: false }]
        : [],
    }))
  );

  // Compute carry-overs
  const weeksWithCarry = weeks.reduce<WeekEnvelope[]>((acc, w, i) => {
    const prevCarry = i === 0 ? 0 : Math.max(0, acc[i - 1].budget + acc[i - 1].carry - acc[i - 1].spent);
    return [...acc, { ...w, carry: prevCarry }];
  }, []);

  function addSpend(weekIdx: number, label: string, amount: number, critical: boolean) {
    setWeeks(prev => prev.map((w, i) => i === weekIdx
      ? { ...w, spent: w.spent + amount, transactions: [...w.transactions, { id: uid(), label, amount, critical }] }
      : w));
  }

  function removeTransaction(weekIdx: number, txId: string) {
    setWeeks(prev => prev.map((w, i) => {
      if (i !== weekIdx) return w;
      const tx = w.transactions.find(t => t.id === txId);
      return { ...w, spent: w.spent - (tx?.amount ?? 0), transactions: w.transactions.filter(t => t.id !== txId) };
    }));
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header with deactivate */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
              <span className="text-base">✉️</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Конверти</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              Активно
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">{monthName}</p>
        </div>
        <button onClick={onDeactivate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-all">
          <Icon d={icons.close} className="w-3.5 h-3.5" />
          Деактивувати
        </button>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "💰", label: "Дохід місяця", value: fmt(totalIncome), sub: `Отримано ${fmt(receivedIncome)}`, color: "text-green-500" },
          { emoji: "🔒", label: "Обов'язкові", value: fmt(totalMandatory), sub: `${mandatory.filter(m => m.paid).length}/${mandatory.length} сплачено`, color: "text-red-400" },
          { emoji: "📅", label: "Тижневий конверт", value: fmt(weeklyBudget), sub: `${weeksCount} тижні у місяці`, color: "text-orange-500" },
          { emoji: "✨", label: "Вільно зараз", value: fmt(Math.max(0, weeksWithCarry[currentWeek - 1]?.budget + weeksWithCarry[currentWeek - 1]?.carry - weeksWithCarry[currentWeek - 1]?.spent)), sub: `Тиждень ${currentWeek}`, color: "text-blue-500" },
        ].map(({ emoji, label, value, sub, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{emoji}</span>
              <p className="text-xs text-neutral-400">{label}</p>
            </div>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Income sources */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💰</span>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Джерела доходу</h2>
          </div>
          <button onClick={() => setAddIncomeOpen(v => !v)} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>

        {addIncomeOpen && (
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-orange-50/50 dark:bg-orange-950/10">
            <div className="flex gap-2">
              <input value={newIncome.label} onChange={e => setNewIncome(p => ({ ...p, label: e.target.value }))} placeholder="Назва (зарплата, фріланс...)"
                className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" />
              <input type="number" value={newIncome.amount} onChange={e => setNewIncome(p => ({ ...p, amount: e.target.value }))} placeholder="Сума"
                className="w-28 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" />
              <input type="number" value={newIncome.day} onChange={e => setNewIncome(p => ({ ...p, day: e.target.value }))} placeholder="День"
                className="w-16 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" />
              <button onClick={() => {
                if (!newIncome.label || !newIncome.amount) return;
                setIncomeSources(p => [...p, { id: uid(), label: newIncome.label, amount: +newIncome.amount, expectedDay: +newIncome.day, received: false }]);
                setNewIncome({ label: "", amount: "", day: "1" }); setAddIncomeOpen(false);
              }} className="px-4 py-2 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">Додати</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {incomeSources.map(src => (
            <div key={src.id} className="group flex items-center gap-3 px-5 py-3.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${src.received ? "bg-green-100 dark:bg-green-950/20" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                {src.received ? "✅" : "⏳"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{src.label}</p>
                <p className="text-xs text-neutral-400">{src.received ? "Отримано" : `Очікується ${src.expectedDay} числа`}</p>
              </div>
              <p className={`text-sm font-bold ${src.received ? "text-green-500" : "text-neutral-400"}`}>+{fmt(src.amount)}</p>
              <button onClick={() => setIncomeSources(p => p.map(x => x.id === src.id ? { ...x, received: !x.received } : x))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${src.received ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-orange-50 hover:text-orange-500"}`}>
                {src.received ? "Отримано ✓" : "Позначити"}
              </button>
              <button onClick={() => setIncomeSources(p => p.filter(x => x.id !== src.id))}
                className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                <Icon d={icons.trash} className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory envelopes */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Обов'язкові конверти</h2>
            <span className="text-xs text-neutral-400">Списуються першими</span>
          </div>
          <button onClick={() => setAddMandatoryOpen(v => !v)} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>

        {addMandatoryOpen && (
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-orange-50/50 dark:bg-orange-950/10">
            <div className="flex gap-2">
              <input value={newMandatory.icon} onChange={e => setNewMandatory(p => ({ ...p, icon: e.target.value }))} placeholder="🏠" className="w-14 px-2 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-center text-lg focus:outline-none" />
              <input value={newMandatory.label} onChange={e => setNewMandatory(p => ({ ...p, label: e.target.value }))} placeholder="Назва витрати"
                className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" />
              <input type="number" value={newMandatory.amount} onChange={e => setNewMandatory(p => ({ ...p, amount: e.target.value }))} placeholder="Сума"
                className="w-28 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" />
              <button onClick={() => {
                if (!newMandatory.label || !newMandatory.amount) return;
                setMandatory(p => [...p, { id: uid(), label: newMandatory.label, amount: +newMandatory.amount, icon: newMandatory.icon || "💳", paid: false }]);
                setNewMandatory({ label: "", amount: "", icon: "💳" }); setAddMandatoryOpen(false);
              }} className="px-4 py-2 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">Додати</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 divide-neutral-50 dark:divide-neutral-800/50">
          {mandatory.map(m => (
            <div key={m.id} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${m.paid ? "opacity-60" : ""}`}>{m.icon}</div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${m.paid ? "line-through text-neutral-400" : "text-neutral-900 dark:text-neutral-100"}`}>{m.label}</p>
                <p className="text-xs text-neutral-400">{fmt(m.amount)}</p>
              </div>
              <button onClick={() => setMandatory(p => p.map(x => x.id === m.id ? { ...x, paid: !x.paid } : x))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${m.paid ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-orange-50 hover:text-orange-500"}`}>
                {m.paid ? "Сплачено ✓" : "Сплатити"}
              </button>
              <button onClick={() => setMandatory(p => p.filter(x => x.id !== m.id))}
                className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                <Icon d={icons.trash} className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 flex justify-between items-center">
          <span className="text-xs text-neutral-400">Всього обов'язкових</span>
          <span className="text-sm font-bold text-red-400">−{fmt(totalMandatory)}</span>
        </div>
      </div>

      {/* Weekly envelopes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span>📅</span>
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Тижневі конверти</h2>
          <span className="text-xs text-neutral-400">по {fmt(weeklyBudget)} / тиждень</span>
        </div>

        <div className="space-y-3">
          {weeksWithCarry.map((w, idx) => {
            const effective = w.budget + w.carry;
            const remaining = effective - w.spent;
            const isOver = remaining < 0;
            const pct = Math.min(100, (w.spent / effective) * 100);
            const isCurrent = w.week === currentWeek;
            const isPast = w.week < currentWeek;

            return (
              <div key={w.week} className={`bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden transition-all ${
                isCurrent ? "border-orange-200 dark:border-orange-800 shadow-sm shadow-orange-100 dark:shadow-none"
                : isOver ? "border-red-100 dark:border-red-900/30"
                : "border-neutral-100 dark:border-neutral-800"
              }`}>
                {/* Week header */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isCurrent ? "bg-orange-400 text-white" : isPast ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                      }`}>{w.week}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Тиждень {w.week}</p>
                          {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-500 font-medium">Зараз</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-neutral-400">Бюджет {fmt(w.budget)}</p>
                          {w.carry > 0 && (
                            <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                              <Icon d={icons.carry} className="w-3 h-3" />
                              +{fmt(w.carry)} перехід
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

                  {/* Progress bar */}
                  <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-orange-400"
                    }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-neutral-400">Витрачено {fmt(w.spent)}</p>
                    <p className="text-xs text-neutral-400">З {fmt(effective)}</p>
                  </div>
                </div>

                {/* Transactions */}
                {w.transactions.length > 0 && (
                  <div className="border-t border-neutral-50 dark:border-neutral-800/50">
                    {w.transactions.map(tx => (
                      <div key={tx.id} className="group flex items-center gap-3 px-5 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tx.critical ? "bg-red-400" : "bg-neutral-300 dark:bg-neutral-600"}`} />
                        <p className="flex-1 text-xs text-neutral-600 dark:text-neutral-400">{tx.label}</p>
                        {tx.critical && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/20 text-red-500">критична</span>}
                        <p className="text-xs font-medium text-red-400">−{fmt(tx.amount)}</p>
                        <button onClick={() => removeTransaction(idx, tx.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                          <Icon d={icons.trash} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {(isCurrent || isPast) && (
                  <div className="px-5 py-3 border-t border-neutral-50 dark:border-neutral-800/50 flex gap-2">
                    <button onClick={() => { setAddSpendModal({ weekIdx: idx }); setSpendLabel(""); setSpendAmount(""); }}
                      className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-orange-400 transition-colors font-medium">
                      <Icon d={icons.plus} className="w-3.5 h-3.5" />Додати витрату
                    </button>
                    {isOver && (
                      <button onClick={() => { setCriticalModal({ weekIdx: idx }); setCriticalLabel(""); setCriticalAmount(""); }}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 transition-colors font-medium ml-auto">
                        <Icon d={icons.warn} className="w-3.5 h-3.5" />Критична витрата
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add spend modal */}
      {addSpendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm border-t sm:border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Додати витрату · Тиждень {addSpendModal.weekIdx + 1}</h3>
              <button onClick={() => setAddSpendModal(null)}><Icon d={icons.close} className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <input value={spendLabel} onChange={e => setSpendLabel(e.target.value)} placeholder="Назва (кафе, продукти...)"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" autoFocus />
            <input type="number" value={spendAmount} onChange={e => setSpendAmount(e.target.value)} placeholder="Сума"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" />
            <button onClick={() => {
              if (!spendLabel || !spendAmount) return;
              addSpend(addSpendModal.weekIdx, spendLabel, +spendAmount, false);
              setAddSpendModal(null);
            }} className="w-full py-3 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 transition-colors">
              Записати витрату
            </button>
          </div>
        </div>
      )}

      {/* Critical spend modal */}
      {criticalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm border-t sm:border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/20 flex items-center justify-center">
                <Icon d={icons.warn} className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Критична витрата</h3>
                <p className="text-xs text-neutral-400">Конверт вичерпано. Ця витрата буде позначена як критична.</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
              <p className="text-xs text-red-600 dark:text-red-400">⚠️ Не рекомендується позичати з наступного тижня. Використовуй лише у разі крайньої необхідності.</p>
            </div>
            <input value={criticalLabel} onChange={e => setCriticalLabel(e.target.value)} placeholder="Що трапилось? (обґрунтування)"
              className="w-full px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-red-400 transition-all" autoFocus />
            <input type="number" value={criticalAmount} onChange={e => setCriticalAmount(e.target.value)} placeholder="Сума"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" />
            <div className="flex gap-2">
              <button onClick={() => setCriticalModal(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">Скасувати</button>
              <button onClick={() => {
                if (!criticalLabel || !criticalAmount) return;
                addSpend(criticalModal.weekIdx, criticalLabel, +criticalAmount, true);
                setCriticalModal(null);
              }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
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
  const [active, setActive] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("envelopes_active");
    setActive(stored === "true" ? true : false);
  }, []);

  function activate() {
    localStorage.setItem("envelopes_active", "true");
    setActive(true);
  }

  function deactivate() {
    if (!confirm("Деактивувати метод конвертів? Всі інші розділи повернуться до звичайного режиму.")) return;
    localStorage.setItem("envelopes_active", "false");
    setActive(false);
  }

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="pb-8">
      {!active ? <ActivationScreen onActivate={activate} /> : <EnvelopesMain onDeactivate={deactivate} />}
    </div>
  );
}