//#region src/lib/gold/constants.ts
/** Default traditional-unit assumptions. Override per goal, never scatter literals. */
var DEFAULT_GRAMS_PER_TOLA = 11.6638;
/** ISO troy ounce used when a provider quotes XAU per ounce. */
var TROY_OUNCE_GRAMS = 31.1034768;
var PERMITTED_UKHIYA = [
	9,
	10,
	11
];
var SUPPORTED_CURRENCIES = [
	"INR",
	"USD",
	"EUR",
	"GBP",
	"AED",
	"BDT",
	"PKR",
	"SAR",
	"AUD",
	"CAD",
	"SGD",
	"CHF"
];
var MILESTONES = [
	10,
	25,
	50,
	75,
	100
];
var DEFAULT_PROVIDER_PRIORITY = [
	"metals-live",
	"metals-api",
	"swissquote",
	"gold-api-com",
	"coinbase",
	"goldapi-io"
];
var GOLD_PRICE_UNITS = [
	"per_gram",
	"per_tola",
	"per_troy_ounce"
];
//#endregion
export { PERMITTED_UKHIYA as a, MILESTONES as i, DEFAULT_PROVIDER_PRIORITY as n, SUPPORTED_CURRENCIES as o, GOLD_PRICE_UNITS as r, TROY_OUNCE_GRAMS as s, DEFAULT_GRAMS_PER_TOLA as t };
