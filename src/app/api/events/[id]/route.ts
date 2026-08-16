import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, getEventById, updateEvent } from "@/lib/db";
import { AuthError, getSession, requireSession } from "@/lib/auth";
import { deleteVideoFile } from "@/lib/uploads";
import { eventSchema } from "@/lib/validation";
import type { ExplorationLevel } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/events/[id] */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const eventId = Number(id);
    if (!Number.isInteger(eventId) || eventId < 1) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }

    const event = getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
    }

    // Public may only see active events
    const session = await getSession();
    if (!session && !event.isActive) {
      return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("GET /api/events/[id]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

/** PUT /api/events/[id] – update (admin) */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const eventId = Number(id);
    if (!Number.isInteger(eventId) || eventId < 1) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }

    const body: unknown = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const previous = getEventById(eventId);
    const event = updateEvent(eventId, {
      date: data.date,
      title: data.title,
      description: data.description,
      explorationLevel: data.explorationLevel as ExplorationLevel,
      videoPath: data.videoPath ?? null,
      previewImage: data.previewImage ?? null,
      isActive: data.isActive ?? true,
      beerCounterEnabled: data.beerCounterEnabled ?? false,
    });

    if (!event) {
      return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
    }

    if (previous?.videoPath && previous.videoPath !== event.videoPath) {
      await deleteVideoFile(previous.videoPath);
    }

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return NextResponse.json(
        { error: "Für dieses Datum existiert bereits ein Event" },
        { status: 409 }
      );
    }
    console.error("PUT /api/events/[id]", error);
    return NextResponse.json(
      { error: "Event konnte nicht aktualisiert werden" },
      { status: 500 }
    );
  }
}

/** DELETE /api/events/[id] – delete (admin) */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const eventId = Number(id);
    if (!Number.isInteger(eventId) || eventId < 1) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }

    const existing = getEventById(eventId);
    const ok = deleteEvent(eventId);
    if (!ok) {
      return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
    }

    await deleteVideoFile(existing?.videoPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("DELETE /api/events/[id]", error);
    return NextResponse.json(
      { error: "Event konnte nicht gelöscht werden" },
      { status: 500 }
    );
  }
}
