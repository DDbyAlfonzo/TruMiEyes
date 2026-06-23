import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3001";

class SessionClient {
  private cookies = new Map<string, string>();

  private updateCookies(response: Response) {
    const setCookies = response.headers.getSetCookie?.() || [];
    for (const cookie of setCookies) {
      const [pair] = cookie.split(";", 1);
      const [name, value] = pair.split("=", 2);
      if (name && value !== undefined) {
        this.cookies.set(name, value);
      }
    }
  }

  private cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  async request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    const cookie = this.cookieHeader();

    if (cookie) {
      headers.set("Cookie", cookie);
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      redirect: "manual",
    });

    this.updateCookies(response);
    return response;
  }

  async signIn(email: string, password: string) {
    const csrfResponse = await this.request("/api/auth/csrf");
    assertStatus(csrfResponse, 200, "fetch CSRF token");
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string };

    const body = new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${baseUrl}/login`,
      json: "true",
    });

    const signInResponse = await this.request("/api/auth/callback/credentials?json=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (![200, 302].includes(signInResponse.status)) {
      throw new Error(`sign in failed for ${email} with status ${signInResponse.status}`);
    }
  }

  async getSession() {
    const response = await this.request("/api/auth/session");
    assertStatus(response, 200, "fetch auth session");
    return response.json() as Promise<{ user?: { email?: string; role?: string; id?: string } }>;
  }
}

function assertStatus(response: Response, expected: number, action: string) {
  if (response.status !== expected) {
    throw new Error(`${action} failed: expected ${expected}, got ${response.status}`);
  }
}

function assertIncludes(haystack: string, needle: string, action: string) {
  if (!haystack.includes(needle)) {
    throw new Error(`${action} failed: response did not include "${needle}"`);
  }
}

async function main() {
  const project = await prisma.clientProject.findFirst({
    where: { title: "Smith Family Album" },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      layouts: true,
      images: { orderBy: { uploadedAt: "asc" } },
      selections: {
        include: {
          selectedImages: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Seed project not found");
  }

  const projectLayout = project.layouts[0];
  if (!projectLayout) {
    throw new Error("Seed project has no assigned layouts");
  }

  const selectedImageIds = project.images.slice(0, 2).map((image) => image.id);
  if (selectedImageIds.length < 2) {
    throw new Error("Seed project does not have enough images for the smoke test");
  }

  const originalProjectState = {
    status: project.status,
    requestMessage: project.requestMessage,
  };
  const originalSelection = project.selections[0]
    ? {
        id: project.selections[0].id,
        selectedLayoutId: project.selections[0].selectedLayoutId,
        notes: project.selections[0].notes,
        submittedAt: project.selections[0].submittedAt,
        approvalStatus: project.selections[0].approvalStatus,
        selectedImageIds: project.selections[0].selectedImages.map((item) => item.projectImageId),
      }
    : null;

  await prisma.clientProject.update({
    where: { id: project.id },
    data: {
      status: "SHARED",
      requestMessage: null,
    },
  });

  if (originalSelection) {
    await prisma.clientSelection.update({
      where: { id: originalSelection.id },
      data: {
        approvalStatus: "PENDING",
      },
    });
  }

  let createdSelectionId: string | null = null;

  try {
    const publicLogin = await fetch(`${baseUrl}/login`, { redirect: "manual" });
    assertStatus(publicLogin, 200, "load login page");
    assertIncludes(await publicLogin.text(), "Secure photo-book ordering.", "render login page");

    const protectedAdmin = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
    assertStatus(protectedAdmin, 307, "redirect anonymous admin access");

    const adminSession = new SessionClient();
    await adminSession.signIn("admin@trumieyes.com", "admin123");
    const adminAuth = await adminSession.getSession();
    if (adminAuth.user?.role !== "ADMIN") {
      throw new Error("Admin session was not established");
    }

    const adminDashboard = await adminSession.request("/admin");
    assertStatus(adminDashboard, 200, "load admin dashboard");
    assertIncludes(await adminDashboard.text(), "Admin dashboard", "render admin dashboard");

    const adminProjects = await adminSession.request("/api/admin/projects");
    assertStatus(adminProjects, 200, "list admin projects");
    const adminProjectList = await adminProjects.json() as Array<{ title: string }>;
    if (!adminProjectList.some((item) => item.title === project.title)) {
      throw new Error("Seed project missing from admin project list");
    }

    const clientSession = new SessionClient();
    await clientSession.signIn(project.client.email, "client123");
    const clientAuth = await clientSession.getSession();
    if (clientAuth.user?.role !== "CLIENT") {
      throw new Error("Client session was not established");
    }

    const clientDashboard = await clientSession.request("/client");
    assertStatus(clientDashboard, 200, "load client dashboard");
    assertIncludes(await clientDashboard.text(), project.title, "render client dashboard");

    const clientProject = await clientSession.request(`/projects/${project.id}`);
    assertStatus(clientProject, 200, "load client project");
    assertIncludes(await clientProject.text(), project.title, "render client project");

    const submitSelection = await clientSession.request("/api/selections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: project.id,
        selectedLayoutId: projectLayout.layoutId,
        notes: "Smoke test selection",
        selectedImageIds,
      }),
    });
    assertStatus(submitSelection, 200, "submit client selection");

    const savedSelection = await prisma.clientSelection.findFirst({
      where: {
        projectId: project.id,
        clientId: project.clientId,
      },
      include: { selectedImages: true },
    });

    if (!savedSelection) {
      throw new Error("Selection was not saved");
    }
    createdSelectionId = savedSelection.id;

    if (savedSelection.approvalStatus !== "SUBMITTED") {
      throw new Error(`Expected SUBMITTED selection, got ${savedSelection.approvalStatus}`);
    }
    if (savedSelection.selectedImages.length !== selectedImageIds.length) {
      throw new Error("Selected image count mismatch after submission");
    }

    const approveSelection = await adminSession.request("/api/admin/selection-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectionId: savedSelection.id,
        approvalStatus: "APPROVED",
        projectStatus: "APPROVED",
        requestMessage: null,
      }),
    });
    assertStatus(approveSelection, 200, "approve client selection");

    const approvedProject = await prisma.clientProject.findUnique({
      where: { id: project.id },
      include: {
        selections: true,
      },
    });

    const approvedSelection = approvedProject?.selections[0];
    if (!approvedProject || approvedProject.status !== "APPROVED") {
      throw new Error("Project was not marked APPROVED");
    }
    if (!approvedSelection || approvedSelection.approvalStatus !== "APPROVED") {
      throw new Error("Selection was not marked APPROVED");
    }

    const reviewPageAsAdmin = await adminSession.request(`/projects/${project.id}/review`);
    assertStatus(reviewPageAsAdmin, 200, "load admin review page");
    assertIncludes(await reviewPageAsAdmin.text(), project.title, "render admin review page");

    const reviewPageAsClient = await clientSession.request(`/projects/${project.id}/review`);
    assertStatus(reviewPageAsClient, 200, "load client review page");
    assertIncludes(await reviewPageAsClient.text(), project.title, "render client review page");

    console.log(`Smoke test passed against ${baseUrl}`);
  } finally {
    await prisma.clientProject.update({
      where: { id: project.id },
      data: originalProjectState,
    });

    if (!originalSelection && createdSelectionId) {
      await prisma.selectedImage.deleteMany({
        where: { selectionId: createdSelectionId },
      });
      await prisma.clientSelection.delete({
        where: { id: createdSelectionId },
      });
      return;
    }

    if (originalSelection) {
      await prisma.clientSelection.update({
        where: { id: originalSelection.id },
        data: {
          selectedLayoutId: originalSelection.selectedLayoutId,
          notes: originalSelection.notes,
          submittedAt: originalSelection.submittedAt,
          approvalStatus: originalSelection.approvalStatus,
        },
      });

      await prisma.selectedImage.deleteMany({
        where: { selectionId: originalSelection.id },
      });

      if (originalSelection.selectedImageIds.length > 0) {
        await prisma.selectedImage.createMany({
          data: originalSelection.selectedImageIds.map((projectImageId) => ({
            selectionId: originalSelection.id,
            projectImageId,
          })),
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
