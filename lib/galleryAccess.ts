import { randomInt } from "crypto";
import { ACCESS_CODE_LENGTH } from "./galleryAccessRules";

export * from "./galleryAccessRules";

const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Cryptographically random numeric code, e.g. "048213". */
export function generateAccessCode(length = ACCESS_CODE_LENGTH) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += String(randomInt(0, 10));
  }
  return code;
}

/** Short, unguessable, URL-safe slug for /g/[slug] links (no look-alike characters). */
export function generateShareSlug(length = 10) {
  let slug = "";
  for (let i = 0; i < length; i += 1) {
    slug += SLUG_ALPHABET[randomInt(0, SLUG_ALPHABET.length)];
  }
  return slug;
}

