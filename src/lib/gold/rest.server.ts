import { getRequest } from "@tanstack/react-start/server";
import { getSupabaseUser } from "@/lib/supabase/server";

export class UnauthorizedError extends Error {}

export async function requireRestUser() {
  const token = getRequest()?.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const user = token ? await getSupabaseUser(token) : null;
  if (!user) throw new UnauthorizedError();
  return user;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function restError(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return json({ error: "Unauthorized" }, 401);
  }
  const message = err instanceof Error ? err.message : "Request failed";
  return json({ error: message }, 400);
}
