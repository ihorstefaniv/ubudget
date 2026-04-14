"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Card } from "@/components/ui";
import {
  CATEGORY_REGISTRY, INCOME_CATEGORIES, EXPENSE_CATEGORIES,
  TX_CATEGORIES, getCategoryDef,
  type CategoryDef,
} from "@/lib/category-registry";

type Tab = "budget" | "categories";
type CategoryType = "fixed" | "variable" | "bonus" | "income";

// ─── DB Interfaces ────────────────────────────────────────────
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
// Category — тільки для CategoriesTab (CRUD-менеджмент заkladів/підкатегорій)
interface Category extends DBCategory {
  subcategories: (DBSubcategory & { sort_order: number })[];
  merchants: DBMerchant[];
}
interface Obligation { name: string; monthly_payment: number; type: string; }

// ─── Helpers ──────────────────────────────────────────────────
const REGISTRY_KEY_SET = new Set(CATEGORY_REGISTRY.map(c => c.id));

function fmt(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн";
}
function pctColor(p: number) { return p >= 100 ? "text-red-500" : p >= 80 ? "text-amber-500" : "text-green-500"; }
function pctBg(p: number)    { return p >= 100 ? "bg-red-400"   : p >= 80 ? "bg-amber-400"   : "bg-green-400"; }
function delta(curr: number, prev: number) {
  if (!prev) return null;
  const d = Math.round((curr - prev) / prev * 100);
  return { val: d, label: `${d >= 0 ? "+" : ""}${d}%` };
}
const MONTHS = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

const extraIcons = {
  chevDown:  "M19 9l-7 7-7-7",
  chevRight: "M9 5l7 7-7 7",
  chevLeft:  "M15 19l-7-7 7-7",
  copy:      "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  drag:      "M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01",
};
const EMOJIS = ["🛒","☕","⛽","🚗","💊","💡","👔","🏠","🎮","✈️","📚","💪","🐾","🎁","💈","🎨","🍔","🍕","🛍","🏋️","🎭","🎵","🌿","🔧","🏦","📱","💻","🎓","🏥","🍷","🧴","🎯","🚿","🛁","🪴"];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors border border-neutral-200 dark:border-neutral-700">
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

function PlanCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value.toString());
  const ref = useRef<HTMLInputElement>(null);
  if (editing) return (
    <input ref={ref} autoFocus value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onChange(+val || value); setEditing(false); }}
      onKeyDown={e => {
        if (e.key === "Enter") { onChange(+val || value); setEditing(false); }
        if (e.key === "Escape") setEditing(false);
      }}
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
// Рядки будуються з CATEGORY_REGISTRY (не з БД-категорій).
// factMap / planMap — ключ = category_key з транзакцій/бюджетів.
type BudgetRowData = CategoryDef & {
  fact: number; prevFact: number; plan: number;
  merchants: DBMerchant[];
};

function BudgetTab({ factMap, prevFactMap, planMap, merchantMap, onPlanChange,
  monthIdx, year, totalIncome, prevIncome, obligations,
}: {
  factMap: Record<string, number>;
  prevFactMap: Record<string, number>;
  planMap: Record<string, number>;
  merchantMap: Record<string, DBMerchant[]>;
  onPlanChange: (key: string, val: number) => void;
  monthIdx: number; year: number;
  totalIncome: number; prevIncome: number;
  obligations: Obligation[];
}) {
  const [showAllExpense, setShowAllExpense] = useState(false);
  const [expandedMerchants, setExpandedMerchants] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => setExpandedMerchants(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  // ── Income rows (тільки де є факт або план) ────────────────
  const incRows: BudgetRowData[] = INCOME_CATEGORIES.map(c => ({
    ...c,
    fact:      factMap[c.id]     ?? 0,
    prevFact:  prevFactMap[c.id] ?? 0,
    plan:      planMap[c.id]     ?? 0,
    merchants: merchantMap[c.id] ?? [],
  })).filter(r => r.fact > 0 || r.plan > 0);

  // ── Expense rows (всі + "Без категорії" якщо є) ──────────────
  const allExpRows: BudgetRowData[] = [
    ...EXPENSE_CATEGORIES.map(c => ({
      ...c,
      fact:      factMap[c.id]     ?? 0,
      prevFact:  prevFactMap[c.id] ?? 0,
      plan:      planMap[c.id]     ?? 0,
      merchants: merchantMap[c.id] ?? [],
    })),
    ...((factMap["uncategorized"] ?? 0) > 0 ? [{
      ...getCategoryDef("uncategorized"),
      fact:      factMap["uncategorized"],
      prevFact:  prevFactMap["uncategorized"] ?? 0,
      plan:      planMap["uncategorized"]     ?? 0,
      merchants: [] as DBMerchant[],
    }] : []),
  ];

  const activeExpRows = allExpRows.filter(r => r.fact > 0 || r.plan > 0);
  const expRows       = showAllExpense ? allExpRows : activeExpRows;
  const hiddenCount   = allExpRows.length - activeExpRows.length;

  const totalExpFact  = activeExpRows.reduce((s, r) => s + r.fact, 0);
  const totalExpPlan  = activeExpRows.reduce((s, r) => s + r.plan, 0);
  const totalExpPrev  = activeExpRows.reduce((s, r) => s + r.prevFact, 0);
  const totalExpPct   = totalExpPlan > 0 ? Math.round(totalExpFact / totalExpPlan * 100) : 0;
  const totalExpDelta = delta(totalExpFact, totalExpPrev);

  const obligationsTotal = obligations.reduce((s, o) => s + Number(o.monthly_payment), 0);
  const balance  = totalIncome - totalExpFact - obligationsTotal;
  const incDelta = delta(totalIncome, prevIncome);

  // ── Уніфікований рендер рядка (доходи + витрати) ─────────────
  const cols = "grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr]";

  const renderRow = (r: BudgetRowData, isIncome = false) => {
    const pct       = r.plan > 0 ? Math.round(r.fact / r.plan * 100) : 0;
    const remaining = isIncome ? r.fact - r.plan : r.plan - r.fact;
    const d         = delta(r.fact, r.prevFact);
    // Топ заклад — тільки якщо є реальні транзакції
    const topM      = r.fact > 0
      ? (r.merchants.filter(m => m.is_selected).find(m => m.has_bonus) || r.merchants.find(m => m.is_selected))
      : null;
    const hasSelectedMerchants = r.fact > 0 && r.merchants.filter(m => m.is_selected).length > 0;
    const isExp = expandedMerchants.has(r.id);

    return (
      <div key={r.id}>
        <div className={`${cols} px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer group`}
          onClick={() => hasSelectedMerchants && toggleExpand(r.id)}>

          <div className="flex items-center gap-2.5 min-w-0">
            {hasSelectedMerchants
              ? <Icon d={isExp ? extraIcons.chevDown : extraIcons.chevRight} className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              : <div className="w-3.5" />}
            <span className="text-base shrink-0">{r.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{r.label}</p>
              {!isIncome && r.plan > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-16 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className={`h-full rounded-full ${pctBg(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              )}
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
            <PlanCell value={r.plan} onChange={v => onPlanChange(r.id, v)} />
          </div>

          <div className="flex items-center">
            <span className={`text-sm font-semibold tabular-nums ${
              isIncome ? "text-green-500" : (r.fact > r.plan && r.plan > 0 ? "text-red-500" : "text-neutral-900 dark:text-neutral-100")
            }`}>
              {isIncome && r.fact > 0 ? "+" : ""}{fmt(r.fact)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm text-neutral-500 tabular-nums">{fmt(r.prevFact)}</span>
            {d && <span className={`text-xs font-medium ${
              isIncome ? (d.val >= 0 ? "text-green-500" : "text-red-400") : (d.val > 0 ? "text-red-400" : "text-green-500")
            }`}>{d.label}</span>}
          </div>

          <div className="flex items-center">
            <span className={`text-sm font-bold tabular-nums ${
              isIncome ? (pct >= 100 ? "text-green-500" : "text-amber-500") : pctColor(pct)
            }`}>{pct}%</span>
          </div>

          <div className="flex items-center">
            <span className={`text-sm font-medium tabular-nums ${
              isIncome ? (remaining >= 0 ? "text-green-500" : "text-amber-500") : (remaining < 0 ? "text-red-500" : "text-green-500")
            }`}>
              {remaining < 0 ? "−" : "+"}{fmt(Math.abs(remaining))}
            </span>
          </div>
        </div>

        {isExp && (
          <div className="px-14 py-2 bg-blue-50/30 dark:bg-blue-950/10 border-t border-blue-100/50 dark:border-blue-900/20">
            <p className="text-xs text-neutral-400 mb-1.5">Заклади:</p>
            <div className="flex flex-wrap gap-2">
              {r.merchants.filter(m => m.is_selected).map(m => (
                <span key={m.id} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${m.has_bonus ? "bg-green-100 dark:bg-green-950/20 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}>
                  {m.has_bonus && "🎁 "}{m.name}{m.has_bonus && m.bonus_percent ? ` ${m.bonus_percent}%` : ""}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-lg font-bold text-green-500">{fmt(totalIncome)}</p>
          {incDelta && <p className={`text-xs font-medium mt-0.5 ${incDelta.val >= 0 ? "text-green-500" : "text-red-400"}`}>{incDelta.label} до пп</p>}
          <p className="text-xs text-neutral-400 mt-1">Дохід за місяць</p>
        </Card>
        <Card className="p-4">
          <p className={`text-lg font-bold ${totalExpFact > totalExpPlan && totalExpPlan > 0 ? "text-red-500" : "text-orange-500"}`}>{fmt(totalExpFact)}</p>
          <p className="text-xs text-neutral-400 mt-1">Витрачено факт / план {fmt(totalExpPlan)}</p>
        </Card>
        {obligationsTotal > 0 ? (
          <Card className="p-4">
            <p className="text-lg font-bold text-blue-500">{fmt(obligationsTotal)}</p>
            <p className="text-xs text-neutral-400 mt-1">Зобов'язання ({obligations.length})</p>
          </Card>
        ) : (
          <Card className="p-4">
            <p className="text-lg font-bold text-neutral-500">{fmt(totalExpPrev)}</p>
            {totalExpDelta && <p className={`text-xs font-medium mt-0.5 ${totalExpDelta.val > 0 ? "text-red-400" : "text-green-500"}`}>{totalExpDelta.label} до пп</p>}
            <p className="text-xs text-neutral-400 mt-1">Попередній місяць</p>
          </Card>
        )}
        <Card className="p-4">
          <p className={`text-lg font-bold ${balance < 0 ? "text-red-500" : "text-green-500"}`}>{balance < 0 ? "−" : "+"}{fmt(Math.abs(balance))}</p>
          <p className="text-xs text-neutral-400 mt-1">{totalIncome > 0 ? "Баланс місяця" : "Залишок бюджету"}</p>
        </Card>
      </div>

      {/* Єдина таблиця: Доходи + Витрати */}
      <Card>
        <div className={`${cols} px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/40`}>
          {["Категорія","Топ заклад","План","Факт","Попер. міс.","%","Залишок"].map(h => (
            <div key={h} className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{h}</div>
          ))}
        </div>
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">

          {/* ── Доходи ─────────────────────────────────────── */}
          {incRows.length > 0 && (
            <>
              <div className={`${cols} px-4 py-2.5 bg-green-50/60 dark:bg-green-950/10`}>
                <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">💰 Доходи</div>
                {[...Array(6)].map((_, i) => <div key={i} />)}
              </div>
              {incRows.map(r => renderRow(r, true))}
              {incRows.length > 1 && (() => {
                const tFact = incRows.reduce((s, r) => s + r.fact, 0);
                const tPlan = incRows.reduce((s, r) => s + r.plan, 0);
                const tPrev = incRows.reduce((s, r) => s + r.prevFact, 0);
                const tPct  = tPlan > 0 ? Math.round(tFact / tPlan * 100) : 0;
                const tD    = delta(tFact, tPrev);
                return (
                  <div className={`${cols} px-4 py-3 bg-green-50/30 dark:bg-green-950/5`}>
                    <div className="flex items-center gap-2 pl-4">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">Всього доходів</p>
                    </div>
                    <div />
                    <p className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{fmt(tPlan)}</p>
                    <p className="text-sm font-bold text-green-500 tabular-nums">+{fmt(tFact)}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-neutral-500 tabular-nums">{fmt(tPrev)}</p>
                      {tD && <span className={`text-xs ${tD.val >= 0 ? "text-green-500" : "text-red-400"}`}>{tD.label}</span>}
                    </div>
                    <p className={`text-sm font-bold tabular-nums ${tPct >= 100 ? "text-green-500" : "text-amber-500"}`}>{tPct}%</p>
                    <p className={`text-sm font-bold tabular-nums ${tFact >= tPlan ? "text-green-500" : "text-amber-500"}`}>
                      {tFact >= tPlan ? "+" : "−"}{fmt(Math.abs(tFact - tPlan))}
                    </p>
                  </div>
                );
              })()}
            </>
          )}

          {/* ── Витрати ─────────────────────────────────────── */}
          <div className={`${cols} px-4 py-2.5 bg-neutral-100/60 dark:bg-neutral-800/60`}>
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">💸 Витрати</div>
            {[...Array(6)].map((_, i) => <div key={i} />)}
          </div>
          {expRows.map(r => renderRow(r, false))}

          {/* Expense total */}
          <div className={`${cols} px-4 py-3.5 bg-neutral-50 dark:bg-neutral-800/40 border-t-2 border-neutral-200 dark:border-neutral-700`}>
            <div className="flex items-center gap-2 pl-4">
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Всього витрат</p>
            </div>
            <div />
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{fmt(totalExpPlan)}</p>
            <p className={`text-sm font-bold tabular-nums ${totalExpFact > totalExpPlan && totalExpPlan > 0 ? "text-red-500" : "text-orange-500"}`}>{fmt(totalExpFact)}</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-neutral-500 tabular-nums">{fmt(totalExpPrev)}</p>
              {totalExpDelta && <span className={`text-xs font-medium ${totalExpDelta.val > 0 ? "text-red-400" : "text-green-500"}`}>{totalExpDelta.label}</span>}
            </div>
            <p className={`text-sm font-bold tabular-nums ${pctColor(totalExpPct)}`}>{totalExpPct}%</p>
            <p className={`text-sm font-bold tabular-nums ${totalExpFact > totalExpPlan && totalExpPlan > 0 ? "text-red-500" : "text-green-500"}`}>
              {totalExpFact > totalExpPlan ? "−" : "+"}{fmt(Math.abs(totalExpPlan - totalExpFact))}
            </p>
          </div>
        </div>

        {/* Toggle hidden expense categories */}
        {hiddenCount > 0 && (
          <button onClick={() => setShowAllExpense(v => !v)}
            className="w-full py-2.5 text-xs text-neutral-400 hover:text-orange-400 border-t border-neutral-100 dark:border-neutral-800 transition-colors flex items-center justify-center gap-1.5">
            <Icon d={showAllExpense ? extraIcons.chevDown : extraIcons.chevRight} className="w-3.5 h-3.5" />
            {showAllExpense ? "Сховати порожні категорії" : `Показати всі (ще ${hiddenCount} без даних)`}
          </button>
        )}
      </Card>

      {/* Obligations */}
      {obligations.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💳</span>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Зобов'язання</h3>
            <span className="text-xs text-neutral-400">щомісячні платежі з розділу Кредити</span>
          </div>
          <div className="space-y-2">
            {obligations.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{o.name}</p>
                  <p className="text-xs text-neutral-400">{o.type === "credit_card" ? "Кредитна карта" : o.type === "installment" ? "Розстрочка" : o.type === "mortgage" ? "Іпотека" : "Кредит"}</p>
                </div>
                <p className="text-sm font-bold text-blue-500">−{fmt(o.monthly_payment)}</p>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
              <span className="text-sm text-neutral-500">Всього зобов'язань</span>
              <span className="text-sm font-bold text-blue-500">−{fmt(obligationsTotal)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Bonuses */}
      {(() => {
        const bonuses = Object.entries(merchantMap).flatMap(([key, merchants]) => {
          const regCat = getCategoryDef(key);
          const fact   = factMap[key] ?? 0;
          return merchants
            .filter(m => m.is_selected && m.has_bonus && m.bonus_percent && fact > 0)
            .map(m => ({
              merchant: m.name, category: regCat.label, bonusLabel: m.bonus_label || "",
              earned: Math.round(fact * (m.bonus_percent || 0) / 100),
            }));
        }).filter(b => b.earned > 0);
        if (!bonuses.length) return null;
        return (
          <Card className="p-5">
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
          </Card>
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
  clothes:   [{ name: "Zara", has_bonus: false }, { name: "H&M", has_bonus: false }, { name: "Rozetka", has_bonus: true, bonus_percent: 1, bonus_label: "Rozetka бали" }],
};

const TYPE_LABELS: Record<CategoryType, string> = {
  fixed: "🔒 Фіксована", variable: "📅 Змінна", bonus: "🎁 Бонусна", income: "💰 Дохід",
};

// TX_META для CategoriesTab (відображення пов'язаної tx-категорії)
const TX_META: Record<string, { label: string; emoji: string }> = {};
CATEGORY_REGISTRY.forEach(c => { TX_META[c.id] = { label: c.label, emoji: c.emoji }; });

function CategoriesTab({ categories, onReload }: { categories: Category[]; onReload: () => void }) {
  const supabase = createClient();
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [addSubId, setAddSubId]           = useState<string | null>(null);
  const [newSubName, setNewSubName]       = useState("");
  const [newSubIcon, setNewSubIcon]       = useState("📌");
  const [addMerchantId, setAddMerchantId] = useState<string | null>(null);
  const [customMerchant, setCustomMerchant] = useState("");
  const [addCatOpen, setAddCatOpen]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [newCat, setNewCat]               = useState({ name: "", icon: "📦", type: "variable" as CategoryType, txKey: "" });

  const inp = "px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300 transition-all";

  async function updateCat(id: string, patch: Partial<DBCategory>) {
    await supabase.from("categories").update(patch).eq("id", id);
    onReload();
  }
  async function deleteCat(id: string) {
    await supabase.from("categories").delete().eq("id", id);
    onReload();
  }
  async function addCategory() {
    if (!newCat.name.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let txKey = newCat.txKey;
      if (!txKey) {
        const n = newCat.name.toLowerCase();
        const match = CATEGORY_REGISTRY.find(c => c.label.toLowerCase() === n);
        txKey = match?.id ?? "";
      }
      const { data: cat, error } = await supabase.from("categories").insert({
        user_id: user.id, name: newCat.name.trim(), icon: newCat.icon,
        type: newCat.type, color: txKey || "custom", sort_order: categories.length,
      }).select().single();
      if (error) { console.error("addCategory error:", error); return; }
      if (cat && txKey && MERCHANT_PRESETS[txKey]) {
        await supabase.from("merchants").insert(
          MERCHANT_PRESETS[txKey].map(m => ({
            category_id: cat.id, name: m.name,
            has_bonus: m.has_bonus, bonus_percent: m.bonus_percent ?? null,
            bonus_label: m.bonus_label ?? null, is_selected: true, is_custom: false,
          }))
        );
      }
      setNewCat({ name: "", icon: "📦", type: "variable", txKey: "" });
      setAddCatOpen(false);
      onReload();
    } finally {
      setSaving(false);
    }
  }
  async function toggleMerchant(mId: string, current: boolean) {
    await supabase.from("merchants").update({ is_selected: !current }).eq("id", mId);
    onReload();
  }
  async function addCustomMerchantFn(catId: string) {
    if (!customMerchant.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("merchants").insert({
      user_id: user.id, category_id: catId, name: customMerchant,
      has_bonus: false, is_selected: true, is_custom: true,
    });
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
    await supabase.from("subcategories").insert({
      user_id: user.id, category_id: catId, name: newSubName, icon: newSubIcon, sort_order: 0,
    });
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
        <button onClick={() => setAddCatOpen(v => !v)}
          className="flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
          <Icon d={icons.plus} className="w-4 h-4" />Категорія
        </button>
      </div>

      {addCatOpen && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Нова група закладів</p>
          <div>
            <p className="text-xs text-neutral-500 mb-2">Прив'яжіть до категорії реєстру:</p>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Витрати</p>
              <div className="flex flex-wrap gap-1.5">
                {TX_CATEGORIES.expense.map(c => (
                  <button key={c.id} onClick={() => setNewCat(p => ({
                    ...p, txKey: p.txKey === c.id ? "" : c.id,
                    name: p.txKey === c.id ? "" : (p.name || c.label),
                    icon: p.txKey === c.id ? "📦" : (p.icon === "📦" ? c.emoji : p.icon),
                    type: "variable",
                  }))}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${newCat.txKey === c.id ? "border-orange-300 bg-orange-100 dark:bg-orange-950/30 text-orange-600" : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300"}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mt-2">Доходи</p>
              <div className="flex flex-wrap gap-1.5">
                {TX_CATEGORIES.income.map(c => (
                  <button key={c.id} onClick={() => setNewCat(p => ({
                    ...p, txKey: p.txKey === c.id ? "" : c.id,
                    name: p.txKey === c.id ? "" : (p.name || c.label),
                    icon: p.txKey === c.id ? "📦" : (p.icon === "📦" ? c.emoji : p.icon),
                    type: "income",
                  }))}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${newCat.txKey === c.id ? "border-green-300 bg-green-100 dark:bg-green-950/30 text-green-600" : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300"}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <EmojiPicker value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e }))} />
            <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
              placeholder="Назва групи" className={`flex-1 ${inp} bg-white dark:bg-neutral-800`} />
          </div>
          {newCat.txKey && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              ✓ Пов'язана з: <strong>{TX_META[newCat.txKey]?.emoji} {TX_META[newCat.txKey]?.label}</strong>
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setAddCatOpen(false); setNewCat({ name: "", icon: "📦", type: "variable", txKey: "" }); }}
              className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm">
              Скасувати
            </button>
            <button onClick={addCategory} disabled={saving || !newCat.name.trim()}
              className="flex-1 py-2 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Icon d={icons.loader} className="w-3.5 h-3.5 animate-spin" />}
              Додати
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map(cat => (
          <Card key={cat.id}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Icon d={extraIcons.drag} className="w-4 h-4 text-neutral-300 cursor-grab shrink-0" />
              <EmojiPicker value={cat.icon} onChange={e => updateCat(cat.id, { icon: e })} />
              <div className="flex-1 min-w-0">
                {editingId === cat.id ? (
                  <input value={cat.name} onChange={e => updateCat(cat.id, { name: e.target.value })}
                    className="w-full px-2 py-1 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20 text-sm font-semibold focus:outline-none text-neutral-900 dark:text-neutral-100"
                    autoFocus onBlur={() => setEditingId(null)} onKeyDown={e => e.key === "Enter" && setEditingId(null)} />
                ) : (
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{cat.name}</p>
                )}
                {cat.color && TX_META[cat.color] && (
                  <span className="text-xs text-neutral-400">{TX_META[cat.color].emoji} {TX_META[cat.color].label}</span>
                )}
              </div>
              <button onClick={() => setEditingId(editingId === cat.id ? null : cat.id)}
                className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
                <Icon d={icons.edit} className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => deleteCat(cat.id)}
                className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
                <Icon d={icons.trash} className="w-3.5 h-3.5" />
              </button>
            </div>

            {cat.subcategories.length > 0 && (
              <div className="border-t border-neutral-50 dark:border-neutral-800/50 px-4 py-2 space-y-1.5">
                <p className="text-xs font-medium text-neutral-400 mb-2">Підкатегорії</p>
                {cat.subcategories.map(sub => (
                  <div key={sub.id} className="group flex items-center gap-2">
                    <span className="text-sm">{sub.icon}</span>
                    <p className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{sub.name}</p>
                    <button onClick={() => deleteSub(sub.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                      <Icon d={icons.trash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {addSubId === cat.id ? (
              <div className="border-t border-neutral-50 dark:border-neutral-800/50 px-4 py-3 flex gap-2 items-center">
                <EmojiPicker value={newSubIcon} onChange={setNewSubIcon} />
                <input value={newSubName} onChange={e => setNewSubName(e.target.value)}
                  placeholder="Назва підкатегорії" className={`flex-1 ${inp}`} autoFocus />
                <button onClick={() => addSubcategory(cat.id)}
                  className="px-3 py-2 rounded-xl bg-orange-400 text-white text-xs font-bold hover:bg-orange-500">Додати</button>
                <button onClick={() => setAddSubId(null)}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-xs">✕</button>
              </div>
            ) : (
              <button onClick={() => setAddSubId(cat.id)}
                className="w-full px-4 py-2 text-xs text-neutral-400 hover:text-orange-400 border-t border-neutral-50 dark:border-neutral-800/50 text-left flex items-center gap-1.5 transition-colors">
                <Icon d={icons.plus} className="w-3 h-3" />Додати підкатегорію
              </button>
            )}

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
                        <span onClick={e => { e.stopPropagation(); deleteMerchant(m.id); }}
                          className="ml-1 text-neutral-300 hover:text-red-400">×</span>
                      )}
                    </button>
                  ))}
                </div>
                {addMerchantId === cat.id ? (
                  <div className="flex gap-2">
                    <input value={customMerchant} onChange={e => setCustomMerchant(e.target.value)}
                      placeholder="Назва закладу" className={`flex-1 ${inp} py-1.5`} autoFocus
                      onKeyDown={e => { if (e.key === "Enter") addCustomMerchantFn(cat.id); }} />
                    <button onClick={() => addCustomMerchantFn(cat.id)}
                      className="px-3 py-1.5 rounded-xl bg-orange-400 text-white text-xs font-bold">+</button>
                    <button onClick={() => setAddMerchantId(null)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-xs">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAddMerchantId(cat.id)}
                    className="text-xs text-neutral-400 hover:text-orange-400 flex items-center gap-1 transition-colors">
                    <Icon d={icons.plus} className="w-3 h-3" />Додати свій заклад
                  </button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function BudgetPage() {
  const supabase = createClient();
  const now = new Date();
  const [tab, setTab]           = useState<Tab>("budget");
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear]         = useState(now.getFullYear());
  const [loading, setLoading]   = useState(true);
  const [seeding, setSeeding]   = useState(false);

  // Budget display state — всі ключі = category_key з реєстру
  const [factMap, setFactMap]         = useState<Record<string, number>>({});
  const [prevFactMap, setPrevFactMap] = useState<Record<string, number>>({});
  const [planMap, setPlanMap]         = useState<Record<string, number>>({});
  const [merchantMap, setMerchantMap] = useState<Record<string, DBMerchant[]>>({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [prevIncome, setPrevIncome]   = useState(0);
  const [obligations, setObligations] = useState<Obligation[]>([]);

  // CategoriesTab state (DB-backed categories для merchant/subcategory CRUD)
  const [categories, setCategories] = useState<Category[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const month     = monthIdx + 1;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;

    const dateStart     = `${year}-${String(month).padStart(2,"0")}-01`;
    const dateEnd       = month === 12 ? `${year+1}-01-01` : `${year}-${String(month+1).padStart(2,"0")}-01`;
    const prevDateStart = `${prevYear}-${String(prevMonth).padStart(2,"0")}-01`;
    const prevDateEnd   = prevMonth === 12 ? `${prevYear+1}-01-01` : `${prevYear}-${String(prevMonth+1).padStart(2,"0")}-01`;

    const [
      { data: cats }, { data: subs }, { data: merch },
      { data: budgets },
      { data: txs }, { data: txsPrev },
      { data: creditRows },
    ] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("subcategories").select("*").eq("user_id", user.id),
      supabase.from("merchants").select("*"),
      supabase.from("budgets").select("category_key, plan_amount")
        .eq("user_id", user.id).eq("month", month).eq("year", year),
      supabase.from("transactions").select("amount,category_key,type")
        .eq("user_id", user.id)
        .gte("transaction_date", dateStart).lt("transaction_date", dateEnd)
        .is("deleted_at", null),
      supabase.from("transactions").select("amount,category_key,type")
        .eq("user_id", user.id)
        .gte("transaction_date", prevDateStart).lt("transaction_date", prevDateEnd)
        .is("deleted_at", null),
      supabase.from("credits").select("name,monthly_payment,type")
        .eq("user_id", user.id).neq("is_archived", true).gt("monthly_payment", 0),
    ]);

    // factMap: category_key → sum (тільки expense+income; transfer ігнорується)
    const factMap: Record<string, number>     = {};
    const prevFactMap: Record<string, number> = {};
    (txs ?? []).forEach(t => {
      if (t.type === "transfer") return;
      const k = t.category_key || "uncategorized";
      factMap[k] = (factMap[k] ?? 0) + Number(t.amount);
    });
    (txsPrev ?? []).forEach(t => {
      if (t.type === "transfer") return;
      const k = t.category_key || "uncategorized";
      prevFactMap[k] = (prevFactMap[k] ?? 0) + Number(t.amount);
    });

    // planMap: category_key → plan_amount (з budgets таблиці)
    const planMap: Record<string, number> = {};
    (budgets ?? []).forEach(b => {
      if (b.category_key) planMap[b.category_key] = Number(b.plan_amount);
    });

    // merchantMap: category_key → merchants[]
    // DB категорія лінкується до реєстру через поле color (зберігає txKey)
    const userCatIds = new Set((cats ?? []).map(c => c.id));
    const userMerch  = (merch ?? []).filter(m => userCatIds.has(m.category_id));
    const catKeyById: Record<string, string> = {};
    (cats ?? []).forEach(c => {
      if (c.color && REGISTRY_KEY_SET.has(c.color)) catKeyById[c.id] = c.color;
    });
    const merchantMap: Record<string, DBMerchant[]> = {};
    userMerch.forEach(m => {
      const key = catKeyById[m.category_id];
      if (!key) return;
      merchantMap[key] = [...(merchantMap[key] ?? []), m];
    });

    // totals
    const inc     = INCOME_CATEGORIES.reduce((s, c) => s + (factMap[c.id] ?? 0), 0);
    const incPrev = INCOME_CATEGORIES.reduce((s, c) => s + (prevFactMap[c.id] ?? 0), 0);

    setFactMap(factMap);
    setPrevFactMap(prevFactMap);
    setPlanMap(planMap);
    setMerchantMap(merchantMap);
    setTotalIncome(inc);
    setPrevIncome(incPrev);
    setObligations((creditRows ?? []).map(r => ({
      name: r.name, monthly_payment: Number(r.monthly_payment), type: r.type,
    })));

    // CategoriesTab: DB categories з merchants та subcategories
    setCategories((cats ?? []).map(cat => ({
      ...cat,
      subcategories: (subs ?? [])
        .filter(s => s.category_id === cat.id)
        .map(s => ({ ...s, sort_order: s.sort_order ?? 0 })),
      merchants: userMerch.filter(m => m.category_id === cat.id),
    })));

    setLoading(false);
  }, [monthIdx, year]);

  useEffect(() => { load(); }, [load]);

  // Зберегти план для категорії за category_key
  async function handlePlanChange(categoryKey: string, val: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const month = monthIdx + 1;
    const existing = await supabase.from("budgets").select("id")
      .eq("user_id", user.id).eq("category_key", categoryKey)
      .eq("month", month).eq("year", year).maybeSingle();
    if (existing.data) {
      await supabase.from("budgets").update({ plan_amount: val }).eq("id", existing.data.id);
    } else {
      await supabase.from("budgets").insert({
        user_id: user.id, category_key: categoryKey, month, year, plan_amount: val,
      });
    }
    setPlanMap(p => ({ ...p, [categoryKey]: val }));
  }

  // Копіювати план з попереднього місяця
  async function copyPlan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const prevMonth = monthIdx === 0 ? 12 : monthIdx;
    const prevYear  = monthIdx === 0 ? year - 1 : year;
    const { data: prevBudgets } = await supabase.from("budgets")
      .select("category_key, plan_amount")
      .eq("user_id", user.id).eq("month", prevMonth).eq("year", prevYear);
    if (!prevBudgets?.length) return;
    const month = monthIdx + 1;
    for (const b of prevBudgets) {
      if (!b.category_key) continue;
      const ex = await supabase.from("budgets").select("id")
        .eq("user_id", user.id).eq("category_key", b.category_key)
        .eq("month", month).eq("year", year).maybeSingle();
      if (ex.data) {
        await supabase.from("budgets").update({ plan_amount: b.plan_amount }).eq("id", ex.data.id);
      } else {
        await supabase.from("budgets").insert({
          user_id: user.id, category_key: b.category_key, month, year, plan_amount: b.plan_amount,
        });
      }
    }
    load();
  }

  // Очистити бюджетні записи без валідного category_key (orphans зі старої системи)
  async function cleanBudgets() {
    if (!confirm("Видалити бюджетні записи з невідомими або застарілими категоріями?")) return;
    setSeeding(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSeeding(false); return; }
    const { data: allBudgets } = await supabase.from("budgets")
      .select("id, category_key").eq("user_id", user.id);
    const orphanIds = (allBudgets ?? [])
      .filter(b => !b.category_key || !REGISTRY_KEY_SET.has(b.category_key))
      .map(b => b.id);
    if (orphanIds.length > 0) {
      await supabase.from("budgets").delete().in("id", orphanIds);
    }
    setSeeding(false);
    load();
  }

  // Налаштувати заклади (preset merchants для основних категорій)
  async function seedMerchants() {
    setSeeding(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSeeding(false); return; }

    // Для кожного presetKey: знайти або створити DB-категорію, вставити merchants
    for (const [txKey, presets] of Object.entries(MERCHANT_PRESETS)) {
      const reg = getCategoryDef(txKey);

      // Знайти існуючу DB-категорію
      let catId: string | null = categories.find(c => c.color === txKey)?.id ?? null;

      if (!catId) {
        const { data: newCat } = await supabase.from("categories").insert({
          user_id: user.id, name: reg.label, icon: reg.emoji,
          type: reg.type === "income" ? "income" : "variable",
          color: txKey, sort_order: 99,
        }).select("id").single();
        catId = newCat?.id ?? null;
      }
      if (!catId) continue;

      // Вставити merchants яких ще нема
      const existing = categories.find(c => c.id === catId)?.merchants.map(m => m.name) ?? [];
      const toInsert = presets.filter(p => !existing.includes(p.name));
      if (toInsert.length > 0) {
        await supabase.from("merchants").insert(
          toInsert.map(m => ({
            category_id: catId, name: m.name,
            has_bonus: m.has_bonus, bonus_percent: m.bonus_percent ?? null,
            bonus_label: m.bonus_label ?? null, is_selected: true, is_custom: false,
          }))
        );
      }
    }
    setSeeding(false);
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
        <Card className="flex items-center gap-1 px-3 py-2">
          <button onClick={() => { if (monthIdx === 0) { setMonthIdx(11); setYear(y => y - 1); } else setMonthIdx(m => m - 1); }}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors text-neutral-400">
            <Icon d={extraIcons.chevLeft} className="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 px-2 min-w-[130px] text-center">
            {MONTHS[monthIdx]} {year}
          </p>
          <button onClick={() => { if (monthIdx === 11) { setMonthIdx(0); setYear(y => y + 1); } else setMonthIdx(m => m + 1); }}
            className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors text-neutral-400">
            <Icon d={extraIcons.chevRight} className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-neutral-100 dark:bg-neutral-800 mx-1" />
          <button onClick={copyPlan}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-orange-400 transition-colors">
            <Icon d={extraIcons.copy} className="w-3.5 h-3.5" />Копіювати план
          </button>
          <div className="w-px h-5 bg-neutral-100 dark:bg-neutral-800 mx-1" />
          <button onClick={cleanBudgets} disabled={seeding}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-50">
            {seeding ? <Icon d={icons.loader} className="w-3.5 h-3.5 animate-spin" /> : "↺"}
            Очистити
          </button>
        </Card>
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
        <div className="flex items-center justify-center py-16">
          <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : (
        <>
          {tab === "budget" && (
            <BudgetTab
              factMap={factMap} prevFactMap={prevFactMap}
              planMap={planMap} merchantMap={merchantMap}
              onPlanChange={handlePlanChange}
              monthIdx={monthIdx} year={year}
              totalIncome={totalIncome} prevIncome={prevIncome}
              obligations={obligations}
            />
          )}
          {tab === "categories" && (
            <>
              {categories.length === 0 && (
                <Card className="p-6 flex items-center gap-4">
                  <span className="text-2xl">🏪</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Заклади ще не налаштовані</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Завантажте популярні заклади автоматично</p>
                  </div>
                  <button onClick={seedMerchants} disabled={seeding}
                    className="shrink-0 px-4 py-2 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 disabled:opacity-60 transition-all flex items-center gap-1.5">
                    {seeding && <Icon d={icons.loader} className="w-3.5 h-3.5 animate-spin" />}
                    Завантажити заклади
                  </button>
                </Card>
              )}
              <CategoriesTab categories={categories} onReload={load} />
            </>
          )}
        </>
      )}
    </div>
  );
}
