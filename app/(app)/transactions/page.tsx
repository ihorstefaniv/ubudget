"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type TxType = "expense" | "income" | "transfer";

interface Account { id: string; name: string; currency: string; balance: number; }
interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  category_key: string | null;
  type: TxType;
  amount: number;
  currency: string;
  note: string | null;
  transaction_date: string;
  is_recurring: boolean;
  recurring_interval: string | null;
  account_name?: string;
  category_name?: string;
  category_icon?: string;
}

const DEFAULT_CATS = {
  expense: [
    { id: "food",          name: "Продукти",   icon: "🛒" },
    { id: "cafe",          name: "Кафе",        icon: "☕" },
    { id: "transport",     name: "Транспорт",   icon: "🚗" },
    { id: "fuel",          name: "Пальне",      icon: "⛽" },
    { id: "health",        name: "Здоров'я",    icon: "💊" },
    { id: "housing",       name: "Комунальні",  icon: "🏠" },
    { id: "clothes",       name: "Одяг",        icon: "👗" },
    { id: "entertainment", name: "Розваги",     icon: "🎮" },
    { id: "education",     name: "Освіта",      icon: "📚" },
    { id: "sport",         name: "Спорт",       icon: "🏃" },
    { id: "beauty",        name: "Краса",       icon: "💄" },
    { id: "pets",          name: "Тварини",     icon: "🐾" },
    { id: "gifts",         name: "Подарунки",   icon: "🎁" },
    { id: "other",         name: "Інше",        icon: "📦" },
  ],
  income: [
    { id: "salary",    name: "Зарплата",   icon: "💼" },
    { id: "freelance", name: "Фріланс",    icon: "💻" },
    { id: "business",  name: "Бізнес",     icon: "🏪" },
    { id: "invest",    name: "Інвестиції", icon: "📈" },
    { id: "gift",      name: "Подарунок",  icon: "🎀" },
    { id: "refund",    name: "Повернення", icon: "↩️" },
    { id: "other_in",  name: "Інше",       icon: "💰" },
  ],
};

const ALL_DEFAULTS = [...DEFAULT_CATS.expense, ...DEFAULT_CATS.income];
const CURRENCIES = ["UAH", "USD", "EUR", "PLN"];

function fmt(n: number, cur = "UAH") {
  const val = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (cur === "USD") return `$ ${val}`;
  if (cur === "EUR") return `€ ${val}`;
  return `${val} грн`;
}

function groupByDate(txs: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  txs.forEach(tx => {
    if (!groups[tx.transaction_date]) groups[tx.transaction_date] = [];
    groups[tx.transaction_date].push(tx);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatDate(d: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return "Сьогодні";
  if (d === yesterday) return "Вчора";
  return new Date(d).toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

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
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  repeat: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  loader: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
};

function AddModal({ onClose, onSaved, editTx, accounts }: {
  onClose: () => void; onSaved: () => void; editTx?: Transaction; accounts: Account[];
}) {
  const supabase = createClient();
  const [type, setType]             = useState<TxType>(editTx?.type ?? "expense");
  const [amount, setAmount]         = useState(editTx ? String(editTx.amount) : "");
  const [currency, setCurrency]     = useState(editTx?.currency ?? "UAH");
  const [categoryId, setCategoryId] = useState(editTx?.category_key ?? "");
  const [accountId, setAccountId]   = useState(editTx?.account_id ?? accounts[0]?.id ?? "");
  const [accountToId, setAccountToId] = useState(accounts[1]?.id ?? "");
  const [date, setDate]             = useState(editTx?.transaction_date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote]             = useState(editTx?.note ?? "");
  const [recurring, setRecurring]   = useState(editTx?.is_recurring ?? false);
  const [interval, setInterval]     = useState(editTx?.recurring_interval ?? "monthly");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  async function handleSubmit() {
    if (!amount || isNaN(+amount) || +amount <= 0) { setError("Введіть суму"); return; }
    if (type !== "transfer" && !categoryId) { setError("Оберіть категорію"); return; }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const cat = ALL_DEFAULTS.find(c => c.id === categoryId);

    const payload = {
      user_id: user.id,
      account_id: accountId || null,
      category_id: null,
      category_key: type !== "transfer" ? (categoryId || null) : null,
      type,
      amount: +amount,
      currency,
      note: note || null,
      transaction_date: date,
      is_recurring: recurring,
      recurring_interval: recurring ? interval : null,
    };

    if (editTx) {
      await supabase.from("transactions").update(payload).eq("id", editTx.id);
    } else {
      await supabase.from("transactions").insert(payload);
      // Update account balance
      if (accountId) {
        const { data: accData } = await supabase.from("accounts").select("balance").eq("id", accountId).single();
        if (accData) {
          const delta = type === "expense" ? -Number(amount) : type === "income" ? +Number(amount) : -Number(amount);
          await supabase.from("accounts").update({ balance: Number(accData.balance) + delta }).eq("id", accountId);
        }
      }
      if (type === "transfer" && accountToId) {
        const { data: accTo } = await supabase.from("accounts").select("balance").eq("id", accountToId).single();
        if (accTo) await supabase.from("accounts").update({ balance: Number(accTo.balance) + Number(amount) }).eq("id", accountToId);
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  const cats = type === "expense" ? DEFAULT_CATS.expense : DEFAULT_CATS.income;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-100 dark:border-neutral-800 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between z-10">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{editTx ? "Редагувати" : "Нова транзакція"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors"><Icon d={icons.close} className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Type */}
          <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {(["expense", "income", "transfer"] as TxType[]).map(t => (
              <button key={t} onClick={() => { setType(t); setCategoryId(""); }}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${type === t
                  ? t === "expense" ? "bg-white dark:bg-neutral-900 text-red-500 shadow-sm"
                  : t === "income" ? "bg-white dark:bg-neutral-900 text-green-500 shadow-sm"
                  : "bg-white dark:bg-neutral-900 text-blue-500 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400"}`}>
                {t === "expense" ? "Витрата" : t === "income" ? "Дохід" : "Переказ"}
              </button>
            ))}
          </div>
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-500">Сума *</label>
            <div className="flex gap-2">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus
                className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xl font-bold placeholder:text-neutral-300 focus:outline-none focus:border-orange-300 transition-all" />
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-medium focus:outline-none focus:border-orange-300 transition-all">
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {/* Category */}
          {type !== "transfer" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-500">Категорія *</label>
              <div className="grid grid-cols-4 gap-2">
                {cats.map(c => (
                  <button key={c.id} onClick={() => setCategoryId(c.id)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                      categoryId === c.id ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30" : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200"}`}>
                    <span className="text-lg">{c.icon}</span>
                    <span className={`text-xs text-center leading-tight ${categoryId === c.id ? "text-orange-500 font-medium" : "text-neutral-500 dark:text-neutral-400"}`}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Accounts */}
          <div className={`grid gap-3 ${type === "transfer" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500">{type === "transfer" ? "З рахунку *" : "Рахунок *"}</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            {type === "transfer" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500">На рахунок *</label>
                <select value={accountToId} onChange={e => setAccountToId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all">
                  {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>
          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500">Нотатка</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Опис..."
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all" />
            </div>
          </div>
          {/* Repeat */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Повторювана</p>
                <p className="text-xs text-neutral-400 mt-0.5">Щомісяця або щотижня</p>
              </div>
              <button onClick={() => setRecurring(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${recurring ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${recurring ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {recurring && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                {(["monthly", "weekly"] as const).map(p => (
                  <button key={p} onClick={() => setInterval(p)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${interval === p ? "bg-orange-100 dark:bg-orange-950/30 text-orange-500" : "bg-white dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700"}`}>
                    {p === "monthly" ? "Щомісяця" : "Щотижня"}
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button onClick={handleSubmit} disabled={saving}
            className={`w-full py-3.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
              type === "expense" ? "bg-red-500 hover:bg-red-600" : type === "income" ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"}`}>
            {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> :
              editTx ? "Зберегти зміни" : type === "expense" ? "Додати витрату" : type === "income" ? "Додати дохід" : "Зберегти переказ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TxRow({ tx, onEdit, onDelete }: { tx: Transaction; onEdit: () => void; onDelete: () => void }) {
  const isExpense  = tx.type === "expense";
  const isTransfer = tx.type === "transfer";
  const cat = ALL_DEFAULTS.find(c => c.id === (tx.category_key ?? tx.category_id));
  const icon  = cat?.icon ?? (isTransfer ? "↔️" : isExpense ? "📦" : "💰");
  const label = cat?.name ?? (isTransfer ? "Переказ" : isExpense ? "Витрата" : "Дохід");
  const displayNote = tx.note || label;

  return (
    <div className="group flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
        isTransfer ? "bg-blue-50 dark:bg-blue-950/30" : isExpense ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {displayNote}
          </p>
          {tx.is_recurring && <Icon d={icons.repeat} className="w-3 h-3 text-orange-400 shrink-0" />}
        </div>
        <p className="text-xs text-neutral-400 mt-0.5">
          {tx.account_name ?? ""}{isTransfer ? " → " : " · "}{isTransfer ? "" : label}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <p className={`text-sm font-bold tabular-nums ${isTransfer ? "text-blue-500" : isExpense ? "text-red-500" : "text-green-500"}`}>
          {isExpense ? "−" : isTransfer ? "" : "+"}{fmt(tx.amount, tx.currency)}
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
            <Icon d={icons.edit} className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
            <Icon d={icons.trash} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const supabase = createClient();
  const [txs, setTxs]           = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx]     = useState<Transaction | undefined>();
  const [search, setSearch]     = useState("");
  const [filterType, setFilterType]       = useState<TxType | "all">("all");
  const [filterAccount, setFilterAccount] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: txData }, { data: accData }] = await Promise.all([
      supabase.from("transactions").select("*")
        .eq("user_id", user.id).is("deleted_at", null)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false }).limit(500),
      supabase.from("accounts").select("id, name, currency, balance")
        .eq("user_id", user.id).eq("is_archived", false),
    ]);

    const accs: Account[] = accData ?? [];
    setAccounts(accs);

    const accMap = Object.fromEntries(accs.map(a => [a.id, a]));
    const enriched: Transaction[] = (txData ?? []).map(tx => {
      const cat = ALL_DEFAULTS.find(c => c.id === (tx.category_key ?? tx.category_id));
      return {
        ...tx,
        account_name: accMap[tx.account_id]?.name,
        category_name: cat?.name,
        category_icon: cat?.icon,
      };
    });

    setTxs(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteTx(id: string) {
    await supabase.from("transactions").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  const filtered = txs.filter(tx => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterAccount !== "all" && tx.account_id !== filterAccount) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(tx.note ?? "").toLowerCase().includes(q) &&
          !(tx.category_name ?? "").toLowerCase().includes(q) &&
          !(tx.account_name ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grouped      = groupByDate(filtered);
  const totalIncome  = filtered.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance      = totalIncome - totalExpense;

  return (
    <div className="space-y-5 pb-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Транзакції</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Всі доходи та витрати</p>
        </div>
        <button onClick={() => { setEditTx(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
          <Icon d={icons.plus} className="w-4 h-4" />Додати
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Доходи",  value: fmt(totalIncome),                                     color: "text-green-500" },
          { label: "Витрати", value: fmt(totalExpense),                                    color: "text-red-500" },
          { label: "Різниця", value: (balance >= 0 ? "+" : "−") + fmt(Math.abs(balance)), color: balance >= 0 ? "text-orange-500" : "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <p className={`text-base font-bold ${color} tabular-nums`}>{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 space-y-3">
        <div className="relative">
          <Icon d={icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {(["all", "expense", "income", "transfer"] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterType === t ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>
                {t === "all" ? "Всі" : t === "expense" ? "Витрати" : t === "income" ? "Доходи" : "Перекази"}
              </button>
            ))}
          </div>
          <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-orange-300 transition-all">
            <option value="all">Всі рахунки</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Транзакцій не знайдено</p>
          <p className="text-xs mt-1">Додай першу транзакцію кнопкою вгорі</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, dayTxs]) => {
            const dayTotal = dayTxs.reduce((sum, tx) =>
              tx.type === "expense" ? sum - Number(tx.amount) : tx.type === "income" ? sum + Number(tx.amount) : sum, 0);
            return (
              <div key={date} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/20">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{formatDate(date)}</span>
                  <span className={`text-xs font-bold tabular-nums ${dayTotal >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {dayTotal >= 0 ? "+" : "−"}{fmt(Math.abs(dayTotal))}
                  </span>
                </div>
                <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {dayTxs.map(tx => (
                    <TxRow key={tx.id} tx={tx}
                      onEdit={() => { setEditTx(tx); setShowModal(true); }}
                      onDelete={() => deleteTx(tx.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddModal
          onClose={() => { setShowModal(false); setEditTx(undefined); }}
          onSaved={load}
          editTx={editTx}
          accounts={accounts}
        />
      )}
    </div>
  );
}