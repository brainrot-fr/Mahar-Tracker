export { APP_NAME, APP_TAGLINE, APP_SHORT_DESCRIPTION } from "./copy.ts";

/** Default traditional-unit assumptions. Override per goal, never scatter literals. */
export const DEFAULT_GRAMS_PER_TOLA = 11.6638;
export const DEFAULT_TOLAS_PER_UKHIYA = 11;
/** ISO troy ounce used when a provider quotes XAU per ounce. */
export const TROY_OUNCE_GRAMS = 31.1034768;

export const PERMITTED_UKHIYA = [9, 10, 11] as const;
export type PermittedUkhiya = (typeof PERMITTED_UKHIYA)[number];

export const DEFAULT_CURRENCY = "INR";
export const SUPPORTED_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "BDT",
  "PKR",
  "SAR",
  "AUD",
  "CAD",
  "SGD",
  "CHF",
] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const PURITY_LABEL = "24K";
export const PURITY_FINENESS = 999.9;

export const DISPLAY_GRAM_DECIMALS = 4;
export const STORE_GRAM_DECIMALS = 8;
export const STORE_MONEY_DECIMALS = 6;
export const STORE_RATE_DECIMALS = 12;

export const MILESTONES = [10, 25, 50, 75, 100] as const;

export const DEFAULT_PROVIDER_PRIORITY = [
  "goldprice-dev",
  "gold-api-com",
  "coinbase",
  "swissquote",
] as const;

export const GOLD_PRICE_UNITS = ["per_gram", "per_tola", "per_troy_ounce"] as const;
export type GoldPriceUnit = (typeof GOLD_PRICE_UNITS)[number];

export const ENTRY_STATUSES = ["posted", "pending_price", "pending_sync", "deleted"] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];
