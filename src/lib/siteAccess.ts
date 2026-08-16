import { timingSafeEqual } from "crypto";

/** Shared credentials for the public site gate. Overridable via environment. */
const DEFAULT_SITE_USERNAME = "HasselWG";
const DEFAULT_SITE_PASSWORD = "#RettetXoro";

export function getSiteUsername(): string {
  return process.env.SITE_USERNAME || DEFAULT_SITE_USERNAME;
}

function getSitePassword(): string {
  return process.env.SITE_PASSWORD || DEFAULT_SITE_PASSWORD;
}

/** Constant-time comparison so the check cannot be probed via timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** The username is compared case-insensitively, the password exactly. */
export function verifySiteCredentials(
  username: string,
  password: string
): boolean {
  const userOk = safeEqual(
    username.trim().toLowerCase(),
    getSiteUsername().toLowerCase()
  );
  const passOk = safeEqual(password, getSitePassword());
  return userOk && passOk;
}
