import { NextRequest, NextResponse } from "next/server";
import { getPublicQuizQuestions } from "@/data/quiz";
import { submitQuiz } from "@/lib/db";
import { quizSubmitSchema } from "@/lib/validation";

/** GET /api/quiz – public questions without answers */
export async function GET() {
  return NextResponse.json({ questions: getPublicQuizQuestions() });
}

/** POST /api/quiz – submit answers */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = quizSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const submission = submitQuiz(parsed.data);
    return NextResponse.json(
      {
        submission: {
          id: submission.id,
          name: submission.name,
          correctCount: submission.correctCount,
          totalQuestions: submission.totalQuestions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_NAME") {
      return NextResponse.json(
        {
          error:
            "HALT STOP! Es bleibt alles so wie es ist, ob du ein Melker bist oder nicht.",
        },
        { status: 409 }
      );
    }
    console.error("POST /api/quiz", error);
    return NextResponse.json(
      { error: "Quiz konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }
}
