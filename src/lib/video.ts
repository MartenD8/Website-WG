/**
 * Shared video constants – safe to import from client and server.
 * File system access lives in `@/lib/uploads` (server only).
 */

export const VIDEO_PUBLIC_BASE = "/uploads/videos";

export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;

export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];

export const VIDEO_EXTENSION_BY_MIME: Record<AllowedVideoMimeType, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

export const VIDEO_MIME_BY_EXTENSION: Record<string, AllowedVideoMimeType> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/** Only files written by the upload route are accepted as `videoPath`. */
export const VIDEO_PATH_PATTERN = /^\/uploads\/videos\/[A-Za-z0-9_-]+\.(?:mp4|webm)$/;

export function isAllowedVideoMimeType(
  value: string
): value is AllowedVideoMimeType {
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(value);
}

export function isManagedVideoPath(value: string | null | undefined): boolean {
  return typeof value === "string" && VIDEO_PATH_PATTERN.test(value);
}

/** Strips charset/boundary parts, e.g. "video/mp4; codecs=avc1" → "video/mp4". */
export function normalizeMimeType(value: string | null): string {
  return (value ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

export const VIDEO_ACCEPT_ATTRIBUTE = ALLOWED_VIDEO_MIME_TYPES.join(",");

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`;
}
