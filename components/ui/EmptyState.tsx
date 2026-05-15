/**
 * @file components/ui/EmptyState.tsx
 * @description Порожній стан — коли список або таблиця не мають даних.
 *
 * Використання:
 *   import { EmptyState } from "@/components/ui";
 *
 *   <EmptyState
 *     emoji="💳"
 *     title="Рахунків ще немає"
 *     desc="Додайте перший рахунок, щоб почати"
 *     action={<Button onClick={onAdd}>Додати рахунок</Button>}
 *   />
 */

import React from "react";

interface EmptyStateProps {
  /** Емоджі або SVG-іконка як ReactNode */
  emoji?: string;
  /** Заголовок */
  title: string;
  /** Опис під заголовком */
  desc?: string;
  /** Кнопка або посилання */
  action?: React.ReactNode;
  /** Зменшений варіант (для вбудованих блоків) */
  compact?: boolean;
}

export function EmptyState({ emoji, title, desc, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 gap-2" : "py-16 gap-3"}`}>
      {emoji && (
        <span className={compact ? "text-3xl" : "text-5xl"}>{emoji}</span>
      )}
      <p className={`font-semibold text-neutral-900 dark:text-neutral-100 ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </p>
      {desc && (
        <p className={`text-neutral-400 max-w-xs ${compact ? "text-xs" : "text-sm"}`}>
          {desc}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
