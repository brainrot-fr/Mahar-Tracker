import { STORE_GRAM_DECIMALS, STORE_MONEY_DECIMALS, STORE_RATE_DECIMALS } from "./constants.ts";
import type { Dashboard, Goal, PriceQuote, SavingsEntry } from "./types.ts";
import { roundTo, storeGrams } from "./units.ts";

export function goldEquivalentGrams(depositedAmount: number, pricePerGram: number): number {
  if (!(depositedAmount > 0)) throw new Error("Deposit amount must be greater than zero.");
  if (!(pricePerGram > 0)) throw new Error("Gold price must be greater than zero.");
  return storeGrams(depositedAmount / pricePerGram);
}

export function gramsFromQuote(depositedAmount: number, quote: PriceQuote): number {
  return goldEquivalentGrams(depositedAmount, quote.pricePerGramInDepositCurrency);
}

export function convertAmount(amount: number, rateDepositedPerApi: number): number {
  if (!(amount > 0)) throw new Error("Amount must be greater than zero.");
  if (!(rateDepositedPerApi > 0)) throw new Error("Exchange rate must be greater than zero.");
  return roundTo(amount / rateDepositedPerApi, STORE_MONEY_DECIMALS);
}

/** Preferred-currency units per 1 API-currency unit. */
export function priceInDepositCurrency(
  pricePerGramApi: number,
  depositedPerApi: number,
): number {
  if (!(pricePerGramApi > 0)) throw new Error("Gold price must be greater than zero.");
  if (!(depositedPerApi > 0)) throw new Error("Exchange rate must be greater than zero.");
  return roundTo(pricePerGramApi * depositedPerApi, STORE_MONEY_DECIMALS);
}

export function completionPercent(completedGrams: number, targetGrams: number): number {
  if (!(targetGrams > 0)) return 0;
  if (completedGrams <= 0) return 0;
  return roundTo(Math.min(100, (completedGrams / targetGrams) * 100), 4);
}

export function remainingGrams(completedGrams: number, targetGrams: number): number {
  return storeGrams(Math.max(0, targetGrams - completedGrams));
}

export function currentEstimatedValue(completedGrams: number, currentPricePerGram: number): number {
  if (completedGrams < 0) throw new Error("Completed grams cannot be negative.");
  if (!(currentPricePerGram > 0)) throw new Error("Current gold price must be greater than zero.");
  return roundTo(completedGrams * currentPricePerGram, STORE_MONEY_DECIMALS);
}

export function averageEffectivePricePerGram(
  totalDeposited: number,
  completedGrams: number,
): number | null {
  if (!(completedGrams > 0) || !(totalDeposited > 0)) return null;
  return roundTo(totalDeposited / completedGrams, STORE_MONEY_DECIMALS);
}

export function estimatedValueDifference(totalDeposited: number, estimatedValue: number): number {
  return roundTo(estimatedValue - totalDeposited, STORE_MONEY_DECIMALS);
}

export function roundRate(rate: number): number {
  return roundTo(rate, STORE_RATE_DECIMALS);
}

export function buildRunningTotals(
  entries: SavingsEntry[],
  targetGrams: number,
): { runningGrams: number; runningCompletionPercent: number }[] {
  let running = 0;
  return entries.map((entry) => {
    running = storeGrams(running + (entry.status === "posted" ? entry.completedGrams : 0));
    return {
      runningGrams: running,
      runningCompletionPercent: completionPercent(running, targetGrams),
    };
  });
}

export function sumPostedGrams(entries: SavingsEntry[]): number {
  return storeGrams(
    entries
      .filter((e) => e.status === "posted" && !e.deletedAt)
      .reduce((sum, e) => sum + e.completedGrams, 0),
  );
}

export function sumDepositedByCurrency(
  entries: SavingsEntry[],
): { currency: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.status !== "posted" || e.deletedAt) continue;
    map.set(e.depositedCurrency, (map.get(e.depositedCurrency) ?? 0) + e.depositedAmount);
  }
  return [...map.entries()]
    .map(([currency, amount]) => ({ currency, amount: roundTo(amount, STORE_MONEY_DECIMALS) }))
    .sort((a, b) => b.amount - a.amount);
}

export function dashboardFromParts(args: {
  goal: Goal;
  profile: Dashboard["profile"];
  settings: Dashboard["settings"];
  entries: SavingsEntry[];
  currentPricePerGram: number | null;
  currentPriceCurrency: string | null;
  currentPriceProvider: string | null;
  currentPriceAsOf: string | null;
  currentPriceCheckedAt: string | null;
}): Dashboard {
  const posted = args.entries.filter((e) => e.status === "posted" && !e.deletedAt);
  const completedGrams = sumPostedGrams(posted);
  const remaining = remainingGrams(completedGrams, args.goal.targetGrams);
  const percent = completionPercent(completedGrams, args.goal.targetGrams);
  const byCurrency = sumDepositedByCurrency(posted);
  const preferred = args.profile.preferredCurrency;
  const preferredBucket = byCurrency.find((b) => b.currency === preferred);
  const totalDepositedPreferred = preferredBucket?.amount ?? (byCurrency.length === 0 ? 0 : null);

  const priceOk =
    args.currentPricePerGram != null &&
    args.currentPricePerGram > 0 &&
    args.currentPriceCurrency === preferred;
  const estimated = priceOk
    ? currentEstimatedValue(completedGrams, args.currentPricePerGram as number)
    : null;
  const difference =
    estimated != null && totalDepositedPreferred != null
      ? estimatedValueDifference(totalDepositedPreferred, estimated)
      : null;
  const avg =
    totalDepositedPreferred != null
      ? averageEffectivePricePerGram(totalDepositedPreferred, completedGrams)
      : null;

  const most = [...posted].sort((a, b) => {
    const d = b.depositDate.localeCompare(a.depositDate);
    if (d !== 0) return d;
    return b.createdAt.localeCompare(a.createdAt);
  })[0];

  return {
    goal: args.goal,
    profile: args.profile,
    settings: args.settings,
    targetUkhiya: args.goal.ukhiyaCount,
    targetGrams: args.goal.targetGrams,
    completedGrams,
    remainingGrams: remaining,
    completionPercent: percent,
    totalDepositedByCurrency: byCurrency,
    preferredCurrency: preferred,
    totalDepositedPreferred,
    currentPricePerGram: args.currentPricePerGram,
    currentPriceCurrency: args.currentPriceCurrency,
    currentPriceProvider: args.currentPriceProvider,
    currentPriceAsOf: args.currentPriceAsOf,
    currentPriceCheckedAt: args.currentPriceCheckedAt,
    currentEstimatedValue: estimated,
    estimatedValueDifference: difference,
    entryCount: posted.length,
    mostRecentDeposit: most
      ? {
          id: most.id,
          depositDate: most.depositDate,
          amount: most.depositedAmount,
          currency: most.depositedCurrency,
          grams: most.completedGrams,
        }
      : null,
    averageEffectivePricePerGram: avg,
    milestones: [10, 25, 50, 75, 100].map((p) => ({ percent: p, reached: percent >= p })),
  };
}

export { STORE_GRAM_DECIMALS };
