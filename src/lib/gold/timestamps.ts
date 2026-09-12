/**
 * Postgres timestamptz only accepts ISO-8601 (and a few SQL formats).
 * Driver round-trips often yield Date objects; String(date) is
 * "Thu Sep 10 2026 01:45:24 GMT+0000 (Coordinated Universal Time)",
 * which Postgres rejects. Always coerce before writing.
 */
export function toPgTimestamptz(value: unknown): string | null {
  if (value == null || value === "") return null;
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    date = new Date(value > 0 && value < 1e12 ? value * 1000 : value);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const n = Number(trimmed);
      date = new Date(n > 0 && n < 1e12 ? n * 1000 : n);
    } else {
      date = new Date(trimmed);
    }
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function requirePgTimestamptz(value: unknown, fallback = new Date()): string {
  return toPgTimestamptz(value) ?? fallback.toISOString();
}
