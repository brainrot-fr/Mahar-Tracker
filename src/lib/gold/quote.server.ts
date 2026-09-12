import { getSql } from "@/lib/db";
import { gramsFromQuote, priceInDepositCurrency, roundRate } from "./calc";
import { DEFAULT_PROVIDER_PRIORITY, STORE_MONEY_DECIMALS } from "./constants";
import { ERRORS } from "./copy";
import { dateOnly, mapSettings, num } from "./map";
import { builtInFxProviders } from "./providers/fx";
import { ProviderError } from "./providers/http";
import { fetchWithFailover } from "./providers/registry";
import { requirePgTimestamptz, toPgTimestamptz } from "./timestamps";
import type { AppSettings, PriceQuote, QuoteResult, UnitConfig } from "./types";
import { normalizePricePerGram, roundTo } from "./units";
import { parseCurrency, parseIsoDate, parsePositiveNumber, todayIsoDate } from "./validation";

function newId(): string {
  return crypto.randomUUID();
}

async function loadSettings(): Promise<AppSettings> {
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`select * from app_settings where id = 'global'`;
  if (!rows[0]) throw new Error("App settings are missing.");
  return mapSettings(rows[0] as never);
}

async function logApi(args: {
  provider: string;
  action: string;
  ok: boolean;
  statusCode?: number;
  durationMs?: number;
  errorKind?: string;
}) {
  try {
    const sql = await getSql();
    await sql`insert into api_logs (id, provider, action, ok, status_code, duration_ms, error_kind)
      values (${newId()}, ${args.provider}, ${args.action}, ${args.ok}, ${args.statusCode ?? null}, ${args.durationMs ?? null}, ${args.errorKind ?? null})`;
  } catch {
    /* logging must never break quotes */
  }
}

function normalizeQuoteTimestamps(quote: PriceQuote): PriceQuote {
  return {
    ...quote,
    exchangeRateTimestamp: toPgTimestamptz(quote.exchangeRateTimestamp),
    priceSourceTimestamp: toPgTimestamptz(quote.priceSourceTimestamp),
    checkedAt: toPgTimestamptz(quote.checkedAt),
  };
}

async function cacheSnapshot(quote: PriceQuote, apiStatus: string) {
  const sql = await getSql();
  const quotedAt = requirePgTimestamptz(undefined);
  const source = toPgTimestamptz(quote.priceSourceTimestamp);
  await sql`insert into price_snapshots (
    id, provider, quoted_at, quote_date, currency, purity_label, price_unit,
    raw_price, normalized_price_per_gram, source_timestamp, api_status
  ) values (
    ${newId()}, ${quote.providerName}, ${quotedAt}, ${quote.quoteDate},
    ${quote.apiCurrency}, ${"24K"}, ${quote.goldPriceUnit},
    ${quote.goldPrice}, ${quote.normalizedPricePerGramApi}, ${source}, ${apiStatus}
  )`;
}

async function readCachedSnapshot(
  date: string,
  preferredProvider: string | null,
  maxAgeSeconds?: number,
): Promise<PriceQuote | null> {
  const sql = await getSql();
  const maxAge = maxAgeSeconds == null ? null : Math.max(0, Math.floor(maxAgeSeconds));
  const rows = preferredProvider
    ? await sql<Record<string, unknown>>`select * from price_snapshots
        where quote_date = ${date} and provider = ${preferredProvider}
        and (${maxAge}::int is null or quoted_at > now() - (${maxAge ?? 0} * interval '1 second'))
        order by quoted_at desc limit 1`
    : await sql<Record<string, unknown>>`select * from price_snapshots
        where quote_date = ${date}
        and (${maxAge}::int is null or quoted_at > now() - (${maxAge ?? 0} * interval '1 second'))
        order by quoted_at desc limit 1`;
  const row = rows[0];
  if (!row) return null;
  const raw = num(row.raw_price);
  const perGramApi = num(row.normalized_price_per_gram);
  if (!(raw > 0) || !(perGramApi > 0)) return null;
  return normalizeQuoteTimestamps({
    providerName: String(row.provider),
    fallbackUsed: false,
    quoteDate: dateOnly(row.quote_date),
    apiCurrency: String(row.currency),
    goldPrice: raw,
    goldPriceUnit: String(row.price_unit) as PriceQuote["goldPriceUnit"],
    normalizedPricePerGramApi: perGramApi,
    exchangeRate: 1,
    exchangeRateTimestamp: null,
    pricePerGramInDepositCurrency: perGramApi,
    priceSourceTimestamp: toPgTimestamptz(row.source_timestamp) ?? toPgTimestamptz(row.quoted_at),
    manuallyEntered: false,
    fromCache: true,
    checkedAt: toPgTimestamptz(row.quoted_at),
  });
}

async function convertToDepositCurrency(
  quote: PriceQuote,
  depositCurrency: string,
  date: string,
  historical: boolean,
): Promise<PriceQuote> {
  if (quote.apiCurrency === depositCurrency) {
    return normalizeQuoteTimestamps({
      ...quote,
      exchangeRate: 1,
      pricePerGramInDepositCurrency: quote.normalizedPricePerGramApi,
    });
  }
  const providers = builtInFxProviders();
  let lastErr: Error | null = null;
  for (const fx of providers) {
    try {
      const t0 = Date.now();
      const rate = await fx.getRate(quote.apiCurrency, depositCurrency, date, historical);
      await logApi({
        provider: fx.getProviderName(),
        action: historical ? "fx-historical" : "fx-current",
        ok: true,
        durationMs: Date.now() - t0,
      });
      const exchanged = priceInDepositCurrency(quote.normalizedPricePerGramApi, rate.rate);
      return normalizeQuoteTimestamps({
        ...quote,
        exchangeRate: roundRate(rate.rate),
        exchangeRateTimestamp: toPgTimestamptz(rate.timestamp),
        pricePerGramInDepositCurrency: exchanged,
      });
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      await logApi({
        provider: fx.getProviderName(),
        action: historical ? "fx-historical" : "fx-current",
        ok: false,
        errorKind: err instanceof ProviderError ? err.kind : "network",
      });
    }
  }
  throw new ProviderError(
    "unavailable",
    lastErr?.message ?? `Could not convert ${quote.apiCurrency} to ${depositCurrency}`,
  );
}

export async function quoteGoldPrice(input: {
  date: string;
  currency: string;
  preferredProvider?: string | null;
  allowCache?: boolean;
}): Promise<QuoteResult> {
  const date = parseIsoDate(input.date);
  const currency = parseCurrency(input.currency);
  const settings = await loadSettings();
  const units: UnitConfig = {
    gramsPerTola: settings.gramsPerTola,
    tolasPerUkhiya: settings.tolasPerUkhiya,
    troyOunceGrams: settings.troyOunceGrams,
  };
  const today = todayIsoDate();
  const historical = date < today;
  const currentProviderPriority = [...new Set([...DEFAULT_PROVIDER_PRIORITY, ...settings.providerPriority])];

  if (input.allowCache !== false && historical) {
    const cached = await readCachedSnapshot(
      date,
      input.preferredProvider ?? null,
      historical ? undefined : settings.currentPriceCacheSeconds,
    );
    if (cached) {
      try {
        const converted = await convertToDepositCurrency(cached, currency, date, historical);
        return { ok: true, quote: converted };
      } catch {
        /* fall through to live providers */
      }
    }
  }

  // Never silently use today's live price for a past deposit date.
  if (historical) {
    const cachedAny = await readCachedSnapshot(date, null);
    if (cachedAny) {
      try {
        const converted = await convertToDepositCurrency(cachedAny, currency, date, true);
        return { ok: true, quote: { ...converted, fromCache: true } };
      } catch {
        /* continue */
      }
    }
    try {
      const { result, fallbackUsed, attempts } = await fetchWithFailover(
        date,
        currency,
        units,
        true,
        settings.providerPriority,
        input.preferredProvider,
      );
      for (const a of attempts) {
        await logApi({
          provider: a.provider,
          action: "gold-historical",
          ok: a.ok,
          durationMs: a.durationMs,
          errorKind: a.errorKind,
        });
      }
      const perGramApi = normalizePricePerGram(result.rawPrice, result.unit, units);
      const base: PriceQuote = normalizeQuoteTimestamps({
        providerName: result.providerName,
        fallbackUsed,
        quoteDate: date,
        apiCurrency: result.currency,
        goldPrice: result.rawPrice,
        goldPriceUnit: result.unit,
        normalizedPricePerGramApi: perGramApi,
        exchangeRate: 1,
        exchangeRateTimestamp: null,
        pricePerGramInDepositCurrency: perGramApi,
        priceSourceTimestamp: toPgTimestamptz(result.sourceTimestamp),
        manuallyEntered: false,
        fromCache: false,
        checkedAt: requirePgTimestamptz(undefined),
      });
      const converted = await convertToDepositCurrency(base, currency, date, true);
      await cacheSnapshot(base, "ok");
      return { ok: true, quote: converted };
    } catch {
      return {
        ok: false,
        reason: "historical_unavailable",
        message: ERRORS.historicalUnavailable,
        triedProviders: settings.providerPriority,
        manualFallbackEnabled: settings.manualPriceFallbackEnabled,
      };
    }
  }

  try {
    const { result, fallbackUsed, attempts } = await fetchWithFailover(
      date,
      currency,
      units,
      false,
      currentProviderPriority,
      input.preferredProvider,
    );
    for (const a of attempts) {
      await logApi({
        provider: a.provider,
        action: "gold-current",
        ok: a.ok,
        durationMs: a.durationMs,
        errorKind: a.errorKind,
      });
    }
    const perGramApi = normalizePricePerGram(result.rawPrice, result.unit, units);
    const base: PriceQuote = normalizeQuoteTimestamps({
      providerName: result.providerName,
      fallbackUsed,
      quoteDate: date,
      apiCurrency: result.currency,
      goldPrice: result.rawPrice,
      goldPriceUnit: result.unit,
      normalizedPricePerGramApi: perGramApi,
      exchangeRate: 1,
      exchangeRateTimestamp: null,
      pricePerGramInDepositCurrency: perGramApi,
      priceSourceTimestamp: toPgTimestamptz(result.sourceTimestamp),
      manuallyEntered: false,
      fromCache: false,
      checkedAt: requirePgTimestamptz(undefined),
    });
    const converted = await convertToDepositCurrency(base, currency, date, false);
    await cacheSnapshot(base, "ok");
    return { ok: true, quote: converted };
  } catch (err) {
    if (input.allowCache !== false) {
      const stale = await readCachedSnapshot(date, input.preferredProvider ?? null);
      if (stale) {
        try {
          const converted = await convertToDepositCurrency(stale, currency, date, false);
          return { ok: true, quote: { ...converted, fromCache: true } };
        } catch {
          /* return the provider error below */
        }
      }
    }
    return {
      ok: false,
      reason: "unavailable",
      message: err instanceof Error ? err.message : ERRORS.quoteUnavailable,
      triedProviders: currentProviderPriority,
      manualFallbackEnabled: settings.manualPriceFallbackEnabled,
    };
  }
}

export async function quoteFromManual(input: {
  date: string;
  currency: string;
  goldPrice: number;
  goldPriceUnit: PriceQuote["goldPriceUnit"];
  gramsPerTola?: number;
}): Promise<QuoteResult> {
  const date = parseIsoDate(input.date);
  const currency = parseCurrency(input.currency);
  const goldPrice = parsePositiveNumber(input.goldPrice, "Gold price");
  const settings = await loadSettings();
  if (!settings.manualPriceFallbackEnabled) {
    return {
      ok: false,
      reason: "unavailable",
      message: ERRORS.manualDisabled,
      triedProviders: [],
      manualFallbackEnabled: false,
    };
  }
  const units: UnitConfig = {
    gramsPerTola: input.gramsPerTola && input.gramsPerTola > 0 ? input.gramsPerTola : settings.gramsPerTola,
    tolasPerUkhiya: settings.tolasPerUkhiya,
    troyOunceGrams: settings.troyOunceGrams,
  };
  const perGram = normalizePricePerGram(goldPrice, input.goldPriceUnit, units);
  const now = requirePgTimestamptz(undefined);
  return {
    ok: true,
    quote: {
      providerName: "manual",
      fallbackUsed: true,
      quoteDate: date,
      apiCurrency: currency,
      goldPrice,
      goldPriceUnit: input.goldPriceUnit,
      normalizedPricePerGramApi: perGram,
      exchangeRate: 1,
      exchangeRateTimestamp: now,
      pricePerGramInDepositCurrency: roundTo(perGram, STORE_MONEY_DECIMALS),
      priceSourceTimestamp: now,
      manuallyEntered: true,
      fromCache: false,
      checkedAt: now,
    },
  };
}

export async function previewGrams(amount: number, quote: PriceQuote): Promise<number> {
  return gramsFromQuote(amount, quote);
}

export { loadSettings };
