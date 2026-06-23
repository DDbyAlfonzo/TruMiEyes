import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

const allowedStatuses = new Set(["HIDDEN", "CLIENT_REVIEW", "APPROVED"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const photoId = typeof req.body.photoId === "string" ? req.body.photoId : "";
  const status = typeof req.body.status === "string" ? req.body.status : "";
  const downloadable =
    typeof req.body.downloadable === "boolean" ? req.body.downloadable : undefined;

  if (!photoId || !allowedStatuses.has(status)) {
    return res.status(400).json({ error: "Choose an image and a valid status." });
  }

  const image = await prisma.projectImage.update({
    where: { id: photoId },
    data: {
      status,
      ...(downloadable !== undefined ? { downloadable } : {}),
    },
  });

  return res.status(200).json(image);
}
