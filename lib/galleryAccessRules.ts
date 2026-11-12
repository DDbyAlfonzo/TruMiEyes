/** Pure gallery-access rules (safe to import in client components). */
/** Length of the numeric gallery access code clients type in. */
export const ACCESS_CODE_LENGTH = 6;
/** Failed attempts allowed before a gallery link is temporarily locked. */
export const MAX_ACCESS_ATTEMPTS = 5;
/** How long a gallery link stays locked after too many failed attempts. */
export const ACCESS_LOCK_MINUTES = 15;

export function normalizeAccessCode(input: unknown) {
  if (typeof input !== "string") return "";
  return input.replace(/\D/g, "").slice(0, ACCESS_CODE_LENGTH);
}

export function isValidAccessCodeFormat(code: string) {
  return new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`).test(code);
}

export function isValidShareSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9]{6,32}$/.test(slug);
}

export function isAccessLocked(lockedUntil: Date | null | undefined, now = new Date()) {
  return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
}

/**
 * Next lockout state after a failed attempt. Returns the new attempt count and,
 * once the limit is reached, when the lock expires (attempts reset to 0).
 */
export function nextFailedAccessState(currentAttempts: number, now = new Date()) {
  const attempts = currentAttempts + 1;
  if (attempts >= MAX_ACCESS_ATTEMPTS) {
    return {
      attempts: 0,
      lockedUntil: new Date(now.getTime() + ACCESS_LOCK_MINUTES * 60_000),
    };
  }
  return { attempts, lockedUntil: null };
}

/** Galleries are reachable by link only once shared with the client. */
export function canOpenGalleryByLink(status: string) {
  return status !== "DRAFT";
}
