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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "CLIENT") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = session.user.id as string;
  const photoId = typeof req.body.photoId === "string" ? req.body.photoId : "";
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!photoId || !message) {
    return res.status(400).json({ error: "Choose a photo and add a comment." });
  }

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
    return res.status(403).json({ error: "Photo not available." });
  }

  const comment = await prisma.photoComment.create({
    data: {
      userId,
      photoId,
      galleryId: photo.projectId,
      message,
    },
  });

  return res.status(201).json(comment);
}
