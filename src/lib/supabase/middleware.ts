import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export type UpdateSessionResult = {
    response: NextResponse
    user: User | null
}

/** Edge Middleware cannot read non-NEXT_PUBLIC env vars from .env; use public fallbacks. */
function supabaseEnv() {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return { url, anonKey }
}

export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const { url, anonKey } = supabaseEnv()

    if (!url?.trim() || !anonKey?.trim()) {
        console.error(
            '[middleware] Missing Supabase URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel (and SUPABASE_* if used).'
        )
        return { response: supabaseResponse, user: null }
    }

    let user: User | null = null

    try {
        const supabase = createServerClient(url, anonKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        })

        const {
            data: { user: u },
        } = await supabase.auth.getUser()
        user = u
    } catch (err) {
        console.error('[middleware] Supabase session error:', err)
        const fallback = NextResponse.next({ request })
        return { response: fallback, user: null }
    }

    return { response: supabaseResponse, user }
}