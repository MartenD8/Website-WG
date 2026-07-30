import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { deleteQuizSubmission, updateQuizSubmission } from "@/lib/db";
import { quizUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/quiz/results/[id] – update / recalculate */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const submissionId = Number(id);
    if (!Number.isInteger(submissionId) || submissionId < 1) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }

    const body: unknown = await request.json();
    const parsed = quizUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const submission = updateQuizSubmission(submissionId, {
      name: parsed.data.name,
      answers: parsed.data.answers,
    });
    if (!submission) {
      return NextResponse.json(
        { error: "Teilnahme nicht gefunden" },
        { status: 404 }
      );
    }
    return NextResponse.json({ submission });
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
    console.error("PUT /api/quiz/results/[id]", error);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
  }
}

/** DELETE /api/quiz/results/[id] – delete entire attempt */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const submissionId = Number(id);
    if (!Number.isInteger(submissionId) || submissionId < 1) {
      return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
    }
    const ok = deleteQuizSubmission(submissionId);
    if (!ok) {
      return NextResponse.json(
        { error: "Teilnahme nicht gefunden" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("DELETE /api/quiz/results/[id]", error);
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}
