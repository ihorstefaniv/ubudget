"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────
type TxType = "expense" | "income" | "transfer";

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  category: string;
  account: string;
  accountTo?: string;
  date: string;
  note: string;
  photo?: string;
  repeat: boolean;
  repeatPeriod?: "monthly" | "weekly";
}

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES = {
  expense: [
    { id: "food", label: "Продукти", emoji: "🛒" },
    { id: "cafe", label: "Кафе", emoji: "☕" },
    { id: "transport", label: "Транспорт", emoji: "🚗" },
    { id: "fuel", label: "Пальне", emoji: "⛽" },
    { id: "health", label: "Здоров'я", emoji: "💊" },
    { id: "housing", label: "Комунальні", emoji: "🏠" },
    { id: "clothes", label: "Одяг", emoji: "👗" },
    { id: "entertainment", label: "Розваги", emoji: "🎮" },
    { id: "education", label: "Освіта", emoji: "📚" },
    { id: "sport", label: "Спорт", emoji: "🏃" },
    { id: "beauty", label: "Краса", emoji: "💄" },
    { id: "pets", label: "Тварини", emoji: "🐾" },
    { id: "gifts", label: "Подарунки", emoji: "🎁" },
    { id: "other", label: "Інше", emoji: "📦" },
  ],
  income: [
    { id: "salary", label: "Зарплата", emoji: "💼" },
    { id: "freelance", label: "Фріланс", emoji: "💻" },
    { id: "business", label: "Бізнес", emoji: "🏪" },
    { id: "invest", label: "Інвестиції", emoji: "📈" },
    { id: "gift", label: "Подарунок", emoji: "🎀" },
    { id: "refund", label: "Повернення", emoji: "↩️" },
    { id: "other_in", label: "Інше", emoji: "💰" },
  ],
};

const ACCOUNTS = ["Monobank", "ПриватБанк", "Готівка UAH", "Готівка USD", "Копілка"];
const CURRENCIES = ["UAH", "USD", "EUR", "PLN"];

// ─── Mock data ────────────────────────────────────────────────
const MOCK: Transaction[] = [
  { id: "1", type: "expense", amount: 840, currency: "UAH", category: "food", account: "Monobank", date: "2026-02-22", note: "Сільпо", repeat: false },
  { id: "2", type: "expense", amount: 320, currency: "UAH", category: "cafe", account: "Monobank", date: "2026-02-22", note: "Кава та сніданок", repeat: false },
  { id: "3", type: "income", amount: 45000, currency: "UAH", category: "salary", account: "ПриватБанк", date: "2026-02-21", note: "Зарплата лютий", repeat: true, repeatPeriod: "monthly" },
  { id: "4", type: "expense", amount: 620, currency: "UAH", category: "fuel", account: "Готівка UAH", date: "2026-02-21", note: "АЗС WOG", repeat: false },
  { id: "5", type: "transfer", amount: 5000, currency: "UAH", category: "transfer", account: "ПриватБанк", accountTo: "Копілка", date: "2026-02-20", note: "Відкладаємо", repeat: false },
  { id: "6", type: "expense", amount: 1200, currency: "UAH", category: "health", account: "Monobank", date: "2026-02-20", note: "Аптека", repeat: false },
  { id: "7", type: "expense", amount: 450, currency: "UAH", category: "transport", account: "Monobank", date: "2026-02-19", note: "Uber", repeat: false },
  { id: "8", type: "income", amount: 8500, currency: "UAH", category: "freelance", account: "Monobank", date: "2026-02-19", note: "Проект дизайн", repeat: false },
  { id: "9", type: "expense", amount: 2800, currency: "UAH", category: "housing", account: "ПриватБанк", date: "2026-02-18", note: "Комунальні", repeat: true, repeatPeriod: "monthly" },
  { id: "10", type: "expense", amount: 680, currency: "UAH", category: "entertainment", account: "Monobank", date: "2026-02-18", note: "Кінотеатр", repeat: false },
];

// ─── Helpers ──────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function fmt(n: number, cur = "UAH") {
  const val = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (cur === "USD") return `$ ${val}`;
  if (cur === "EUR") return `€ ${val}`;
  return `${val} грн`;
}

function groupByDate(txs: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  txs.forEach((tx) => {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
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

function getCat(type: TxType, id: string) {
  if (type === "transfer") return { emoji: "↔️", label: "Переказ" };
  const list = type === "expense" ? CATEGORIES.expense : CATEGORIES.income;
  return list.find((c) => c.id === id) ?? { emoji: "📦", label: id };
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
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  camera: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
  repeat: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
};

// ─── Add/Edit Modal ───────────────────────────────────────────
function AddModal({ onClose, onAdd, editTx }: {
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
  editTx?: Transaction;
}) {
  const [type, setType] = useState<TxType>(editTx?.type ?? "expense");
  const [amount, setAmount] = useState(editTx?.amount.toString() ?? "");
  const [currency, setCurrency] = useState(editTx?.currency ?? "UAH");
  const [category, setCategory] = useState(editTx?.category ?? "");
  const [account, setAccount] = useState(editTx?.account ?? ACCOUNTS[0]);
  const [accountTo, setAccountTo] = useState(editTx?.accountTo ?? ACCOUNTS[1]);
  const [date, setDate] = useState(editTx?.date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(editTx?.note ?? "");
  const [repeat, setRepeat] = useState(editTx?.repeat ?? false);
  const [repeatPeriod, setRepeatPeriod] = useState<"monthly" | "weekly">(editTx?.repeatPeriod ?? "monthly");
  const [photo, setPhoto] = useState<string | undefined>(editTx?.photo);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const cats = type === "expense" ? CATEGORIES.expense : CATEGORIES.income;

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!amount || isNaN(+amount) || +amount <= 0) { setError("Введіть суму"); return; }
    if (type !== "transfer" && !category) { setError("Оберіть категорію"); return; }
    onAdd({
      id: editTx?.id ?? uid(),
      type, amount: +amount, currency,
      category: type === "transfer" ? "transfer" : category,
      account, accountTo: type === "transfer" ? accountTo : undefined,
      date, note, repeat,
      repeatPeriod: repeat ? repeatPeriod : undefined,
      photo,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-100 dark:border-neutral-800 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-xl [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-transparent">

        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between z-10">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {editTx ? "Редагувати" : "Нова транзакція"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            <Icon d={icons.close} className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Type */}
          <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {(["expense", "income", "transfer"] as TxType[]).map((t) => (
              <button key={t} onClick={() => { setType(t); setCategory(""); }}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  type === t
                    ? t === "expense" ? "bg-white dark:bg-neutral-900 text-red-500 shadow-sm"
                    : t === "income" ? "bg-white dark:bg-neutral-900 text-green-500 shadow-sm"
                    : "bg-white dark:bg-neutral-900 text-blue-500 shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}>
                {t === "expense" ? "Витрата" : t === "income" ? "Дохід" : "Переказ"}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Сума *</label>
            <div className="flex gap-2">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" autoFocus
                className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xl font-bold placeholder:text-neutral-300 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all" />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-medium focus:outline-none focus:border-orange-300 transition-all">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          {type !== "transfer" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Категорія *</label>
              <div className="grid grid-cols-4 gap-2">
                {cats.map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                      category === c.id
                        ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30"
                        : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
                    }`}>
                    <span className="text-lg">{c.emoji}</span>
                    <span className={`text-xs text-center leading-tight ${category === c.id ? "text-orange-500 font-medium" : "text-neutral-500 dark:text-neutral-400"}`}>
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account */}
          <div className={`grid gap-3 ${type === "transfer" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {type === "transfer" ? "З рахунку *" : "Рахунок *"}
              </label>
              <select value={account} onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all">
                {ACCOUNTS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            {type === "transfer" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">На рахунок *</label>
                <select value={accountTo} onChange={(e) => setAccountTo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all">
                  {ACCOUNTS.filter((a) => a !== account).map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Дата</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Нотатка</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Опис..."
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all" />
            </div>
          </div>

          {/* Photo receipt */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Фото чеку <span className="text-neutral-400">(опційно)</span></label>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Чек" className="w-full h-32 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700" />
                <button onClick={() => setPhoto(undefined)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                  <Icon d={icons.close} className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-400 transition-all text-sm">
                <Icon d={icons.camera} className="w-4 h-4" />
                Додати фото чеку
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Repeat */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Повторювана <span className="text-neutral-400 font-normal text-xs">(опційно)</span></p>
                <p className="text-xs text-neutral-400 mt-0.5">Автоматично додавати щомісяця або щотижня</p>
              </div>
              <button onClick={() => setRepeat((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${repeat ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${repeat ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {repeat && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                {(["monthly", "weekly"] as const).map((p) => (
                  <button key={p} onClick={() => setRepeatPeriod(p)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      repeatPeriod === p
                        ? "bg-orange-100 dark:bg-orange-950/30 text-orange-500"
                        : "bg-white dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700"
                    }`}>
                    {p === "monthly" ? "Щомісяця" : "Щотижня"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button onClick={handleSubmit}
            className={`w-full py-3.5 rounded-xl text-white text-sm font-bold transition-colors ${
              type === "expense" ? "bg-red-500 hover:bg-red-600"
              : type === "income" ? "bg-green-500 hover:bg-green-600"
              : "bg-blue-500 hover:bg-blue-600"
            }`}>
            {editTx ? "Зберегти зміни"
              : type === "expense" ? "Додати витрату"
              : type === "income" ? "Додати дохід"
              : "Зберегти переказ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────
function TxRow({ tx, onEdit, onDelete }: { tx: Transaction; onEdit: () => void; onDelete: () => void }) {
  const cat = getCat(tx.type, tx.category);
  const isExpense = tx.type === "expense";
  const isTransfer = tx.type === "transfer";

  return (
    <div className="group flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
        isTransfer ? "bg-blue-50 dark:bg-blue-950/30"
        : isExpense ? "bg-red-50 dark:bg-red-950/20"
        : "bg-green-50 dark:bg-green-950/20"
      }`}>
        {cat.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {tx.note || cat.label}
          </p>
          {tx.repeat && <span title="Повторювана"><Icon d={icons.repeat} className="w-3 h-3 text-orange-400 shrink-0" /></span>}
          {tx.photo && <span className="text-xs shrink-0" title="Є фото чеку">📎</span>}
        </div>
        <p className="text-xs text-neutral-400 mt-0.5">
          {isTransfer ? `${tx.account} → ${tx.accountTo}` : `${tx.account} · ${cat.label}`}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <p className={`text-sm font-bold tabular-nums ${
          isTransfer ? "text-blue-500" : isExpense ? "text-red-500" : "text-green-500"
        }`}>
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

// ─── PAGE ─────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>(MOCK);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | undefined>();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TxType | "all">("all");
  const [filterAccount, setFilterAccount] = useState("all");

  function addOrUpdate(tx: Transaction) {
    setTxs((prev) => {
      const exists = prev.find((t) => t.id === tx.id);
      return exists ? prev.map((t) => t.id === tx.id ? tx : t) : [tx, ...prev];
    });
  }

  function deleteTx(id: string) {
    setTxs((prev) => prev.filter((t) => t.id !== id));
  }

  const filtered = txs.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterAccount !== "all" && tx.account !== filterAccount) return false;
    if (search) {
      const q = search.toLowerCase();
      const cat = getCat(tx.type, tx.category);
      if (!tx.note.toLowerCase().includes(q) && !cat.label.toLowerCase().includes(q) && !tx.account.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grouped = groupByDate(filtered);
  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-5 pb-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Транзакції</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Всі доходи та витрати</p>
        </div>
        <button onClick={() => { setEditTx(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
          <Icon d={icons.plus} className="w-4 h-4" />
          Додати
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Доходи", value: fmt(totalIncome), color: "text-green-500" },
          { label: "Витрати", value: fmt(totalExpense), color: "text-red-500" },
          { label: "Різниця", value: (balance >= 0 ? "+" : "−") + fmt(Math.abs(balance)), color: balance >= 0 ? "text-orange-500" : "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <p className={`text-base font-bold ${color} tabular-nums`}>{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 space-y-3">
        <div className="relative">
          <Icon d={icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за назвою, категорією, рахунком..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {(["all", "expense", "income", "transfer"] as const).map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterType === t ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400"
                }`}>
                {t === "all" ? "Всі" : t === "expense" ? "Витрати" : t === "income" ? "Доходи" : "Перекази"}
              </button>
            ))}
          </div>
          <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-orange-300 transition-all">
            <option value="all">Всі рахунки</option>
            {ACCOUNTS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Транзакцій не знайдено</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, dayTxs]) => {
            const dayTotal = dayTxs.reduce((sum, tx) =>
              tx.type === "expense" ? sum - tx.amount : tx.type === "income" ? sum + tx.amount : sum, 0);
            return (
              <div key={date} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/20">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{formatDate(date)}</span>
                  <span className={`text-xs font-bold tabular-nums ${dayTotal >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {dayTotal >= 0 ? "+" : "−"}{fmt(Math.abs(dayTotal))}
                  </span>
                </div>
                <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {dayTxs.map((tx) => (
                    <TxRow key={tx.id} tx={tx}
                      onEdit={() => { setEditTx(tx); setShowModal(true); }}
                      onDelete={() => deleteTx(tx.id)}
                    />
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
          onAdd={addOrUpdate}
          editTx={editTx}
        />
      )}
    </div>
  );
}