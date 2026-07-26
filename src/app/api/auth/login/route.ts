import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE,
  getSession,
} from "@/lib/auth";
import { getMaxAgeSeconds } from "@/lib/session";
import { findAdminByUsername, verifyPassword } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

function cookieSecure(request: NextRequest): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0]?.trim() === "https";
  return process.env.NODE_ENV === "production";
}

function applySessionCookie(
  response: NextResponse,
  token: string,
  request: NextRequest
): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(request),
    sameSite: "lax",
    path: "/",
    maxAge: getMaxAgeSeconds(),
  });
}

/** POST /api/auth/login */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const admin = findAdminByUsername(username);

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json(
        { error: "Benutzername oder Passwort ungültig" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(admin.id, admin.username);
    const response = NextResponse.json({
      success: true,
      user: { id: admin.id, username: admin.username },
    });
    applySessionCookie(response, token, request);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login", error);
    const message =
      error instanceof Error && error.message.includes("AUTH_SECRET")
        ? "Server-Konfiguration unvollständig (AUTH_SECRET fehlt)"
        : "Anmeldung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** GET /api/auth/login – current session info */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: { id: Number(session.sub), username: session.username },
  });
}

/** DELETE /api/auth/login – logout */
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: cookieSecure(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
