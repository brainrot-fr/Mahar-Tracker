import { DISPLAY_GRAM_DECIMALS } from "./constants";

export function formatGrams(grams: number, places = DISPLAY_GRAM_DECIMALS): string {
  if (!Number.isFinite(grams)) return "—";
  return `${grams.toLocaleString("en-IN", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })} g`;
}

export function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const places = value > 0 && value < 0.1 ? 2 : value < 10 ? 2 : 1;
  return `${value.toLocaleString("en-IN", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })}%`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return iso;
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function priceUnitLabel(unit: string): string {
  switch (unit) {
    case "per_gram":
      return "per gram";
    case "per_tola":
      return "per tola";
    case "per_troy_ounce":
      return "per troy ounce";
    default:
      return unit;
  }
}
