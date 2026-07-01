import React from "react";
import { Icon } from "./Icon";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  icon?:     string;
  fullWidth?: boolean;
}

const BASE = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:   "bg-orange-400 text-white hover:bg-orange-500 shadow-sm",
  secondary: "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800",
  danger:    "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  ghost:     "text-neutral-500 dark:text-neutral-400 hover:text-orange-400 dark:hover:text-orange-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function Button({ variant = "primary", size = "md", loading = false, icon, fullWidth = false, children, className = "", disabled, ...props }: ButtonProps) {
  const classes = [BASE, VARIANTS[variant], SIZES[size], fullWidth ? "w-full" : "", className].filter(Boolean).join(" ");
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
        </svg>
      )}
      {icon && !loading && <Icon d={icon} className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />}
      {children}
    </button>
  );
}
