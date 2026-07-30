import { NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { getBeerPersonOverview } from "@/lib/db";

/** GET /api/beers/overview – admin beer overview */
export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ people: getBeerPersonOverview() });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/beers/overview", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
