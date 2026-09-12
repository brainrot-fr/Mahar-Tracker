import { n as dashboardFromParts } from "./calc-D8o5dhu5.js";
import { loadSettings, quoteGoldPrice } from "./quote.server-Cm9rcuR3.js";
import { ensureProfile, getActiveGoal, listEntries } from "./entries.server-B3ZahDnT.js";
//#region src/lib/gold/dashboard.server.ts
async function loadDashboard(userId) {
	const profile = await ensureProfile(userId);
	const goal = await getActiveGoal(userId);
	if (!goal || !profile.onboardingCompletedAt) return {
		needsOnboarding: true,
		profile
	};
	const settings = await loadSettings();
	const entries = await listEntries(userId, "oldest");
	let currentPricePerGram = null;
	let currentPriceCurrency = null;
	let currentPriceProvider = null;
	let currentPriceAsOf = null;
	let currentPriceCheckedAt = null;
	const today = /* @__PURE__ */ new Date();
	const y = today.getFullYear();
	const m = String(today.getMonth() + 1).padStart(2, "0");
	const d = String(today.getDate()).padStart(2, "0");
	const quote = await quoteGoldPrice({
		date: `${y}-${m}-${d}`,
		currency: profile.preferredCurrency,
		preferredProvider: profile.selectedProvider
	});
	if (quote.ok) {
		currentPricePerGram = quote.quote.pricePerGramInDepositCurrency;
		currentPriceCurrency = profile.preferredCurrency;
		currentPriceProvider = quote.quote.providerName;
		currentPriceAsOf = quote.quote.priceSourceTimestamp ?? quote.quote.quoteDate;
		currentPriceCheckedAt = quote.quote.checkedAt;
	}
	return dashboardFromParts({
		goal,
		profile,
		settings,
		entries,
		currentPricePerGram,
		currentPriceCurrency,
		currentPriceProvider,
		currentPriceAsOf,
		currentPriceCheckedAt
	});
}
//#endregion
export { loadDashboard };
