"use client";

import { useState } from "react";
import { Card, CardHeader, Tabs, Input, Button, ToggleRow, EmptyState, icons } from "@/components/ui";

type SettingsTab = "company" | "team" | "units" | "currencies";

const TABS = [
  { id: "company"    as const, label: "Компанія"     },
  { id: "team"       as const, label: "Команда"      },
  { id: "units"      as const, label: "Одиниці виміру" },
  { id: "currencies" as const, label: "Валюти"       },
];

const DEFAULT_UNITS = ["шт", "кг", "л", "м", "м²", "м³", "уп", "пар"];
const DEFAULT_CURRENCIES = [
  { code: "UAH", name: "Гривня",  symbol: "₴" },
  { code: "USD", name: "Долар",   symbol: "$" },
  { code: "EUR", name: "Євро",    symbol: "€" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("company");
  const [companyName, setCompanyName] = useState("");
  const [taxCode, setTaxCode]         = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Налаштування</h1>
        <p className="text-sm text-neutral-500 mt-1">Компанія, команда, одиниці виміру, валюти</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} variant="underline" />

      {tab === "company" && (
        <Card>
          <CardHeader title="Дані компанії" />
          <div className="space-y-4 max-w-md">
            <Input label="Назва компанії" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="ТОВ Назва" />
            <Input label="ЄДРПОУ / ІПН"  value={taxCode}     onChange={e => setTaxCode(e.target.value)}     placeholder="12345678" />
            <Input label="Адреса"         placeholder="м. Київ, вул. ..." />
            <Input label="Email"          type="email" placeholder="info@company.ua" />
            <Input label="Телефон"        type="tel"   placeholder="+380..." />
            <ToggleRow label="Платник ПДВ" desc="Ставка ПДВ 20%" checked={false} onChange={() => {}} />
            <Button>Зберегти</Button>
          </div>
        </Card>
      )}

      {tab === "team" && (
        <Card>
          <CardHeader title="Команда" action={<Button size="sm" icon={icons.plus}>Запросити</Button>} />
          <EmptyState emoji="👥" title="Команди ще немає" desc="Запросіть колег для спільної роботи в ERP" action={<Button size="sm">Запросити учасника</Button>} />
        </Card>
      )}

      {tab === "units" && (
        <Card>
          <CardHeader title="Одиниці виміру" action={<Button size="sm" icon={icons.plus}>Додати</Button>} />
          <div className="flex flex-wrap gap-2 mt-2">
            {DEFAULT_UNITS.map(u => (
              <span key={u} className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                {u}
              </span>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-3">Базові одиниці. Додайте власні якщо потрібно.</p>
        </Card>
      )}

      {tab === "currencies" && (
        <Card>
          <CardHeader title="Валюти" action={<Button size="sm" icon={icons.plus}>Додати валюту</Button>} />
          <div className="space-y-2 mt-2">
            {DEFAULT_CURRENCIES.map(c => (
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
                {c.code === "UAH" && (
                  <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-md font-medium">Базова</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
