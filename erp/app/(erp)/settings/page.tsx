"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card, CardHeader, Tabs, Input, Select, Button, EmptyState, Modal, Spinner, icons,
} from "@/components/ui";

type Tab = "company" | "team" | "units" | "currencies";

const TABS: { id: Tab; label: string }[] = [
  { id: "company",    label: "Компанія"       },
  { id: "team",       label: "Команда"        },
  { id: "units",      label: "Одиниці виміру" },
  { id: "currencies", label: "Валюти"         },
];

const CURRENCIES = [
  { code: "UAH", name: "Гривня",  symbol: "₴"  },
  { code: "USD", name: "Долар",   symbol: "$"   },
  { code: "EUR", name: "Євро",    symbol: "€"   },
  { code: "GBP", name: "Фунт",   symbol: "£"   },
  { code: "PLN", name: "Злотий", symbol: "zł"  },
];

const SEED_UNITS = [
  { name: "Штука",             short_name: "шт"  },
  { name: "Кілограм",          short_name: "кг"  },
  { name: "Літр",              short_name: "л"   },
  { name: "Метр",              short_name: "м"   },
  { name: "Квадратний метр",   short_name: "м²"  },
  { name: "Кубічний метр",     short_name: "м³"  },
  { name: "Пакування",         short_name: "уп"  },
  { name: "Пара",              short_name: "пар" },
];

interface Company { id: string; name: string; base_currency: string }
interface Unit    { id: string; name: string; short_name: string }
interface Member  { id: string; user_id: string; role: string }

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("company");

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [company,  setCompany]  = useState<Company | null>(null);

  // company form
  const [cName, setCName] = useState("");
  const [cCur,  setCCur]  = useState("UAH");

  // units
  const [units,      setUnits]      = useState<Unit[]>([]);
  const [unitModal,  setUnitModal]  = useState(false);
  const [unitName,   setUnitName]   = useState("");
  const [unitShort,  setUnitShort]  = useState("");
  const [unitSaving, setUnitSaving] = useState(false);

  // team
  const [members, setMembers] = useState<Member[]>([]);

  const supabase = createClient();

  const loadCompany = useCallback(async (uid: string) => {
    const { data: comp } = await supabase
      .from("erp_companies")
      .select("id, name, base_currency")
      .eq("owner_id", uid)
      .limit(1)
      .maybeSingle();

    if (comp) {
      setCompany(comp);
      setCName(comp.name);
      setCCur(comp.base_currency);
      const [{ data: u }, { data: m }] = await Promise.all([
        supabase.from("erp_units").select("id, name, short_name").eq("company_id", comp.id).order("created_at"),
        supabase.from("erp_company_members").select("id, user_id, role").eq("company_id", comp.id),
      ]);
      setUnits(u ?? []);
      setMembers(m ?? []);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadCompany(data.user.id); }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveCompany() {
    if (!userId || !cName.trim()) return;
    setSaving(true);
    if (company) {
      await supabase.from("erp_companies")
        .update({ name: cName.trim(), base_currency: cCur })
        .eq("id", company.id);
      setCompany({ ...company, name: cName.trim(), base_currency: cCur });
    } else {
      const { data } = await supabase.from("erp_companies")
        .insert({ name: cName.trim(), base_currency: cCur, owner_id: userId })
        .select("id, name, base_currency")
        .single();
      if (data) {
        setCompany(data);
        await supabase.from("erp_units")
          .insert(SEED_UNITS.map(u => ({ ...u, company_id: data.id })));
        const { data: u } = await supabase.from("erp_units")
          .select("id, name, short_name").eq("company_id", data.id).order("created_at");
        setUnits(u ?? []);
      }
    }
    setSaving(false);
  }

  async function addUnit() {
    if (!company || !unitName.trim() || !unitShort.trim()) return;
    setUnitSaving(true);
    const { data } = await supabase.from("erp_units")
      .insert({ company_id: company.id, name: unitName.trim(), short_name: unitShort.trim() })
      .select("id, name, short_name")
      .single();
    if (data) setUnits(p => [...p, data]);
    setUnitModal(false);
    setUnitName(""); setUnitShort("");
    setUnitSaving(false);
  }

  async function deleteUnit(id: string) {
    await supabase.from("erp_units").delete().eq("id", id);
    setUnits(p => p.filter(u => u.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Налаштування</h1>
        <p className="text-sm text-neutral-500 mt-1">Компанія, команда, одиниці виміру, валюти</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={t => setTab(t as Tab)} variant="underline" />

      {/* ─── Company ─────────────────────────────────────────── */}
      {tab === "company" && (
        <Card>
          <CardHeader title={company ? "Дані компанії" : "Створити компанію"} />
          <div className="space-y-4 max-w-md">
            {!company && (
              <p className="text-sm px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300">
                Для роботи з ERP спочатку створіть компанію
              </p>
            )}
            <Input
              label="Назва компанії"
              value={cName}
              onChange={e => setCName(e.target.value)}
              placeholder="ТОВ Назва"
            />
            <Select
              label="Базова валюта"
              value={cCur}
              onChange={e => setCCur(e.target.value)}
              options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
            />
            <Button loading={saving} onClick={saveCompany} disabled={!cName.trim()}>
              {company ? "Зберегти" : "Створити компанію"}
            </Button>
          </div>
        </Card>
      )}

      {/* ─── Team ────────────────────────────────────────────── */}
      {tab === "team" && (
        <Card>
          <CardHeader title="Команда" />
          {members.length === 0 ? (
            <EmptyState emoji="👥" title="Тільки ви" desc="Поки що в команді тільки власник" compact />
          ) : (
            <div className="space-y-2 mt-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <div>
                    <p className="text-sm font-mono font-medium text-neutral-800 dark:text-neutral-200">
                      {m.user_id.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-neutral-400">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Units ───────────────────────────────────────────── */}
      {tab === "units" && (
        !company ? (
          <Card>
            <EmptyState emoji="📦" title="Спочатку створіть компанію" desc='Перейдіть на вкладку "Компанія"' compact />
          </Card>
        ) : (
          <Card>
            <CardHeader
              title="Одиниці виміру"
              action={<Button size="sm" icon={icons.plus} onClick={() => setUnitModal(true)}>Додати</Button>}
            />
            {units.length === 0 ? (
              <EmptyState emoji="📐" title="Немає одиниць" desc="Додайте одиниці для товарів і матеріалів" compact />
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                {units.map(u => (
                  <div key={u.id} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{u.short_name}</span>
                    <span className="text-xs text-neutral-400">{u.name}</span>
                    <button
                      onClick={() => deleteUnit(u.id)}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 text-neutral-300 hover:text-red-400 transition-all"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 2l8 8M10 2l-8 8"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      )}

      {/* ─── Currencies ──────────────────────────────────────── */}
      {tab === "currencies" && (
        <Card>
          <CardHeader title="Підтримувані валюти" />
          <div className="space-y-2 mt-2">
            {CURRENCIES.map(c => (
              <div key={c.code} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-600">
                    {c.symbol}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{c.code}</p>
                    <p className="text-xs text-neutral-400">{c.name}</p>
                  </div>
                </div>
                {company?.base_currency === c.code && (
                  <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-md font-medium">
                    Базова
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            Базову валюту змінюйте у вкладці «Компанія»
          </p>
        </Card>
      )}

      {/* ─── Unit Modal ──────────────────────────────────────── */}
      {unitModal && (
        <Modal title="Нова одиниця виміру" onClose={() => setUnitModal(false)} size="sm">
          <div className="space-y-4">
            <Input label="Повна назва" value={unitName} onChange={e => setUnitName(e.target.value)} placeholder="Кілограм" />
            <Input label="Скорочення"  value={unitShort} onChange={e => setUnitShort(e.target.value)} placeholder="кг" />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setUnitModal(false)}>Скасувати</Button>
              <Button loading={unitSaving} onClick={addUnit} disabled={!unitName.trim() || !unitShort.trim()}>
                Додати
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
