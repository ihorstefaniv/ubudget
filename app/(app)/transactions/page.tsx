"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Button, Toggle } from "@/components/ui";
import { fmt, dateLabel } from "@/lib/format";
import { TX_CATEGORIES, getTxCategory } from "@/lib/category-registry";

// ─── Types ────────────────────────────────────────────────────

type TxType = "expense" | "income" | "transfer";

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  exchange_rate: number;        // UAH за 1 одиницю валюти
  to_account_id: string | null; // для переказів
  to_amount?: number | null;    // сума яку отримує to_account (може відрізнятись при різних валютах)
  category_key: string;
  account_id: string | null;
  transaction_date: string;
  note: string;
  receipt_url?: string | null;
  is_recurring: boolean;
  recurring_interval?: "monthly" | "weekly" | null;
}

interface Account { id: string; name: string; currency: string; icon?: string; is_archived?: boolean; }

// ─── Helpers ──────────────────────────────────────────────────

const CATEGORIES = TX_CATEGORIES;
const CURRENCIES = ["UAH", "USD", "EUR", "PLN"];

/** Еквівалент у гривнях */
function toUAH(tx: Pick<Transaction, "amount" | "currency" | "exchange_rate">) {
  return tx.currency === "UAH" ? tx.amount : tx.amount * (tx.exchange_rate || 1);
}

function groupByDate(txs: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  txs.forEach(tx => {
    if (!groups[tx.transaction_date]) groups[tx.transaction_date] = [];
    groups[tx.transaction_date].push(tx);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function getCat(type: TxType, key: string) { return getTxCategory(type, key); }

import { fetchNbuRates, rateFor, FALLBACK_RATES as NBU_FALLBACK } from "@/lib/nbu-rates";
const DEFAULT_RATES: Record<string, number> = NBU_FALLBACK;

// ─── Add/Edit Modal ───────────────────────────────────────────

function AddModal({ onClose, onSave, editTx, accounts }: {
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id">) => Promise<void>;
  editTx?: Transaction;
  accounts: Account[];
}) {
  const firstAcc = accounts[0];

  const [type, setType]           = useState<TxType>(editTx?.type ?? "expense");
  const [amount, setAmount]       = useState(editTx?.amount.toString() ?? "");
  const [currency, setCurrency]   = useState(editTx?.currency ?? firstAcc?.currency ?? "UAH");
  const [exchangeRate, setExchangeRate] = useState(editTx?.exchange_rate ?? 1);
  const [category, setCategory]   = useState(editTx?.category_key ?? "");
  const [accountId, setAccountId] = useState(editTx?.account_id ?? firstAcc?.id ?? "");
  const [toAccountId, setToAccountId] = useState<string>(
    editTx?.to_account_id ?? accounts.find(a => a.id !== (editTx?.account_id ?? firstAcc?.id))?.id ?? ""
  );
  const [date, setDate]           = useState(editTx?.transaction_date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote]           = useState(editTx?.note ?? "");
  const [repeat, setRepeat]       = useState(editTx?.is_recurring ?? false);
  const [repeatPeriod, setRepeatPeriod] = useState<"monthly" | "weekly">(editTx?.recurring_interval ?? "monthly");
  const [photo, setPhoto]         = useState<string | null>(editTx?.receipt_url ?? null);
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [pbRates, setPbRates]     = useState<Record<string, number>>(DEFAULT_RATES);
  const [nbuLoaded, setNbuLoaded] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Курси НБУ
  useEffect(() => {
    fetchNbuRates().then(r => { setPbRates(r); setNbuLoaded(true); }).catch(() => {});
  }, []);

  const fromAccount = useMemo(() => accounts.find(a => a.id === accountId), [accounts, accountId]);
  const toAccount   = useMemo(() => accounts.find(a => a.id === toAccountId), [accounts, toAccountId]);
  const accCurrency = fromAccount?.currency ?? "UAH";
  const toCurrency  = toAccount?.currency ?? "UAH";

  // Автоматично встановлюємо валюту при зміні рахунку (тільки нова транзакція)
  useEffect(() => {
    if (editTx) return;
    const acc = accounts.find(a => a.id === accountId);
    if (acc) setCurrency(acc.currency);
  }, [accountId]); // eslint-disable-line

  // Курс при зміні валюти (і для нових, і для редагування)
  useEffect(() => {
    setExchangeRate(rateFor(pbRates,currency));
  }, [currency]); // eslint-disable-line

  // Курс при завантаженні ПриватБанку — тільки нова транзакція (не перебивати збережений)
  useEffect(() => {
    if (editTx) return;
    if (currency !== "UAH") setExchangeRate(rateFor(pbRates,currency));
  }, [pbRates]); // eslint-disable-line

  // Автоматично вибираємо "на рахунок" при переключенні на переказ
  useEffect(() => {
    if (type === "transfer" && !toAccountId) {
      const other = accounts.find(a => a.id !== accountId);
      if (other) setToAccountId(other.id);
    }
  }, [type]); // eslint-disable-line

  const cats = type === "expense" ? CATEGORIES.expense : CATEGORIES.income;

  // Показувати поле курсу якщо валюта ≠ UAH або переказ між різними валютами
  const showRate = currency !== "UAH" || (type === "transfer" && toCurrency !== accCurrency);

  // Для переказу між різними валютами — розраховуємо суму отримання
  const receivedAmount = useMemo(() => {
    if (type !== "transfer" || !amount || toCurrency === currency) return null;
    const uah = +amount * exchangeRate;
    if (toCurrency === "UAH") return { amount: uah, currency: "UAH" };
    const toRate = rateFor(pbRates,toCurrency);
    return { amount: uah / toRate, currency: toCurrency };
  }, [type, amount, currency, toCurrency, exchangeRate, pbRates]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!amount || isNaN(+amount) || +amount <= 0) { setError("Введіть суму"); return; }
    if (type !== "transfer" && !category)           { setError("Оберіть категорію"); return; }
    if (!accountId)                                 { setError("Оберіть рахунок"); return; }
    if (type === "transfer" && !toAccountId)        { setError("Оберіть рахунок отримувача"); return; }
    if (type === "transfer" && toAccountId === accountId) { setError("Рахунки мають різнятись"); return; }
    setSaving(true);
    try {
      await onSave({
        type,
        amount: +amount,
        currency,
        exchange_rate: exchangeRate,
        to_account_id: type === "transfer" ? toAccountId : null,
        category_key: type === "transfer" ? "transfer" : category,
        account_id: accountId || null,
        transaction_date: date,
        note,
        receipt_url: photo,
        is_recurring: repeat,
        recurring_interval: repeat ? repeatPeriod : null,
      });
      onClose();
    } catch {
      setError("Помилка збереження. Спробуйте ще раз.");
      setSaving(false);
    }
  }

  const submitColors = {
    expense:  "bg-red-500 hover:bg-red-600",
    income:   "bg-green-500 hover:bg-green-600",
    transfer: "bg-blue-500 hover:bg-blue-600",
  };
  const submitLabels = {
    expense:  editTx ? "Зберегти зміни" : "Додати витрату",
    income:   editTx ? "Зберегти зміни" : "Додати дохід",
    transfer: editTx ? "Зберегти зміни" : "Зберегти переказ",
  };

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

          {/* Тип */}
          <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {(["expense", "income", "transfer"] as TxType[]).map(t => (
              <button key={t} onClick={() => { setType(t); setCategory(""); }}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  type === t
                    ? t === "expense" ? "bg-white dark:bg-neutral-900 text-red-500 shadow-sm"
                    : t === "income"  ? "bg-white dark:bg-neutral-900 text-green-500 shadow-sm"
                    :                   "bg-white dark:bg-neutral-900 text-blue-500 shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}>
                {t === "expense" ? "Витрата" : t === "income" ? "Дохід" : "Переказ"}
              </button>
            ))}
          </div>

          {/* Сума + валюта */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Сума *</label>
            <div className="flex gap-2">
              <input
                type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00" autoFocus
                className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xl font-bold placeholder:text-neutral-300 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all"
              />
              {/* Якщо рахунок має власну валюту — блокуємо вибір, показуємо бейдж */}
              {accCurrency !== "UAH" ? (
                <div className="px-3 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium min-w-[60px] text-center">
                  {accCurrency}
                </div>
              ) : (
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="px-3 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-medium focus:outline-none focus:border-orange-300 transition-all">
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              )}
            </div>

            {/* Курс обміну */}
            {showRate && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-neutral-400 shrink-0">
                  1 {currency} =
                </span>
                <input
                  type="number" value={exchangeRate}
                  onChange={e => setExchangeRate(+e.target.value)}
                  step="0.01" min="0"
                  className="w-24 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-300 transition-all"
                />
                <span className="text-xs text-neutral-400">UAH</span>
                {amount && +amount > 0 && (
                  <span className="text-xs text-neutral-400 ml-1">
                    ≈ {fmt(+amount * exchangeRate, "UAH", 0)}
                  </span>
                )}
                <span className="text-[10px] text-neutral-300 dark:text-neutral-600 ml-auto shrink-0">
                  {nbuLoaded ? "курс НБУ" : "НБУ…"}
                </span>
              </div>
            )}

            {/* Інфо для переказу з обміном */}
            {receivedAmount && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-xs text-blue-600 dark:text-blue-400">
                <span>Отримає:</span>
                <span className="font-bold">{fmt(receivedAmount.amount, receivedAmount.currency)}</span>
              </div>
            )}
          </div>

          {/* Категорія */}
          {type !== "transfer" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Категорія *</label>
              <div className="grid grid-cols-4 gap-2">
                {cats.map(c => (
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

          {/* Рахунки */}
          <div className={`grid gap-3 ${type === "transfer" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {type === "transfer" ? "З рахунку *" : "Рахунок *"}
              </label>
              {accounts.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                  <span className="text-amber-500 text-lg shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Немає рахунків</p>
                    <a href="/accounts" className="text-xs text-amber-600 dark:text-amber-500 underline underline-offset-2">Додати рахунок →</a>
                  </div>
                </div>
              ) : (
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all">
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.icon ? `${a.icon} ` : ""}{a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {type === "transfer" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">На рахунок *</label>
                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all">
                  {accounts.filter(a => a.id !== accountId).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.icon ? `${a.icon} ` : ""}{a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Дата + нотатка */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Нотатка</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Опис..."
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all" />
            </div>
          </div>

          {/* Фото чеку */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Фото чеку <span className="text-neutral-400">(опційно)</span>
            </label>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Чек" className="w-full h-32 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700" />
                <button onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                  <Icon d={icons.close} className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-400 transition-all text-sm">
                <Icon d={icons.plus} className="w-4 h-4" />
                Додати фото чеку
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Повторювана */}
          {type !== "transfer" && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Повторювана <span className="text-neutral-400 font-normal text-xs">(опційно)</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">Автоматично додавати щомісяця або щотижня</p>
                </div>
                <Toggle checked={repeat} onChange={setRepeat} />
              </div>
              {repeat && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                  {(["monthly", "weekly"] as const).map(p => (
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
          )}

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button onClick={handleSubmit} disabled={saving}
            className={`w-full py-3.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 ${submitColors[type]}`}>
            {saving ? "Зберігаємо..." : submitLabels[type]}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────

function TxRow({ tx, accounts, onEdit, onDelete }: {
  tx: Transaction;
  accounts: Account[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat        = getCat(tx.type, tx.category_key);
  const isExpense  = tx.type === "expense";
  const isTransfer = tx.type === "transfer";

  const fromAccount = accounts.find(a => a.id === tx.account_id);
  const toAccount   = accounts.find(a => a.id === tx.to_account_id);

  const accountLabel = isTransfer && toAccount
    ? `${fromAccount?.name ?? "?"} → ${toAccount.name}`
    : fromAccount?.name ?? "";

  const iconBg = isTransfer
    ? "bg-blue-50 dark:bg-blue-950/30"
    : isExpense
    ? "bg-red-50 dark:bg-red-950/20"
    : "bg-green-50 dark:bg-green-950/20";

  const amountColor = isTransfer ? "text-blue-500" : isExpense ? "text-red-500" : "text-green-500";

  // Показуємо суму в рідній валюті + UAH еквівалент якщо різна
  const amountStr = isExpense ? "−" : isTransfer ? "" : "+";
  const mainAmt   = `${amountStr}${fmt(tx.amount, tx.currency)}`;
  const uahHint   = tx.currency !== "UAH" && tx.exchange_rate > 0
    ? `≈ ${fmt(tx.amount * tx.exchange_rate, "UAH", 0)}`
    : null;

  return (
    <div className="group flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${iconBg}`}>
        {cat.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {tx.note || cat.label}
          </p>
          {tx.is_recurring && (
            <span title="Повторювана">
              <Icon d={icons.refresh} className="w-3 h-3 text-orange-400 shrink-0" />
            </span>
          )}
          {tx.receipt_url && <span className="text-xs shrink-0" title="Є фото чеку">📎</span>}
        </div>
        <p className="text-xs text-neutral-400 mt-0.5 truncate">
          {accountLabel}{accountLabel && cat.label ? " · " : ""}{isTransfer ? "" : cat.label}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className={`text-sm font-bold tabular-nums ${amountColor}`}>{mainAmt}</p>
          {uahHint && <p className="text-[10px] text-neutral-400 tabular-nums">{uahHint}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
            <Icon d={icons.edit} className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
            <Icon d={icons.trash} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function TransactionsPage() {
  const supabase = createClient();

  const [txs, setTxs]             = useState<Transaction[]>([]);
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx]       = useState<Transaction | undefined>();
  const [search, setSearch]       = useState("");
  const [filterType, setFilterType]       = useState<TxType | "all">("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthStart = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-01`;
  const monthEnd   = new Date(viewMonth.year, viewMonth.month + 1, 0).toISOString().slice(0, 10);

  function prevMonth() {
    setViewMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  }
  function nextMonth() {
    setViewMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const start = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-01`;
      const end   = new Date(viewMonth.year, viewMonth.month + 1, 0).toISOString().slice(0, 10);

      const [{ data: txData }, { data: accsData }] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, type, amount, currency, exchange_rate, to_account_id, category_key, account_id, transaction_date, note, receipt_url, is_recurring, recurring_interval")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .gte("transaction_date", start)
          .lte("transaction_date", end)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("accounts")
          .select("id, name, currency, icon, is_archived")
          .eq("user_id", user.id)
          .order("name"),
      ]);

      setTxs((txData ?? []).map(row => ({
        id:               row.id,
        type:             row.type as TxType,
        amount:           Number(row.amount),
        currency:         row.currency ?? "UAH",
        exchange_rate:    Number(row.exchange_rate ?? 1),
        to_account_id:    row.to_account_id ?? null,
        category_key:     row.category_key ?? "other",
        account_id:       row.account_id ?? null,
        transaction_date: row.transaction_date ?? new Date().toISOString().slice(0, 10),
        note:             row.note ?? "",
        receipt_url:      row.receipt_url ?? null,
        is_recurring:     row.is_recurring ?? false,
        recurring_interval: (row.recurring_interval as "monthly" | "weekly" | null) ?? null,
      })));

      setAccounts(accsData ?? []);
    } catch {
      // якщо запит впав — показуємо порожній список, а не вічний спінер
    }
    setLoading(false);
  }, [viewMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Розраховує суму яку отримує to_account при переказі (зберігається в to_amount для DB-тригера)
  function calcToAmount(tx: Omit<Transaction, "id">, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return tx.amount;
    if (toCurrency === "UAH") return tx.amount * tx.exchange_rate;
    if (fromCurrency === "UAH") return tx.amount / tx.exchange_rate;
    return tx.amount * tx.exchange_rate;
  }

  async function handleSave(data: Omit<Transaction, "id">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Для переказів між рахунками зберігаємо to_amount — DB-тригер оновить баланс отримувача
    let toAmount: number | null = null;
    if (data.type === "transfer" && data.to_account_id) {
      const fromAcc = accounts.find(a => a.id === data.account_id);
      const toAcc   = accounts.find(a => a.id === data.to_account_id);
      if (fromAcc && toAcc) toAmount = calcToAmount(data, fromAcc.currency, toAcc.currency);
    }

    if (editTx) {
      const { error } = await supabase
        .from("transactions")
        .update({
          type:               data.type,
          amount:             data.amount,
          currency:           data.currency,
          exchange_rate:      data.exchange_rate,
          to_account_id:      data.to_account_id,
          to_amount:          toAmount,
          category_key:       data.category_key,
          account_id:         data.account_id,
          transaction_date:   data.transaction_date,
          note:               data.note || null,
          receipt_url:        data.receipt_url || null,
          is_recurring:       data.is_recurring,
          recurring_interval: data.recurring_interval || null,
          updated_at:         new Date().toISOString(),
        })
        .eq("id", editTx.id)
        .eq("user_id", user.id);
      if (error) throw error;
      setTxs(prev => prev.map(t => t.id === editTx.id ? { id: editTx.id, ...data } : t));
    } else {
      const { data: inserted, error } = await supabase
        .from("transactions")
        .insert({
          user_id:            user.id,
          type:               data.type,
          amount:             data.amount,
          currency:           data.currency,
          exchange_rate:      data.exchange_rate,
          to_account_id:      data.to_account_id,
          to_amount:          toAmount,
          category_key:       data.category_key,
          account_id:         data.account_id,
          transaction_date:   data.transaction_date,
          note:               data.note || null,
          receipt_url:        data.receipt_url || null,
          is_recurring:       data.is_recurring,
          recurring_interval: data.recurring_interval || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      setTxs(prev => [{ id: inserted.id, ...data }, ...prev]);
    }
  }

  async function deleteTx(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    setTxs(prev => prev.filter(t => t.id !== id));
  }

  const filtered = txs.filter(tx => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterAccount !== "all" && tx.account_id !== filterAccount) return false;
    if (search) {
      const q   = search.toLowerCase();
      const cat = getCat(tx.type, tx.category_key);
      const acc = accounts.find(a => a.id === tx.account_id)?.name ?? "";
      if (!tx.note.toLowerCase().includes(q) &&
          !cat.label.toLowerCase().includes(q) &&
          !acc.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Summary — все в гривневому еквіваленті
  const summaryBase = txs.filter(tx => {
    if (filterAccount !== "all" && tx.account_id !== filterAccount) return false;
    if (search) {
      const q   = search.toLowerCase();
      const cat = getCat(tx.type, tx.category_key);
      const acc = accounts.find(a => a.id === tx.account_id)?.name ?? "";
      if (!tx.note.toLowerCase().includes(q) &&
          !cat.label.toLowerCase().includes(q) &&
          !acc.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalIncome  = summaryBase.filter(t => t.type === "income").reduce((s, t) => s + toUAH(t), 0);
  const totalExpense = summaryBase.filter(t => t.type === "expense").reduce((s, t) => s + toUAH(t), 0);
  const balance      = totalIncome - totalExpense;
  const hasMultiCurrency = summaryBase.some(t => t.currency !== "UAH");

  const grouped = groupByDate(filtered);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 pb-8 max-w-4xl">

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Транзакції</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Всі доходи та витрати</p>
        </div>
        <Button icon={icons.plus} onClick={() => { setEditTx(undefined); setShowModal(true); }}>
          Додати
        </Button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 px-4 py-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
          <Icon d={icons.chevLeft} className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
            {new Date(viewMonth.year, viewMonth.month).toLocaleDateString("uk-UA", { month: "long", year: "numeric" })}
          </p>
          {viewMonth.year === new Date().getFullYear() && viewMonth.month === new Date().getMonth() && (
            <p className="text-[10px] text-orange-500 font-medium">поточний місяць</p>
          )}
        </div>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
          <Icon d={icons.chevRight} className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Доходи",  value: fmt(totalIncome),  color: "text-green-500" },
          { label: "Витрати", value: fmt(totalExpense),  color: "text-red-500" },
          { label: "Різниця", value: (balance >= 0 ? "+" : "−") + fmt(Math.abs(balance)), color: balance >= 0 ? "text-orange-500" : "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4">
            <p className={`text-base font-bold ${color} tabular-nums`}>{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {hasMultiCurrency && (
        <p className="text-[11px] text-neutral-400 -mt-3 px-1">
          * суми конвертовані за збереженим курсом на момент транзакції
        </p>
      )}

      {/* Фільтри */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 space-y-3">
        <div className="relative">
          <Icon d={icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Пошук за назвою, категорією, рахунком..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {(["all", "expense", "income", "transfer"] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterType === t
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}>
                {t === "all" ? "Всі" : t === "expense" ? "Витрати" : t === "income" ? "Доходи" : "Перекази"}
              </button>
            ))}
          </div>
          {accounts.length > 0 && (
            <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-orange-300 transition-all">
              <option value="all">Всі рахунки</option>
              {accounts.filter(a => !a.is_archived).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Список */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">
            {txs.length === 0 ? "Транзакцій ще немає — додай першу!" : "Транзакцій не знайдено"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, dayTxs]) => {
            // Денний підсумок тільки для витрат/доходів, в гривневому еквіваленті
            const financialTxs = dayTxs.filter(t => t.type !== "transfer");
            const hasFinancial = financialTxs.length > 0;
            const hasFx = financialTxs.some(t => t.currency !== "UAH");
            const dayTotal = financialTxs.reduce((sum, tx) => {
              if (tx.type === "expense") return sum - toUAH(tx);
              return sum + toUAH(tx);
            }, 0);

            return (
              <div key={date} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-800/20">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {dateLabel(date)}
                  </span>
                  {hasFinancial && (
                    <span className={`text-xs font-bold tabular-nums ${dayTotal >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {hasFx && <span className="font-normal opacity-60 mr-0.5">≈</span>}
                      {dayTotal >= 0 ? "+" : "−"}{fmt(Math.abs(dayTotal))}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                  {dayTxs.map(tx => (
                    <TxRow key={tx.id} tx={tx} accounts={accounts}
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
          onSave={handleSave}
          editTx={editTx}
          accounts={accounts.filter(a => !a.is_archived)}
        />
      )}
    </div>
  );
}
