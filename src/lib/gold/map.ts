import type { EntryStatus, GoldPriceUnit, PermittedUkhiya } from "./constants";
import { PERMITTED_UKHIYA } from "./constants";
import { toPgTimestamptz } from "./timestamps";
import type { AppSettings, Goal, Profile, SavingsEntry } from "./types";

export function num(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value == null) return NaN;
  return Number(value);
}

export function str(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function strOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  return str(value);
}

export function dateOnly(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = str(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const iso = toPgTimestamptz(value);
  return iso ? iso.slice(0, 10) : s.slice(0, 10);
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type SettingsRow = {
  grams_per_tola: unknown;
  tolas_per_ukhiya: unknown;
  troy_ounce_grams: unknown;
  permitted_ukhiya: unknown;
  purity_label: unknown;
  purity_fineness: unknown;
  default_currency: unknown;
  supported_currencies: unknown;
  manual_price_fallback_enabled: unknown;
  provider_priority: unknown;
  current_price_cache_seconds: unknown;
};

export function mapSettings(row: SettingsRow): AppSettings {
  const permitted = splitCsv(str(row.permitted_ukhiya))
    .map(Number)
    .filter((n) => (PERMITTED_UKHIYA as readonly number[]).includes(n)) as PermittedUkhiya[];
  return {
    gramsPerTola: num(row.grams_per_tola),
    tolasPerUkhiya: num(row.tolas_per_ukhiya),
    troyOunceGrams: num(row.troy_ounce_grams),
    permittedUkhiya: permitted.length ? permitted : [...PERMITTED_UKHIYA],
    purityLabel: str(row.purity_label) || "24K",
    purityFineness: num(row.purity_fineness) || 999.9,
    defaultCurrency: str(row.default_currency) || "INR",
    supportedCurrencies: splitCsv(str(row.supported_currencies)),
    manualPriceFallbackEnabled: Boolean(row.manual_price_fallback_enabled),
    providerPriority: splitCsv(str(row.provider_priority)),
    currentPriceCacheSeconds: num(row.current_price_cache_seconds) || 900,
  };
}

export type ProfileRow = {
  user_id: unknown;
  preferred_currency: unknown;
  selected_provider: unknown;
  onboarding_completed_at: unknown;
  created_at: unknown;
  updated_at: unknown;
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    userId: str(row.user_id),
    preferredCurrency: str(row.preferred_currency) || "INR",
    selectedProvider: strOrNull(row.selected_provider),
    onboardingCompletedAt: strOrNull(row.onboarding_completed_at),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

export type GoalRow = {
  id: unknown;
  user_id: unknown;
  ukhiya_count: unknown;
  goal_type: unknown;
  target_amount: unknown;
  target_currency: unknown;
  tolas_per_ukhiya: unknown;
  grams_per_tola: unknown;
  target_grams: unknown;
  purity_label: unknown;
  purity_fineness: unknown;
  is_active: unknown;
  created_at: unknown;
  updated_at: unknown;
};

export function mapGoal(row: GoalRow): Goal {
  return {
    id: str(row.id),
    userId: str(row.user_id),
    ukhiyaCount: num(row.ukhiya_count) as PermittedUkhiya,
    goalType: str(row.goal_type) === "cash" ? "cash" : "gold",
    targetAmount: num(row.target_amount) || num(row.target_grams),
    targetCurrency: str(row.target_currency) || "INR",
    tolasPerUkhiya: num(row.tolas_per_ukhiya),
    gramsPerTola: num(row.grams_per_tola),
    targetGrams: num(row.target_grams),
    purityLabel: str(row.purity_label),
    purityFineness: num(row.purity_fineness),
    isActive: Boolean(row.is_active),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

export type EntryRow = {
  id: unknown;
  user_id: unknown;
  goal_id: unknown;
  client_idempotency_key: unknown;
  deposit_date: unknown;
  deposited_amount: unknown;
  deposited_currency: unknown;
  api_currency: unknown;
  exchange_rate: unknown;
  exchange_rate_timestamp: unknown;
  gold_price: unknown;
  gold_price_unit: unknown;
  normalized_price_per_gram: unknown;
  completed_grams: unknown;
  provider_name: unknown;
  fallback_used: unknown;
  price_source_timestamp: unknown;
  manually_entered_price: unknown;
  note: unknown;
  status: unknown;
  created_at: unknown;
  updated_at: unknown;
  deleted_at: unknown;
};

export function mapEntry(row: EntryRow): SavingsEntry {
  return {
    id: str(row.id),
    userId: str(row.user_id),
    goalId: str(row.goal_id),
    clientIdempotencyKey: str(row.client_idempotency_key),
    depositDate: dateOnly(row.deposit_date),
    depositedAmount: num(row.deposited_amount),
    depositedCurrency: str(row.deposited_currency),
    apiCurrency: str(row.api_currency),
    exchangeRate: num(row.exchange_rate),
    exchangeRateTimestamp: toPgTimestamptz(row.exchange_rate_timestamp),
    goldPrice: num(row.gold_price),
    goldPriceUnit: str(row.gold_price_unit) as GoldPriceUnit,
    normalizedPricePerGram: num(row.normalized_price_per_gram),
    completedGrams: num(row.completed_grams),
    providerName: str(row.provider_name),
    fallbackUsed: Boolean(row.fallback_used),
    priceSourceTimestamp: toPgTimestamptz(row.price_source_timestamp),
    manuallyEnteredPrice: Boolean(row.manually_entered_price),
    note: strOrNull(row.note),
    status: str(row.status) as EntryStatus,
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    deletedAt: toPgTimestamptz(row.deleted_at),
  };
}
