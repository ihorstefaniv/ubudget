/**
 * @file components/ui/Checkbox.tsx
 * @description Чекбокс і рядок з чекбоксом.
 *
 * Використання:
 *   import { Checkbox, CheckboxRow } from "@/components/ui";
 *
 *   <Checkbox checked={val} onChange={setVal} />
 *   <CheckboxRow label="Авто-нарахування" checked={v} onChange={setV} />
 */

import React from "react";
import { Icon, icons } from "./Icon";

// ─── Checkbox ─────────────────────────────────────────────────

interface CheckboxProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  /** Розмір. За замовчуванням "md" */
  size?: "sm" | "md";
}

export function Checkbox({ checked, onChange, disabled = false, size = "md" }: CheckboxProps) {
  const box = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const icon = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={[
        "rounded flex items-center justify-center border-2 transition-colors shrink-0 focus:outline-none",
        box,
        checked
          ? "bg-orange-400 border-orange-400 text-white"
          : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-orange-400",
      ].join(" ")}
    >
      {checked && <Icon d={icons.check} className={icon} />}
    </button>
  );
}

// ─── CheckboxRow ──────────────────────────────────────────────

interface CheckboxRowProps extends CheckboxProps {
  label: string;
  desc?: string;
}

export function CheckboxRow({ label, desc, checked, onChange, disabled, size }: CheckboxRowProps) {
  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => !disabled && onChange(!checked)}
    >
      <Checkbox checked={checked} onChange={onChange} disabled={disabled} size={size} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}
