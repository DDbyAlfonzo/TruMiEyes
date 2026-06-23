import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { ProjectImageStatus } from "@prisma/client";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { canClientAccessProject } from "../../lib/workflowRules";

const visiblePhotoStatuses = new Set<ProjectImageStatus>([
  "CLIENT_REVIEW",
  "APPROVED",
]);

async function getClientPhoto(photoId: string, userId: string) {
  const photo = await prisma.projectImage.findUnique({
    where: { id: photoId },
    include: { project: { select: { id: true, clientId: true, status: true } } },
  });

  if (
    !photo ||
    !visiblePhotoStatuses.has(photo.status) ||
    !canClientAccessProject({
      sessionUserId: userId,
      projectClientId: photo.project.clientId,
      projectStatus: photo.project.status,
    })
  ) {
    return null;
  }

  return photo;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "CLIENT") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = session.user.id as string;
  const photoId =
    typeof req.body.photoId === "string"
      ? req.body.photoId
      : typeof req.query.photoId === "string"
        ? req.query.photoId
        : "";

  if (!photoId) {
    return res.status(400).json({ error: "Missing photoId." });
  }

  const photo = await getClientPhoto(photoId, userId);
  if (!photo) {
    return res.status(403).json({ error: "Photo not available." });
  }

  if (req.method === "POST") {
    const favorite = await prisma.photoFavorite.upsert({
      where: { userId_photoId: { userId, photoId } },
      create: { userId, photoId, galleryId: photo.projectId },
      update: {},
    });
    return res.status(200).json(favorite);
  }

  if (req.method === "DELETE") {
    await prisma.photoFavorite.deleteMany({ where: { userId, photoId } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
