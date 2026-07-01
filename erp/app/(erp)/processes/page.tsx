"use client";

import { Card, CardHeader, EmptyState, Button, icons } from "@/components/ui";

export default function ProcessesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Технологічні процеси</h1>
          <p className="text-sm text-neutral-500 mt-1">Опис і стандартизація виробничих процесів</p>
        </div>
        <Button icon={icons.plus}>Новий процес</Button>
      </div>

      <Card>
        <CardHeader title="Процеси" action={<Button size="sm" icon={icons.plus}>Додати</Button>} />
        <EmptyState
          emoji="⚙️"
          title="Процесів ще немає"
          desc="Опишіть технологічні процеси для стандартизації виробництва і прив'язки до продуктів"
          action={<Button size="sm">Додати перший процес</Button>}
        />
      </Card>

      {/* Підказка */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">ℹ️ Що таке технологічний процес?</p>
        <p className="text-xs text-blue-600 dark:text-blue-500">
          Технологічний процес — це послідовність операцій для виготовлення продукту.
          Кожен процес містить перелік кроків, норми часу, обладнання та матеріали.
          Після опису процесу його можна прив'язати до продуктів у специфікаціях (BOM).
        </p>
      </div>
    </div>
  );
}
