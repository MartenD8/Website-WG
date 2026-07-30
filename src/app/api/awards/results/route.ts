import { NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { getAwardResults } from "@/lib/db";

/** GET /api/awards/results – admin overview */
export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ results: getAwardResults() });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/awards/results", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
