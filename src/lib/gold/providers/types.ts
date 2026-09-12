import type { GoldPriceUnit } from "../constants";
import type { UnitConfig } from "../types";

export type GoldPriceRequest = {
  currency: string;
  date: string;
  units: UnitConfig;
  historical: boolean;
};

export type GoldPriceResult = {
  providerName: string;
  currency: string;
  rawPrice: number;
  unit: GoldPriceUnit;
  sourceTimestamp: string | null;
  quoteDate: string;
};

export interface GoldPriceProvider {
  getProviderName(): string;
  checkAvailability(): Promise<boolean>;
  getLastUpdatedTime(): string | null;
  supportsHistorical(): boolean;
  requiresSecret(): boolean;
  isConfigured(): boolean;
  getCurrentPrice(currency: string, units: UnitConfig): Promise<GoldPriceResult>;
  getHistoricalPrice(date: string, currency: string, units: UnitConfig): Promise<GoldPriceResult>;
}

export type FxQuote = {
  providerName: string;
  from: string;
  to: string;
  rate: number; // `to` units per 1 `from` unit
  timestamp: string | null;
  asOfDate: string;
};

export interface FxProvider {
  getProviderName(): string;
  getRate(from: string, to: string, date: string, historical: boolean): Promise<FxQuote>;
}
