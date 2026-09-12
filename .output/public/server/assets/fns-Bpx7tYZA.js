import { n as createServerFn, r as TSS_SERVER_FUNCTION } from "../server.js";
import { t as authMiddleware } from "./middleware-cYsgZC9L.js";
//#region node_modules/@tanstack/start-server-core/dist/esm/createServerRpc.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region src/lib/gold/fns.ts?tss-serverfn-split
var getBootstrap_createServerFn_handler = createServerRpc({
	id: "b2d720f495f421d664a03abe68b464d95e5a91d1e0062687c464549baf97e579",
	name: "getBootstrap",
	filename: "src/lib/gold/fns.ts"
}, (opts) => getBootstrap.__executeServer(opts));
var getBootstrap = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getBootstrap_createServerFn_handler, async ({ context }) => {
	const { ensureProfile, getActiveGoal } = await import("./entries.server-B3ZahDnT.js");
	const { loadSettings } = await import("./quote.server-Cm9rcuR3.js");
	const [profile, goal, settings] = await Promise.all([
		ensureProfile(context.userId),
		getActiveGoal(context.userId),
		loadSettings()
	]);
	return {
		profile,
		goal,
		settings
	};
});
var getDashboardFn_createServerFn_handler = createServerRpc({
	id: "eb9fc1253c004cbff6d863ff85f877bc694b527eae103aad1a4b9ecd245f1c97",
	name: "getDashboardFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => getDashboardFn.__executeServer(opts));
var getDashboardFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getDashboardFn_createServerFn_handler, async ({ context }) => {
	const { loadDashboard } = await import("./dashboard.server-DcAYCmCL.js");
	return loadDashboard(context.userId);
});
var completeOnboardingFn_createServerFn_handler = createServerRpc({
	id: "47f38510a84f4c8829ead6eeb058682f1833c905dd6e9db147518a0f67186abc",
	name: "completeOnboardingFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => completeOnboardingFn.__executeServer(opts));
var completeOnboardingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(completeOnboardingFn_createServerFn_handler, async ({ context, data }) => {
	const { completeOnboarding } = await import("./entries.server-B3ZahDnT.js");
	return completeOnboarding({
		userId: context.userId,
		...data
	});
});
var quotePriceFn_createServerFn_handler = createServerRpc({
	id: "c0bdcfe901427e48ef49e76bb0bac518e52393dc3f0a912f3f5dd3bf8f039c4a",
	name: "quotePriceFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => quotePriceFn.__executeServer(opts));
var quotePriceFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(quotePriceFn_createServerFn_handler, async ({ context, data }) => {
	const { ensureProfile } = await import("./entries.server-B3ZahDnT.js");
	const { quoteGoldPrice } = await import("./quote.server-Cm9rcuR3.js");
	const profile = await ensureProfile(context.userId);
	return quoteGoldPrice({
		date: data.date,
		currency: data.currency,
		preferredProvider: profile.selectedProvider
	});
});
var quoteManualFn_createServerFn_handler = createServerRpc({
	id: "36fb19f08c3b512c62eaff5e275a4f49d9691decd32a46321e09098087f7517a",
	name: "quoteManualFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => quoteManualFn.__executeServer(opts));
var quoteManualFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(quoteManualFn_createServerFn_handler, async ({ data }) => {
	const { quoteFromManual } = await import("./quote.server-Cm9rcuR3.js");
	return quoteFromManual(data);
});
var createEntryFn_createServerFn_handler = createServerRpc({
	id: "703daf5a7e21ffb47f2ec9fff8c7905e796900b2087171860152c22b82d23986",
	name: "createEntryFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => createEntryFn.__executeServer(opts));
var createEntryFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createEntryFn_createServerFn_handler, async ({ context, data }) => {
	const { createEntry } = await import("./entries.server-B3ZahDnT.js");
	return createEntry({
		userId: context.userId,
		...data
	});
});
var listEntriesFn_createServerFn_handler = createServerRpc({
	id: "2cf354b2d9cacfb469eb63b7df5c4fa5306bf2eb44542d1feb7b5526f53d5108",
	name: "listEntriesFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => listEntriesFn.__executeServer(opts));
var listEntriesFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d ?? {}).handler(listEntriesFn_createServerFn_handler, async ({ context, data }) => {
	const { listEntries, getActiveGoal, ensureProfile } = await import("./entries.server-B3ZahDnT.js");
	const { quoteGoldPrice } = await import("./quote.server-Cm9rcuR3.js");
	const sort = data.sort ?? "newest";
	const [entries, goal, profile] = await Promise.all([
		listEntries(context.userId, sort),
		getActiveGoal(context.userId),
		ensureProfile(context.userId)
	]);
	let currentPrice = null;
	const today = /* @__PURE__ */ new Date();
	const q = await quoteGoldPrice({
		date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
		currency: profile.preferredCurrency,
		preferredProvider: profile.selectedProvider
	});
	if (q.ok && q.quote.pricePerGramInDepositCurrency > 0) currentPrice = q.quote.pricePerGramInDepositCurrency;
	return {
		entries,
		goal,
		currentPrice,
		preferredCurrency: profile.preferredCurrency
	};
});
var getEntryFn_createServerFn_handler = createServerRpc({
	id: "c857ae254c06f5757882d43aeae9b72aa58f7e9bb2b943d8117d58eabd46c7d4",
	name: "getEntryFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => getEntryFn.__executeServer(opts));
var getEntryFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(getEntryFn_createServerFn_handler, async ({ context, data }) => {
	const { getEntry, getActiveGoal, ensureProfile } = await import("./entries.server-B3ZahDnT.js");
	const { quoteGoldPrice } = await import("./quote.server-Cm9rcuR3.js");
	const entry = await getEntry(context.userId, data.id);
	if (!entry) return {
		entry: null,
		goal: null,
		currentValue: null
	};
	const [goal, profile] = await Promise.all([getActiveGoal(context.userId), ensureProfile(context.userId)]);
	const today = /* @__PURE__ */ new Date();
	const q = await quoteGoldPrice({
		date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
		currency: entry.depositedCurrency,
		preferredProvider: profile.selectedProvider
	});
	return {
		entry,
		goal,
		currentValue: q.ok && entry.status === "posted" ? entry.completedGrams * q.quote.pricePerGramInDepositCurrency : null
	};
});
var updateEntryFn_createServerFn_handler = createServerRpc({
	id: "8ecd0edb3ee57c1d77cc1e80d8f3a7025a0244310c254888f3e372a2f41d6ea8",
	name: "updateEntryFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => updateEntryFn.__executeServer(opts));
var updateEntryFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(updateEntryFn_createServerFn_handler, async ({ context, data }) => {
	const { updateEntry } = await import("./entries.server-B3ZahDnT.js");
	return updateEntry({
		userId: context.userId,
		...data
	});
});
var deleteEntryFn_createServerFn_handler = createServerRpc({
	id: "1a82e72951c5d276fca1fe4c524004291d05be26d74515741f4c30028b6efee9",
	name: "deleteEntryFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => deleteEntryFn.__executeServer(opts));
var deleteEntryFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(deleteEntryFn_createServerFn_handler, async ({ context, data }) => {
	const { deleteEntry } = await import("./entries.server-B3ZahDnT.js");
	await deleteEntry({
		userId: context.userId,
		...data
	});
	return { ok: true };
});
var changeGoalFn_createServerFn_handler = createServerRpc({
	id: "1679d39106bffeaaaf833ddc1c99f1fb3335d83af2d093fdb798db1a58d66a52",
	name: "changeGoalFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => changeGoalFn.__executeServer(opts));
var changeGoalFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(changeGoalFn_createServerFn_handler, async ({ context, data }) => {
	const { changeGoal } = await import("./entries.server-B3ZahDnT.js");
	return changeGoal({
		userId: context.userId,
		...data
	});
});
var updatePreferencesFn_createServerFn_handler = createServerRpc({
	id: "416ca273b989852ad69dca9d03facf85f5227fd3a7b79b62f5cea42f0ef82814",
	name: "updatePreferencesFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => updatePreferencesFn.__executeServer(opts));
var updatePreferencesFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(updatePreferencesFn_createServerFn_handler, async ({ context, data }) => {
	const { updatePreferences } = await import("./entries.server-B3ZahDnT.js");
	return updatePreferences({
		userId: context.userId,
		...data
	});
});
var exportDataFn_createServerFn_handler = createServerRpc({
	id: "c5a64f3a8f0a839908e8c2b6cad3f776455c65ae1f280a006e3f95c9a05c0270",
	name: "exportDataFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => exportDataFn.__executeServer(opts));
var exportDataFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(exportDataFn_createServerFn_handler, async ({ context }) => {
	const { exportUserData } = await import("./entries.server-B3ZahDnT.js");
	return exportUserData(context.userId);
});
var deleteAccountFn_createServerFn_handler = createServerRpc({
	id: "6052831d80b1965a95d02186f3392d59460918150b63b09392c745497222a0ab",
	name: "deleteAccountFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => deleteAccountFn.__executeServer(opts));
var deleteAccountFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(deleteAccountFn_createServerFn_handler, async ({ context, data }) => {
	const { deleteAccount } = await import("./entries.server-B3ZahDnT.js");
	await deleteAccount(context.userId, data.confirmPhrase);
	return { ok: true };
});
var listProvidersFn_createServerFn_handler = createServerRpc({
	id: "652d534155cf5b18836a805b28206a1b35e48a8707f47bab4ecda37d7864b697",
	name: "listProvidersFn",
	filename: "src/lib/gold/fns.ts"
}, (opts) => listProvidersFn.__executeServer(opts));
var listProvidersFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listProvidersFn_createServerFn_handler, async () => {
	const { listProviders } = await import("./registry-DoZ3CkLn.js").then((n) => n.n);
	return listProviders().map((p) => ({
		name: p.getProviderName(),
		configured: p.isConfigured(),
		historical: p.supportsHistorical(),
		requiresSecret: p.requiresSecret()
	}));
});
//#endregion
export { changeGoalFn_createServerFn_handler, completeOnboardingFn_createServerFn_handler, createEntryFn_createServerFn_handler, deleteAccountFn_createServerFn_handler, deleteEntryFn_createServerFn_handler, exportDataFn_createServerFn_handler, getBootstrap_createServerFn_handler, getDashboardFn_createServerFn_handler, getEntryFn_createServerFn_handler, listEntriesFn_createServerFn_handler, listProvidersFn_createServerFn_handler, quoteManualFn_createServerFn_handler, quotePriceFn_createServerFn_handler, updateEntryFn_createServerFn_handler, updatePreferencesFn_createServerFn_handler };
