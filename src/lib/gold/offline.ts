export type PendingEntry = {
  idempotencyKey: string;
  amount: number;
  currency: string;
  depositDate: string;
  note: string | null;
  createdAt: string;
  status: "pending_sync" | "pending_price";
};

function keyForUser(userId: string): string {
  return `ukhiya.pending-entries.${userId}`;
}

function read(userId: string): PendingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyForUser(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(userId: string, rows: PendingEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyForUser(userId), JSON.stringify(rows));
}

export function listPendingEntries(userId: string): PendingEntry[] {
  return read(userId);
}

export function queuePendingEntry(userId: string, entry: PendingEntry) {
  const rows = read(userId).filter((r) => r.idempotencyKey !== entry.idempotencyKey);
  rows.push(entry);
  write(userId, rows);
}

export function removePendingEntry(userId: string, idempotencyKey: string) {
  write(userId, read(userId).filter((r) => r.idempotencyKey !== idempotencyKey));
}
