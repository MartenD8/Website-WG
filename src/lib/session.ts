import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "@/types";

export const SESSION_COOKIE = "event_admin_session";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET muss gesetzt und mindestens 16 Zeichen lang sein"
    );
  }
  return new TextEncoder().encode(secret);
}

export function getMaxAgeSeconds(): number {
  const hours = Number(process.env.SESSION_MAX_AGE_HOURS || 24);
  return Math.max(1, hours) * 60 * 60;
}

export async function createSessionToken(
  userId: number,
  username: string
): Promise<string> {
  const maxAge = getMaxAgeSeconds();
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.username !== "string") return null;
    return {
      sub: payload.sub,
      username: payload.username,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}
