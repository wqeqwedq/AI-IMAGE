import { isAdminUser } from "@/lib/admin/is-admin";
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

function copyCookies(from: NextResponse, to: NextResponse) {
    from.cookies.getAll().forEach(({ name, value, ...rest }) => {
        to.cookies.set(name, value, rest);
    });
}

export async function middleware(request: NextRequest) {
    const { response: sessionResponse, user } = await updateSession(request);
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/admin")) {
        if (!user) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = "/login";
            loginUrl.searchParams.set(
                "next",
                `${pathname}${request.nextUrl.search}`
            );
            const redirectResponse = NextResponse.redirect(loginUrl);
            copyCookies(sessionResponse, redirectResponse);
            return redirectResponse;
        }
        if (!isAdminUser(user)) {
            const dashUrl = new URL("/dashboard", request.nextUrl.origin);
            const redirectResponse = NextResponse.redirect(dashUrl);
            copyCookies(sessionResponse, redirectResponse);
            return redirectResponse;
        }
    }

    if (
        !user &&
        !pathname.startsWith("/login") &&
        !pathname.startsWith("/auth") &&
        !pathname.startsWith("/reset-password") &&
        !pathname.startsWith("/account-reset-password") &&
        !pathname.startsWith("/signup") &&
        pathname !== "/"
    ) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        const redirectResponse = NextResponse.redirect(loginUrl);
        copyCookies(sessionResponse, redirectResponse);
        return redirectResponse;
    }

    return sessionResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
