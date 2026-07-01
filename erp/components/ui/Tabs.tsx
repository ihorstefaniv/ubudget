import React from "react";
import { Icon } from "./Icon";

interface TabItem<T extends string> {
  id:     T;
  label:  string;
  icon?:  string;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs:     readonly TabItem<T>[];
  active:   T;
  onChange: (id: T) => void;
  variant?: "pills" | "underline";
}

export function Tabs<T extends string>({ tabs, active, onChange, variant = "pills" }: TabsProps<T>) {
  if (variant === "underline") {
    return (
      <div className="flex border-b border-neutral-100 dark:border-neutral-800">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className={["flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", tab.id === active ? "border-orange-400 text-orange-500" : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"].join(" ")}>
            {tab.icon && <Icon d={tab.icon} className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab.id === active ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={["flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all", tab.id === active ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"].join(" ")}>
          {tab.icon && <Icon d={tab.icon} className="w-3.5 h-3.5" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 rounded-full font-semibold ${tab.id === active ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
