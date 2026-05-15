/**
 * @file components/ui/Tabs.tsx
 * @description Таб-навігація. Замінює локальні Tab-рядки на кожній сторінці.
 *
 * Використання:
 *   import { Tabs } from "@/components/ui";
 *
 *   type Tab = "income" | "expense";
 *   const TABS = [
 *     { id: "income",  label: "Доходи" },
 *     { id: "expense", label: "Витрати" },
 *   ] as const;
 *
 *   <Tabs tabs={TABS} active={tab} onChange={setTab} />
 *
 *   // З іконками:
 *   <Tabs tabs={[{ id: "stocks", label: "Акції", icon: icons.trendUp }]} active={tab} onChange={setTab} />
 */

import React from "react";
import { Icon } from "./Icon";

// ─── Типи ─────────────────────────────────────────────────────

interface TabItem<T extends string> {
  id: T;
  label: string;
  /** SVG path іконки (необов'язково) */
  icon?: string;
  /** Кількість / лічильник (показується поруч з лейблом) */
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Варіант відображення */
  variant?: "pills" | "underline";
}

// ─── Компонент ────────────────────────────────────────────────

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = "pills",
}: TabsProps<T>) {
  if (variant === "underline") {
    return (
      <div className="flex border-b border-neutral-100 dark:border-neutral-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab.id === active
                ? "border-orange-400 text-orange-500"
                : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
            ].join(" ")}
          >
            {tab.icon && <Icon d={tab.icon} className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab.id === active
                  ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // pills (default)
  return (
    <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            tab.id === active
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
          ].join(" ")}
        >
          {tab.icon && <Icon d={tab.icon} className="w-3.5 h-3.5" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 rounded-full font-semibold ${
              tab.id === active
                ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600"
                : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
