import { fetchJson, ProviderError } from "./http";
import type { FxProvider, FxQuote } from "./types";
import { toPgTimestamptz } from "../timestamps";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export class OpenErApiFxProvider implements FxProvider {
  getProviderName() {
    return "open-er-api";
  }
  async getRate(from: string, to: string, date: string, historical: boolean): Promise<FxQuote> {
    if (from === to) {
      return {
        providerName: this.getProviderName(),
        from,
        to,
        rate: 1,
        timestamp: new Date().toISOString(),
        asOfDate: date,
      };
    }
    // Free latest endpoint. Historical is not guaranteed — refuse rather than
    // silently substituting today's rate for a past deposit date.
    if (historical && date !== todayIso()) {
      throw new ProviderError("unsupported", "open.er-api.com latest feed is not a historical series");
    }
    const { data } = await fetchJson<{
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
      base_code?: string;
    }>(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`);
    if (data.result !== "success" || !data.rates) {
      throw new ProviderError("invalid_response", "FX provider did not return rates");
    }
    const rate = data.rates[to];
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new ProviderError("unsupported", `No FX rate for ${from}→${to}`);
    }
    return {
      providerName: this.getProviderName(),
      from,
      to,
      rate,
      timestamp: toPgTimestamptz(data.time_last_update_utc) ?? new Date().toISOString(),
      asOfDate: todayIso(),
    };
  }
}

/** Dated FX via the public currency-api dataset (historical JSON by date). */
export class CurrencyApiFxProvider implements FxProvider {
  getProviderName() {
    return "currency-api";
  }
  async getRate(from: string, to: string, date: string, historical: boolean): Promise<FxQuote> {
    if (from === to) {
      return {
        providerName: this.getProviderName(),
        from,
        to,
        rate: 1,
        timestamp: new Date().toISOString(),
        asOfDate: date,
      };
    }
    const tag = historical ? date : "latest";
    const base = from.toLowerCase();
    const quote = to.toLowerCase();
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${tag}/v1/currencies/${base}.min.json`;
    const { data } = await fetchJson<Record<string, unknown>>(url);
    const table = data[base] as Record<string, number> | undefined;
    const rate = table?.[quote];
    if (!Number.isFinite(rate) || (rate as number) <= 0) {
      throw new ProviderError("unsupported", `No FX rate for ${from}→${to} on ${date}`);
    }
    const dateField = typeof data.date === "string" ? data.date : date;
    return {
      providerName: this.getProviderName(),
      from,
      to,
      rate: rate as number,
      timestamp: toPgTimestamptz(`${dateField}T00:00:00Z`) ?? new Date().toISOString(),
      asOfDate: dateField,
    };
  }
}

export function builtInFxProviders(): FxProvider[] {
  return [new CurrencyApiFxProvider(), new OpenErApiFxProvider()];
}
