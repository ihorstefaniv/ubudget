"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Tabs, Input, Select, Button, Badge, Modal, EmptyState, Spinner, Icon, icons } from "@/components/ui";

type TypeFilter = "all" | "supplier" | "buyer" | "both";

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
  { id: "all",      label: "Всі"           },
  { id: "supplier", label: "Постачальники" },
  { id: "buyer",    label: "Покупці"       },
  { id: "both",     label: "Обидва"        },
];

const TYPE_OPTIONS = [
  { value: "supplier", label: "Постачальник" },
  { value: "buyer",    label: "Покупець"     },
  { value: "both",     label: "Обидва"       },
];

const TYPE_META: Record<string, { label: string; color: "blue" | "green" | "orange" }> = {
  supplier: { label: "Постачальник", color: "blue"   },
  buyer:    { label: "Покупець",     color: "green"  },
  both:     { label: "Обидва",       color: "orange" },
};

interface CP { id: string; name: string; type: string; phone: string | null; email: string | null }

const INIT = { name: "", type: "supplier", phone: "", email: "", tax_code: "" };

export default function CounterpartiesPage() {
  const router = useRouter();
  const [filter, setFilter]       = useState<TypeFilter>("all");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [items, setItems]         = useState<CP[]>([]);
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState(INIT);

  const supabase = createClient();

  const load = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("erp_counterparties")
      .select("id, name, type, phone, email")
      .eq("company_id", cid)
      .eq("is_archived", false)
      .order("name");
    setItems(data ?? []);
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: c } = await supabase.from("erp_companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
      if (c) { setCompanyId(c.id); load(c.id); } else setLoading(false);
    });
  }, []); // eslint-disable-line

  async function save() {
    if (!companyId || !form.name.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from("erp_counterparties")
      .insert({ company_id: companyId, name: form.name.trim(), type: form.type, phone: form.phone || null, email: form.email || null, tax_code: form.tax_code || null })
      .select("id")
      .single();
    setSaving(false);
    setModal(false);
    setForm(INIT);
    if (data) router.push(`/counterparties/${data.id}`);
  }

  const visible = items.filter(i =>
    (filter === "all" || i.type === filter) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Контрагенти</h1>
          <p className="text-sm text-neutral-500 mt-1">{items.length} контрагентів</p>
        </div>
        <Button icon={icons.plus} onClick={() => setModal(true)} disabled={!companyId}>Додати</Button>
      </div>

      {!companyId ? (
        <Card><EmptyState emoji="🏢" title="Спочатку створіть компанію" desc="Налаштування → Компанія" /></Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Пошук за назвою..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                suffix={<Icon d={icons.search} className="w-4 h-4 text-neutral-400" />}
              />
            </div>
            <Tabs tabs={TYPE_TABS} active={filter} onChange={t => setFilter(t as TypeFilter)} variant="pills" />
          </div>

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                emoji="🤝"
                title="Контрагентів ще немає"
                desc="Додайте першого постачальника або покупця"
                action={<Button size="sm" onClick={() => setModal(true)}>Додати контрагента</Button>}
              />
            </Card>
          ) : (
            <Card noPadding>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {visible.map(c => {
                  const meta = TYPE_META[c.type] ?? { label: c.type, color: "neutral" as const };
                  return (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/counterparties/${c.id}`)}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-orange-500">{c.name[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{c.name}</p>
                        <p className="text-xs text-neutral-400 truncate">
                          {[c.phone, c.email].filter(Boolean).join(" · ") || "Контактів не вказано"}
                        </p>
                      </div>
                      <Badge color={meta.color}>{meta.label}</Badge>
                      <Icon d={icons.chevRight} className="w-4 h-4 text-neutral-300 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {modal && (
        <Modal title="Новий контрагент" onClose={() => { setModal(false); setForm(INIT); }}>
          <div className="space-y-4">
            <Input label="Назва *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ТОВ Назва або ФОП Прізвище" />
            <Select label="Тип *" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} options={TYPE_OPTIONS} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Телефон" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+380..." />
              <Input label="Email"   value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@..." />
            </div>
            <Input label="ЄДРПОУ / ІПН" value={form.tax_code} onChange={e => setForm(p => ({ ...p, tax_code: e.target.value }))} placeholder="12345678" />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setModal(false); setForm(INIT); }}>Скасувати</Button>
              <Button loading={saving} onClick={save} disabled={!form.name.trim()}>Створити і відкрити</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
