import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "@/lib/auth/client";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PERMITTED_UKHIYA, SUPPORTED_CURRENCIES } from "@/lib/gold/constants";
import {
  MAHAR_ORIGIN,
  PURITY_TRADITION_LABEL,
  TRACKER_DISCLAIMER,
  UKHIYA_MAHAR,
  ZAR_E_SURKH_ORIGIN,
  maharTargetLabel,
} from "@/lib/gold/copy";
import {
  changeGoalFn,
  deleteAccountFn,
  exportDataFn,
  getBootstrap,
  listProvidersFn,
  updatePreferencesFn,
} from "@/lib/gold/fns";
import { formatGrams, formatMoney } from "@/lib/gold/format";
import { unitAssumptionsText } from "@/lib/gold/units";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const bootstrap = useQuery({ queryKey: ["bootstrap"], queryFn: () => getBootstrap(), enabled: !!user });
  const providers = useQuery({ queryKey: ["providers"], queryFn: () => listProvidersFn(), enabled: !!user });
  const [ukhiya, setUkhiya] = useState<number>(9);
  const [phrase, setPhrase] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");

  const prefs = useMutation({
    mutationFn: (data: { preferredCurrency?: string; selectedProvider?: string | null }) =>
      updatePreferencesFn({ data }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success("Preferences saved");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  const change = useMutation({
    mutationFn: () => changeGoalFn({ data: { ukhiyaCount: ukhiya, confirmPhrase: phrase } }),
    onSuccess: () => {
      void qc.invalidateQueries();
      setPhrase("");
      toast.success("Mahar target updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not change mahar"),
  });

  const remove = useMutation({
    mutationFn: () => deleteAccountFn({ data: { confirmPhrase: deletePhrase } }),
    onSuccess: () => {
      toast.success("Account data deleted");
      void signOut("/");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not delete"),
  });

  async function onExport() {
    try {
      const data = await exportDataFn();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ukhiya-mahar-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  }

  if (isPending) return <AppShell><div className="h-40 animate-pulse rounded-xl bg-elevated" /></AppShell>;
  if (!user) return <RedirectToSignIn />;

  const goal = bootstrap.data?.goal;
  const profile = bootstrap.data?.profile;
  const settings = bootstrap.data?.settings;
  const isCustomCash = goal?.goalType === "cash";

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-fg">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        {isCustomCash ? "Custom cash tracking counts deposits directly in your target currency, without gold price lookups." : "Ukhiya tracks mahar as 24K gold-equivalent. Changing a target recalculates remaining grams against the same completed gold-equivalent."}
      </p>

      <Card className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
        <p className="font-medium text-fg">About this mahar tracker</p>
        <p>{MAHAR_ORIGIN}</p>
        <p>{ZAR_E_SURKH_ORIGIN}</p>
        <p>{TRACKER_DISCLAIMER}</p>
      </Card>

      {goal && (
        <Card className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-subtle">Current mahar</p>
          <p className="font-display text-2xl text-fg">{isCustomCash ? "Custom cash mahar" : maharTargetLabel(goal.ukhiyaCount)}</p>
          <p className="text-sm text-muted">
            {isCustomCash ? `${formatMoney(goal.targetAmount, goal.targetCurrency)} target` : `${formatGrams(goal.targetGrams)} of ${PURITY_TRADITION_LABEL}`}
          </p>
          {UKHIYA_MAHAR[goal.ukhiyaCount as 9 | 10 | 11] && (
            <p className="text-sm text-muted">{UKHIYA_MAHAR[goal.ukhiyaCount as 9 | 10 | 11].who}</p>
          )}
          <p className="text-xs text-subtle">
            {unitAssumptionsText({ gramsPerTola: goal.gramsPerTola, tolasPerUkhiya: goal.tolasPerUkhiya })}
          </p>
        </Card>
      )}

      {!isCustomCash && <Card className="mt-4 space-y-3">
        <p className="font-medium text-fg">Change mahar target</p>
        <p className="text-sm text-muted">
          Completed grams on existing entries stay as they were recorded. Remaining grams and the
          completion percentage are recalculated against the new mahar. Type CHANGE TARGET to confirm.
        </p>
        <select
          value={ukhiya}
          onChange={(e) => setUkhiya(Number(e.target.value))}
          className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
        >
          {PERMITTED_UKHIYA.map((n) => (
            <option key={n} value={n}>
              {n} ukhiya · {UKHIYA_MAHAR[n].whoShort}
            </option>
          ))}
        </select>
        <Label htmlFor="chg">Confirmation</Label>
        <Input id="chg" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="CHANGE TARGET" />
        <Button type="button" variant="secondary" disabled={change.isPending} onClick={() => change.mutate()}>
          Update mahar
        </Button>
      </Card>}

      {profile && (
        <Card className="mt-4 space-y-3">
          <p className="font-medium text-fg">Preferred currency</p>
          <select
            value={profile.preferredCurrency}
            onChange={(e) => prefs.mutate({ preferredCurrency: e.target.value })}
            className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Card>
      )}

      <Card className="mt-4 space-y-3">
        <p className="font-medium text-fg">Preferred price provider</p>
        <p className="text-xs text-muted">
          If the selected provider fails, the next available provider is used automatically. The
          mahar entry still records which source supplied the 24K price.
        </p>
        <select
          value={profile?.selectedProvider ?? ""}
          onChange={(e) => prefs.mutate({ selectedProvider: e.target.value || null })}
          className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
        >
          <option value="">Automatic failover</option>
          {(providers.data ?? []).map((p) => (
            <option key={p.name} value={p.name} disabled={!p.configured}>
              {p.name}
              {!p.configured ? " (needs server key)" : ""}
              {p.historical ? " · historical" : ""}
            </option>
          ))}
        </select>
      </Card>

      {settings && (
        <Card className="mt-4 space-y-2 text-sm text-muted">
          <p className="font-medium text-fg">Product configuration</p>
          <p>Manual price fallback: {settings.manualPriceFallbackEnabled ? "enabled" : "disabled"}</p>
          <p>Default provider order: {settings.providerPriority.join(" → ")}</p>
          <p>
            Permitted mahar: {settings.permittedUkhiya.map((n) => `${n} ukhiya`).join(", ")}
          </p>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        <Button type="button" variant="secondary" className="w-full" onClick={onExport}>
          Export my mahar records
        </Button>
        {(
          <Button type="button" variant="ghost" className="w-full" onClick={() => signOut("/")}>
            Sign out
          </Button>
        )}
      </div>

      <Card className="mt-8 space-y-3">
        <p className="font-medium text-danger">Delete account</p>
        <p className="text-sm text-muted">
          Removes your profile, mahar target, and savings entries from this app. Type DELETE ACCOUNT.
        </p>
        <Input value={deletePhrase} onChange={(e) => setDeletePhrase(e.target.value)} placeholder="DELETE ACCOUNT" />
        <Button
          type="button"
          variant="danger"
          className="w-full"
          disabled={deletePhrase !== "DELETE ACCOUNT" || remove.isPending}
          onClick={() => remove.mutate()}
        >
          Delete all my data
        </Button>
      </Card>
    </AppShell>
  );
}
