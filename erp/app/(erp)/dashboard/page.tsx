"use client";

import { Card, CardHeader, StatCard, EmptyState, Badge, icons } from "@/components/ui";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Дашборд</h1>
        <p className="text-sm text-neutral-500 mt-1">Загальний стан бізнесу</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Товарів на складі" value="—" color="blue"    icon={icons.bag}      />
        <StatCard label="Контрагентів"       value="—" color="purple" icon={icons.users}    />
        <StatCard label="Угод у CRM"         value="—" color="orange" icon={icons.pipeline} />
        <StatCard label="Баланс фінансів"    value="—" color="green"  icon={icons.wallet}   />
      </div>

      {/* Останні події */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Останні рухи на складі" icon="📦" />
          <EmptyState emoji="📦" title="Рухів ще немає" desc="Прихід і розхід товарів з'являться тут" compact />
        </Card>

        <Card>
          <CardHeader title="Активні угоди CRM" icon="🤝" />
          <EmptyState emoji="🤝" title="Угод ще немає" desc="Нові угоди з клієнтами з'являться тут" compact />
        </Card>

        <Card>
          <CardHeader title="Незакриті замовлення" icon="🏭" />
          <EmptyState emoji="🏭" title="Замовлень немає" desc="Виробничі замовлення з'являться тут" compact />
        </Card>

        <Card>
          <CardHeader title="Фінансові транзакції" icon="💰"
            action={<Badge color="neutral">За місяць</Badge>}
          />
          <EmptyState emoji="💰" title="Транзакцій немає" desc="Доходи і витрати компанії з'являться тут" compact />
        </Card>
      </div>
    </div>
  );
}
