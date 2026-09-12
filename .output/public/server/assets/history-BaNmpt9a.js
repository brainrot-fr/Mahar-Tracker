import { t as buildRunningTotals } from "./calc-D8o5dhu5.js";
import { i as useCurrentUserState, t as Skeleton } from "./skeleton-PUJRkxBI.js";
import { b as RedirectToSignIn, m as listEntriesFn, n as AppShell, r as listPendingEntries, t as Card } from "./card-EbVh7PYj.js";
import { t as Badge } from "./badge-Dd5YmyHZ.js";
import { a as formatPercent, i as formatMoney, r as formatGrams, t as formatDate } from "./format-sxZDAiTI.js";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
//#region src/routes/history.tsx?tsr-split=component
function HistoryPage() {
	const { user, isPending } = useCurrentUserState();
	const [sort, setSort] = useState("newest");
	const query = useQuery({
		queryKey: ["entries", sort],
		queryFn: () => listEntriesFn({ data: { sort } }),
		enabled: !!user
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
			currentValue: query.data?.currentPrice != null && e.depositedCurrency === query.data.preferredCurrency ? e.completedGrams * query.data.currentPrice : null
		}));
	}, [query.data]);
	if (isPending) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(Skeleton, { className: "h-40 w-full" }) });
	if (!user) return /* @__PURE__ */ jsx(RedirectToSignIn, {});
	return /* @__PURE__ */ jsxs(AppShell, { children: [
		/* @__PURE__ */ jsx("h1", {
			className: "font-display text-3xl text-fg",
			children: "Mahar history"
		}),
		/* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted",
			children: "Every row is money you recorded toward mahar, not a gold purchase and not mahar already paid."
		}),
		/* @__PURE__ */ jsxs("label", {
			className: "mt-4 block text-xs text-subtle",
			children: ["Sort", /* @__PURE__ */ jsxs("select", {
				value: sort,
				onChange: (e) => setSort(e.target.value),
				className: "mt-1 h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg",
				children: [
					/* @__PURE__ */ jsx("option", {
						value: "newest",
						children: "Newest"
					}),
					/* @__PURE__ */ jsx("option", {
						value: "oldest",
						children: "Oldest"
					}),
					/* @__PURE__ */ jsx("option", {
						value: "largest_deposit",
						children: "Largest amount set aside"
					}),
					/* @__PURE__ */ jsx("option", {
						value: "largest_grams",
						children: "Largest gold-equivalent"
					})
				]
			})]
		}),
		pending.length > 0 && /* @__PURE__ */ jsx(Card, {
			className: "mt-4",
			children: /* @__PURE__ */ jsxs("p", {
				className: "text-sm text-warn",
				children: [
					pending.length,
					" mahar ",
					pending.length === 1 ? "entry" : "entries",
					" waiting to sync."
				]
			})
		}),
		query.isLoading && /* @__PURE__ */ jsxs("div", {
			className: "mt-4 space-y-3",
			children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-28 w-full" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-28 w-full" })]
		}),
		query.data && withRunning.length === 0 && /* @__PURE__ */ jsxs(Card, {
			className: "mt-6",
			children: [/* @__PURE__ */ jsx("p", {
				className: "text-sm text-muted",
				children: "No mahar entries yet. Record money you set aside and we will convert it to 24K gold-equivalent grams toward your ukhiya target."
			}), /* @__PURE__ */ jsx(Link, {
				to: "/entries/new",
				className: "mt-3 inline-block text-sm text-fg underline underline-offset-4",
				children: "Record mahar savings"
			})]
		}),
		/* @__PURE__ */ jsx("ul", {
			className: "mt-4 space-y-3",
			children: withRunning.map((row) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
				to: "/entries/$id",
				params: { id: row.id },
				className: "block",
				children: /* @__PURE__ */ jsxs(Card, { children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted",
							children: formatDate(row.depositDate)
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 font-medium text-fg tabular-nums",
							children: formatMoney(row.depositedAmount, row.depositedCurrency)
						})] }), /* @__PURE__ */ jsxs("div", {
							className: "text-right",
							children: [/* @__PURE__ */ jsx("p", {
								className: "font-medium text-fg tabular-nums",
								children: formatGrams(row.completedGrams)
							}), /* @__PURE__ */ jsxs("p", {
								className: "mt-1 text-xs text-subtle",
								children: [
									"Running ",
									formatGrams(row.runningGrams),
									" · ",
									formatPercent(row.runningCompletionPercent)
								]
							})]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ jsx(Badge, {
								tone: row.manuallyEnteredPrice ? "warn" : "muted",
								children: row.manuallyEnteredPrice ? "Manual price" : row.providerName
							}),
							row.fallbackUsed && !row.manuallyEnteredPrice && /* @__PURE__ */ jsx(Badge, { children: "Fallback provider" }),
							/* @__PURE__ */ jsxs(Badge, {
								tone: "metal",
								children: [formatMoney(row.normalizedPricePerGram, row.depositedCurrency), " / g"]
							})
						]
					}),
					row.currentValue != null && /* @__PURE__ */ jsxs("p", {
						className: "mt-2 text-xs text-subtle",
						children: [
							"Current estimated value of this entry",
							" ",
							formatMoney(row.currentValue, query.data?.preferredCurrency ?? row.depositedCurrency)
						]
					})
				] })
			}) }, row.id))
		})
	] });
}
//#endregion
export { HistoryPage as component };
