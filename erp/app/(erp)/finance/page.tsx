"use client";

import { useState } from "react";
import { Card, CardHeader, StatCard, Tabs, EmptyState, Button, Badge, icons } from "@/components/ui";

type FinanceTab = "transactions" | "accounts" | "reports";

const TABS = [
  { id: "transactions" as const, label: "Транзакції" },
  { id: "accounts"     as const, label: "Рахунки"    },
  { id: "reports"      as const, label: "Звіти"      },
];

export default function FinancePage() {
  const [tab, setTab] = useState<FinanceTab>("transactions");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Фінанси</h1>
          <p className="text-sm text-neutral-500 mt-1">Рахунки компанії, транзакції, звіти</p>
        </div>
        <Button icon={icons.plus}>Транзакція</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Загальний баланс"  value="—" color="green"  icon={icons.wallet}   />
        <StatCard label="Дохід (місяць)"    value="—" color="blue"   icon={icons.trendUp}  />
        <StatCard label="Витрати (місяць)"  value="—" color="red"    icon={icons.trendDown} />
        <StatCard label="Прибуток"          value="—" color="purple" emoji="📊"             />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} variant="underline" />

      <Card>
        {tab === "transactions" && (
          <>
            <CardHeader title="Транзакції" action={
              <div className="flex gap-2">
                <Badge color="green">Дохід: 0</Badge>
                <Badge color="red">Витрати: 0</Badge>
              </div>
            } />
            <EmptyState emoji="💳" title="Транзакцій ще немає" desc="Доходи і витрати компанії з'являться тут" action={<Button size="sm">Додати транзакцію</Button>} />
          </>
        )}
        {tab === "accounts" && (
          <>
            <CardHeader title="Рахунки компанії" action={<Button size="sm" icon={icons.plus}>Додати рахунок</Button>} />
            <EmptyState emoji="🏦" title="Рахунків ще немає" desc="Додайте банківський рахунок або касу компанії" action={<Button size="sm">Додати рахунок</Button>} />
          </>
        )}
        {tab === "reports" && (
          <>
            <CardHeader title="Фінансові звіти" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {[
                { emoji: "📊", label: "P&L (Прибуток і збитки)" },
                { emoji: "💸", label: "Cash Flow (Рух грошей)"  },
                { emoji: "⚖️", label: "Баланс"                  },
              ].map(r => (
                <button key={r.label} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors text-left space-y-1">
                  <span className="text-2xl">{r.emoji}</span>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{r.label}</p>
                  <p className="text-xs text-neutral-400">Немає даних</p>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
