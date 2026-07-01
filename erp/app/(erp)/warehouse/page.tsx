"use client";

import { useState } from "react";
import { Card, CardHeader, StatCard, Tabs, EmptyState, Button, Badge, icons } from "@/components/ui";

type WarehouseTab = "stock" | "movements" | "products" | "inventory";

const TABS = [
  { id: "stock"     as const, label: "Залишки"     },
  { id: "movements" as const, label: "Рух товарів" },
  { id: "products"  as const, label: "Товари"      },
  { id: "inventory" as const, label: "Інвентаризація" },
];

export default function WarehousePage() {
  const [tab, setTab] = useState<WarehouseTab>("stock");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Склад</h1>
          <p className="text-sm text-neutral-500 mt-1">Залишки, рух товарів, інвентаризація</p>
        </div>
        <Button icon={icons.plus}>Прихід</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Позицій товарів"  value="—" color="blue"    emoji="📦" />
        <StatCard label="Сума залишків"    value="—" color="green"   emoji="💰" />
        <StatCard label="Прихід сьогодні" value="—" color="orange"  emoji="⬇️" />
        <StatCard label="Розхід сьогодні" value="—" color="red"     emoji="⬆️" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} variant="underline" />

      <Card>
        {tab === "stock" && (
          <>
            <CardHeader title="Залишки на складі" action={
              <Button size="sm" variant="secondary" icon={icons.download}>Експорт</Button>
            } />
            <EmptyState emoji="📦" title="Залишків ще немає" desc="Додайте товари і зробіть прихід щоб побачити залишки" action={<Button size="sm">Додати товар</Button>} />
          </>
        )}
        {tab === "movements" && (
          <>
            <CardHeader title="Рух товарів" action={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" icon={icons.plus}>Прихід</Button>
                <Button size="sm" variant="danger"    icon={icons.minus}>Розхід</Button>
              </div>
            } />
            <EmptyState emoji="🔄" title="Рухів ще немає" desc="Прихід і розхід товарів відображаються тут" />
          </>
        )}
        {tab === "products" && (
          <>
            <CardHeader title="Товари та послуги" action={<Button size="sm" icon={icons.plus}>Додати товар</Button>} />
            <EmptyState emoji="🗂️" title="Товарів ще немає" desc="Додайте перший товар або послугу" action={<Button size="sm">Додати товар</Button>} />
          </>
        )}
        {tab === "inventory" && (
          <>
            <CardHeader title="Інвентаризація" />
            <EmptyState emoji="📋" title="Інвентаризацій не проводилось" desc="Створіть нову інвентаризацію для звірки залишків" action={<Button size="sm">Нова інвентаризація</Button>} />
          </>
        )}
      </Card>
    </div>
  );
}
