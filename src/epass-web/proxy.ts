import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isLanding = req.nextUrl.pathname === "/";
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");
    const isHome = req.nextUrl.pathname.startsWith("/home");
    const isProfile = req.nextUrl.pathname.startsWith("/profile");

    // 1. Inverse Redirection: Logged in users cannot access /login
    if (isLoginPage) {
        if (isAuth) {
            return NextResponse.redirect(new URL("/home", req.url));
        }
        return NextResponse.next();
    }

    // 2. Protected Routes: Unlogged users cannot access /home
    if ((isHome || isProfile) && !isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // 3. Redirect from '/' to '/home' when logged
    if (isLanding && isAuth) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/home", "/login", "/profile", "/"],
};
