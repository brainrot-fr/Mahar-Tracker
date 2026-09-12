import { s as TROY_OUNCE_GRAMS, t as DEFAULT_GRAMS_PER_TOLA } from "./constants-7dvr3BEP.js";
//#region src/lib/gold/units.ts
var DEFAULT_UNITS = {
	gramsPerTola: DEFAULT_GRAMS_PER_TOLA,
	tolasPerUkhiya: 11,
	troyOunceGrams: TROY_OUNCE_GRAMS
};
function roundTo(value, places) {
	if (!Number.isFinite(value)) return value;
	const f = 10 ** places;
	return Math.round((value + Number.EPSILON) * f) / f;
}
function storeGrams(value) {
	return roundTo(value, 8);
}
function targetGramsFor(ukhiyaCount, units = DEFAULT_UNITS) {
	if (ukhiyaCount <= 0) throw new Error("Mahar ukhiya count must be greater than zero.");
	if (units.gramsPerTola <= 0) throw new Error("Grams per tola must be greater than zero.");
	if (units.tolasPerUkhiya <= 0) throw new Error("Tolas per ukhiya must be greater than zero.");
	return storeGrams(ukhiyaCount * units.tolasPerUkhiya * units.gramsPerTola);
}
function normalizePricePerGram(rawPrice, unit, units = DEFAULT_UNITS) {
	if (!(rawPrice > 0)) throw new Error("Gold price must be greater than zero.");
	switch (unit) {
		case "per_gram": return rawPrice;
		case "per_tola":
			if (units.gramsPerTola <= 0) throw new Error("Grams per tola must be greater than zero.");
			return rawPrice / units.gramsPerTola;
		case "per_troy_ounce":
			if (units.troyOunceGrams <= 0) throw new Error("Troy ounce grams must be greater than zero.");
			return rawPrice / units.troyOunceGrams;
		default: throw new Error(`Unsupported gold-price unit: ${unit}`);
	}
}
function unitAssumptionsText(units) {
	const perUkhiya = storeGrams(units.tolasPerUkhiya * units.gramsPerTola);
	return `1 ukhiya = ${units.tolasPerUkhiya} tolas · 1 tola = ${units.gramsPerTola} grams · 1 ukhiya ≈ ${perUkhiya} grams`;
}
//#endregion
export { unitAssumptionsText as a, targetGramsFor as i, roundTo as n, storeGrams as r, normalizePricePerGram as t };
