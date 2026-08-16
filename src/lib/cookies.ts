import type { NextRequest } from "next/server";

/**
 * Only mark cookies Secure when the request is actually HTTPS.
 * Never default to Secure just because NODE_ENV=production – that
 * breaks login on plain HTTP (browser silently drops the cookie).
 */
export function cookieSecure(request: NextRequest): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().toLowerCase() === "https";
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}
