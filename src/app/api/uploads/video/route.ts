import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { UploadError, deleteVideoFile, saveVideoStream } from "@/lib/uploads";
import { videoDeleteSchema } from "@/lib/validation";
import { normalizeMimeType } from "@/lib/video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Large uploads may take a while – do not cut them short. */
export const maxDuration = 3600;

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  EMPTY_FILE: "Die Datei ist leer",
  INVALID_FILE_TYPE: "Nur MP4- und WebM-Videos sind erlaubt",
};

/**
 * POST /api/uploads/video – raw body upload of a single event video (admin).
 *
 * The file is sent as the request body with its MIME type in `Content-Type`,
 * which lets the server stream it to disk without buffering it in memory.
 */
export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const mimeType = normalizeMimeType(request.headers.get("content-type"));
    if (!request.body) {
      return NextResponse.json(
        { error: "Keine Datei übermittelt" },
        { status: 400 }
      );
    }

    const videoPath = await saveVideoStream(request.body, mimeType);
    return NextResponse.json({ videoPath }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof UploadError) {
      return NextResponse.json(
        { error: UPLOAD_ERROR_MESSAGES[error.code] ?? "Upload fehlgeschlagen" },
        { status: 400 }
      );
    }
    console.error("POST /api/uploads/video", error);
    return NextResponse.json(
      { error: "Video konnte nicht hochgeladen werden" },
      { status: 500 }
    );
  }
}

/** DELETE /api/uploads/video – remove an uploaded file that is not referenced (admin) */
export async function DELETE(request: NextRequest) {
  try {
    await requireSession();

    const body: unknown = await request.json();
    const parsed = videoDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await deleteVideoFile(parsed.data.videoPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("DELETE /api/uploads/video", error);
    return NextResponse.json(
      { error: "Video konnte nicht gelöscht werden" },
      { status: 500 }
    );
  }
}
