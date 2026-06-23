import test from "node:test";
import assert from "node:assert/strict";

import {
  canAccessProjectReview,
  canClientAccessProject,
  getRouteRedirect,
  isSelectionLocked,
  validateSelectionChoices,
} from "../lib/workflowRules";

test("unauthenticated users are redirected to login on protected routes", () => {
  assert.equal(getRouteRedirect({
    pathname: "/projects/project-123",
    hasToken: false,
    role: null,
  }), "/login");
});

test("authenticated users are redirected away from login based on role", () => {
  assert.equal(getRouteRedirect({
    pathname: "/login",
    hasToken: true,
    role: "ADMIN",
  }), "/admin");

  assert.equal(getRouteRedirect({
    pathname: "/login",
    hasToken: true,
    role: "CLIENT",
  }), "/client");
});

test("admins can access project review but not the main client project page", () => {
  assert.equal(getRouteRedirect({
    pathname: "/projects/project-123/review",
    hasToken: true,
    role: "ADMIN",
  }), null);

  assert.equal(getRouteRedirect({
    pathname: "/projects/project-123",
    hasToken: true,
    role: "ADMIN",
  }), "/admin");
});

test("clients are redirected away from admin routes", () => {
  assert.equal(getRouteRedirect({
    pathname: "/admin/projects",
    hasToken: true,
    role: "CLIENT",
  }), "/client");
});

test("project review access is limited to admins or the owning client", () => {
  assert.equal(canAccessProjectReview({
    role: "ADMIN",
    sessionUserId: "admin-1",
    projectClientId: "client-1",
  }), true);

  assert.equal(canAccessProjectReview({
    role: "CLIENT",
    sessionUserId: "client-1",
    projectClientId: "client-1",
  }), true);

  assert.equal(canAccessProjectReview({
    role: "CLIENT",
    sessionUserId: "client-2",
    projectClientId: "client-1",
  }), false);
});

test("client project access requires ownership and a non-draft project", () => {
  assert.equal(canClientAccessProject({
    sessionUserId: "client-1",
    projectClientId: "client-1",
    projectStatus: "SHARED",
  }), true);

  assert.equal(canClientAccessProject({
    sessionUserId: "client-2",
    projectClientId: "client-1",
    projectStatus: "SHARED",
  }), false);

  assert.equal(canClientAccessProject({
    sessionUserId: "client-1",
    projectClientId: "client-1",
    projectStatus: "DRAFT",
  }), false);
});

test("selection lock rules match the reopened review workflow", () => {
  assert.equal(isSelectionLocked("APPROVED", "APPROVED"), true);
  assert.equal(isSelectionLocked("SUBMITTED", "SHARED"), true);
  assert.equal(isSelectionLocked("SUBMITTED", "IN_REVIEW"), false);
  assert.equal(isSelectionLocked("PENDING", "IN_REVIEW"), false);
  assert.equal(isSelectionLocked(undefined, "SHARED"), false);
});

test("selection validation rejects foreign layouts and images", () => {
  assert.equal(validateSelectionChoices({
    selectedLayoutId: "layout-1",
    selectedImageIds: ["image-1", "image-2"],
    allowedLayoutIds: ["layout-1", "layout-2"],
    allowedImageIds: ["image-1", "image-2", "image-3"],
  }), null);

  assert.equal(validateSelectionChoices({
    selectedLayoutId: "layout-9",
    selectedImageIds: ["image-1"],
    allowedLayoutIds: ["layout-1", "layout-2"],
    allowedImageIds: ["image-1", "image-2", "image-3"],
  }), "Invalid layout selection");

  assert.equal(validateSelectionChoices({
    selectedLayoutId: "layout-1",
    selectedImageIds: ["image-999"],
    allowedLayoutIds: ["layout-1", "layout-2"],
    allowedImageIds: ["image-1", "image-2", "image-3"],
  }), "Invalid image selection");
});
