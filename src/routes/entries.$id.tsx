import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { deleteEntryFn, getEntryFn, updateEntryFn } from "@/lib/gold/fns";
import { formatDate, formatDateTime, formatGrams, formatMoney, priceUnitLabel } from "@/lib/gold/format";

export const Route = createFileRoute("/entries/$id")({ component: EntryDetailPage });

function EntryDetailPage() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["entry", id],
    queryFn: () => getEntryFn({ data: { id } }),
    enabled: !!user,
  });
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [editAck, setEditAck] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);

  const entry = query.data?.entry;
  const isCustomCash = query.data?.goal?.goalType === "cash";

  const update = useMutation({
    mutationFn: () =>
      updateEntryFn({
        data: {
          id,
          amount: Number(amount),
          depositDate: date,
          note,
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success("Mahar entry updated");
      setEditing(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const remove = useMutation({
    mutationFn: () => deleteEntryFn({ data: { id, confirmPhrase: deletePhrase } }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success("Mahar entry deleted");
      navigate({ to: "/history" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  if (isPending) return <AppShell><div className="h-40 animate-pulse rounded-xl bg-elevated" /></AppShell>;
  if (!user) return <RedirectToSignIn />;
  if (query.isLoading) return <AppShell><div className="h-40 animate-pulse rounded-xl bg-elevated" /></AppShell>;
  if (!entry) {
    return (
      <AppShell>
        <p className="text-sm text-muted">This mahar entry is not in your records.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <p className="text-xs uppercase tracking-wider text-subtle">Mahar entry</p>
      <h1 className="mt-1 font-display text-3xl text-fg">{formatDate(entry.depositDate)}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={entry.manuallyEnteredPrice ? "warn" : "muted"}>
          {isCustomCash ? "Custom cash" : entry.manuallyEnteredPrice ? "Manual price" : "API price"}
        </Badge>
        {!isCustomCash && <Badge>{entry.providerName}</Badge>}
        {entry.fallbackUsed && <Badge>Fallback used</Badge>}
      </div>

      <Card className="mt-6 space-y-3 text-sm">
        <Row label="Money set aside toward mahar" value={formatMoney(entry.depositedAmount, entry.depositedCurrency)} />
        {!isCustomCash && <Row
          label="Raw 24K consumer price"
          value={`${formatMoney(entry.goldPrice, entry.apiCurrency)} ${priceUnitLabel(entry.goldPriceUnit)}`}
        />}
        {!isCustomCash && <Row
          label="Price used for this entry"
          value={`${formatMoney(entry.normalizedPricePerGram, entry.depositedCurrency)} per gram`}
        />}
        <Row label={isCustomCash ? "Cash counted toward mahar" : "24K gold-equivalent grams"} value={isCustomCash ? formatMoney(entry.completedGrams, entry.depositedCurrency) : formatGrams(entry.completedGrams, 6)} />
        {!isCustomCash && <Row
          label="Currency conversion"
          value={
            entry.exchangeRate === 1
              ? `None · price already in ${entry.depositedCurrency}`
              : `1 ${entry.apiCurrency} = ${entry.exchangeRate} ${entry.depositedCurrency}`
          }
        />}
        {!isCustomCash && <Row label="Exchange-rate time" value={formatDateTime(entry.exchangeRateTimestamp)} />}
        {!isCustomCash && <Row label="Price source time" value={formatDateTime(entry.priceSourceTimestamp)} />}
        <Row label="Created" value={formatDateTime(entry.createdAt)} />
        <Row label="Last edited" value={formatDateTime(entry.updatedAt)} />
        <Row label="Entry ID" value={entry.id} />
        <Row label="Status" value={entry.status} />
        {entry.note && <Row label="Note" value={entry.note} />}
        {!isCustomCash && query.data?.currentValue != null && (
          <Row
            label="Current estimated value of this entry"
            value={formatMoney(query.data.currentValue, entry.depositedCurrency)}
          />
        )}
      </Card>

      {!editing ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-6 w-full"
          onClick={() => {
            setAmount(String(entry.depositedAmount));
            setDate(entry.depositDate);
            setNote(entry.note ?? "");
            setEditAck(false);
            setEditing(true);
          }}
        >
          Edit entry
        </Button>
      ) : (
        <Card className="mt-6 space-y-3">
          <p className="text-sm text-warn">
            Changing this entry will change your mahar history, completed gold-equivalent grams,
            remaining target, and progress percentage.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="amt">Amount set aside</Label>
            <Input id="amt" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt">Date</Label>
            <Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nt">Note</Label>
            <Textarea id="nt" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={editAck} onChange={(e) => setEditAck(e.target.checked)} />
            I understand the mahar history will change. If the date or amount changes, a new price quote is required.
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!editAck || update.isPending}
              onClick={() => update.mutate()}
            >
              Save changes
            </Button>
          </div>
        </Card>
      )}

      {!deleting ? (
        <Button type="button" variant="ghost" className="mt-3 w-full text-danger" onClick={() => setDeleting(true)}>
          Delete entry
        </Button>
      ) : (
        <Card className="mt-4 space-y-3">
          <p className="text-sm text-warn">
            Deleting this entry will permanently remove it from your mahar history and reduce your
            completed-gold calculation. This action may affect your progress toward the ukhiya mahar.
          </p>
          <Label htmlFor="confirm">Type CONFIRM</Label>
          <Input id="confirm" value={deletePhrase} onChange={(e) => setDeletePhrase(e.target.value)} />
          <Button
            type="button"
            variant="danger"
            className="w-full"
            disabled={deletePhrase !== "CONFIRM" || remove.isPending}
            onClick={() => remove.mutate()}
          >
            Delete permanently
          </Button>
        </Card>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-0.5 break-all text-fg">{value}</p>
    </div>
  );
}
