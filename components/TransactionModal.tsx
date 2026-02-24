"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────
type TxType = "expense" | "income" | "transfer";

export interface Transaction {
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

function uid() { return Math.random().toString(36).slice(2, 9); }

const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

interface Props {
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
  editTx?: Transaction;
}

export default function TransactionModal({ onClose, onAdd, editTx }: Props) {
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

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between z-10">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {editTx ? "Редагувати транзакцію" : "Нова транзакція"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            <Icon d="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
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
                className="px-3 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-medium focus:outline-none transition-all">
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

          {/* Photo */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Фото чеку <span className="text-neutral-400 font-normal">(опційно)</span>
            </label>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Чек" className="w-full h-32 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700" />
                <button onClick={() => setPhoto(undefined)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                  <Icon d="M6 18L18 6M6 6l12 12" className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-400 transition-all text-sm">
                <Icon d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4" />
                Додати фото чеку
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Repeat */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Повторювана <span className="text-neutral-400 font-normal text-xs">(опційно)</span>
                </p>
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