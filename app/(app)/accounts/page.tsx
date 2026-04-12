"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons, Input, Select, Modal, Button, ToggleRow } from "@/components/ui";
import { fmt } from "@/lib/format";

// ─── Currency helpers ─────────────────────────────────────────
interface Rates { USD: number; EUR: number; PLN: number; }
const FALLBACK_RATES: Rates = { USD: 41.5, EUR: 44.8, PLN: 10.2 };

async function fetchNbuRates(): Promise<Rates> {
  try {
    const [usdRes, eurRes, plnRes] = await Promise.all([
      fetch("https://bank.gov.ua/NBU_Exchange/exchange?valcode=USD&json"),
      fetch("https://bank.gov.ua/NBU_Exchange/exchange?valcode=EUR&json"),
      fetch("https://bank.gov.ua/NBU_Exchange/exchange?valcode=PLN&json"),
    ]);
    const [usd, eur, pln] = await Promise.all([usdRes.json(), eurRes.json(), plnRes.json()]);
    return {
      USD: usd[0]?.rate ?? FALLBACK_RATES.USD,
      EUR: eur[0]?.rate ?? FALLBACK_RATES.EUR,
      PLN: pln[0]?.rate ?? FALLBACK_RATES.PLN,
    };
  } catch {
    return FALLBACK_RATES;
  }
}

function makeToUAH(rates: Rates) {
  return (n: number, cur: string) =>
    n * (cur === "USD" ? rates.USD : cur === "EUR" ? rates.EUR : cur === "PLN" ? rates.PLN : 1);
}

// ─── Types ────────────────────────────────────────────────────

type AccType = "cash" | "banking" | "crypto" | "collections" | "property";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon?: string | null;
  is_archived: boolean;
}

interface Credit {
  id: string;
  name: string;
  type: string;
  bank?: string | null;
  total_amount?: number | null;
  remaining_amount: number;
  monthly_payment?: number | null;
  payment_day?: number | null;
  currency?: string | null;
}

interface Deposit {
  id: string;
  name?: string | null;
  bank?: string | null;
  amount: number;
  currency: string;
  interest_rate?: number | null;
  end_date?: string | null;
}

interface InvestmentCollection {
  id: string;
  name: string;
  category: string;
  expected_price: number;
  currency: string;
  status: string;
}

type ModalType = AccType | null;

// ─── Delete Confirm Modal ─────────────────────────────────────

function DeleteModal({ name, onConfirm, onCancel }: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const ready = input === "ВИДАЛИТИ";

  return (
    <Modal title="Видалити рахунок" onClose={onCancel}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center shrink-0">
          <Icon d={icons.warn} className="w-5 h-5" />
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Ви видаляєте <span className="font-medium text-neutral-800 dark:text-neutral-200">"{name}"</span>.{" "}
          Всі пов'язані транзакції будуть відв'язані. Цю дію не можна скасувати.
        </p>
      </div>
      <Input
        label='Введіть ВИДАЛИТИ для підтвердження'
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="ВИДАЛИТИ"
        className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 focus:border-red-400"
      />
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel}>Скасувати</Button>
        <Button variant="danger" fullWidth disabled={!ready} onClick={onConfirm}>Видалити</Button>
      </div>
    </Modal>
  );
}

// ─── Account Card ─────────────────────────────────────────────

function AccountCard({ name, sub, balance, currency = "UAH", badge, onDelete }: {
  name: string;
  sub: string;
  balance: number;
  currency?: string;
  badge?: string;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-900 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-base shrink-0">
          {badge ?? "💳"}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{name}</p>
          <p className="text-xs text-neutral-400">{sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {fmt(balance, currency)}
        </p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors"
          >
            <Icon d={icons.trash} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────

function Section({ title, total, currency = "UAH", onAdd, children, defaultOpen = true, addLabel = "Додати", manageHref }: {
  title: string;
  total: number;
  currency?: string;
  onAdd?: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
  addLabel?: string;
  manageHref?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon d={icons.chevDown} className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {manageHref && (
            <Link href={manageHref} onClick={e => e.stopPropagation()}
              className="text-xs text-orange-400 hover:text-orange-500 font-medium transition-colors">
              Управляти →
            </Link>
          )}
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{fmt(total, currency)}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-neutral-50 dark:border-neutral-800 pt-3">
          {children}
          {onAdd && (
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-500 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all"
            >
              <Icon d={icons.plus} className="w-4 h-4" />
              {addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SubBlock ─────────────────────────────────────────────────

function SubBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

// ─── Add Modals ───────────────────────────────────────────────

const CURRENCIES = [
  { value: "UAH", label: "UAH — Гривня" },
  { value: "USD", label: "USD — Долар" },
  { value: "EUR", label: "EUR — Євро" },
  { value: "PLN", label: "PLN — Злотий" },
];

function CashModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [name, setName]         = useState("");
  const [currency, setCurrency] = useState("UAH");
  const [balance, setBalance]   = useState("");
  const [icon, setIcon]         = useState("👛");
  const [saving, setSaving]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSave() {
    setSubmitted(true);
    if (!name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("accounts").insert({
      user_id: user.id, name: name.trim(), type: "cash",
      balance: parseFloat(balance) || 0, currency, icon,
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title="Додати готівку" onClose={onClose}>
      <Input label="Назва групи *" value={name} onChange={e => setName(e.target.value)} placeholder="Гаманець, Копілка, Сейф..."
        error={submitted && !name.trim() ? "Вкажіть назву" : undefined} />
      <Select label="Іконка" value={icon} onChange={e => setIcon(e.target.value)} options={[
        { value: "👛", label: "👛 Гаманець" },
        { value: "🏦", label: "🏦 Сейф" },
        { value: "🪙", label: "🪙 Копілка" },
        { value: "💼", label: "💼 Портфель" },
      ]} />
      <Select label="Валюта" value={currency} onChange={e => setCurrency(e.target.value)} options={CURRENCIES} />
      <Input label="Сума" type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
      <Button fullWidth onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Збереження..." : "Додати"}</Button>
    </Modal>
  );
}

function BankingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [type, setType]           = useState("debit");
  const [bank, setBank]           = useState("");
  const [accName, setAccName]     = useState("");
  const [currency, setCurrency]   = useState("UAH");
  const [balance, setBalance]     = useState("");
  const [hasService, setHasService] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const bankErr   = submitted && !bank.trim();
  const accErr    = submitted && !accName.trim();

  async function handleSave() {
    setSubmitted(true);
    const name = accName.trim() || bank.trim();
    if (!name) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("accounts").insert({
      user_id: user.id,
      name: bank.trim() ? `${bank.trim()} · ${name}` : name,
      type: "banking",
      balance: parseFloat(balance) || 0,
      currency,
      icon: type === "credit" ? "🔴" : "💳",
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title="Додати банківський рахунок" onClose={onClose}>
      <Select label="Тип рахунку" value={type} onChange={e => setType(e.target.value)} options={[
        { value: "debit",   label: "Дебетова картка" },
        { value: "credit",  label: "Кредитна картка" },
        { value: "current", label: "Поточний рахунок" },
        { value: "fop",     label: "ФОП рахунок" },
        { value: "virtual", label: "Віртуальна картка" },
      ]} />
      <Input label="Назва банку *" value={bank} onChange={e => setBank(e.target.value)} placeholder="Monobank, ПриватБанк..."
        error={bankErr ? "Вкажіть назву банку" : undefined} />
      <Input label="Назва рахунку *" value={accName} onChange={e => setAccName(e.target.value)} placeholder="Моя картка"
        error={accErr ? "Вкажіть назву рахунку" : undefined} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Баланс" type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
        <Select label="Валюта" value={currency} onChange={e => setCurrency(e.target.value)} options={CURRENCIES.slice(0, 3)} />
      </div>
      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
        <ToggleRow
          label="Плата за обслуговування"
          desc="Автоматично враховувати у витратах"
          checked={hasService}
          onChange={setHasService}
        />
      </div>
      <Button fullWidth onClick={handleSave} disabled={saving || (!bank.trim() && !accName.trim())}>{saving ? "Збереження..." : "Додати"}</Button>
    </Modal>
  );
}

function CryptoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [assetType, setAssetType] = useState("crypto");
  const [name, setName]         = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [wallet, setWallet]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSave() {
    setSubmitted(true);
    if (!name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(buyPrice) || 0;
    await supabase.from("accounts").insert({
      user_id: user.id,
      name: wallet.trim() ? `${name.trim()} · ${wallet.trim()}` : name.trim(),
      type: "crypto",
      balance: qty * price,
      currency: "USD",
      icon: assetType === "crypto" ? "₿" : "🥇",
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title="Крипто & Метали" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {[{ val: "crypto", label: "🪙 Крипто" }, { val: "metal", label: "🥇 Метали" }].map(({ val, label }) => (
          <button key={val} onClick={() => setAssetType(val)}
            className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
              assetType === val
                ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
            }`}>{label}</button>
        ))}
      </div>
      {assetType === "crypto" ? (
        <>
          <Input label="Монета / Тікер *" value={name} onChange={e => setName(e.target.value)} placeholder="Bitcoin (BTC)"
            error={submitted && !name.trim() ? "Вкажіть назву" : undefined} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Кількість" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00000000" />
            <Input label="Ціна купівлі (USD)" type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0.00" />
          </div>
          <Input label="Гаманець / Біржа (необов'язково)" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="Binance, MetaMask..." />
        </>
      ) : (
        <>
          <Input label="Метал *" value={name} onChange={e => setName(e.target.value)} placeholder="Золото, Срібло..."
            error={submitted && !name.trim() ? "Вкажіть назву" : undefined} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Кількість (грами)" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" />
            <Input label="Ціна купівлі (грн/г)" type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0.00" />
          </div>
          <Input label="Де зберігається" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="Банк, вдома..." />
        </>
      )}
      <Button fullWidth onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Збереження..." : "Додати"}</Button>
    </Modal>
  );
}

function CollectionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [name, setName]         = useState("");
  const [category, setCategory] = useState("coins");
  const [buyPrice, setBuyPrice] = useState("");
  const [saving, setSaving]     = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("accounts").insert({
      user_id: user.id,
      name: name.trim(),
      type: "collections",
      balance: parseFloat(buyPrice) || 0,
      currency: "UAH",
      icon: "🎨",
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title="Додати колекційний актив" onClose={onClose}>
      <Input label="Назва" value={name} onChange={e => setName(e.target.value)} placeholder="Монета 1 карбованець 1961р." />
      <Select label="Категорія" value={category} onChange={e => setCategory(e.target.value)} options={[
        { value: "coins",    label: "🪙 Нумізматика" },
        { value: "stamps",   label: "📮 Філателія" },
        { value: "art",      label: "🖼 Мистецтво" },
        { value: "antique",  label: "🪑 Антикваріат" },
        { value: "vinyl",    label: "🎵 Вініл" },
        { value: "military", label: "🎖 Військові артефакти" },
        { value: "other",    label: "Інше" },
      ]} />
      <Input label="Вартість (грн)" type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0.00" />
      <Button fullWidth onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Збереження..." : "Додати"}</Button>
    </Modal>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function AccountsPage() {
  const supabase = createClient();

  const [modal, setModal]             = useState<ModalType>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [credits, setCredits]           = useState<Credit[]>([]);
  const [deposits, setDeposits]         = useState<Deposit[]>([]);
  const [invCollections, setInvCollections] = useState<InvestmentCollection[]>([]);
  const [loading, setLoading]           = useState(true);
  const [rates, setRates]               = useState<Rates>(FALLBACK_RATES);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: accs }, { data: cr }, { data: dep }, { data: col }] = await Promise.all([
      supabase.from("accounts").select("id,name,type,balance,currency,icon,is_archived")
        .eq("user_id", user.id).neq("is_archived", true).order("created_at"),
      supabase.from("credits").select("id,name,type,bank,total_amount,remaining_amount,monthly_payment,payment_day,currency")
        .eq("user_id", user.id).neq("is_archived", true).order("created_at"),
      supabase.from("deposits").select("id,name,bank,amount,currency,interest_rate,end_date")
        .eq("user_id", user.id).neq("is_archived", true).order("created_at"),
      supabase.from("collections").select("id,name,category,expected_price,currency,status")
        .eq("user_id", user.id).eq("status", "owned"),
    ]);

    setAccounts(accs ?? []);
    setCredits(cr ?? []);
    setDeposits(dep ?? []);
    setInvCollections(col ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetchNbuRates().then(setRates);
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from("accounts").update({ is_archived: true }).eq("id", deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  // ─── Derived ──────────────────────────────────────────────
  const toUAH   = makeToUAH(rates);
  const byType  = (type: string) => accounts.filter(a => a.type === type);
  const sumUAH  = (arr: Account[]) => arr.reduce((s, a) => s + toUAH(Number(a.balance), a.currency), 0);

  const cashAccs        = byType("cash");
  const bankingAccs     = byType("banking");
  const cryptoAccs      = byType("crypto");
  const collectionAccs  = byType("collections");
  const propertyAccs    = byType("property");

  const totalCash        = sumUAH(cashAccs);
  const totalBanking     = sumUAH(bankingAccs);
  const totalCrypto      = sumUAH(cryptoAccs);
  // Колекції = прості рахунки + з інвестицій
  const totalCollections = sumUAH(collectionAccs) +
    invCollections.reduce((s, c) => s + toUAH(Number(c.expected_price), c.currency), 0);
  const totalProperty    = sumUAH(propertyAccs);

  const totalCredits  = credits.reduce((s, c) => s + toUAH(Number(c.remaining_amount), c.currency ?? "UAH"), 0);
  const totalDeposits = deposits.reduce((s, d) => s + toUAH(Number(d.amount), d.currency), 0);

  const netWorth = totalCash + totalBanking + totalDeposits + totalCrypto + totalCollections + totalProperty - totalCredits;

  const CREDIT_TYPE_LABELS: Record<string, string> = {
    consumer: "Споживчий", car: "Авто", mortgage: "Іпотека",
    credit_card: "Кредитна картка", installment: "Розтермінування", partpay: "Частинами",
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <Icon d={icons.loader} className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* ── Заголовок ── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Рахунки & Активи</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Повна фінансова картина</p>
      </div>

      {/* ── Net Worth ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Баланс моїх активів</p>
          <p className="text-xs text-neutral-400">
            НБУ: <span className="font-medium text-neutral-500">USD {rates.USD.toFixed(2)}</span>
            {" · "}
            <span className="font-medium text-neutral-500">EUR {rates.EUR.toFixed(2)}</span>
          </p>
        </div>
        <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-5">{fmt(netWorth)}</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: "Готівка",  val: totalCash,        color: "text-emerald-500" },
            { label: "Рахунки",  val: totalBanking,     color: "text-blue-500" },
            { label: "Депозити", val: totalDeposits,    color: "text-violet-500" },
            { label: "Борги",    val: -totalCredits,    color: "text-red-500" },
            { label: "Крипто",   val: totalCrypto,      color: "text-amber-500" },
            { label: "Колекції", val: totalCollections, color: "text-pink-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <p className={`text-sm font-bold ${color}`}>
                {val < 0 ? "−" : "+"}{fmt(Math.abs(val))}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Готівка ── */}
      <Section title="💵 Готівка" total={totalCash} onAdd={() => setModal("cash")}>
        {cashAccs.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-2">Немає готівкових рахунків</p>
        ) : cashAccs.map(a => (
          <AccountCard key={a.id} name={a.name} sub={a.currency}
            balance={Number(a.balance)} currency={a.currency}
            badge={a.icon ?? "👛"} onDelete={() => setDeleteTarget({ id: a.id, name: a.name })} />
        ))}
      </Section>

      {/* ── Банківські рахунки ── */}
      <Section title="💳 Банківські рахунки" total={totalBanking} onAdd={() => setModal("banking")}>
        {bankingAccs.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-2">Немає банківських рахунків</p>
        ) : bankingAccs.map(a => (
          <AccountCard key={a.id} name={a.name} sub={a.currency}
            balance={Number(a.balance)} currency={a.currency}
            badge={a.icon ?? "💳"} onDelete={() => setDeleteTarget({ id: a.id, name: a.name })} />
        ))}
      </Section>

      {/* ── Депозити — керуються через /credits ── */}
      <Section title="🏦 Депозити" total={totalDeposits} defaultOpen={true} manageHref="/credits?tab=deposits">
        {deposits.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs text-neutral-400 mb-2">Немає активних депозитів</p>
            <Link href="/credits?tab=deposits" className="text-xs text-orange-400 hover:text-orange-500 font-medium">
              Додати депозит →
            </Link>
          </div>
        ) : deposits.map(d => (
          <AccountCard key={d.id}
            name={d.name ?? d.bank ?? "Депозит"}
            sub={[d.bank, d.interest_rate ? `${d.interest_rate}% річних` : null, d.end_date ? `до ${new Date(d.end_date).toLocaleDateString("uk-UA")}` : null].filter(Boolean).join(" · ")}
            balance={Number(d.amount)} currency={d.currency}
            badge="📈" onDelete={() => {}} />
        ))}
        {deposits.length > 0 && (
          <Link href="/credits?tab=deposits"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-500 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all">
            <Icon d={icons.plus} className="w-4 h-4" />
            Додати депозит
          </Link>
        )}
      </Section>

      {/* ── Кредити — керуються через /credits ── */}
      <Section title="💸 Кредити & Борги" total={-totalCredits} defaultOpen={true} manageHref="/credits">
        {credits.filter(c => ["consumer", "car", "credit_card"].includes(c.type)).length === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs text-neutral-400 mb-2">Немає активних кредитів</p>
            <Link href="/credits" className="text-xs text-orange-400 hover:text-orange-500 font-medium">
              Додати кредит →
            </Link>
          </div>
        ) : credits.filter(c => ["consumer", "car", "credit_card"].includes(c.type)).map(c => (
          <AccountCard key={c.id}
            name={c.name}
            sub={[CREDIT_TYPE_LABELS[c.type], c.bank, c.monthly_payment ? `${fmt(c.monthly_payment)}/міс` : null].filter(Boolean).join(" · ")}
            balance={-Number(c.remaining_amount)} currency={c.currency ?? "UAH"}
            badge="📋" onDelete={() => {}} />
        ))}
        {credits.filter(c => ["consumer", "car", "credit_card"].includes(c.type)).length > 0 && (
          <Link href="/credits"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-500 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all">
            <Icon d={icons.plus} className="w-4 h-4" />
            Додати кредит
          </Link>
        )}
      </Section>

      {/* ── Оплата частинами ── */}
      <Section title="🛒 Оплата частинами" total={-credits.filter(c => ["installment","partpay"].includes(c.type)).reduce((s,c) => s + toUAH(Number(c.remaining_amount), c.currency ?? "UAH"), 0)} defaultOpen={false} manageHref="/credits">
        {credits.filter(c => ["installment", "partpay"].includes(c.type)).length === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs text-neutral-400 mb-2">Немає активних розтермінувань</p>
            <Link href="/credits" className="text-xs text-orange-400 hover:text-orange-500 font-medium">Додати →</Link>
          </div>
        ) : credits.filter(c => ["installment", "partpay"].includes(c.type)).map(c => (
          <AccountCard key={c.id}
            name={c.name}
            sub={[c.bank, c.monthly_payment ? `${fmt(c.monthly_payment)}/міс` : null].filter(Boolean).join(" · ")}
            balance={-Number(c.remaining_amount)} currency={c.currency ?? "UAH"}
            badge="📱" onDelete={() => {}} />
        ))}
      </Section>

      {/* ── Іпотека ── */}
      <Section title="🏠 Іпотека" total={-credits.filter(c => c.type === "mortgage").reduce((s,c) => s + toUAH(Number(c.remaining_amount), c.currency ?? "UAH"), 0)} defaultOpen={false} manageHref="/credits">
        {credits.filter(c => c.type === "mortgage").length === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs text-neutral-400 mb-2">Немає іпотеки</p>
            <Link href="/credits" className="text-xs text-orange-400 hover:text-orange-500 font-medium">Додати →</Link>
          </div>
        ) : credits.filter(c => c.type === "mortgage").map(c => (
          <AccountCard key={c.id}
            name={c.name}
            sub={[c.bank, c.monthly_payment ? `${fmt(c.monthly_payment)}/міс` : null].filter(Boolean).join(" · ")}
            balance={-Number(c.remaining_amount)} currency={c.currency ?? "UAH"}
            badge="🏠" onDelete={() => {}} />
        ))}
      </Section>

      {/* ── Крипто & Метали ── */}
      <Section title="🪙 Крипто & Метали" total={totalCrypto} onAdd={() => setModal("crypto")} defaultOpen={false} manageHref="/investments">
        {cryptoAccs.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-2">Немає крипто-активів</p>
        ) : cryptoAccs.map(a => (
          <AccountCard key={a.id} name={a.name}
            sub={a.currency}
            balance={Number(a.balance)} currency={a.currency}
            badge={a.icon ?? "₿"} onDelete={() => setDeleteTarget({ id: a.id, name: a.name })} />
        ))}
      </Section>

      {/* ── Колекції (accounts + investments) ── */}
      <Section title="🎨 Колекції" total={totalCollections} defaultOpen={false} manageHref="/investments">
        {collectionAccs.length === 0 && invCollections.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs text-neutral-400 mb-2">Немає колекційних активів</p>
            <Link href="/investments" className="text-xs text-orange-400 hover:text-orange-500 font-medium">
              Додати в Інвестиції →
            </Link>
          </div>
        ) : (
          <>
            {collectionAccs.map(a => (
              <AccountCard key={a.id} name={a.name} sub={a.currency}
                balance={Number(a.balance)} currency={a.currency}
                badge={a.icon ?? "🎨"} onDelete={() => setDeleteTarget({ id: a.id, name: a.name })} />
            ))}
            {invCollections.map(c => (
              <AccountCard key={c.id} name={c.name}
                sub={[c.category, c.currency !== "UAH" ? c.currency : null].filter(Boolean).join(" · ")}
                balance={toUAH(Number(c.expected_price), c.currency)} currency="UAH"
                badge="🎨" onDelete={() => {}} />
            ))}
          </>
        )}
        <Link href="/investments"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-500 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all">
          <Icon d={icons.plus} className="w-4 h-4" />
          Управляти колекціями
        </Link>
      </Section>

      {/* ── Модалки ── */}
      {modal === "cash"        && <CashModal        onClose={() => setModal(null)} onSaved={load} />}
      {modal === "banking"     && <BankingModal     onClose={() => setModal(null)} onSaved={load} />}
      {modal === "crypto"      && <CryptoModal      onClose={() => setModal(null)} onSaved={load} />}
      {modal === "collections" && <CollectionModal  onClose={() => setModal(null)} onSaved={load} />}

      {/* ── Підтвердження видалення ── */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
