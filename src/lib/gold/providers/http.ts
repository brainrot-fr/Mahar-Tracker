import type { ProviderErrorKind } from "../types";

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly statusCode?: number;
  readonly durationMs?: number;
  constructor(kind: ProviderErrorKind, message: string, durationMs?: number, statusCode?: number) {
    super(message);
    this.name = "ProviderError";
    this.kind = kind;
    this.durationMs = durationMs;
    this.statusCode = statusCode;
  }
}

export async function fetchJson<T>(
  url: string,
  opts: {
    timeoutMs?: number;
    headers?: Record<string, string>;
    method?: string;
  } = {},
): Promise<{ data: T; status: number; durationMs: number }> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...opts.headers,
      },
    });
    const durationMs = Date.now() - started;
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError("authentication", `HTTP ${res.status}`, durationMs, res.status);
    }
    if (res.status === 429) {
      throw new ProviderError("rate_limit", "Rate limited", durationMs, res.status);
    }
    if (!res.ok) {
      throw new ProviderError("invalid_response", `HTTP ${res.status}`, durationMs, res.status);
    }
    const text = await res.text();
    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new ProviderError("invalid_response", "Response was not JSON", durationMs, res.status);
    }
    return { data, status: res.status, durationMs };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    const durationMs = Date.now() - started;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ProviderError("timeout", `Timed out after ${timeoutMs}ms`, durationMs);
    }
    throw new ProviderError("network", err instanceof Error ? err.message : "Network error", durationMs);
  } finally {
    clearTimeout(timer);
  }
}

export function envSecret(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}
