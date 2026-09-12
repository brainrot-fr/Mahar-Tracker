import type { ReactNode } from "react";
import { App } from "@capacitor/app";
import { useEffect } from "react";
import { exchangeOAuthCode } from "@/lib/supabase/client";

/**
 * App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
 *
 *   <AuthProvider><Outlet /></AuthProvider>
 *
 * Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
 * its `useSession()` works standalone — so this is a passthrough today. It's
 * kept as the single, stable mount point for any future client-side providers
 * (e.g. a toast or theme provider) without churning the root shell.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let listener: { remove: () => Promise<void> } | undefined;
    void App.addListener("appUrlOpen", ({ url }) => {
      void exchangeOAuthCode(url);
    }).then((handle) => {
      listener = handle;
    });
    return () => {
      void listener?.remove();
    };
  }, []);
  return <>{children}</>;
}
