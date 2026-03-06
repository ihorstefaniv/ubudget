/**
 * @file components/ui/Input.tsx
 * @description Уніфіковані поля вводу: текст, число, select, textarea.
 *
 * Використання:
 *   import { Input, Select, Textarea } from "@/components/ui/Input";
 *
 *   <Input label="Сума" type="number" placeholder="0.00" />
 *   <Input label="Назва" error="Обов'язкове поле" />
 *   <Select label="Тип" options={[{ value: "uah", label: "UAH" }]} />
 *   <Textarea label="Коментар" rows={3} />
 */

import React from "react";

// ─── Базові стилі ─────────────────────────────────────────────

/** Стиль поля — нормальний стан */
const INPUT_BASE = "w-full px-3 py-2.5 rounded-xl border bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none transition-all";

/** Стиль поля — нормальний бордер */
const INPUT_NORMAL = "border-neutral-200 dark:border-neutral-700 focus:border-orange-300 dark:focus:border-orange-600";

/** Стиль поля — помилка */
const INPUT_ERROR = "border-red-300 dark:border-red-700 focus:border-red-400 bg-red-50/30 dark:bg-red-950/10";

// ─── Input ────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Мітка над полем */
  label?: string;
  /** Текст помилки під полем (також змінює стиль бордера) */
  error?: string;
  /** Підказка під полем (показується якщо немає error) */
  hint?: string;
  /** Елемент праворуч у полі (наприклад, валюта) */
  suffix?: React.ReactNode;
}

/**
 * Текстове або числове поле вводу з підтримкою мітки, помилки та суфіксу.
 */
export function Input({ label, error, hint, suffix, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {/* Мітка */}
      {label && (
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
          {label}
        </label>
      )}

      {/* Поле + суфікс */}
      <div className="relative">
        <input
          className={[
            INPUT_BASE,
            error ? INPUT_ERROR : INPUT_NORMAL,
            suffix ? "pr-16" : "",
            className,
          ].filter(Boolean).join(" ")}
          {...props}
        />
        {/* Суфікс (наприклад "грн", "USD") */}
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium pointer-events-none">
            {suffix}
          </div>
        )}
      </div>

      {/* Помилка або підказка */}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Масив опцій для вибору */
  options: SelectOption[];
  /** Порожня опція на початку (placeholder) */
  placeholder?: string;
}

/**
 * Випадаючий список з підтримкою мітки та помилки.
 */
export function Select({ label, error, hint, options, placeholder, className = "", ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={[
          INPUT_BASE,
          error ? INPUT_ERROR : INPUT_NORMAL,
          "cursor-pointer",
          className,
        ].filter(Boolean).join(" ")}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Багаторядкове поле вводу.
 */
export function Textarea({ label, error, hint, className = "", ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={[
          INPUT_BASE,
          error ? INPUT_ERROR : INPUT_NORMAL,
          "resize-none",
          className,
        ].filter(Boolean).join(" ")}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}