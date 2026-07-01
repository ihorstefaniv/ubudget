import React from "react";
import { Icon } from "./Icon";

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className = "", noPadding = false }: CardProps) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 ${noPadding ? "" : "p-5"} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title:   string;
  action?: React.ReactNode;
  icon?:   string;
}

export function CardHeader({ title, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      </div>
      {action && <div className="text-xs text-orange-400">{action}</div>}
    </div>
  );
}

type StatColor = "green" | "red" | "orange" | "blue" | "purple" | "neutral";

interface StatCardProps {
  label:  string;
  value:  string;
  sub?:   string;
  color?: StatColor;
  icon?:  string;
  emoji?: string;
}

const STAT_COLORS: Record<StatColor, string> = {
  green:   "text-green-500 bg-green-50 dark:bg-green-950/30",
  red:     "text-red-500 bg-red-50 dark:bg-red-950/30",
  orange:  "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
  blue:    "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  purple:  "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  neutral: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800",
};

export function StatCard({ label, value, sub, color = "neutral", icon, emoji }: StatCardProps) {
  return (
    <Card>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${STAT_COLORS[color]}`}>
        {emoji ? <span className="text-lg">{emoji}</span> : icon ? <Icon d={icon} className="w-4 h-4" /> : null}
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </Card>
  );
}

interface InfoBoxProps {
  children: React.ReactNode;
  variant?: "orange" | "blue" | "green" | "red" | "amber";
}

const INFO_VARIANTS: Record<string, string> = {
  orange: "bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 text-orange-700 dark:text-orange-400",
  blue:   "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400",
  green:  "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400",
  red:    "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400",
  amber:  "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
};

export function InfoBox({ children, variant = "orange" }: InfoBoxProps) {
  return (
    <div className={`p-3 rounded-xl border text-xs ${INFO_VARIANTS[variant]}`}>{children}</div>
  );
}
