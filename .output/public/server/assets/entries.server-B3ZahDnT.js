import { r as ERRORS } from "./copy-C__m_4Lq.js";
import { i as targetGramsFor } from "./units-C4Cl_0jQ.js";
import { i as gramsFromQuote } from "./calc-D8o5dhu5.js";
import { a as requirePgTimestamptz, o as toPgTimestamptz } from "./registry-DoZ3CkLn.js";
import { a as parsePriceUnit, i as parsePositiveNumber, n as parseIsoDate, o as parseUkhiya, r as parseNote, t as parseCurrency } from "./validation-Da5kkcxK.js";
import { a as getSql, loadSettings, n as mapGoal, quoteFromManual, quoteGoldPrice, r as mapProfile, t as mapEntry } from "./quote.server-Cm9rcuR3.js";
//#region src/lib/gold/entries.server.ts
function newId() {
	return crypto.randomUUID();
}
function nowIso() {
	return requirePgTimestamptz(void 0);
}
function isTimestampSyntaxError(err) {
	const msg = err instanceof Error ? err.message : String(err);
	return /invalid input syntax for type timestamp/i.test(msg);
}
async function ensureProfile(userId) {
	const sql = await getSql();
	const existing = await sql`select * from profiles where user_id = ${userId}`;
	if (existing[0]) return mapProfile(existing[0]);
	await sql`insert into profiles (user_id, preferred_currency) values (${userId}, ${(await loadSettings()).defaultCurrency})
    on conflict (user_id) do nothing`;
	const rows = await sql`select * from profiles where user_id = ${userId}`;
	if (!rows[0]) throw new Error("Could not create profile.");
	return mapProfile(rows[0]);
}
async function getActiveGoal(userId) {
	const rows = await (await getSql())`select * from goals where user_id = ${userId} and is_active = true limit 1`;
	return rows[0] ? mapGoal(rows[0]) : null;
}
async function completeOnboarding(input) {
	if (!input.acceptedDisclaimer) throw new Error(ERRORS.confirmDisclaimer);
	const ukhiya = parseUkhiya(input.ukhiyaCount);
	const currency = parseCurrency(input.currency);
	const gramsPerTola = parsePositiveNumber(input.gramsPerTola, "Grams per tola");
	const tolasPerUkhiya = parsePositiveNumber(input.tolasPerUkhiya, "Tolas per ukhiya");
	const settings = await loadSettings();
	if (!settings.permittedUkhiya.includes(ukhiya)) throw new Error(ERRORS.permittedTarget);
	const targetGrams = targetGramsFor(ukhiya, {
		gramsPerTola,
		tolasPerUkhiya
	});
	const sql = await getSql();
	await ensureProfile(input.userId);
	if (await getActiveGoal(input.userId)) throw new Error(ERRORS.targetAlreadySet);
	const id = newId();
	const now = nowIso();
	await sql`insert into goals (
    id, user_id, ukhiya_count, tolas_per_ukhiya, grams_per_tola, target_grams,
    purity_label, purity_fineness, is_active, created_at, updated_at
  ) values (
    ${id}, ${input.userId}, ${ukhiya}, ${tolasPerUkhiya}, ${gramsPerTola}, ${targetGrams},
    ${settings.purityLabel}, ${settings.purityFineness}, true, ${now}, ${now}
  )`;
	await sql`update profiles set preferred_currency = ${currency}, onboarding_completed_at = ${now}, updated_at = ${now}
    where user_id = ${input.userId}`;
	const goal = await getActiveGoal(input.userId);
	const profile = await ensureProfile(input.userId);
	if (!goal) throw new Error(ERRORS.goalNotSaved);
	return {
		profile,
		goal
	};
}
async function changeGoal(input) {
	if (input.confirmPhrase !== "CHANGE TARGET") throw new Error(ERRORS.changeTargetPhrase);
	const ukhiya = parseUkhiya(input.ukhiyaCount);
	const current = await getActiveGoal(input.userId);
	if (!current) throw new Error(ERRORS.noActiveTarget);
	if (current.ukhiyaCount === ukhiya) return current;
	await loadSettings();
	const targetGrams = targetGramsFor(ukhiya, {
		gramsPerTola: current.gramsPerTola,
		tolasPerUkhiya: current.tolasPerUkhiya
	});
	const sql = await getSql();
	const now = nowIso();
	await sql`update goals set is_active = false, updated_at = ${now} where id = ${current.id} and user_id = ${input.userId}`;
	const id = newId();
	await sql`insert into goals (
    id, user_id, ukhiya_count, tolas_per_ukhiya, grams_per_tola, target_grams,
    purity_label, purity_fineness, is_active, created_at, updated_at
  ) values (
    ${id}, ${input.userId}, ${ukhiya}, ${current.tolasPerUkhiya}, ${current.gramsPerTola}, ${targetGrams},
    ${current.purityLabel}, ${current.purityFineness}, true, ${now}, ${now}
  )`;
	await sql`update savings_entries set goal_id = ${id}, updated_at = ${now}
    where user_id = ${input.userId} and goal_id = ${current.id} and deleted_at is null`;
	const goal = await getActiveGoal(input.userId);
	if (!goal) throw new Error(ERRORS.targetNotUpdated);
	return goal;
}
async function updatePreferences(input) {
	await ensureProfile(input.userId);
	const sql = await getSql();
	const now = nowIso();
	if (input.preferredCurrency) await sql`update profiles set preferred_currency = ${parseCurrency(input.preferredCurrency)}, updated_at = ${now} where user_id = ${input.userId}`;
	if (input.selectedProvider !== void 0) await sql`update profiles set selected_provider = ${input.selectedProvider ? String(input.selectedProvider) : null}, updated_at = ${now} where user_id = ${input.userId}`;
	return ensureProfile(input.userId);
}
function quoteToEntryFields(quote, amount) {
	return {
		grams: gramsFromQuote(amount, quote),
		apiCurrency: quote.apiCurrency,
		exchangeRate: quote.exchangeRate,
		exchangeRateTimestamp: toPgTimestamptz(quote.exchangeRateTimestamp),
		goldPrice: quote.goldPrice,
		goldPriceUnit: quote.goldPriceUnit,
		normalizedPricePerGram: quote.pricePerGramInDepositCurrency,
		providerName: quote.providerName,
		fallbackUsed: quote.fallbackUsed,
		priceSourceTimestamp: toPgTimestamptz(quote.priceSourceTimestamp),
		manuallyEnteredPrice: quote.manuallyEntered
	};
}
async function createEntry(input) {
	const amount = parsePositiveNumber(input.amount, "Amount set aside");
	const currency = parseCurrency(input.currency);
	const depositDate = parseIsoDate(input.depositDate);
	const note = parseNote(input.note ?? null);
	if (!input.idempotencyKey || input.idempotencyKey.length < 8) throw new Error(ERRORS.missingIdempotency);
	const sql = await getSql();
	const existing = await sql`select * from savings_entries
    where user_id = ${input.userId} and client_idempotency_key = ${input.idempotencyKey} limit 1`;
	if (existing[0]) return mapEntry(existing[0]);
	const goal = await getActiveGoal(input.userId);
	if (!goal) throw new Error(ERRORS.setTargetFirst);
	const profile = await ensureProfile(input.userId);
	let quote;
	if (input.manualPrice) {
		if (!input.manualPrice.confirmed) throw new Error(ERRORS.confirmManualPrice);
		const manual = await quoteFromManual({
			date: depositDate,
			currency,
			goldPrice: input.manualPrice.goldPrice,
			goldPriceUnit: parsePriceUnit(input.manualPrice.goldPriceUnit),
			gramsPerTola: goal.gramsPerTola
		});
		if (!manual.ok) throw new Error(manual.message);
		quote = manual.quote;
	} else {
		const live = await quoteGoldPrice({
			date: depositDate,
			currency,
			preferredProvider: profile.selectedProvider
		});
		if (!live.ok) throw new Error(live.message);
		quote = live.quote;
	}
	const fields = quoteToEntryFields(quote, amount);
	const id = newId();
	const now = nowIso();
	try {
		await sql`insert into savings_entries (
      id, user_id, goal_id, client_idempotency_key, deposit_date,
      deposited_amount, deposited_currency, api_currency, exchange_rate, exchange_rate_timestamp,
      gold_price, gold_price_unit, normalized_price_per_gram, completed_grams,
      provider_name, fallback_used, price_source_timestamp, manually_entered_price,
      note, status, created_at, updated_at
    ) values (
      ${id}, ${input.userId}, ${goal.id}, ${input.idempotencyKey}, ${depositDate},
      ${amount}, ${currency}, ${fields.apiCurrency}, ${fields.exchangeRate}, ${fields.exchangeRateTimestamp},
      ${fields.goldPrice}, ${fields.goldPriceUnit}, ${fields.normalizedPricePerGram}, ${fields.grams},
      ${fields.providerName}, ${fields.fallbackUsed}, ${fields.priceSourceTimestamp}, ${fields.manuallyEnteredPrice},
      ${note}, ${"posted"}, ${now}, ${now}
    )`;
	} catch (err) {
		if (isTimestampSyntaxError(err)) throw new Error(ERRORS.timestampSave);
		throw err;
	}
	const rows = await sql`select * from savings_entries where id = ${id} and user_id = ${input.userId}`;
	if (!rows[0]) throw new Error(ERRORS.entryNotSaved);
	return mapEntry(rows[0]);
}
async function listEntries(userId, sort = "newest") {
	const sql = await getSql();
	const order = sort === "oldest" ? "deposit_date asc, created_at asc" : sort === "largest_deposit" ? "deposited_amount desc, deposit_date desc" : sort === "largest_grams" ? "completed_grams desc, deposit_date desc" : "deposit_date desc, created_at desc";
	return (await sql.query(`select * from savings_entries where user_id = $1 and deleted_at is null and status <> 'deleted' order by ${order}`, [userId])).map(mapEntry);
}
async function getEntry(userId, id) {
	const rows = await (await getSql())`select * from savings_entries where id = ${id} and user_id = ${userId} and deleted_at is null`;
	return rows[0] ? mapEntry(rows[0]) : null;
}
async function updateEntry(input) {
	const current = await getEntry(input.userId, input.id);
	if (!current) throw new Error(ERRORS.entryNotFound);
	const amount = input.amount != null ? parsePositiveNumber(input.amount, "Amount set aside") : current.depositedAmount;
	const depositDate = input.depositDate ? parseIsoDate(input.depositDate) : current.depositDate;
	const currency = input.currency ? parseCurrency(input.currency) : current.depositedCurrency;
	const note = input.note !== void 0 ? parseNote(input.note) : current.note;
	const dateOrAmountChanged = amount !== current.depositedAmount || depositDate !== current.depositDate || currency !== current.depositedCurrency;
	const sql = await getSql();
	const now = nowIso();
	const goal = await getActiveGoal(input.userId);
	const profile = await ensureProfile(input.userId);
	if (!dateOrAmountChanged) {
		await sql`update savings_entries set note = ${note}, updated_at = ${now}
      where id = ${current.id} and user_id = ${input.userId}`;
		const row = await getEntry(input.userId, current.id);
		if (!row) throw new Error(ERRORS.entryNotFound);
		return row;
	}
	let quote;
	if (input.manualPrice) {
		if (!input.manualPrice.confirmed) throw new Error(ERRORS.confirmManualPrice);
		const manual = await quoteFromManual({
			date: depositDate,
			currency,
			goldPrice: input.manualPrice.goldPrice,
			goldPriceUnit: parsePriceUnit(input.manualPrice.goldPriceUnit),
			gramsPerTola: goal?.gramsPerTola
		});
		if (!manual.ok) throw new Error(manual.message);
		quote = manual.quote;
	} else {
		const live = await quoteGoldPrice({
			date: depositDate,
			currency,
			preferredProvider: profile.selectedProvider
		});
		if (!live.ok) throw new Error(live.message);
		quote = live.quote;
	}
	const fields = quoteToEntryFields(quote, amount);
	try {
		await sql`update savings_entries set
      deposit_date = ${depositDate},
      deposited_amount = ${amount},
      deposited_currency = ${currency},
      api_currency = ${fields.apiCurrency},
      exchange_rate = ${fields.exchangeRate},
      exchange_rate_timestamp = ${fields.exchangeRateTimestamp},
      gold_price = ${fields.goldPrice},
      gold_price_unit = ${fields.goldPriceUnit},
      normalized_price_per_gram = ${fields.normalizedPricePerGram},
      completed_grams = ${fields.grams},
      provider_name = ${fields.providerName},
      fallback_used = ${fields.fallbackUsed},
      price_source_timestamp = ${fields.priceSourceTimestamp},
      manually_entered_price = ${fields.manuallyEnteredPrice},
      note = ${note},
      updated_at = ${now}
      where id = ${current.id} and user_id = ${input.userId}`;
	} catch (err) {
		if (isTimestampSyntaxError(err)) throw new Error(ERRORS.timestampSave);
		throw err;
	}
	const row = await getEntry(input.userId, current.id);
	if (!row) throw new Error(ERRORS.entryNotFound);
	return row;
}
async function deleteEntry(input) {
	if (input.confirmPhrase !== "CONFIRM") throw new Error(ERRORS.typeConfirmDelete);
	const current = await getEntry(input.userId, input.id);
	if (!current) throw new Error(ERRORS.entryNotFound);
	const sql = await getSql();
	const now = nowIso();
	await sql`update savings_entries set status = 'deleted', deleted_at = ${now}, updated_at = ${now}
    where id = ${current.id} and user_id = ${input.userId}`;
}
async function exportUserData(userId) {
	const profile = await ensureProfile(userId);
	const goal = await getActiveGoal(userId);
	const entries = await listEntries(userId, "oldest");
	const settings = await loadSettings();
	return {
		exportedAt: nowIso(),
		profile,
		goal,
		settings: {
			gramsPerTola: settings.gramsPerTola,
			tolasPerUkhiya: settings.tolasPerUkhiya,
			permittedUkhiya: settings.permittedUkhiya
		},
		entries
	};
}
async function deleteAccount(userId, confirmPhrase) {
	if (confirmPhrase !== "DELETE ACCOUNT") throw new Error(ERRORS.typeDeleteAccount);
	const sql = await getSql();
	await sql`delete from savings_entries where user_id = ${userId}`;
	await sql`delete from goals where user_id = ${userId}`;
	await sql`delete from profiles where user_id = ${userId}`;
}
//#endregion
export { changeGoal, completeOnboarding, createEntry, deleteAccount, deleteEntry, ensureProfile, exportUserData, getActiveGoal, getEntry, listEntries, updateEntry, updatePreferences };
