import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * OAuth / magic-link 回调：必须把 session 写入「本次返回的」RedirectResponse 的 Set-Cookie，
 * 否则 Next.js Route Handler 里仅用 cookies() 写入时，重定向响应可能不带登录态，middleware 会当成未登录踢回 /login。
 */
export async function GET(request: Request) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const nextPath = url.searchParams.get('next') ?? '/'

    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const origin =
        forwardedHost && !forwardedHost.includes('localhost')
            ? `${forwardedProto ?? 'https'}://${forwardedHost}`
            : url.origin

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    const cookieStore = await cookies()
    const redirectTo = `${origin}${nextPath.startsWith('/') ? nextPath : `/${nextPath}`}`
    const response = NextResponse.redirect(redirectTo)

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
        console.error('[auth/callback] Missing Supabase URL or anon key')
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(
                cookiesToSet: { name: string; value: string; options: CookieOptions }[],
                headers?: Record<string, string>
            ) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options)
                })
                if (headers) {
                    Object.entries(headers).forEach(([key, value]) => {
                        if (typeof value === 'string') response.headers.set(key, value)
                    })
                }
            },
        },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error('❌ Auth session exchange failed!', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    console.log('✅ Auth session exchanged successfully!')
    return response
}
