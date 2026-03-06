/**
 * @file lib/format.ts
 * @description Утилітні функції для форматування чисел, дат і відсотків.
 * Використовується на всіх сторінках замість локальних копій fmt().
 */

/**
 * Форматує число як грошову суму з урахуванням валюти.
 * @param n - Число для форматування
 * @param currency - Валюта: "UAH" | "USD" | "EUR" (за замовчуванням "UAH")
 * @param decimals - Кількість знаків після коми (за замовчуванням 2)
 * @example fmt(1234.5) → "1 234,50 грн"
 * @example fmt(99, "USD") → "$99,00"
 * @example fmt(5000, "UAH", 0) → "5 000 грн"
 */
export function fmt(n: number, currency = "UAH", decimals = 2): string {
  const val = Math.abs(n).toLocaleString("uk-UA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = n < 0 ? "−" : "";
  if (currency === "USD") return `${sign}$${val}`;
  if (currency === "EUR") return `${sign}€${val}`;
  return `${sign}${val} грн`;
}

/**
 * Форматує число як відсоток зі знаком +/-.
 * @param n - Значення відсотка
 * @param showSign - Чи показувати знак + для позитивних (за замовчуванням true)
 * @example pct(12.5) → "+12.5%"
 * @example pct(-3.2) → "-3.2%"
 */
export function pct(n: number, showSign = true): string {
  const sign = showSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

/**
 * Повертає людиночитабельну мітку дати відносно сьогодні.
 * @param dateStr - Дата у форматі ISO "YYYY-MM-DD"
 * @example dateLabel("2026-03-06") → "Сьогодні"
 * @example dateLabel("2026-03-05") → "Вчора"
 * @example dateLabel("2026-02-01") → "1 лют"
 */
export function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Сьогодні";
  if (diff === 1) return "Вчора";
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

/**
 * Повертає початок вибраного периоду у форматі "YYYY-MM-DD".
 * @param period - "month" | "quarter" | "year"
 * @example startOfPeriod("month") → "2026-03-01"
 */
export function startOfPeriod(period: "month" | "quarter" | "year"): string {
  const d = new Date();
  if (period === "month")   return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  if (period === "quarter") return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).toISOString().slice(0, 10);
  return new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10);
}

/**
 * Генерує короткий унікальний ID для тимчасових об'єктів (не для БД).
 * @example uid() → "k7x2m9p"
 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Повертає кількість місяців між двома датами.
 * @param from - Дата початку
 * @param to - Дата кінця (за замовчуванням сьогодні)
 */
export function monthsLeft(from: string, to?: string): number {
  const start = new Date(from);
  const end   = to ? new Date(to) : new Date();
  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
}