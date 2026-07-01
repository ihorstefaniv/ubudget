"use client";

import { useState } from "react";
import { Card, CardHeader, StatCard, Tabs, EmptyState, Button, Badge, icons } from "@/components/ui";

type CrmTab = "deals" | "clients" | "activities";

const TABS = [
  { id: "deals"      as const, label: "Угоди"      },
  { id: "clients"    as const, label: "Клієнти"    },
  { id: "activities" as const, label: "Активності" },
];

const PIPELINE_STAGES = [
  { id: "lead",       label: "Лід",           color: "neutral" as const },
  { id: "contact",    label: "Контакт",        color: "blue"    as const },
  { id: "proposal",   label: "Пропозиція",     color: "orange"  as const },
  { id: "negotiation",label: "Переговори",     color: "amber"   as const },
  { id: "won",        label: "Виграно",        color: "green"   as const },
  { id: "lost",       label: "Програно",       color: "red"     as const },
];

export default function CrmPage() {
  const [tab, setTab] = useState<CrmTab>("deals");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">CRM</h1>
          <p className="text-sm text-neutral-500 mt-1">Клієнти, угоди, активності</p>
        </div>
        <Button icon={icons.plus}>Нова угода</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Клієнтів"       value="—" color="blue"   icon={icons.users}    />
        <StatCard label="Угод в роботі"  value="—" color="orange" icon={icons.pipeline} />
        <StatCard label="Виграно"        value="—" color="green"  emoji="✅"             />
        <StatCard label="Конверсія"      value="—" color="purple" emoji="📈"             />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} variant="underline" />

      {tab === "deals" && (
        <div className="space-y-4">
          {/* Pipeline kanban */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {PIPELINE_STAGES.map(stage => (
              <div key={stage.id} className="min-w-[200px] flex-1">
                <div className="flex items-center justify-between mb-2 px-1">
                  <Badge color={stage.color}>{stage.label}</Badge>
                  <span className="text-xs text-neutral-400">0</span>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 min-h-[120px]">
                  <p className="text-xs text-neutral-400 text-center mt-6">Немає угод</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "clients" && (
        <Card>
          <CardHeader title="Клієнти" action={<Button size="sm" icon={icons.plus}>Додати клієнта</Button>} />
          <EmptyState emoji="👤" title="Клієнтів ще немає" desc="Додайте першого клієнта для роботи в CRM" action={<Button size="sm">Додати клієнта</Button>} />
        </Card>
      )}

      {tab === "activities" && (
        <Card>
          <CardHeader title="Активності" action={<Button size="sm" icon={icons.plus}>Додати активність</Button>} />
          <EmptyState emoji="📞" title="Активностей ще немає" desc="Дзвінки, зустрічі, задачі з'являться тут" />
        </Card>
      )}
    </div>
  );
}
