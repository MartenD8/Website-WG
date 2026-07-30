import { NextRequest, NextResponse } from "next/server";
import { addEventRsvp } from "@/lib/db";
import { rsvpSchema } from "@/lib/validation";

/** POST /api/rsvp – public event signup */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rsvp = addEventRsvp(parsed.data);
    return NextResponse.json({ rsvp }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EVENT_NOT_FOUND") {
        return NextResponse.json(
          { error: "Event nicht gefunden" },
          { status: 404 }
        );
      }
      if (error.message === "DUPLICATE_RSVP") {
        return NextResponse.json(
          {
            error:
              "Wir wissen, dass das Event überragend ist, aber du bist schon angemeldet.",
          },
          { status: 409 }
        );
      }
    }
    console.error("POST /api/rsvp", error);
    return NextResponse.json(
      { error: "Anmeldung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
