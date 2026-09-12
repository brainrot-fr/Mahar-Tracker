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

export class GoldPriceDevProvider implements GoldPriceProvider {
  private lastUpdated: string | null = null;
  getProviderName() {
    return "goldprice-dev";
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
    const key = envSecret("GOLDPRICE_DEV_API_KEY");
    const { data } = await fetchJson<{
      symbols?: Array<{ quote_currency?: string; unit?: string; price?: string; computed_at?: string; is_stale?: boolean }>;
    }>("https://api.goldprice.dev/v1/prices?symbol=XAU-USD-SPOT", key ? { headers: { Authorization: `Bearer ${key}` } } : {});
    const quote = data.symbols?.[0];
    if (quote?.is_stale) throw new ProviderError("invalid_response", "goldprice.dev returned a stale price");
    const price = Number(quote?.price);
    assertPositivePrice(price, this.getProviderName());
    this.lastUpdated = sourceTime(quote?.computed_at);
    return {
      providerName: this.getProviderName(),
      currency: quote?.quote_currency ?? "USD",
      rawPrice: price,
      unit: "per_troy_ounce",
      sourceTimestamp: this.lastUpdated,
      quoteDate: todayIso(),
    };
  }
  async getHistoricalPrice(): Promise<GoldPriceResult> {
    throw new ProviderError("unsupported", "goldprice.dev spot does not publish dated quotes");
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

export function builtInGoldProviders(): GoldPriceProvider[] {
  return [
    new GoldPriceDevProvider(),
    new GoldApiComProvider(),
    new CoinbaseProvider(),
    new SwissquoteProvider(),
  ];
}
