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
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const supabaseRedirectUrl = () =>
  Capacitor.isNativePlatform()
    ? "com.mahartracker.app://auth/callback"
    : import.meta.env.VITE_SUPABASE_REDIRECT_URL || window.location.origin;
