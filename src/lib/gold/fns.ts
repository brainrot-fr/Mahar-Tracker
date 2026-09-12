import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { GoldPriceUnit } from "./constants";

export const getBootstrap = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { ensureProfile, getActiveGoal } = await import("./entries.server");
    const { loadSettings } = await import("./quote.server");
    const [profile, goal, settings] = await Promise.all([
      ensureProfile(context.userId),
      getActiveGoal(context.userId),
      loadSettings(),
    ]);
    return { profile, goal, settings };
  });

export const getDashboardFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { loadDashboard } = await import("./dashboard.server");
    return loadDashboard(context.userId);
  });

export const completeOnboardingFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    ukhiyaCount: number;
    currency: string;
    gramsPerTola: number;
    tolasPerUkhiya: number;
    acceptedDisclaimer: boolean;
  }) => d)
  .handler(async ({ context, data }) => {
    const { completeOnboarding } = await import("./entries.server");
    return completeOnboarding({ userId: context.userId, ...data });
  });

export const quotePriceFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { date: string; currency: string }) => d)
  .handler(async ({ context, data }) => {
    const { ensureProfile } = await import("./entries.server");
    const { quoteGoldPrice } = await import("./quote.server");
    const profile = await ensureProfile(context.userId);
    return quoteGoldPrice({
      date: data.date,
      currency: data.currency,
      preferredProvider: profile.selectedProvider,
    });
  });

export const quoteManualFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { date: string; currency: string; goldPrice: number; goldPriceUnit: GoldPriceUnit }) => d)
  .handler(async ({ data }) => {
    const { quoteFromManual } = await import("./quote.server");
    return quoteFromManual(data);
  });

export const createEntryFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    amount: number;
    currency: string;
    depositDate: string;
    note?: string | null;
    idempotencyKey: string;
    manualPrice?: { goldPrice: number; goldPriceUnit: GoldPriceUnit; confirmed: boolean };
  }) => d)
  .handler(async ({ context, data }) => {
    const { createEntry } = await import("./entries.server");
    return createEntry({ userId: context.userId, ...data });
  });

export const listEntriesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { sort?: "newest" | "oldest" | "largest_deposit" | "largest_grams" } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const { listEntries, getActiveGoal, ensureProfile } = await import("./entries.server");
    const { quoteGoldPrice } = await import("./quote.server");
    const sort = data.sort ?? "newest";
    const [entries, goal, profile] = await Promise.all([
      listEntries(context.userId, sort),
      getActiveGoal(context.userId),
      ensureProfile(context.userId),
    ]);
    let currentPrice: number | null = null;
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const q = await quoteGoldPrice({
      date: iso,
      currency: profile.preferredCurrency,
      preferredProvider: profile.selectedProvider,
    });
    if (q.ok && q.quote.pricePerGramInDepositCurrency > 0) {
      currentPrice = q.quote.pricePerGramInDepositCurrency;
    }
    return { entries, goal, currentPrice, preferredCurrency: profile.preferredCurrency };
  });

export const getEntryFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { getEntry, getActiveGoal, ensureProfile } = await import("./entries.server");
    const { quoteGoldPrice } = await import("./quote.server");
    const entry = await getEntry(context.userId, data.id);
    if (!entry) return { entry: null, goal: null, currentValue: null };
    const [goal, profile] = await Promise.all([getActiveGoal(context.userId), ensureProfile(context.userId)]);
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const q = await quoteGoldPrice({
      date: iso,
      currency: entry.depositedCurrency,
      preferredProvider: profile.selectedProvider,
    });
    const currentValue =
      q.ok && entry.status === "posted" ? entry.completedGrams * q.quote.pricePerGramInDepositCurrency : null;
    return { entry, goal, currentValue };
  });

export const updateEntryFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    id: string;
    amount?: number;
    depositDate?: string;
    note?: string | null;
    currency?: string;
    manualPrice?: { goldPrice: number; goldPriceUnit: GoldPriceUnit; confirmed: boolean };
  }) => d)
  .handler(async ({ context, data }) => {
    const { updateEntry } = await import("./entries.server");
    return updateEntry({ userId: context.userId, ...data });
  });

export const deleteEntryFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: string; confirmPhrase: string }) => d)
  .handler(async ({ context, data }) => {
    const { deleteEntry } = await import("./entries.server");
    await deleteEntry({ userId: context.userId, ...data });
    return { ok: true };
  });

export const changeGoalFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { ukhiyaCount: number; confirmPhrase: string }) => d)
  .handler(async ({ context, data }) => {
    const { changeGoal } = await import("./entries.server");
    return changeGoal({ userId: context.userId, ...data });
  });

export const updatePreferencesFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { preferredCurrency?: string; selectedProvider?: string | null }) => d)
  .handler(async ({ context, data }) => {
    const { updatePreferences } = await import("./entries.server");
    return updatePreferences({ userId: context.userId, ...data });
  });

export const exportDataFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { exportUserData } = await import("./entries.server");
    return exportUserData(context.userId);
  });

export const deleteAccountFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { confirmPhrase: string }) => d)
  .handler(async ({ context, data }) => {
    const { deleteAccount } = await import("./entries.server");
    await deleteAccount(context.userId, data.confirmPhrase);
    return { ok: true };
  });

export const listProvidersFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { listProviders } = await import("./providers/registry");
    return listProviders().map((p) => ({
      name: p.getProviderName(),
      configured: p.isConfigured(),
      historical: p.supportsHistorical(),
      requiresSecret: p.requiresSecret(),
    }));
  });
