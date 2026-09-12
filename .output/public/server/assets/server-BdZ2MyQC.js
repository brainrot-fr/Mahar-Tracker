import { createClient } from "@supabase/supabase-js";
//#region src/lib/supabase/server.ts
var supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
async function getSupabaseUser(accessToken) {
	if (!supabaseUrl || !supabaseAnonKey) return null;
	const { data, error } = await createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		},
		global: { headers: { Authorization: `Bearer ${accessToken}` } }
	}).auth.getUser(accessToken);
	if (error || !data.user) return null;
	return data.user;
}
//#endregion
export { getSupabaseUser as t };
