export type NbuRates = Record<string, number> & { USD: number; EUR: number; PLN: number; }

export const FALLBACK_RATES: NbuRates = { USD: 41.5, EUR: 44.8, PLN: 10.2 };

async function fetchNbuRatesDirect(): Promise<NbuRates> {
  try {
    const [usdRes, eurRes, plnRes] = await Promise.all([
      fetch("https://bank.gov.ua/NBU_Exchange/exchange?valcode=USD&json"),
      fetch("https://bank.gov.ua/NBU_Exchange/exchange?valcode=EUR&json"),
      fetch("https://bank.gov.ua/NBU_Exchange/exchange?valcode=PLN&json"),
    ]);
    const [usd, eur, pln] = await Promise.all([usdRes.json(), eurRes.json(), plnRes.json()]);
    return {
      USD: usd[0]?.rate ?? FALLBACK_RATES.USD,
      EUR: eur[0]?.rate ?? FALLBACK_RATES.EUR,
      PLN: pln[0]?.rate ?? FALLBACK_RATES.PLN,
    };
  } catch {
    return FALLBACK_RATES;
  }
}

/**
 * В браузері — читає через /api/nbu-rates (DB кеш, 1 запит замість 3).
 * На сервері (SSR) — напряму до НБУ API.
 */
export async function fetchNbuRates(): Promise<NbuRates> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/nbu-rates");
      if (res.ok) {
        const data = await res.json();
        if (data.USD && data.EUR && data.PLN) {
          return data as NbuRates;
        }
      }
    } catch { /* fallback below */ }
  }
  return fetchNbuRatesDirect();
}

export function rateFor(rates: Record<string, number>, currency: string): number {
  if (currency === "UAH") return 1;
  return rates[currency] ?? FALLBACK_RATES[currency as keyof typeof FALLBACK_RATES] ?? 1;
}
