// ФАЙЛ: app/(app)/tools/crisis/page.tsx
// URL: /tools/crisis — Crisis Manager (заглушка)
"use client";

import { Card } from "@/components/ui";

export default function CrisisPage() {
  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">🚨 Crisis Manager</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Управління фінансовими кризами
        </p>
      </div>

      <Card>
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🚧</p>
          <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Сторінка в розробці</p>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Crisis Manager допоможе вам створити план дій на випадок фінансової кризи: 
            втрати роботи, хвороби, економічного спаду чи інших непередбачуваних обставин.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-8 max-w-sm mx-auto">
            {[
              { emoji: "📋", label: "Кризовий план" },
              { emoji: "🛡️", label: "Захисний бюджет" },
              { emoji: "📞", label: "Контакти допомоги" },
              { emoji: "📊", label: "Стрес-тести" },
            ].map(f => (
              <div key={f.label} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                <span className="text-2xl">{f.emoji}</span>
                <p className="text-xs text-neutral-500 mt-1">{f.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-8">Очікується у наступному оновленні</p>
        </div>
      </Card>
    </div>
  );
}