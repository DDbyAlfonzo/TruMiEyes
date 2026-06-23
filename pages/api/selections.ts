import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import {
  canClientAccessProject,
  isSelectionLocked,
  validateSelectionChoices,
} from "../../lib/workflowRules";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "CLIENT") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    const { projectId, selectedLayoutId, notes, selectedImageIds } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: "Missing projectId" });
    }

    const project = await prisma.clientProject.findUnique({
      where: { id: projectId },
      select: {
        clientId: true,
        status: true,
        layouts: { select: { layoutId: true } },
        images: { where: { status: { in: ["CLIENT_REVIEW", "APPROVED"] } }, select: { id: true } },
      },
    });
    if (
      !project ||
      !canClientAccessProject({
        sessionUserId: session.user.id,
        projectClientId: project.clientId,
        projectStatus: project.status,
      })
    ) {
      return res.status(403).json({ error: "Project not available" });
    }

    const existing = await prisma.clientSelection.findFirst({
      where: { projectId, clientId: session.user?.id as string },
      include: { selectedImages: true },
    });

    if (existing && isSelectionLocked(existing.approvalStatus, project.status)) {
      return res.status(403).json({ error: "Selection locked" });
    }

    const normalizedImageIds = Array.isArray(selectedImageIds) ? selectedImageIds : [];
    const validationError = validateSelectionChoices({
      selectedLayoutId,
      selectedImageIds: normalizedImageIds,
      allowedLayoutIds: project.layouts.map((item) => item.layoutId),
      allowedImageIds: project.images.map((image) => image.id),
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const selection = await prisma.$transaction(async (tx) => {
      const savedSelection = existing
        ? await tx.clientSelection.update({
            where: { id: existing.id },
            data: {
              selectedLayoutId,
              notes,
              submittedAt: new Date(),
              approvalStatus: "SUBMITTED",
            },
          })
        : await tx.clientSelection.create({
            data: {
              projectId,
              clientId: session.user?.id as string,
              selectedLayoutId,
              notes,
              submittedAt: new Date(),
              approvalStatus: "SUBMITTED",
            },
          });

      await tx.selectedImage.deleteMany({ where: { selectionId: savedSelection.id } });

      if (normalizedImageIds.length > 0) {
        await tx.selectedImage.createMany({
          data: normalizedImageIds.map((imageId: string) => ({
            selectionId: savedSelection.id,
            projectImageId: imageId,
          })),
        });
      }

      await tx.photoFavorite.deleteMany({
        where: { userId: session.user?.id as string, galleryId: projectId },
      });

      if (normalizedImageIds.length > 0) {
        await tx.photoFavorite.createMany({
          data: normalizedImageIds.map((imageId: string) => ({
            userId: session.user?.id as string,
            galleryId: projectId,
            photoId: imageId,
          })),
          skipDuplicates: true,
        });
      }

      return savedSelection;
    });

    return res.status(200).json(selection);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
