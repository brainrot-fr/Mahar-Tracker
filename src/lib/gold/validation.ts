import {
  GOLD_PRICE_UNITS,
  PERMITTED_UKHIYA,
  SUPPORTED_CURRENCIES,
  type GoldPriceUnit,
  type PermittedUkhiya,
} from "./constants";
import { ERRORS } from "./copy";

export function parsePositiveNumber(value: unknown, label: string): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return n;
}

export function parseIsoDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("The date money was set aside must be a valid calendar date (YYYY-MM-DD).");
  }
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error("That date is not a real calendar date.");
  }
  const today = todayIsoDate();
  if (value > today) {
    throw new Error("Mahar entries cannot be dated in the future.");
  }
  if (y < 1990) {
    throw new Error("That date is too far in the past for version 1.");
  }
  return value;
}

export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSupportedCurrency(code: string): boolean {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function parseCurrency(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Z]{3}$/.test(value)) {
    throw new Error("Currency must be a three-letter code.");
  }
  if (!isSupportedCurrency(value)) {
    throw new Error(`Currency ${value} is not supported.`);
  }
  return value;
}

export function parseUkhiya(value: unknown): PermittedUkhiya {
  const n = typeof value === "number" ? value : Number(value);
  if (!(PERMITTED_UKHIYA as readonly number[]).includes(n)) {
    throw new Error(ERRORS.permittedTarget);
  }
  return n as PermittedUkhiya;
}

export function parsePriceUnit(value: unknown): GoldPriceUnit {
  if (typeof value !== "string" || !(GOLD_PRICE_UNITS as readonly string[]).includes(value)) {
    throw new Error("Gold-price unit must be per gram, per tola, or per troy ounce.");
  }
  return value as GoldPriceUnit;
}

export function parseNote(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error("Note must be text.");
  const trimmed = value.trim();
  if (trimmed.length > 500) throw new Error("Note must be 500 characters or fewer.");
  return trimmed || null;
}
