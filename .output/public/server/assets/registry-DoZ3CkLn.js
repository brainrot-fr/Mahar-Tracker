import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
//#region src/lib/gold/timestamps.ts
/**
* Postgres timestamptz only accepts ISO-8601 (and a few SQL formats).
* Driver round-trips often yield Date objects; String(date) is
* "Thu Sep 10 2026 01:45:24 GMT+0000 (Coordinated Universal Time)",
* which Postgres rejects. Always coerce before writing.
*/
function toPgTimestamptz(value) {
	if (value == null || value === "") return null;
	let date = null;
	if (value instanceof Date) date = value;
	else if (typeof value === "number" && Number.isFinite(value)) date = new Date(value > 0 && value < 0xe8d4a51000 ? value * 1e3 : value);
	else if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return null;
		if (/^\d+(\.\d+)?$/.test(trimmed)) {
			const n = Number(trimmed);
			date = new Date(n > 0 && n < 0xe8d4a51000 ? n * 1e3 : n);
		} else date = new Date(trimmed);
	}
	if (!date || Number.isNaN(date.getTime())) return null;
	return date.toISOString();
}
function requirePgTimestamptz(value, fallback = /* @__PURE__ */ new Date()) {
	return toPgTimestamptz(value) ?? fallback.toISOString();
}
//#endregion
//#region src/lib/gold/providers/http.ts
var ProviderError = class extends Error {
	kind;
	statusCode;
	durationMs;
	constructor(kind, message, durationMs, statusCode) {
		super(message);
		this.name = "ProviderError";
		this.kind = kind;
		this.durationMs = durationMs;
		this.statusCode = statusCode;
	}
};
async function fetchJson(url, opts = {}) {
	const timeoutMs = opts.timeoutMs ?? 8e3;
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), timeoutMs);
	const started = Date.now();
	try {
		const res = await fetch(url, {
			method: opts.method ?? "GET",
			signal: ctrl.signal,
			headers: {
				Accept: "application/json",
				...opts.headers
			}
		});
		const durationMs = Date.now() - started;
		if (res.status === 401 || res.status === 403) throw new ProviderError("authentication", `HTTP ${res.status}`, durationMs, res.status);
		if (res.status === 429) throw new ProviderError("rate_limit", "Rate limited", durationMs, res.status);
		if (!res.ok) throw new ProviderError("invalid_response", `HTTP ${res.status}`, durationMs, res.status);
		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			throw new ProviderError("invalid_response", "Response was not JSON", durationMs, res.status);
		}
		return {
			data,
			status: res.status,
			durationMs
		};
	} catch (err) {
		if (err instanceof ProviderError) throw err;
		const durationMs = Date.now() - started;
		if (err instanceof Error && err.name === "AbortError") throw new ProviderError("timeout", `Timed out after ${timeoutMs}ms`, durationMs);
		throw new ProviderError("network", err instanceof Error ? err.message : "Network error", durationMs);
	} finally {
		clearTimeout(timer);
	}
}
function envSecret(name) {
	if (typeof process === "undefined") return void 0;
	const v = process.env[name];
	return v && v.trim() ? v.trim() : void 0;
}
//#endregion
//#region src/lib/gold/providers/gold.ts
function assertPositivePrice(price, provider) {
	if (!Number.isFinite(price) || price <= 0) throw new ProviderError("invalid_response", `${provider} returned a non-positive price`);
}
function todayIso() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function isoFromUnixSeconds(seconds) {
	if (!Number.isFinite(seconds) || seconds <= 0) return null;
	return toPgTimestamptz(seconds);
}
function sourceTime(value, fallback) {
	return toPgTimestamptz(value) ?? toPgTimestamptz(fallback) ?? (/* @__PURE__ */ new Date()).toISOString();
}
var GoldApiComProvider = class {
	lastUpdated = null;
	getProviderName() {
		return "gold-api-com";
	}
	requiresSecret() {
		return false;
	}
	isConfigured() {
		return true;
	}
	supportsHistorical() {
		return false;
	}
	getLastUpdatedTime() {
		return this.lastUpdated;
	}
	async checkAvailability() {
		try {
			await this.getCurrentPrice("USD", {
				gramsPerTola: 11.6638,
				tolasPerUkhiya: 11,
				troyOunceGrams: 31.1034768
			});
			return true;
		} catch {
			return false;
		}
	}
	async getCurrentPrice(currency, _units) {
		const { data } = await fetchJson("https://api.gold-api.com/price/XAU");
		assertPositivePrice(data.price, this.getProviderName());
		if (data.symbol && data.symbol !== "XAU") throw new ProviderError("invalid_response", "Unexpected metal symbol");
		this.lastUpdated = sourceTime(data.updatedAt);
		if (currency !== "USD" && data.currency && data.currency !== "USD") throw new ProviderError("unsupported", `Provider quoted ${data.currency}, not USD`);
		return {
			providerName: this.getProviderName(),
			currency: "USD",
			rawPrice: data.price,
			unit: "per_troy_ounce",
			sourceTimestamp: this.lastUpdated,
			quoteDate: todayIso()
		};
	}
	async getHistoricalPrice() {
		throw new ProviderError("unsupported", "gold-api.com does not publish historical prices");
	}
};
/** metals.live — free public spot feed, USD per troy ounce, no API key. */
var MetalsLiveProvider = class {
	lastUpdated = null;
	getProviderName() {
		return "metals-live";
	}
	requiresSecret() {
		return false;
	}
	isConfigured() {
		return true;
	}
	supportsHistorical() {
		return false;
	}
	getLastUpdatedTime() {
		return this.lastUpdated;
	}
	async checkAvailability() {
		try {
			await this.getCurrentPrice("USD", {
				gramsPerTola: 11.6638,
				tolasPerUkhiya: 11,
				troyOunceGrams: 31.1034768
			});
			return true;
		} catch {
			return false;
		}
	}
	async getCurrentPrice(_currency, _units) {
		const { data } = await fetchJson("https://api.metals.live/v1/spot");
		const latest = data.find((item) => Number.isFinite(Number(item.gold)) && Number(item.gold) > 0);
		const price = Number(latest?.gold);
		assertPositivePrice(price, this.getProviderName());
		const timestamp = latest?.timestamp;
		this.lastUpdated = sourceTime(timestamp);
		return {
			providerName: this.getProviderName(),
			currency: "USD",
			rawPrice: price,
			unit: "per_troy_ounce",
			sourceTimestamp: this.lastUpdated,
			quoteDate: todayIso()
		};
	}
	async getHistoricalPrice() {
		throw new ProviderError("unsupported", "metals.live does not publish historical quotes");
	}
};
/** Metals-API latest feed. Its free tier requires a server-side access key. */
var MetalsApiProvider = class {
	lastUpdated = null;
	getProviderName() {
		return "metals-api";
	}
	requiresSecret() {
		return true;
	}
	isConfigured() {
		return Boolean(envSecret("METALS_API_KEY"));
	}
	supportsHistorical() {
		return false;
	}
	getLastUpdatedTime() {
		return this.lastUpdated;
	}
	async checkAvailability() {
		if (!this.isConfigured()) return false;
		try {
			await this.getCurrentPrice("USD", {
				gramsPerTola: 11.6638,
				tolasPerUkhiya: 11,
				troyOunceGrams: 31.1034768
			});
			return true;
		} catch {
			return false;
		}
	}
	async getCurrentPrice(_currency, _units) {
		const key = envSecret("METALS_API_KEY");
		if (!key) throw new ProviderError("authentication", "METALS_API_KEY is not configured");
		const { data } = await fetchJson(`https://metals-api.com/api/latest?access_key=${encodeURIComponent(key)}&base=USD&symbols=XAU`);
		if (data.success === false || data.error || !data.rates) throw new ProviderError("invalid_response", data.error?.info ?? "Metals-API did not return rates");
		const xauPerUsd = Number(data.rates.XAU);
		assertPositivePrice(xauPerUsd, this.getProviderName());
		const price = 1 / xauPerUsd;
		assertPositivePrice(price, this.getProviderName());
		this.lastUpdated = sourceTime(data.timestamp);
		return {
			providerName: this.getProviderName(),
			currency: "USD",
			rawPrice: price,
			unit: "per_troy_ounce",
			sourceTimestamp: this.lastUpdated,
			quoteDate: todayIso()
		};
	}
	async getHistoricalPrice() {
		throw new ProviderError("unsupported", "Metals-API historical quotes require a paid plan");
	}
};
var SwissquoteProvider = class {
	lastUpdated = null;
	getProviderName() {
		return "swissquote";
	}
	requiresSecret() {
		return false;
	}
	isConfigured() {
		return true;
	}
	supportsHistorical() {
		return false;
	}
	getLastUpdatedTime() {
		return this.lastUpdated;
	}
	async checkAvailability() {
		try {
			await this.getCurrentPrice("USD", {
				gramsPerTola: 11.6638,
				tolasPerUkhiya: 11,
				troyOunceGrams: 31.1034768
			});
			return true;
		} catch {
			return false;
		}
	}
	async getCurrentPrice(_currency, _units) {
		const { data } = await fetchJson("https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD");
		const first = data?.[0];
		const profiles = first?.spreadProfilePrices ?? [];
		const ask = (profiles.find((p) => p.spreadProfile === "elite") ?? profiles[0])?.ask;
		assertPositivePrice(ask ?? NaN, this.getProviderName());
		this.lastUpdated = first?.ts ? isoFromUnixSeconds(first.ts / 1e3) : (/* @__PURE__ */ new Date()).toISOString();
		return {
			providerName: this.getProviderName(),
			currency: "USD",
			rawPrice: ask,
			unit: "per_troy_ounce",
			sourceTimestamp: sourceTime(this.lastUpdated),
			quoteDate: todayIso()
		};
	}
	async getHistoricalPrice() {
		throw new ProviderError("unsupported", "Swissquote public feed has no historical quotes");
	}
};
var CoinbaseProvider = class {
	lastUpdated = null;
	getProviderName() {
		return "coinbase";
	}
	requiresSecret() {
		return false;
	}
	isConfigured() {
		return true;
	}
	supportsHistorical() {
		return false;
	}
	getLastUpdatedTime() {
		return this.lastUpdated;
	}
	async checkAvailability() {
		try {
			await this.getCurrentPrice("USD", {
				gramsPerTola: 11.6638,
				tolasPerUkhiya: 11,
				troyOunceGrams: 31.1034768
			});
			return true;
		} catch {
			return false;
		}
	}
	async getCurrentPrice(_currency, _units) {
		const { data } = await fetchJson("https://api.coinbase.com/v2/prices/XAU-USD/spot");
		const amount = Number(data.data?.amount);
		assertPositivePrice(amount, this.getProviderName());
		if (data.data?.base && data.data.base !== "XAU") throw new ProviderError("invalid_response", "Unexpected metal base");
		this.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
		return {
			providerName: this.getProviderName(),
			currency: "USD",
			rawPrice: amount,
			unit: "per_troy_ounce",
			sourceTimestamp: this.lastUpdated,
			quoteDate: todayIso()
		};
	}
	async getHistoricalPrice() {
		throw new ProviderError("unsupported", "Coinbase spot has no dated historical quotes");
	}
};
/**
* goldapi.io — optional. Reads GOLDAPI_IO_KEY from the server environment.
* Never shipped to the client. Supports dated historical XAU quotes when keyed.
*/
var GoldApiIoProvider = class {
	lastUpdated = null;
	getProviderName() {
		return "goldapi-io";
	}
	requiresSecret() {
		return true;
	}
	isConfigured() {
		return Boolean(envSecret("GOLDAPI_IO_KEY"));
	}
	supportsHistorical() {
		return true;
	}
	getLastUpdatedTime() {
		return this.lastUpdated;
	}
	key() {
		const k = envSecret("GOLDAPI_IO_KEY");
		if (!k) throw new ProviderError("authentication", "GOLDAPI_IO_KEY is not configured");
		return k;
	}
	async checkAvailability() {
		if (!this.isConfigured()) return false;
		try {
			await this.getCurrentPrice("USD", {
				gramsPerTola: 11.6638,
				tolasPerUkhiya: 11,
				troyOunceGrams: 31.1034768
			});
			return true;
		} catch {
			return false;
		}
	}
	async fetchSymbol(currency, date) {
		const pathDate = date ? `/${date.replace(/-/g, "")}` : "";
		const { data } = await fetchJson(`https://www.goldapi.io/api/XAU/${encodeURIComponent(currency)}${pathDate}`, { headers: { "x-access-token": this.key() } });
		if (data.error) throw new ProviderError("invalid_response", data.error);
		const perGram = data.price_gram_24k;
		const perOunce = data.price;
		this.lastUpdated = sourceTime(data.timestamp);
		if (Number.isFinite(perGram) && perGram > 0) return {
			providerName: this.getProviderName(),
			currency: data.currency ?? currency,
			rawPrice: perGram,
			unit: "per_gram",
			sourceTimestamp: this.lastUpdated,
			quoteDate: date ?? todayIso()
		};
		assertPositivePrice(perOunce ?? NaN, this.getProviderName());
		return {
			providerName: this.getProviderName(),
			currency: data.currency ?? currency,
			rawPrice: perOunce,
			unit: "per_troy_ounce",
			sourceTimestamp: this.lastUpdated,
			quoteDate: date ?? todayIso()
		};
	}
	getCurrentPrice(currency, _units) {
		return this.fetchSymbol(currency || "INR");
	}
	getHistoricalPrice(date, currency, _units) {
		return this.fetchSymbol(currency || "INR", date);
	}
};
function builtInGoldProviders() {
	return [
		new GoldApiIoProvider(),
		new MetalsLiveProvider(),
		new MetalsApiProvider(),
		new GoldApiComProvider(),
		new SwissquoteProvider(),
		new CoinbaseProvider()
	];
}
//#endregion
//#region src/lib/gold/providers/registry.ts
var registry_exports = /* @__PURE__ */ __exportAll({
	fetchWithFailover: () => fetchWithFailover,
	listProviders: () => listProviders,
	providersByPriority: () => providersByPriority
});
function listProviders() {
	return builtInGoldProviders();
}
function providersByPriority(priority, preferred) {
	const all = listProviders().filter((p) => p.isConfigured());
	const byName = new Map(all.map((p) => [p.getProviderName(), p]));
	const ordered = [];
	const seen = /* @__PURE__ */ new Set();
	const push = (name) => {
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
async function fetchWithFailover(date, currency, units, historical, priority, preferred) {
	const providers = providersByPriority(priority, preferred);
	if (providers.length === 0) throw new ProviderError("unavailable", "No gold-price providers are configured");
	const attempts = [];
	let firstError = null;
	const startedPreferred = preferred ?? providers[0]?.getProviderName();
	for (const provider of providers) {
		const name = provider.getProviderName();
		if (historical && !provider.supportsHistorical()) {
			attempts.push({
				provider: name,
				ok: false,
				errorKind: "unsupported"
			});
			continue;
		}
		const t0 = Date.now();
		try {
			const result = historical ? await provider.getHistoricalPrice(date, currency, units) : await provider.getCurrentPrice(currency, units);
			if (!(result.rawPrice > 0)) throw new ProviderError("invalid_response", "Non-positive price");
			attempts.push({
				provider: name,
				ok: true,
				durationMs: Date.now() - t0
			});
			return {
				result,
				fallbackUsed: name !== startedPreferred,
				attempts
			};
		} catch (err) {
			const kind = err instanceof ProviderError ? err.kind : "network";
			attempts.push({
				provider: name,
				ok: false,
				errorKind: kind,
				durationMs: Date.now() - t0
			});
			firstError = err instanceof Error ? err : new Error(String(err));
		}
	}
	throw new ProviderError("unavailable", firstError?.message ?? "All gold-price providers failed");
}
//#endregion
export { requirePgTimestamptz as a, fetchJson as i, registry_exports as n, toPgTimestamptz as o, ProviderError as r, fetchWithFailover as t };
