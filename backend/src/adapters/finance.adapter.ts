interface ExchangeRateConfig {
  base: string;
  target: string;
}

export interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  date: string;
}

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * Adaptateur exchange_rate — Frankfurter (taux de la BCE, gratuit, sans clé API).
 * Service "Finance" : sans compte ni abonnement, comme weather/rss (PLAN.md §5).
 */
export async function fetchExchangeRate(config: ExchangeRateConfig): Promise<ExchangeRate> {
  const base = config.base.toUpperCase();
  const target = config.target.toUpperCase();
  const url = `https://api.frankfurter.app/latest?amount=1&from=${base}&to=${target}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Taux de change indisponible (${res.status})`);
  const data = (await res.json()) as FrankfurterResponse;
  const rate = data.rates?.[target];
  if (rate === undefined) throw new Error(`Devise inconnue: ${target}`);
  return { base, target, rate, date: data.date };
}

interface CryptoPriceConfig {
  coin: string;
  currency: string;
}

export interface CryptoPrice {
  coin: string;
  currency: string;
  price: number;
  change24h: number | null;
}

type CoinGeckoResponse = Record<string, Record<string, number>>;

/**
 * Adaptateur crypto_price — CoinGecko (gratuit, sans clé API pour l'usage basique).
 * `coin` attend un id CoinGecko (ex: "bitcoin", "ethereum"), `currency` une devise fiat (ex: "usd").
 */
export async function fetchCryptoPrice(config: CryptoPriceConfig): Promise<CryptoPrice> {
  const coin = config.coin.toLowerCase().trim();
  const currency = config.currency.toLowerCase().trim();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=${encodeURIComponent(currency)}&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Prix crypto indisponible (${res.status})`);
  const data = (await res.json()) as CoinGeckoResponse;
  const entry = data[coin];
  const price = entry?.[currency];
  if (price === undefined) throw new Error(`Cryptomonnaie ou devise inconnue: ${coin}/${currency}`);
  const change24h = entry[`${currency}_24h_change`] ?? null;
  return { coin, currency, price, change24h };
}
