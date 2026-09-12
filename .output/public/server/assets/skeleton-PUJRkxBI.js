import { a as supabaseConfigured, i as supabase, o as supabaseRedirectUrl, r as oauthRedirectReady } from "./client-D0zp5Mdu.js";
import { useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
//#region src/lib/auth/client.ts
async function signInWithGoogle() {
	if (!supabaseConfigured) throw new Error("Configure Supabase in .env before signing in.");
	const { error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: supabaseRedirectUrl(),
			skipBrowserRedirect: false
		}
	});
	if (error) throw error;
}
/**
* Sign out of this app's local session, then redirect.
*
* Rejects if the server does not confirm sign-out.
*/
async function signOut(redirectTo = "/") {
	const { error } = await supabase.auth.signOut();
	if (error) throw new Error(error.message ?? "Sign-out failed");
	window.location.href = redirectTo;
}
//#endregion
//#region src/lib/auth/use-current-user.ts
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
function useCurrentUserState() {
	const [state, setState] = useState({
		user: null,
		isPending: true
	});
	useEffect(() => {
		if (!supabaseConfigured) {
			setState({
				user: null,
				isPending: false
			});
			return;
		}
		let mounted = true;
		oauthRedirectReady.then(() => supabase.auth.getUser()).then(({ data }) => {
			if (!mounted) return;
			setState({
				user: data.user ? {
					id: data.user.id,
					displayName: data.user.user_metadata.full_name ?? data.user.user_metadata.name ?? null,
					primaryEmail: data.user.email ?? null,
					profileImageUrl: data.user.user_metadata.avatar_url ?? null,
					isDevFallback: false
				} : null,
				isPending: false
			});
		}).catch(() => {
			if (mounted) setState({
				user: null,
				isPending: false
			});
		});
		const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
			if (!mounted) return;
			const user = session?.user;
			setState({
				user: user ? {
					id: user.id,
					displayName: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
					primaryEmail: user.email ?? null,
					profileImageUrl: user.user_metadata.avatar_url ?? null,
					isDevFallback: false
				} : null,
				isPending: false
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
function useCurrentUser() {
	return useCurrentUserState().user;
}
//#endregion
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/ui/skeleton.tsx
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn("animate-pulse rounded-md bg-elevated", className),
		...props
	});
}
//#endregion
export { signInWithGoogle as a, useCurrentUserState as i, cn as n, signOut as o, useCurrentUser as r, Skeleton as t };
