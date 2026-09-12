import { supabase, supabaseConfigured, supabaseRedirectUrl } from "@/lib/supabase/client";

/**
 * Better Auth client for this React SPA (browser-side).
 *
 * Talks to this app's own Better Auth at same-origin `/api/auth/*` using the
 * app's session cookie.
 *
 * To sign out call `signOut()` below so the app redirects after the server
 * confirms the session was cleared.
 */
export const authClient = supabase;
export const authEnabled = true;

export async function signInWithGoogle(): Promise<void> {
  if (!supabaseConfigured) throw new Error("Configure Supabase in .env before signing in.");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: supabaseRedirectUrl(),
      skipBrowserRedirect: false,
    },
  });
  if (error) throw error;
}

/**
 * Sign out of this app's local session, then redirect.
 *
 * Rejects if the server does not confirm sign-out.
 */
export async function signOut(redirectTo = "/"): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message ?? "Sign-out failed");
  window.location.href = redirectTo;
}
