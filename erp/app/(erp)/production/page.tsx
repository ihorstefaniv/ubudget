"use client";

import { useState } from "react";
import { Card, CardHeader, StatCard, Tabs, EmptyState, Button, Badge, icons } from "@/components/ui";

type ProdTab = "orders" | "bom" | "writeoffs";

const TABS = [
  { id: "orders"    as const, label: "Замовлення"    },
  { id: "bom"       as const, label: "Специфікації"  },
  { id: "writeoffs" as const, label: "Списання"      },
];

const ORDER_STATUSES = [
  { key: "planned",    label: "Заплановано", color: "neutral" as const },
  { key: "in_progress",label: "В роботі",   color: "orange"  as const },
  { key: "done",       label: "Виконано",   color: "green"   as const },
  { key: "cancelled",  label: "Скасовано",  color: "red"     as const },
];

export default function ProductionPage() {
  const [tab, setTab] = useState<ProdTab>("orders");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Виробництво</h1>
          <p className="text-sm text-neutral-500 mt-1">Замовлення, специфікації, списання матеріалів</p>
        </div>
        <Button icon={icons.plus}>Нове замовлення</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Замовлень в роботі" value="—" color="orange" icon={icons.factory}  />
        <StatCard label="Виконано (місяць)"  value="—" color="green"  emoji="✅"             />
        <StatCard label="Специфікацій"       value="—" color="blue"   icon={icons.doc}      />
        <StatCard label="Матеріалів списано" value="—" color="red"    emoji="📉"             />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} variant="underline" />

      <Card>
        {tab === "orders" && (
          <>
            <CardHeader title="Виробничі замовлення" action={
              <div className="flex gap-2">
                {ORDER_STATUSES.map(s => <Badge key={s.key} color={s.color}>{s.label}: 0</Badge>)}
              </div>
            } />
            <EmptyState emoji="🏭" title="Замовлень ще немає" desc="Створіть перше виробниче замовлення" action={<Button size="sm">Нове замовлення</Button>} />
          </>
        )}
        {tab === "bom" && (
          <>
            <CardHeader title="Специфікації (BOM)" action={<Button size="sm" icon={icons.plus}>Нова специфікація</Button>} />
            <EmptyState emoji="📐" title="Специфікацій ще немає" desc="Визначте склад матеріалів для кожного продукту" action={<Button size="sm">Додати специфікацію</Button>} />
          </>
        )}
        {tab === "writeoffs" && (
          <>
            <CardHeader title="Списання матеріалів" />
            <EmptyState emoji="📋" title="Списань ще немає" desc="Списання матеріалів після виробничих замовлень з'являться тут" />
          </>
        )}
      </Card>
    </div>
  );
}
