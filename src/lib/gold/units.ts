import {
  DEFAULT_GRAMS_PER_TOLA,
  DEFAULT_TOLAS_PER_UKHIYA,
  PERMITTED_UKHIYA,
  STORE_GRAM_DECIMALS,
  STORE_MONEY_DECIMALS,
  TROY_OUNCE_GRAMS,
  type PermittedUkhiya,
} from "./constants.ts";
import type { GoldPriceUnit } from "./constants.ts";
import type { UnitConfig } from "./types.ts";

export const DEFAULT_UNITS: UnitConfig = {
  gramsPerTola: DEFAULT_GRAMS_PER_TOLA,
  tolasPerUkhiya: DEFAULT_TOLAS_PER_UKHIYA,
  troyOunceGrams: TROY_OUNCE_GRAMS,
};

export function isPermittedUkhiya(n: number): n is PermittedUkhiya {
  return (PERMITTED_UKHIYA as readonly number[]).includes(n);
}

export function roundTo(value: number, places: number): number {
  if (!Number.isFinite(value)) return value;
  const f = 10 ** places;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function storeGrams(value: number): number {
  return roundTo(value, STORE_GRAM_DECIMALS);
}

export function targetGramsFor(
  ukhiyaCount: number,
  units: Pick<UnitConfig, "gramsPerTola" | "tolasPerUkhiya"> = DEFAULT_UNITS,
): number {
  if (ukhiyaCount <= 0) throw new Error("Mahar ukhiya count must be greater than zero.");
  if (units.gramsPerTola <= 0) throw new Error("Grams per tola must be greater than zero.");
  if (units.tolasPerUkhiya <= 0) throw new Error("Tolas per ukhiya must be greater than zero.");
  return storeGrams(ukhiyaCount * units.tolasPerUkhiya * units.gramsPerTola);
}

export function gramsToUkhiya(
  grams: number,
  units: Pick<UnitConfig, "gramsPerTola" | "tolasPerUkhiya"> = DEFAULT_UNITS,
): number {
  const perUkhiya = units.tolasPerUkhiya * units.gramsPerTola;
  if (perUkhiya <= 0) throw new Error("Invalid unit configuration.");
  return grams / perUkhiya;
}

export function normalizePricePerGram(
  rawPrice: number,
  unit: GoldPriceUnit,
  units: UnitConfig = DEFAULT_UNITS,
): number {
  if (!(rawPrice > 0)) throw new Error("Gold price must be greater than zero.");
  switch (unit) {
    case "per_gram":
      return rawPrice;
    case "per_tola":
      if (units.gramsPerTola <= 0) throw new Error("Grams per tola must be greater than zero.");
      return roundTo(rawPrice / units.gramsPerTola, STORE_MONEY_DECIMALS);
    case "per_troy_ounce":
      if (units.troyOunceGrams <= 0) throw new Error("Troy ounce grams must be greater than zero.");
      return roundTo(rawPrice / units.troyOunceGrams, STORE_MONEY_DECIMALS);
    default: {
      const _exhaustive: never = unit;
      throw new Error(`Unsupported gold-price unit: ${_exhaustive}`);
    }
  }
}

export function unitAssumptionsText(units: Pick<UnitConfig, "gramsPerTola" | "tolasPerUkhiya">): string {
  const perUkhiya = storeGrams(units.tolasPerUkhiya * units.gramsPerTola);
  return `1 ukhiya = ${units.tolasPerUkhiya} tolas · 1 tola = ${units.gramsPerTola} grams · 1 ukhiya ≈ ${perUkhiya} grams`;
}
