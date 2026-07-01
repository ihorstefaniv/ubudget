export function fmt(n: number, currency = "UAH", decimals = 2): string {
  const val  = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = n < 0 ? "−" : "";
  if (currency === "USD") return `${sign}$${val}`;
  if (currency === "EUR") return `${sign}€${val}`;
  return `${sign}${val} грн`;
}

export function pct(n: number, showSign = true): string {
  const sign = showSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function dateLabel(dateStr: string): string {
  const d     = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Сьогодні";
  if (diff === 1) return "Вчора";
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
