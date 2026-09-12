import { r as ERRORS } from "./copy-C__m_4Lq.js";
import { a as PERMITTED_UKHIYA, n as DEFAULT_PROVIDER_PRIORITY } from "./constants-7dvr3BEP.js";
import { n as roundTo, t as normalizePricePerGram } from "./units-C4Cl_0jQ.js";
import { a as priceInDepositCurrency, o as roundRate } from "./calc-D8o5dhu5.js";
import { a as requirePgTimestamptz, i as fetchJson, o as toPgTimestamptz, r as ProviderError, t as fetchWithFailover } from "./registry-DoZ3CkLn.js";
import { i as parsePositiveNumber, n as parseIsoDate, s as todayIsoDate, t as parseCurrency } from "./validation-Da5kkcxK.js";
//#region src/lib/db.ts
var databaseUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
var globalRef = globalThis;
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (value) => value;
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0] ?? "";
		for (let index = 0; index < values.length; index += 1) text += `$${index + 1}${strings[index + 1] ?? ""}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
async function createSupabaseSql() {
	if (!databaseUrl) throw new Error("Missing SUPABASE_DB_URL");
	const parsedUrl = new URL(databaseUrl);
	if (/^db\.[^.]+\.supabase\.co$/i.test(parsedUrl.hostname) || parsedUrl.port === "5432") throw new Error("SUPABASE_DB_URL uses Supabase's direct database endpoint. Copy the IPv4 transaction-pooler URL from Supabase Connect instead; it uses a *.pooler.supabase.com hostname and port 6543.");
	globalRef.__supabaseSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("pg");
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({
			connectionString: databaseUrl,
			family: 4,
			connectionTimeoutMillis: 1e4
		});
		return toSql(async (text, params) => {
			try {
				return (await pool.query(text, params)).rows;
			} catch (error) {
				const code = error && typeof error === "object" && "code" in error ? error.code : void 0;
				if (code === "ENETUNREACH" || code === "ENETDOWN" || code === "EHOSTUNREACH") throw new Error("Supabase Postgres is unreachable. Use the IPv4 transaction-pooler URL from Supabase Connect (port 6543), URL-encode special characters in its password, and restart the dev server.", { cause: error });
				throw error;
			}
		});
	})().catch((error) => {
		globalRef.__supabaseSqlPromise__ = void 0;
		throw error;
	});
	return globalRef.__supabaseSqlPromise__;
}
var sqlPromise = null;
function getSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only");
	sqlPromise ??= createSupabaseSql().catch((error) => {
		sqlPromise = null;
		throw error;
	});
	return sqlPromise;
}
//#endregion
//#region src/lib/gold/map.ts
function num(value) {
	if (typeof value === "number") return value;
	if (typeof value === "string") return Number(value);
	if (value == null) return NaN;
	return Number(value);
}
function str(value) {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (value instanceof Date) return value.toISOString();
	return String(value);
}
function strOrNull(value) {
	if (value == null || value === "") return null;
	return str(value);
}
function dateOnly(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
	const s = str(value);
	if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
	const iso = toPgTimestamptz(value);
	return iso ? iso.slice(0, 10) : s.slice(0, 10);
}
function splitCsv(value) {
	return value.split(",").map((s) => s.trim()).filter(Boolean);
}
function mapSettings(row) {
	const permitted = splitCsv(str(row.permitted_ukhiya)).map(Number).filter((n) => PERMITTED_UKHIYA.includes(n));
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
		currentPriceCacheSeconds: num(row.current_price_cache_seconds) || 900
	};
}
function mapProfile(row) {
	return {
		userId: str(row.user_id),
		preferredCurrency: str(row.preferred_currency) || "INR",
		selectedProvider: strOrNull(row.selected_provider),
		onboardingCompletedAt: strOrNull(row.onboarding_completed_at),
		createdAt: str(row.created_at),
		updatedAt: str(row.updated_at)
	};
}
function mapGoal(row) {
	return {
		id: str(row.id),
		userId: str(row.user_id),
		ukhiyaCount: num(row.ukhiya_count),
		tolasPerUkhiya: num(row.tolas_per_ukhiya),
		gramsPerTola: num(row.grams_per_tola),
		targetGrams: num(row.target_grams),
		purityLabel: str(row.purity_label),
		purityFineness: num(row.purity_fineness),
		isActive: Boolean(row.is_active),
		createdAt: str(row.created_at),
		updatedAt: str(row.updated_at)
	};
}
function mapEntry(row) {
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
		goldPriceUnit: str(row.gold_price_unit),
		normalizedPricePerGram: num(row.normalized_price_per_gram),
		completedGrams: num(row.completed_grams),
		providerName: str(row.provider_name),
		fallbackUsed: Boolean(row.fallback_used),
		priceSourceTimestamp: toPgTimestamptz(row.price_source_timestamp),
		manuallyEnteredPrice: Boolean(row.manually_entered_price),
		note: strOrNull(row.note),
		status: str(row.status),
		createdAt: str(row.created_at),
		updatedAt: str(row.updated_at),
		deletedAt: toPgTimestamptz(row.deleted_at)
	};
}
//#endregion
//#region src/lib/gold/providers/fx.ts
function todayIso() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
var OpenErApiFxProvider = class {
	getProviderName() {
		return "open-er-api";
	}
	async getRate(from, to, date, historical) {
		if (from === to) return {
			providerName: this.getProviderName(),
			from,
			to,
			rate: 1,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			asOfDate: date
		};
		if (historical && date !== todayIso()) throw new ProviderError("unsupported", "open.er-api.com latest feed is not a historical series");
		const { data } = await fetchJson(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`);
		if (data.result !== "success" || !data.rates) throw new ProviderError("invalid_response", "FX provider did not return rates");
		const rate = data.rates[to];
		if (!Number.isFinite(rate) || rate <= 0) throw new ProviderError("unsupported", `No FX rate for ${from}→${to}`);
		return {
			providerName: this.getProviderName(),
			from,
			to,
			rate,
			timestamp: toPgTimestamptz(data.time_last_update_utc) ?? (/* @__PURE__ */ new Date()).toISOString(),
			asOfDate: todayIso()
		};
	}
};
/** Dated FX via the public currency-api dataset (historical JSON by date). */
var CurrencyApiFxProvider = class {
	getProviderName() {
		return "currency-api";
	}
	async getRate(from, to, date, historical) {
		if (from === to) return {
			providerName: this.getProviderName(),
			from,
			to,
			rate: 1,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			asOfDate: date
		};
		const tag = historical ? date : "latest";
		const base = from.toLowerCase();
		const quote = to.toLowerCase();
		const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${tag}/v1/currencies/${base}.min.json`;
		const { data } = await fetchJson(url);
		const rate = data[base]?.[quote];
		if (!Number.isFinite(rate) || rate <= 0) throw new ProviderError("unsupported", `No FX rate for ${from}→${to} on ${date}`);
		const dateField = typeof data.date === "string" ? data.date : date;
		return {
			providerName: this.getProviderName(),
			from,
			to,
			rate,
			timestamp: toPgTimestamptz(`${dateField}T00:00:00Z`) ?? (/* @__PURE__ */ new Date()).toISOString(),
			asOfDate: dateField
		};
	}
};
function builtInFxProviders() {
	return [new CurrencyApiFxProvider(), new OpenErApiFxProvider()];
}
//#endregion
//#region src/lib/gold/quote.server.ts
function newId() {
	return crypto.randomUUID();
}
async function loadSettings() {
	const rows = await (await getSql())`select * from app_settings where id = 'global'`;
	if (!rows[0]) throw new Error("App settings are missing.");
	return mapSettings(rows[0]);
}
async function logApi(args) {
	try {
		await (await getSql())`insert into api_logs (id, provider, action, ok, status_code, duration_ms, error_kind)
      values (${newId()}, ${args.provider}, ${args.action}, ${args.ok}, ${args.statusCode ?? null}, ${args.durationMs ?? null}, ${args.errorKind ?? null})`;
	} catch {}
}
function normalizeQuoteTimestamps(quote) {
	return {
		...quote,
		exchangeRateTimestamp: toPgTimestamptz(quote.exchangeRateTimestamp),
		priceSourceTimestamp: toPgTimestamptz(quote.priceSourceTimestamp),
		checkedAt: toPgTimestamptz(quote.checkedAt)
	};
}
async function cacheSnapshot(quote, apiStatus) {
	const sql = await getSql();
	const quotedAt = requirePgTimestamptz(void 0);
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
async function readCachedSnapshot(date, preferredProvider, maxAgeSeconds) {
	const sql = await getSql();
	const maxAge = maxAgeSeconds == null ? null : Math.max(0, Math.floor(maxAgeSeconds));
	const row = (preferredProvider ? await sql`select * from price_snapshots
        where quote_date = ${date} and provider = ${preferredProvider}
        and (${maxAge}::int is null or quoted_at > now() - (${maxAge ?? 0} * interval '1 second'))
        order by quoted_at desc limit 1` : await sql`select * from price_snapshots
        where quote_date = ${date}
        and (${maxAge}::int is null or quoted_at > now() - (${maxAge ?? 0} * interval '1 second'))
        order by quoted_at desc limit 1`)[0];
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
		goldPriceUnit: String(row.price_unit),
		normalizedPricePerGramApi: perGramApi,
		exchangeRate: 1,
		exchangeRateTimestamp: null,
		pricePerGramInDepositCurrency: perGramApi,
		priceSourceTimestamp: toPgTimestamptz(row.source_timestamp) ?? toPgTimestamptz(row.quoted_at),
		manuallyEntered: false,
		fromCache: true,
		checkedAt: toPgTimestamptz(row.quoted_at)
	});
}
async function convertToDepositCurrency(quote, depositCurrency, date, historical) {
	if (quote.apiCurrency === depositCurrency) return normalizeQuoteTimestamps({
		...quote,
		exchangeRate: 1,
		pricePerGramInDepositCurrency: quote.normalizedPricePerGramApi
	});
	const providers = builtInFxProviders();
	let lastErr = null;
	for (const fx of providers) try {
		const t0 = Date.now();
		const rate = await fx.getRate(quote.apiCurrency, depositCurrency, date, historical);
		await logApi({
			provider: fx.getProviderName(),
			action: historical ? "fx-historical" : "fx-current",
			ok: true,
			durationMs: Date.now() - t0
		});
		const exchanged = priceInDepositCurrency(quote.normalizedPricePerGramApi, rate.rate);
		return normalizeQuoteTimestamps({
			...quote,
			exchangeRate: roundRate(rate.rate),
			exchangeRateTimestamp: toPgTimestamptz(rate.timestamp),
			pricePerGramInDepositCurrency: exchanged
		});
	} catch (err) {
		lastErr = err instanceof Error ? err : new Error(String(err));
		await logApi({
			provider: fx.getProviderName(),
			action: historical ? "fx-historical" : "fx-current",
			ok: false,
			errorKind: err instanceof ProviderError ? err.kind : "network"
		});
	}
	throw new ProviderError("unavailable", lastErr?.message ?? `Could not convert ${quote.apiCurrency} to ${depositCurrency}`);
}
async function quoteGoldPrice(input) {
	const date = parseIsoDate(input.date);
	const currency = parseCurrency(input.currency);
	const settings = await loadSettings();
	const units = {
		gramsPerTola: settings.gramsPerTola,
		tolasPerUkhiya: settings.tolasPerUkhiya,
		troyOunceGrams: settings.troyOunceGrams
	};
	const historical = date < todayIsoDate();
	const currentProviderPriority = [.../* @__PURE__ */ new Set([...DEFAULT_PROVIDER_PRIORITY, ...settings.providerPriority])];
	if (input.allowCache !== false && historical) {
		const cached = await readCachedSnapshot(date, input.preferredProvider ?? null, historical ? void 0 : settings.currentPriceCacheSeconds);
		if (cached) try {
			return {
				ok: true,
				quote: await convertToDepositCurrency(cached, currency, date, historical)
			};
		} catch {}
	}
	if (historical) {
		const cachedAny = await readCachedSnapshot(date, null);
		if (cachedAny) try {
			return {
				ok: true,
				quote: {
					...await convertToDepositCurrency(cachedAny, currency, date, true),
					fromCache: true
				}
			};
		} catch {}
		try {
			const { result, fallbackUsed, attempts } = await fetchWithFailover(date, currency, units, true, settings.providerPriority, input.preferredProvider);
			for (const a of attempts) await logApi({
				provider: a.provider,
				action: "gold-historical",
				ok: a.ok,
				durationMs: a.durationMs,
				errorKind: a.errorKind
			});
			const perGramApi = normalizePricePerGram(result.rawPrice, result.unit, units);
			const base = normalizeQuoteTimestamps({
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
				checkedAt: requirePgTimestamptz(void 0)
			});
			const converted = await convertToDepositCurrency(base, currency, date, true);
			await cacheSnapshot(base, "ok");
			return {
				ok: true,
				quote: converted
			};
		} catch {
			return {
				ok: false,
				reason: "historical_unavailable",
				message: ERRORS.historicalUnavailable,
				triedProviders: settings.providerPriority,
				manualFallbackEnabled: settings.manualPriceFallbackEnabled
			};
		}
	}
	try {
		const { result, fallbackUsed, attempts } = await fetchWithFailover(date, currency, units, false, currentProviderPriority, input.preferredProvider);
		for (const a of attempts) await logApi({
			provider: a.provider,
			action: "gold-current",
			ok: a.ok,
			durationMs: a.durationMs,
			errorKind: a.errorKind
		});
		const perGramApi = normalizePricePerGram(result.rawPrice, result.unit, units);
		const base = normalizeQuoteTimestamps({
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
			checkedAt: requirePgTimestamptz(void 0)
		});
		const converted = await convertToDepositCurrency(base, currency, date, false);
		await cacheSnapshot(base, "ok");
		return {
			ok: true,
			quote: converted
		};
	} catch (err) {
		if (input.allowCache !== false) {
			const stale = await readCachedSnapshot(date, input.preferredProvider ?? null);
			if (stale) try {
				return {
					ok: true,
					quote: {
						...await convertToDepositCurrency(stale, currency, date, false),
						fromCache: true
					}
				};
			} catch {}
		}
		return {
			ok: false,
			reason: "unavailable",
			message: err instanceof Error ? err.message : ERRORS.quoteUnavailable,
			triedProviders: currentProviderPriority,
			manualFallbackEnabled: settings.manualPriceFallbackEnabled
		};
	}
}
async function quoteFromManual(input) {
	const date = parseIsoDate(input.date);
	const currency = parseCurrency(input.currency);
	const goldPrice = parsePositiveNumber(input.goldPrice, "Gold price");
	const settings = await loadSettings();
	if (!settings.manualPriceFallbackEnabled) return {
		ok: false,
		reason: "unavailable",
		message: ERRORS.manualDisabled,
		triedProviders: [],
		manualFallbackEnabled: false
	};
	const units = {
		gramsPerTola: input.gramsPerTola && input.gramsPerTola > 0 ? input.gramsPerTola : settings.gramsPerTola,
		tolasPerUkhiya: settings.tolasPerUkhiya,
		troyOunceGrams: settings.troyOunceGrams
	};
	const perGram = normalizePricePerGram(goldPrice, input.goldPriceUnit, units);
	const now = requirePgTimestamptz(void 0);
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
			pricePerGramInDepositCurrency: roundTo(perGram, 6),
			priceSourceTimestamp: now,
			manuallyEntered: true,
			fromCache: false,
			checkedAt: now
		}
	};
}
//#endregion
export { getSql as a, mapSettings as i, loadSettings, mapGoal as n, quoteFromManual, quoteGoldPrice, mapProfile as r, mapEntry as t };
