// ФАЙЛ: app/(app)/tools/shock/page.tsx
// URL: /tools/shock — Shock Tracker: відстеження фінансових шоків та непередбачених витрат
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Card, Button, Modal } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────

type ShockSeverity = "minor" | "moderate" | "major" | "critical";
type ShockCategory = "health" | "car" | "housing" | "tech" | "legal" | "family" | "job" | "other";
type ShockStatus = "active" | "recovering" | "resolved";

interface Shock {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ShockCategory;
  severity: ShockSeverity;
  status: ShockStatus;
  amount: number;
  amount_paid: number;
  currency: string;
  date: string;
  resolved_date: string | null;
  created_at: string;
}

interface ShockStats {
  totalShocks: number;
  activeShocks: number;
  totalDamage: number;
  totalPaid: number;
  totalRemaining: number;
  avgRecoveryDays: number;
  worstMonth: string | null;
  categoryBreakdown: { category: ShockCategory; count: number; amount: number }[];
}

// ─── Constants ────────────────────────────────────────────────

const SEVERITY_META: Record<ShockSeverity, { label: string; emoji: string; color: string; bgColor: string; borderColor: string }> = {
  minor:    { label: "Незначний",  emoji: "⚡",  color: "text-blue-500",   bgColor: "bg-blue-50 dark:bg-blue-950/20",     borderColor: "border-blue-200 dark:border-blue-900/30" },
  moderate: { label: "Помірний",   emoji: "🌩️", color: "text-amber-500",  bgColor: "bg-amber-50 dark:bg-amber-950/20",   borderColor: "border-amber-200 dark:border-amber-900/30" },
  major:    { label: "Серйозний",  emoji: "🔥",  color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/20", borderColor: "border-orange-200 dark:border-orange-900/30" },
  critical: { label: "Критичний",  emoji: "💥",  color: "text-red-500",    bgColor: "bg-red-50 dark:bg-red-950/20",       borderColor: "border-red-200 dark:border-red-900/30" },
};

const CATEGORY_META: Record<ShockCategory, { label: string; emoji: string }> = {
  health:  { label: "Здоров'я",     emoji: "🏥" },
  car:     { label: "Авто",          emoji: "🚗" },
  housing: { label: "Житло",         emoji: "🏠" },
  tech:    { label: "Техніка",       emoji: "💻" },
  legal:   { label: "Юридичне",      emoji: "⚖️" },
  family:  { label: "Сім'я",         emoji: "👨‍👩‍👧" },
  job:     { label: "Робота",        emoji: "💼" },
  other:   { label: "Інше",          emoji: "📦" },
};

const STATUS_META: Record<ShockStatus, { label: string; color: string; dot: string }> = {
  active:     { label: "Активний",      color: "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400",       dot: "bg-red-500" },
  recovering: { label: "Відновлення",   color: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  resolved:   { label: "Вирішено",      color: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400", dot: "bg-green-500" },
};

// ─── Helpers ──────────────────────────────────────────────────

function fmt(n: number) {
  return Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " грн";
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function daysBetween(from: string, to: string): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

function dateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Add/Edit Modal ───────────────────────────────────────────

function ShockModal({ onClose, onSaved, edit }: { onClose: () => void; onSaved: () => void; edit?: Shock }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    title:       edit?.title ?? "",
    description: edit?.description ?? "",
    category:    edit?.category ?? "other" as ShockCategory,
    severity:    edit?.severity ?? "moderate" as ShockSeverity,
    status:      edit?.status ?? "active" as ShockStatus,
    amount:      edit ? String(edit.amount) : "",
    amount_paid: edit ? String(edit.amount_paid) : "0",
    date:        edit?.date ?? new Date().toISOString().slice(0, 10),
    resolved_date: edit?.resolved_date ?? "",
  });

  const upd = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const remaining = (+f.amount || 0) - (+f.amount_paid || 0);
  const pct = +f.amount > 0 ? Math.round((+f.amount_paid / +f.amount) * 100) : 0;

  const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all";

  async function save() {
    if (!f.title.trim() || !f.amount || +f.amount <= 0) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id: user.id,
      title: f.title.trim(),
      description: f.description.trim() || null,
      category: f.category,
      severity: f.severity,
      status: f.status,
      amount: +f.amount,
      amount_paid: +f.amount_paid || 0,
      currency: "UAH",
      date: f.date,
      resolved_date: f.status === "resolved" ? (f.resolved_date || new Date().toISOString().slice(0, 10)) : null,
    };

    if (edit) {
      await supabase.from("shocks").update(payload).eq("id", edit.id);
    } else {
      await supabase.from("shocks").insert(payload);
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title={edit ? "Редагувати шок" : "Новий фінансовий шок"} onClose={onClose}>
      {/* Категорія */}
      <div>
        <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">Категорія</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(CATEGORY_META) as [ShockCategory, { label: string; emoji: string }][]).map(([key, meta]) => (
            <button key={key} onClick={() => upd("category", key)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all ${
                f.category === key
                  ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
              }`}>
              <span className="text-lg">{meta.emoji}</span>
              <span className={`text-xs ${f.category === key ? "text-orange-500 font-medium" : "text-neutral-500"}`}>{meta.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Назва */}
      <div>
        <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Що сталось *</label>
        <input value={f.title} onChange={e => upd("title", e.target.value)}
          placeholder="Ремонт авто, лікування, зламався ноутбук..."
          className={inp} />
      </div>

      {/* Опис */}
      <div>
        <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Деталі (опційно)</label>
        <textarea value={f.description} onChange={e => upd("description", e.target.value)}
          placeholder="Додаткові деталі, що призвело до шоку..."
          rows={2} className={`${inp} resize-none`} />
      </div>

      {/* Серйозність */}
      <div>
        <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">Серйозність</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(SEVERITY_META) as [ShockSeverity, typeof SEVERITY_META[ShockSeverity]][]).map(([key, meta]) => (
            <button key={key} onClick={() => upd("severity", key)}
              className={`py-2 px-2 rounded-xl border text-xs font-medium text-center transition-all ${
                f.severity === key
                  ? `${meta.borderColor} ${meta.bgColor} ${meta.color}`
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
              }`}>
              {meta.emoji} {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Сума + Сплачено */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Сума збитків *</label>
          <input type="number" value={f.amount} onChange={e => upd("amount", e.target.value)}
            placeholder="15 000" className={inp} />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Вже сплачено</label>
          <input type="number" value={f.amount_paid} onChange={e => upd("amount_paid", e.target.value)}
            placeholder="0" className={inp} />
        </div>
      </div>

      {/* Progress preview */}
      {+f.amount > 0 && (
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
            <span>Покрито {pct}%</span>
            <span>Залишок: {fmt(Math.max(0, remaining))}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${
              pct >= 100 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"
            }`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Дата + Статус */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Дата події</label>
          <input type="date" value={f.date} onChange={e => upd("date", e.target.value)} className={inp} />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Статус</label>
          <div className="flex gap-1.5">
            {(Object.entries(STATUS_META) as [ShockStatus, typeof STATUS_META[ShockStatus]][]).map(([key, meta]) => (
              <button key={key} onClick={() => upd("status", key)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  f.status === key ? meta.color : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                }`}>
                {meta.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Дата вирішення */}
      {f.status === "resolved" && (
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Дата вирішення</label>
          <input type="date" value={f.resolved_date} onChange={e => upd("resolved_date", e.target.value)} className={inp} />
        </div>
      )}

      <Button onClick={save} loading={saving} fullWidth>
        {edit ? "Зберегти зміни" : "Додати шок"}
      </Button>
    </Modal>
  );
}

// ─── Shock Card ───────────────────────────────────────────────

function ShockCard({ shock, onEdit, onDelete, onUpdatePaid }: {
  shock: Shock;
  onEdit: () => void;
  onDelete: () => void;
  onUpdatePaid: (amount: number) => void;
}) {
  const [addPayOpen, setAddPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");

  const sev = SEVERITY_META[shock.severity];
  const cat = CATEGORY_META[shock.category];
  const st = STATUS_META[shock.status];
  const remaining = shock.amount - shock.amount_paid;
  const pct = shock.amount > 0 ? Math.round((shock.amount_paid / shock.amount) * 100) : 0;
  const days = daysAgo(shock.date);
  const recoveryDays = shock.resolved_date ? daysBetween(shock.date, shock.resolved_date) : null;

  function submitPay() {
    const val = +payAmount;
    if (val > 0) {
      onUpdatePaid(shock.amount_paid + val);
      setPayAmount("");
      setAddPayOpen(false);
    }
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${sev.borderColor} ${shock.status === "resolved" ? "opacity-70" : ""}`}>
      {/* Header */}
      <div className={`px-5 py-4 ${sev.bgColor}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-neutral-900/50 flex items-center justify-center text-xl shrink-0">
              {cat.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{shock.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sev.color} ${sev.bgColor}`}>
                  {sev.emoji} {sev.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-neutral-500">{cat.label}</span>
                <span className="text-xs text-neutral-300 dark:text-neutral-600">·</span>
                <span className="text-xs text-neutral-400">{dateLabel(shock.date)}</span>
                <span className="text-xs text-neutral-300 dark:text-neutral-600">·</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${st.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${shock.status === "active" ? "animate-pulse" : ""}`} />
                  {st.label}
                  {recoveryDays !== null && ` · ${recoveryDays} дн.`}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit}
              className="w-7 h-7 rounded-lg bg-white/60 dark:bg-neutral-800/60 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
              <Icon d={icons.edit} className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete}
              className="w-7 h-7 rounded-lg bg-white/60 dark:bg-neutral-800/60 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
              <Icon d={icons.trash} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 bg-white dark:bg-neutral-900 space-y-3">
        {shock.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{shock.description}</p>
        )}

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-neutral-400">Збитки</p>
            <p className="text-sm font-bold text-red-500 mt-0.5">{fmt(shock.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Сплачено</p>
            <p className="text-sm font-bold text-orange-500 mt-0.5">{fmt(shock.amount_paid)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Залишок</p>
            <p className={`text-sm font-bold mt-0.5 ${remaining <= 0 ? "text-green-500" : "text-neutral-900 dark:text-neutral-100"}`}>
              {remaining <= 0 ? "Покрито ✓" : fmt(remaining)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Прогрес покриття</span>
            <span className="font-semibold">{Math.min(pct, 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${
              pct >= 100 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"
            }`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>

        {/* Quick pay */}
        {shock.status !== "resolved" && remaining > 0 && (
          <>
            {addPayOpen ? (
              <div className="flex gap-2">
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  placeholder="Сума" autoFocus onKeyDown={e => e.key === "Enter" && submitPay()}
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:border-orange-300" />
                <button onClick={submitPay}
                  className="px-4 py-2 rounded-xl bg-orange-400 text-white text-xs font-bold hover:bg-orange-500 transition-colors">
                  Записати
                </button>
                <button onClick={() => setAddPayOpen(false)}
                  className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs">
                  ✕
                </button>
              </div>
            ) : (
              <button onClick={() => setAddPayOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-700 text-xs transition-all">
                <Icon d={icons.plus} className="w-3.5 h-3.5" />
                Записати оплату
              </button>
            )}
          </>
        )}

        {/* Time info */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1">
          <Icon d={icons.clock} className="w-3.5 h-3.5" />
          {shock.status === "resolved"
            ? `Вирішено за ${recoveryDays ?? "?"} днів`
            : `${days} днів тому`}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function ShockTrackerPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [shocks, setShocks] = useState<Shock[]>([]);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Shock | undefined>();
  const [filter, setFilter] = useState<"all" | ShockStatus>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("shocks")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    setShocks(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteShock(id: string) {
    if (!confirm("Видалити цей шок?")) return;
    await supabase.from("shocks").delete().eq("id", id);
    setShocks(p => p.filter(s => s.id !== id));
  }

  async function updatePaid(id: string, newPaid: number) {
    await supabase.from("shocks").update({ amount_paid: newPaid }).eq("id", id);
    setShocks(p => p.map(s => s.id === id ? { ...s, amount_paid: newPaid } : s));
  }

  // ── Stats ──
  const activeShocks = shocks.filter(s => s.status !== "resolved");
  const resolvedShocks = shocks.filter(s => s.status === "resolved");
  const totalDamage = shocks.reduce((s, sh) => s + sh.amount, 0);
  const totalPaid = shocks.reduce((s, sh) => s + sh.amount_paid, 0);
  const totalRemaining = activeShocks.reduce((s, sh) => s + (sh.amount - sh.amount_paid), 0);
  const avgRecovery = resolvedShocks.length > 0
    ? Math.round(resolvedShocks
        .filter(s => s.resolved_date)
        .reduce((sum, s) => sum + daysBetween(s.date, s.resolved_date!), 0) / resolvedShocks.filter(s => s.resolved_date).length)
    : 0;

  // Категорії
  const catMap: Record<string, { count: number; amount: number }> = {};
  shocks.forEach(s => {
    if (!catMap[s.category]) catMap[s.category] = { count: 0, amount: 0 };
    catMap[s.category].count++;
    catMap[s.category].amount += s.amount;
  });
  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 4);

  // Фільтр
  const filtered = filter === "all" ? shocks : shocks.filter(s => s.status === filter);
  const counts = {
    all: shocks.length,
    active: shocks.filter(s => s.status === "active").length,
    recovering: shocks.filter(s => s.status === "recovering").length,
    resolved: resolvedShocks.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            🚨 Shock Tracker
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Відстежуйте непередбачені витрати та фінансові шоки
          </p>
        </div>
        <Button icon={icons.plus} onClick={() => { setEditItem(undefined); setModal(true); }}>
          Новий шок
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "💥", label: "Загальні збитки", value: fmt(totalDamage), color: "text-red-500" },
          { emoji: "🔴", label: "Ще не покрито", value: fmt(totalRemaining), color: totalRemaining > 0 ? "text-red-500" : "text-green-500" },
          { emoji: "🔥", label: "Активних шоків", value: String(activeShocks.length), color: activeShocks.length > 0 ? "text-orange-500" : "text-green-500" },
          { emoji: "⏱️", label: "Сер. відновлення", value: avgRecovery > 0 ? `${avgRecovery} дн.` : "—", color: "text-neutral-900 dark:text-neutral-100" },
        ].map(({ emoji, label, value, color }) => (
          <Card key={label} className="!p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{emoji}</span>
              <p className="text-xs text-neutral-400">{label}</p>
            </div>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* ── Категорії breakdown ── */}
      {topCategories.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">По категоріях</p>
          </div>
          <div className="space-y-2.5">
            {topCategories.map(([catKey, { count, amount }]) => {
              const meta = CATEGORY_META[catKey as ShockCategory] ?? { label: catKey, emoji: "📦" };
              const pct = totalDamage > 0 ? (amount / totalDamage) * 100 : 0;
              return (
                <div key={catKey} className="flex items-center gap-3">
                  <span className="text-base shrink-0">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{meta.label}</span>
                      <span className="text-xs text-neutral-500">{count} шоків · {fmt(amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Alert якщо є активні ── */}
      {activeShocks.length > 0 && totalRemaining > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {activeShocks.length} активних шоків потребують покриття
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Загальна сума непокритих збитків: <strong>{fmt(totalRemaining)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── Фільтр ── */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl w-fit flex-wrap">
        {([
          { key: "all" as const, label: "Всі" },
          { key: "active" as const, label: "🔴 Активні" },
          { key: "recovering" as const, label: "🟡 Відновлення" },
          { key: "resolved" as const, label: "✅ Вирішені" },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === key
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400"
            }`}>
            {label}
            <span className={`ml-1.5 ${filter === key ? "text-orange-500" : "text-neutral-400"}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Список шоків ── */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-4xl mb-3">{shocks.length === 0 ? "🛡️" : "📭"}</p>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {shocks.length === 0 ? "Немає фінансових шоків" : "Немає шоків з цим статусом"}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {shocks.length === 0
              ? "Сподіваємось так і залишиться! Але якщо щось станеться — записуйте тут."
              : "Спробуйте інший фільтр"}
          </p>
          {shocks.length === 0 && (
            <button onClick={() => setModal(true)}
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-orange-400 hover:text-orange-500 font-medium transition-colors">
              <Icon d={icons.plus} className="w-4 h-4" />
              Додати перший запис
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(shock => (
            <ShockCard
              key={shock.id}
              shock={shock}
              onEdit={() => { setEditItem(shock); setModal(true); }}
              onDelete={() => deleteShock(shock.id)}
              onUpdatePaid={(newPaid) => updatePaid(shock.id, newPaid)}
            />
          ))}
        </div>
      )}



      {/* ── Modal ── */}
      {modal && (
        <ShockModal
          onClose={() => { setModal(false); setEditItem(undefined); }}
          onSaved={load}
          edit={editItem}
        />
      )}
    </div>
  );
}