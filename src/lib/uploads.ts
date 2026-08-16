import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import type { ReadableStream as WebReadableStream } from "stream/web";
import {
  VIDEO_EXTENSION_BY_MIME,
  VIDEO_MIME_BY_EXTENSION,
  VIDEO_PUBLIC_BASE,
  isAllowedVideoMimeType,
  isManagedVideoPath,
} from "@/lib/video";
import type { AllowedVideoMimeType } from "@/lib/video";

/**
 * Uploads must not live in `public`: Next.js only serves files that were
 * present in that folder when the app was built, so anything written at
 * runtime would answer with 404. Videos are stored next to the database and
 * handed out by the `/uploads/videos/[file]` route instead.
 */
const VIDEO_STORAGE_DIR = path.join(
  process.cwd(),
  "data",
  "uploads",
  "videos"
);

/** Videos uploaded before the move are still read from their old location. */
const LEGACY_VIDEO_STORAGE_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "videos"
);

/** Error codes thrown by this module – routes translate them into messages. */
export type UploadErrorCode =
  | "EMPTY_FILE"
  | "INCOMPLETE_UPLOAD"
  | "INVALID_FILE_TYPE";

export class UploadError extends Error {
  constructor(public readonly code: UploadErrorCode) {
    super(code);
    this.name = "UploadError";
  }
}

function ensureStorageDir(): void {
  if (!fs.existsSync(VIDEO_STORAGE_DIR)) {
    fs.mkdirSync(VIDEO_STORAGE_DIR, { recursive: true });
  }
}

/**
 * Write a raw upload stream to disk and return its public path.
 *
 * The body is piped straight to the file system, so memory usage stays flat
 * regardless of the video size – uploads are intentionally not size capped.
 *
 * When the announced size is known the result is verified against it: a
 * truncated body must never be stored as if it were a complete video.
 */
export async function saveVideoStream(
  body: ReadableStream<Uint8Array>,
  mimeType: string,
  expectedBytes?: number
): Promise<string> {
  if (!isAllowedVideoMimeType(mimeType)) {
    throw new UploadError("INVALID_FILE_TYPE");
  }

  ensureStorageDir();

  const fileName = `${randomUUID()}${VIDEO_EXTENSION_BY_MIME[mimeType]}`;
  const target = path.join(VIDEO_STORAGE_DIR, fileName);

  let written = 0;
  const source = Readable.fromWeb(body as unknown as WebReadableStream<Uint8Array>);

  try {
    await pipeline(
      source,
      async function* count(chunks: AsyncIterable<Buffer>) {
        for await (const chunk of chunks) {
          written += chunk.length;
          yield chunk;
        }
      },
      fs.createWriteStream(target)
    );

    if (written === 0) {
      throw new UploadError("EMPTY_FILE");
    }
    if (
      typeof expectedBytes === "number" &&
      Number.isFinite(expectedBytes) &&
      expectedBytes > 0 &&
      written !== expectedBytes
    ) {
      console.error(
        `Upload incomplete: expected ${expectedBytes} bytes, wrote ${written}`
      );
      throw new UploadError("INCOMPLETE_UPLOAD");
    }
  } catch (error) {
    await fsp.rm(target, { force: true });
    throw error;
  }

  return `${VIDEO_PUBLIC_BASE}/${fileName}`;
}

/** Remove a previously uploaded video. Unknown or foreign paths are ignored. */
export async function deleteVideoFile(
  videoPath: string | null | undefined
): Promise<void> {
  if (!isManagedVideoPath(videoPath)) return;

  const fileName = path.basename(videoPath as string);
  await Promise.all([
    fsp.rm(path.join(VIDEO_STORAGE_DIR, fileName), { force: true }),
    fsp.rm(path.join(LEGACY_VIDEO_STORAGE_DIR, fileName), { force: true }),
  ]);
}

export interface ResolvedVideoFile {
  filePath: string;
  size: number;
  contentType: AllowedVideoMimeType;
  lastModified: Date;
}

/**
 * Locate an uploaded video by its file name. Only names produced by the
 * upload route are accepted, which rules out path traversal.
 */
export async function resolveVideoFile(
  fileName: string
): Promise<ResolvedVideoFile | null> {
  if (!isManagedVideoPath(`${VIDEO_PUBLIC_BASE}/${fileName}`)) return null;

  const contentType = VIDEO_MIME_BY_EXTENSION[path.extname(fileName)];
  if (!contentType) return null;

  for (const dir of [VIDEO_STORAGE_DIR, LEGACY_VIDEO_STORAGE_DIR]) {
    const filePath = path.join(dir, fileName);
    try {
      const stats = await fsp.stat(filePath);
      if (stats.isFile()) {
        return {
          filePath,
          size: stats.size,
          contentType,
          lastModified: stats.mtime,
        };
      }
    } catch {
      // Try the next location
    }
  }

  return null;
}
