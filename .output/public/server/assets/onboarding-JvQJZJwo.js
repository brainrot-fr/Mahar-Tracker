import { c as UKHIYA_MAHAR, i as MAHAR_ORIGIN, l as ZAR_E_SURKH_ORIGIN } from "./copy-C__m_4Lq.js";
import { a as PERMITTED_UKHIYA, o as SUPPORTED_CURRENCIES } from "./constants-7dvr3BEP.js";
import { a as unitAssumptionsText, i as targetGramsFor } from "./units-C4Cl_0jQ.js";
import { i as useCurrentUserState, n as cn } from "./skeleton-3wNi2Csj.js";
import { b as RedirectToSignIn, d as getBootstrap, n as AppShell, o as completeOnboardingFn, t as Card } from "./card-CiUyZpaK.js";
import { t as Button } from "./button-DZyOIz5_.js";
import { t as Label } from "./label-9TXvmfUC.js";
import { r as formatGrams } from "./format-sxZDAiTI.js";
import { useState } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
//#region src/routes/onboarding.tsx?tsr-split=component
function OnboardingPage() {
	const { user, isPending } = useCurrentUserState();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const bootstrap = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap(),
		enabled: !!user
	});
	const [step, setStep] = useState(0);
	const [ukhiya, setUkhiya] = useState(9);
	const [currency, setCurrency] = useState("INR");
	const [gramsPerTola, setGramsPerTola] = useState(11.6638);
	const [tolasPerUkhiya, setTolasPerUkhiya] = useState(11);
	const [accepted, setAccepted] = useState(false);
	const [error, setError] = useState(null);
	const mutation = useMutation({
		mutationFn: () => completeOnboardingFn({ data: {
			ukhiyaCount: ukhiya,
			currency,
			gramsPerTola,
			tolasPerUkhiya,
			acceptedDisclaimer: accepted
		} }),
		onSuccess: async () => {
			await Promise.all([queryClient.invalidateQueries({ queryKey: ["bootstrap"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]);
			await navigate({ to: "/" });
		},
		onError: (err) => setError(err instanceof Error ? err.message : "Could not save")
	});
	if (isPending) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", { className: "h-40 animate-pulse rounded-xl bg-elevated" }) });
	if (!user) return /* @__PURE__ */ jsx(RedirectToSignIn, {});
	if (bootstrap.data?.goal && bootstrap.data.profile.onboardingCompletedAt) return /* @__PURE__ */ jsx(Navigate, { to: "/" });
	const target = targetGramsFor(ukhiya, {
		gramsPerTola,
		tolasPerUkhiya
	});
	const assumptions = unitAssumptionsText({
		gramsPerTola,
		tolasPerUkhiya
	});
	const steps = [
		"Mahar",
		"Currency",
		"Units",
		"Confirm"
	];
	const selected = UKHIYA_MAHAR[ukhiya];
	return /* @__PURE__ */ jsxs(AppShell, { children: [
		/* @__PURE__ */ jsxs("p", {
			className: "text-xs uppercase tracking-wider text-subtle",
			children: ["Set up · ", steps[step]]
		}),
		/* @__PURE__ */ jsx("h1", {
			className: "mt-1 font-display text-3xl text-fg",
			children: "Choose your mahar"
		}),
		/* @__PURE__ */ jsx("p", {
			className: "mt-2 text-sm text-muted",
			children: "Version 1 uses one mahar target. You can change it later with an explicit confirmation."
		}),
		step === 0 && /* @__PURE__ */ jsxs("div", {
			className: "mt-6 space-y-3",
			children: [/* @__PURE__ */ jsx("p", {
				className: "text-sm leading-relaxed text-muted",
				children: MAHAR_ORIGIN
			}), PERMITTED_UKHIYA.map((n) => {
				const grams = targetGramsFor(n, {
					gramsPerTola,
					tolasPerUkhiya
				});
				const meta = UKHIYA_MAHAR[n];
				return /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => setUkhiya(n),
					className: cn("w-full rounded-xl border p-4 text-left", ukhiya === n ? "border-accent bg-elevated" : "border-border bg-surface"),
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "font-display text-xl text-fg",
							children: [n, " ukhiya"]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-fg",
							children: meta.who
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-muted",
							children: meta.teaching
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-xs text-subtle",
							children: [
								formatGrams(grams),
								" of ",
								"Zar-e-surkh-e-khalis (24K)"
							]
						})
					]
				}, n);
			})]
		}),
		step === 1 && /* @__PURE__ */ jsxs("div", {
			className: "mt-6 space-y-2",
			children: [
				/* @__PURE__ */ jsx(Label, {
					htmlFor: "currency",
					children: "Preferred currency"
				}),
				/* @__PURE__ */ jsx("select", {
					id: "currency",
					value: currency,
					onChange: (e) => setCurrency(e.target.value),
					className: "h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg",
					children: SUPPORTED_CURRENCIES.map((c) => /* @__PURE__ */ jsxs("option", {
						value: c,
						children: [c, c === "INR" ? " (default)" : ""]
					}, c))
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-subtle",
					children: "Money set aside toward mahar can still be converted using this currency’s 24K consumer buying price."
				})
			]
		}),
		step === 2 && /* @__PURE__ */ jsxs(Card, {
			className: "mt-6 space-y-4",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: "These conversion values are configurable. The mahar target in grams follows them exactly."
				}),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
					htmlFor: "gpt",
					children: "Grams per tola"
				}), /* @__PURE__ */ jsx("input", {
					id: "gpt",
					type: "number",
					min: 1e-4,
					step: "0.0001",
					value: gramsPerTola,
					onChange: (e) => setGramsPerTola(Number(e.target.value)),
					className: "mt-1 h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
				})] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
					htmlFor: "tpu",
					children: "Tolas per ukhiya"
				}), /* @__PURE__ */ jsx("input", {
					id: "tpu",
					type: "number",
					min: 1e-4,
					step: "0.0001",
					value: tolasPerUkhiya,
					onChange: (e) => setTolasPerUkhiya(Number(e.target.value)),
					className: "mt-1 h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg"
				})] }),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-fg",
					children: assumptions
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted",
					children: [
						ukhiya,
						" ukhiya mahar = ",
						formatGrams(target),
						" of ",
						"Zar-e-surkh-e-khalis (24K)"
					]
				})
			]
		}),
		step === 3 && /* @__PURE__ */ jsxs(Card, {
			className: "mt-6 space-y-4 text-sm leading-relaxed text-muted",
			children: [
				/* @__PURE__ */ jsxs("p", { children: [
					"Mahar: ",
					/* @__PURE__ */ jsxs("span", {
						className: "text-fg",
						children: [ukhiya, " ukhiya"]
					}),
					selected ? ` · ${selected.who}` : "",
					" · ",
					formatGrams(target),
					" of ",
					"Zar-e-surkh-e-khalis (24K)",
					"."
				] }),
				/* @__PURE__ */ jsx("p", { children: assumptions }),
				/* @__PURE__ */ jsx("p", { children: selected?.teaching }),
				/* @__PURE__ */ jsx("p", { children: ZAR_E_SURKH_ORIGIN }),
				/* @__PURE__ */ jsx("p", { children: "This app does not buy, sell, trade, transfer, or store gold. You record money set aside toward mahar. Figures are 24K gold-equivalent estimates from market prices, not proof of physical ownership and not an investment product." }),
				/* @__PURE__ */ jsxs("label", {
					className: "flex items-start gap-3 text-fg",
					children: [/* @__PURE__ */ jsx("input", {
						type: "checkbox",
						className: "mt-1 size-4",
						checked: accepted,
						onChange: (e) => setAccepted(e.target.checked)
					}), /* @__PURE__ */ jsx("span", { children: "I understand this app only tracks mahar savings as their 24K gold-equivalent (zar-e-surkh-e-khalis) and does not purchase gold for me." })]
				})
			]
		}),
		error && /* @__PURE__ */ jsx("p", {
			className: "mt-4 text-sm text-danger",
			children: error
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-8 flex gap-3",
			children: [step > 0 && /* @__PURE__ */ jsx(Button, {
				type: "button",
				variant: "secondary",
				className: "flex-1",
				onClick: () => setStep(step - 1),
				children: "Back"
			}), step < 3 ? /* @__PURE__ */ jsx(Button, {
				type: "button",
				className: "flex-1",
				onClick: () => setStep(step + 1),
				children: "Continue"
			}) : /* @__PURE__ */ jsx(Button, {
				type: "button",
				className: "flex-1",
				disabled: !accepted || mutation.isPending,
				onClick: () => mutation.mutate(),
				children: mutation.isPending ? "Saving…" : "Start tracking mahar"
			})]
		})
	] });
}
//#endregion
export { OnboardingPage as component };
