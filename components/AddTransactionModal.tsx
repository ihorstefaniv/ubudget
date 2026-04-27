"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Toggle } from "@/components/ui";
import { TX_CATEGORIES } from "@/lib/category-registry";

type TxType = "expense" | "income" | "transfer";

interface Account { id: string; name: string; currency: string; icon?: string; }

const CURRENCIES = ["UAH", "USD", "EUR", "PLN"];

interface Props {
  onClose: () => void;
  onSaved?: () => void;
}

export default function AddTransactionModal({ onClose, onSaved }: Props) {
  const supabase = createClient();

  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [loadingAccs, setLoadingAccs]   = useState(true);

  const [type, setType]               = useState<TxType>("expense");
  const [amount, setAmount]           = useState("");
  const [currency, setCurrency]       = useState("UAH");
  const [category, setCategory]       = useState("");
  const [accountId, setAccountId]     = useState("");
  const [accountToId, setAccountToId] = useState("");
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote]               = useState("");
  const [repeat, setRepeat]           = useState(false);
  const [repeatPeriod, setRepeatPeriod] = useState<"monthly" | "weekly">("monthly");
  const [photo, setPhoto]             = useState<string | null>(null);
  const [error, setError]             = useState("");
  const [saving, setSaving]           = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadAccounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingAccs(false); return; }
      const { data } = await supabase
        .from("accounts")
        .select("id, name, currency, icon")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("name");
      const accs = data ?? [];
      setAccounts(accs);
      if (accs.length > 0) {
        setAccountId(accs[0].id);
        setAccountToId(accs[1]?.id ?? accs[0].id);
      }
      setLoadingAccs(false);
    }
    loadAccounts();
  }, []);

  const cats = type === "expense" ? TX_CATEGORIES.expense : TX_CATEGORIES.income;

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
    setSaving(true); setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизований");

      const { error: insertErr } = await supabase.from("transactions").insert({
        user_id:            user.id,
        type,
        amount:             +amount,
        currency,
        category_key:       type === "transfer" ? "transfer" : category,
        account_id:         accountId || null,
        transaction_date:   date,
        note:               note || null,
        receipt_url:        photo || null,
        is_recurring:       repeat,
        recurring_interval: repeat ? repeatPeriod : null,
      });

      if (insertErr) throw insertErr;
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Помилка збереження");
      setSaving(false);
    }
  }

  const submitColors: Record<TxType, string> = {
    expense:  "bg-red-500 hover:bg-red-600",
    income:   "bg-green-500 hover:bg-green-600",
    transfer: "bg-blue-500 hover:bg-blue-600",
  };
  const submitLabels: Record<TxType, string> = {
    expense:  "Додати витрату",
    income:   "Додати дохід",
    transfer: "Зберегти переказ",
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-100 dark:border-neutral-800 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-xl [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-transparent">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between z-10">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Нова транзакція</h2>
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
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="px-3 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-medium focus:outline-none focus:border-orange-300 transition-all">
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
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

          {/* Рахунок */}
          <div className={`grid gap-3 ${type === "transfer" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {type === "transfer" ? "З рахунку *" : "Рахунок *"}
              </label>
              {loadingAccs ? (
                <div className="h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ) : accounts.length === 0 ? (
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
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.icon ? `${a.icon} ` : ""}{a.name}</option>)}
                </select>
              )}
            </div>
            {type === "transfer" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">На рахунок *</label>
                <select value={accountToId} onChange={e => setAccountToId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all">
                  {accounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.icon ? `${a.icon} ` : ""}{a.name}</option>)}
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
              Фото чеку <span className="text-neutral-400 font-normal">(опційно)</span>
            </label>
            {photo ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button onClick={handleSubmit} disabled={saving || loadingAccs}
            className={`w-full py-3.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 ${submitColors[type]}`}>
            {saving ? "Зберігаємо..." : submitLabels[type]}
          </button>
        </div>
      </div>
    </div>
  );
}
