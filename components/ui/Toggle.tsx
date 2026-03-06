/**
 * @file components/ui/Toggle.tsx
 * @description iOS-стиль перемикач (switch) і рядок з перемикачем.
 * Замінює дублікати Toggle в accounts/page.tsx і settings/page.tsx.
 *
 * Використання:
 *   import { Toggle, ToggleRow } from "@/components/ui/Toggle";
 *
 *   // Просто перемикач
 *   <Toggle checked={value} onChange={setValue} />
 *
 *   // Рядок з підписом
 *   <ToggleRow
 *     label="Темна тема"
 *     desc="Перемкнути інтерфейс на темний режим"
 *     checked={darkMode}
 *     onChange={setDarkMode}
 *   />
 */

import React from "react";

// ─── Toggle ───────────────────────────────────────────────────

interface ToggleProps {
  /** Стан перемикача */
  checked: boolean;
  /** Колбек при зміні */
  onChange: (value: boolean) => void;
  /** Заблокований стан */
  disabled?: boolean;
  /** Розмір: "sm" — менший, "md" — стандартний */
  size?: "sm" | "md";
}

/**
 * iOS-стиль перемикач. Помаранчевий коли активний, сірий — неактивний.
 */
export function Toggle({ checked, onChange, disabled = false, size = "md" }: ToggleProps) {
  const track = size === "sm" ? "w-8 h-4" : "w-11 h-6";
  const thumb = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const translate = size === "sm"
    ? (checked ? "translate-x-4" : "translate-x-0.5")
    : (checked ? "translate-x-6" : "translate-x-1");

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={[
        "relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none",
        track,
        checked ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {/* Кругла точка */}
      <span className={[
        "inline-block rounded-full bg-white shadow transition-transform duration-200",
        thumb,
        translate,
      ].join(" ")} />
    </button>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────

interface ToggleRowProps extends ToggleProps {
  /** Основний підпис */
  label: string;
  /** Опис під підписом */
  desc?: string;
}

/**
 * Рядок з підписом ліворуч і перемикачем праворуч.
 * Використовується в налаштуваннях та формах.
 */
export function ToggleRow({ label, desc, checked, onChange, disabled, size }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      {/* Підписи */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>

      {/* Перемикач */}
      <Toggle checked={checked} onChange={onChange} disabled={disabled} size={size} />
    </div>
  );
}