import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { a as getRequest } from "../server.js";
import { n as APP_TAGLINE, t as APP_NAME } from "./copy-C__m_4Lq.js";
import { t as getSupabaseUser } from "./server-BdZ2MyQC.js";
import { n as supabase } from "./client-CXtn8Emf.js";
import { useEffect, useState } from "react";
import { HeadContent, Outlet, Scripts, createFileRoute, createRootRoute, createRouter, lazyRouteComponent } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { TriangleAlert } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { App } from "@capacitor/app";
//#region src/lib/error-component.tsx
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ jsxs("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ jsx(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
//#endregion
//#region src/lib/auth/provider.tsx
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	useEffect(() => {
		let listener;
		App.addListener("appUrlOpen", ({ url }) => {
			const code = new URL(url).searchParams.get("code");
			if (code) supabase.auth.exchangeCodeForSession(code);
		}).then((handle) => {
			listener = handle;
		});
		return () => {
			listener?.remove();
		};
	}, []);
	return /* @__PURE__ */ jsx(Fragment, { children });
}
//#endregion
//#region src/styles.css?url
var styles_default = "/assets/styles-LYjRaQb3.css";
//#endregion
//#region src/routes/__root.tsx
var Route$14 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: APP_TAGLINE
			},
			{
				name: "theme-color",
				content: "#0e0d0b"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;1,400&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&display=swap"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: {
		staleTime: 3e4,
		retry: 1,
		refetchOnWindowFocus: false
	} } }));
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [/* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsxs(QueryClientProvider, {
			client: queryClient,
			children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(Toaster, {
				theme: "dark",
				position: "top-center",
				toastOptions: { style: {
					background: "#1f1c18",
					color: "#f4efe4",
					border: "1px solid #2c2823"
				} }
			})]
		}) }), /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter$7 = () => import("./routes-BDliQNNp.js");
var Route$13 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
//#endregion
//#region src/routes/download.tsx
var $$splitComponentImporter$6 = () => import("./download-Bap57hSU.js");
var Route$12 = createFileRoute("/download")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
//#endregion
//#region src/routes/history.tsx
var $$splitComponentImporter$5 = () => import("./history-DCrKROhY.js");
var Route$11 = createFileRoute("/history")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
//#endregion
//#region src/routes/login.tsx
var $$splitComponentImporter$4 = () => import("./login-CZ3um893.js");
var Route$10 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
//#endregion
//#region src/routes/onboarding.tsx
var $$splitComponentImporter$3 = () => import("./onboarding-JvQJZJwo.js");
var Route$9 = createFileRoute("/onboarding")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
//#endregion
//#region src/routes/settings.tsx
var $$splitComponentImporter$2 = () => import("./settings-BUOm9Vco.js");
var Route$8 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
//#endregion
//#region src/routes/entries.$id.tsx
var $$splitComponentImporter$1 = () => import("./entries._id-BWF5f67-.js");
var Route$7 = createFileRoute("/entries/$id")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
//#endregion
//#region src/routes/entries.new.tsx
var $$splitComponentImporter = () => import("./entries.new-BBWk6Bpj.js");
var Route$6 = createFileRoute("/entries/new")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
//#endregion
//#region src/lib/gold/rest.server.ts
var UnauthorizedError = class extends Error {};
async function requireRestUser() {
	const token = getRequest()?.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
	const user = token ? await getSupabaseUser(token) : null;
	if (!user) throw new UnauthorizedError();
	return user;
}
function json(data, status = 200) {
	return Response.json(data, { status });
}
function restError(err) {
	if (err instanceof UnauthorizedError) return json({ error: "Unauthorized" }, 401);
	return json({ error: err instanceof Error ? err.message : "Request failed" }, 400);
}
//#endregion
//#region src/routes/api/v1/dashboard.ts
var Route$5 = createFileRoute("/api/v1/dashboard")({ server: { handlers: { GET: async () => {
	try {
		const user = await requireRestUser();
		const { loadDashboard } = await import("./dashboard.server-DcAYCmCL.js");
		return json(await loadDashboard(user.id));
	} catch (err) {
		return restError(err);
	}
} } } });
//#endregion
//#region src/routes/api/v1/entries.ts
var Route$4 = createFileRoute("/api/v1/entries")({ server: { handlers: {
	GET: async ({ request }) => {
		try {
			const user = await requireRestUser();
			const sort = new URL(request.url).searchParams.get("sort") ?? "newest";
			const { listEntries } = await import("./entries.server-B3ZahDnT.js");
			const safe = [
				"newest",
				"oldest",
				"largest_deposit",
				"largest_grams"
			].includes(sort) ? sort : "newest";
			return json({ entries: await listEntries(user.id, safe) });
		} catch (err) {
			return restError(err);
		}
	},
	POST: async ({ request }) => {
		try {
			const user = await requireRestUser();
			const body = await request.json();
			const { createEntry } = await import("./entries.server-B3ZahDnT.js");
			return json(await createEntry({
				userId: user.id,
				...body
			}), 201);
		} catch (err) {
			return restError(err);
		}
	}
} } });
//#endregion
//#region src/routes/api/v1/export.ts
var Route$3 = createFileRoute("/api/v1/export")({ server: { handlers: { GET: async () => {
	try {
		const user = await requireRestUser();
		const { exportUserData } = await import("./entries.server-B3ZahDnT.js");
		return json(await exportUserData(user.id));
	} catch (err) {
		return restError(err);
	}
} } } });
//#endregion
//#region src/routes/api/v1/health.ts
var Route$2 = createFileRoute("/api/v1/health")({ server: { handlers: { GET: () => Response.json({
	ok: true,
	name: APP_NAME,
	version: 1,
	contract: {
		dashboard: "GET /api/v1/dashboard",
		entries: "GET|POST /api/v1/entries",
		entry: "GET|PATCH|DELETE /api/v1/entries/:id",
		quote: "POST /api/v1/quote",
		me: "GET /api/v1/me",
		export: "GET /api/v1/export"
	}
}) } } });
//#endregion
//#region src/routes/api/v1/me.ts
var Route$1 = createFileRoute("/api/v1/me")({ server: { handlers: { GET: async () => {
	try {
		const user = await requireRestUser();
		const { ensureProfile, getActiveGoal } = await import("./entries.server-B3ZahDnT.js");
		const [profile, goal] = await Promise.all([ensureProfile(user.id), getActiveGoal(user.id)]);
		return json({
			user,
			profile,
			goal
		});
	} catch (err) {
		return restError(err);
	}
} } } });
//#endregion
//#region src/routes/api/v1/quote.ts
var Route = createFileRoute("/api/v1/quote")({ server: { handlers: { POST: async ({ request }) => {
	try {
		const user = await requireRestUser();
		const body = await request.json();
		const { ensureProfile } = await import("./entries.server-B3ZahDnT.js");
		const { quoteGoldPrice } = await import("./quote.server-Cm9rcuR3.js");
		const profile = await ensureProfile(user.id);
		return json(await quoteGoldPrice({
			date: String(body.date),
			currency: String(body.currency ?? profile.preferredCurrency),
			preferredProvider: profile.selectedProvider
		}));
	} catch (err) {
		return restError(err);
	}
} } } });
//#endregion
//#region src/routeTree.gen.ts
var rootRouteChildren = {
	IndexRoute: Route$13.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$14
	}),
	DownloadRoute: Route$12.update({
		id: "/download",
		path: "/download",
		getParentRoute: () => Route$14
	}),
	HistoryRoute: Route$11.update({
		id: "/history",
		path: "/history",
		getParentRoute: () => Route$14
	}),
	LoginRoute: Route$10.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$14
	}),
	OnboardingRoute: Route$9.update({
		id: "/onboarding",
		path: "/onboarding",
		getParentRoute: () => Route$14
	}),
	SettingsRoute: Route$8.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$14
	}),
	EntriesIdRoute: Route$7.update({
		id: "/entries/$id",
		path: "/entries/$id",
		getParentRoute: () => Route$14
	}),
	EntriesNewRoute: Route$6.update({
		id: "/entries/new",
		path: "/entries/new",
		getParentRoute: () => Route$14
	}),
	ApiV1DashboardRoute: Route$5.update({
		id: "/api/v1/dashboard",
		path: "/api/v1/dashboard",
		getParentRoute: () => Route$14
	}),
	ApiV1EntriesRoute: Route$4.update({
		id: "/api/v1/entries",
		path: "/api/v1/entries",
		getParentRoute: () => Route$14
	}),
	ApiV1ExportRoute: Route$3.update({
		id: "/api/v1/export",
		path: "/api/v1/export",
		getParentRoute: () => Route$14
	}),
	ApiV1HealthRoute: Route$2.update({
		id: "/api/v1/health",
		path: "/api/v1/health",
		getParentRoute: () => Route$14
	}),
	ApiV1MeRoute: Route$1.update({
		id: "/api/v1/me",
		path: "/api/v1/me",
		getParentRoute: () => Route$14
	}),
	ApiV1QuoteRoute: Route.update({
		id: "/api/v1/quote",
		path: "/api/v1/quote",
		getParentRoute: () => Route$14
	})
};
var routeTree = Route$14._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getRouter, Route$7 as n, router_exports as t };
