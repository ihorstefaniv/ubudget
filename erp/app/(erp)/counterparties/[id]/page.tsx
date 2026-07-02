"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card, CardHeader, Tabs, Input, Select, Button, Badge, Modal,
  EmptyState, Spinner, InfoBox, Icon, icons,
} from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CPFull {
  id: string; company_id: string; name: string; type: string;
  phone: string | null; email: string | null; address: string | null;
  tax_code: string | null; bank_name: string | null; bank_iban: string | null;
  payment_terms: string | null; notes: string | null;
}
interface Contact {
  id: string; name: string; position: string | null;
  phone: string | null; email: string | null; is_primary: boolean;
}
interface Contract {
  id: string; title: string; number: string | null;
  start_date: string | null; end_date: string | null;
  notify_days_before: number; notes: string | null;
}

type DetailTab = "info" | "contacts" | "contracts" | "documents" | "invoices";

// ─── Constants ────────────────────────────────────────────────────────────────

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "info",      label: "Інфо"      },
  { id: "contacts",  label: "Контакти"  },
  { id: "contracts", label: "Договори"  },
  { id: "documents", label: "Документи" },
  { id: "invoices",  label: "Рахунки"   },
];

const TYPE_OPTIONS = [
  { value: "supplier", label: "Постачальник" },
  { value: "buyer",    label: "Покупець"     },
  { value: "both",     label: "Обидва"       },
];

const PAYMENT_OPTIONS = [
  { value: "prepayment", label: "Передоплата"     },
  { value: "net7",       label: "Net 7 (7 днів)"  },
  { value: "net14",      label: "Net 14 (14 днів)" },
  { value: "net30",      label: "Net 30 (30 днів)" },
  { value: "net60",      label: "Net 60 (60 днів)" },
  { value: "postpayment", label: "Постоплата"     },
];

const TYPE_META: Record<string, { label: string; color: "blue" | "green" | "orange" }> = {
  supplier: { label: "Постачальник", color: "blue"   },
  buyer:    { label: "Покупець",     color: "green"  },
  both:     { label: "Обидва",       color: "orange" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function contractStatus(end_date: string | null, notify_days: number) {
  if (!end_date) return "indefinite";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end   = new Date(end_date);
  const warn  = new Date(today); warn.setDate(warn.getDate() + notify_days);
  if (end < today) return "expired";
  if (end <= warn)  return "expiring";
  return "active";
}

const CONTRACT_STATUS: Record<string, { label: string; color: "green" | "orange" | "red" | "blue" }> = {
  active:     { label: "Активний",      color: "green"  },
  expiring:   { label: "Закінчується",  color: "orange" },
  expired:    { label: "Завершений",    color: "red"    },
  indefinite: { label: "Безстроковий",  color: "blue"   },
};

function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CounterpartyPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [tab,     setTab]     = useState<DetailTab>("info");
  const [loading, setLoading] = useState(true);
  const [cp,      setCp]      = useState<CPFull | null>(null);
  const [saving,  setSaving]  = useState(false);

  // info form
  const [form, setForm] = useState<Partial<CPFull>>({});
  const f = (k: keyof CPFull) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  // contacts
  const [contacts,      setContacts]      = useState<Contact[]>([]);
  const [contactModal,  setContactModal]  = useState(false);
  const [contactForm,   setContactForm]   = useState({ name: "", position: "", phone: "", email: "" });
  const [contactSaving, setContactSaving] = useState(false);

  // contracts
  const [contracts,      setContracts]      = useState<Contract[]>([]);
  const [contractModal,  setContractModal]  = useState(false);
  const [contractForm,   setContractForm]   = useState({ title: "", number: "", start_date: "", end_date: "", notify_days_before: "30", notes: "" });
  const [contractSaving, setContractSaving] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    const [{ data: cpData }, { data: ctData }, { data: conData }] = await Promise.all([
      supabase.from("erp_counterparties").select("*").eq("id", id).single(),
      supabase.from("erp_counterparty_contacts").select("id, name, position, phone, email, is_primary").eq("counterparty_id", id).order("is_primary", { ascending: false }),
      supabase.from("erp_counterparty_contracts").select("id, title, number, start_date, end_date, notify_days_before, notes").eq("counterparty_id", id).order("created_at", { ascending: false }),
    ]);
    if (cpData) { setCp(cpData); setForm(cpData); }
    setContacts(ctData ?? []);
    setContracts(conData ?? []);
    setLoading(false);
  }, [id]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  async function saveInfo() {
    if (!cp || !form.name?.trim()) return;
    setSaving(true);
    await supabase.from("erp_counterparties").update({
      name: form.name?.trim(), type: form.type, phone: form.phone || null,
      email: form.email || null, address: form.address || null,
      tax_code: form.tax_code || null, bank_name: form.bank_name || null,
      bank_iban: form.bank_iban || null, payment_terms: form.payment_terms || null,
      notes: form.notes || null,
    }).eq("id", cp.id);
    setCp(p => p ? { ...p, ...form } as CPFull : p);
    setSaving(false);
  }

  async function saveContact() {
    if (!cp || !contactForm.name.trim()) return;
    setContactSaving(true);
    const { data } = await supabase.from("erp_counterparty_contacts")
      .insert({ company_id: cp.company_id, counterparty_id: cp.id, name: contactForm.name.trim(), position: contactForm.position || null, phone: contactForm.phone || null, email: contactForm.email || null })
      .select("id, name, position, phone, email, is_primary").single();
    if (data) setContacts(p => [...p, data]);
    setContactModal(false);
    setContactForm({ name: "", position: "", phone: "", email: "" });
    setContactSaving(false);
  }

  async function deleteContact(cid: string) {
    await supabase.from("erp_counterparty_contacts").delete().eq("id", cid);
    setContacts(p => p.filter(c => c.id !== cid));
  }

  async function saveContract() {
    if (!cp || !contractForm.title.trim()) return;
    setContractSaving(true);
    const { data } = await supabase.from("erp_counterparty_contracts")
      .insert({
        company_id: cp.company_id, counterparty_id: cp.id,
        title: contractForm.title.trim(), number: contractForm.number || null,
        start_date: contractForm.start_date || null, end_date: contractForm.end_date || null,
        notify_days_before: parseInt(contractForm.notify_days_before) || 30,
        notes: contractForm.notes || null,
      })
      .select("id, title, number, start_date, end_date, notify_days_before, notes").single();
    if (data) setContracts(p => [data, ...p]);
    setContractModal(false);
    setContractForm({ title: "", number: "", start_date: "", end_date: "", notify_days_before: "30", notes: "" });
    setContractSaving(false);
  }

  async function deleteContract(cid: string) {
    await supabase.from("erp_counterparty_contracts").delete().eq("id", cid);
    setContracts(p => p.filter(c => c.id !== cid));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!cp)     return <div className="flex items-center justify-center h-64"><p className="text-neutral-400">Контрагента не знайдено</p></div>;

  const typeMeta = TYPE_META[cp.type] ?? { label: cp.type, color: "neutral" as const };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/counterparties")} className="mt-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
          <Icon d={icons.chevLeft} className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate">{cp.name}</h1>
            <Badge color={typeMeta.color}>{typeMeta.label}</Badge>
          </div>
          {cp.tax_code && <p className="text-sm text-neutral-400 mt-0.5">ЄДРПОУ: {cp.tax_code}</p>}
        </div>
      </div>

      <Tabs tabs={DETAIL_TABS} active={tab} onChange={t => setTab(t as DetailTab)} variant="underline" />

      {/* ─── Info ─── */}
      {tab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Основне" />
            <div className="space-y-4">
              <Input label="Назва *" value={form.name ?? ""} onChange={f("name")} />
              <Select label="Тип" value={form.type ?? "supplier"} onChange={f("type")} options={TYPE_OPTIONS} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Телефон" value={form.phone ?? ""} onChange={f("phone")} placeholder="+380..." />
                <Input label="Email"   value={form.email ?? ""} onChange={f("email")} placeholder="info@..." />
              </div>
              <Input label="Адреса"        value={form.address  ?? ""} onChange={f("address")}  placeholder="м. Київ, вул. ..." />
              <Input label="ЄДРПОУ / ІПН" value={form.tax_code ?? ""} onChange={f("tax_code")} placeholder="12345678" />
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Банківські реквізити" />
              <div className="space-y-4">
                <Input label="Назва банку" value={form.bank_name ?? ""} onChange={f("bank_name")} placeholder="АТ «ПриватБанк»" />
                <Input label="IBAN"        value={form.bank_iban ?? ""} onChange={f("bank_iban")} placeholder="UA..." />
              </div>
            </Card>

            <Card>
              <CardHeader title="Умови та примітки" />
              <div className="space-y-4">
                <Select
                  label="Умови оплати"
                  value={form.payment_terms ?? ""}
                  onChange={f("payment_terms")}
                  options={[{ value: "", label: "Не вказано" }, ...PAYMENT_OPTIONS]}
                />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Примітки</label>
                  <textarea
                    value={form.notes ?? ""}
                    onChange={f("notes")}
                    rows={3}
                    placeholder="Додаткова інформація..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
                  />
                </div>
              </div>
            </Card>

            <Button loading={saving} onClick={saveInfo} disabled={!form.name?.trim()} icon={icons.save}>
              Зберегти
            </Button>
          </div>
        </div>
      )}

      {/* ─── Contacts ─── */}
      {tab === "contacts" && (
        <Card>
          <CardHeader
            title="Контактні особи"
            action={<Button size="sm" icon={icons.plus} onClick={() => setContactModal(true)}>Додати</Button>}
          />
          {contacts.length === 0 ? (
            <EmptyState emoji="👤" title="Контактів ще немає" desc="Додайте менеджера, бухгалтера або іншу контактну особу" compact />
          ) : (
            <div className="space-y-2 mt-3">
              {contacts.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 group">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500 text-sm font-bold shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{c.name}</p>
                      {c.is_primary && <Badge color="orange">Основний</Badge>}
                    </div>
                    <p className="text-xs text-neutral-400 truncate">
                      {[c.position, c.phone, c.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button onClick={() => deleteContact(c.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all shrink-0">
                    <Icon d={icons.trash} className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Contracts ─── */}
      {tab === "contracts" && (
        <Card>
          <CardHeader
            title="Договори"
            action={<Button size="sm" icon={icons.plus} onClick={() => setContractModal(true)}>Додати договір</Button>}
          />
          {contracts.length === 0 ? (
            <EmptyState emoji="📄" title="Договорів ще немає" desc="Додайте договір, щоб відстежувати терміни" compact />
          ) : (
            <div className="space-y-3 mt-3">
              {contracts.map(c => {
                const status = contractStatus(c.end_date, c.notify_days_before);
                const { label, color } = CONTRACT_STATUS[status];
                const days = daysUntil(c.end_date);
                return (
                  <div key={c.id} className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{c.title}</p>
                          {c.number && <span className="text-xs text-neutral-400">№{c.number}</span>}
                          <Badge color={color}>{label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                          {c.start_date && <span>З {new Date(c.start_date).toLocaleDateString("uk-UA")}</span>}
                          {c.end_date   && <span>До {new Date(c.end_date).toLocaleDateString("uk-UA")}</span>}
                          {days !== null && days > 0 && days <= c.notify_days_before && (
                            <span className="text-orange-500 font-medium">⚠ {days} дн.</span>
                          )}
                          {days !== null && days < 0 && (
                            <span className="text-red-400 font-medium">Прострочено {Math.abs(days)} дн.</span>
                          )}
                        </div>
                        {c.notes && <p className="text-xs text-neutral-400 mt-1">{c.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => alert("Завантаження файлів — незабаром (потребує Supabase Storage)")}
                          className="text-xs text-neutral-400 hover:text-orange-400 transition-colors border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1"
                        >
                          📎 Файл
                        </button>
                        <button onClick={() => deleteContract(c.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all">
                          <Icon d={icons.trash} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ─── Documents ─── */}
      {tab === "documents" && (
        <Card>
          <CardHeader title="Документи" />
          <InfoBox variant="blue">
            Завантаження документів — незабаром. Буде підтримка PDF, фото накладних, актів.
          </InfoBox>
        </Card>
      )}

      {/* ─── Invoices ─── */}
      {tab === "invoices" && (
        <Card>
          <CardHeader
            title="Рахунки та накладні"
            action={
              <Button size="sm" variant="secondary" onClick={() => alert("Генерація рахунку — незабаром")}>
                Створити рахунок
              </Button>
            }
          />
          <InfoBox variant="blue">
            Рахунки та накладні будуть доступні після підключення модуля Фінанси.
          </InfoBox>
        </Card>
      )}

      {/* ─── Contact Modal ─── */}
      {contactModal && (
        <Modal title="Нова контактна особа" onClose={() => setContactModal(false)} size="sm">
          <div className="space-y-4">
            <Input label="ПІБ *"     value={contactForm.name}     onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}     placeholder="Іванов Іван" />
            <Input label="Посада"    value={contactForm.position} onChange={e => setContactForm(p => ({ ...p, position: e.target.value }))} placeholder="Менеджер" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Телефон" value={contactForm.phone}    onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}    placeholder="+380..." />
              <Input label="Email"   value={contactForm.email}    onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}    placeholder="..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setContactModal(false)}>Скасувати</Button>
              <Button loading={contactSaving} onClick={saveContact} disabled={!contactForm.name.trim()}>Додати</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Contract Modal ─── */}
      {contractModal && (
        <Modal title="Новий договір" onClose={() => setContractModal(false)}>
          <div className="space-y-4">
            <Input label="Назва *"     value={contractForm.title}  onChange={e => setContractForm(p => ({ ...p, title: e.target.value }))}  placeholder="Договір постачання №..." />
            <Input label="Номер"       value={contractForm.number} onChange={e => setContractForm(p => ({ ...p, number: e.target.value }))} placeholder="2024-001" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Дата початку" type="date" value={contractForm.start_date} onChange={e => setContractForm(p => ({ ...p, start_date: e.target.value }))} />
              <Input label="Дата кінця"  type="date" value={contractForm.end_date}   onChange={e => setContractForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
            <Input
              label="Нагадати за (днів до закінчення)"
              type="number"
              value={contractForm.notify_days_before}
              onChange={e => setContractForm(p => ({ ...p, notify_days_before: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Примітки</label>
              <textarea
                value={contractForm.notes}
                onChange={e => setContractForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition"
                placeholder="Умови, деталі..."
              />
            </div>
            <InfoBox variant="blue">Завантаження файлу договору — незабаром</InfoBox>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setContractModal(false)}>Скасувати</Button>
              <Button loading={contractSaving} onClick={saveContract} disabled={!contractForm.title.trim()}>Зберегти договір</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
