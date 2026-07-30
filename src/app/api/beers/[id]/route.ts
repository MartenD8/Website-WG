import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { deleteBeerEntry, updateBeerEntry } from "@/lib/db";
import { beerEntryUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/beers/[id] – admin edit */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const entryId = Number(id);
    if (!Number.isInteger(entryId) || entryId < 1) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }

    const body: unknown = await request.json();
    const parsed = beerEntryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const entry = updateBeerEntry(entryId, parsed.data);
    if (!entry) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message === "DUPLICATE_NAME") {
      return NextResponse.json(
        {
          error:
            "HALT STOP! Es bleibt alles so wie es ist, ob du ein Melker bist oder nicht.",
        },
        { status: 409 }
      );
    }
    console.error("PUT /api/beers/[id]", error);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
  }
}

/** DELETE /api/beers/[id] – admin delete */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const entryId = Number(id);
    if (!Number.isInteger(entryId) || entryId < 1) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }
    const ok = deleteBeerEntry(entryId);
    if (!ok) {
      return NextResponse.json({ error: "Eintrag nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("DELETE /api/beers/[id]", error);
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}
