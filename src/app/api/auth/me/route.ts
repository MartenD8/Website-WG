import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** GET /api/auth/me */
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
