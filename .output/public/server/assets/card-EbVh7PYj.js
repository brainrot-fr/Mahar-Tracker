import { i as getServerFnById, n as createServerFn, r as TSS_SERVER_FUNCTION } from "../server.js";
import { t as APP_NAME } from "./copy-C__m_4Lq.js";
import { t as authMiddleware } from "./middleware-cYsgZC9L.js";
import { i as useCurrentUserState, n as cn, o as signOut, r as useCurrentUser, t as Skeleton } from "./skeleton-PUJRkxBI.js";
import { useEffect, useState } from "react";
import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { Download, History, House, Plus, Settings } from "lucide-react";
//#region src/lib/auth/gates.tsx
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ jsx(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = useState(false);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ jsx("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ jsx("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ jsx("span", {
				className: "text-sm font-medium",
				children: label
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
//#endregion
//#region node_modules/@tanstack/start-server-core/dist/esm/createSsrRpc.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region src/lib/gold/fns.ts
var getBootstrap = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("b2d720f495f421d664a03abe68b464d95e5a91d1e0062687c464549baf97e579"));
var getDashboardFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("eb9fc1253c004cbff6d863ff85f877bc694b527eae103aad1a4b9ecd245f1c97"));
var completeOnboardingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("47f38510a84f4c8829ead6eeb058682f1833c905dd6e9db147518a0f67186abc"));
var quotePriceFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("c0bdcfe901427e48ef49e76bb0bac518e52393dc3f0a912f3f5dd3bf8f039c4a"));
var quoteManualFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("36fb19f08c3b512c62eaff5e275a4f49d9691decd32a46321e09098087f7517a"));
var createEntryFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("703daf5a7e21ffb47f2ec9fff8c7905e796900b2087171860152c22b82d23986"));
var listEntriesFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d ?? {}).handler(createSsrRpc("2cf354b2d9cacfb469eb63b7df5c4fa5306bf2eb44542d1feb7b5526f53d5108"));
var getEntryFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("c857ae254c06f5757882d43aeae9b72aa58f7e9bb2b943d8117d58eabd46c7d4"));
var updateEntryFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("8ecd0edb3ee57c1d77cc1e80d8f3a7025a0244310c254888f3e372a2f41d6ea8"));
var deleteEntryFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("1a82e72951c5d276fca1fe4c524004291d05be26d74515741f4c30028b6efee9"));
var changeGoalFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("1679d39106bffeaaaf833ddc1c99f1fb3335d83af2d093fdb798db1a58d66a52"));
var updatePreferencesFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("416ca273b989852ad69dca9d03facf85f5227fd3a7b79b62f5cea42f0ef82814"));
var exportDataFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c5a64f3a8f0a839908e8c2b6cad3f776455c65ae1f280a006e3f95c9a05c0270"));
var deleteAccountFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("6052831d80b1965a95d02186f3392d59460918150b63b09392c745497222a0ab"));
var listProvidersFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("652d534155cf5b18836a805b28206a1b35e48a8707f47bab4ecda37d7864b697"));
//#endregion
//#region src/lib/gold/offline.ts
function keyForUser(userId) {
	return `ukhiya.pending-entries.${userId}`;
}
function read(userId) {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(keyForUser(userId));
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function write(userId, rows) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(keyForUser(userId), JSON.stringify(rows));
}
function listPendingEntries(userId) {
	return read(userId);
}
function queuePendingEntry(userId, entry) {
	const rows = read(userId).filter((r) => r.idempotencyKey !== entry.idempotencyKey);
	rows.push(entry);
	write(userId, rows);
}
function removePendingEntry(userId, idempotencyKey) {
	write(userId, read(userId).filter((r) => r.idempotencyKey !== idempotencyKey));
}
//#endregion
//#region src/components/shell.tsx
var NAV = [
	{
		to: "/",
		label: "Home",
		icon: House,
		className: ""
	},
	{
		to: "/history",
		label: "History",
		icon: History,
		className: ""
	},
	{
		to: "/entries/new",
		label: "Add",
		icon: Plus,
		className: ""
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Settings,
		className: ""
	},
	{
		to: "/download",
		label: "Android",
		icon: Download,
		className: "hidden md:flex"
	}
];
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { user, isPending } = useCurrentUserState();
	useEffect(() => {
		if (!user || typeof window === "undefined") return;
		let cancelled = false;
		const sync = async () => {
			if (!navigator.onLine) return;
			for (const pending of listPendingEntries(user.id)) {
				if (cancelled) return;
				try {
					await createEntryFn({ data: {
						amount: pending.amount,
						currency: pending.currency,
						depositDate: pending.depositDate,
						note: pending.note,
						idempotencyKey: pending.idempotencyKey
					} });
					removePendingEntry(user.id, pending.idempotencyKey);
				} catch {}
			}
		};
		sync();
		window.addEventListener("online", sync);
		return () => {
			cancelled = true;
			window.removeEventListener("online", sync);
		};
	}, [user]);
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto flex min-h-dvh max-w-6xl flex-col bg-bg",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "font-display text-lg tracking-tight text-fg",
						children: APP_NAME
					}),
					/* @__PURE__ */ jsx("nav", {
						className: "hidden items-center gap-1 md:flex",
						children: NAV.map((item) => {
							const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
							const Icon = item.icon;
							return /* @__PURE__ */ jsxs(Link, {
								to: item.to,
								className: cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm", active ? "bg-elevated text-fg" : "text-muted hover:text-fg"),
								children: [/* @__PURE__ */ jsx(Icon, {
									className: "size-4",
									strokeWidth: active ? 2.2 : 1.7
								}), item.label]
							}, item.to);
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "max-w-[60%]",
						children: isPending ? /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-28" }) : user ? /* @__PURE__ */ jsx("div", {
							className: "[&_img]:size-8 [&_span]:truncate [&_span]:text-xs [&_span]:text-muted",
							children: /* @__PURE__ */ jsx(UserButton, {})
						}) : null
					})
				]
			}),
			/* @__PURE__ */ jsx("main", {
				className: "mx-auto w-full flex-1 px-4 pb-28 pt-4 md:max-w-5xl md:px-8 md:pb-10 md:pt-8",
				children
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 mx-auto max-w-6xl border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden",
				children: /* @__PURE__ */ jsx("ul", {
					className: "grid grid-cols-4",
					children: NAV.map((item) => {
						const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
						const Icon = item.icon;
						return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
							to: item.to,
							className: cn("flex min-h-14 flex-col items-center justify-center gap-1 text-xs", item.className, active ? "text-fg" : "text-subtle"),
							children: [/* @__PURE__ */ jsx(Icon, {
								className: "size-5",
								strokeWidth: active ? 2.2 : 1.7
							}), item.label]
						}) }, item.to);
					})
				})
			})
		]
	});
}
//#endregion
//#region src/components/ui/card.tsx
function Card({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn("rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]", className),
		...props
	});
}
//#endregion
export { quotePriceFn as _, changeGoalFn as a, RedirectToSignIn as b, deleteAccountFn as c, getBootstrap as d, getDashboardFn as f, quoteManualFn as g, listProvidersFn as h, queuePendingEntry as i, deleteEntryFn as l, listEntriesFn as m, AppShell as n, completeOnboardingFn as o, getEntryFn as p, listPendingEntries as r, createEntryFn as s, Card as t, exportDataFn as u, updateEntryFn as v, updatePreferencesFn as y };
