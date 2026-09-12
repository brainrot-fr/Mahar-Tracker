//#region src/lib/gold/format.ts
function formatGrams(grams, places = 4) {
	if (!Number.isFinite(grams)) return "—";
	return `${grams.toLocaleString("en-IN", {
		minimumFractionDigits: places,
		maximumFractionDigits: places
	})} g`;
}
function formatMoney(amount, currency) {
	if (!Number.isFinite(amount)) return "—";
	try {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency,
			maximumFractionDigits: 2
		}).format(amount);
	} catch {
		return `${amount.toFixed(2)} ${currency}`;
	}
}
function formatPercent(value) {
	if (!Number.isFinite(value)) return "—";
	const places = value > 0 && value < .1 ? 2 : value < 10 ? 2 : 1;
	return `${value.toLocaleString("en-IN", {
		minimumFractionDigits: places,
		maximumFractionDigits: places
	})}%`;
}
function formatDate(iso) {
	if (!iso) return "—";
	const [y, m, day] = iso.slice(0, 10).split("-").map(Number);
	if (!y || !m || !day) return iso;
	return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC"
	});
}
function formatDateTime(iso) {
	if (!iso) return "—";
	const dt = new Date(iso);
	if (Number.isNaN(dt.getTime())) return iso;
	return dt.toLocaleString("en-IN", {
		dateStyle: "medium",
		timeStyle: "short"
	});
}
function priceUnitLabel(unit) {
	switch (unit) {
		case "per_gram": return "per gram";
		case "per_tola": return "per tola";
		case "per_troy_ounce": return "per troy ounce";
		default: return unit;
	}
}
//#endregion
export { formatPercent as a, formatMoney as i, formatDateTime as n, priceUnitLabel as o, formatGrams as r, formatDate as t };
