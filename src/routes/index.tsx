import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ProgressRing } from "@/components/progress-ring";
import { AppShell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_NAME } from "@/lib/gold/constants";
import {
  MAHAR_ORIGIN,
  PURITY_TRADITION_LABEL,
  TRACKER_DISCLAIMER,
  UKHIYA_MAHAR,
  ZAR_E_SURKH_ORIGIN,
  maharTargetLabel,
} from "@/lib/gold/copy";
import { getDashboardFn } from "@/lib/gold/fns";
import { formatDate, formatDateTime, formatGrams, formatMoney, formatPercent } from "@/lib/gold/format";
import { unitAssumptionsText } from "@/lib/gold/units";
import type { Dashboard } from "@/lib/gold/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="mx-auto min-h-dvh max-w-6xl bg-bg px-4 py-10 md:px-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-6 h-72 w-full rounded-xl" />
      </main>
    );
  }
  if (!user) return <Landing />;
  return <SignedInHome />;
}

function Landing() {
  return (
    <main className="mx-auto min-h-dvh max-w-6xl bg-bg px-5 pb-16 pt-12 md:px-8">
      <p className="font-display text-sm tracking-[0.18em] text-metal uppercase">{APP_NAME}</p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-fg">
        Track mahar toward 9, 10, or 11 ukhiya of zar-e-surkh-e-khalis.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">{MAHAR_ORIGIN}</p>
      <p className="mt-3 text-base leading-relaxed text-muted">{ZAR_E_SURKH_ORIGIN}</p>

      <div className="mt-6 grid gap-2">
        {([9, 10, 11] as const).map((n) => (
          <div key={n} className="flex items-baseline justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <p className="font-display text-lg text-fg">{n} ukhiya</p>
            <p className="text-sm text-muted">{UKHIYA_MAHAR[n].whoShort}</p>
          </div>
        ))}
      </div>

      <Card className="mt-8 space-y-3">
        <p className="text-sm font-medium text-fg">This is a mahar tracker, not a gold shop.</p>
        <p className="text-sm leading-relaxed text-muted">{TRACKER_DISCLAIMER}</p>
      </Card>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button asChild className="w-full max-w-sm">
          <Link to="/login">Sign in or create an account</Link>
        </Button>
        <p className="text-center text-xs text-subtle">Google sign-in and email/password are available.</p>
      </div>
      <p className="mt-8 text-xs leading-relaxed text-subtle">
        Default units: 1 ukhiya = 11 tolas, 1 tola = 11.6638 grams. Those values are confirmed during
        setup and can be configured. Purity is {PURITY_TRADITION_LABEL}.
      </p>
    </main>
  );
}

function SignedInHome() {
  const dash = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardFn(),
    refetchInterval: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  if (dash.isLoading) {
    return (
      <AppShell>
        <Skeleton className="mx-auto size-64 rounded-full" />
        <Skeleton className="mt-6 h-32 w-full rounded-xl" />
      </AppShell>
    );
  }
  if (dash.error) {
    return (
      <AppShell>
        <p className="text-sm text-danger">{dash.error instanceof Error ? dash.error.message : "Could not load"}</p>
      </AppShell>
    );
  }
  const data = dash.data;
  if (!data) return null;
  if ("needsOnboarding" in data || !data.goal) {
    return <Navigate to="/onboarding" />;
  }
  return <DashboardView data={data} />;
}

function DashboardView({ data }: { data: Dashboard }) {
  const isCustomCash = data.goal.goalType === "cash";
  const assumptions = unitAssumptionsText({
    gramsPerTola: data.goal.gramsPerTola,
    tolasPerUkhiya: data.goal.tolasPerUkhiya,
  });
  const preferredTotal = data.totalDepositedPreferred;
  const who = UKHIYA_MAHAR[data.targetUkhiya as 9 | 10 | 11];
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-subtle">Mahar target</p>
          <h1 className="font-display text-2xl text-fg">{isCustomCash ? "Custom cash mahar" : maharTargetLabel(data.targetUkhiya)}</h1>
        </div>
        <Badge tone="metal">{isCustomCash ? data.goal.targetCurrency : PURITY_TRADITION_LABEL}</Badge>
      </div>
      {!isCustomCash && who && <p className="mt-1 text-sm text-muted">{who.who}</p>}
      <p className="mt-1 text-sm text-muted">
        {isCustomCash ? formatMoney(data.goal.targetAmount, data.goal.targetCurrency) : `${formatGrams(data.targetGrams)} · ${assumptions}`}
      </p>

      <div className="mt-6">
        <ProgressRing
          percent={data.completionPercent}
          label="Completed toward mahar"
          sublabel={isCustomCash ? `${formatMoney(data.completedGrams, data.goal.targetCurrency)} of ${formatMoney(data.goal.targetAmount, data.goal.targetCurrency)}` : `${formatGrams(data.completedGrams)} of ${formatGrams(data.targetGrams)}`}
        />
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {data.milestones.map((m) => (
          <span
            key={m.percent}
            className={`text-[10px] tabular-nums ${m.reached ? "text-metal" : "text-subtle"}`}
          >
            {m.percent}%
          </span>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Stat label={isCustomCash ? "Cash completed" : "Gold-equivalent completed"} value={isCustomCash ? formatMoney(data.completedGrams, data.goal.targetCurrency) : formatGrams(data.completedGrams)} />
        <Stat label="Remaining toward mahar" value={isCustomCash ? formatMoney(data.remainingGrams, data.goal.targetCurrency) : formatGrams(data.remainingGrams)} />
        {!isCustomCash && <Stat
          label={`Money set aside in ${data.preferredCurrency}`}
          value={
            preferredTotal != null
              ? formatMoney(preferredTotal, data.preferredCurrency)
              : data.totalDepositedByCurrency.map((b) => formatMoney(b.amount, b.currency)).join(" · ") || "—"
          }
        />}
        <Stat
          label="Current estimated value"
          value={
            data.currentEstimatedValue != null && data.currentPriceCurrency
              ? formatMoney(data.currentEstimatedValue, data.currentPriceCurrency)
              : "Price unavailable"
          }
        />
      </div>

      {!isCustomCash && <Card className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-wider text-subtle">Market comparison</p>
        <p className="text-sm text-muted">
          Estimated market-value difference is not profit or loss. It does not mean physical gold
          has been purchased or that mahar has been paid.
        </p>
        <p className="text-lg tabular-nums text-fg">
          {data.estimatedValueDifference != null && data.currentPriceCurrency
            ? formatMoney(data.estimatedValueDifference, data.currentPriceCurrency)
            : "—"}
        </p>
        <p className="text-xs text-subtle">
          Current 24K price{" "}
          {data.currentPricePerGram != null && data.currentPriceCurrency
            ? `${formatMoney(data.currentPricePerGram, data.currentPriceCurrency)} / g`
            : "unavailable"}
          {data.currentPriceProvider ? ` · ${data.currentPriceProvider}` : ""}
        </p>
        <p className="text-xs text-subtle">
          Checked by Mahar Tracker: {formatDateTime(data.currentPriceCheckedAt)}
          {data.currentPriceAsOf ? ` · Provider data: ${formatDateTime(data.currentPriceAsOf)}` : ""}
        </p>
        <p className="text-xs text-subtle">
          Average effective price paid{" "}
          {data.averageEffectivePricePerGram != null
            ? `${formatMoney(data.averageEffectivePricePerGram, data.preferredCurrency)} / g`
            : "—"}
        </p>
      </Card>}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Mahar entries" value={String(data.entryCount)} />
        <Stat
          label="Most recent entry"
          value={
            data.mostRecentDeposit
              ? `${formatDate(data.mostRecentDeposit.depositDate)} · ${isCustomCash ? formatMoney(data.mostRecentDeposit.amount, data.goal.targetCurrency) : formatGrams(data.mostRecentDeposit.grams)}`
              : "None yet"
          }
        />
      </div>

      <Button asChild className="mt-8 w-full">
        <Link to="/entries/new">Record mahar savings</Link>
      </Button>
      <p className="mt-4 text-center text-xs text-subtle">
        Progress {formatPercent(data.completionPercent)} complete toward {isCustomCash ? "custom cash mahar" : `${data.targetUkhiya} ukhiya mahar`}.
      </p>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="space-y-1">
      <p className="text-xs text-subtle">{label}</p>
      <p className="text-sm font-medium leading-snug text-fg tabular-nums">{value}</p>
    </Card>
  );
}
