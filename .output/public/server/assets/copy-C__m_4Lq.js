//#region src/lib/gold/copy.ts
var APP_NAME = "Ukhiya";
var APP_TAGLINE = "Mahar tracker for zar-e-surkh-e-khalis";
var MAHDI_HONORIFIC = "Khalifatullah Hazrat Syed Muhammad Mahdi e Mau'ood A.S.";
var QASIM_HONORIFIC = "Hazrat Bandagi Miyan Syed Qasim Mujahid-e-giroh-e-Mahdavia R.H.";
var PURITY_TRADITION = "zar-e-surkh-e-khalis";
var PURITY_TRADITION_LABEL = "Zar-e-surkh-e-khalis (24K)";
var MAHAR_ORIGIN = `${MAHDI_HONORIFIC} taught that all Mahdavis will pay a mahar of 9 ukhiya; those of the Aal (descendants through daughters) will pay 10 ukhiya; and those of the Aulaad (his children) will pay 11 ukhiya.`;
var ZAR_E_SURKH_ORIGIN = `${PURITY_TRADITION} — gold in its purest form — was introduced during the period of, and by, ${QASIM_HONORIFIC}. This tracker uses the 24K consumer buying price so the equivalent stays khalis, without jewelry making charges.`;
var TRACKER_DISCLAIMER = "This app does not buy, sell, trade, transfer, or store gold. You record money set aside toward mahar. Figures are 24K gold-equivalent estimates from market prices, not proof of physical ownership and not an investment product.";
var ONBOARDING_ACCEPT_LABEL = "I understand this app only tracks mahar savings as their 24K gold-equivalent (zar-e-surkh-e-khalis) and does not purchase gold for me.";
var UKHIYA_MAHAR = {
	9: {
		who: "All Mahdavis",
		whoShort: "Mahdavis",
		teaching: "Mahdi A.S. taught that all Mahdavis will pay a mahar of 9 ukhiya."
	},
	10: {
		who: "Aal — descendants through daughters",
		whoShort: "Aal",
		teaching: "Those of the Aal of Mahdi A.S. (descendants through daughters) will pay a mahar of 10 ukhiya."
	},
	11: {
		who: "Aulaad — children of Mahdi A.S.",
		whoShort: "Aulaad",
		teaching: "Those of the Aulaad (children) of Mahdi A.S. will pay a mahar of 11 ukhiya."
	}
};
function maharTargetLabel(ukhiya) {
	const meta = UKHIYA_MAHAR[ukhiya];
	if (!meta) return `${ukhiya} ukhiya mahar`;
	return `${ukhiya} ukhiya · ${meta.whoShort}`;
}
var ERRORS = {
	confirmDisclaimer: "Please confirm that Ukhiya tracks mahar savings as 24K gold-equivalent (zar-e-surkh-e-khalis) and does not purchase gold.",
	targetAlreadySet: "A mahar target is already set. Change it from Settings.",
	changeTargetPhrase: "Type CHANGE TARGET to confirm. Completed grams stay the same; remaining grams and percentage are recalculated against the new mahar.",
	noActiveTarget: "No active mahar target to change.",
	goalNotSaved: "Mahar target was not saved.",
	targetNotUpdated: "Mahar target was not updated.",
	confirmManualPrice: "Confirm the 24K consumer buying price before saving this mahar entry.",
	missingIdempotency: "Missing idempotency key.",
	setTargetFirst: "Choose a mahar of 9, 10, or 11 ukhiya before recording money set aside.",
	entryNotSaved: "This mahar entry was not saved. Look up the 24K price again and try once more.",
	entryNotFound: "This mahar entry was not found.",
	typeConfirmDelete: "Type CONFIRM to permanently remove this entry from your mahar history.",
	typeDeleteAccount: "Type DELETE ACCOUNT to remove your Ukhiya mahar records.",
	permittedTarget: "Mahar must be 9, 10, or 11 ukhiya in this version.",
	timestampSave: "The 24K price time could not be stored. Look up the price again — past dates never silently reuse today's rate.",
	historicalUnavailable: "No provider could supply a 24K price for that past date. Today's price was not used. Enter the 24K consumer buying price you actually observed for zar-e-surkh-e-khalis, or pick a date we already have a snapshot for.",
	quoteUnavailable: "No gold-price provider could be reached. You can enter a 24K consumer buying price for zar-e-surkh-e-khalis manually if that fallback is enabled.",
	manualDisabled: "Manual price entry is disabled by the product owner."
};
//#endregion
export { ONBOARDING_ACCEPT_LABEL as a, UKHIYA_MAHAR as c, MAHAR_ORIGIN as i, ZAR_E_SURKH_ORIGIN as l, APP_TAGLINE as n, PURITY_TRADITION_LABEL as o, ERRORS as r, TRACKER_DISCLAIMER as s, APP_NAME as t, maharTargetLabel as u };
