import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PERMITTED_UKHIYA, SUPPORTED_CURRENCIES } from "@/lib/gold/constants";
import {
  MAHAR_ORIGIN,
  ONBOARDING_ACCEPT_LABEL,
  ONBOARDING_MAHDI_ACKNOWLEDGEMENT,
  PURITY_TRADITION_LABEL,
  TRACKER_DISCLAIMER,
  UKHIYA_MAHAR,
  ZAR_E_SURKH_ORIGIN,
} from "@/lib/gold/copy";
import { completeOnboardingFn, getBootstrap } from "@/lib/gold/fns";
import { formatGrams } from "@/lib/gold/format";
import { targetGramsFor, unitAssumptionsText } from "@/lib/gold/units";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

function OnboardingPage() {
  const { user, isPending } = useCurrentUserState();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const bootstrap = useQuery({ queryKey: ["bootstrap"], queryFn: () => getBootstrap(), enabled: !!user });
  const [step, setStep] = useState(0);
  const [ukhiya, setUkhiya] = useState<(typeof PERMITTED_UKHIYA)[number]>(9);
  const [currency, setCurrency] = useState("INR");
  const [gramsPerTola, setGramsPerTola] = useState(11.6638);
  const [tolasPerUkhiya, setTolasPerUkhiya] = useState(11);
  const [accepted, setAccepted] = useState(false);
  const [acknowledgedPromisedMahdi, setAcknowledgedPromisedMahdi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacyMessage, setShowPrivacyMessage] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      completeOnboardingFn({
        data: {
          ukhiyaCount: ukhiya,
          currency,
          gramsPerTola,
          tolasPerUkhiya,
          acceptedDisclaimer: accepted,
          acknowledgedPromisedMahdi,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bootstrap"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setShowPrivacyMessage(true);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Could not save"),
  });

  useEffect(() => {
    if (!showPrivacyMessage) return;
    const timeout = window.setTimeout(() => navigate({ to: "/" }), 2400);
    return () => window.clearTimeout(timeout);
  }, [navigate, showPrivacyMessage]);

  if (isPending) return <AppShell><div className="h-40 animate-pulse rounded-xl bg-elevated" /></AppShell>;
  if (!user) return <RedirectToSignIn />;
  if (showPrivacyMessage) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-6 text-center">
        <h2 className="onboarding-reveal max-w-xl font-display text-3xl text-fg">
          No data will be used or stored for analytics, advertising, or hidden tracking.
        </h2>
      </div>
    );
  }
  if (bootstrap.data?.goal && bootstrap.data.profile.onboardingCompletedAt) {
    return <Navigate to="/" />;
  }

  const target = targetGramsFor(ukhiya, { gramsPerTola, tolasPerUkhiya });
  const assumptions = unitAssumptionsText({ gramsPerTola, tolasPerUkhiya });
  const steps = ["Mahar", "Currency", "Units", "Confirm"];
  const selected = UKHIYA_MAHAR[ukhiya];

  return (
    <AppShell>
      <p className="text-xs uppercase tracking-wider text-subtle">Set up · {steps[step]}</p>
      <h1 className="mt-1 font-display text-3xl text-fg">Choose The mount of mahar you need to pay</h1>
      <p className="mt-2 text-sm text-muted">
        Version 1 uses one mahar target. You can change it later with an explicit confirmation.
      </p>

      {step === 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm leading-relaxed text-muted">{MAHAR_ORIGIN}</p>
          {PERMITTED_UKHIYA.map((n) => {
            const grams = targetGramsFor(n, { gramsPerTola, tolasPerUkhiya });
            const meta = UKHIYA_MAHAR[n];
            return (
              <button
                key={n}
                type="button"
                onClick={() => setUkhiya(n)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left",
                  ukhiya === n ? "border-accent bg-elevated" : "border-border bg-surface",
                )}
              >
                <p className="font-display text-xl text-fg">{n} ukhiya</p>
                <p className="mt-1 text-sm text-fg">{meta.who}</p>
                <p className="mt-1 text-sm text-muted">{meta.teaching}</p>
                <p className="mt-2 text-xs text-subtle">
                  {formatGrams(grams)} of {PURITY_TRADITION_LABEL}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="mt-6 space-y-2">
          <Label htmlFor="currency">Preferred currency</Label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
                {c === "INR" ? " (default)" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-subtle">
            Money set aside toward mahar can still be converted using this currency’s 24K consumer buying price.
          </p>
        </div>
      )}

      {step === 2 && (
        <Card className="mt-6 space-y-4">
          <p className="text-sm text-muted">
            These conversion values are configurable. The mahar target in grams follows them exactly.
          </p>
          <div>
            <Label htmlFor="gpt">Grams per tola</Label>
            <input
              id="gpt"
              type="number"
              min={0.0001}
              step="0.0001"
              value={gramsPerTola}
              onChange={(e) => setGramsPerTola(Number(e.target.value))}
              className="mt-1 h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
            />
          </div>
          <div>
            <Label htmlFor="tpu">Tolas per ukhiya</Label>
            <input
              id="tpu"
              type="number"
              min={0.0001}
              step="0.0001"
              value={tolasPerUkhiya}
              onChange={(e) => setTolasPerUkhiya(Number(e.target.value))}
              className="mt-1 h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
            />
          </div>
          <p className="text-sm text-fg">{assumptions}</p>
          <p className="text-sm text-muted">
            {ukhiya} ukhiya mahar = {formatGrams(target)} of {PURITY_TRADITION_LABEL}
          </p>
        </Card>
      )}

      {step === 3 && (
        <Card className="onboarding-reveal mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            Mahar: <span className="text-fg">{ukhiya} ukhiya</span>
            {selected ? ` · ${selected.who}` : ""} · {formatGrams(target)} of {PURITY_TRADITION_LABEL}.
          </p>
          <p>{assumptions}</p>
          <p>{selected?.teaching}</p>
          <p>{ZAR_E_SURKH_ORIGIN}</p>
          <p>{TRACKER_DISCLAIMER}</p>
          <label className="flex items-start gap-3 text-fg">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>{ONBOARDING_ACCEPT_LABEL}</span>
          </label>
          <label className="flex items-start gap-3 border-t border-border pt-4 text-fg">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={acknowledgedPromisedMahdi}
              onChange={(e) => setAcknowledgedPromisedMahdi(e.target.checked)}
            />
            <span>{ONBOARDING_MAHDI_ACKNOWLEDGEMENT}</span>
          </label>
        </Card>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" className="flex-1" onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1"
            disabled={!accepted || !acknowledgedPromisedMahdi || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving…" : "Start tracking mahar"}
          </Button>
        )}
      </div>
    </AppShell>
  );
}
