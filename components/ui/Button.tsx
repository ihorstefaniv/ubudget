/**
 * @file components/ui/Button.tsx
 * @description Уніфікований компонент кнопки для всього проєкту.
 *
 * Використання:
 *   import { Button } from "@/components/ui/Button";
 *
 *   <Button>Зберегти</Button>
 *   <Button variant="secondary">Скасувати</Button>
 *   <Button variant="danger">Видалити</Button>
 *   <Button variant="ghost">Переглянути</Button>
 *   <Button loading>Збереження...</Button>
 *   <Button icon={icons.plus}>Додати</Button>
 */

import React from "react";
import { Icon } from "./Icon";

// ─── Типи ─────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Візуальний стиль кнопки */
  variant?: ButtonVariant;
  /** Розмір кнопки */
  size?: ButtonSize;
  /** Показати спінер і заблокувати кнопку */
  loading?: boolean;
  /** SVG path іконки (з об'єкта icons) — відображається зліва від тексту */
  icon?: string;
  /** Розтягнути на повну ширину контейнера */
  fullWidth?: boolean;
}

// ─── Стилі ────────────────────────────────────────────────────

/** Базові стилі для всіх варіантів */
const BASE = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none";

/** Стилі по варіанту */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:   "bg-orange-400 text-white hover:bg-orange-500 shadow-sm",
  secondary: "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800",
  danger:    "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  ghost:     "text-neutral-500 dark:text-neutral-400 hover:text-orange-400 dark:hover:text-orange-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
};

/** Стилі по розміру */
const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

// ─── Компонент ────────────────────────────────────────────────

/**
 * Кнопка з підтримкою варіантів, розмірів, іконок та стану завантаження.
 */
export function Button({
  variant   = "primary",
  size      = "md",
  loading   = false,
  icon,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? "w-full" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {/* Спінер під час завантаження */}
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
        </svg>
      )}

      {/* Іконка зліва (якщо не завантаження) */}
      {icon && !loading && (
        <Icon d={icon} className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      )}

      {children}
    </button>
  );
}