import { a as getRequest, t as createMiddleware } from "../server.js";
import { t as getSupabaseUser } from "./server-BdZ2MyQC.js";
//#region src/lib/auth/middleware.ts
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. The session cookie is same-origin and rides along
* automatically; call sites do not thread identity values themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { data } = await import("./client-D0zp5Mdu.js").then((n) => n.t).then(({ supabase }) => supabase.auth.getSession());
	return next({ headers: data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {} });
}).server(async ({ next, context }) => {
	const token = getRequest()?.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
	const user = token ? await getSupabaseUser(token) : null;
	if (!user) throw new Error("Unauthorized");
	const userId = user.id;
	return next({ context: { userId } });
});
//#endregion
export { authMiddleware as t };
