"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "budget" | "categories";
type CategoryType = "fixed" | "variable" | "bonus";

interface DBCategory {
  id: string; user_id: string; name: string; icon: string;
  type: string; color: string; sort_order: number;
}
interface DBSubcategory {
  id: string; category_id: string; name: string; icon: string; sort_order: number;
}
interface DBMerchant {
  id: string; category_id: string; name: string; has_bonus: boolean;
  bonus_percent: number | null; bonus_label: string | null; is_selected: boolean; is_custom: boolean;
}
interface DBBudget {
  id: string; category_id: string; plan_amount: number; month: number; year: number;
}

interface Category extends DBCategory {
  plan: number; fact: number; prevFact: number;
  subcategories: (DBSubcategory & { plan: number; fact: number; prevFact: number })[];
  merchants: DBMerchant[];
}

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number) { return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн"; }
function pctColor(p: number) { return p >= 100 ? "text-red-500" : p >= 80 ? "text-amber-500" : "text-green-500"; }
function pctBg(p: number)    { return p >= 100 ? "bg-red-400"   : p >= 80 ? "bg-amber-400"   : "bg-green-400"; }
function delta(curr: number, prev: number) {
  if (!prev) return null;
  const d = Math.round((curr - prev) / prev * 100);
  return { val: d, label: `${d >= 0 ? "+" : ""}${d}%` };
}

const MONTHS = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  plus:       "M12 4v16m8-8H4",
  close:      "M6 18L18 6M6 6l12 12",
  edit:       "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:      "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  chevDown:   "M19 9l-7 7-7-7",
  chevRight:  "M9 5l7 7-7 7",
  chevLeft:   "M15 19l-7-7 7-7",
  chevRightN: "M15 19l-7-7 7-7",
  copy:       "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  drag:       "M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01",
  loader:     "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
};

const EMOJIS = ["🛒","☕","⛽","🚗","💊","💡","👔","🏠","🎮","✈️","📚","💪","🐾","🎁","💈","🎨","🍔","🍕","🛍","🏋️","🎭","🎵","🌿","🔧","🏦","📱","💻","🎓","🏥","🍷","🧴","🎯","🚿","🛁","🪴"];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors border border-neutral-200 dark:border-neutral-700">{value}</button>
      {open && (
        <div className="absolute top-12 left-0 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl p-3 w-64">
          <div className="grid grid-cols-7 gap-1">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => { onChange(e); setOpen(false); }}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors ${value === e ? "bg-orange-100 dark:bg-orange-950/30" : ""}`}>{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
      {fmt(value)}<Icon d={icons.edit} className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  );
}

// ─── BUDGET TAB ───────────────────────────────────────────────
function BudgetTab({ categories, onPlanChange, monthIdx, year }: {
  categories: Category[];
  onPlanChange: (catId: string, val: number, month: number, year: number) => void;
  monthIdx: number; year: number;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const totalPlan = categories.reduce((s, c) => s + c.plan, 0);
  const totalFact = categories.reduce((s, c) => s + c.fact, 0);
  const totalPrev = categories.reduce((s, c) => s + c.prevFact, 0);
  const totalPct  = totalPlan > 0 ? Math.round(totalFact / totalPlan * 100) : 0;
  const totalDelta = delta(totalFact, totalPrev);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Загальний план",    value: fmt(totalPlan), color: "text-neutral-900 dark:text-neutral-100" },
          { label: "Витрачено факт",    value: fmt(totalFact), color: totalFact > totalPlan ? "text-red-500" : "text-orange-500" },
          { label: "Попередній місяць", value: fmt(totalPrev), sub: totalDelta?.label, color: "text-neutral-600 dark:text-neutral-400" },
          { label: "Залишок",           value: fmt(Math.abs(totalPlan - totalFact)), color: totalFact > totalPlan ? "text-red-500" : "text-green-500" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            {sub && <p className={`text-xs font-medium mt-0.5 ${sub.startsWith("+") ? "text-red-400" : "text-green-500"}`}>{sub} до пп</p>}
            <p className="text-xs text-neutral-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40">
          {["Категорія","Топ заклад","План","Факт","Попер. міс.","%","Залишок"].map(h => (
            <div key={h} className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</div>
          ))}
        </div>

        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
          {categories.map(cat => {
            const pct      = cat.plan > 0 ? Math.round(cat.fact / cat.plan * 100) : 0;
            const remaining = cat.plan - cat.fact;
            const d        = delta(cat.fact, cat.prevFact);
            const topM     = cat.merchants.filter(m => m.is_selected).find(m => m.has_bonus) || cat.merchants.find(m => m.is_selected);
            const isExpanded = expanded.has(cat.id);

            return (
              <div key={cat.id}>
                <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer group"
                  onClick={() => cat.subcategories.length > 0 && toggle(cat.id)}>

                  <div className="flex items-center gap-2.5 min-w-0">
                    {cat.subcategories.length > 0
                      ? <Icon d={isExpanded ? icons.chevDown : icons.chevRight} className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                      : <div className="w-3.5" />}
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

                  <div className="flex items-center" onClick={e => e.stopPropagation()}>
                    {topM ? (
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${topM.has_bonus ? "bg-green-50 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>
                        {topM.has_bonus && "🎁"} {topM.name}
                      </span>
                    ) : <span className="text-xs text-neutral-300">—</span>}
                  </div>

                  <div onClick={e => e.stopPropagation()}>
                    <PlanCell value={cat.plan} onChange={v => onPlanChange(cat.id, v, monthIdx + 1, year)} />
                  </div>

                  <div className="flex items-center">
                    <span className={`text-sm font-semibold tabular-nums ${cat.fact > cat.plan ? "text-red-500" : "text-neutral-900 dark:text-neutral-100"}`}>{fmt(cat.fact)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-sm text-neutral-500 tabular-nums">{fmt(cat.prevFact)}</span>
                    {d && <span className={`text-xs font-medium ${d.val > 0 ? "text-red-400" : "text-green-500"}`}>{d.label}</span>}
                  </div>

                  <div className="flex items-center">
                    <span className={`text-sm font-bold tabular-nums ${pctColor(pct)}`}>{pct}%</span>
                  </div>

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
                    <div key={sub.id} className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] px-4 py-2.5 bg-neutral-50/50 dark:bg-neutral-800/20 border-t border-neutral-100/50 dark:border-neutral-800/30">
                      <div className="flex items-center gap-2.5 pl-6">
                        <span className="text-sm shrink-0">{sub.icon}</span>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{sub.name}</p>
                      </div>
                      <div />
                      <div className="flex items-center"><span className="text-xs text-neutral-500 tabular-nums">{fmt(sub.plan)}</span></div>
                      <div className="flex items-center"><span className={`text-xs font-medium tabular-nums ${sub.fact > sub.plan ? "text-red-400" : "text-neutral-700 dark:text-neutral-300"}`}>{fmt(sub.fact)}</span></div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-neutral-400 tabular-nums">{fmt(sub.prevFact)}</span>
                        {sd && <span className={`text-xs ${sd.val > 0 ? "text-red-400" : "text-green-500"}`}>{sd.label}</span>}
                      </div>
                      <div className="flex items-center"><span className={`text-xs font-medium ${pctColor(sPct)}`}>{sPct}%</span></div>
                      <div className="flex items-center"><span className={`text-xs tabular-nums ${sRem < 0 ? "text-red-400" : "text-green-500"}`}>{sRem < 0 ? "−" : "+"}{fmt(sRem)}</span></div>
                    </div>
                  );
                })}

                {/* Merchants */}
                {isExpanded && cat.merchants.filter(m => m.is_selected).length > 0 && (
                  <div className="px-14 py-2 bg-blue-50/30 dark:bg-blue-950/10 border-t border-blue-100/50 dark:border-blue-900/20">
                    <p className="text-xs text-neutral-400 mb-1.5">Заклади:</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.merchants.filter(m => m.is_selected).map(m => (
                        <span key={m.id} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${m.has_bonus ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>
                          {m.has_bonus && "🎁 "}{m.name}{m.has_bonus && m.bonus_percent ? ` ${m.bonus_percent}%` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Total row */}
          <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] px-4 py-3.5 bg-neutral-50 dark:bg-neutral-800/40 border-t-2 border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2"><div className="w-3.5" /><p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Всього</p></div>
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
          cat.merchants.filter(m => m.is_selected && m.has_bonus && m.bonus_percent).map(m => ({
            merchant: m.name, category: cat.name, bonusLabel: m.bonus_label || "",
            earned: Math.round(cat.fact * (m.bonus_percent || 0) / 100),
          }))
        ).filter(b => b.earned > 0);
        if (!bonuses.length) return null;
        return (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎁</span>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Бонуси та кешбек</h3>
              <span className="text-xs text-neutral-400">{MONTHS[monthIdx]} {year}</span>
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
const MERCHANT_PRESETS: Record<string, { name: string; has_bonus: boolean; bonus_percent?: number; bonus_label?: string }[]> = {
  food:      [{ name: "АТБ", has_bonus: false }, { name: "Сільпо", has_bonus: true, bonus_percent: 5, bonus_label: "Власний рахунок" }, { name: "Novus", has_bonus: true, bonus_percent: 3, bonus_label: "Бонуси Novus" }, { name: "Metro", has_bonus: false }, { name: "Фора", has_bonus: false }],
  cafe:      [{ name: "McDonald's", has_bonus: true, bonus_percent: 2, bonus_label: "MyMcDonald's" }, { name: "KFC", has_bonus: false }, { name: "Сушія", has_bonus: true, bonus_percent: 5, bonus_label: "Бонуси Сушія" }],
  fuel:      [{ name: "ОККО", has_bonus: true, bonus_percent: 3, bonus_label: "Fishka бали" }, { name: "WOG", has_bonus: true, bonus_percent: 2, bonus_label: "WOG Club" }, { name: "UPG", has_bonus: false }, { name: "Shell", has_bonus: true, bonus_percent: 2, bonus_label: "Shell ClubSmart" }],
  transport: [{ name: "Uber", has_bonus: false }, { name: "Bolt", has_bonus: false }, { name: "Укрзалізниця", has_bonus: false }],
  health:    [{ name: "Аптека Доброго Дня", has_bonus: true, bonus_percent: 3, bonus_label: "Картка лояльності" }, { name: "Подорожник", has_bonus: false }],
  clothing:  [{ name: "Zara", has_bonus: false }, { name: "H&M", has_bonus: false }, { name: "Rozetka", has_bonus: true, bonus_percent: 1, bonus_label: "Rozetka бали" }],
};

const TYPE_LABELS: Record<CategoryType, string> = { fixed: "🔒 Фіксована", variable: "📅 Змінна", bonus: "🎁 Бонусна" };

function CategoriesTab({ categories, onReload }: { categories: Category[]; onReload: () => void }) {
  const supabase = createClient();
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [addSubId, setAddSubId]       = useState<string | null>(null);
  const [newSubName, setNewSubName]   = useState("");
  const [newSubIcon, setNewSubIcon]   = useState("📌");
  const [addMerchantId, setAddMerchantId] = useState<string | null>(null);
  const [customMerchant, setCustomMerchant] = useState("");
  const [addCatOpen, setAddCatOpen]   = useState(false);
  const [newCat, setNewCat]           = useState({ name: "", icon: "📦", type: "variable" as CategoryType });

  async function updateCat(id: string, patch: Partial<DBCategory>) {
    await supabase.from("categories").update(patch).eq("id", id);
    onReload();
  }

  async function deleteCat(id: string) {
    await supabase.from("categories").delete().eq("id", id);
    onReload();
  }

  async function addCategory() {
    if (!newCat.name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: cat } = await supabase.from("categories").insert({ user_id: user.id, name: newCat.name, icon: newCat.icon, type: newCat.type, color: "neutral", sort_order: categories.length }).select().single();
    // Add preset merchants if any
    const presetKey = newCat.name.toLowerCase().includes("продукт") ? "food" : newCat.name.toLowerCase().includes("кафе") ? "cafe" : newCat.name.toLowerCase().includes("пальн") ? "fuel" : null;
    if (cat && presetKey && MERCHANT_PRESETS[presetKey]) {
      await supabase.from("merchants").insert(MERCHANT_PRESETS[presetKey].map(m => ({ user_id: user.id, category_id: cat.id, name: m.name, has_bonus: m.has_bonus, bonus_percent: m.bonus_percent ?? null, bonus_label: m.bonus_label ?? null, is_selected: true, is_custom: false })));
    }
    setNewCat({ name: "", icon: "📦", type: "variable" }); setAddCatOpen(false);
    onReload();
  }

  async function toggleMerchant(mId: string, current: boolean) {
    await supabase.from("merchants").update({ is_selected: !current }).eq("id", mId);
    onReload();
  }

  async function addCustomMerchantFn(catId: string) {
    if (!customMerchant.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("merchants").insert({ user_id: user.id, category_id: catId, name: customMerchant, has_bonus: false, is_selected: true, is_custom: true });
    setCustomMerchant(""); setAddMerchantId(null);
    onReload();
  }

  async function deleteMerchant(mId: string) {
    await supabase.from("merchants").delete().eq("id", mId);
    onReload();
  }

  async function addSubcategory(catId: string) {
    if (!newSubName) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("subcategories").insert({ user_id: user.id, category_id: catId, name: newSubName, icon: newSubIcon, sort_order: 0 });
    setNewSubName(""); setNewSubIcon("📌"); setAddSubId(null);
    onReload();
  }

  async function deleteSub(subId: string) {
    await supabase.from("subcategories").delete().eq("id", subId);
    onReload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Категорії, підкатегорії та заклади</p>
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
                {TYPE_LABELS[t]}
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
                <span className={`text-xs font-medium ${cat.type === "fixed" ? "text-blue-400" : cat.type === "bonus" ? "text-pink-400" : "text-neutral-400"}`}>{TYPE_LABELS[cat.type as CategoryType]}</span>
              </div>
              <select value={cat.type} onChange={e => updateCat(cat.id, { type: e.target.value })}
                className="px-2 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 focus:outline-none">
                {(["fixed", "variable", "bonus"] as CategoryType[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
              <button onClick={() => setEditingId(editingId === cat.id ? null : cat.id)} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
                <Icon d={icons.edit} className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => deleteCat(cat.id)} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
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
                    <button onClick={() => deleteSub(sub.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                      <Icon d={icons.trash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
            {cat.merchants.length > 0 && (
              <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3">
                <p className="text-xs font-medium text-neutral-400 mb-2">🏪 Заклади</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {cat.merchants.map(m => (
                    <button key={m.id} onClick={() => toggleMerchant(m.id, m.is_selected)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${m.is_selected ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-neutral-300"}`}>
                      {m.has_bonus && "🎁 "}{m.name}
                      {m.has_bonus && m.is_selected && <span className="text-green-500 font-normal">{m.bonus_percent}%</span>}
                      {m.is_custom && (
                        <span onClick={e => { e.stopPropagation(); deleteMerchant(m.id); }} className="ml-1 text-neutral-300 hover:text-red-400">×</span>
                      )}
                    </button>
                  ))}
                </div>
                {addMerchantId === cat.id ? (
                  <div className="flex gap-2">
                    <input value={customMerchant} onChange={e => setCustomMerchant(e.target.value)} placeholder="Назва закладу"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300" autoFocus
                      onKeyDown={e => { if (e.key === "Enter") addCustomMerchantFn(cat.id); }} />
                    <button onClick={() => addCustomMerchantFn(cat.id)} className="px-3 py-1.5 rounded-xl bg-orange-400 text-white text-xs font-bold">+</button>
                    <button onClick={() => setAddMerchantId(null)} className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-xs">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAddMerchantId(cat.id)} className="text-xs text-neutral-400 hover:text-orange-400 flex items-center gap-1 transition-colors">
                    <Icon d={icons.plus} className="w-3 h-3" />Додати свій заклад
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function BudgetPage() {
  const supabase = createClient();
  const now = new Date();
  const [tab, setTab]         = useState<Tab>("budget");
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear]       = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const month = monthIdx + 1;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;

    const [{ data: cats }, { data: subs }, { data: merch }, { data: budgets }, { data: budgetsPrev }, { data: txs }, { data: txsPrev }] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("subcategories").select("*").eq("user_id", user.id),
      supabase.from("merchants").select("*").eq("user_id", user.id),
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", month).eq("year", year),
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", prevMonth).eq("year", prevYear),
      supabase.from("transactions").select("amount,category_key").eq("user_id", user.id)
        .gte("transaction_date", `${year}-${String(month).padStart(2,"0")}-01`)
        .lt("transaction_date", month === 12 ? `${year+1}-01-01` : `${year}-${String(month+1).padStart(2,"0")}-01`)
        .eq("type", "expense").is("deleted_at", null),
      supabase.from("transactions").select("amount,category_key").eq("user_id", user.id)
        .gte("transaction_date", `${prevYear}-${String(prevMonth).padStart(2,"0")}-01`)
        .lt("transaction_date", prevMonth === 12 ? `${prevYear+1}-01-01` : `${prevYear}-${String(prevMonth+1).padStart(2,"0")}-01`)
        .eq("type", "expense").is("deleted_at", null),
    ]);

    // Build fact maps from transactions by category_key (we use category name as key for now)
    // For proper linking we'd need category_id on transactions — for now match by name
    const factMap: Record<string, number> = {};
    const prevFactMap: Record<string, number> = {};
    txs?.forEach(t => { const k = t.category_key ?? "other"; factMap[k] = (factMap[k] ?? 0) + Number(t.amount); });
    txsPrev?.forEach(t => { const k = t.category_key ?? "other"; prevFactMap[k] = (prevFactMap[k] ?? 0) + Number(t.amount); });

    const budgetMap: Record<string, number>     = {};
    const budgetPrevMap: Record<string, number> = {};
    budgets?.forEach(b => { budgetMap[b.category_id] = Number(b.plan_amount); });
    budgetsPrev?.forEach(b => { budgetPrevMap[b.category_id] = Number(b.plan_amount); });

    // Category key mapping (approximate — by icon/name pattern)
    const catKeyMap: Record<string, string> = {};
    cats?.forEach(c => {
      if (c.name.toLowerCase().includes("продукт")) catKeyMap[c.id] = "food";
      else if (c.name.toLowerCase().includes("кафе")) catKeyMap[c.id] = "cafe";
      else if (c.name.toLowerCase().includes("пальн")) catKeyMap[c.id] = "fuel";
      else if (c.name.toLowerCase().includes("транспорт")) catKeyMap[c.id] = "transport";
      else if (c.name.toLowerCase().includes("здоров")) catKeyMap[c.id] = "health";
      else if (c.name.toLowerCase().includes("комунальн")) catKeyMap[c.id] = "housing";
      else if (c.name.toLowerCase().includes("одяг")) catKeyMap[c.id] = "clothes";
      else catKeyMap[c.id] = c.name.toLowerCase().replace(/\s+/g, "_");
    });

    setCategories((cats ?? []).map(cat => {
      const ck = catKeyMap[cat.id] ?? cat.id;
      return {
        ...cat,
        plan: budgetMap[cat.id] ?? 0,
        fact: factMap[ck] ?? 0,
        prevFact: prevFactMap[ck] ?? 0,
        subcategories: (subs ?? []).filter(s => s.category_id === cat.id).map(s => ({
          ...s, sort_order: s.sort_order ?? 0, plan: 0, fact: 0, prevFact: 0,
        })),
        merchants: (merch ?? []).filter(m => m.category_id === cat.id),
      };
    }));
    setLoading(false);
  }, [monthIdx, year]);

  useEffect(() => { load(); }, [load]);

  async function handlePlanChange(catId: string, val: number, month: number, yr: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Upsert budget
    const existing = await supabase.from("budgets").select("id").eq("user_id", user.id).eq("category_id", catId).eq("month", month).eq("year", yr).single();
    if (existing.data) {
      await supabase.from("budgets").update({ plan_amount: val }).eq("id", existing.data.id);
    } else {
      await supabase.from("budgets").insert({ user_id: user.id, category_id: catId, month, year: yr, plan_amount: val });
    }
    setCategories(p => p.map(c => c.id === catId ? { ...c, plan: val } : c));
  }

  async function copyPlan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const prevMonth = monthIdx === 0 ? 12 : monthIdx;
    const prevYear  = monthIdx === 0 ? year - 1 : year;
    const { data: prevBudgets } = await supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", prevMonth).eq("year", prevYear);
    if (!prevBudgets?.length) return;
    for (const b of prevBudgets) {
      const month = monthIdx + 1;
      const ex = await supabase.from("budgets").select("id").eq("user_id", user.id).eq("category_id", b.category_id).eq("month", month).eq("year", year).single();
      if (ex.data) await supabase.from("budgets").update({ plan_amount: b.plan_amount }).eq("id", ex.data.id);
      else await supabase.from("budgets").insert({ user_id: user.id, category_id: b.category_id, month, year, plan_amount: b.plan_amount });
    }
    load();
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Бюджет</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Планування та контроль витрат</p>
        </div>
        {/* Month nav */}
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl px-3 py-2">
          <button onClick={() => { if (monthIdx === 0) { setMonthIdx(11); setYear(y => y - 1); } else setMonthIdx(m => m - 1); }}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors text-neutral-400">
            <Icon d={icons.chevLeft} className="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 px-2 min-w-[130px] text-center">{MONTHS[monthIdx]} {year}</p>
          <button onClick={() => { if (monthIdx === 11) { setMonthIdx(0); setYear(y => y + 1); } else setMonthIdx(m => m + 1); }}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors text-neutral-400">
            <Icon d="M9 5l7 7-7 7" className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-neutral-100 dark:bg-neutral-800 mx-1" />
          <button onClick={copyPlan} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-orange-400 transition-colors">
            <Icon d={icons.copy} className="w-3.5 h-3.5" />Копіювати план
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl w-fit">
        {[{ id: "budget" as Tab, label: "📊 Бюджет" }, { id: "categories" as Tab, label: "🗂 Категорії" }].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" /></div>
      ) : (
        <>
          {tab === "budget"     && <BudgetTab categories={categories} onPlanChange={handlePlanChange} monthIdx={monthIdx} year={year} />}
          {tab === "categories" && <CategoriesTab categories={categories} onReload={load} />}
        </>
      )}
    </div>
  );
}