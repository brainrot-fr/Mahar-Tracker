import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";

const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseConfigured = Boolean(configuredUrl && configuredAnonKey);
const supabaseUrl = configuredUrl || "https://missing.supabase.co";
const supabaseAnonKey = configuredAnonKey || "missing-supabase-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function exchangeOAuthCode(callbackUrl: string, cleanBrowserUrl = false): Promise<void> {
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

export const oauthRedirectReady =
  typeof window !== "undefined" && !Capacitor.isNativePlatform()
    ? exchangeOAuthCode(window.location.href, true)
    : Promise.resolve();

export const supabaseRedirectUrl = () =>
  Capacitor.isNativePlatform()
    ? "com.mahartracker.app://auth/callback"
    : window.location.origin;
