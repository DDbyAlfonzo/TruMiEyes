export type AppRole = "ADMIN" | "CLIENT";
export type AppProjectStatus = "DRAFT" | "SHARED" | "IN_REVIEW" | "APPROVED" | "COMPLETED";
export type AppApprovalStatus = "PENDING" | "SUBMITTED" | "APPROVED";

type RouteRedirectInput = {
  pathname: string;
  hasToken: boolean;
  role?: AppRole | null;
};

type ReviewAccessInput = {
  role: AppRole;
  sessionUserId: string;
  projectClientId: string;
};

type ClientProjectAccessInput = {
  sessionUserId: string;
  projectClientId: string;
  projectStatus: AppProjectStatus;
};

type SelectionValidationInput = {
  selectedLayoutId?: string | null;
  selectedImageIds: string[];
  allowedLayoutIds: Iterable<string>;
  allowedImageIds: Iterable<string>;
};

const adminPaths = ["/admin"];
const clientPaths = ["/client", "/projects"];
const projectReviewPath = /^\/projects\/[^/]+\/review\/?$/;

export function getRouteRedirect({ pathname, hasToken, role }: RouteRedirectInput) {
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/projects");
  const isAuthPage = pathname.startsWith("/login");

  if (!hasToken && isProtectedPath) {
    return "/login";
  }

  if (hasToken && isAuthPage) {
    return role === "ADMIN" ? "/admin" : "/client";
  }

  if (!hasToken || !role) {
    return null;
  }

  if (adminPaths.some((path) => pathname.startsWith(path)) && role !== "ADMIN") {
    return "/client";
  }

  if (clientPaths.some((path) => pathname.startsWith(path)) && role !== "CLIENT") {
    if (role === "ADMIN" && projectReviewPath.test(pathname)) {
      return null;
    }
    return "/admin";
  }

  return null;
}

export function canAccessProjectReview({
  role,
  sessionUserId,
  projectClientId,
}: ReviewAccessInput) {
  return role === "ADMIN" || (role === "CLIENT" && sessionUserId === projectClientId);
}

export function canClientAccessProject({
  sessionUserId,
  projectClientId,
  projectStatus,
}: ClientProjectAccessInput) {
  return projectStatus !== "DRAFT" && sessionUserId === projectClientId;
}

export function isSelectionLocked(
  approvalStatus: AppApprovalStatus | null | undefined,
  projectStatus: AppProjectStatus,
) {
  return approvalStatus === "APPROVED" || (
    approvalStatus === "SUBMITTED" && projectStatus !== "IN_REVIEW"
  );
}

export function validateSelectionChoices({
  selectedLayoutId,
  selectedImageIds,
  allowedLayoutIds,
  allowedImageIds,
}: SelectionValidationInput) {
  const layoutIds = new Set(allowedLayoutIds);
  const imageIds = new Set(allowedImageIds);

  if (selectedLayoutId && !layoutIds.has(selectedLayoutId)) {
    return "Invalid layout selection";
  }

  if (selectedImageIds.some((imageId) => !imageIds.has(imageId))) {
    return "Invalid image selection";
  }

  return null;
}
