import { c as UKHIYA_MAHAR, i as MAHAR_ORIGIN, l as ZAR_E_SURKH_ORIGIN, s as TRACKER_DISCLAIMER, u as maharTargetLabel } from "./copy-C__m_4Lq.js";
import { a as PERMITTED_UKHIYA, o as SUPPORTED_CURRENCIES } from "./constants-7dvr3BEP.js";
import { a as unitAssumptionsText } from "./units-C4Cl_0jQ.js";
import { i as useCurrentUserState, o as signOut } from "./skeleton-PUJRkxBI.js";
import { a as changeGoalFn, b as RedirectToSignIn, c as deleteAccountFn, d as getBootstrap, h as listProvidersFn, n as AppShell, t as Card, u as exportDataFn, y as updatePreferencesFn } from "./card-EbVh7PYj.js";
import { t as Button } from "./button-DIjsGSUW.js";
import { t as Input } from "./input-BmcVG4ky.js";
import { t as Label } from "./label-CQF5E2iB.js";
import { r as formatGrams } from "./format-sxZDAiTI.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
//#region src/routes/settings.tsx?tsr-split=component
function SettingsPage() {
	const { user, isPending } = useCurrentUserState();
	const qc = useQueryClient();
	const bootstrap = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap(),
		enabled: !!user
	});
	const providers = useQuery({
		queryKey: ["providers"],
		queryFn: () => listProvidersFn(),
		enabled: !!user
	});
	const [ukhiya, setUkhiya] = useState(9);
	const [phrase, setPhrase] = useState("");
	const [deletePhrase, setDeletePhrase] = useState("");
	const prefs = useMutation({
		mutationFn: (data) => updatePreferencesFn({ data }),
		onSuccess: () => {
			qc.invalidateQueries();
			toast.success("Preferences saved");
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save")
	});
	const change = useMutation({
		mutationFn: () => changeGoalFn({ data: {
			ukhiyaCount: ukhiya,
			confirmPhrase: phrase
		} }),
		onSuccess: () => {
			qc.invalidateQueries();
			setPhrase("");
			toast.success("Mahar target updated");
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not change mahar")
	});
	const remove = useMutation({
		mutationFn: () => deleteAccountFn({ data: { confirmPhrase: deletePhrase } }),
		onSuccess: () => {
			toast.success("Account data deleted");
			signOut("/");
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Could not delete")
	});
	async function onExport() {
		try {
			const data = await exportDataFn();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `ukhiya-mahar-export-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Export failed");
		}
	}
	if (isPending) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", { className: "h-40 animate-pulse rounded-xl bg-elevated" }) });
	if (!user) return /* @__PURE__ */ jsx(RedirectToSignIn, {});
	const goal = bootstrap.data?.goal;
	const profile = bootstrap.data?.profile;
	const settings = bootstrap.data?.settings;
	return /* @__PURE__ */ jsxs(AppShell, { children: [
		/* @__PURE__ */ jsx("h1", {
			className: "font-display text-3xl text-fg",
			children: "Settings"
		}),
		/* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted",
			children: "Ukhiya tracks mahar as 24K gold-equivalent. Changing a target recalculates remaining grams against the same completed gold-equivalent."
		}),
		/* @__PURE__ */ jsxs(Card, {
			className: "mt-6 space-y-3 text-sm leading-relaxed text-muted",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "font-medium text-fg",
					children: "About this mahar tracker"
				}),
				/* @__PURE__ */ jsx("p", { children: MAHAR_ORIGIN }),
				/* @__PURE__ */ jsx("p", { children: ZAR_E_SURKH_ORIGIN }),
				/* @__PURE__ */ jsx("p", { children: TRACKER_DISCLAIMER })
			]
		}),
		goal && /* @__PURE__ */ jsxs(Card, {
			className: "mt-4 space-y-2",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-xs uppercase tracking-wider text-subtle",
					children: "Current mahar"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "font-display text-2xl text-fg",
					children: maharTargetLabel(goal.ukhiyaCount)
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted",
					children: [
						formatGrams(goal.targetGrams),
						" of ",
						"Zar-e-surkh-e-khalis (24K)"
					]
				}),
				UKHIYA_MAHAR[goal.ukhiyaCount] && /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: UKHIYA_MAHAR[goal.ukhiyaCount].who
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-subtle",
					children: unitAssumptionsText({
						gramsPerTola: goal.gramsPerTola,
						tolasPerUkhiya: goal.tolasPerUkhiya
					})
				})
			]
		}),
		/* @__PURE__ */ jsxs(Card, {
			className: "mt-4 space-y-3",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "font-medium text-fg",
					children: "Change mahar target"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: "Completed grams on existing entries stay as they were recorded. Remaining grams and the completion percentage are recalculated against the new mahar. Type CHANGE TARGET to confirm."
				}),
				/* @__PURE__ */ jsx("select", {
					value: ukhiya,
					onChange: (e) => setUkhiya(Number(e.target.value)),
					className: "h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg",
					children: PERMITTED_UKHIYA.map((n) => /* @__PURE__ */ jsxs("option", {
						value: n,
						children: [
							n,
							" ukhiya · ",
							UKHIYA_MAHAR[n].whoShort
						]
					}, n))
				}),
				/* @__PURE__ */ jsx(Label, {
					htmlFor: "chg",
					children: "Confirmation"
				}),
				/* @__PURE__ */ jsx(Input, {
					id: "chg",
					value: phrase,
					onChange: (e) => setPhrase(e.target.value),
					placeholder: "CHANGE TARGET"
				}),
				/* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "secondary",
					disabled: change.isPending,
					onClick: () => change.mutate(),
					children: "Update mahar"
				})
			]
		}),
		profile && /* @__PURE__ */ jsxs(Card, {
			className: "mt-4 space-y-3",
			children: [/* @__PURE__ */ jsx("p", {
				className: "font-medium text-fg",
				children: "Preferred currency"
			}), /* @__PURE__ */ jsx("select", {
				value: profile.preferredCurrency,
				onChange: (e) => prefs.mutate({ preferredCurrency: e.target.value }),
				className: "h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg",
				children: SUPPORTED_CURRENCIES.map((c) => /* @__PURE__ */ jsx("option", {
					value: c,
					children: c
				}, c))
			})]
		}),
		/* @__PURE__ */ jsxs(Card, {
			className: "mt-4 space-y-3",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "font-medium text-fg",
					children: "Preferred price provider"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-xs text-muted",
					children: "If the selected provider fails, the next available provider is used automatically. The mahar entry still records which source supplied the 24K price."
				}),
				/* @__PURE__ */ jsxs("select", {
					value: profile?.selectedProvider ?? "",
					onChange: (e) => prefs.mutate({ selectedProvider: e.target.value || null }),
					className: "h-11 w-full rounded-md border border-border bg-elevated px-3 text-fg",
					children: [/* @__PURE__ */ jsx("option", {
						value: "",
						children: "Automatic failover"
					}), (providers.data ?? []).map((p) => /* @__PURE__ */ jsxs("option", {
						value: p.name,
						disabled: !p.configured,
						children: [
							p.name,
							!p.configured ? " (needs server key)" : "",
							p.historical ? " · historical" : ""
						]
					}, p.name))]
				})
			]
		}),
		settings && /* @__PURE__ */ jsxs(Card, {
			className: "mt-4 space-y-2 text-sm text-muted",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "font-medium text-fg",
					children: "Product configuration"
				}),
				/* @__PURE__ */ jsxs("p", { children: ["Manual price fallback: ", settings.manualPriceFallbackEnabled ? "enabled" : "disabled"] }),
				/* @__PURE__ */ jsxs("p", { children: ["Default provider order: ", settings.providerPriority.join(" → ")] }),
				/* @__PURE__ */ jsxs("p", { children: ["Permitted mahar: ", settings.permittedUkhiya.map((n) => `${n} ukhiya`).join(", ")] })
			]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mt-6 space-y-3",
			children: [/* @__PURE__ */ jsx(Button, {
				type: "button",
				variant: "secondary",
				className: "w-full",
				onClick: onExport,
				children: "Export my mahar records"
			}), /* @__PURE__ */ jsx(Button, {
				type: "button",
				variant: "ghost",
				className: "w-full",
				onClick: () => signOut("/"),
				children: "Sign out"
			})]
		}),
		/* @__PURE__ */ jsxs(Card, {
			className: "mt-8 space-y-3",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "font-medium text-danger",
					children: "Delete account"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted",
					children: "Removes your profile, mahar target, and savings entries from this app. Type DELETE ACCOUNT."
				}),
				/* @__PURE__ */ jsx(Input, {
					value: deletePhrase,
					onChange: (e) => setDeletePhrase(e.target.value),
					placeholder: "DELETE ACCOUNT"
				}),
				/* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "danger",
					className: "w-full",
					disabled: deletePhrase !== "DELETE ACCOUNT" || remove.isPending,
					onClick: () => remove.mutate(),
					children: "Delete all my data"
				})
			]
		})
	] });
}
//#endregion
export { SettingsPage as component };
