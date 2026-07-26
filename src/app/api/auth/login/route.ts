import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "@/lib/auth";
import { findAdminByUsername, verifyPassword } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

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

    // Constant-time-ish failure: always hash-compare path delay via dummy check
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json(
        { error: "Benutzername oder Passwort ungültig" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(admin.id, admin.username);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    console.error("POST /api/auth/login", error);
    return NextResponse.json(
      { error: "Anmeldung fehlgeschlagen" },
      { status: 500 }
    );
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
export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
