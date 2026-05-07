import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function adminEnv() {
    const url =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
        process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    return { url, key };
}

let client: SupabaseClient | undefined;

function getSupabaseAdmin(): SupabaseClient {
    const { url, key } = adminEnv();
    if (!url || !key) {
        throw new Error(
            "Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
        );
    }
    if (!client) {
        client = createClient(url, key);
    }
    return client;
}

/** Lazy client so importing this module during `next build` does not require env vars. */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        const c = getSupabaseAdmin();
        const value = Reflect.get(c, prop, c);
        if (typeof value === "function") {
            return value.bind(c);
        }
        return value;
    },
});
