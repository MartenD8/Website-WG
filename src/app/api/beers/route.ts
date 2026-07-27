import { NextRequest, NextResponse } from "next/server";
import { addBeerEntry, getBeerStats } from "@/lib/db";
import { beerEntrySchema } from "@/lib/validation";

/** GET /api/beers – public aggregate stats */
export async function GET() {
  try {
    return NextResponse.json({ stats: getBeerStats() });
  } catch (error) {
    console.error("GET /api/beers", error);
    return NextResponse.json(
      { error: "Statistik konnte nicht geladen werden" },
      { status: 500 }
    );
  }
}

/** POST /api/beers – submit beers for a day (public) */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = beerEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const entry = addBeerEntry(parsed.data);
    const stats = getBeerStats();
    return NextResponse.json({ entry, stats }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EVENT_NOT_FOUND") {
        return NextResponse.json(
          { error: "Event nicht gefunden" },
          { status: 404 }
        );
      }
      if (error.message === "BEER_COUNTER_DISABLED") {
        return NextResponse.json(
          { error: "Bier-Zähler für diesen Tag ist nicht aktiv" },
          { status: 403 }
        );
      }
    }
    console.error("POST /api/beers", error);
    return NextResponse.json(
      { error: "Eintrag konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }
}
