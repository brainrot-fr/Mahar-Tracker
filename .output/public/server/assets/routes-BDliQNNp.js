import { c as UKHIYA_MAHAR, i as MAHAR_ORIGIN, l as ZAR_E_SURKH_ORIGIN, o as PURITY_TRADITION_LABEL, s as TRACKER_DISCLAIMER, t as APP_NAME, u as maharTargetLabel } from "./copy-C__m_4Lq.js";
import { i as MILESTONES } from "./constants-7dvr3BEP.js";
import { a as unitAssumptionsText } from "./units-C4Cl_0jQ.js";
import { i as useCurrentUserState, t as Skeleton } from "./skeleton-3wNi2Csj.js";
import { f as getDashboardFn, n as AppShell, t as Card } from "./card-CiUyZpaK.js";
import { t as Button } from "./button-DZyOIz5_.js";
import { t as Badge } from "./badge-Dh3hx999.js";
import { a as formatPercent, i as formatMoney, n as formatDateTime, r as formatGrams, t as formatDate } from "./format-sxZDAiTI.js";
import { Link, Navigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
//#region src/components/progress-ring.tsx
function ProgressRing({ percent, label, sublabel }) {
	const size = 280;
	const stroke = 14;
	const r = 133;
	const c = 2 * Math.PI * r;
	const clamped = Math.min(100, Math.max(0, percent));
	const dash = clamped / 100 * c;
	return /* @__PURE__ */ jsxs("div", {
		className: "relative mx-auto grid place-items-center",
		style: {
			width: size,
			height: size
		},
		children: [/* @__PURE__ */ jsxs("svg", {
			width: size,
			height: size,
			viewBox: `0 0 ${size} ${size}`,
			className: "-rotate-90",
			children: [
				/* @__PURE__ */ jsx("circle", {
					cx: size / 2,
					cy: size / 2,
					r,
					fill: "none",
					stroke: "var(--color-elevated)",
					strokeWidth: stroke
				}),
				/* @__PURE__ */ jsx("circle", {
					cx: size / 2,
					cy: size / 2,
					r,
					fill: "none",
					stroke: "var(--color-metal)",
					strokeWidth: stroke,
					strokeLinecap: "round",
					strokeDasharray: `${dash} ${c - dash}`
				}),
				MILESTONES.map((m) => {
					const angle = m / 100 * 2 * Math.PI;
					const inner = 123;
					const outer = 143;
					const x1 = size / 2 + inner * Math.cos(angle);
					const y1 = size / 2 + inner * Math.sin(angle);
					const x2 = size / 2 + outer * Math.cos(angle);
					const y2 = size / 2 + outer * Math.sin(angle);
					return /* @__PURE__ */ jsx("line", {
						x1,
						y1,
						x2,
						y2,
						stroke: clamped >= m ? "var(--color-accent)" : "var(--color-subtle)",
						strokeWidth: 2
					}, m);
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "absolute inset-0 flex rotate-0 flex-col items-center justify-center text-center",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "font-display text-4xl font-medium tracking-tight text-fg tabular-nums",
					children: formatPercent(clamped)
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted",
					children: label
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-0.5 max-w-[12rem] text-xs text-subtle",
					children: sublabel
				})
			]
		})]
	});
}
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function Home() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ jsxs("main", {
		className: "mx-auto min-h-dvh max-w-6xl bg-bg px-4 py-10 md:px-8",
		children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-32" }), /* @__PURE__ */ jsx(Skeleton, { className: "mt-6 h-72 w-full rounded-xl" })]
	});
	if (!user) return /* @__PURE__ */ jsx(Landing, {});
	return /* @__PURE__ */ jsx(SignedInHome, {});
}
function Landing() {
	return /* @__PURE__ */ jsxs("main", {
		className: "mx-auto min-h-dvh max-w-6xl bg-bg px-5 pb-16 pt-12 md:px-8",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "font-display text-sm tracking-[0.18em] text-metal uppercase",
				children: APP_NAME
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "mt-4 font-display text-4xl leading-tight text-fg",
				children: "Track mahar toward 9, 10, or 11 ukhiya of zar-e-surkh-e-khalis."
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-4 text-base leading-relaxed text-muted",
				children: MAHAR_ORIGIN
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 text-base leading-relaxed text-muted",
				children: ZAR_E_SURKH_ORIGIN
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-6 grid gap-2",
				children: [
					9,
					10,
					11
				].map((n) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-baseline justify-between rounded-xl border border-border bg-surface px-4 py-3",
					children: [/* @__PURE__ */ jsxs("p", {
						className: "font-display text-lg text-fg",
						children: [n, " ukhiya"]
					}), /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted",
						children: UKHIYA_MAHAR[n].whoShort
					})]
				}, n))
			}),
			/* @__PURE__ */ jsxs(Card, {
				className: "mt-8 space-y-3",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-sm font-medium text-fg",
					children: "This is a mahar tracker, not a gold shop."
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm leading-relaxed text-muted",
					children: TRACKER_DISCLAIMER
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-8 space-y-3",
				children: /* @__PURE__ */ jsx(Button, {
					asChild: true,
					variant: "ghost",
					className: "w-full",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/login",
						children: "Email and password"
					})
				})
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-8 text-xs leading-relaxed text-subtle",
				children: [
					"Default units: 1 ukhiya = 11 tolas, 1 tola = 11.6638 grams. Those values are confirmed during setup and can be configured. Purity is ",
					PURITY_TRADITION_LABEL,
					"."
				]
			})
		]
	});
}
function SignedInHome() {
	const dash = useQuery({
		queryKey: ["dashboard"],
		queryFn: () => getDashboardFn(),
		refetchInterval: 9e5,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true
	});
	if (dash.isLoading) return /* @__PURE__ */ jsxs(AppShell, { children: [/* @__PURE__ */ jsx(Skeleton, { className: "mx-auto size-64 rounded-full" }), /* @__PURE__ */ jsx(Skeleton, { className: "mt-6 h-32 w-full rounded-xl" })] });
	if (dash.error) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("p", {
		className: "text-sm text-danger",
		children: dash.error instanceof Error ? dash.error.message : "Could not load"
	}) });
	const data = dash.data;
	if (!data) return null;
	if ("needsOnboarding" in data) return /* @__PURE__ */ jsx(Navigate, { to: "/onboarding" });
	return /* @__PURE__ */ jsx(DashboardView, { data });
}
function DashboardView({ data }) {
	const assumptions = unitAssumptionsText({
		gramsPerTola: data.goal.gramsPerTola,
		tolasPerUkhiya: data.goal.tolasPerUkhiya
	});
	const preferredTotal = data.totalDepositedPreferred;
	const who = UKHIYA_MAHAR[data.targetUkhiya];
	return /* @__PURE__ */ jsxs(AppShell, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "text-xs uppercase tracking-wider text-subtle",
				children: "Mahar target"
			}), /* @__PURE__ */ jsx("h1", {
				className: "font-display text-2xl text-fg",
				children: maharTargetLabel(data.targetUkhiya)
			})] }), /* @__PURE__ */ jsx(Badge, {
				tone: "metal",
				children: PURITY_TRADITION_LABEL
			})]
		}),
		who && /* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted",
			children: who.who
		}),
		/* @__PURE__ */ jsxs("p", {
			className: "mt-1 text-sm text-muted",
			children: [
				formatGrams(data.targetGrams),
				" · ",
				assumptions
			]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mt-6",
			children: /* @__PURE__ */ jsx(ProgressRing, {
				percent: data.completionPercent,
				label: "Completed toward mahar",
				sublabel: `${formatGrams(data.completedGrams)} of ${formatGrams(data.targetGrams)}`
			})
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mt-2 flex justify-center gap-2",
			children: data.milestones.map((m) => /* @__PURE__ */ jsxs("span", {
				className: `text-[10px] tabular-nums ${m.reached ? "text-metal" : "text-subtle"}`,
				children: [m.percent, "%"]
			}, m.percent))
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-8 grid grid-cols-2 gap-3",
			children: [
				/* @__PURE__ */ jsx(Stat, {
					label: "Gold-equivalent completed",
					value: formatGrams(data.completedGrams)
				}),
				/* @__PURE__ */ jsx(Stat, {
					label: "Remaining toward mahar",
					value: formatGrams(data.remainingGrams)
				}),
				/* @__PURE__ */ jsx(Stat, {
					label: `Money set aside in ${data.preferredCurrency}`,
					value: preferredTotal != null ? formatMoney(preferredTotal, data.preferredCurrency) : data.totalDepositedByCurrency.map((b) => formatMoney(b.amount, b.currency)).join(" · ") || "—"
				}),
				/* @__PURE__ */ jsx(Stat, {
					label: "Current estimated value",
					value: data.currentEstimatedValue != null && data.currentPriceCurrency ? formatMoney(data.currentEstimatedValue, data.currentPriceCurrency) : "Price unavailable"
				})
			]
		}),
		/* @__PURE__ */ jsxs(Card, {
			className: "mt-4 space-y-2",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-xs uppercase tracking-wider text-subtle",
					children: "Market comparison"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: "Estimated market-value difference is not profit or loss. It does not mean physical gold has been purchased or that mahar has been paid."
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-lg tabular-nums text-fg",
					children: data.estimatedValueDifference != null && data.currentPriceCurrency ? formatMoney(data.estimatedValueDifference, data.currentPriceCurrency) : "—"
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-xs text-subtle",
					children: [
						"Current 24K price",
						" ",
						data.currentPricePerGram != null && data.currentPriceCurrency ? `${formatMoney(data.currentPricePerGram, data.currentPriceCurrency)} / g` : "unavailable",
						data.currentPriceProvider ? ` · ${data.currentPriceProvider}` : ""
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-xs text-subtle",
					children: [
						"Checked by Mahar Tracker: ",
						formatDateTime(data.currentPriceCheckedAt),
						data.currentPriceAsOf ? ` · Provider data: ${formatDateTime(data.currentPriceAsOf)}` : ""
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-xs text-subtle",
					children: [
						"Average effective price paid",
						" ",
						data.averageEffectivePricePerGram != null ? `${formatMoney(data.averageEffectivePricePerGram, data.preferredCurrency)} / g` : "—"
					]
				})
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-4 grid grid-cols-2 gap-3",
			children: [/* @__PURE__ */ jsx(Stat, {
				label: "Mahar entries",
				value: String(data.entryCount)
			}), /* @__PURE__ */ jsx(Stat, {
				label: "Most recent entry",
				value: data.mostRecentDeposit ? `${formatDate(data.mostRecentDeposit.depositDate)} · ${formatGrams(data.mostRecentDeposit.grams)}` : "None yet"
			})]
		}),
		/* @__PURE__ */ jsx(Button, {
			asChild: true,
			className: "mt-8 w-full",
			children: /* @__PURE__ */ jsx(Link, {
				to: "/entries/new",
				children: "Record mahar savings"
			})
		}),
		/* @__PURE__ */ jsxs("p", {
			className: "mt-4 text-center text-xs text-subtle",
			children: [
				"Progress ",
				formatPercent(data.completionPercent),
				" complete toward ",
				data.targetUkhiya,
				" ukhiya mahar."
			]
		})
	] });
}
function Stat({ label, value }) {
	return /* @__PURE__ */ jsxs(Card, {
		className: "space-y-1",
		children: [/* @__PURE__ */ jsx("p", {
			className: "text-xs text-subtle",
			children: label
		}), /* @__PURE__ */ jsx("p", {
			className: "text-sm font-medium leading-snug text-fg tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { Home as component };
