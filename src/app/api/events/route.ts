import { NextRequest, NextResponse } from "next/server";
import { createEvent, getActiveEvents, getAllEvents } from "@/lib/db";
import { AuthError, getSession, requireSession } from "@/lib/auth";
import { eventSchema } from "@/lib/validation";
import type { ExplorationLevel } from "@/types";

/** GET /api/events – public: active only; with admin session: all */
export async function GET() {
  try {
    const session = await getSession();
    const events = session ? getAllEvents() : getActiveEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/events", error);
    return NextResponse.json(
      { error: "Events konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

/** POST /api/events – create event (admin only) */
export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body: unknown = await request.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const event = createEvent({
      date: data.date,
      title: data.title,
      description: data.description,
      explorationLevel: data.explorationLevel as ExplorationLevel,
      videoPath: data.videoPath ?? null,
      previewImage: data.previewImage ?? null,
      isActive: data.isActive ?? true,
      beerCounterEnabled: data.beerCounterEnabled ?? false,
    });

    return NextResponse.json({ event }, { status: 201 });
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
    console.error("POST /api/events", error);
    return NextResponse.json(
      { error: "Event konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}
