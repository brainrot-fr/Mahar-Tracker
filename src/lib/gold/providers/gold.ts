import { DEFAULT_CURRENCY } from "../constants";
import { toPgTimestamptz } from "../timestamps";
import type { UnitConfig } from "../types";
import { envSecret, fetchJson, ProviderError } from "./http";
import type { GoldPriceProvider, GoldPriceResult } from "./types";

function assertPositivePrice(price: number, provider: string): void {
  if (!Number.isFinite(price) || price <= 0) {
    throw new ProviderError("invalid_response", `${provider} returned a non-positive price`);
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoFromUnixSeconds(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return toPgTimestamptz(seconds);
}

function sourceTime(value: unknown, fallback?: string | null): string {
  return toPgTimestamptz(value) ?? toPgTimestamptz(fallback) ?? new Date().toISOString();
}

export class GoldApiComProvider implements GoldPriceProvider {
  private lastUpdated: string | null = null;
  getProviderName() {
    return "gold-api-com";
  }
  requiresSecret() {
    return false;
  }
  isConfigured() {
    return true;
  }
  supportsHistorical() {
    return false;
  }
  getLastUpdatedTime() {
    return this.lastUpdated;
  }
  async checkAvailability() {
    try {
      await this.getCurrentPrice("USD", { gramsPerTola: 11.6638, tolasPerUkhiya: 11, troyOunceGrams: 31.1034768 });
      return true;
    } catch {
      return false;
    }
  }
  async getCurrentPrice(currency: string, _units: UnitConfig): Promise<GoldPriceResult> {
    // Public XAU spot, USD per troy ounce, 24K (pure gold). No jewelry markup.
    const { data } = await fetchJson<{
      price: number;
      currency?: string;
      updatedAt?: string;
      symbol?: string;
    }>("https://api.gold-api.com/price/XAU");
    assertPositivePrice(data.price, this.getProviderName());
    if (data.symbol && data.symbol !== "XAU") {
      throw new ProviderError("invalid_response", "Unexpected metal symbol");
    }
    this.lastUpdated = sourceTime(data.updatedAt);
    if (currency !== "USD" && data.currency && data.currency !== "USD") {
      throw new ProviderError("unsupported", `Provider quoted ${data.currency}, not USD`);
    }
    return {
      providerName: this.getProviderName(),
      currency: "USD",
      rawPrice: data.price,
      unit: "per_troy_ounce",
      sourceTimestamp: this.lastUpdated,
      quoteDate: todayIso(),
    };
  }
  async getHistoricalPrice(): Promise<GoldPriceResult> {
    throw new ProviderError("unsupported", "gold-api.com does not publish historical prices");
  }
}

/** metals.live — free public spot feed, USD per troy ounce, no API key. */
export class MetalsLiveProvider implements GoldPriceProvider {
  private lastUpdated: string | null = null;
  getProviderName() {
    return "metals-live";
  }
  requiresSecret() {
    return false;
  }
  isConfigured() {
    return true;
  }
  supportsHistorical() {
    return false;
  }
  getLastUpdatedTime() {
    return this.lastUpdated;
  }
  async checkAvailability() {
    try {
      await this.getCurrentPrice("USD", { gramsPerTola: 11.6638, tolasPerUkhiya: 11, troyOunceGrams: 31.1034768 });
      return true;
    } catch {
      return false;
    }
  }
  async getCurrentPrice(_currency?: string, _units?: UnitConfig): Promise<GoldPriceResult> {
    const { data } = await fetchJson<Array<Record<string, unknown>>>("https://api.metals.live/v1/spot");
    const latest = data.find((item) => Number.isFinite(Number(item.gold)) && Number(item.gold) > 0);
    const price = Number(latest?.gold);
    assertPositivePrice(price, this.getProviderName());
    const timestamp = latest?.timestamp;
    this.lastUpdated = sourceTime(timestamp);
    return {
      providerName: this.getProviderName(),
      currency: "USD",
      rawPrice: price,
      unit: "per_troy_ounce",
      sourceTimestamp: this.lastUpdated,
      quoteDate: todayIso(),
    };
  }
  async getHistoricalPrice(): Promise<GoldPriceResult> {
    throw new ProviderError("unsupported", "metals.live does not publish historical quotes");
  }
}

/** Metals-API latest feed. Its free tier requires a server-side access key. */
export class MetalsApiProvider implements GoldPriceProvider {
  private lastUpdated: string | null = null;
  getProviderName() {
    return "metals-api";
  }
  requiresSecret() {
    return true;
  }
  isConfigured() {
    return Boolean(envSecret("METALS_API_KEY"));
  }
  supportsHistorical() {
    return false;
  }
  getLastUpdatedTime() {
    return this.lastUpdated;
  }
  async checkAvailability() {
    if (!this.isConfigured()) return false;
    try {
      await this.getCurrentPrice("USD", { gramsPerTola: 11.6638, tolasPerUkhiya: 11, troyOunceGrams: 31.1034768 });
      return true;
    } catch {
      return false;
    }
  }
  async getCurrentPrice(_currency?: string, _units?: UnitConfig): Promise<GoldPriceResult> {
    const key = envSecret("METALS_API_KEY");
    if (!key) throw new ProviderError("authentication", "METALS_API_KEY is not configured");
    const { data } = await fetchJson<{
      success?: boolean;
      timestamp?: number;
      rates?: Record<string, number>;
      error?: { info?: string };
    }>(`https://metals-api.com/api/latest?access_key=${encodeURIComponent(key)}&base=USD&symbols=XAU`);
    if (data.success === false || data.error || !data.rates) {
      throw new ProviderError("invalid_response", data.error?.info ?? "Metals-API did not return rates");
    }
    const xauPerUsd = Number(data.rates.XAU);
    assertPositivePrice(xauPerUsd, this.getProviderName());
    const price = 1 / xauPerUsd;
    assertPositivePrice(price, this.getProviderName());
    this.lastUpdated = sourceTime(data.timestamp);
    return {
      providerName: this.getProviderName(),
      currency: "USD",
      rawPrice: price,
      unit: "per_troy_ounce",
      sourceTimestamp: this.lastUpdated,
      quoteDate: todayIso(),
    };
  }
  async getHistoricalPrice(): Promise<GoldPriceResult> {
    throw new ProviderError("unsupported", "Metals-API historical quotes require a paid plan");
  }
}

export class SwissquoteProvider implements GoldPriceProvider {
  private lastUpdated: string | null = null;
  getProviderName() {
    return "swissquote";
  }
  requiresSecret() {
    return false;
  }
  isConfigured() {
    return true;
  }
  supportsHistorical() {
    return false;
  }
  getLastUpdatedTime() {
    return this.lastUpdated;
  }
  async checkAvailability() {
    try {
      await this.getCurrentPrice("USD", { gramsPerTola: 11.6638, tolasPerUkhiya: 11, troyOunceGrams: 31.1034768 });
      return true;
    } catch {
      return false;
    }
  }
  async getCurrentPrice(_currency?: string, _units?: UnitConfig): Promise<GoldPriceResult> {
    const { data } = await fetchJson<
      Array<{
        ts?: number;
        spreadProfilePrices?: Array<{ spreadProfile?: string; ask?: number; bid?: number }>;
      }>
    >("https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD");
    const first = data?.[0];
    const profiles = first?.spreadProfilePrices ?? [];
    const elite = profiles.find((p) => p.spreadProfile === "elite") ?? profiles[0];
    // Consumer buying ≈ dealer ask (what a buyer pays). 24K XAU, not jewelry.
    const ask = elite?.ask;
    assertPositivePrice(ask ?? NaN, this.getProviderName());
    this.lastUpdated = first?.ts ? isoFromUnixSeconds(first.ts / 1000) : new Date().toISOString();
    return {
      providerName: this.getProviderName(),
      currency: "USD",
      rawPrice: ask as number,
      unit: "per_troy_ounce",
      sourceTimestamp: sourceTime(this.lastUpdated),
      quoteDate: todayIso(),
    };
  }
  async getHistoricalPrice(): Promise<GoldPriceResult> {
    throw new ProviderError("unsupported", "Swissquote public feed has no historical quotes");
  }
}

export class CoinbaseProvider implements GoldPriceProvider {
  private lastUpdated: string | null = null;
  getProviderName() {
    return "coinbase";
  }
  requiresSecret() {
    return false;
  }
  isConfigured() {
    return true;
  }
  supportsHistorical() {
    return false;
  }
  getLastUpdatedTime() {
    return this.lastUpdated;
  }
  async checkAvailability() {
    try {
      await this.getCurrentPrice("USD", { gramsPerTola: 11.6638, tolasPerUkhiya: 11, troyOunceGrams: 31.1034768 });
      return true;
    } catch {
      return false;
    }
  }
  async getCurrentPrice(_currency?: string, _units?: UnitConfig): Promise<GoldPriceResult> {
    const { data } = await fetchJson<{ data?: { amount?: string; base?: string; currency?: string } }>(
      "https://api.coinbase.com/v2/prices/XAU-USD/spot",
    );
    const amount = Number(data.data?.amount);
    assertPositivePrice(amount, this.getProviderName());
    if (data.data?.base && data.data.base !== "XAU") {
      throw new ProviderError("invalid_response", "Unexpected metal base");
    }
    this.lastUpdated = new Date().toISOString();
    return {
      providerName: this.getProviderName(),
      currency: "USD",
      rawPrice: amount,
      unit: "per_troy_ounce",
      sourceTimestamp: this.lastUpdated,
      quoteDate: todayIso(),
    };
  }
  async getHistoricalPrice(): Promise<GoldPriceResult> {
    throw new ProviderError("unsupported", "Coinbase spot has no dated historical quotes");
  }
}

/**
 * goldapi.io — optional. Reads GOLDAPI_IO_KEY from the server environment.
 * Never shipped to the client. Supports dated historical XAU quotes when keyed.
 */
export class GoldApiIoProvider implements GoldPriceProvider {
  private lastUpdated: string | null = null;
  getProviderName() {
    return "goldapi-io";
  }
  requiresSecret() {
    return true;
  }
  isConfigured() {
    return Boolean(envSecret("GOLDAPI_IO_KEY"));
  }
  supportsHistorical() {
    return true;
  }
  getLastUpdatedTime() {
    return this.lastUpdated;
  }
  private key() {
    const k = envSecret("GOLDAPI_IO_KEY");
    if (!k) throw new ProviderError("authentication", "GOLDAPI_IO_KEY is not configured");
    return k;
  }
  async checkAvailability() {
    if (!this.isConfigured()) return false;
    try {
      await this.getCurrentPrice("USD", { gramsPerTola: 11.6638, tolasPerUkhiya: 11, troyOunceGrams: 31.1034768 });
      return true;
    } catch {
      return false;
    }
  }
  private async fetchSymbol(currency: string, date?: string): Promise<GoldPriceResult> {
    const pathDate = date ? `/${date.replace(/-/g, "")}` : "";
    const url = `https://www.goldapi.io/api/XAU/${encodeURIComponent(currency)}${pathDate}`;
    const { data } = await fetchJson<{
      error?: string;
      price?: number;
      price_gram_24k?: number;
      currency?: string;
      timestamp?: number;
      metal?: string;
    }>(url, { headers: { "x-access-token": this.key() } });
    if (data.error) {
      throw new ProviderError("invalid_response", data.error);
    }
    const perGram = data.price_gram_24k;
    const perOunce = data.price;
    this.lastUpdated = sourceTime(data.timestamp);
    if (Number.isFinite(perGram) && (perGram as number) > 0) {
      return {
        providerName: this.getProviderName(),
        currency: data.currency ?? currency,
        rawPrice: perGram as number,
        unit: "per_gram",
        sourceTimestamp: this.lastUpdated,
        quoteDate: date ?? todayIso(),
      };
    }
    assertPositivePrice(perOunce ?? NaN, this.getProviderName());
    return {
      providerName: this.getProviderName(),
      currency: data.currency ?? currency,
      rawPrice: perOunce as number,
      unit: "per_troy_ounce",
      sourceTimestamp: this.lastUpdated,
      quoteDate: date ?? todayIso(),
    };
  }
  getCurrentPrice(currency: string, _units?: UnitConfig) {
    return this.fetchSymbol(currency || DEFAULT_CURRENCY);
  }
  getHistoricalPrice(date: string, currency: string, _units?: UnitConfig) {
    return this.fetchSymbol(currency || DEFAULT_CURRENCY, date);
  }
}

export function builtInGoldProviders(): GoldPriceProvider[] {
  return [
    new GoldApiIoProvider(),
    new MetalsLiveProvider(),
    new MetalsApiProvider(),
    new GoldApiComProvider(),
    new SwissquoteProvider(),
    new CoinbaseProvider(),
  ];
}
