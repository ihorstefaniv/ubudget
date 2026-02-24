"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────
type Tab = "budget" | "categories" | "envelopes";
type CategoryType = "fixed" | "variable" | "bonus";

interface Merchant {
  id: string;
  name: string;
  hasBonus: boolean;
  bonusPercent?: number;
  bonusLabel?: string;
  selected: boolean;
  custom?: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  icon: string;
  plan: number;
  fact: number;
  prevFact: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
  plan: number;
  fact: number;
  prevFact: number;
  color: string;
  merchants: Merchant[];
  subcategories: SubCategory[];
  expanded?: boolean;
}

interface BonusSummary {
  merchant: string;
  category: string;
  amount: number;
  bonusLabel: string;
  earned: number;
}

// ─── Helpers ──────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(n: number) { return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн"; }
function pctColor(p: number) {
  if (p >= 100) return "text-red-500";
  if (p >= 80) return "text-amber-500";
  return "text-green-500";
}
function pctBg(p: number) {
  if (p >= 100) return "bg-red-400";
  if (p >= 80) return "bg-amber-400";
  return "bg-green-400";
}
function delta(curr: number, prev: number) {
  if (!prev) return null;
  const d = ((curr - prev) / prev * 100).toFixed(0);
  return { val: +d, label: `${+d >= 0 ? "+" : ""}${d}%` };
}

// ─── Merchant presets ─────────────────────────────────────────
const MERCHANT_PRESETS: Record<string, Merchant[]> = {
  food: [
    { id: "atb", name: "АТБ", hasBonus: false, selected: true, custom: false },
    { id: "silpo", name: "Сільпо", hasBonus: true, bonusPercent: 5, bonusLabel: "Власний рахунок", selected: true, custom: false },
    { id: "novus", name: "Novus", hasBonus: true, bonusPercent: 3, bonusLabel: "Бонуси Novus", selected: false, custom: false },
    { id: "metro", name: "Metro", hasBonus: false, selected: false, custom: false },
    { id: "auchan", name: "Ашан", hasBonus: false, selected: false, custom: false },
    { id: "fora", name: "Фора", hasBonus: false, selected: false, custom: false },
  ],
  fuel: [
    { id: "okko", name: "ОККО", hasBonus: true, bonusPercent: 3, bonusLabel: "Fishka бали", selected: true, custom: false },
    { id: "wog", name: "WOG", hasBonus: true, bonusPercent: 2, bonusLabel: "WOG Club", selected: true, custom: false },
    { id: "upg", name: "UPG", hasBonus: false, selected: false, custom: false },
    { id: "socar", name: "SOCAR", hasBonus: false, selected: false, custom: false },
    { id: "shell", name: "Shell", hasBonus: true, bonusPercent: 2, bonusLabel: "Shell ClubSmart", selected: false, custom: false },
    { id: "anp", name: "ANP", hasBonus: false, selected: false, custom: false },
  ],
  cafe: [
    { id: "mcdonalds", name: "McDonald's", hasBonus: true, bonusPercent: 2, bonusLabel: "MyMcDonald's", selected: false, custom: false },
    { id: "kfc", name: "KFC", hasBonus: false, selected: false, custom: false },
    { id: "monobufet", name: "Монобуфет", hasBonus: false, selected: false, custom: false },
    { id: "sushiya", name: "Сушія", hasBonus: true, bonusPercent: 5, bonusLabel: "Бонуси Сушія", selected: false, custom: false },
    { id: "celentano", name: "Челентано", hasBonus: false, selected: false, custom: false },
  ],
  pharmacy: [
    { id: "dobroho", name: "Аптека Доброго Дня", hasBonus: true, bonusPercent: 3, bonusLabel: "Картка лояльності", selected: false, custom: false },
    { id: "podorozhnyk", name: "Подорожник", hasBonus: false, selected: true, custom: false },
    { id: "badalex", name: "Бадалекс", hasBonus: false, selected: false, custom: false },
  ],
  transport: [
    { id: "uber", name: "Uber", hasBonus: false, selected: true, custom: false },
    { id: "bolt", name: "Bolt", hasBonus: false, selected: true, custom: false },
    { id: "ukrzaliznytsya", name: "Укрзалізниця", hasBonus: false, selected: false, custom: false },
  ],
  clothing: [
    { id: "zara", name: "Zara", hasBonus: false, selected: false, custom: false },
    { id: "hm", name: "H&M", hasBonus: false, selected: false, custom: false },
    { id: "rozetka", name: "Rozetka", hasBonus: true, bonusPercent: 1, bonusLabel: "Rozetka бали", selected: true, custom: false },
    { id: "prom", name: "Prom.ua", hasBonus: false, selected: false, custom: false },
  ],
};

// ─── Mock Data ────────────────────────────────────────────────
const INIT_CATEGORIES: Category[] = [
  {
    id: "food", name: "Продукти", icon: "🛒", type: "variable", plan: 8000, fact: 6240, prevFact: 7100, color: "green",
    merchants: MERCHANT_PRESETS.food,
    subcategories: [
      { id: "s1", name: "М'ясо та риба", icon: "🥩", plan: 2000, fact: 1840, prevFact: 1900 },
      { id: "s2", name: "Овочі та фрукти", icon: "🥦", plan: 1500, fact: 1200, prevFact: 1400 },
      { id: "s3", name: "Молочні", icon: "🥛", plan: 1000, fact: 880, prevFact: 950 },
      { id: "s4", name: "Бакалія", icon: "🌾", plan: 2000, fact: 1680, prevFact: 1850 },
      { id: "s5", name: "Напої", icon: "🧃", plan: 1500, fact: 640, prevFact: 1000 },
    ],
  },
  {
    id: "cafe", name: "Кафе та ресторани", icon: "☕", type: "variable", plan: 3000, fact: 3450, prevFact: 2800, color: "amber",
    merchants: MERCHANT_PRESETS.cafe,
    subcategories: [
      { id: "c1", name: "Кава", icon: "☕", plan: 800, fact: 950, prevFact: 700 },
      { id: "c2", name: "Обіди", icon: "🍽", plan: 1200, fact: 1500, prevFact: 1100 },
      { id: "c3", name: "Ресторани", icon: "🍷", plan: 1000, fact: 1000, prevFact: 1000 },
    ],
  },
  {
    id: "fuel", name: "Пальне", icon: "⛽", type: "variable", plan: 4000, fact: 2100, prevFact: 3900, color: "blue",
    merchants: MERCHANT_PRESETS.fuel,
    subcategories: [],
  },
  {
    id: "transport", name: "Транспорт", icon: "🚗", type: "variable", plan: 2000, fact: 1200, prevFact: 1500, color: "purple",
    merchants: MERCHANT_PRESETS.transport,
    subcategories: [
      { id: "t1", name: "Таксі", icon: "🚕", plan: 800, fact: 600, prevFact: 700 },
      { id: "t2", name: "Паркування", icon: "🅿️", plan: 400, fact: 380, prevFact: 400 },
      { id: "t3", name: "Потяг/Автобус", icon: "🚌", plan: 800, fact: 220, prevFact: 400 },
    ],
  },
  {
    id: "health", name: "Здоров'я", icon: "💊", type: "variable", plan: 2000, fact: 890, prevFact: 1200, color: "red",
    merchants: MERCHANT_PRESETS.pharmacy,
    subcategories: [
      { id: "h1", name: "Аптека", icon: "💊", plan: 800, fact: 450, prevFact: 600 },
      { id: "h2", name: "Лікарі", icon: "👨‍⚕️", plan: 1200, fact: 440, prevFact: 600 },
    ],
  },
  {
    id: "utilities", name: "Комунальні", icon: "💡", type: "fixed", plan: 3500, fact: 2800, prevFact: 3100, color: "yellow",
    merchants: [],
    subcategories: [
      { id: "u1", name: "Електрика", icon: "⚡", plan: 800, fact: 650, prevFact: 700 },
      { id: "u2", name: "Газ", icon: "🔥", plan: 1200, fact: 980, prevFact: 1100 },
      { id: "u3", name: "Вода", icon: "💧", plan: 400, fact: 320, prevFact: 380 },
      { id: "u4", name: "Інтернет + TV", icon: "📡", plan: 600, fact: 450, prevFact: 500 },
      { id: "u5", name: "Мобільний", icon: "📱", plan: 500, fact: 400, prevFact: 420 },
    ],
  },
  {
    id: "clothing", name: "Одяг та взуття", icon: "👔", type: "variable", plan: 3000, fact: 1800, prevFact: 2200, color: "pink",
    merchants: MERCHANT_PRESETS.clothing,
    subcategories: [],
  },
  {
    id: "mortgage", name: "Іпотека", icon: "🏠", type: "fixed", plan: 18500, fact: 18500, prevFact: 18500, color: "orange",
    merchants: [],
    subcategories: [],
  },
];

const MONTHS = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];

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
  chevDown: "M19 9l-7 7-7-7",
  chevRight: "M9 5l7 7-7 7",
  chevLeft: "M15 19l-7-7 7-7",
  copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  gift: "M12 8v13m0-13V6a4 4 0 00-4-4H5.45a2.55 2.55 0 000 5.1H12m0-5.1V6a4 4 0 014-4h2.55a2.55 2.55 0 010 5.1H12M3 13h18M5 13v7a2 2 0 002 2h10a2 2 0 002-2v-7",
  drag: "M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01",
};

// ─── Emoji Picker ─────────────────────────────────────────────
const EMOJIS = ["🛒","☕","⛽","🚗","💊","💡","👔","🏠","🎮","✈️","📚","💪","🐾","🎁","💈","🎨","🍔","🍕","🛍","🏋️","🎭","🎵","🌿","🔧","🏦","📱","💻","🎓","🏥","🍷","🧴","🎯","🚿","🛁","🪴"];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors border border-neutral-200 dark:border-neutral-700">
        {value}
      </button>
      {open && (
        <div className="absolute top-12 left-0 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl p-3 w-64">
          <div className="grid grid-cols-7 gap-1">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => { onChange(e); setOpen(false); }}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors ${value === e ? "bg-orange-100 dark:bg-orange-950/30" : ""}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline Edit Plan ─────────────────────────────────────────
function PlanCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value.toString());
  const ref = useRef<HTMLInputElement>(null);

  if (editing) return (
    <input ref={ref} autoFocus value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onChange(+val || value); setEditing(false); }}
      onKeyDown={e => { if (e.key === "Enter") { onChange(+val || value); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
      className="w-24 px-2 py-1 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-sm text-right font-medium focus:outline-none text-neutral-900 dark:text-neutral-100" />
  );

  return (
    <button onClick={() => { setVal(value.toString()); setEditing(true); }}
      className="text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-orange-500 transition-colors tabular-nums group flex items-center gap-1">
      {fmt(value)}
      <Icon d={icons.edit} className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  );
}

// ─── BUDGET TAB ───────────────────────────────────────────────
function BudgetTab({ categories, setCategories, monthIdx, envelopesActive }: {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  monthIdx: number;
  envelopesActive: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const totalPlan = categories.reduce((s, c) => s + c.plan, 0);
  const totalFact = categories.reduce((s, c) => s + c.fact, 0);
  const totalPrev = categories.reduce((s, c) => s + c.prevFact, 0);
  const totalPct = totalPlan > 0 ? Math.round(totalFact / totalPlan * 100) : 0;
  const totalDelta = delta(totalFact, totalPrev);

  function updatePlan(id: string, val: number) {
    setCategories(p => p.map(c => c.id === id ? { ...c, plan: val } : c));
  }

  // Top merchant by fact
  function topMerchant(cat: Category) {
    const sel = cat.merchants.filter(m => m.selected);
    if (!sel.length) return null;
    // Mock: just pick first selected with bonus if exists
    const bonus = sel.find(m => m.hasBonus);
    return bonus || sel[0];
  }

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Загальний план", value: fmt(totalPlan), color: "text-neutral-900 dark:text-neutral-100" },
          { label: "Витрачено факт", value: fmt(totalFact), color: totalFact > totalPlan ? "text-red-500" : "text-orange-500" },
          { label: "Попередній місяць", value: fmt(totalPrev), sub: totalDelta ? totalDelta.label : undefined, color: "text-neutral-600 dark:text-neutral-400" },
          { label: "Залишок", value: fmt(Math.abs(totalPlan - totalFact)), color: totalFact > totalPlan ? "text-red-500" : "text-green-500" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            {sub && <p className={`text-xs font-medium mt-0.5 ${sub.startsWith("+") ? "text-red-400" : "text-green-500"}`}>{sub} до пп</p>}
            <p className="text-xs text-neutral-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Main table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-0 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40">
          {["Категорія", "Топ заклад", "План", "Факт", "Попер. міс.", "%", "Залишок"].map(h => (
            <div key={h} className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {categories.map(cat => {
            const pct = cat.plan > 0 ? Math.round(cat.fact / cat.plan * 100) : 0;
            const remaining = cat.plan - cat.fact;
            const d = delta(cat.fact, cat.prevFact);
            const merchant = topMerchant(cat);
            const isExpanded = expanded.has(cat.id);

            return (
              <div key={cat.id}>
                {/* Main row */}
                <div className={`grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-0 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer group`}
                  onClick={() => cat.subcategories.length > 0 && toggle(cat.id)}>

                  {/* Category */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {cat.subcategories.length > 0 ? (
                      <Icon d={isExpanded ? icons.chevDown : icons.chevRight} className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                    ) : <div className="w-3.5" />}
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{cat.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-1.5 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                          <div className={`h-full rounded-full ${pctBg(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${cat.type === "fixed" ? "text-blue-400" : cat.type === "bonus" ? "text-pink-400" : "text-neutral-400"}`}>
                          {cat.type === "fixed" ? "🔒 фікс." : cat.type === "bonus" ? "🎁 бонус" : "📅 змінна"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top merchant */}
                  <div className="flex items-center" onClick={e => e.stopPropagation()}>
                    {merchant ? (
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${merchant.hasBonus ? "bg-green-50 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>
                        {merchant.hasBonus && "🎁"} {merchant.name}
                      </span>
                    ) : <span className="text-xs text-neutral-300">—</span>}
                  </div>

                  {/* Plan — inline editable */}
                  <div onClick={e => e.stopPropagation()}>
                    <PlanCell value={cat.plan} onChange={v => updatePlan(cat.id, v)} />
                  </div>

                  {/* Fact */}
                  <div className="flex items-center">
                    <span className={`text-sm font-semibold tabular-nums ${cat.fact > cat.plan ? "text-red-500" : "text-neutral-900 dark:text-neutral-100"}`}>
                      {fmt(cat.fact)}
                    </span>
                  </div>

                  {/* Prev month */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-neutral-500 tabular-nums">{fmt(cat.prevFact)}</span>
                    {d && (
                      <span className={`text-xs font-medium ${d.val > 0 ? "text-red-400" : "text-green-500"}`}>{d.label}</span>
                    )}
                  </div>

                  {/* % */}
                  <div className="flex items-center">
                    <span className={`text-sm font-bold tabular-nums ${pctColor(pct)}`}>{pct}%</span>
                  </div>

                  {/* Remaining */}
                  <div className="flex items-center">
                    <span className={`text-sm font-medium tabular-nums ${remaining < 0 ? "text-red-500" : "text-green-500"}`}>
                      {remaining < 0 ? "−" : "+"}{fmt(remaining)}
                    </span>
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && cat.subcategories.map(sub => {
                  const sPct = sub.plan > 0 ? Math.round(sub.fact / sub.plan * 100) : 0;
                  const sRem = sub.plan - sub.fact;
                  const sd = delta(sub.fact, sub.prevFact);
                  return (
                    <div key={sub.id} className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-0 px-4 py-2.5 bg-neutral-50/50 dark:bg-neutral-800/20 border-t border-neutral-100/50 dark:border-neutral-800/30">
                      <div className="flex items-center gap-2.5 pl-6">
                        <span className="text-sm shrink-0">{sub.icon}</span>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{sub.name}</p>
                      </div>
                      <div />
                      <div className="flex items-center">
                        <span className="text-xs text-neutral-500 tabular-nums">{fmt(sub.plan)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs font-medium tabular-nums ${sub.fact > sub.plan ? "text-red-400" : "text-neutral-700 dark:text-neutral-300"}`}>{fmt(sub.fact)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-neutral-400 tabular-nums">{fmt(sub.prevFact)}</span>
                        {sd && <span className={`text-xs ${sd.val > 0 ? "text-red-400" : "text-green-500"}`}>{sd.label}</span>}
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs font-medium ${pctColor(sPct)}`}>{sPct}%</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs tabular-nums ${sRem < 0 ? "text-red-400" : "text-green-500"}`}>{sRem < 0 ? "−" : "+"}{fmt(sRem)}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Merchants breakdown (when expanded) */}
                {isExpanded && cat.merchants.filter(m => m.selected).length > 0 && (
                  <div className="px-14 py-2 bg-blue-50/30 dark:bg-blue-950/10 border-t border-blue-100/50 dark:border-blue-900/20">
                    <p className="text-xs text-neutral-400 mb-1.5">Заклади:</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.merchants.filter(m => m.selected).map(m => (
                        <span key={m.id} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${m.hasBonus ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>
                          {m.hasBonus && "🎁 "}{m.name}{m.hasBonus ? ` ${m.bonusPercent}%` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Total row */}
          <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-0 px-4 py-3.5 bg-neutral-50 dark:bg-neutral-800/40 border-t-2 border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <div className="w-3.5" />
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Всього</p>
            </div>
            <div />
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{fmt(totalPlan)}</p>
            <p className={`text-sm font-bold tabular-nums ${totalFact > totalPlan ? "text-red-500" : "text-orange-500"}`}>{fmt(totalFact)}</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-neutral-500 tabular-nums">{fmt(totalPrev)}</p>
              {totalDelta && <span className={`text-xs font-medium ${totalDelta.val > 0 ? "text-red-400" : "text-green-500"}`}>{totalDelta.label}</span>}
            </div>
            <p className={`text-sm font-bold tabular-nums ${pctColor(totalPct)}`}>{totalPct}%</p>
            <p className={`text-sm font-bold tabular-nums ${totalFact > totalPlan ? "text-red-500" : "text-green-500"}`}>
              {totalFact > totalPlan ? "−" : "+"}{fmt(Math.abs(totalPlan - totalFact))}
            </p>
          </div>
        </div>
      </div>

      {/* Bonus summary */}
      {(() => {
        const bonuses = categories.flatMap(cat =>
          cat.merchants.filter(m => m.selected && m.hasBonus).map(m => ({
            merchant: m.name, category: cat.name,
            amount: cat.fact, bonusLabel: m.bonusLabel || "",
            earned: Math.round(cat.fact * (m.bonusPercent || 0) / 100),
          }))
        ).filter(b => b.earned > 0);

        if (!bonuses.length) return null;

        return (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎁</span>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Бонуси та кешбек</h3>
              <span className="text-xs text-neutral-400">{MONTHS[monthIdx]} 2026</span>
            </div>
            <div className="space-y-2">
              {bonuses.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{b.merchant}</p>
                    <p className="text-xs text-neutral-400">{b.category} · {b.bonusLabel}</p>
                  </div>
                  <p className="text-sm font-bold text-green-500">+{b.earned} грн</p>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
                <span className="text-sm text-neutral-500">Загалом зекономлено</span>
                <span className="text-sm font-bold text-green-500">+{fmt(bonuses.reduce((s, b) => s + b.earned, 0))}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── CATEGORIES TAB ───────────────────────────────────────────
function CategoriesTab({ categories, setCategories }: { categories: Category[]; setCategories: React.Dispatch<React.SetStateAction<Category[]>> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addSubId, setAddSubId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubIcon, setNewSubIcon] = useState("📌");
  const [customMerchant, setCustomMerchant] = useState("");
  const [addMerchantId, setAddMerchantId] = useState<string | null>(null);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "📦", type: "variable" as CategoryType });

  const editing = categories.find(c => c.id === editingId);

  function updateCat(id: string, patch: Partial<Category>) {
    setCategories(p => p.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function toggleMerchant(catId: string, mId: string) {
    setCategories(p => p.map(c => c.id === catId ? {
      ...c, merchants: c.merchants.map(m => m.id === mId ? { ...m, selected: !m.selected } : m)
    } : c));
  }

  function addCustomMerchant(catId: string) {
    if (!customMerchant.trim()) return;
    setCategories(p => p.map(c => c.id === catId ? {
      ...c, merchants: [...c.merchants, { id: uid(), name: customMerchant, hasBonus: false, selected: true, custom: true }]
    } : c));
    setCustomMerchant("");
  }

  function addSubcategory(catId: string) {
    if (!newSubName) return;
    setCategories(p => p.map(c => c.id === catId ? {
      ...c, subcategories: [...c.subcategories, { id: uid(), name: newSubName, icon: newSubIcon, plan: 0, fact: 0, prevFact: 0 }]
    } : c));
    setNewSubName(""); setNewSubIcon("📌"); setAddSubId(null);
  }

  function removeSub(catId: string, subId: string) {
    setCategories(p => p.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c));
  }

  function addCategory() {
    if (!newCat.name) return;
    setCategories(p => [...p, { id: uid(), name: newCat.name, icon: newCat.icon, type: newCat.type, plan: 0, fact: 0, prevFact: 0, color: "neutral", merchants: [], subcategories: [] }]);
    setNewCat({ name: "", icon: "📦", type: "variable" }); setAddCatOpen(false);
  }

  const typeLabels: Record<CategoryType, string> = { fixed: "🔒 Фіксована", variable: "📅 Змінна", bonus: "🎁 Бонусна" };
  const typeDesc: Record<CategoryType, string> = { fixed: "Завжди списується першою (іпотека, кредити)", variable: "Іде в тижневий конверт", bonus: "Кешбек та програми лояльності" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Налаштуй категорії, підкатегорії та заклади</p>
        <button onClick={() => setAddCatOpen(v => !v)} className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
          <Icon d={icons.plus} className="w-4 h-4" />Категорія
        </button>
      </div>

      {addCatOpen && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Нова категорія</p>
          <div className="flex gap-3 items-start">
            <EmojiPicker value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e }))} />
            <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} placeholder="Назва категорії"
              className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["fixed", "variable", "bonus"] as CategoryType[]).map(t => (
              <button key={t} onClick={() => setNewCat(p => ({ ...p, type: t }))}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-left ${newCat.type === t ? "border-orange-300 bg-orange-100 dark:bg-orange-950/30 text-orange-600" : "border-neutral-200 dark:border-neutral-700 text-neutral-500"}`}>
                <p>{typeLabels[t]}</p>
                <p className="text-neutral-400 font-normal mt-0.5">{typeDesc[t]}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddCatOpen(false)} className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">Скасувати</button>
            <button onClick={addCategory} className="flex-1 py-2 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500">Додати</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Icon d={icons.drag} className="w-4 h-4 text-neutral-300 cursor-grab shrink-0" />
              <EmojiPicker value={cat.icon} onChange={e => updateCat(cat.id, { icon: e })} />
              <div className="flex-1 min-w-0">
                {editingId === cat.id ? (
                  <input value={cat.name} onChange={e => updateCat(cat.id, { name: e.target.value })}
                    className="w-full px-2 py-1 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-sm font-semibold focus:outline-none text-neutral-900 dark:text-neutral-100" autoFocus
                    onBlur={() => setEditingId(null)} onKeyDown={e => e.key === "Enter" && setEditingId(null)} />
                ) : (
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{cat.name}</p>
                )}
                <span className={`text-xs font-medium ${cat.type === "fixed" ? "text-blue-400" : cat.type === "bonus" ? "text-pink-400" : "text-neutral-400"}`}>{typeLabels[cat.type]}</span>
              </div>
              {/* Type selector */}
              <select value={cat.type} onChange={e => updateCat(cat.id, { type: e.target.value as CategoryType })}
                className="px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 focus:outline-none">
                {(["fixed", "variable", "bonus"] as CategoryType[]).map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
              </select>
              <button onClick={() => setEditingId(editingId === cat.id ? null : cat.id)}
                className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
                <Icon d={icons.edit} className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setCategories(p => p.filter(c => c.id !== cat.id))}
                className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
                <Icon d={icons.trash} className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subcategories */}
            {cat.subcategories.length > 0 && (
              <div className="border-t border-neutral-50 dark:border-neutral-800/50 px-4 py-2 space-y-1.5">
                <p className="text-xs font-medium text-neutral-400 mb-2">Підкатегорії</p>
                {cat.subcategories.map(sub => (
                  <div key={sub.id} className="group flex items-center gap-2">
                    <span className="text-sm">{sub.icon}</span>
                    <p className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{sub.name}</p>
                    <button onClick={() => removeSub(cat.id, sub.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                      <Icon d={icons.trash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add subcategory */}
            {addSubId === cat.id ? (
              <div className="border-t border-neutral-50 dark:border-neutral-800/50 px-4 py-3 flex gap-2 items-center">
                <EmojiPicker value={newSubIcon} onChange={setNewSubIcon} />
                <input value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="Назва підкатегорії"
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300" autoFocus />
                <button onClick={() => addSubcategory(cat.id)} className="px-3 py-2 rounded-xl bg-orange-400 text-white text-xs font-bold hover:bg-orange-500">Додати</button>
                <button onClick={() => setAddSubId(null)} className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-xs">✕</button>
              </div>
            ) : (
              <button onClick={() => setAddSubId(cat.id)} className="w-full px-4 py-2 text-xs text-neutral-400 hover:text-orange-400 border-t border-neutral-50 dark:border-neutral-800/50 text-left flex items-center gap-1.5 transition-colors">
                <Icon d={icons.plus} className="w-3 h-3" />Додати підкатегорію
              </button>
            )}

            {/* Merchants */}
            {(() => {
              const presetKey = cat.id;
              const hasMerchants = cat.merchants.length > 0;
              if (!hasMerchants && !MERCHANT_PRESETS[presetKey]) return null;

              return (
                <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3">
                  <p className="text-xs font-medium text-neutral-400 mb-2">🏪 Заклади</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {cat.merchants.map(m => (
                      <button key={m.id} onClick={() => toggleMerchant(cat.id, m.id)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${m.selected ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-neutral-300"}`}>
                        {m.hasBonus && "🎁 "}{m.name}
                        {m.hasBonus && m.selected && <span className="text-green-500 font-normal">{m.bonusPercent}%</span>}
                        {m.custom && <span onClick={e => { e.stopPropagation(); setCategories(p => p.map(c => c.id === cat.id ? { ...c, merchants: c.merchants.filter(x => x.id !== m.id) } : c)); }} className="ml-1 text-neutral-300 hover:text-red-400">×</span>}
                      </button>
                    ))}
                  </div>
                  {addMerchantId === cat.id ? (
                    <div className="flex gap-2">
                      <input value={customMerchant} onChange={e => setCustomMerchant(e.target.value)} placeholder="Назва закладу"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300" autoFocus
                        onKeyDown={e => { if (e.key === "Enter") { addCustomMerchant(cat.id); setAddMerchantId(null); } }} />
                      <button onClick={() => { addCustomMerchant(cat.id); setAddMerchantId(null); }} className="px-3 py-1.5 rounded-xl bg-orange-400 text-white text-xs font-bold">+</button>
                      <button onClick={() => setAddMerchantId(null)} className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-xs">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddMerchantId(cat.id)} className="text-xs text-neutral-400 hover:text-orange-400 flex items-center gap-1 transition-colors">
                      <Icon d={icons.plus} className="w-3 h-3" />Додати свій заклад
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ENVELOPES TAB ────────────────────────────────────────────
function EnvelopesTab({ categories, setCategories }: { categories: Category[]; setCategories: React.Dispatch<React.SetStateAction<Category[]>> }) {
  const fixed = categories.filter(c => c.type === "fixed");
  const variable = categories.filter(c => c.type === "variable");

  const totalFixed = fixed.reduce((s, c) => s + c.plan, 0);
  const totalVariable = variable.reduce((s, c) => s + c.plan, 0);
  const totalIncome = 61500; // mock
  const available = totalIncome - totalFixed;
  const weeks = 4;
  const weeklyBudget = Math.floor(available / weeks);

  function moveToFixed(id: string) { setCategories(p => p.map(c => c.id === id ? { ...c, type: "fixed" } : c)); }
  function moveToVariable(id: string) { setCategories(p => p.map(c => c.id === id ? { ...c, type: "variable" } : c)); }

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">✉️ Метод конвертів активний</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Тут ти визначаєш які категорії є обов'язковими (фіксованими), а які йдуть в тижневі конверти. Перетягни або натисни стрілку щоб перемістити.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Дохід місяця", value: fmt(totalIncome), color: "text-green-500" },
          { label: "Фіксовані витрати", value: fmt(totalFixed), color: "text-red-400" },
          { label: "Тижневий конверт", value: fmt(weeklyBudget), color: "text-orange-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fixed */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/10">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Фіксовані</p>
            </div>
            <p className="text-sm font-bold text-red-400">{fmt(totalFixed)}</p>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {fixed.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                <span className="text-base">{cat.icon}</span>
                <p className="flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">{cat.name}</p>
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 tabular-nums">{fmt(cat.plan)}</p>
                <button onClick={() => moveToVariable(cat.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/20 text-orange-500 font-medium transition-all">
                  → Змінна
                </button>
              </div>
            ))}
            {fixed.length === 0 && <p className="text-center py-6 text-sm text-neutral-300">Немає фіксованих витрат</p>}
          </div>
        </div>

        {/* Variable / envelope */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-orange-50/50 dark:bg-orange-950/10">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">В конверт</p>
            </div>
            <p className="text-sm font-bold text-orange-500">{fmt(totalVariable)}</p>
          </div>
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
            {variable.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                <span className="text-base">{cat.icon}</span>
                <p className="flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">{cat.name}</p>
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 tabular-nums">{fmt(cat.plan)}</p>
                <button onClick={() => moveToFixed(cat.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/20 text-blue-500 font-medium transition-all">
                  → Фіксована
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly breakdown */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Розподіл по тижнях</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: weeks }, (_, i) => {
            const carry = i === 1 ? 1300 : 0;
            const spent = i === 0 ? 7200 : i === 1 ? 6800 : 0;
            const effective = weeklyBudget + carry;
            const rem = effective - spent;
            return (
              <div key={i} className={`p-3 rounded-xl border ${i === 1 ? "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10" : "border-neutral-100 dark:border-neutral-800"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-neutral-500">Тиждень {i + 1}</p>
                  {i === 1 && <span className="text-xs text-orange-400">Зараз</span>}
                </div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{fmt(weeklyBudget)}</p>
                {carry > 0 && <p className="text-xs text-green-500">+{fmt(carry)} перехід</p>}
                {spent > 0 && <p className="text-xs text-red-400 mt-1">−{fmt(spent)} витрачено</p>}
                {(rem !== 0 && i <= 1) && <p className={`text-xs font-semibold mt-1 ${rem >= 0 ? "text-green-500" : "text-red-500"}`}>{rem >= 0 ? "+" : ""}{fmt(rem)}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function BudgetPage() {
  const [tab, setTab] = useState<Tab>("budget");
  const [categories, setCategories] = useState<Category[]>(INIT_CATEGORIES);
  const [monthIdx, setMonthIdx] = useState(1); // Лютий
  const [envelopesActive] = useState(true); // mock — буде з Supabase/context

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Бюджет</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Планування та контроль витрат по категоріях</p>
        </div>
        {/* Month nav */}
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl px-3 py-2">
          <button onClick={() => setMonthIdx(p => Math.max(0, p - 1))}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors text-neutral-400">
            <Icon d={icons.chevLeft} className="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 px-2 min-w-[120px] text-center">
            {MONTHS[monthIdx]} 2026
          </p>
          <button onClick={() => setMonthIdx(p => Math.min(11, p + 1))}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors text-neutral-400">
            <Icon d={icons.chevRight.replace("9 5l7 7-7 7", "15 19l-7-7 7-7")} className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-neutral-100 dark:bg-neutral-800 mx-1" />
          <button className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-orange-400 transition-colors">
            <Icon d={icons.copy} className="w-3.5 h-3.5" />Копіювати план
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl w-fit">
        {[
          { id: "budget" as Tab, label: "📊 Бюджет" },
          { id: "categories" as Tab, label: "🗂 Категорії" },
          { id: "envelopes" as Tab, label: "✉️ Конверти", show: envelopesActive },
        ].filter(t => t.show !== false).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "budget" && <BudgetTab categories={categories} setCategories={setCategories} monthIdx={monthIdx} envelopesActive={envelopesActive} />}
      {tab === "categories" && <CategoriesTab categories={categories} setCategories={setCategories} />}
      {tab === "envelopes" && <EnvelopesTab categories={categories} setCategories={setCategories} />}
    </div>
  );
}