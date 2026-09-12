import { r as ERRORS } from "./copy-C__m_4Lq.js";
import { a as PERMITTED_UKHIYA, o as SUPPORTED_CURRENCIES, r as GOLD_PRICE_UNITS } from "./constants-7dvr3BEP.js";
//#region src/lib/gold/validation.ts
function parsePositiveNumber(value, label) {
	const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
	if (!Number.isFinite(n) || n <= 0) throw new Error(`${label} must be greater than zero.`);
	return n;
}
function parseIsoDate(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("The date money was set aside must be a valid calendar date (YYYY-MM-DD).");
	const [y, m, d] = value.split("-").map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) throw new Error("That date is not a real calendar date.");
	if (value > todayIsoDate()) throw new Error("Mahar entries cannot be dated in the future.");
	if (y < 1990) throw new Error("That date is too far in the past for version 1.");
	return value;
}
function todayIsoDate(now = /* @__PURE__ */ new Date()) {
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function isSupportedCurrency(code) {
	return SUPPORTED_CURRENCIES.includes(code);
}
function parseCurrency(value) {
	if (typeof value !== "string" || !/^[A-Z]{3}$/.test(value)) throw new Error("Currency must be a three-letter code.");
	if (!isSupportedCurrency(value)) throw new Error(`Currency ${value} is not supported.`);
	return value;
}
function parseUkhiya(value) {
	const n = typeof value === "number" ? value : Number(value);
	if (!PERMITTED_UKHIYA.includes(n)) throw new Error(ERRORS.permittedTarget);
	return n;
}
function parsePriceUnit(value) {
	if (typeof value !== "string" || !GOLD_PRICE_UNITS.includes(value)) throw new Error("Gold-price unit must be per gram, per tola, or per troy ounce.");
	return value;
}
function parseNote(value) {
	if (value == null || value === "") return null;
	if (typeof value !== "string") throw new Error("Note must be text.");
	const trimmed = value.trim();
	if (trimmed.length > 500) throw new Error("Note must be 500 characters or fewer.");
	return trimmed || null;
}
//#endregion
export { parsePriceUnit as a, parsePositiveNumber as i, parseIsoDate as n, parseUkhiya as o, parseNote as r, todayIsoDate as s, parseCurrency as t };
