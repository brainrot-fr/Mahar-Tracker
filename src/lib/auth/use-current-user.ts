import { useEffect, useState } from "react";
import { oauthRedirectReady, supabase, supabaseConfigured } from "@/lib/supabase/client";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
};

/**
 * Stable fallback user, used ONLY when auth is disabled
 * (`VITE_AUTH_ENABLED=false`, the shipped default). With auth on, the sandbox
 * live preview does real sign-in via the baked preview client. Its id is
 * `"dev-user"` — the SAME id `verify.server.ts` returns server-side — so per-user
 * rows written in that mode belong to one consistent owner.
 */
/** `useCurrentUserState()` result: the user plus the session-loading flag. */
export type CurrentUserState = {
  /** The user — `null` BOTH while the session loads and when signed out. */
  user: AppUser | null;
  /** True while the session is still resolving — don't treat `user: null` as signed out yet. */
  isPending: boolean;
};

/**
 * Current user + loading state. Same behavior in live preview and when deployed:
 *   - Auth enabled -> the real signed-in user; `user` is `null` while
 *                            the session resolves (`isPending: true`) and when
 *                            signed out (`isPending: false`). Session comes from
 *                            Better Auth `useSession()` → `/api/auth/get-session`
 *                            (cookie when deployed; bearer in live preview).
 *   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
 *
 * Protect a route by waiting out `isPending` before acting on `user` —
 * redirecting on `user: null` alone bounces signed-in visitors to sign-in on
 * every hard reload:
 *
 *   import { RedirectToSignIn } from "@/lib/auth/gates";
 *   const { user, isPending } = useCurrentUserState();
 *   if (isPending) return null;              // still resolving — don't redirect yet
 *   if (!user) return <RedirectToSignIn />;  // definitely signed out
 *
 * `authEnabled` is a module-level constant fixed at load, so the guarded hook
 * call keeps a stable hook order across every render of a given component.
 */
export function useCurrentUserState(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>({ user: null, isPending: true });
  useEffect(() => {
    if (!supabaseConfigured) {
      setState({ user: null, isPending: false });
      return;
    }
    let mounted = true;
    void oauthRedirectReady
      .then(() => supabase.auth.getUser())
      .then(({ data }) => {
        if (!mounted) return;
        setState({
          user: data.user
            ? {
                id: data.user.id,
                displayName: data.user.user_metadata.full_name ?? data.user.user_metadata.name ?? null,
                primaryEmail: data.user.email ?? null,
                profileImageUrl: data.user.user_metadata.avatar_url ?? null,
                isDevFallback: false,
              }
            : null,
          isPending: false,
        });
      })
      .catch(() => {
        if (mounted) setState({ user: null, isPending: false });
      });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user;
      setState({
        user: user
          ? {
              id: user.id,
              displayName: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
              primaryEmail: user.email ?? null,
              profileImageUrl: user.user_metadata.avatar_url ?? null,
              isDevFallback: false,
            }
          : null,
        isPending: false,
      });
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  return state;
}

/**
 * Convenience view of `useCurrentUserState().user` for display (e.g.
 * `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
 * for redirects/guards use `useCurrentUserState()` and check `isPending`.
 */
export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
