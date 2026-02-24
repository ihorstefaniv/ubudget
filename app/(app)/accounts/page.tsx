"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────
type AccountCategory =
  | "cash" | "banking" | "deposit" | "credit"
  | "installment" | "mortgage" | "property" | "crypto" | "collections";

type ModalType = AccountCategory | null;

interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  bank?: string;
  icon?: string;
  description?: string;
  interest_rate?: number;
  end_date?: string;
  payment_day?: number;
  credit_limit?: number;
  is_archived: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number, currency = "UAH") {
  const val = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (currency === "USD") return (n < 0 ? "-" : "") + "$ " + val;
  if (currency === "EUR") return (n < 0 ? "-" : "") + "€ " + val;
  return (n < 0 ? "-" : "") + val + " грн";
}

const TYPE_LABELS: Record<string, string> = {
  cash: "💵 Готівка",
  banking: "💳 Банківські рахунки",
  deposit: "🏦 Депозити",
  credit: "💸 Кредити",
  installment: "🛒 Оплата частинами",
  mortgage: "🏠 Іпотека",
  property: "🏗 Розтермінування нерухомості",
  crypto: "🪙 Крипто & Метали",
  collections: "🎨 Колекції",
};

const TYPE_ICONS: Record<string, string> = {
  cash: "👛", banking: "💳", deposit: "📈",
  credit: "📋", installment: "📱", mortgage: "🏠",
  property: "🏗", crypto: "₿", collections: "🪙",
};

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
  chevron: "M19 9l-7 7-7-7",
  warn: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  loader: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
};

// ─── Input / Select / Toggle ──────────────────────────────────
function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</label>
      <input {...props} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all" />
    </div>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</label>
      <select {...props} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 transition-all">
        {children}
      </select>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const [input, setInput] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center shrink-0">
            <Icon d={icons.warn} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Видалити рахунок</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Ви видаляєте <span className="font-medium text-neutral-800 dark:text-neutral-200">"{name}"</span>.</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Введіть <span className="font-bold text-red-500">ВИДАЛИТИ</span>
          </label>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="ВИДАЛИТИ"
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-red-400 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={input !== "ВИДАЛИТИ"}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-100 dark:border-neutral-800 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <Icon d={icons.close} className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Add Account Modal ────────────────────────────────────────
function AddAccountModal({ type, onClose, onSaved }: { type: AccountCategory; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", bank: "", balance: "", currency: "UAH",
    interest_rate: "", end_date: "", payment_day: "", description: "",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: form.name || "Новий рахунок",
      type,
      balance: parseFloat(form.balance) || 0,
      currency: form.currency,
      bank: form.bank || null,
      icon: TYPE_ICONS[type] || "💳",
      description: form.description || null,
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
      end_date: form.end_date || null,
      payment_day: form.payment_day ? parseInt(form.payment_day) : null,
      is_archived: false,
    });

    setSaving(false);
    if (!error) { onSaved(); onClose(); }
  }

  return (
    <Modal title={`Додати · ${TYPE_LABELS[type]}`} onClose={onClose}>
      <Input label="Назва" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Назва рахунку" />
      {["banking", "deposit", "credit", "mortgage"].includes(type) && (
        <Input label="Банк" value={form.bank} onChange={e => set("bank", e.target.value)} placeholder="Monobank, ПриватБанк..." />
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input label={type === "credit" || type === "mortgage" ? "Залишок боргу" : "Баланс"} type="number"
          value={form.balance} onChange={e => set("balance", e.target.value)} placeholder="0.00" />
        <Select label="Валюта" value={form.currency} onChange={e => set("currency", e.target.value)}>
          <option value="UAH">UAH — Гривня</option>
          <option value="USD">USD — Долар</option>
          <option value="EUR">EUR — Євро</option>
          <option value="PLN">PLN — Злотий</option>
        </Select>
      </div>
      {["deposit", "credit", "mortgage", "installment"].includes(type) && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="% ставка річна" type="number" value={form.interest_rate} onChange={e => set("interest_rate", e.target.value)} placeholder="0.00" />
          <Input label="Дата закриття" type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
        </div>
      )}
      {["credit", "mortgage"].includes(type) && (
        <Input label="День платежу" type="number" value={form.payment_day} onChange={e => set("payment_day", e.target.value)} placeholder="15" />
      )}
      <Input label="Опис (необов'язково)" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Додаткова інформація..." />
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> : "Додати"}
      </button>
    </Modal>
  );
}

// ─── Edit Account Modal ───────────────────────────────────────
function EditAccountModal({ account, onClose, onSaved }: { account: Account; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: account.name || "",
    bank: account.bank || "",
    balance: String(account.balance || ""),
    currency: account.currency || "UAH",
    interest_rate: String(account.interest_rate || ""),
    end_date: account.end_date || "",
    payment_day: String(account.payment_day || ""),
    description: account.description || "",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true);
    await supabase.from("accounts").update({
      name: form.name,
      bank: form.bank || null,
      balance: parseFloat(form.balance) || 0,
      currency: form.currency,
      interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
      end_date: form.end_date || null,
      payment_day: form.payment_day ? parseInt(form.payment_day) : null,
      description: form.description || null,
    }).eq("id", account.id);
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title={`Редагувати · ${account.name}`} onClose={onClose}>
      <Input label="Назва" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Назва рахунку" />
      {["banking", "deposit", "credit", "mortgage"].includes(account.type) && (
        <Input label="Банк" value={form.bank} onChange={e => set("bank", e.target.value)} placeholder="Monobank, ПриватБанк..." />
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Баланс" type="number" value={form.balance} onChange={e => set("balance", e.target.value)} placeholder="0.00" />
        <Select label="Валюта" value={form.currency} onChange={e => set("currency", e.target.value)}>
          <option value="UAH">UAH</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="PLN">PLN</option>
        </Select>
      </div>
      {["deposit", "credit", "mortgage", "installment"].includes(account.type) && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="% ставка" type="number" value={form.interest_rate} onChange={e => set("interest_rate", e.target.value)} placeholder="0.00" />
          <Input label="Дата закриття" type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
        </div>
      )}
      {["credit", "mortgage"].includes(account.type) && (
        <Input label="День платежу" type="number" value={form.payment_day} onChange={e => set("payment_day", e.target.value)} placeholder="15" />
      )}
      <Input label="Опис" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Додаткова інформація..." />
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        {saving ? <><Icon d={icons.loader} className="w-4 h-4 animate-spin" />Зберігаємо...</> : "Зберегти"}
      </button>
    </Modal>
  );
}
function AccountCard({ account, onEdit, onDelete }: { account: Account; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-900 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-base shrink-0">
          {account.icon || TYPE_ICONS[account.type] || "💳"}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{account.name}</p>
          <p className="text-xs text-neutral-400">
            {account.bank ? `${account.bank} · ` : ""}{account.currency}
            {account.interest_rate ? ` · ${account.interest_rate}%` : ""}
            {account.end_date ? ` · до ${new Date(account.end_date).toLocaleDateString("uk-UA")}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={`text-sm font-semibold tabular-nums ${account.balance < 0 ? "text-red-500" : "text-neutral-900 dark:text-neutral-100"}`}>
          {fmt(account.balance, account.currency)}
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
            <Icon d={icons.edit} className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors">
            <Icon d={icons.trash} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────
function Section({ title, total, onAdd, children, defaultOpen = true }: {
  title: string; total: number; onAdd: () => void; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <Icon d={icons.chevron} className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{title}</span>
        </div>
        <span className={`text-sm font-semibold tabular-nums ${total < 0 ? "text-red-500" : "text-neutral-700 dark:text-neutral-300"}`}>
          {fmt(total)}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-neutral-50 dark:border-neutral-800 pt-3">
          {children}
          <button onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm hover:border-orange-300 hover:text-orange-400 transition-all">
            <Icon d={icons.plus} className="w-4 h-4" />Додати
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function AccountsPage() {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [editTarget, setEditTarget] = useState<Account | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });
    setAccounts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from("accounts").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  const byType = (type: string) => accounts.filter(a => a.type === type);
  const totalByType = (type: string) => byType(type).reduce((s, a) => s + Number(a.balance), 0);
  const netWorth = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const SECTIONS: { type: AccountCategory; defaultOpen?: boolean }[] = [
    { type: "cash" },
    { type: "banking" },
    { type: "deposit" },
    { type: "credit", defaultOpen: false },
    { type: "installment", defaultOpen: false },
    { type: "mortgage", defaultOpen: false },
    { type: "property", defaultOpen: false },
    { type: "crypto", defaultOpen: false },
    { type: "collections", defaultOpen: false },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
        <p className="text-sm text-neutral-400">Завантаження рахунків...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Рахунки & Активи</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Повна фінансова картина</p>
      </div>

      {/* Net Worth */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Баланс моїх активів</p>
        <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-5">{fmt(netWorth)}</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { label: "Готівка", types: ["cash"], color: "text-emerald-500" },
            { label: "Рахунки", types: ["banking"], color: "text-blue-500" },
            { label: "Депозити", types: ["deposit"], color: "text-violet-500" },
            { label: "Борги", types: ["credit", "mortgage", "installment", "property"], color: "text-red-500" },
            { label: "Крипто", types: ["crypto"], color: "text-amber-500" },
          ].map(({ label, types, color }) => {
            const val = types.reduce((s, t) => s + totalByType(t), 0);
            return (
              <div key={label} className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <p className={`text-sm font-bold tabular-nums ${color}`}>{val < 0 ? "-" : "+"}{fmt(Math.abs(val))}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(({ type, defaultOpen = true }) => (
        <Section key={type} title={TYPE_LABELS[type]} total={totalByType(type)}
          onAdd={() => setModal(type)} defaultOpen={defaultOpen}>
          {byType(type).length === 0
            ? <p className="text-center py-3 text-sm text-neutral-300 dark:text-neutral-600">Порожньо — додай перший рахунок</p>
            : byType(type).map(acc => (
              <AccountCard key={acc.id} account={acc}
                onEdit={() => setEditTarget(acc)}
                onDelete={() => setDeleteTarget(acc)} />
            ))
          }
        </Section>
      ))}

      {modal && <AddAccountModal type={modal} onClose={() => setModal(null)} onSaved={load} />}
      {editTarget && <EditAccountModal account={editTarget} onClose={() => setEditTarget(null)} onSaved={load} />}
      {deleteTarget && <DeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}