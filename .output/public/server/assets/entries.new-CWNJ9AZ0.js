import "./copy-C__m_4Lq.js";
import { o as SUPPORTED_CURRENCIES } from "./constants-7dvr3BEP.js";
import { r as goldEquivalentGrams } from "./calc-D8o5dhu5.js";
import { s as todayIsoDate } from "./validation-Da5kkcxK.js";
import { i as useCurrentUserState } from "./skeleton-PUJRkxBI.js";
import { _ as quotePriceFn, b as RedirectToSignIn, d as getBootstrap, g as quoteManualFn, i as queuePendingEntry, n as AppShell, s as createEntryFn, t as Card } from "./card-EbVh7PYj.js";
import { t as Button } from "./button-DIjsGSUW.js";
import { t as Input } from "./input-BmcVG4ky.js";
import { t as Label } from "./label-CQF5E2iB.js";
import { t as Textarea } from "./textarea-B31OfKui.js";
import { i as formatMoney, o as priceUnitLabel, r as formatGrams } from "./format-sxZDAiTI.js";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
//#region src/routes/entries.new.tsx?tsr-split=component
function NewEntryPage() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const bootstrap = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap(),
		enabled: !!user
	});
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(todayIsoDate());
	const [currency, setCurrency] = useState("");
	const [note, setNote] = useState("");
	const [quote, setQuote] = useState(null);
	const [quoteError, setQuoteError] = useState(null);
	const [manualOpen, setManualOpen] = useState(false);
	const [manualPrice, setManualPrice] = useState("");
	const [manualUnit, setManualUnit] = useState("per_gram");
	const [manualConfirmed, setManualConfirmed] = useState(false);
	const [idempotencyKey] = useState(() => crypto.randomUUID());
	const [busyQuote, setBusyQuote] = useState(false);
	const preferred = bootstrap.data?.profile.preferredCurrency ?? "INR";
	const usedCurrency = currency || preferred;
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
		mutationFn: () => createEntryFn({ data: {
			amount: Number(amount),
			currency: usedCurrency,
			depositDate: date,
			note: note || null,
			idempotencyKey,
			manualPrice: quote?.manuallyEntered && manualConfirmed ? {
				goldPrice: Number(manualPrice),
				goldPriceUnit: manualUnit,
				confirmed: true
			} : void 0
		} }),
		onSuccess: (entry) => {
			qc.invalidateQueries();
			toast.success("Mahar savings recorded");
			navigate({
				to: "/entries/$id",
				params: { id: entry.id }
			});
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save this mahar entry")
	});
	async function fetchQuote() {
		setBusyQuote(true);
		setQuoteError(null);
		setQuote(null);
		setManualConfirmed(false);
		try {
			const result = await quotePriceFn({ data: {
				date,
				currency: usedCurrency
			} });
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
		const result = await quoteManualFn({ data: {
			date,
			currency: usedCurrency,
			goldPrice: Number(manualPrice),
			goldPriceUnit: manualUnit
		} });
		if (!result.ok) {
			setQuoteError(result.message);
			return;
		}
		setQuote(result.quote);
		setQuoteError(null);
	}
	if (isPending) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", { className: "h-40 animate-pulse rounded-xl bg-elevated" }) });
	if (!user) return /* @__PURE__ */ jsx(RedirectToSignIn, {});
	return /* @__PURE__ */ jsxs(AppShell, { children: [
		/* @__PURE__ */ jsx("h1", {
			className: "font-display text-3xl text-fg",
			children: "Record mahar savings"
		}),
		/* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted",
			children: "Enter the money you set aside toward mahar and the date. Ukhiya looks up the 24K consumer buying price for zar-e-surkh-e-khalis on that date when it can."
		}),
		/* @__PURE__ */ jsxs("form", {
			className: "mt-6 space-y-4",
			onSubmit: (e) => {
				e.preventDefault();
				if (typeof navigator !== "undefined" && !navigator.onLine) {
					queuePendingEntry(user.id, {
						idempotencyKey,
						amount: Number(amount),
						currency: usedCurrency,
						depositDate: date,
						note: note || null,
						createdAt: (/* @__PURE__ */ new Date()).toISOString(),
						status: quote ? "pending_sync" : "pending_price"
					});
					toast.message("Saved on this device. It will calculate after a 24K price is available.");
					return;
				}
				save.mutate();
			},
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "amount",
						children: "Amount set aside toward mahar"
					}), /* @__PURE__ */ jsx(Input, {
						id: "amount",
						inputMode: "decimal",
						required: true,
						value: amount,
						onChange: (e) => setAmount(e.target.value),
						placeholder: "10000"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "currency",
						children: "Currency"
					}), /* @__PURE__ */ jsx("select", {
						id: "currency",
						value: usedCurrency,
						onChange: (e) => {
							setCurrency(e.target.value);
							setQuote(null);
						},
						className: "h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg",
						children: SUPPORTED_CURRENCIES.map((c) => /* @__PURE__ */ jsx("option", {
							value: c,
							children: c
						}, c))
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-1.5",
					children: [
						/* @__PURE__ */ jsx(Label, {
							htmlFor: "date",
							children: "Date money was set aside"
						}),
						/* @__PURE__ */ jsx(Input, {
							id: "date",
							type: "date",
							required: true,
							max: todayIsoDate(),
							value: date,
							onChange: (e) => {
								setDate(e.target.value);
								setQuote(null);
							}
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-subtle",
							children: "Past dates never silently reuse today’s price."
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "note",
						children: "Note (optional)"
					}), /* @__PURE__ */ jsx(Textarea, {
						id: "note",
						value: note,
						onChange: (e) => setNote(e.target.value),
						maxLength: 500
					})]
				}),
				/* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "secondary",
					className: "w-full",
					onClick: fetchQuote,
					disabled: busyQuote,
					children: busyQuote ? "Looking up 24K price…" : "Look up 24K price"
				}),
				quoteError && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx("p", {
					className: "text-sm text-warn",
					children: quoteError
				}) }),
				quote && /* @__PURE__ */ jsxs(Card, {
					className: "space-y-2 text-sm",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "font-medium text-fg",
							children: "Price used for this mahar entry"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-muted",
							children: [
								"Raw 24K consumer price: ",
								formatMoney(quote.goldPrice, quote.apiCurrency),
								" ",
								priceUnitLabel(quote.goldPriceUnit)
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-muted",
							children: [
								"Normalized: ",
								formatMoney(quote.pricePerGramInDepositCurrency, usedCurrency),
								" per gram"
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-muted",
							children: [
								"Provider: ",
								quote.providerName,
								quote.fallbackUsed ? " (fallback)" : "",
								quote.fromCache ? " · cached snapshot" : "",
								quote.manuallyEntered ? " · manually entered" : ""
							]
						}),
						quote.exchangeRate !== 1 && /* @__PURE__ */ jsxs("p", {
							className: "text-muted",
							children: [
								"Exchange rate locked: 1 ",
								quote.apiCurrency,
								" = ",
								quote.exchangeRate,
								" ",
								usedCurrency
							]
						}),
						previewGrams != null && /* @__PURE__ */ jsxs("p", {
							className: "text-fg",
							children: ["Gold-equivalent toward mahar: ", formatGrams(previewGrams)]
						})
					]
				}),
				(manualOpen || quote?.manuallyEntered) && /* @__PURE__ */ jsxs(Card, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-fg",
							children: "Enter the 24K consumer buying price yourself"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-muted",
							children: [
								"Use a bank or bullion buying rate for ",
								"Zar-e-surkh-e-khalis (24K)",
								", not jewelry prices or making charges."
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "mprice",
								children: "Price"
							}), /* @__PURE__ */ jsx(Input, {
								id: "mprice",
								inputMode: "decimal",
								value: manualPrice,
								onChange: (e) => {
									setManualPrice(e.target.value);
									setManualConfirmed(false);
								}
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "munit",
								children: "Unit"
							}), /* @__PURE__ */ jsxs("select", {
								id: "munit",
								value: manualUnit,
								onChange: (e) => setManualUnit(e.target.value),
								className: "h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg",
								children: [
									/* @__PURE__ */ jsx("option", {
										value: "per_gram",
										children: "Per gram"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "per_tola",
										children: "Per tola"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "per_troy_ounce",
										children: "Per troy ounce"
									})
								]
							})]
						}),
						/* @__PURE__ */ jsx(Button, {
							type: "button",
							variant: "secondary",
							onClick: applyManual,
							children: "Use this price"
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "flex items-start gap-2 text-sm text-fg",
							children: [
								/* @__PURE__ */ jsx("input", {
									type: "checkbox",
									className: "mt-1",
									checked: manualConfirmed,
									onChange: (e) => setManualConfirmed(e.target.checked)
								}),
								"I confirm this is the 24K consumer buying price I observed for ",
								date,
								"."
							]
						})
					]
				}),
				/* @__PURE__ */ jsx(Button, {
					type: "submit",
					className: "w-full",
					disabled: save.isPending || !amount || !quote || quote.manuallyEntered && !manualConfirmed,
					children: save.isPending ? "Saving…" : "Save mahar entry"
				})
			]
		})
	] });
}
//#endregion
export { NewEntryPage as component };
