import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.js";
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
//#region src/lib/supabase/client.ts
var client_exports = /* @__PURE__ */ __exportAll({
	supabase: () => supabase,
	supabaseConfigured: () => supabaseConfigured,
	supabaseRedirectUrl: () => supabaseRedirectUrl
});
var configuredUrl = "https://nfeeyrtidqdwxbfqzcmp.supabase.co/";
var configuredAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWV5cnRpZHFkd3hiZnF6Y21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzc2OTcsImV4cCI6MjEwNDYxMzY5N30.ml7v7IqF771Io0irAJVoWpBLKfIYqDptkE5Lj2mWI78";
var supabaseConfigured = Boolean(configuredAnonKey);
var supabase = createClient(configuredUrl, configuredAnonKey, { auth: {
	flowType: "pkce",
	detectSessionInUrl: true,
	persistSession: true,
	autoRefreshToken: true
} });
var supabaseRedirectUrl = () => Capacitor.isNativePlatform() ? "com.mahartracker.app://auth/callback" : window.location.origin;
//#endregion
export { supabaseRedirectUrl as i, supabase as n, supabaseConfigured as r, client_exports as t };
