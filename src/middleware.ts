import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  GUEST_COOKIE,
  SESSION_COOKIE,
  verifyGuestToken,
  verifySessionToken,
} from "@/lib/session";

const SITE_LOGIN_PATH = "/login";
const ADMIN_LOGIN_PATH = "/admin/login";

async function hasAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return Boolean(token && (await verifySessionToken(token)));
}

/** Admins never need the visitor password on top of their own login. */
async function hasSiteAccess(request: NextRequest): Promise<boolean> {
  const guest = request.cookies.get(GUEST_COOKIE)?.value;
  if (guest && (await verifyGuestToken(guest))) return true;
  return hasAdminSession(request);
}

/**
 * Two gates: the whole site requires a visitor login, /admin additionally
 * requires an admin session. Login pages and auth endpoints stay public.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/auth/") || pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  if (pathname === SITE_LOGIN_PATH) {
    if (await hasSiteAccess(request)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (await hasAdminSession(request)) {
      return NextResponse.next();
    }
    const response = NextResponse.redirect(
      new URL(ADMIN_LOGIN_PATH, request.url)
    );
    response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  if (await hasSiteAccess(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const loginUrl = new URL(SITE_LOGIN_PATH, request.url);
  if (pathname !== "/") {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Everything except Next.js internals and static image/meta files.
    // Uploaded videos stay behind the gate on purpose.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
