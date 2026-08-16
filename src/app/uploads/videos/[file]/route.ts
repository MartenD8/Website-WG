import fs from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveVideoFile } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ file: string }> };

interface ByteRange {
  start: number;
  end: number;
}

/**
 * Reads a single byte range. Browsers need this to jump inside a video and to
 * read the duration of files whose metadata sits at the end. Unsupported forms
 * (multi ranges) fall back to a full response, which stays correct.
 */
function parseRange(
  header: string | null,
  size: number
): ByteRange | "unsatisfiable" | null {
  if (!header) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return "unsatisfiable";

  let start: number;
  let end: number;

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (suffixLength <= 0) return "unsatisfiable";
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Math.min(Number(rawEnd), size - 1) : size - 1;
  }

  if (start > end || start >= size) return "unsatisfiable";
  return { start, end };
}

function streamFile(filePath: string, range?: ByteRange): ReadableStream<Uint8Array> {
  const stream = fs.createReadStream(filePath, range);
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}

/** GET /uploads/videos/[file] – serves an uploaded video with range support. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { file } = await context.params;
  const video = await resolveVideoFile(file);

  if (!video) {
    return new NextResponse("Video nicht gefunden", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": video.contentType,
    "Accept-Ranges": "bytes",
    "Last-Modified": video.lastModified.toUTCString(),
    // File names are random and never reused, so the content cannot change.
    "Cache-Control": "private, max-age=31536000, immutable",
  });

  const range = parseRange(request.headers.get("range"), video.size);

  if (range === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${video.size}`);
    return new NextResponse(null, { status: 416, headers });
  }

  if (range) {
    headers.set("Content-Length", String(range.end - range.start + 1));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${video.size}`);
    return new NextResponse(streamFile(video.filePath, range), {
      status: 206,
      headers,
    });
  }

  headers.set("Content-Length", String(video.size));
  return new NextResponse(streamFile(video.filePath), { status: 200, headers });
}
