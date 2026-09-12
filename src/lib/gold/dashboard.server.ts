import { dashboardFromParts } from "./calc";
import { ensureProfile, getActiveGoal, listEntries } from "./entries.server";
import { loadSettings, quoteGoldPrice } from "./quote.server";
import type { Dashboard } from "./types";

export async function loadDashboard(userId: string): Promise<Dashboard | { needsOnboarding: true; profile: Awaited<ReturnType<typeof ensureProfile>> }> {
  const profile = await ensureProfile(userId);
  const goal = await getActiveGoal(userId);
  if (!goal || !profile.onboardingCompletedAt) {
    return { needsOnboarding: true, profile };
  }
  const settings = await loadSettings();
  const entries = await listEntries(userId, "oldest");
  let currentPricePerGram: number | null = null;
  let currentPriceCurrency: string | null = null;
  let currentPriceProvider: string | null = null;
  let currentPriceAsOf: string | null = null;
  let currentPriceCheckedAt: string | null = null;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const quote = await quoteGoldPrice({
    date: `${y}-${m}-${d}`,
    currency: profile.preferredCurrency,
    preferredProvider: profile.selectedProvider,
  });
  if (quote.ok) {
    currentPricePerGram = quote.quote.pricePerGramInDepositCurrency;
    currentPriceCurrency = profile.preferredCurrency;
    currentPriceProvider = quote.quote.providerName;
    currentPriceAsOf = quote.quote.priceSourceTimestamp ?? quote.quote.quoteDate;
    currentPriceCheckedAt = quote.quote.checkedAt;
  }
  return dashboardFromParts({
    goal,
    profile,
    settings,
    entries,
    currentPricePerGram,
    currentPriceCurrency,
    currentPriceProvider,
    currentPriceAsOf,
    currentPriceCheckedAt,
  });
}
