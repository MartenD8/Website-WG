import { NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { getQuizSubmissions } from "@/lib/db";

/** GET /api/quiz/results – admin overview */
export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ submissions: getQuizSubmissions() });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/quiz/results", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
