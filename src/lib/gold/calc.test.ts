import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  averageEffectivePricePerGram,
  completionPercent,
  currentEstimatedValue,
  dashboardFromParts,
  estimatedValueDifference,
  goldEquivalentGrams,
  remainingGrams,
} from "./calc";
import { DEFAULT_UNITS, normalizePricePerGram, targetGramsFor, unitAssumptionsText } from "./units";
import type { Goal, Profile, SavingsEntry } from "./types";
import { PERMITTED_UKHIYA } from "./constants";
import type { AppSettings } from "./types";

describe("unit conversion", () => {
  it("computes published default targets from configurable units", () => {
    assert.equal(targetGramsFor(9), 1154.7162);
    assert.equal(targetGramsFor(10), 1283.018);
    assert.equal(targetGramsFor(11), 1411.3198);
  });

  it("uses configured grams-per-tola instead of a hardcoded 1410.3", () => {
    const eleven = targetGramsFor(11);
    assert.notEqual(eleven, 1410.3);
    assert.ok(Math.abs(eleven - 11 * 11 * 11.6638) < 1e-6);
  });

  it("respects custom unit assumptions", () => {
    const grams = targetGramsFor(10, { gramsPerTola: 10, tolasPerUkhiya: 10 });
    assert.equal(grams, 1000);
  });

  it("rejects non-positive units", () => {
    assert.throws(() => targetGramsFor(9, { gramsPerTola: 0, tolasPerUkhiya: 11 }));
    assert.throws(() => targetGramsFor(0));
  });

  it("describes assumptions in plain language", () => {
    assert.match(unitAssumptionsText(DEFAULT_UNITS), /11 tolas/);
    assert.match(unitAssumptionsText(DEFAULT_UNITS), /11.6638 grams/);
  });
});

describe("price normalization", () => {
  it("converts per-tola prices to per-gram", () => {
    const perGram = normalizePricePerGram(11663.8, "per_tola");
    assert.equal(perGram, 1000);
  });

  it("converts per-troy-ounce prices to per-gram", () => {
    const perGram = normalizePricePerGram(3110.34768, "per_troy_ounce");
    assert.ok(Math.abs(perGram - 100) < 1e-6);
  });

  it("keeps per-gram prices unchanged", () => {
    assert.equal(normalizePricePerGram(8500, "per_gram"), 8500);
  });
});

describe("gold equivalent grams", () => {
  it("credits 1.0000 g for ₹10,000 at ₹10,000/g", () => {
    assert.equal(goldEquivalentGrams(10_000, 10_000), 1);
  });

  it("divides deposit by price per gram", () => {
    assert.equal(goldEquivalentGrams(25_000, 10_000), 2.5);
  });

  it("rejects non-positive inputs", () => {
    assert.throws(() => goldEquivalentGrams(0, 1000));
    assert.throws(() => goldEquivalentGrams(1000, 0));
    assert.throws(() => goldEquivalentGrams(-5, 1000));
  });
});

describe("progress math", () => {
  it("computes remaining grams and percent", () => {
    const target = targetGramsFor(10);
    assert.equal(remainingGrams(283.018, target), 1000);
    assert.equal(completionPercent(641.509, target), 50);
  });

  it("clamps percent at 100", () => {
    assert.equal(completionPercent(5000, 1000), 100);
  });
});

describe("current estimated value", () => {
  it("multiplies completed grams by current price", () => {
    assert.equal(currentEstimatedValue(2, 12_000), 24_000);
  });

  it("does not label the difference as profit", () => {
    const diff = estimatedValueDifference(10_000, 12_000);
    assert.equal(diff, 2000);
  });

  it("computes average effective purchase price", () => {
    assert.equal(averageEffectivePricePerGram(20_000, 2), 10_000);
    assert.equal(averageEffectivePricePerGram(20_000, 0), null);
  });
});

describe("dashboard aggregation", () => {
  const goal: Goal = {
    id: "g1",
    userId: "u1",
    ukhiyaCount: 10,
    goalType: "gold",
    targetAmount: 1283.018,
    targetCurrency: "INR",
    tolasPerUkhiya: 11,
    gramsPerTola: 11.6638,
    targetGrams: 1283.018,
    purityLabel: "24K",
    purityFineness: 999.9,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const profile: Profile = {
    userId: "u1",
    preferredCurrency: "INR",
    selectedProvider: null,
    onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const settings: AppSettings = {
    gramsPerTola: 11.6638,
    tolasPerUkhiya: 11,
    troyOunceGrams: 31.1034768,
    permittedUkhiya: [...PERMITTED_UKHIYA],
    purityLabel: "24K",
    purityFineness: 999.9,
    defaultCurrency: "INR",
    supportedCurrencies: ["INR", "USD"],
    manualPriceFallbackEnabled: true,
    providerPriority: ["gold-api-com"],
    currentPriceCacheSeconds: 900,
  };

  function entry(partial: Partial<SavingsEntry> & Pick<SavingsEntry, "id" | "completedGrams" | "depositedAmount">): SavingsEntry {
    return {
      userId: "u1",
      goalId: "g1",
      clientIdempotencyKey: partial.id,
      depositDate: "2026-01-02",
      depositedCurrency: "INR",
      apiCurrency: "INR",
      exchangeRate: 1,
      exchangeRateTimestamp: null,
      goldPrice: 10000,
      goldPriceUnit: "per_gram",
      normalizedPricePerGram: 10000,
      providerName: "manual",
      fallbackUsed: true,
      priceSourceTimestamp: null,
      manuallyEnteredPrice: true,
      note: null,
      status: "posted",
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      deletedAt: null,
      ...partial,
    };
  }

  it("ignores deleted and pending rows", () => {
    const dash = dashboardFromParts({
      goal,
      profile,
      settings,
      entries: [
        entry({ id: "a", completedGrams: 1, depositedAmount: 10000 }),
        entry({ id: "b", completedGrams: 5, depositedAmount: 50000, status: "deleted", deletedAt: "2026-01-03T00:00:00.000Z" }),
        entry({ id: "c", completedGrams: 2, depositedAmount: 20000, status: "pending_price" }),
      ],
      currentPricePerGram: 12000,
      currentPriceCurrency: "INR",
      currentPriceProvider: "gold-api-com",
      currentPriceAsOf: "2026-09-04T00:00:00.000Z",
      currentPriceCheckedAt: "2026-09-04T00:15:00.000Z",
    });
    assert.equal(dash.completedGrams, 1);
    assert.equal(dash.entryCount, 1);
    assert.equal(dash.currentEstimatedValue, 12000);
    assert.equal(dash.estimatedValueDifference, 2000);
    assert.equal(dash.averageEffectivePricePerGram, 10000);
    assert.deepEqual(
      dash.milestones.map((m) => m.reached),
      [false, false, false, false, false],
    );
  });
});
