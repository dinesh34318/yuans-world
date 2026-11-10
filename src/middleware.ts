import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const pathname = req.nextUrl.pathname;

  // Public routes - no auth needed
  const publicRoutes = ["/", "/auth/login/parent", "/auth/login/child", "/auth/register"];
  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn) {
      if (role === "PARENT") {
        return NextResponse.redirect(new URL("/parent/dashboard", req.nextUrl));
      }
      if (role === "CHILD") {
        return NextResponse.redirect(new URL("/child/dashboard", req.nextUrl));
      }
    }
    return NextResponse.next();
  }

  // API routes for auth - always allow
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login/parent", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Parent-only routes
  if (pathname.startsWith("/parent") && role !== "PARENT") {
    return NextResponse.redirect(new URL("/child/dashboard", req.nextUrl));
  }

  // Child-only routes
  if (pathname.startsWith("/child") && role !== "CHILD") {
    return NextResponse.redirect(new URL("/parent/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/parent/:path*",
    "/child/:path*",
    "/auth/:path*",
    "/rules",
  ],
};
