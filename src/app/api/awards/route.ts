import { NextRequest, NextResponse } from "next/server";
import { AWARDS } from "@/data/awards";
import { submitAwardBallot } from "@/lib/db";
import { awardSubmitSchema } from "@/lib/validation";

/** GET /api/awards – award list for voting */
export async function GET() {
  return NextResponse.json({ awards: AWARDS });
}

/** POST /api/awards – submit ballot */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = awardSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ballot = submitAwardBallot(parsed.data);
    return NextResponse.json(
      { ballot: { id: ballot.id, voterName: ballot.voterName } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DUPLICATE_NAME") {
        return NextResponse.json(
          {
            error:
              "HALT STOP! Es bleibt alles so wie es ist, ob du ein Melker bist oder nicht.",
          },
          { status: 409 }
        );
      }
      if (error.message === "EMPTY_NOMINATIONS") {
        return NextResponse.json(
          { error: "Bitte mindestens einen Award vergeben" },
          { status: 400 }
        );
      }
    }
    console.error("POST /api/awards", error);
    return NextResponse.json(
      { error: "Awards konnten nicht gespeichert werden" },
      { status: 500 }
    );
  }
}
