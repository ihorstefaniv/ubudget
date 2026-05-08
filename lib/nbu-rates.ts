export type NbuRates = Record<string, number> & { USD: number; EUR: number; PLN: number; GBP: number; CHF: number; }

export const FALLBACK_RATES: NbuRates = { USD: 41.5, EUR: 44.8, PLN: 10.2, GBP: 52.0, CHF: 46.5 };

const NBU_CODES = ["USD", "EUR", "PLN", "GBP", "CHF"] as const;

async function fetchNbuRatesDirect(): Promise<NbuRates> {
  try {
    const results = await Promise.all(
      NBU_CODES.map(c => fetch(`https://bank.gov.ua/NBU_Exchange/exchange?valcode=${c}&json`).then(r => r.json()))
    );
    const rates = { ...FALLBACK_RATES };
    NBU_CODES.forEach((c, i) => { rates[c] = results[i]?.[0]?.rate ?? FALLBACK_RATES[c]; });
    return rates;
  } catch {
    return FALLBACK_RATES;
  }
}

/**
 * В браузері — читає через /api/nbu-rates (DB кеш, 1 запит замість 5).
 * На сервері (SSR) — напряму до НБУ API.
 */
export async function fetchNbuRates(): Promise<NbuRates> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/nbu-rates");
      if (res.ok) {
        const data = await res.json();
        if (data.USD && data.EUR && data.PLN) return data as NbuRates;
      }
    } catch { /* fallback below */ }
  }
  return fetchNbuRatesDirect();
}

export function rateFor(rates: Record<string, number>, currency: string): number {
  if (currency === "UAH") return 1;
  return rates[currency] ?? FALLBACK_RATES[currency as keyof typeof FALLBACK_RATES] ?? 1;
}
