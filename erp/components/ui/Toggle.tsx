import React from "react";

interface ToggleProps {
  checked:   boolean;
  onChange:  (value: boolean) => void;
  disabled?: boolean;
  size?:     "sm" | "md";
}

export function Toggle({ checked, onChange, disabled = false, size = "md" }: ToggleProps) {
  const track     = size === "sm" ? "w-8 h-4" : "w-11 h-6";
  const thumb     = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const translate = size === "sm" ? (checked ? "translate-x-4" : "translate-x-0.5") : (checked ? "translate-x-6" : "translate-x-1");
  return (
    <button role="switch" aria-checked={checked} onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={["relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none", track, checked ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700", disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"].join(" ")}>
      <span className={["inline-block rounded-full bg-white shadow transition-transform duration-200", thumb, translate].join(" ")} />
    </button>
  );
}

interface ToggleRowProps extends ToggleProps {
  label: string;
  desc?: string;
}

export function ToggleRow({ label, desc, checked, onChange, disabled, size }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} size={size} />
    </div>
  );
}
