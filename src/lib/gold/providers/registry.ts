import type { UnitConfig } from "../types";
import { builtInGoldProviders } from "./gold";
import { ProviderError } from "./http";
import type { GoldPriceProvider, GoldPriceResult } from "./types";

export type ProviderAttempt = {
  provider: string;
  ok: boolean;
  errorKind?: string;
  durationMs?: number;
};

export function listProviders(): GoldPriceProvider[] {
  return builtInGoldProviders();
}

export function providersByPriority(priority: string[], preferred?: string | null): GoldPriceProvider[] {
  const all = listProviders().filter((p) => p.isConfigured());
  const byName = new Map(all.map((p) => [p.getProviderName(), p]));
  const ordered: GoldPriceProvider[] = [];
  const seen = new Set<string>();
  const push = (name: string) => {
    const p = byName.get(name);
    if (p && !seen.has(name)) {
      ordered.push(p);
      seen.add(name);
    }
  };
  for (const name of priority) push(name);
  if (preferred) push(preferred);
  for (const p of all) push(p.getProviderName());
  return ordered;
}

export async function fetchWithFailover(
  date: string,
  currency: string,
  units: UnitConfig,
  historical: boolean,
  priority: string[],
  preferred?: string | null,
): Promise<{ result: GoldPriceResult; fallbackUsed: boolean; attempts: ProviderAttempt[] }> {
  const providers = providersByPriority(priority, preferred);
  if (providers.length === 0) {
    throw new ProviderError("unavailable", "No gold-price providers are configured");
  }
  const attempts: ProviderAttempt[] = [];
  let firstError: Error | null = null;
  const startedPreferred = preferred ?? providers[0]?.getProviderName();

  for (const provider of providers) {
    const name = provider.getProviderName();
    if (historical && !provider.supportsHistorical()) {
      attempts.push({ provider: name, ok: false, errorKind: "unsupported" });
      continue;
    }
    const t0 = Date.now();
    try {
      const result = historical
        ? await provider.getHistoricalPrice(date, currency, units)
        : await provider.getCurrentPrice(currency, units);
      if (!(result.rawPrice > 0)) {
        throw new ProviderError("invalid_response", "Non-positive price");
      }
      attempts.push({ provider: name, ok: true, durationMs: Date.now() - t0 });
      return {
        result,
        fallbackUsed: name !== startedPreferred,
        attempts,
      };
    } catch (err) {
      const kind = err instanceof ProviderError ? err.kind : "network";
      attempts.push({ provider: name, ok: false, errorKind: kind, durationMs: Date.now() - t0 });
      firstError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw new ProviderError(
    "unavailable",
    firstError?.message ?? "All gold-price providers failed",
  );
}
