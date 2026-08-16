import { NextRequest, NextResponse } from "next/server";
import { cookieSecure } from "@/lib/cookies";
import {
  GUEST_COOKIE,
  createGuestToken,
  getGuestMaxAgeSeconds,
} from "@/lib/session";
import { verifySiteCredentials } from "@/lib/siteAccess";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** POST /api/auth/site – visitor login for the whole website */
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
    if (!verifySiteCredentials(username, password)) {
      return NextResponse.json(
        { error: "Benutzername oder Passwort ungültig" },
        { status: 401 }
      );
    }

    const token = await createGuestToken(username.trim());
    const response = NextResponse.json({ success: true });
    response.cookies.set(GUEST_COOKIE, token, {
      httpOnly: true,
      secure: cookieSecure(request),
      sameSite: "lax",
      path: "/",
      maxAge: getGuestMaxAgeSeconds(),
    });
    return response;
  } catch (error) {
    console.error("POST /api/auth/site", error);
    const message =
      error instanceof Error && error.message.includes("AUTH_SECRET")
        ? "Server-Konfiguration unvollständig (AUTH_SECRET fehlt)"
        : "Anmeldung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/auth/site – visitor logout */
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(GUEST_COOKIE, "", {
    httpOnly: true,
    secure: cookieSecure(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
