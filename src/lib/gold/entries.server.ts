import { getSql } from "@/lib/db";
import { gramsFromQuote } from "./calc";
import type { Goal, PriceQuote, Profile, SavingsEntry } from "./types";
import { mapEntry, mapGoal, mapProfile, mapSettings, type EntryRow, type GoalRow, type ProfileRow } from "./map";
import { targetGramsFor } from "./units";
import {
  parseCurrency,
  parseIsoDate,
  parseNote,
  parsePositiveNumber,
  parsePriceUnit,
  parseUkhiya,
} from "./validation";
import { loadSettings, quoteFromManual, quoteGoldPrice } from "./quote.server";
import { PERMITTED_UKHIYA } from "./constants";
import { ERRORS } from "./copy";
import { requirePgTimestamptz, toPgTimestamptz } from "./timestamps";

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return requirePgTimestamptz(undefined);
}

function isTimestampSyntaxError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /invalid input syntax for type timestamp/i.test(msg);
}

export async function ensureProfile(userId: string): Promise<Profile> {
  const sql = await getSql();
  const existing = await sql<ProfileRow>`select * from profiles where user_id = ${userId}`;
  if (existing[0]) return mapProfile(existing[0]);
  const settings = await loadSettings();
  await sql`insert into profiles (user_id, preferred_currency) values (${userId}, ${settings.defaultCurrency})
    on conflict (user_id) do nothing`;
  const rows = await sql<ProfileRow>`select * from profiles where user_id = ${userId}`;
  if (!rows[0]) throw new Error("Could not create profile.");
  return mapProfile(rows[0]);
}

export async function getActiveGoal(userId: string): Promise<Goal | null> {
  const sql = await getSql();
  const rows = await sql<GoalRow>`select * from goals where user_id = ${userId} and is_active = true limit 1`;
  return rows[0] ? mapGoal(rows[0]) : null;
}

export async function completeOnboarding(input: {
  userId: string;
  ukhiyaCount: number;
  currency: string;
  gramsPerTola: number;
  tolasPerUkhiya: number;
  acceptedDisclaimer: boolean;
  acknowledgedPromisedMahdi: boolean;
}): Promise<{ profile: Profile; goal: Goal }> {
  if (!input.acceptedDisclaimer) {
    throw new Error(ERRORS.confirmDisclaimer);
  }
  if (!input.acknowledgedPromisedMahdi) {
    throw new Error(ERRORS.confirmMahdiAcknowledgement);
  }
  const ukhiya = parseUkhiya(input.ukhiyaCount);
  const currency = parseCurrency(input.currency);
  const gramsPerTola = parsePositiveNumber(input.gramsPerTola, "Grams per tola");
  const tolasPerUkhiya = parsePositiveNumber(input.tolasPerUkhiya, "Tolas per ukhiya");
  const settings = await loadSettings();
  if (!settings.permittedUkhiya.includes(ukhiya)) {
    throw new Error(ERRORS.permittedTarget);
  }
  const targetGrams = targetGramsFor(ukhiya, { gramsPerTola, tolasPerUkhiya });
  const sql = await getSql();
  await ensureProfile(input.userId);
  const existing = await getActiveGoal(input.userId);
  if (existing) {
    throw new Error(ERRORS.targetAlreadySet);
  }
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
  return { profile, goal };
}

export async function changeGoal(input: {
  userId: string;
  ukhiyaCount: number;
  confirmPhrase: string;
}): Promise<Goal> {
  if (input.confirmPhrase !== "CHANGE TARGET") {
    throw new Error(ERRORS.changeTargetPhrase);
  }
  const ukhiya = parseUkhiya(input.ukhiyaCount);
  const current = await getActiveGoal(input.userId);
  if (!current) throw new Error(ERRORS.noActiveTarget);
  if (current.ukhiyaCount === ukhiya) return current;
  const settings = await loadSettings();
  const targetGrams = targetGramsFor(ukhiya, {
    gramsPerTola: current.gramsPerTola,
    tolasPerUkhiya: current.tolasPerUkhiya,
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
  // Point historical entries at the new active goal so progress stays one ledger.
  await sql`update savings_entries set goal_id = ${id}, updated_at = ${now}
    where user_id = ${input.userId} and goal_id = ${current.id} and deleted_at is null`;
  void settings;
  const goal = await getActiveGoal(input.userId);
  if (!goal) throw new Error(ERRORS.targetNotUpdated);
  return goal;
}

export async function updatePreferences(input: {
  userId: string;
  preferredCurrency?: string;
  selectedProvider?: string | null;
}): Promise<Profile> {
  await ensureProfile(input.userId);
  const sql = await getSql();
  const now = nowIso();
  if (input.preferredCurrency) {
    const currency = parseCurrency(input.preferredCurrency);
    await sql`update profiles set preferred_currency = ${currency}, updated_at = ${now} where user_id = ${input.userId}`;
  }
  if (input.selectedProvider !== undefined) {
    const name = input.selectedProvider ? String(input.selectedProvider) : null;
    await sql`update profiles set selected_provider = ${name}, updated_at = ${now} where user_id = ${input.userId}`;
  }
  return ensureProfile(input.userId);
}

function quoteToEntryFields(quote: PriceQuote, amount: number) {
  const grams = gramsFromQuote(amount, quote);
  return {
    grams,
    apiCurrency: quote.apiCurrency,
    exchangeRate: quote.exchangeRate,
    exchangeRateTimestamp: toPgTimestamptz(quote.exchangeRateTimestamp),
    goldPrice: quote.goldPrice,
    goldPriceUnit: quote.goldPriceUnit,
    normalizedPricePerGram: quote.pricePerGramInDepositCurrency,
    providerName: quote.providerName,
    fallbackUsed: quote.fallbackUsed,
    priceSourceTimestamp: toPgTimestamptz(quote.priceSourceTimestamp),
    manuallyEnteredPrice: quote.manuallyEntered,
  };
}

export async function createEntry(input: {
  userId: string;
  amount: number;
  currency: string;
  depositDate: string;
  note?: string | null;
  idempotencyKey: string;
  manualPrice?: { goldPrice: number; goldPriceUnit: PriceQuote["goldPriceUnit"]; confirmed: boolean };
}): Promise<SavingsEntry> {
  const amount = parsePositiveNumber(input.amount, "Amount set aside");
  const currency = parseCurrency(input.currency);
  const depositDate = parseIsoDate(input.depositDate);
  const note = parseNote(input.note ?? null);
  if (!input.idempotencyKey || input.idempotencyKey.length < 8) {
    throw new Error(ERRORS.missingIdempotency);
  }

  const sql = await getSql();
  const existing = await sql<EntryRow>`select * from savings_entries
    where user_id = ${input.userId} and client_idempotency_key = ${input.idempotencyKey} limit 1`;
  if (existing[0]) return mapEntry(existing[0]);

  const goal = await getActiveGoal(input.userId);
  if (!goal) throw new Error(ERRORS.setTargetFirst);
  const profile = await ensureProfile(input.userId);

  let quote: PriceQuote;
  if (input.manualPrice) {
    if (!input.manualPrice.confirmed) {
      throw new Error(ERRORS.confirmManualPrice);
    }
    const manual = await quoteFromManual({
      date: depositDate,
      currency,
      goldPrice: input.manualPrice.goldPrice,
      goldPriceUnit: parsePriceUnit(input.manualPrice.goldPriceUnit),
      gramsPerTola: goal.gramsPerTola,
    });
    if (!manual.ok) throw new Error(manual.message);
    quote = manual.quote;
  } else {
    const live = await quoteGoldPrice({
      date: depositDate,
      currency,
      preferredProvider: profile.selectedProvider,
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
  const rows = await sql<EntryRow>`select * from savings_entries where id = ${id} and user_id = ${input.userId}`;
  if (!rows[0]) throw new Error(ERRORS.entryNotSaved);
  return mapEntry(rows[0]);
}

export async function listEntries(userId: string, sort: "newest" | "oldest" | "largest_deposit" | "largest_grams" = "newest"): Promise<SavingsEntry[]> {
  const sql = await getSql();
  const order =
    sort === "oldest"
      ? "deposit_date asc, created_at asc"
      : sort === "largest_deposit"
        ? "deposited_amount desc, deposit_date desc"
        : sort === "largest_grams"
          ? "completed_grams desc, deposit_date desc"
          : "deposit_date desc, created_at desc";
  const rows = await sql.query<EntryRow>(
    `select * from savings_entries where user_id = $1 and deleted_at is null and status <> 'deleted' order by ${order}`,
    [userId],
  );
  return rows.map(mapEntry);
}

export async function getEntry(userId: string, id: string): Promise<SavingsEntry | null> {
  const sql = await getSql();
  const rows = await sql<EntryRow>`select * from savings_entries where id = ${id} and user_id = ${userId} and deleted_at is null`;
  return rows[0] ? mapEntry(rows[0]) : null;
}

export async function updateEntry(input: {
  userId: string;
  id: string;
  amount?: number;
  depositDate?: string;
  note?: string | null;
  currency?: string;
  requote?: boolean;
  manualPrice?: { goldPrice: number; goldPriceUnit: PriceQuote["goldPriceUnit"]; confirmed: boolean };
}): Promise<SavingsEntry> {
  const current = await getEntry(input.userId, input.id);
  if (!current) throw new Error(ERRORS.entryNotFound);
  const amount = input.amount != null ? parsePositiveNumber(input.amount, "Amount set aside") : current.depositedAmount;
  const depositDate = input.depositDate ? parseIsoDate(input.depositDate) : current.depositDate;
  const currency = input.currency ? parseCurrency(input.currency) : current.depositedCurrency;
  const note = input.note !== undefined ? parseNote(input.note) : current.note;
  const dateOrAmountChanged =
    amount !== current.depositedAmount || depositDate !== current.depositDate || currency !== current.depositedCurrency;

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

  let quote: PriceQuote;
  if (input.manualPrice) {
    if (!input.manualPrice.confirmed) throw new Error(ERRORS.confirmManualPrice);
    const manual = await quoteFromManual({
      date: depositDate,
      currency,
      goldPrice: input.manualPrice.goldPrice,
      goldPriceUnit: parsePriceUnit(input.manualPrice.goldPriceUnit),
      gramsPerTola: goal?.gramsPerTola,
    });
    if (!manual.ok) throw new Error(manual.message);
    quote = manual.quote;
  } else {
    const live = await quoteGoldPrice({
      date: depositDate,
      currency,
      preferredProvider: profile.selectedProvider,
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

export async function deleteEntry(input: { userId: string; id: string; confirmPhrase: string }): Promise<void> {
  if (input.confirmPhrase !== "CONFIRM") {
    throw new Error(ERRORS.typeConfirmDelete);
  }
  const current = await getEntry(input.userId, input.id);
  if (!current) throw new Error(ERRORS.entryNotFound);
  const sql = await getSql();
  const now = nowIso();
  await sql`update savings_entries set status = 'deleted', deleted_at = ${now}, updated_at = ${now}
    where id = ${current.id} and user_id = ${input.userId}`;
}

export async function exportUserData(userId: string) {
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
      permittedUkhiya: settings.permittedUkhiya,
    },
    entries,
  };
}

export async function deleteAccount(userId: string, confirmPhrase: string): Promise<void> {
  if (confirmPhrase !== "DELETE ACCOUNT") {
    throw new Error(ERRORS.typeDeleteAccount);
  }
  const sql = await getSql();
  await sql`delete from savings_entries where user_id = ${userId}`;
  await sql`delete from goals where user_id = ${userId}`;
  await sql`delete from profiles where user_id = ${userId}`;
}

export { loadSettings, mapSettings };
export const permittedUkhiya = PERMITTED_UKHIYA;
