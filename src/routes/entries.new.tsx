import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { goldEquivalentGrams } from "@/lib/gold/calc";
import { SUPPORTED_CURRENCIES, type GoldPriceUnit } from "@/lib/gold/constants";
import { PURITY_TRADITION_LABEL } from "@/lib/gold/copy";
import { createEntryFn, getBootstrap, quoteManualFn, quotePriceFn } from "@/lib/gold/fns";
import { formatGrams, formatMoney, priceUnitLabel } from "@/lib/gold/format";
import { queuePendingEntry } from "@/lib/gold/offline";
import type { PriceQuote } from "@/lib/gold/types";
import { todayIsoDate } from "@/lib/gold/validation";

export const Route = createFileRoute("/entries/new")({ component: NewEntryPage });

function NewEntryPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const bootstrap = useQuery({ queryKey: ["bootstrap"], queryFn: () => getBootstrap(), enabled: !!user });
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [currency, setCurrency] = useState("");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [manualUnit, setManualUnit] = useState<GoldPriceUnit>("per_gram");
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [busyQuote, setBusyQuote] = useState(false);

  const preferred = bootstrap.data?.profile.preferredCurrency ?? "INR";
  const usedCurrency = currency || preferred;
  const isCustomCash = bootstrap.data?.goal?.goalType === "cash";

  const previewGrams = useMemo(() => {
    const n = Number(amount);
    if (!quote || !(n > 0)) return null;
    try {
      return goldEquivalentGrams(n, quote.pricePerGramInDepositCurrency);
    } catch {
      return null;
    }
  }, [amount, quote]);

  const save = useMutation({
    mutationFn: () =>
      createEntryFn({
        data: {
          amount: Number(amount),
          currency: usedCurrency,
          depositDate: date,
          note: note || null,
          idempotencyKey,
          manualPrice:
            quote?.manuallyEntered && manualConfirmed
              ? { goldPrice: Number(manualPrice), goldPriceUnit: manualUnit, confirmed: true }
              : undefined,
        },
      }),
    onSuccess: (entry) => {
      void qc.invalidateQueries();
      toast.success("Mahar savings recorded");
      navigate({ to: "/entries/$id", params: { id: entry.id } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save this mahar entry"),
  });

  async function fetchQuote() {
    setBusyQuote(true);
    setQuoteError(null);
    setQuote(null);
    setManualConfirmed(false);
    try {
      const result = await quotePriceFn({ data: { date, currency: usedCurrency } });
      if (result.ok) {
        setQuote(result.quote);
        setManualOpen(false);
      } else {
        setQuoteError(result.message);
        setManualOpen(result.manualFallbackEnabled);
      }
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Could not look up the 24K price");
      setManualOpen(true);
    } finally {
      setBusyQuote(false);
    }
  }

  async function applyManual() {
    const result = await quoteManualFn({
      data: {
        date,
        currency: usedCurrency,
        goldPrice: Number(manualPrice),
        goldPriceUnit: manualUnit,
      },
    });
    if (!result.ok) {
      setQuoteError(result.message);
      return;
    }
    setQuote(result.quote);
    setQuoteError(null);
  }

  if (isPending) return <AppShell><div className="h-40 animate-pulse rounded-xl bg-elevated" /></AppShell>;
  if (!user) return <RedirectToSignIn />;

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-fg">Record mahar savings</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the money you set aside toward mahar and the date.{" "}
        {isCustomCash ? "Custom cash tracking records the amount directly in your selected currency." : "Ukhiya looks up the 24K consumer buying price when it can."}
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isCustomCash && typeof navigator !== "undefined" && !navigator.onLine) {
            queuePendingEntry(user.id, {
              idempotencyKey,
              amount: Number(amount),
              currency: usedCurrency,
              depositDate: date,
              note: note || null,
              createdAt: new Date().toISOString(),
              status: quote ? "pending_sync" : "pending_price",
            });
            toast.message("Saved on this device. It will calculate after a 24K price is available.");
            return;
          }
          save.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount set aside toward mahar</Label>
          <Input
            id="amount"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            value={usedCurrency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setQuote(null);
            }}
            className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date money was set aside</Label>
          <Input
            id="date"
            type="date"
            required
            max={todayIsoDate()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setQuote(null);
            }}
          />
          <p className="text-xs text-subtle">Past dates never silently reuse today’s price.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </div>

        {!isCustomCash && <Button type="button" variant="secondary" className="w-full" onClick={fetchQuote} disabled={busyQuote}>
          {busyQuote ? "Looking up 24K price…" : "Look up 24K price"}
        </Button>}

        {!isCustomCash && quoteError && (
          <Card>
            <p className="text-sm text-warn">{quoteError}</p>
          </Card>
        )}

        {!isCustomCash && quote && (
          <Card className="space-y-2 text-sm">
            <p className="font-medium text-fg">Price used for this mahar entry</p>
            <p className="text-muted">
              Raw 24K consumer price: {formatMoney(quote.goldPrice, quote.apiCurrency)}{" "}
              {priceUnitLabel(quote.goldPriceUnit)}
            </p>
            <p className="text-muted">
              Normalized: {formatMoney(quote.pricePerGramInDepositCurrency, usedCurrency)} per gram
            </p>
            <p className="text-muted">
              Provider: {quote.providerName}
              {quote.fallbackUsed ? " (fallback)" : ""}
              {quote.fromCache ? " · cached snapshot" : ""}
              {quote.manuallyEntered ? " · manually entered" : ""}
            </p>
            {quote.exchangeRate !== 1 && (
              <p className="text-muted">
                Exchange rate locked: 1 {quote.apiCurrency} = {quote.exchangeRate} {usedCurrency}
              </p>
            )}
            {previewGrams != null && (
              <p className="text-fg">
                Gold-equivalent toward mahar: {formatGrams(previewGrams)}
              </p>
            )}
          </Card>
        )}

        {!isCustomCash && (manualOpen || quote?.manuallyEntered) && (
          <Card className="space-y-3">
            <p className="text-sm text-fg">Enter the 24K consumer buying price yourself</p>
            <p className="text-xs text-muted">
              Use a bank or bullion buying rate for {PURITY_TRADITION_LABEL}, not jewelry prices or making charges.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="mprice">Price</Label>
              <Input
                id="mprice"
                inputMode="decimal"
                value={manualPrice}
                onChange={(e) => {
                  setManualPrice(e.target.value);
                  setManualConfirmed(false);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="munit">Unit</Label>
              <select
                id="munit"
                value={manualUnit}
                onChange={(e) => setManualUnit(e.target.value as GoldPriceUnit)}
                className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
              >
                <option value="per_gram">Per gram</option>
                <option value="per_tola">Per tola</option>
                <option value="per_troy_ounce">Per troy ounce</option>
              </select>
            </div>
            <Button type="button" variant="secondary" onClick={applyManual}>
              Use this price
            </Button>
            <label className="flex items-start gap-2 text-sm text-fg">
              <input
                type="checkbox"
                className="mt-1"
                checked={manualConfirmed}
                onChange={(e) => setManualConfirmed(e.target.checked)}
              />
              I confirm this is the 24K consumer buying price I observed for {date}.
            </label>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={save.isPending || !amount || (!isCustomCash && (!quote || (quote.manuallyEntered && !manualConfirmed)))}
        >
          {save.isPending ? "Saving…" : "Save mahar entry"}
        </Button>
      </form>
    </AppShell>
  );
}
