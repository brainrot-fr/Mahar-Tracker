import { n as roundTo, r as storeGrams } from "./units-C4Cl_0jQ.js";
//#region src/lib/gold/calc.ts
function goldEquivalentGrams(depositedAmount, pricePerGram) {
	if (!(depositedAmount > 0)) throw new Error("Deposit amount must be greater than zero.");
	if (!(pricePerGram > 0)) throw new Error("Gold price must be greater than zero.");
	return storeGrams(depositedAmount / pricePerGram);
}
function gramsFromQuote(depositedAmount, quote) {
	return goldEquivalentGrams(depositedAmount, quote.pricePerGramInDepositCurrency);
}
/** Preferred-currency units per 1 API-currency unit. */
function priceInDepositCurrency(pricePerGramApi, depositedPerApi) {
	if (!(pricePerGramApi > 0)) throw new Error("Gold price must be greater than zero.");
	if (!(depositedPerApi > 0)) throw new Error("Exchange rate must be greater than zero.");
	return roundTo(pricePerGramApi * depositedPerApi, 6);
}
function completionPercent(completedGrams, targetGrams) {
	if (!(targetGrams > 0)) return 0;
	if (completedGrams <= 0) return 0;
	return roundTo(Math.min(100, completedGrams / targetGrams * 100), 4);
}
function remainingGrams(completedGrams, targetGrams) {
	return storeGrams(Math.max(0, targetGrams - completedGrams));
}
function currentEstimatedValue(completedGrams, currentPricePerGram) {
	if (completedGrams < 0) throw new Error("Completed grams cannot be negative.");
	if (!(currentPricePerGram > 0)) throw new Error("Current gold price must be greater than zero.");
	return roundTo(completedGrams * currentPricePerGram, 6);
}
function averageEffectivePricePerGram(totalDeposited, completedGrams) {
	if (!(completedGrams > 0) || !(totalDeposited > 0)) return null;
	return roundTo(totalDeposited / completedGrams, 6);
}
function estimatedValueDifference(totalDeposited, estimatedValue) {
	return roundTo(estimatedValue - totalDeposited, 6);
}
function roundRate(rate) {
	return roundTo(rate, 12);
}
function buildRunningTotals(entries, targetGrams) {
	let running = 0;
	return entries.map((entry) => {
		running = storeGrams(running + (entry.status === "posted" ? entry.completedGrams : 0));
		return {
			runningGrams: running,
			runningCompletionPercent: completionPercent(running, targetGrams)
		};
	});
}
function sumPostedGrams(entries) {
	return storeGrams(entries.filter((e) => e.status === "posted" && !e.deletedAt).reduce((sum, e) => sum + e.completedGrams, 0));
}
function sumDepositedByCurrency(entries) {
	const map = /* @__PURE__ */ new Map();
	for (const e of entries) {
		if (e.status !== "posted" || e.deletedAt) continue;
		map.set(e.depositedCurrency, (map.get(e.depositedCurrency) ?? 0) + e.depositedAmount);
	}
	return [...map.entries()].map(([currency, amount]) => ({
		currency,
		amount: roundTo(amount, 6)
	})).sort((a, b) => b.amount - a.amount);
}
function dashboardFromParts(args) {
	const posted = args.entries.filter((e) => e.status === "posted" && !e.deletedAt);
	const completedGrams = sumPostedGrams(posted);
	const remaining = remainingGrams(completedGrams, args.goal.targetGrams);
	const percent = completionPercent(completedGrams, args.goal.targetGrams);
	const byCurrency = sumDepositedByCurrency(posted);
	const preferred = args.profile.preferredCurrency;
	const totalDepositedPreferred = byCurrency.find((b) => b.currency === preferred)?.amount ?? (byCurrency.length === 0 ? 0 : null);
	const estimated = args.currentPricePerGram != null && args.currentPricePerGram > 0 && args.currentPriceCurrency === preferred ? currentEstimatedValue(completedGrams, args.currentPricePerGram) : null;
	const difference = estimated != null && totalDepositedPreferred != null ? estimatedValueDifference(totalDepositedPreferred, estimated) : null;
	const avg = totalDepositedPreferred != null ? averageEffectivePricePerGram(totalDepositedPreferred, completedGrams) : null;
	const most = [...posted].sort((a, b) => {
		const d = b.depositDate.localeCompare(a.depositDate);
		if (d !== 0) return d;
		return b.createdAt.localeCompare(a.createdAt);
	})[0];
	return {
		goal: args.goal,
		profile: args.profile,
		settings: args.settings,
		targetUkhiya: args.goal.ukhiyaCount,
		targetGrams: args.goal.targetGrams,
		completedGrams,
		remainingGrams: remaining,
		completionPercent: percent,
		totalDepositedByCurrency: byCurrency,
		preferredCurrency: preferred,
		totalDepositedPreferred,
		currentPricePerGram: args.currentPricePerGram,
		currentPriceCurrency: args.currentPriceCurrency,
		currentPriceProvider: args.currentPriceProvider,
		currentPriceAsOf: args.currentPriceAsOf,
		currentPriceCheckedAt: args.currentPriceCheckedAt,
		currentEstimatedValue: estimated,
		estimatedValueDifference: difference,
		entryCount: posted.length,
		mostRecentDeposit: most ? {
			id: most.id,
			depositDate: most.depositDate,
			amount: most.depositedAmount,
			currency: most.depositedCurrency,
			grams: most.completedGrams
		} : null,
		averageEffectivePricePerGram: avg,
		milestones: [
			10,
			25,
			50,
			75,
			100
		].map((p) => ({
			percent: p,
			reached: percent >= p
		}))
	};
}
//#endregion
export { priceInDepositCurrency as a, gramsFromQuote as i, dashboardFromParts as n, roundRate as o, goldEquivalentGrams as r, buildRunningTotals as t };
