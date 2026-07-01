"use client";

import { useState } from "react";
import { Card, CardHeader, StatCard, Tabs, EmptyState, Button, Input, icons } from "@/components/ui";

type CPTab = "suppliers" | "buyers" | "all";

const TABS = [
  { id: "all"       as const, label: "Всі"          },
  { id: "suppliers" as const, label: "Постачальники" },
  { id: "buyers"    as const, label: "Покупці"       },
];

export default function CounterpartiesPage() {
  const [tab, setTab]       = useState<CPTab>("all");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Контрагенти</h1>
          <p className="text-sm text-neutral-500 mt-1">Постачальники та покупці</p>
        </div>
        <Button icon={icons.plus}>Додати</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Всього"          value="—" color="neutral" icon={icons.users}   />
        <StatCard label="Постачальників"  value="—" color="blue"    emoji="🏭"            />
        <StatCard label="Покупців"        value="—" color="green"   emoji="🛍️"            />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Пошук контрагента..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <Card>
        <EmptyState
          emoji="🤝"
          title="Контрагентів ще немає"
          desc="Додайте постачальників та покупців для роботи з накладними та рахунками"
          action={<Button size="sm" icon={icons.plus}>Додати контрагента</Button>}
        />
      </Card>
    </div>
  );
}
