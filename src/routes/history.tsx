import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { buildRunningTotals } from "@/lib/gold/calc";
import { listEntriesFn } from "@/lib/gold/fns";
import { formatDate, formatGrams, formatMoney, formatPercent } from "@/lib/gold/format";
import { listPendingEntries } from "@/lib/gold/offline";

export const Route = createFileRoute("/history")({ component: HistoryPage });

type Sort = "newest" | "oldest" | "largest_deposit" | "largest_grams";

function HistoryPage() {
  const { user, isPending } = useCurrentUserState();
  const [sort, setSort] = useState<Sort>("newest");
  const query = useQuery({
    queryKey: ["entries", sort],
    queryFn: () => listEntriesFn({ data: { sort } }),
    enabled: !!user,
  });

  const pending = user && typeof window !== "undefined" ? listPendingEntries(user.id) : [];

  const withRunning = useMemo(() => {
    const entries = query.data?.entries ?? [];
    const chronological = [...entries].sort((a, b) => {
      const d = a.depositDate.localeCompare(b.depositDate);
      return d !== 0 ? d : a.createdAt.localeCompare(b.createdAt);
    });
    const target = query.data?.goal?.targetGrams ?? 0;
    const running = buildRunningTotals(chronological, target);
    const byId = new Map(chronological.map((e, i) => [e.id, running[i]]));
    return entries.map((e) => ({
      ...e,
      runningGrams: byId.get(e.id)?.runningGrams ?? 0,
      runningCompletionPercent: byId.get(e.id)?.runningCompletionPercent ?? 0,
      currentValue:
        query.data?.currentPrice != null && e.depositedCurrency === query.data.preferredCurrency
          ? e.completedGrams * query.data.currentPrice
          : null,
    }));
  }, [query.data]);

  if (isPending) {
    return (
      <AppShell>
        <Skeleton className="h-40 w-full" />
      </AppShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-fg">Mahar history</h1>
      <p className="mt-1 text-sm text-muted">
        Every row is money you recorded toward mahar, not a gold purchase and not mahar already paid.
      </p>

      <label className="mt-4 block text-xs text-subtle">
        Sort
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="mt-1 h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="largest_deposit">Largest amount set aside</option>
          <option value="largest_grams">Largest gold-equivalent</option>
        </select>
      </label>

      {pending.length > 0 && (
        <Card className="mt-4">
          <p className="text-sm text-warn">{pending.length} mahar {pending.length === 1 ? "entry" : "entries"} waiting to sync.</p>
        </Card>
      )}

      {query.isLoading && (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {query.data && withRunning.length === 0 && (
        <Card className="mt-6">
          <p className="text-sm text-muted">
            No mahar entries yet. Record money you set aside and we will convert it to 24K gold-equivalent grams toward your ukhiya target.
          </p>
          <Link to="/entries/new" className="mt-3 inline-block text-sm text-fg underline underline-offset-4">
            Record mahar savings
          </Link>
        </Card>
      )}

      <ul className="mt-4 space-y-3">
        {withRunning.map((row) => (
          <li key={row.id}>
            <Link to="/entries/$id" params={{ id: row.id }} className="block">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">{formatDate(row.depositDate)}</p>
                    <p className="mt-1 font-medium text-fg tabular-nums">
                      {formatMoney(row.depositedAmount, row.depositedCurrency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-fg tabular-nums">{formatGrams(row.completedGrams)}</p>
                    <p className="mt-1 text-xs text-subtle">
                      Running {formatGrams(row.runningGrams)} · {formatPercent(row.runningCompletionPercent)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={row.manuallyEnteredPrice ? "warn" : "muted"}>
                    {row.manuallyEnteredPrice ? "Manual price" : row.providerName}
                  </Badge>
                  {row.fallbackUsed && !row.manuallyEnteredPrice && <Badge>Fallback provider</Badge>}
                  <Badge tone="metal">
                    {formatMoney(row.normalizedPricePerGram, row.depositedCurrency)} / g
                  </Badge>
                </div>
                {row.currentValue != null && (
                  <p className="mt-2 text-xs text-subtle">
                    Current estimated value of this entry{" "}
                    {formatMoney(row.currentValue, query.data?.preferredCurrency ?? row.depositedCurrency)}
                  </p>
                )}
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
