/**
 * @file components/ui/Badge.tsx
 * @description Бейджі для статусів, типів і міток.
 * Також містить ProgressBar і Spinner.
 *
 * Використання:
 *   import { Badge, ProgressBar, Spinner } from "@/components/ui/Badge";
 *
 *   <Badge color="green">Активний</Badge>
 *   <Badge color="red">Прострочено</Badge>
 *   <ProgressBar value={65} max={100} />
 *   <Spinner />
 */

import React from "react";

// ─── Badge ────────────────────────────────────────────────────

type BadgeColor = "green" | "red" | "orange" | "blue" | "purple" | "amber" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  /** Крапка-пульс перед текстом (для live-статусів) */
  pulse?: boolean;
}

const BADGE_COLORS: Record<BadgeColor, string> = {
  green:   "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400",
  red:     "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400",
  orange:  "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400",
  blue:    "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  purple:  "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
  amber:   "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400",
  neutral: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400",
};

const PULSE_COLORS: Record<BadgeColor, string> = {
  green:   "bg-green-500",
  red:     "bg-red-500",
  orange:  "bg-orange-500",
  blue:    "bg-blue-500",
  purple:  "bg-purple-500",
  amber:   "bg-amber-500",
  neutral: "bg-neutral-400",
};

/**
 * Невеликий статусний бейдж з фоновим кольором.
 */
export function Badge({ children, color = "neutral", pulse = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${BADGE_COLORS[color]}`}>
      {/* Пульсуюча крапка для live-статусів */}
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full ${PULSE_COLORS[color]} animate-pulse`} />
      )}
      {children}
    </span>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────

interface ProgressBarProps {
  /** Поточне значення */
  value: number;
  /** Максимальне значення */
  max: number;
  /** Колір прогресу. Якщо не задано — автоматично: зелений/жовтий/червоний */
  color?: string;
  /** Висота смужки */
  height?: "sm" | "md";
}

/**
 * Горизонтальна смужка прогресу.
 * Автоматично стає червоною при перевищенні 100%.
 */
export function ProgressBar({ value, max, color, height = "sm" }: ProgressBarProps) {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  const isOver = value > max;

  // Автоматичний колір якщо не заданий явно
  const autoColor = isOver ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#fb923c";
  const barColor = color ?? autoColor;

  return (
    <div className={`w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden ${height === "sm" ? "h-2" : "h-3"}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: barColor }}
      />
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────

interface SpinnerProps {
  /** Розмір. За замовчуванням "md" */
  size?: "sm" | "md" | "lg";
  /** Колір. За замовчуванням помаранчевий */
  className?: string;
}

const SPINNER_SIZES: Record<string, string> = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

/**
 * Анімований індикатор завантаження.
 */
export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div className={`${SPINNER_SIZES[size]} rounded-full border-2 border-orange-400 border-t-transparent animate-spin ${className}`} />
  );
}

/**
 * Повноекранний лоадер по центру сторінки.
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="md" />
    </div>
  );
}