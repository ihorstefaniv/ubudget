"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Input, Select, Modal, Button, ToggleRow } from "@/components/ui";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/category-registry";
import { fmt } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────

interface Account { id: string; name: string; currency: string; }

interface RecurringTx {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  category_key: string | null;
  note: string | null;
  interval: string;
  next_date: string;
  is_active: boolean;
  account_id: string | null;
}

const INTERVALS = [
  { value: "daily",   label: "Щодня" },
  { value: "weekly",  label: "Щотижня" },
  { value: "monthly", label: "Щомісяця" },
  { value: "yearly",  label: "Щороку" },
];

const INTERVAL_LABELS: Record<string, string> = {
  daily: "щодня", weekly: "щотижня", monthly: "щомісяця", yearly: "щороку",
};

const CURRENCIES = [
  { value: "UAH", label: "UAH" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

// ─── Modal ────────────────────────────────────────────────────

function RecurringModal({
  initial, accounts, onClose, onSaved,
}: {
  initial?: RecurringTx;
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const isEdit = !!initial;

  const [txType, setTxType]       = useState<"income" | "expense">(initial?.type ?? "expense");
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? "");
  const [categoryKey, setCategoryKey] = useState(initial?.category_key ?? "other");
  const [amount, setAmount]       = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency]   = useState(initial?.currency ?? "UAH");
  const [note, setNote]           = useState(initial?.note ?? "");
  const [interval, setInterval]   = useState(initial?.interval ?? "monthly");
  const [nextDate, setNextDate]   = useState(initial?.next_date ?? new Date().toISOString().split("T")[0]);
  const [saving, setSaving]       = useState(false);

  const categories = txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    const cats = txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!cats.find(c => c.id === categoryKey)) setCategoryKey(cats[0]?.id ?? "other");
  }, [txType]);

  async function handleSave() {
    if (!amount || !accountId) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      user_id:      user.id,
      type:         txType,
      account_id:   accountId,
      category_key: categoryKey,
      amount:       parseFloat(amount),
      currency,
      note:         note.trim() || null,
      interval,
      next_date:    nextDate,
    };

    if (isEdit) {
      await supabase.from("recurring_transactions").update(payload).eq("id", initial!.id);
    } else {
      await supabase.from("recurring_transactions").insert({ ...payload, is_active: true });
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  const catEmoji = categories.find(c => c.id === categoryKey)?.emoji ?? "📦";

  return (
    <Modal title={isEdit ? "Редагувати платіж" : "Новий регулярний платіж"} onClose={onClose}>
      {/* Тип */}
      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as const).map(t => (
          <button key={t} onClick={() => setTxType(t)}
            className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
              txType === t
                ? t === "expense"
                  ? "border-red-300 bg-red-50 dark:bg-red-950/30 text-red-500"
                  : "border-green-300 bg-green-50 dark:bg-green-950/30 text-green-600"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
            }`}>
            {t === "expense" ? "Витрата" : "Дохід"}
          </button>
        ))}
      </div>

      {/* Рахунок */}
      <select value={accountId} onChange={e => setAccountId(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100">
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
      </select>

      {/* Категорія */}
      <div className="flex gap-2">
        <span className="flex items-center text-xl px-2">{catEmoji}</span>
        <select value={categoryKey} onChange={e => setCategoryKey(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100">
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {/* Сума + валюта */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input label="Сума" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <Select label="Валюта" value={currency} onChange={e => setCurrency(e.target.value)} options={CURRENCIES} />
      </div>

      {/* Нотатка */}
      <Input label="Нотатка (необов'язково)" value={note} onChange={e => setNote(e.target.value)} placeholder="Оренда, Netflix..." />

      {/* Інтервал + Дата */}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Повторення" value={interval} onChange={e => setInterval(e.target.value)} options={INTERVALS} />
        <Input label="Перший / наступний раз" type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} />
      </div>

      <Button fullWidth onClick={handleSave} disabled={saving || !amount || !accountId}>
        {saving ? "Збереження..." : isEdit ? "Зберегти" : "Додати"}
      </Button>
    </Modal>
  );
}

// ─── Row ──────────────────────────────────────────────────────

function RecurringRow({
  row, accounts, onToggle, onEdit, onDelete,
}: {
  row: RecurringTx;
  accounts: Account[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const cat = allCats.find(c => c.id === row.category_key);
  const acc = accounts.find(a => a.id === row.account_id);

  const isOverdue = row.is_active && row.next_date < new Date().toISOString().split("T")[0];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      row.is_active
        ? "border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        : "border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 opacity-60"
    }`}>
      {/* Emoji */}
      <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-lg shrink-0">
        {cat?.emoji ?? "📦"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {row.note || cat?.label || "Без назви"}
          </p>
          {isOverdue && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 font-semibold shrink-0">
              прострочено
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 truncate">
          {INTERVAL_LABELS[row.interval]} · {acc?.name ?? "—"} · {new Date(row.next_date).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      {/* Amount */}
      <p className={`text-sm font-semibold shrink-0 ${row.type === "income" ? "text-green-500" : "text-red-500"}`}>
        {row.type === "income" ? "+" : "−"}{fmt(row.amount, row.currency)}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onToggle} title={row.is_active ? "Призупинити" : "Активувати"}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs font-bold ${
            row.is_active ? "bg-green-100 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
          }`}>
          {row.is_active ? "✓" : "✗"}
        </button>
        <button onClick={onEdit}
          className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
          <Icon d={icons.edit} className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete}
          className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
          <Icon d={icons.trash} className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function RecurringPage() {
  const supabase = createClient();

  const [rows, setRows]         = useState<RecurringTx[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"new" | RecurringTx | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: recs }, { data: accs }] = await Promise.all([
      supabase.from("recurring_transactions").select("*")
        .eq("user_id", user.id).order("next_date"),
      supabase.from("accounts").select("id,name,currency")
        .eq("user_id", user.id).neq("is_archived", true).order("created_at"),
    ]);

    setRows((recs ?? []) as RecurringTx[]);
    setAccounts(accs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(row: RecurringTx) {
    await supabase.from("recurring_transactions")
      .update({ is_active: !row.is_active }).eq("id", row.id);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("recurring_transactions").delete().eq("id", id);
    load();
  }

  const active   = rows.filter(r => r.is_active);
  const inactive = rows.filter(r => !r.is_active);
  const overdue  = active.filter(r => r.next_date < new Date().toISOString().split("T")[0]);

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Регулярні платежі</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Автоматично додаються о 9:00 у вказану дату
          </p>
        </div>
        <Button onClick={() => setModal("new")}>
          <Icon d={icons.plus} className="w-4 h-4 mr-1.5" />
          Додати
        </Button>
      </div>

      {overdue.length > 0 && (
        <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            {overdue.length} платіж{overdue.length > 1 ? "ів" : ""} прострочено
          </p>
          <p className="text-xs text-orange-500 mt-0.5">
            Буде виконано автоматично при наступному запуску крону (щодня о 9:00)
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Icon d={icons.loader} className="w-6 h-6 text-orange-400 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔄</p>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Немає регулярних платежів</p>
          <p className="text-xs text-neutral-400 mt-1 mb-4">
            Зарплата, оренда, підписки — вносьте раз, відслідковуйте автоматично
          </p>
          <Button onClick={() => setModal("new")}>Додати перший</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
                Активні ({active.length})
              </p>
              {active.map(row => (
                <RecurringRow key={row.id} row={row} accounts={accounts}
                  onToggle={() => handleToggle(row)}
                  onEdit={() => setModal(row)}
                  onDelete={() => handleDelete(row.id)} />
              ))}
            </div>
          )}

          {inactive.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
                Призупинені ({inactive.length})
              </p>
              {inactive.map(row => (
                <RecurringRow key={row.id} row={row} accounts={accounts}
                  onToggle={() => handleToggle(row)}
                  onEdit={() => setModal(row)}
                  onDelete={() => handleDelete(row.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <RecurringModal
          initial={modal === "new" ? undefined : modal}
          accounts={accounts}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
