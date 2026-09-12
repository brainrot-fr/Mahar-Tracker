import { n as Route } from "./router-DiKa0TKD.js";
import { i as useCurrentUserState } from "./skeleton-PUJRkxBI.js";
import { b as RedirectToSignIn, l as deleteEntryFn, n as AppShell, p as getEntryFn, t as Card, v as updateEntryFn } from "./card-EbVh7PYj.js";
import { t as Button } from "./button-DIjsGSUW.js";
import { t as Badge } from "./badge-Dd5YmyHZ.js";
import { t as Input } from "./input-BmcVG4ky.js";
import { t as Label } from "./label-CQF5E2iB.js";
import { t as Textarea } from "./textarea-B31OfKui.js";
import { i as formatMoney, n as formatDateTime, o as priceUnitLabel, r as formatGrams, t as formatDate } from "./format-sxZDAiTI.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
//#region src/routes/entries.$id.tsx?tsr-split=component
function EntryDetailPage() {
	const { id } = Route.useParams();
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const query = useQuery({
		queryKey: ["entry", id],
		queryFn: () => getEntryFn({ data: { id } }),
		enabled: !!user
	});
	const [editing, setEditing] = useState(false);
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState("");
	const [note, setNote] = useState("");
	const [editAck, setEditAck] = useState(false);
	const [deletePhrase, setDeletePhrase] = useState("");
	const [deleting, setDeleting] = useState(false);
	const entry = query.data?.entry;
	const update = useMutation({
		mutationFn: () => updateEntryFn({ data: {
			id,
			amount: Number(amount),
			depositDate: date,
			note
		} }),
		onSuccess: () => {
			qc.invalidateQueries();
			toast.success("Mahar entry updated");
			setEditing(false);
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed")
	});
	const remove = useMutation({
		mutationFn: () => deleteEntryFn({ data: {
			id,
			confirmPhrase: deletePhrase
		} }),
		onSuccess: () => {
			qc.invalidateQueries();
			toast.success("Mahar entry deleted");
			navigate({ to: "/history" });
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed")
	});
	if (isPending) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", { className: "h-40 animate-pulse rounded-xl bg-elevated" }) });
	if (!user) return /* @__PURE__ */ jsx(RedirectToSignIn, {});
	if (query.isLoading) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", { className: "h-40 animate-pulse rounded-xl bg-elevated" }) });
	if (!entry) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("p", {
		className: "text-sm text-muted",
		children: "This mahar entry is not in your records."
	}) });
	return /* @__PURE__ */ jsxs(AppShell, { children: [
		/* @__PURE__ */ jsx("p", {
			className: "text-xs uppercase tracking-wider text-subtle",
			children: "Mahar entry"
		}),
		/* @__PURE__ */ jsx("h1", {
			className: "mt-1 font-display text-3xl text-fg",
			children: formatDate(entry.depositDate)
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-3 flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ jsx(Badge, {
					tone: entry.manuallyEnteredPrice ? "warn" : "muted",
					children: entry.manuallyEnteredPrice ? "Manual price" : "API price"
				}),
				/* @__PURE__ */ jsx(Badge, { children: entry.providerName }),
				entry.fallbackUsed && /* @__PURE__ */ jsx(Badge, { children: "Fallback used" })
			]
		}),
		/* @__PURE__ */ jsxs(Card, {
			className: "mt-6 space-y-3 text-sm",
			children: [
				/* @__PURE__ */ jsx(Row, {
					label: "Money set aside toward mahar",
					value: formatMoney(entry.depositedAmount, entry.depositedCurrency)
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Raw 24K consumer price",
					value: `${formatMoney(entry.goldPrice, entry.apiCurrency)} ${priceUnitLabel(entry.goldPriceUnit)}`
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Price used for this entry",
					value: `${formatMoney(entry.normalizedPricePerGram, entry.depositedCurrency)} per gram`
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "24K gold-equivalent grams",
					value: formatGrams(entry.completedGrams, 6)
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Currency conversion",
					value: entry.exchangeRate === 1 ? `None · price already in ${entry.depositedCurrency}` : `1 ${entry.apiCurrency} = ${entry.exchangeRate} ${entry.depositedCurrency}`
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Exchange-rate time",
					value: formatDateTime(entry.exchangeRateTimestamp)
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Price source time",
					value: formatDateTime(entry.priceSourceTimestamp)
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Created",
					value: formatDateTime(entry.createdAt)
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Last edited",
					value: formatDateTime(entry.updatedAt)
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Entry ID",
					value: entry.id
				}),
				/* @__PURE__ */ jsx(Row, {
					label: "Status",
					value: entry.status
				}),
				entry.note && /* @__PURE__ */ jsx(Row, {
					label: "Note",
					value: entry.note
				}),
				query.data?.currentValue != null && /* @__PURE__ */ jsx(Row, {
					label: "Current estimated value of this entry",
					value: formatMoney(query.data.currentValue, entry.depositedCurrency)
				})
			]
		}),
		!editing ? /* @__PURE__ */ jsx(Button, {
			type: "button",
			variant: "secondary",
			className: "mt-6 w-full",
			onClick: () => {
				setAmount(String(entry.depositedAmount));
				setDate(entry.depositDate);
				setNote(entry.note ?? "");
				setEditAck(false);
				setEditing(true);
			},
			children: "Edit entry"
		}) : /* @__PURE__ */ jsxs(Card, {
			className: "mt-6 space-y-3",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-warn",
					children: "Changing this entry will change your mahar history, completed gold-equivalent grams, remaining target, and progress percentage."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "amt",
						children: "Amount set aside"
					}), /* @__PURE__ */ jsx(Input, {
						id: "amt",
						value: amount,
						onChange: (e) => setAmount(e.target.value)
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "dt",
						children: "Date"
					}), /* @__PURE__ */ jsx(Input, {
						id: "dt",
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value)
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "nt",
						children: "Note"
					}), /* @__PURE__ */ jsx(Textarea, {
						id: "nt",
						value: note,
						onChange: (e) => setNote(e.target.value)
					})]
				}),
				/* @__PURE__ */ jsxs("label", {
					className: "flex items-start gap-2 text-sm",
					children: [/* @__PURE__ */ jsx("input", {
						type: "checkbox",
						className: "mt-1",
						checked: editAck,
						onChange: (e) => setEditAck(e.target.checked)
					}), "I understand the mahar history will change. If the date or amount changes, a new price quote is required."]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ jsx(Button, {
						type: "button",
						variant: "secondary",
						className: "flex-1",
						onClick: () => setEditing(false),
						children: "Cancel"
					}), /* @__PURE__ */ jsx(Button, {
						type: "button",
						className: "flex-1",
						disabled: !editAck || update.isPending,
						onClick: () => update.mutate(),
						children: "Save changes"
					})]
				})
			]
		}),
		!deleting ? /* @__PURE__ */ jsx(Button, {
			type: "button",
			variant: "ghost",
			className: "mt-3 w-full text-danger",
			onClick: () => setDeleting(true),
			children: "Delete entry"
		}) : /* @__PURE__ */ jsxs(Card, {
			className: "mt-4 space-y-3",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-warn",
					children: "Deleting this entry will permanently remove it from your mahar history and reduce your completed-gold calculation. This action may affect your progress toward the ukhiya mahar."
				}),
				/* @__PURE__ */ jsx(Label, {
					htmlFor: "confirm",
					children: "Type CONFIRM"
				}),
				/* @__PURE__ */ jsx(Input, {
					id: "confirm",
					value: deletePhrase,
					onChange: (e) => setDeletePhrase(e.target.value)
				}),
				/* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "danger",
					className: "w-full",
					disabled: deletePhrase !== "CONFIRM" || remove.isPending,
					onClick: () => remove.mutate(),
					children: "Delete permanently"
				})
			]
		})
	] });
}
function Row({ label, value }) {
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
		className: "text-xs text-subtle",
		children: label
	}), /* @__PURE__ */ jsx("p", {
		className: "mt-0.5 break-all text-fg",
		children: value
	})] });
}
//#endregion
export { EntryDetailPage as component };
