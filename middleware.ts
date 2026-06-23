import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getRouteRedirect } from "./lib/workflowRules";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const redirect = getRouteRedirect({
    pathname,
    hasToken: Boolean(token),
    role: (token?.role as "ADMIN" | "CLIENT" | undefined) ?? null,
  });

  if (redirect) {
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*", "/projects/:path*", "/login"],
};
