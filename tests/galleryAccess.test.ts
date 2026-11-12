import test from "node:test";
import assert from "node:assert/strict";

import {
  ACCESS_CODE_LENGTH,
  ACCESS_LOCK_MINUTES,
  MAX_ACCESS_ATTEMPTS,
  canOpenGalleryByLink,
  generateAccessCode,
  generateShareSlug,
  isAccessLocked,
  isValidAccessCodeFormat,
  isValidShareSlug,
  nextFailedAccessState,
  normalizeAccessCode,
} from "../lib/galleryAccess";

test("access codes are numeric and the configured length", () => {
  for (let i = 0; i < 50; i += 1) {
    const code = generateAccessCode();
    assert.equal(code.length, ACCESS_CODE_LENGTH);
    assert.ok(isValidAccessCodeFormat(code));
  }
});

test("share slugs are URL-safe and pass validation", () => {
  const slug = generateShareSlug();
  assert.match(slug, /^[a-z0-9]{10}$/);
  assert.ok(isValidShareSlug(slug));
  assert.equal(isValidShareSlug("../etc"), false);
  assert.equal(isValidShareSlug(undefined), false);
});

test("typed codes are normalised to digits only", () => {
  assert.equal(normalizeAccessCode(" 12-34 56 "), "123456");
  assert.equal(normalizeAccessCode(123456), "");
  assert.equal(isValidAccessCodeFormat("12345"), false);
});

test("the link locks after the maximum failed attempts", () => {
  const now = new Date("2026-11-12T10:00:00Z");
  let attempts = 0;
  for (let i = 1; i < MAX_ACCESS_ATTEMPTS; i += 1) {
    const state = nextFailedAccessState(attempts, now);
    assert.equal(state.lockedUntil, null);
    attempts = state.attempts;
  }
  const locked = nextFailedAccessState(attempts, now);
  assert.equal(locked.attempts, 0);
  assert.equal(locked.lockedUntil?.getTime(), now.getTime() + ACCESS_LOCK_MINUTES * 60_000);
  assert.ok(isAccessLocked(locked.lockedUntil, now));
  assert.equal(isAccessLocked(locked.lockedUntil, new Date(locked.lockedUntil!.getTime() + 1)), false);
});

test("draft galleries can't be opened by link", () => {
  assert.equal(canOpenGalleryByLink("DRAFT"), false);
  assert.equal(canOpenGalleryByLink("SHARED"), true);
});
