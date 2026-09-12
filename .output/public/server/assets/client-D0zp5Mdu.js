import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
//#region src/lib/supabase/client.ts
var client_exports = /* @__PURE__ */ __exportAll({
	exchangeOAuthCode: () => exchangeOAuthCode,
	oauthRedirectReady: () => oauthRedirectReady,
	supabase: () => supabase,
	supabaseConfigured: () => supabaseConfigured,
	supabaseRedirectUrl: () => supabaseRedirectUrl
});
var configuredUrl = "https://nfeeyrtidqdwxbfqzcmp.supabase.co/";
var configuredAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWV5cnRpZHFkd3hiZnF6Y21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzc2OTcsImV4cCI6MjEwNDYxMzY5N30.ml7v7IqF771Io0irAJVoWpBLKfIYqDptkE5Lj2mWI78";
var supabaseConfigured = Boolean(configuredAnonKey);
var supabase = createClient(configuredUrl, configuredAnonKey, { auth: {
	flowType: "pkce",
	detectSessionInUrl: false,
	persistSession: true,
	autoRefreshToken: true
} });
async function exchangeOAuthCode(callbackUrl, cleanBrowserUrl = false) {
	const callback = new URL(callbackUrl);
	const code = callback.searchParams.get("code");
	if (!code) return;
	const { error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) throw error;
	if (cleanBrowserUrl && typeof window !== "undefined") {
		callback.searchParams.delete("code");
		callback.searchParams.delete("state");
		window.history.replaceState({}, document.title, `${callback.pathname}${callback.search}${callback.hash}`);
	}
}
var oauthRedirectReady = typeof window !== "undefined" && !Capacitor.isNativePlatform() ? exchangeOAuthCode(window.location.href, true) : Promise.resolve();
var supabaseRedirectUrl = () => Capacitor.isNativePlatform() ? "com.mahartracker.app://auth/callback" : window.location.origin;
//#endregion
export { supabaseConfigured as a, supabase as i, exchangeOAuthCode as n, supabaseRedirectUrl as o, oauthRedirectReady as r, client_exports as t };
