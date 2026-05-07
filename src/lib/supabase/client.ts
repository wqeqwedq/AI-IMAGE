import { createBrowserClient } from '@supabase/ssr'

function supabaseBrowserEnv() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
    return { url, anonKey }
}

export function createClient() {
    const { url, anonKey } = supabaseBrowserEnv()
    return createBrowserClient(url!, anonKey!)
}