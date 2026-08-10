import type { Currency } from "@prisma/client";

const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — FX rates don't need to be fresher for this app

let cachedRates: Record<string, number> | null = null;
let cachedAt = 0;

async function getRates(): Promise<Record<string, number> | null> {
  if (cachedRates && Date.now() - cachedAt < CACHE_TTL_MS) return cachedRates;

  try {
    const res = await fetch(RATES_URL);
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) throw new Error("Unexpected exchange rate response");
    cachedRates = data.rates;
    cachedAt = Date.now();
    return cachedRates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    // Serve a stale cache rather than nothing, if we have one
    return cachedRates;
  }
}

/** Converts an amount between currencies via USD as the pivot. Falls back to no
 * conversion (with a console warning) if rates can't be fetched, so a transient
 * network issue degrades to "slightly wrong totals" rather than a broken dashboard. */
export async function convert(amount: number, from: Currency, to: Currency): Promise<number> {
  if (from === to || amount === 0) return amount;

  const rates = await getRates();
  if (!rates || !rates[from] || !rates[to]) {
    console.warn(`Exchange rate unavailable for ${from}->${to}, using unconverted amount`);
    return amount;
  }

  const amountInUsd = amount / rates[from];
  return amountInUsd * rates[to];
}
