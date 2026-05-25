import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");
    const isHome = req.nextUrl.pathname.startsWith("/home");

    // 1. Inverse Redirection: Logged in users cannot access /login
    if (isLoginPage) {
        if (isAuth) {
            return NextResponse.redirect(new URL("/home", req.url));
        }
        return NextResponse.next();
    }

    // 2. Protected Routes: Unlogged users cannot access /home
    if (isHome && !isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/home", "/login"],
}
