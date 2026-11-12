import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { PhotoLabelColor, ProjectImageStatus } from "@prisma/client";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { canClientAccessProject } from "../../lib/workflowRules";

const visiblePhotoStatuses = new Set<ProjectImageStatus>(["CLIENT_REVIEW", "APPROVED"]);
const labelColors = new Set<string>(Object.values(PhotoLabelColor));

/** POST { photoId, color: "GREEN" | "AMBER" | "BLUE" | null } — sets or clears the client's colour label. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "CLIENT") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = session.user.id;
  const photoId = typeof req.body?.photoId === "string" ? req.body.photoId : "";
  const rawColor = req.body?.color;
  if (!photoId || (rawColor !== null && !labelColors.has(rawColor))) {
    return res.status(400).json({ error: "Choose a photo and a label." });
  }

  const photo = await prisma.projectImage.findUnique({
    where: { id: photoId },
    include: { project: { select: { clientId: true, status: true } } },
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

  if (rawColor === null) {
    await prisma.photoLabel.deleteMany({ where: { userId, photoId } });
    return res.status(200).json({ photoId, color: null });
  }

  const label = await prisma.photoLabel.upsert({
    where: { userId_photoId: { userId, photoId } },
    create: { userId, photoId, galleryId: photo.projectId, color: rawColor as PhotoLabelColor },
    update: { color: rawColor as PhotoLabelColor },
  });
  return res.status(200).json({ photoId, color: label.color });
}
