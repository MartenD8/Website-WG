import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { getEventGuestLists } from "@/lib/db";

/** GET /api/rsvp/overview – admin guest lists */
export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sortParam = request.nextUrl.searchParams.get("sort");
    const sort = sortParam === "oldest" ? "oldest" : "newest";
    return NextResponse.json({ lists: getEventGuestLists(sort) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/rsvp/overview", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
