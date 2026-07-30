import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { deleteEventRsvp } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

/** DELETE /api/rsvp/[id] – admin remove guest */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const rsvpId = Number(id);
    if (!Number.isInteger(rsvpId) || rsvpId < 1) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }
    const ok = deleteEventRsvp(rsvpId);
    if (!ok) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("DELETE /api/rsvp/[id]", error);
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}
